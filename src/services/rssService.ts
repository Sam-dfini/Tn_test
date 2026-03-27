import { supabase, Article } from '../lib/supabase';
import { generateAnalystResponse } from './geminiService';

// ============================================================
// RSS SOURCES — matches SourceLibrary active RSS feeds
// ============================================================
export const RSS_SOURCES = [
  {
    id: 'rss-nawaat',
    name: 'Nawaat',
    url: 'https://nawaat.org/feed/',
    language: 'ar/fr',
    reliability: 'A',
    keywords: ['Decree 54', 'décret', 'droits', 'UGTT', 'احتجاج', 'اعتقال'],
  },
  {
    id: 'rss-inkyfada',
    name: 'Inkyfada',
    url: 'https://inkyfada.com/fr/feed/',
    language: 'ar/fr',
    reliability: 'A',
    keywords: ['pollution', 'Gabes', 'water', 'eau', 'environment', 'migration'],
  },
  {
    id: 'rss-businessnews',
    name: 'Business News Tunisia',
    url: 'https://www.businessnews.com.tn/rss',
    language: 'fr',
    reliability: 'B',
    keywords: ['BCT', 'IMF', 'réserves', 'inflation', 'dinar', 'UGTT'],
  },
  {
    id: 'rss-kapitalis',
    name: 'Kapitalis',
    url: 'https://kapitalis.com/tunisie/feed/',
    language: 'fr',
    reliability: 'B',
    keywords: ['Saied', 'UGTT', 'grève', 'IMF', 'économie'],
  },
  {
    id: 'rss-tap',
    name: 'TAP Agency',
    url: 'https://www.tap.info.tn/en/rss',
    language: 'ar/fr/en',
    reliability: 'C',
    keywords: ['official', 'ministry', 'presidency'],
  },
  {
    id: 'rss-france24-africa',
    name: 'France 24 Africa',
    url: 'https://www.france24.com/en/africa/rss',
    language: 'en',
    reliability: 'A',
    keywords: ['Tunisia', 'Tunisie', 'IMF', 'protest'],
  },
  {
    id: 'rss-mosaique',
    name: 'Mosaique FM',
    url: 'https://www.mosaiquefm.net/rss',
    language: 'ar/fr',
    reliability: 'B',
    keywords: ['UGTT', 'grève', 'protest', 'Sfax', 'Gafsa'],
  },
  {
    id: 'rss-tafneed',
    name: 'Tafneed',
    url: 'https://tafneed.org/feed/',
    language: 'ar',
    reliability: 'A',
    keywords: ['fact-check', 'verif', 'hoax', 'تفنيد', 'شائعة'],
  },
  {
    id: 'rss-africanmanager',
    name: 'African Manager',
    url: 'https://africanmanager.com/feed/',
    language: 'fr/en',
    reliability: 'B',
    keywords: ['IMF', 'BCT', 'investment', 'economy', 'Tunisia'],
  },
  {
    id: 'rss-realites',
    name: 'Réalités',
    url: 'https://www.realites.com.tn/feed/',
    language: 'fr',
    reliability: 'B',
    keywords: ['Tunisie', 'politique', 'société', 'actualité'],
  },
  {
    id: 'rss-gnet',
    name: 'Gnet News',
    url: 'https://www.gnet.tn/feed/',
    language: 'fr',
    reliability: 'B',
    keywords: ['Tunisie', 'actualité', 'économie'],
  },
  {
    id: 'rss-webmanagercenter',
    name: 'Webmanagercenter',
    url: 'https://www.webmanagercenter.com/feed/',
    language: 'fr',
    reliability: 'B',
    keywords: ['business', 'finance', 'Tunisie'],
  },
  {
    id: 'rss-leaders',
    name: 'Leaders',
    url: 'https://www.leaders.com.tn/rss.xml',
    language: 'fr',
    reliability: 'A',
    keywords: ['opinion', 'analysis', 'Tunisia', 'leaders'],
  },
];

// ============================================================
// NLP CLASSIFICATION
// Determines category, severity, governorate, RRI impact
// ============================================================

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  protest: ['protest', 'manifestation', 'احتجاج', 'grève', 'strike', 'blockade', 'sit-in', 'rassemblement', 'وقفة'],
  arrest: ['arrest', 'detained', 'arrestation', 'اعتقال', 'décret 54', 'decree 54', 'incarcéré', 'emprisonné', 'محاكمة'],
  economic: ['inflation', 'réserves', 'BCT', 'IMF', 'dinar', 'FMI', 'dette', 'budget', 'forex', 'مالية'],
  political: ['Saied', 'présidence', 'parlement', 'constitution', 'NSF', 'Ennahda', 'opposition', 'سعيد'],
  water: ['eau', 'water', 'SONEDE', 'sécheresse', 'pénurie eau', 'مياه', 'جفاف'],
  migration: ['migration', 'Sfax', 'harraga', 'traversée', 'هجرة', 'قوارب', 'noyé', 'drowning'],
  labor: ['UGTT', 'syndicat', 'salaire', 'CPG', 'phosphate', 'travailleur', 'نقابة'],
  rights: ['droits', 'liberté', 'RSF', 'HRW', 'Amnesty', 'censure', 'حريات'],
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
};

const RRI_VARIABLE_MAP: Record<string, { variable: string; nudge: number }> = {
  protest: { variable: 'E51', nudge: 0.015 },
  arrest: { variable: 'D44', nudge: 0.012 },
  economic: { variable: 'A01', nudge: 0.010 },
  political: { variable: 'D41', nudge: 0.008 },
  water: { variable: 'B21', nudge: 0.018 },
  migration: { variable: 'F66', nudge: 0.010 },
  labor: { variable: 'M_UGTT', nudge: 0.020 },
  rights: { variable: 'D44', nudge: 0.012 },
};

const SEVERITY_KEYWORDS: Record<number, string[]> = {
  5: ['terrorism', 'terrorisme', 'explosion', 'mort', 'killed', 'killed', 'coup', 'assassin'],
  4: ['UGTT', 'general strike', 'grève générale', 'Decree 54', 'arrested', 'BCT', 'IMF', 'default'],
  3: ['protest', 'manifestation', 'احتجاج', 'grève', 'pénurie', 'shortage'],
  2: ['statement', 'communiqué', 'déclaration', 'réunion', 'meeting'],
};

export function classifyArticle(title: string, content: string = ''): {
  category: string;
  severity: number;
  governorate: string | null;
  rri_nudge: number;
  rri_variable: string;
  keywords: string[];
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

  // RRI impact
  const rriMapping = RRI_VARIABLE_MAP[category] ||
    { variable: 'O151', nudge: 0.005 };

  return {
    category,
    severity,
    governorate,
    rri_nudge: rriMapping.nudge * (severity / 3),
    rri_variable: rriMapping.variable,
    keywords: [...new Set(matchedKeywords)].slice(0, 10),
  };
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

    const summary = await generateAnalystResponse(prompt, {});
    return summary?.slice(0, 300) || null;
  } catch {
    return null;
  }
}

// ============================================================
// RSS PARSER
// ============================================================

export function parseRSS(xml: string, sourceId: string, sourceName: string): Omit<Article, 'id' | 'fetched_at' | 'created_at'>[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, 'text/xml');
  const items = doc.querySelectorAll('item, entry');
  const articles: Omit<Article, 'id' | 'fetched_at' | 'created_at'>[] = [];

  items.forEach(item => {
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

    if (!title || !url) return;

    // Strip HTML from content
    const cleanContent = content.replace(/<[^>]*>/g, ' ').slice(0, 500);

    const classification = classifyArticle(title, cleanContent);

    // Detect language
    const arabicPattern = /[\u0600-\u06FF]/;
    const language = arabicPattern.test(title) ? 'ar' : 'fr';

    articles.push({
      source_id: sourceId,
      source_name: sourceName,
      title,
      url,
      published_at: published ? new Date(published).toISOString() : new Date().toISOString(),
      content: cleanContent,
      summary: cleanContent.slice(0, 200),
      language,
      category: classification.category,
      severity: classification.severity,
      governorate: classification.governorate || undefined,
      keywords: classification.keywords,
      rri_nudge: classification.rri_nudge,
      rri_variable: classification.rri_variable,
      confirm_count: 0,
      dispute_count: 0,
      context_count: 0,
      processed: false,
      pipeline_pushed: false,
    });
  });

  return articles;
}

// ============================================================
// FETCH SINGLE RSS FEED
// ============================================================

export async function fetchRSSFeed(source: typeof RSS_SOURCES[0]): Promise<Omit<Article, 'id' | 'fetched_at' | 'created_at'>[]> {
  try {
    // Use Vercel edge function as CORS proxy
    const proxyUrl = `/api/rss?url=${encodeURIComponent(source.url)}`;
    const response = await fetch(proxyUrl);

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const xml = await response.text();
    return parseRSS(xml, source.id, source.name);
  } catch (error) {
    console.error(`Failed to fetch ${source.name}:`, error);
    return [];
  }
}

// ============================================================
// FETCH ALL ACTIVE FEEDS
// ============================================================

export async function fetchAllFeeds(): Promise<{
  newArticles: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let newArticles = 0;

  // Get existing URLs to deduplicate
  const { data: existing } = await supabase
    .from('articles')
    .select('url')
    .gte('published_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

  const existingUrls = new Set(existing?.map(a => a.url) || []);

  // Fetch all active feeds
  for (const source of RSS_SOURCES) {
    try {
      const articles = await fetchRSSFeed(source);

      // Filter out already-seen articles
      const newOnes = articles.filter(a => !existingUrls.has(a.url));

      if (newOnes.length > 0) {
        const { error } = await supabase
          .from('articles')
          .insert(newOnes);

        if (error) {
          errors.push(`${source.name}: ${error.message}`);
        } else {
          newArticles += newOnes.length;
          
          // Generate AI summaries for high-severity ones
          const highSeverityNew = newOnes.filter(a => a.severity >= 3);
          for (const article of highSeverityNew.slice(0, 5)) {
            // Rate limit — only 5 summaries per fetch cycle
            const summary = await generateAISummary(
              article.title,
              article.content || '',
              article.category || 'general'
            );
            if (summary) {
              await supabase
                .from('articles')
                .update({ ai_summary: summary })
                .eq('url', article.url);
            }
            await new Promise(r => setTimeout(r, 500)); // rate limit
          }
        }
      }

      // Small delay between feeds
      await new Promise(r => setTimeout(r, 300));
    } catch (err) {
      errors.push(`${source.name}: ${String(err)}`);
    }
  }

  return { newArticles, errors };
}

// ============================================================
// GET RECENT ARTICLES
// ============================================================

export async function getRecentArticles(options: {
  limit?: number;
  category?: string;
  governorate?: string;
  severity?: number;
  source?: string;
  since?: Date;
} = {}): Promise<Article[]> {
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
