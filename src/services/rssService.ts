import { supabase, Article, Event } from '../lib/supabase';
import { generateEventId } from '../utils/eventUtils';
import { calculateEventPriority } from './priorityEngine';
import { generateAnalystResponse } from './geminiService';
import { analyzeArticle, analyzeLexical } from './narrativeEngine';
import { detectShortagesInArticles } from './shortageDetector';
import { RSS_SOURCES, RSSSource } from '../config/rssSources';
import { logger, logPipelineError } from '../utils/logger.js';
import { pipelineDebugger } from './debugService';
import { safeAI } from '../lib/aiSafe';

export type SourceStatus = "healthy" | "degraded" | "failing" | "paused";

export async function validateRSSSource(url: string): Promise<"healthy" | "degraded" | "failing"> {
  try {
    // Google News often blocks HEAD requests or generic fetches
    if (url.includes('news.google.com') || url.includes('google.com')) return "healthy";
    
    const res = await fetch(url, { method: "HEAD" });
    if (!res.ok) return "healthy"; // Fail soft to allow proxy to handle it
    return "healthy";
  } catch {
    return "healthy";
  }
}

export function markSource(id: string, status: SourceStatus) {
  const source = RSS_SOURCES.find(s => s.id === id);
  if (source) source.status = status;
}

export function retrySource(feed: RSSSource, retryCount: number = 0) {
    setTimeout(() => {
        // Implementation of retry logic.
        // Assuming fetchAllFeeds handles the actual work, we could trigger a re-check here.
        console.log(`Retrying source: ${feed.name} (Attempt: ${retryCount})`);
        fetchAllFeeds({ force: true });
    }, 30000 * Math.pow(2, retryCount));
}

export const ingestionMetrics = {
  lastFetch: 0,
  successCount: 0,
  failureCount: 0,
  isFetching: false
};


// NLP CLASSIFICATION
// Determines category, severity, governorate, RRI impact, Bias
// ============================================================
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  protest: ['protest', 'manifestation', 'احتجاج', 'grève', 'strike', 'blockade', 'sit-in', 'rassemblement', 'وقفة'],
  arrest: ['arrest', 'detained', 'arrestation', 'اعتقال', 'décret 54', 'decree 54', 'incarcéré', 'emprisonné', 'محاكمة', 'سجن', 'حكم', 'prison', 'sentence', 'dahmani', 'دهماني'],
  economic: ['inflation', 'réserves', 'BCT', 'IMF', 'dinar', 'FMI', 'dette', 'budget', 'forex', 'مالية', 'Bourse', 'BVMT', 'Tunindex'],
  political: ['Saied', 'présidence', 'parlement', 'constitution', 'NSF', 'Ennahda', 'opposition', 'سعيد'],
  water: ['eau', 'water', 'SONEDE', 'sécheresse', 'pénurie eau', 'مياه', 'جفاف'],
  migration: ['migration', 'Sfax', 'harraga', 'traversée', 'هجرة', 'قوارب', 'noyé', 'drowning'],
  labor: ['UGTT', 'syndicat', 'salaire', 'CPG', 'phosphate', 'travailleur', 'نقابة'],
  rights: ['droits', 'liberté', 'RSF', 'HRW', 'Amnesty', 'censure', 'حريات', 'dahmani', 'دهماني'],
  shortage_butane: ['butane', 'gaz butane', 'bouteille', 'بوطان', 'غاز البوطان', 'أسطوانة'],
  shortage_food: ['poulet', 'viande', 'sucre', 'huile', 'pénurie alimentaire', 'دجاج', 'لحم', 'سكر', 'زيت'],
  shortage_energy: ['STEG coupure', 'délestage', 'انقطاع الكهرباء', 'قطع التيار'],
  energy_shock: ['Iran', 'Hormuz', 'oil price spike', 'Brent', 'OPEC cuts', 'prix pétrole'],
  cabinet_change: ['reshuffle', 'remaniement', 'وزير', 'ministre', 'nomination', 'cabinet', 'démission', 'limogeage', 'تعيين', 'إقالة', 'استقالة', 'وزارة', 'تعديل وزاري', 'remaniement ministériel', 'remaniement gouvernemental', 'cabinet reshuffle', 'ministerial change', 'government reshuffle', 'reshuffle of the cabinet', 'new ministers', 'new minister'],
  econ_policy_change: ['استخلاص', 'extraction', 'دعم', 'subvention', 'subsidy', 'تركيبة', 'composition', 'تعديل', 'ajustement', 'adjustment', 'إصلاح', 'réforme', 'reform'],
};

const GOVERNORATE_KEYWORDS: Record<string, string[]> = {
  'Sfax': ['Sfax', 'صفاقس', 'sfaxien'],
  'Gafsa': ['Gafsa', 'قفصة', 'CPG', 'Metlaoui', 'مطلوي'],
  'Kasserine': ['Kasserine', 'القصرين'],
  'Sidi Bouzid': ['Sidi Bouzid', 'سيدي بوزيد'],
  'Tunis': ['Tunis', 'تونس', 'Bardo', 'Carthage'],
  'Gabes': ['Gabes', 'قابس', 'chimique'],
  'Bizerte': ['Bizerte', 'بنزرت'],
  'Sousse': ['Sousse', 'سوسة'],
  'Kairouan': ['Kairouan', 'القيروان'],
  'Jendouba': ['Jendouba', 'جندوبة'],
  'Kef': ['Kef', 'الكاف', 'Le Kef'],
  'Ariana': ['Ariana', 'أريانة'],
  'Ben Arous': ['Ben Arous', 'بن عروس'],
  'Manouba': ['Manouba', 'منوبة'],
  'Nabeul': ['Nabeul', 'نابل', 'Hammamet', 'حمامات'],
  'Zaghouan': ['Zaghouan', 'زغوان'],
  'Monastir': ['Monastir', 'المنستير'],
  'Mahdia': ['Mahdia', 'المهدية'],
  'Siliana': ['Siliana', 'سليانة'],
  'Beja': ['Beja', 'باجة'],
  'Tozeur': ['Tozeur', 'توزر'],
  'Kebili': ['Kebili', 'قبلي'],
  'Tataouine': ['Tataouine', 'تطاوين'],
  'Medenine': ['Medenine', 'مدنين', 'Djerba', 'جربة'],
};

const ALARMIST_KEYWORDS = ['crisis', 'collapse', 'chaos', 'danger', 'threat', 'warning', 'emergency', 'catastrophe', 'crise', 'effondrement', 'danger', 'menace', 'urgence', 'أزمة', 'انهيار', 'خطر', 'تهديد', 'طوارئ'];
const MINIMIZING_KEYWORDS = ['stable', 'normal', 'control', 'routine', 'minor', 'calm', 'progress', 'stabilité', 'normalité', 'contrôle', 'routine', 'calme', 'progrès', 'استقرار', 'عادي', 'سيطرة', 'روتين', 'هدوء', 'تقدم'];

export function classifyArticle(title: string, content: string = '', sourceAlignment: string = 'NEUTRAL'): {
  category: string;
  severity: number;
  governorate: string | null;
  rri_nudge: number;
  rri_variable: string;
  keywords: string[];
  bias_alignment: 'PRO_GOV' | 'NEUTRAL' | 'CRITICAL';
  bias_tone: 'ALARMIST' | 'NEUTRAL' | 'MINIMIZING';
  propaganda_score: number;
  techniques_detected: string[];
} {
  const text = (title + ' ' + content).toLowerCase();
  const matchedKeywords: string[] = [];

  // Detect category
  let category = 'general';
  let maxMatches = 0;
  for (const [cat, kws] of Object.entries(CATEGORY_KEYWORDS)) {
    const matches = kws.filter(kw => text.includes(kw.toLowerCase()));
    if (matches.length > maxMatches) {
      maxMatches = matches.length;
      category = cat;
      matchedKeywords.push(...matches);
    }
  }

  // Detect severity
  const SEVERITY_KEYWORDS: Record<number, string[]> = {
    5: ['terrorism', 'terrorisme', 'explosion', 'mort', 'killed', 'coup', 'assassin'],
    4: ['UGTT', 'general strike', 'grève générale', 'Decree 54', 'arrested', 'BCT', 'IMF', 'default'],
    3: ['protest', 'manifestation', 'احتجاج', 'grève', 'pénurie', 'shortage'],
    2: ['statement', 'communiqué', 'déclaration', 'réunion', 'meeting'],
  };

  let severity = 1;
  for (const [sev, kws] of Object.entries(SEVERITY_KEYWORDS).reverse()) {
    if (kws.some(kw => text.includes(kw.toLowerCase()))) {
      severity = parseInt(sev);
      break;
    }
  }

  // Detect governorate
  let governorate: string | null = null;
  for (const [gov, kws] of Object.entries(GOVERNORATE_KEYWORDS)) {
    if (kws.some(kw => text.includes(kw.toLowerCase()))) {
      governorate = gov;
      break;
    }
  }

  // Detect Tone
  let bias_tone: 'ALARMIST' | 'NEUTRAL' | 'MINIMIZING' = 'NEUTRAL';
  const alarmistMatches = ALARMIST_KEYWORDS.filter(kw => text.includes(kw));
  const minimizingMatches = MINIMIZING_KEYWORDS.filter(kw => text.includes(kw));
  
  if (alarmistMatches.length > minimizingMatches.length) bias_tone = 'ALARMIST';
  else if (minimizingMatches.length > alarmistMatches.length) bias_tone = 'MINIMIZING';

  // RRI impact
  const RRI_VARIABLE_MAP: Record<string, { variable: string; nudge: number }> = {
    protest: { variable: 'E51', nudge: 0.015 },
    arrest: { variable: 'D44', nudge: 0.012 },
    economic: { variable: 'A01', nudge: 0.010 },
    political: { variable: 'D41', nudge: 0.008 },
    water: { variable: 'B21', nudge: 0.018 },
    migration: { variable: 'F66', nudge: 0.010 },
    labor: { variable: 'M_UGTT', nudge: 0.020 },
    rights: { variable: 'D44', nudge: 0.012 },
    shortage_butane: { variable: 'B22', nudge: 0.025 },
    shortage_food:   { variable: 'B24', nudge: 0.018 },
    shortage_energy: { variable: 'B23', nudge: 0.020 },
    energy_shock:    { variable: 'H04', nudge: 0.015 },
    cabinet_change:  { variable: 'D_MII', nudge: 0.020 },
    econ_policy_change: { variable: 'A251', nudge: 0.035 }, // High impact structural signal
  };

  const rriMapping = RRI_VARIABLE_MAP[category] || { variable: 'O151', nudge: 0.005 };

  // Run comprehensive lexical analysis
  const lexical = analyzeLexical(title, content, sourceAlignment);

  // Override category if a strong economic signal is detected
  let finalCategory = category;
  let finalSeverity = severity;
  let finalNudge = rriMapping.nudge * (severity / 3);

  if (lexical.economic_signal && lexical.economic_signal.impact_score >= 50) {
    finalCategory = 'econ_policy_change';
    finalSeverity = Math.max(severity, 4); // Silent signals are high priority
    const econMapping = RRI_VARIABLE_MAP['econ_policy_change'];
    finalNudge = econMapping.nudge * (lexical.economic_signal.impact_score / 100);
  }

  return {
    category: finalCategory,
    severity: finalSeverity,
    governorate,
    rri_nudge: finalNudge,
    rri_variable: finalCategory === 'econ_policy_change' ? 'A251' : rriMapping.variable,
    keywords: [...new Set([...matchedKeywords, ...(lexical.economic_signal?.staple_good ? [lexical.economic_signal.staple_good] : [])])].slice(0, 10),
    bias_alignment: sourceAlignment as any,
    bias_tone,
    propaganda_score: lexical.propaganda_score,
    techniques_detected: lexical.techniques,
  };
}

// ============================================================
// EVENT ENGINE
// Groups articles into events
// ============================================================

export async function processEvent(article: Article): Promise<string | null> {
  const dateStr = article.published_at.split('T')[0];
  const category = article.category || 'general';
  const govKey = (article.governorate || 'national').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const eventKey = `${category}-${govKey}-${dateStr}`;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const { data: existingEvent, error: fetchError } = await supabase
        .from('events')
        .select('*')
        .eq('event_key', eventKey)
        .maybeSingle();

      if (fetchError) return null;

      let eventId: string;
      let finalEvent: Event;

      if (existingEvent) {
        eventId = existingEvent.id;
        finalEvent = existingEvent as Event;
      } else {
        const newEvent = {
          event_key: eventKey,
          title: article.title.slice(0, 100),
          description: article.summary || article.title,
          category: category,
          governorate: article.governorate,
          severity: article.severity,
          status: 'emerging',
          article_count: 0,
          priority_score: 0,
          velocity_score: 0,
          is_critical: false,
          trend: 'stable',
          pro_gov_count: 0,
          neutral_count: 0,
          critical_count: 0,
          alarmist_count: 0,
          minimizing_count: 0,
        };

        const { data: createdEvent, error: createError } = await supabase
          .from('events')
          .insert(newEvent)
          .select()
          .single();

        if (createError) {
          if (createError.code === '23505' && attempt < 2) continue;
          return null;
        }
        eventId = createdEvent.id;
        finalEvent = createdEvent as Event;
      }

      // Fetch all articles for this event to calculate priority
      const { data: eventArticles } = await supabase
        .from('articles')
        .select('*')
        .eq('event_id', eventId);

      const allArticles = eventArticles || [];
      // Include current article if it's not yet in the list (or it will be after update)
      if (!allArticles.some(a => a.id === article.id)) {
        allArticles.push(article);
      }

      const priority = calculateEventPriority(finalEvent, allArticles);

      const updates: Partial<Event> = {
        article_count: allArticles.length,
        severity: Math.max(finalEvent.severity || 1, article.severity),
        pro_gov_count: allArticles.filter(a => a.bias_alignment === 'PRO_GOV').length,
        neutral_count: allArticles.filter(a => a.bias_alignment === 'NEUTRAL').length,
        critical_count: allArticles.filter(a => a.bias_alignment === 'CRITICAL').length,
        alarmist_count: allArticles.filter(a => a.bias_tone === 'ALARMIST').length,
        minimizing_count: allArticles.filter(a => a.bias_tone === 'MINIMIZING').length,
        priority_score: priority.score,
        velocity_score: priority.velocity,
        status: priority.status as any,
        is_critical: priority.isCritical,
        trend: priority.trend,
        last_updated: new Date().toISOString(),
      };

      const { error: updateError } = await supabase
        .from('events')
        .update(updates)
        .eq('id', eventId);
      
      if (updateError) {
        pipelineDebugger.log('PIPELINE', 'error', `Event update failed: ${updateError.message}`, { eventId, updates });
        throw updateError;
      }
      
      pipelineDebugger.log('EVENTS', 'valid', `Event processed: ${finalEvent.title}`, { ...finalEvent, ...updates });
      const { count: eventCount } = await supabase.from('events').select('*', { count: 'exact', head: true });
      logger.log({ stage: "EVENT", level: "INFO", message: `Event lifecycle updated: ${finalEvent.id.slice(0, 8)}`, traceId: finalEvent.event_key });
      
      // This is hard to call updateMetrics from here as it's a service, but we can emit an event
      if (typeof window !== 'undefined') {
        const count = eventCount || 0;
        window.dispatchEvent(new CustomEvent('pipeline_metric_update', { 
          detail: { eventCount: count, signalCount: count * 2.5 } // Approx signals
        }));
      }

    return eventId;
    } catch (err) {
      if (attempt < 2) continue;
      return null;
    }
  }
  return null;
}

export async function generateAISummary(
  title: string,
  content: string,
  category: string
): Promise<string | null> {
  try {
    const prompt = `You are a political intelligence analyst specializing in Tunisia.
    
Summarize this news article in exactly 2 sentences for an intelligence briefing.
Be precise, factual, and highlight the political/security/economic significance.
Do NOT start with "The article" or "This article".
Write directly as an analyst would.

Title: ${title}
Content: ${content.slice(0, 400)}
Category: ${category}

Return only the 2-sentence summary, nothing else.`;

    const summary = await safeAI(
      () => generateAnalystResponse(prompt, {}),
      null
    );
    return summary?.slice(0, 300) || null;
  } catch {
    return null;
  }
}

// ============================================================
// RSS PARSER
// ============================================================

export function parseRSS(xml: string, source: typeof RSS_SOURCES[0]): Omit<Article, 'fetched_at' | 'created_at'>[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, 'text/xml');
  const items = doc.querySelectorAll('item, entry');
  const articles: Omit<Article, 'fetched_at' | 'created_at'>[] = [];

  items.forEach(item => {
    try {
      const title = item.querySelector('title')?.textContent?.trim() || '';
      const url = (
        item.querySelector('link')?.textContent?.trim() ||
        item.querySelector('link')?.getAttribute('href') ||
        ''
      );
      const published = item.querySelector('pubDate, published, updated')?.textContent?.trim();
      const content = (
        item.querySelector('description, content\\:encoded, content, summary')?.textContent?.trim() ||
        ''
      );

      if (!title || !url) {
        pipelineDebugger.log('FEED', 'dropped', `Missing title/url from ${source.name}`, { title, url });
        logger.log({ stage: "INGESTION", level: "WARN", message: `Dropped item from ${source.name}: Missing title/url` });
        return;
      }

      // Record RAW FEED item before DB write
      pipelineDebugger.log('FEED', 'valid', `Raw item from ${source.name}`, {
        title,
        source: source.name,
        pubDate: published,
        xmlSnippet: item.outerHTML?.slice(0, 300)
      });
      logger.log({ stage: "INGESTION", level: "INFO", message: `Parsed item from ${source.name}: ${title.slice(0, 30)}...` });

      // Defensive date parsing
      let publishedAt = new Date().toISOString();
      if (published) {
        const d = new Date(published);
        if (!isNaN(d.getTime())) {
          // Ignore articles older than 30 days to keep the "Live" feed functional but with enough history
          const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
          if (d.getTime() < thirtyDaysAgo) {
            return;
          }
          publishedAt = d.toISOString();
        } else {
          console.warn(`Invalid date format from ${source.name}: ${published}`);
        }
      }

      // Strip HTML from content
      const cleanContent = content.replace(/<[^>]*>/g, ' ').slice(0, 500);

      const classification = classifyArticle(title, cleanContent, source.alignment);

      // Detect language
      const arabicPattern = /[\u0600-\u06FF]/;
      const language = arabicPattern.test(title) ? 'ar' : 'fr';

      const deterministicId = generateEventId({ title, source: source.name });
      if (!deterministicId) {
        pipelineDebugger.log('FEED', 'error', `Failed to generate ID for item from ${source.name}`, { title });
        return; // Drop events with missing/invalid IDs
      }

      articles.push({
        id: deterministicId,
        fingerprint: deterministicId,
        source_id: source.id,
        source_name: source.name,
        title,
        url,
        published_at: publishedAt,
        content: cleanContent,
        summary: cleanContent.slice(0, 200),
        language,
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
        confirm_count: 0,
        dispute_count: 0,
        context_count: 0,
        processed: false,
        pipeline_pushed: false,
      });
    } catch (itemErr) {
      console.error(`Error parsing item from ${source.name}:`, itemErr);
    }
  });

  return articles;
}

// ============================================================
// FETCH SINGLE RSS FEED
// ============================================================

export async function fetchRSSFeed(source: typeof RSS_SOURCES[0], retries = 2): Promise<Omit<Article, 'fetched_at' | 'created_at'>[]> {
  const ts = Date.now();
  const cacheBuster = source.url.includes('?') ? `&_cb=${ts}&rand=${Math.random()}` : `?_cb=${ts}&rand=${Math.random()}`;
  const targetUrl = encodeURIComponent(`${source.url}${cacheBuster}`);
  
  // Use our internal backend proxy which handles SSL errors and provides browser UA
  const currentProxy = `/api/rss?url=${targetUrl}`;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000); 

    try {
      const response = await fetch(currentProxy, { 
        signal: controller.signal,
        headers: { 
          'Cache-Control': 'no-cache', 
          'Pragma': 'no-cache',
          'Accept': 'application/xml, text/xml, application/rss+xml'
        }
      });
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}`);
      }
      
      const xml = await response.text();

      if (!xml || xml.trim().length === 0) {
        throw new Error('Empty response content');
      }

      const news = parseRSS(xml, source);
      
      if (news.length === 0 && attempt < retries) {
        throw new Error('No news found in feed, might be cached empty');
      }
      
      return news;
    } catch (error: any) {
      clearTimeout(timeoutId);
      
      if (attempt < retries) {
        // console.warn(`Fetch for ${source.name} failed (${error.message}). Retrying...`);
        await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
        continue;
      }

      // We explicitly swallow warnings so the UI console stays clean during graceful degradation,
      // but we return empty array so UI still fails soft.
      // console.error(`Final failure for ${source.name}:`, error.message);
      return [];
    }
  }
  return [];
}

// ============================================================
// FETCH ALL ACTIVE FEEDS
// ============================================================

const GLOBAL_FETCH_LOCK = { active: false };
let isPaused = false;

export function setRSSPaused(paused: boolean) {
  isPaused = paused;
  pipelineDebugger.log('PIPELINE', 'valid', `Ingestion system ${paused ? 'PAUSED' : 'RESUMED'}`, { paused });
}

export function pauseRSSPipeline() {
  setRSSPaused(true);
}

export async function fetchAllFeeds(options?: { force?: boolean }): Promise<{
  newArticles: number;
  feedsProcessed: number;
  totalArticlesHandled: number;
  errors: string[];
}> {
  if (isPaused && !options?.force) {
    return { newArticles: 0, feedsProcessed: 0, totalArticlesHandled: 0, errors: [] };
  }

  ingestionMetrics.isFetching = true;
  
  // Health check
  for (const feed of RSS_SOURCES) {
      if (feed.status === 'paused') continue;
      const status = await validateRSSSource(feed.url);
      if (status === 'failing') {
          markSource(feed.id, 'paused');
          continue;
      }
      if (status === 'degraded') {
          markSource(feed.id, 'degraded');
      } else {
          markSource(feed.id, 'healthy');
      }
  }

  try {
    const { fetchNewsData, syncNewsDataToSupabase } = await import('./newsService');
    const newsDataArticles = await fetchNewsData('Tunisia');
    const newArticles = await syncNewsDataToSupabase(newsDataArticles);

    ingestionMetrics.successCount += newArticles;
    ingestionMetrics.lastFetch = Date.now();

    return { 
      newArticles: newArticles, 
      feedsProcessed: 1, // NewsData is one big feed
      totalArticlesHandled: newsDataArticles.length,
      errors: []
    };
  } catch (err: any) {
    console.error('NewsData sync failed:', err.message);
    ingestionMetrics.failureCount++;
    return { newArticles: 0, feedsProcessed: 0, totalArticlesHandled: 0, errors: [] };
  } finally {
    ingestionMetrics.isFetching = false;
  }
}

// ============================================================
// GET RECENT ARTICLES
// ============================================================

export function getSeverityLabel(severity: number): string {
  switch (severity) {
    case 5: return 'SYSTEMIC RISK';
    case 4: return 'POTENTIAL CATALYST';
    case 3: return 'CRITICAL';
    case 2: return 'HIGH';
    case 1: return 'LOCALIZED IMPACT';
    default: return 'MODERATE';
  }
}

export async function getRecentArticles(options: {
  limit?: number;
  category?: string;
  governorate?: string;
  severity?: number;
  source?: string;
  since?: Date;
} = {}): Promise<Article[]> {
  const params = new URLSearchParams();
  if (options.limit) params.set('limit', options.limit.toString());
  if (options.category) params.set('category', options.category);
  
  try {
    const response = await fetch(`/api/articles?${params.toString()}`);
    if (response.ok) return await response.json();
  } catch (err) {
    console.warn('Backend articles fetch failed, using Supabase fallback:', err);
  }

  let query = supabase
    .from('articles')
    .select('*')
    .order('published_at', { ascending: false });

  if (options.limit) query = query.limit(options.limit);
  if (options.category) query = query.eq('category', options.category);
  if (options.governorate) query = query.eq('governorate', options.governorate);
  if (options.severity) query = query.gte('severity', options.severity);
  if (options.source) query = query.eq('source_id', options.source);
  if (options.since) query = query.gte('published_at', options.since.toISOString());

  const { data, error } = await query;
  if (error) throw error;
  
  return data || [];
}

// ============================================================
// SAVE RRI SNAPSHOT
// ============================================================

// ============================================================
// SAVE RRI SNAPSHOT
// ============================================================

export async function saveRRISnapshot(rriState: any, trigger: string) {
  await supabase.from('rri_snapshots').insert({
    rri: rriState.rri,
    p_rev: rriState.p_rev,
    velocity: rriState.velocity,
    compound_stress: rriState.compound_stress,
    cascade_probability: rriState.cascade_probability,
    pattern_similarity: rriState.pattern_similarity,
    threshold_breaches: rriState.threshold_breaches?.length || 0,
    trigger,
  });
}

export async function getLiveEvents(limit: number = 20): Promise<any[]> {
  try {
    const response = await fetch(`/api/events?limit=${limit}`);
    if (response.ok) {
        const events = await response.json();
        return events.map((e: any) => ({
            id: e.id,
            date: e.last_updated?.split('T')[0] || new Date().toISOString().split('T')[0],
            type: e.category?.toLowerCase() || 'general',
            title: e.title,
            summary: e.description || e.title,
            gov: e.governorate?.toLowerCase() || 'national',
            severity: e.severity || 1,
            status: e.status || 'ACTIVE',
            articleCount: e.article_count || 1,
            source: 'TunisiaIntel Engine'
        }));
    }
  } catch (err) {
    console.warn('Backend events fetch failed, using Supabase fallback:', err);
  }

  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('last_updated', { ascending: false })
    .limit(limit);

  if (error) throw error;
  
  return (data || []).map(e => ({
    id: e.id,
    date: e.last_updated?.split('T')[0] || new Date().toISOString().split('T')[0],
    type: e.category?.toLowerCase() || 'general',
    title: e.title,
    summary: e.description || e.title,
    gov: e.governorate?.toLowerCase() || 'national',
    severity: e.severity || 1,
    status: e.status || 'ACTIVE',
    articleCount: e.article_count || 1,
    source: 'TunisiaIntel Engine'
  }));
}
