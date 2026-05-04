/**
 * newsApiService.ts
 * TunisiaIntel — Structured News API Ingestion Layer
 *
 * Sources:
 *   1. NewsAPI.org — requires VITE_NEWSAPI_KEY
 *   2. NewsData.io  — requires VITE_NEWSDATA_KEY (free tier: 200 req/day)
 *   3. GNews.io     — requires VITE_GNEWS_KEY (free tier: 100 req/day)
 *
 * All three support Tunisia-specific queries and are more reliable than RSS:
 *   - Structured JSON (no XML parsing)
 *   - Consistent metadata (title, description, url, publishedAt, source)
 *   - Higher dedup quality (canonical URLs)
 *
 * If no API key is configured, the service gracefully skips that provider
 * and logs a warning — the app continues to function with RSS + Telegram.
 */

import { supabase } from '../lib/supabase';
import { generateEventId } from '../utils/idUtils';
import { classifyArticle } from './rssService';
import { scoreGeoRelevance } from '../config/rssSources';
import { pipelineDebugger } from './debugService';

// ─── CONFIG ───────────────────────────────────────────────────────────────────

const NEWSAPI_KEY  = import.meta.env.VITE_NEWSAPI_KEY  || '';
const NEWSDATA_KEY = import.meta.env.VITE_NEWSDATA_KEY || '';
const GNEWS_KEY    = import.meta.env.VITE_GNEWS_KEY    || '';

// Search queries for each provider
const TUNISIA_QUERIES = {
  en: 'Tunisia OR Tunisian OR Tunis OR UGTT OR "Kais Saied"',
  fr: 'Tunisie OR tunisien OR "Kaïs Saïed" OR UGTT',
  ar: 'تونس OR تونسي OR سعيد',
};

// ─── METRICS ─────────────────────────────────────────────────────────────────

export const newsApiMetrics = {
  lastFetch: 0,
  newsapiCount: 0,
  newsdataCount: 0,
  gnewsCount: 0,
  droppedByGeo: 0,
  isFetching: false,
};

// ─── NORMALIZED ARTICLE TYPE ─────────────────────────────────────────────────

interface RawNewsItem {
  title: string;
  description: string;
  url: string;
  publishedAt: string;
  sourceName: string;
  sourceId: string;
  language: string;
  geo_weight: number;
}

// ─── PROVIDER 1: NEWSAPI.ORG ─────────────────────────────────────────────────

export async function fetchFromNewsAPI(): Promise<RawNewsItem[]> {
  if (!NEWSAPI_KEY) {
    pipelineDebugger.log('FEED', 'dropped', '[NEWSAPI] No key — set VITE_NEWSAPI_KEY to enable', {});
    return [];
  }

  const items: RawNewsItem[] = [];

  const queries = [
    { q: TUNISIA_QUERIES.en, language: 'en' },
    { q: TUNISIA_QUERIES.fr, language: 'fr' },
  ];

  for (const { q, language } of queries) {
    try {
      const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(q)}&language=${language}&sortBy=publishedAt&pageSize=30&apiKey=${NEWSAPI_KEY}`;
      const proxyUrl = `/api/proxy?url=${encodeURIComponent(url)}`;
      const res = await fetch(proxyUrl, { headers: { 'Cache-Control': 'no-cache' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();

      for (const article of json.articles || []) {
        if (!article.title || article.title === '[Removed]') continue;
        items.push({
          title: article.title,
          description: article.description || article.content || '',
          url: article.url,
          publishedAt: article.publishedAt,
          sourceName: article.source?.name || 'NewsAPI',
          sourceId: 'newsapi-' + language,
          language,
          geo_weight: 0.6, // Mixed — needs geo filter
        });
      }
    } catch (err: any) {
      pipelineDebugger.log('FEED', 'error', `[NEWSAPI] ${language} query failed: ${err.message}`, {});
    }
  }

  pipelineDebugger.log('FEED', 'valid', `[NEWSAPI] Fetched ${items.length} raw items`, { count: items.length });
  return items;
}

// ─── PROVIDER 2: NEWSDATA.IO ─────────────────────────────────────────────────

export async function fetchFromNewsData(): Promise<RawNewsItem[]> {
  if (!NEWSDATA_KEY) {
    pipelineDebugger.log('FEED', 'dropped', '[NEWSDATA] No key — set VITE_NEWSDATA_KEY to enable', {});
    return [];
  }

  const items: RawNewsItem[] = [];

  const queries = [
    { q: 'Tunisia', language: 'en', country: 'tn' },
    { q: 'Tunisie', language: 'fr', country: 'tn' },
    { q: 'تونس',    language: 'ar', country: 'tn' },
  ];

  for (const { q, language, country } of queries) {
    try {
      const url = `https://newsdata.io/api/1/news?apikey=${NEWSDATA_KEY}&q=${encodeURIComponent(q)}&language=${language}&country=${country}`;
      const proxyUrl = `/api/proxy?url=${encodeURIComponent(url)}`;
      const res = await fetch(proxyUrl, { headers: { 'Cache-Control': 'no-cache' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();

      for (const article of json.results || []) {
        if (!article.title) continue;
        items.push({
          title: article.title,
          description: article.description || article.content || '',
          url: article.link,
          publishedAt: article.pubDate,
          sourceName: article.source_id || 'NewsData',
          sourceId: 'newsdata-' + language,
          language,
          geo_weight: 0.9, // Country=TN filter makes this highly relevant
        });
      }
    } catch (err: any) {
      pipelineDebugger.log('FEED', 'error', `[NEWSDATA] ${language} query failed: ${err.message}`, {});
    }
  }

  pipelineDebugger.log('FEED', 'valid', `[NEWSDATA] Fetched ${items.length} raw items`, { count: items.length });
  return items;
}

// ─── PROVIDER 3: GNEWS.IO ────────────────────────────────────────────────────

export async function fetchFromGNews(): Promise<RawNewsItem[]> {
  if (!GNEWS_KEY) {
    pipelineDebugger.log('FEED', 'dropped', '[GNEWS] No key — set VITE_GNEWS_KEY to enable', {});
    return [];
  }

  const items: RawNewsItem[] = [];

  const queries = [
    { q: 'Tunisia', language: 'en' },
    { q: 'Tunisie', language: 'fr' },
  ];

  for (const { q, language } of queries) {
    try {
      const url = `https://gnews.io/api/v4/search?q=${encodeURIComponent(q)}&lang=${language}&country=tn&max=20&apikey=${GNEWS_KEY}`;
      const proxyUrl = `/api/proxy?url=${encodeURIComponent(url)}`;
      const res = await fetch(proxyUrl, { headers: { 'Cache-Control': 'no-cache' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();

      for (const article of json.articles || []) {
        if (!article.title) continue;
        items.push({
          title: article.title,
          description: article.description || '',
          url: article.url,
          publishedAt: article.publishedAt,
          sourceName: article.source?.name || 'GNews',
          sourceId: 'gnews-' + language,
          language,
          geo_weight: 0.85,
        });
      }
    } catch (err: any) {
      pipelineDebugger.log('FEED', 'error', `[GNEWS] ${language} query failed: ${err.message}`, {});
    }
  }

  pipelineDebugger.log('FEED', 'valid', `[GNEWS] Fetched ${items.length} raw items`, { count: items.length });
  return items;
}

// ─── PROCESS + GEO FILTER + WRITE ─────────────────────────────────────────────

async function processAndWrite(items: RawNewsItem[]): Promise<number> {
  if (items.length === 0) return 0;

  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const articles: any[] = [];

  for (const item of items) {
    // Date check
    const d = new Date(item.publishedAt);
    if (isNaN(d.getTime()) || d.getTime() < thirtyDaysAgo) continue;

    // Clean content
    const cleanContent = (item.description || '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 500);

    // ── GEO-RELEVANCE FILTER ─────────────────────────────────────────────
    const geo = scoreGeoRelevance(
      item.title,
      cleanContent,
      item.url,
      item.geo_weight,
    );

    if (!geo.isRelevant) {
      newsApiMetrics.droppedByGeo++;
      pipelineDebugger.log('FEED', 'dropped',
        `[API GEO-FILTER] score=${geo.score}: ${item.title.slice(0, 55)}`,
        { source: item.sourceId, score: geo.score });
      continue;
    }
    // ─────────────────────────────────────────────────────────────────────

    const classification = classifyArticle(item.title, cleanContent, 'NEUTRAL');
    const deterministicId = generateEventId({ title: item.title, source: item.sourceId });
    if (!deterministicId) continue;

    articles.push({
      id: deterministicId,
      fingerprint: deterministicId,
      source_id: item.sourceId,
      source_name: item.sourceName,
      title: item.title,
      url: item.url,
      published_at: d.toISOString(),
      content: cleanContent,
      summary: cleanContent.slice(0, 200),
      language: item.language,
      category: classification.category,
      severity: classification.severity,
      governorate: classification.governorate || undefined,
      keywords: classification.keywords,
      bias_alignment: 'NEUTRAL',
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
    else pipelineDebugger.log('PIPELINE', 'error',
      `[NEWSAPI] Supabase insert error: ${error.message}`, {});
  }

  return written;
}

// ─── MAIN EXPORT ─────────────────────────────────────────────────────────────

export interface NewsApiIngestionResult {
  newArticles: number;
  droppedByGeo: number;
  providers: { newsapi: number; newsdata: number; gnews: number };
  errors: string[];
}

export async function fetchAllNewsAPIs(
  options?: { force?: boolean },
): Promise<NewsApiIngestionResult> {
  if (newsApiMetrics.isFetching && !options?.force) {
    return { newArticles: 0, droppedByGeo: 0, providers: { newsapi: 0, newsdata: 0, gnews: 0 }, errors: [] };
  }

  newsApiMetrics.isFetching = true;
  newsApiMetrics.droppedByGeo = 0;

  pipelineDebugger.log('FEED', 'valid', '[NEWS-API] Starting multi-provider ingestion', {
    providers: {
      newsapi: !!NEWSAPI_KEY,
      newsdata: !!NEWSDATA_KEY,
      gnews: !!GNEWS_KEY,
    },
  });

  // Fetch all providers concurrently
  const [newsapiItems, newsdataItems, gnewsItems] = await Promise.all([
    fetchFromNewsAPI(),
    fetchFromNewsData(),
    fetchFromGNews(),
  ]);

  // Combine and dedup by URL before writing
  const seen = new Set<string>();
  const combined: RawNewsItem[] = [];
  for (const item of [...newsapiItems, ...newsdataItems, ...gnewsItems]) {
    const key = item.url?.split('?')[0] || item.title;
    if (!seen.has(key)) {
      seen.add(key);
      combined.push(item);
    }
  }

  pipelineDebugger.log('NEWS', 'valid',
    `[NEWS-API] ${combined.length} unique items from ${newsapiItems.length}+${newsdataItems.length}+${gnewsItems.length} raw`,
    { combined: combined.length });

  const written = await processAndWrite(combined);

  newsApiMetrics.lastFetch = Date.now();
  newsApiMetrics.newsapiCount = newsapiItems.length;
  newsApiMetrics.newsdataCount = newsdataItems.length;
  newsApiMetrics.gnewsCount = gnewsItems.length;
  newsApiMetrics.isFetching = false;

  pipelineDebugger.log('PIPELINE', 'valid',
    `[NEWS-API] Complete — ${written} new articles, ${newsApiMetrics.droppedByGeo} geo-dropped`,
    { written, droppedByGeo: newsApiMetrics.droppedByGeo });

  return {
    newArticles: written,
    droppedByGeo: newsApiMetrics.droppedByGeo,
    providers: {
      newsapi: newsapiItems.length,
      newsdata: newsdataItems.length,
      gnews: gnewsItems.length,
    },
    errors: [],
  };
}
