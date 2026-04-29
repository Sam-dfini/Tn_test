/**
 * RSS Sources Configuration
 * TunisiaIntel — Multi-source ingestion layer
 * Covers: RSS feeds, News APIs, Telegram channels
 */

export interface RSSSource {
  id: string;
  name: string;
  url: string;
  language: 'en' | 'fr' | 'ar';
  reliability: 'A' | 'B' | 'C';
  alignment: 'CRITICAL' | 'NEUTRAL' | 'PRO_GOV';
  keywords: string[];
  status?: 'healthy' | 'degraded' | 'failing' | 'paused';
  type: 'rss' | 'api' | 'telegram';
  category: 'general' | 'politics' | 'economy' | 'security' | 'social';
  geo_weight: number; // 1.0 = Tunisia-focused, 0.5 = regional, 0.2 = global
}

// ─── RSS FEEDS ────────────────────────────────────────────────────────────────

export const RSS_SOURCES: RSSSource[] = [

  // ── English ──────────────────────────────────────────────────────────────
  {
    id: 'google-news-tunisia',
    name: 'Google News Tunisia',
    url: 'https://news.google.com/rss/search?q=tunisia&hl=en-US&gl=US&ceid=US:en',
    language: 'en',
    reliability: 'A',
    alignment: 'NEUTRAL',
    keywords: ['Tunisia', 'Tunisie'],
    status: 'healthy',
    type: 'rss',
    category: 'general',
    geo_weight: 0.7, // Mixed — needs geo filter
  },
  {
    id: 'reuters-africa',
    name: 'Reuters Africa',
    url: 'https://feeds.reuters.com/reuters/AFRICANews',
    language: 'en',
    reliability: 'A',
    alignment: 'NEUTRAL',
    keywords: ['Tunisia', 'North Africa', 'Maghreb'],
    status: 'healthy',
    type: 'rss',
    category: 'general',
    geo_weight: 0.3, // Low — most articles not Tunisia-specific
  },
  {
    id: 'middleeasteye-tunisia',
    name: 'Middle East Eye — Tunisia',
    url: 'https://www.middleeasteye.net/rss/country/Tunisia',
    language: 'en',
    reliability: 'B',
    alignment: 'CRITICAL',
    keywords: ['Tunisia'],
    status: 'healthy',
    type: 'rss',
    category: 'politics',
    geo_weight: 1.0, // Tunisia-specific feed
  },
  {
    id: 'aljazeera-africa',
    name: 'Al Jazeera Africa',
    url: 'https://www.aljazeera.com/xml/rss/all.xml',
    language: 'en',
    reliability: 'B',
    alignment: 'CRITICAL',
    keywords: ['Tunisia', 'Maghreb', 'North Africa'],
    status: 'healthy',
    type: 'rss',
    category: 'politics',
    geo_weight: 0.2, // Global — high noise, needs filter
  },

  // ── French ────────────────────────────────────────────────────────────────
  {
    id: 'businessnews-tn',
    name: 'Business News Tunisie',
    url: 'https://www.businessnews.com.tn/rss.xml',
    language: 'fr',
    reliability: 'B',
    alignment: 'NEUTRAL',
    keywords: ['Tunisie', 'économie', 'entreprise'],
    status: 'healthy',
    type: 'rss',
    category: 'economy',
    geo_weight: 1.0,
  },
  {
    id: 'kapitalis-tn',
    name: 'Kapitalis',
    url: 'https://www.kapitalis.com/feed/',
    language: 'fr',
    reliability: 'B',
    alignment: 'NEUTRAL',
    keywords: ['Tunisie', 'politique', 'économie'],
    status: 'healthy',
    type: 'rss',
    category: 'general',
    geo_weight: 1.0,
  },
  {
    id: 'inkyfada',
    name: 'Inkyfada',
    url: 'https://inkyfada.com/feed/',
    language: 'fr',
    reliability: 'A',
    alignment: 'CRITICAL',
    keywords: ['Tunisie', 'droits', 'liberté', 'enquête'],
    status: 'healthy',
    type: 'rss',
    category: 'politics',
    geo_weight: 1.0,
  },
  {
    id: 'leaders-tn',
    name: 'Leaders Tunisie',
    url: 'https://www.leaders.com.tn/rss.xml',
    language: 'fr',
    reliability: 'B',
    alignment: 'PRO_GOV',
    keywords: ['Tunisie', 'gouvernement', 'économie'],
    status: 'healthy',
    type: 'rss',
    category: 'economy',
    geo_weight: 1.0,
  },
  {
    id: 'realites-tn',
    name: 'Réalités Online',
    url: 'https://www.realites.com.tn/feed/',
    language: 'fr',
    reliability: 'B',
    alignment: 'NEUTRAL',
    keywords: ['Tunisie', 'société', 'politique'],
    status: 'healthy',
    type: 'rss',
    category: 'general',
    geo_weight: 1.0,
  },
  {
    id: 'jeuneafrique-maghreb',
    name: 'Jeune Afrique — Maghreb',
    url: 'https://www.jeuneafrique.com/feed/',
    language: 'fr',
    reliability: 'A',
    alignment: 'NEUTRAL',
    keywords: ['Tunisie', 'Maghreb'],
    status: 'healthy',
    type: 'rss',
    category: 'politics',
    geo_weight: 0.3,
  },
  {
    id: 'france24-afrique',
    name: 'France 24 Afrique',
    url: 'https://www.france24.com/fr/afrique/rss',
    language: 'fr',
    reliability: 'A',
    alignment: 'NEUTRAL',
    keywords: ['Tunisie', 'Afrique du Nord'],
    status: 'healthy',
    type: 'rss',
    category: 'general',
    geo_weight: 0.2,
  },
  {
    id: 'leconomistemaghrebin',
    name: "L'Économiste Maghrébin",
    url: 'https://www.leconomistemaghrebin.com/feed/',
    language: 'fr',
    reliability: 'B',
    alignment: 'NEUTRAL',
    keywords: ['Tunisie', 'économie', 'FMI', 'BCT'],
    status: 'healthy',
    type: 'rss',
    category: 'economy',
    geo_weight: 0.8,
  },

  // ── Arabic ────────────────────────────────────────────────────────────────
  {
    id: 'tap-info',
    name: 'TAP — Agence Tunisienne (AR)',
    url: 'https://www.tap.info.tn/ar/rss',
    language: 'ar',
    reliability: 'A',
    alignment: 'PRO_GOV',
    keywords: ['تونس', 'حكومة', 'رئاسة'],
    status: 'healthy',
    type: 'rss',
    category: 'politics',
    geo_weight: 1.0,
  },
  {
    id: 'mosaique-fm',
    name: 'Mosaïque FM (AR)',
    url: 'https://www.mosaiquefm.net/ar/feed/rss',
    language: 'ar',
    reliability: 'B',
    alignment: 'NEUTRAL',
    keywords: ['تونس', 'أخبار'],
    status: 'healthy',
    type: 'rss',
    category: 'general',
    geo_weight: 1.0,
  },
  {
    id: 'google-news-tunisia-ar',
    name: 'Google News — تونس (AR)',
    url: 'https://news.google.com/rss/search?q=%D8%AA%D9%88%D9%86%D8%B3&hl=ar&gl=TN&ceid=TN:ar',
    language: 'ar',
    reliability: 'A',
    alignment: 'NEUTRAL',
    keywords: ['تونس', 'تونسي'],
    status: 'healthy',
    type: 'rss',
    category: 'general',
    geo_weight: 0.8,
  },
  {
    id: 'aljazeera-ar-maghreb',
    name: 'Al Jazeera Arabic — Maghreb',
    url: 'https://www.aljazeera.net/rss/all.xml',
    language: 'ar',
    reliability: 'A',
    alignment: 'CRITICAL',
    keywords: ['تونس', 'المغرب العربي'],
    status: 'healthy',
    type: 'rss',
    category: 'politics',
    geo_weight: 0.2,
  },
  {
    id: 'nawaat',
    name: 'Nawaat (AR/FR)',
    url: 'https://nawaat.org/feed/',
    language: 'ar',
    reliability: 'A',
    alignment: 'CRITICAL',
    keywords: ['تونس', 'حقوق', 'معارضة'],
    status: 'healthy',
    type: 'rss',
    category: 'politics',
    geo_weight: 1.0,
  },
];

// ─── GEO-RELEVANCE SCORING ────────────────────────────────────────────────────
// Determines if an article is Tunisia-relevant before writing to Supabase
// This is the critical missing filter that causes Denmark train crashes to
// appear as SYSTEMIC RISK in the Tunisian intelligence feed.

const TUNISIA_ENTITIES_EN = [
  'tunisia', 'tunisian', 'tunis', 'sfax', 'sousse', 'kairouan', 'bizerte',
  'gafsa', 'kasserine', 'monastir', 'nabeul', 'jendouba', 'gabes', 'medenine',
  'tataouine', 'sidi bouzid', 'kebili', 'tozeur', 'beja', 'siliana', 'zaghouan',
  'kef', 'manouba', 'ariana', 'ben arous', 'djerba', 'hammamet',
  'saied', 'kais saied', 'ennahda', 'ugtt', 'bct', 'bvmt', 'steg', 'sonede',
  'decree 54', 'constitution 2022', 'pdl', 'acmaco', 'nessma', 'mosaique',
  'tap agency', 'inkyfada', 'nawaat', 'harraga', 'rcd',
  'cpg', 'phosphate', 'maghreb', 'north africa',
];

const TUNISIA_ENTITIES_FR = [
  'tunisie', 'tunisien', 'tunis', 'sfax', 'sousse', 'kairouan', 'bizerte',
  'gafsa', 'kasserine', 'monastir', 'nabeul', 'jendouba', 'gabès', 'médenine',
  'tataouine', 'sidi bouzid', 'kébili', 'tozeur', 'béja', 'siliana', 'zaghouan',
  'le kef', 'manouba', 'ariana', 'ben arous', 'djerba', 'hammamet',
  'saied', 'kaïs saïed', 'ennahdha', 'ugtt', 'bct', 'décret 54',
  'constitution tunisienne', 'harraga', 'steg', 'sonede',
  'cpg', 'phosphate', 'maghreb', 'afrique du nord',
];

const TUNISIA_ENTITIES_AR = [
  'تونس', 'تونسي', 'تونسية', 'صفاقس', 'سوسة', 'القيروان', 'بنزرت',
  'قفصة', 'القصرين', 'المنستير', 'نابل', 'جندوبة', 'قابس', 'مدنين',
  'تطاوين', 'سيدي بوزيد', 'قبلي', 'توزر', 'باجة', 'سليانة', 'زغوان',
  'الكاف', 'منوبة', 'أريانة', 'بن عروس', 'جربة',
  'سعيد', 'قيس سعيد', 'النهضة', 'اتحاد الشغل', 'البنك المركزي',
  'المرسوم 54', 'الستاغ', 'سونيد', 'حراقة', 'الفسفاط',
  'المغرب العربي', 'شمال أفريقيا',
];

// Domains that are ALWAYS Tunisia-relevant (no geo check needed)
const TRUSTED_TUNISIAN_DOMAINS = [
  'businessnews.com.tn', 'kapitalis.com', 'inkyfada.com', 'leaders.com.tn',
  'realites.com.tn', 'tap.info.tn', 'mosaiquefm.net', 'nawaat.org',
  'leconomistemaghrebin.com', 'espacemanager.com', 'tunisienumerique.com',
  'gnet.tn', 'jawharafm.net', 'shemsfm.net', 'radioexpressfm.com',
];

export interface GeoRelevanceResult {
  isRelevant: boolean;
  score: number;         // 0–100
  matchedEntities: string[];
  confidence: 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';
}

export function scoreGeoRelevance(
  title: string,
  content: string,
  sourceUrl: string,
  sourceGeoWeight: number,
): GeoRelevanceResult {
  // 1. Trusted Tunisian domain → always relevant
  try {
    const hostname = new URL(sourceUrl.startsWith('http') ? sourceUrl : `https://${sourceUrl}`).hostname;
    if (TRUSTED_TUNISIAN_DOMAINS.some(d => hostname.includes(d))) {
      return { isRelevant: true, score: 100, matchedEntities: ['trusted-source'], confidence: 'HIGH' };
    }
  } catch { /* ignore url parse errors */ }

  const text = `${title} ${content}`.toLowerCase();
  const matchedEntities: string[] = [];

  // 2. Entity matching across all three languages
  for (const entity of TUNISIA_ENTITIES_EN) {
    if (text.includes(entity.toLowerCase())) matchedEntities.push(entity);
  }
  for (const entity of TUNISIA_ENTITIES_FR) {
    if (text.includes(entity.toLowerCase())) matchedEntities.push(entity);
  }
  for (const entity of TUNISIA_ENTITIES_AR) {
    if (text.includes(entity)) matchedEntities.push(entity);
  }

  const uniqueMatches = [...new Set(matchedEntities)];
  const entityScore = Math.min(80, uniqueMatches.length * 20);
  const weightBonus = sourceGeoWeight * 20;
  const score = Math.round(Math.min(100, entityScore + weightBonus));

  let confidence: GeoRelevanceResult['confidence'] = 'NONE';
  if (score >= 60) confidence = 'HIGH';
  else if (score >= 35) confidence = 'MEDIUM';
  else if (score >= 15) confidence = 'LOW';

  // Minimum threshold: score >= 15 OR at least 1 strong entity match
  const isRelevant = score >= 15 || uniqueMatches.some(e =>
    ['tunisia', 'tunisie', 'تونس', 'saied', 'سعيد', 'ugtt'].includes(e.toLowerCase())
  );

  return { isRelevant, score, matchedEntities: uniqueMatches, confidence };
}
