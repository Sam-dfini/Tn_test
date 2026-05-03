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
  { id: 'google-news-tunisia', name: 'Google News Tunisia', url: 'https://news.google.com/rss/search?q=Tunisia&hl=en-US&gl=US&ceid=US:en', language: 'en', reliability: 'A', alignment: 'NEUTRAL', keywords: ['Tunisia'], status: 'healthy', type: 'rss', category: 'general', geo_weight: 0.7 },
  { id: 'google-news-tunisie', name: 'Google News Tunisie', url: 'https://news.google.com/rss/search?q=Tunisie&hl=fr&gl=FR&ceid=FR:fr', language: 'fr', reliability: 'A', alignment: 'NEUTRAL', keywords: ['Tunisie'], status: 'healthy', type: 'rss', category: 'general', geo_weight: 0.7 },
  { id: 'kapitalis', name: 'Kapitalis', url: 'https://kapitalis.com/tunisie/feed/', language: 'fr', reliability: 'B', alignment: 'NEUTRAL', keywords: ['Tunisie'], status: 'healthy', type: 'rss', category: 'general', geo_weight: 1.0 },
  { id: 'africanmanager', name: 'African Manager', url: 'https://africanmanager.com/feed/', language: 'fr', reliability: 'B', alignment: 'NEUTRAL', keywords: ['Tunisie'], status: 'healthy', type: 'rss', category: 'economy', geo_weight: 1.0 },
  { id: 'realites', name: 'Realites', url: 'https://realites.com.tn/fr/feed/', language: 'fr', reliability: 'B', alignment: 'NEUTRAL', keywords: ['Tunisie'], status: 'healthy', type: 'rss', category: 'general', geo_weight: 1.0 },
  { id: 'nawaat', name: 'Nawaat', url: 'https://nawaat.org/feed/', language: 'ar', reliability: 'A', alignment: 'CRITICAL', keywords: ['تونس'], status: 'healthy', type: 'rss', category: 'politics', geo_weight: 1.0 },
  { id: 'wmc-tunisie', name: 'WebManagerCenter Tunisie', url: 'https://news.google.com/rss/search?q=site:webmanagercenter.com+tunisie&hl=fr&gl=FR&ceid=FR:fr', language: 'fr', reliability: 'B', alignment: 'NEUTRAL', keywords: ['Tunisie'], status: 'healthy', type: 'rss', category: 'economy', geo_weight: 1.0 },
  { id: 'tunisie-soir', name: 'Tunisie Soir', url: 'https://tunisiesoir.com/feed/', language: 'fr', reliability: 'B', alignment: 'NEUTRAL', keywords: ['Tunisie'], status: 'healthy', type: 'rss', category: 'general', geo_weight: 1.0 },
  { id: 'webdo', name: 'Webdo Tunisie', url: 'https://news.google.com/rss/search?q=site:webdo.tn+tunisie&hl=fr&gl=FR&ceid=FR:fr', language: 'fr', reliability: 'B', alignment: 'NEUTRAL', keywords: ['Tunisie'], status: 'healthy', type: 'rss', category: 'general', geo_weight: 1.0 },
  { id: 'espacemanager', name: 'Espace Manager', url: 'https://www.espacemanager.com/feed/', language: 'fr', reliability: 'B', alignment: 'NEUTRAL', keywords: ['Tunisie'], status: 'healthy', type: 'rss', category: 'economy', geo_weight: 1.0 },
  { id: 'tuniscope', name: 'Tuniscope', url: 'https://news.google.com/rss/search?q=site:tuniscope.com+tunisie&hl=fr&gl=FR&ceid=FR:fr', language: 'fr', reliability: 'B', alignment: 'NEUTRAL', keywords: ['Tunisie'], status: 'healthy', type: 'rss', category: 'general', geo_weight: 1.0 },
  { id: 'babnet', name: 'Babnet', url: 'https://www.babnet.net/rss.php', language: 'ar', reliability: 'B', alignment: 'NEUTRAL', keywords: ['تونس'], status: 'healthy', type: 'rss', category: 'general', geo_weight: 1.0 },
  { id: 'lapresse', name: 'La Presse', url: 'https://lapresse.tn/feed/', language: 'fr', reliability: 'A', alignment: 'PRO_GOV', keywords: ['Tunisie'], status: 'healthy', type: 'rss', category: 'general', geo_weight: 1.0 },
  { id: 'france24-en', name: 'France 24 EN', url: 'https://www.france24.com/en/africa/rss', language: 'en', reliability: 'A', alignment: 'NEUTRAL', keywords: ['Tunisia'], status: 'healthy', type: 'rss', category: 'general', geo_weight: 0.3 },
  { id: 'france24-fr', name: 'France 24 FR', url: 'https://www.france24.com/fr/afrique/rss', language: 'fr', reliability: 'A', alignment: 'NEUTRAL', keywords: ['Tunisie'], status: 'healthy', type: 'rss', category: 'general', geo_weight: 0.3 },
  { id: 'aljazeera-all', name: 'Al Jazeera All', url: 'https://www.aljazeera.com/xml/rss/all.xml', language: 'en', reliability: 'B', alignment: 'CRITICAL', keywords: ['Tunisia'], status: 'healthy', type: 'rss', category: 'general', geo_weight: 0.2 },
  { id: 'alarabiya-en', name: 'Al Arabiya EN', url: 'https://news.google.com/rss/search?q=site:english.alarabiya.net+tunisia&hl=en-US&gl=US&ceid=US:en', language: 'en', reliability: 'B', alignment: 'NEUTRAL', keywords: ['Tunisia'], status: 'healthy', type: 'rss', category: 'general', geo_weight: 0.2 },
  { id: 'alhadath-ar', name: 'Al Hadath AR', url: 'https://news.google.com/rss/search?q=site:alhadath.net+تونس&hl=ar&gl=AE&ceid=AE:ar', language: 'ar', reliability: 'B', alignment: 'NEUTRAL', keywords: ['تونس'], status: 'healthy', type: 'rss', category: 'general', geo_weight: 0.2 },
  { id: 'allafrica-tun', name: 'All Africa Tunis', url: 'https://allafrica.com/tools/headlines/rdf/tunisia/headlines.rdf', language: 'en', reliability: 'B', alignment: 'NEUTRAL', keywords: ['Tunisia'], status: 'healthy', type: 'rss', category: 'general', geo_weight: 0.3 },
  { id: 'apanews-tn', name: 'APA News Tunisie', url: 'https://news.google.com/rss/search?q=site:apanews.net+tunisie&hl=fr&gl=FR&ceid=FR:fr', language: 'fr', reliability: 'B', alignment: 'NEUTRAL', keywords: ['Tunisie'], status: 'healthy', type: 'rss', category: 'general', geo_weight: 0.3 },
  { id: 'bbc-africa', name: 'BBC Africa', url: 'http://feeds.bbci.co.uk/news/world/africa/rss.xml', language: 'en', reliability: 'A', alignment: 'NEUTRAL', keywords: ['Tunisia'], status: 'healthy', type: 'rss', category: 'general', geo_weight: 0.2 },
  { id: 'mosaique-fr', name: 'Mosaique FM', url: 'http://www.mosaiquefm.net/fr/rss', language: 'fr', reliability: 'B', alignment: 'NEUTRAL', keywords: ['Tunisie'], status: 'healthy', type: 'rss', category: 'general', geo_weight: 1.0 },
  { id: 'jeuneafrique', name: 'Jeune Afrique', url: 'https://www.jeuneafrique.com/feed/', language: 'fr', reliability: 'A', alignment: 'NEUTRAL', keywords: ['Tunisie'], status: 'healthy', type: 'rss', category: 'general', geo_weight: 0.3 },
  { id: 'lemonde-tn', name: 'Le Monde Tunisie', url: 'https://www.lemonde.fr/tunisie/rss_full.xml', language: 'fr', reliability: 'A', alignment: 'NEUTRAL', keywords: ['Tunisie'], status: 'healthy', type: 'rss', category: 'general', geo_weight: 0.3 },
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
