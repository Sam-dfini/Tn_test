/**
 * telegramService.ts
 * TunisiaIntel — Telegram Channel Ingestion Layer
 *
 * Uses RSS bridges to ingest Tunisian political/news Telegram channels
 * without requiring MTProto or bot tokens.
 *
 * Bridges used:
 *   - https://tg.i-c-a.ru/rss/{channel}   (public channel RSS)
 *   - https://t.me/s/{channel}             (fallback HTML scrape via proxy)
 *   - https://rsshub.app/telegram/channel/{channel}  (RSSHub bridge)
 *
 * All articles pass through the same geo-relevance filter as RSS feeds
 * before being written to Supabase.
 */

import { supabase } from '../lib/supabase';
import { generateEventId } from '../utils/eventUtils';
import { classifyArticle } from './rssService';
import { scoreGeoRelevance } from '../config/rssSources';
import { pipelineDebugger } from './debugService';

// ─── CHANNEL DEFINITIONS ─────────────────────────────────────────────────────

export interface TelegramChannel {
  id: string;
  name: string;
  handle: string;           // e.g. 'mosaiquefm'
  language: 'ar' | 'fr' | 'en';
  category: 'news' | 'politics' | 'economy' | 'security' | 'social';
  alignment: 'CRITICAL' | 'NEUTRAL' | 'PRO_GOV';
  reliability: 'A' | 'B' | 'C';
  geo_weight: number;
  bridge: 'ica' | 'rsshub' | 'html';
}

export const TELEGRAM_CHANNELS: TelegramChannel[] = [
  // ── News Outlets ──────────────────────────────────────────────────────────
  {
    id: 'tg-mosaique',
    name: 'Mosaïque FM',
    handle: 'mosaiquefmofficiel',
    language: 'ar',
    category: 'news',
    alignment: 'NEUTRAL',
    reliability: 'A',
    geo_weight: 1.0,
    bridge: 'ica',
  },
  {
    id: 'tg-businessnews',
    name: 'Business News TN',
    handle: 'businessnewstunisie',
    language: 'fr',
    category: 'economy',
    alignment: 'NEUTRAL',
    reliability: 'A',
    geo_weight: 1.0,
    bridge: 'ica',
  },
  {
    id: 'tg-inkyfada',
    name: 'Inkyfada',
    handle: 'inkyfada',
    language: 'fr',
    category: 'politics',
    alignment: 'CRITICAL',
    reliability: 'A',
    geo_weight: 1.0,
    bridge: 'rsshub',
  },
  {
    id: 'tg-nawaat',
    name: 'Nawaat',
    handle: 'nawaat',
    language: 'ar',
    category: 'politics',
    alignment: 'CRITICAL',
    reliability: 'A',
    geo_weight: 1.0,
    bridge: 'ica',
  },
  {
    id: 'tg-leaders',
    name: 'Leaders Tunisie',
    handle: 'leaderstunisie',
    language: 'fr',
    category: 'economy',
    alignment: 'PRO_GOV',
    reliability: 'B',
    geo_weight: 1.0,
    bridge: 'ica',
  },
  // ── Political Channels ─────────────────────────────────────────────────────
  {
    id: 'tg-tap',
    name: 'TAP Wire',
    handle: 'agencetaptn',
    language: 'ar',
    category: 'politics',
    alignment: 'PRO_GOV',
    reliability: 'A',
    geo_weight: 1.0,
    bridge: 'ica',
  },
  {
    id: 'tg-kapitalis',
    name: 'Kapitalis',
    handle: 'kapitalismag',
    language: 'fr',
    category: 'news',
    alignment: 'NEUTRAL',
    reliability: 'B',
    geo_weight: 1.0,
    bridge: 'ica',
  },
  // ── Economy & Markets ──────────────────────────────────────────────────────
  {
    id: 'tg-leconomiste',
    name: "L'Économiste Maghrébin",
    handle: 'leconomistemaghrebin',
    language: 'fr',
    category: 'economy',
    alignment: 'NEUTRAL',
    reliability: 'B',
    geo_weight: 0.8,
    bridge: 'rsshub',
  },
  // ── Security / Social ─────────────────────────────────────────────────────
  {
    id: 'tg-realites',
    name: 'Réalités Online',
    handle: 'realitestunisie',
    language: 'fr',
    category: 'news',
    alignment: 'NEUTRAL',
    reliability: 'B',
    geo_weight: 1.0,
    bridge: 'ica',
  },
];

// ─── BRIDGE URL BUILDERS ─────────────────────────────────────────────────────

function buildBridgeUrl(channel: TelegramChannel): string {
  switch (channel.bridge) {
    case 'ica':
      return `https://tg.i-c-a.ru/rss/${channel.handle}`;
    case 'rsshub':
      return `https://rsshub.app/telegram/channel/${channel.handle}`;
    case 'html':
      // Last resort: scrape t.me/s/{handle} via our proxy
      return `https://t.me/s/${channel.handle}`;
    default:
      return `https://tg.i-c-a.ru/rss/${channel.handle}`;
  }
}

// ─── METRICS ─────────────────────────────────────────────────────────────────

export const telegramMetrics = {
  lastFetch: 0,
  successCount: 0,
  failureCount: 0,
  droppedByGeo: 0,
  isFetching: false,
};

// ─── FETCH SINGLE CHANNEL ────────────────────────────────────────────────────

async function fetchTelegramChannel(
  channel: TelegramChannel,
  retries = 2,
): Promise<any[]> {
  const bridgeUrl = buildBridgeUrl(channel);
  const proxyUrl = `/api/rss?url=${encodeURIComponent(bridgeUrl)}`;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 18000);

    try {
      const res = await fetch(proxyUrl, {
        signal: controller.signal,
        headers: { 'Cache-Control': 'no-cache', Accept: 'application/xml, text/xml' },
      });
      clearTimeout(timeout);

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const xml = await res.text();
      if (!xml || xml.trim().length < 100) throw new Error('Empty response');

      return parseTelegramRSS(xml, channel);
    } catch (err: any) {
      clearTimeout(timeout);
      if (attempt < retries) {
        await new Promise(r => setTimeout(r, 1500 * (attempt + 1)));
        continue;
      }
      pipelineDebugger.log(
        'FEED', 'error',
        `[TG] Failed ${channel.name} after ${retries + 1} attempts: ${err.message}`,
        { channel: channel.id },
      );
      return [];
    }
  }
  return [];
}

// ─── PARSE TELEGRAM RSS ───────────────────────────────────────────────────────

function parseTelegramRSS(xml: string, channel: TelegramChannel): any[] {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, 'text/xml');
    const items = Array.from(
      doc.querySelectorAll('item, entry'),
    );

    const articles: any[] = [];
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

    for (const item of items) {
      const title =
        item.querySelector('title')?.textContent?.trim() || '';
      const link =
        item.querySelector('link')?.textContent?.trim() ||
        item.querySelector('link')?.getAttribute('href') || '';
      const pubDateRaw =
        item.querySelector('pubDate')?.textContent?.trim() ||
        item.querySelector('published')?.textContent?.trim() ||
        item.querySelector('updated')?.textContent?.trim() || '';
      const description =
        item.querySelector('description')?.textContent?.trim() ||
        item.querySelector('summary')?.textContent?.trim() ||
        item.querySelector('content')?.textContent?.trim() || '';

      if (!title && !description) continue;

      // Parse date
      let publishedAt = new Date().toISOString();
      if (pubDateRaw) {
        const d = new Date(pubDateRaw);
        if (!isNaN(d.getTime())) {
          if (d.getTime() < thirtyDaysAgo) continue; // Skip old items
          publishedAt = d.toISOString();
        }
      }

      // Clean HTML from description
      const cleanContent = description
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 500);

      const textForGeo = `${title} ${cleanContent}`;

      // ── GEO-RELEVANCE FILTER ────────────────────────────────────────────
      const geo = scoreGeoRelevance(
        title,
        cleanContent,
        `https://t.me/${channel.handle}`,
        channel.geo_weight,
      );

      if (!geo.isRelevant) {
        telegramMetrics.droppedByGeo++;
        pipelineDebugger.log(
          'FEED', 'dropped',
          `[TG GEO-FILTER] score=${geo.score}: ${title.slice(0, 55)}`,
          { channel: channel.name, score: geo.score },
        );
        continue;
      }
      // ────────────────────────────────────────────────────────────────────

      const classification = classifyArticle(title, cleanContent, channel.alignment);
      const deterministicId = generateEventId({
        title,
        source: `telegram-${channel.handle}`,
      });

      if (!deterministicId) continue;

      articles.push({
        id: deterministicId,
        fingerprint: deterministicId,
        source_id: channel.id,
        source_name: `${channel.name} (Telegram)`,
        title: title || cleanContent.slice(0, 100),
        url: link || `https://t.me/${channel.handle}`,
        published_at: publishedAt,
        content: cleanContent,
        summary: cleanContent.slice(0, 200),
        language: channel.language,
        category: classification.category,
        severity: classification.severity,
        governorate: classification.governorate || undefined,
        keywords: classification.keywords,
        bias_alignment: classification.bias_alignment,
        bias_tone: classification.bias_tone,
        propaganda_score: classification.propaganda_score,
        techniques_detected: classification.techniques_detected,
        rri_nudge: classification.rri_nudge,
        rri_variable: classification.rri_variable,
        geo_relevance_score: geo.score,
        confirm_count: 0,
        dispute_count: 0,
        context_count: 0,
        processed: false,
        pipeline_pushed: false,
      });
    }

    return articles;
  } catch (err) {
    console.error(`[TG] RSS parse error for ${channel.name}:`, err);
    return [];
  }
}

// ─── WRITE TO SUPABASE ────────────────────────────────────────────────────────

async function writeTelegramArticles(articles: any[]): Promise<number> {
  if (articles.length === 0) return 0;

  // Dedup check
  const ids = articles.map(a => a.id);
  const { data: existing } = await supabase
    .from('articles')
    .select('id')
    .in('id', ids);

  const existingIds = new Set((existing || []).map((r: any) => r.id));
  const newArticles = articles.filter(a => !existingIds.has(a.id));

  if (newArticles.length === 0) return 0;

  // Write in batches of 20
  let written = 0;
  const BATCH = 20;
  for (let i = 0; i < newArticles.length; i += BATCH) {
    const batch = newArticles.slice(i, i + BATCH);
    const { error } = await supabase.from('articles').insert(batch);
    if (!error) written += batch.length;
    else {
      pipelineDebugger.log('PIPELINE', 'error',
        `[TG] Supabase insert error: ${error.message}`,
        { batch: batch.length });
    }
  }

  return written;
}

// ─── MAIN EXPORT ─────────────────────────────────────────────────────────────

export interface TelegramIngestionResult {
  newArticles: number;
  channelsProcessed: number;
  droppedByGeo: number;
  errors: string[];
}

export async function fetchAllTelegramChannels(
  options?: { force?: boolean },
): Promise<TelegramIngestionResult> {
  if (telegramMetrics.isFetching && !options?.force) {
    return { newArticles: 0, channelsProcessed: 0, droppedByGeo: 0, errors: [] };
  }

  telegramMetrics.isFetching = true;
  telegramMetrics.droppedByGeo = 0;
  const errors: string[] = [];
  let totalNew = 0;
  let processed = 0;

  pipelineDebugger.log('FEED', 'valid',
    `[TG] Starting ingestion — ${TELEGRAM_CHANNELS.length} channels`,
    { channels: TELEGRAM_CHANNELS.map(c => c.handle) });

  // Fetch all channels concurrently (with concurrency cap of 4)
  const CONCURRENCY = 4;
  for (let i = 0; i < TELEGRAM_CHANNELS.length; i += CONCURRENCY) {
    const batch = TELEGRAM_CHANNELS.slice(i, i + CONCURRENCY);
    const results = await Promise.allSettled(
      batch.map(ch => fetchTelegramChannel(ch)),
    );

    for (let j = 0; j < results.length; j++) {
      const result = results[j];
      const channel = batch[j];
      if (result.status === 'fulfilled') {
        const articles = result.value;
        pipelineDebugger.log('NEWS', 'valid',
          `[TG] ${channel.name}: ${articles.length} relevant articles`,
          { channel: channel.id });
        const written = await writeTelegramArticles(articles);
        totalNew += written;
        processed++;
        telegramMetrics.successCount += written;
      } else {
        errors.push(`${channel.name}: ${result.reason?.message || 'Unknown'}`);
        telegramMetrics.failureCount++;
      }
    }
  }

  telegramMetrics.lastFetch = Date.now();
  telegramMetrics.isFetching = false;

  pipelineDebugger.log('PIPELINE', 'valid',
    `[TG] Ingestion complete — ${totalNew} new, ${telegramMetrics.droppedByGeo} geo-dropped`,
    { totalNew, droppedByGeo: telegramMetrics.droppedByGeo, errors: errors.length });

  return {
    newArticles: totalNew,
    channelsProcessed: processed,
    droppedByGeo: telegramMetrics.droppedByGeo,
    errors,
  };
}
