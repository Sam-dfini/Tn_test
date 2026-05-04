import { Article } from '../lib/supabase';
import { SHORTAGE_DICTIONARY, ENERGY_SHOCK_DICTIONARY } from '../config/dictionary';
import { getMatches } from '../utils/featureUtils';

// ── Shortage Types ─────────────────────────────────────────────

export type ShortageType =
  | 'butane'
  | 'electricity'
  | 'water'
  | 'chicken'
  | 'meat'
  | 'milk'
  | 'sugar'
  | 'coffee'
  | 'oil'
  | 'flour'
  | 'fuel'
  | 'medicine';

export type EnergyShockType =
  | 'global_oil_price'
  | 'regional_conflict'
  | 'steg_tariff'
  | 'subsidy_cut'
  | 'import_disruption';

export interface ShortageSignal {
  type: ShortageType;
  governorate?: string;       // null = national
  severity: 1 | 2 | 3 | 4 | 5;
  articleCount: number;       // how many articles mention it
  firstDetected: number;      // timestamp
  lastSeen: number;
  confirmedByCitizen: boolean;
  rriNudge: number;           // impact on R(t)
  rriVariable: string;
}

export interface GovernorateShortageProfile {
  governorateId: string;
  governorateName: string;
  activeShortages: ShortageType[];
  compoundScore: number;      // 0-100
  riskLevel: 'critical' | 'high' | 'medium' | 'low';
  lastUpdated: number;
}

export interface EnergyShockSignal {
  type: EnergyShockType;
  source: string;
  headline: string;
  estimatedTunisiaImpactDays: number;  // lag until local impact
  severity: 1 | 2 | 3;
  detectedAt: number;
}

// ── Keyword Dictionaries ───────────────────────────────────────

/**
 * detectShortages
 * Scans article content for shortage signals using unified dictionary.
 */
function detectShortages(content: string): ShortageType[] {
  return getMatches(content, SHORTAGE_DICTIONARY as any) as ShortageType[];
}

/**
 * detectEnergyShocks
 * Scans for global energy events using unified dictionary.
 */
function detectEnergyShocks(content: string): EnergyShockType[] {
  return getMatches(content, ENERGY_SHOCK_DICTIONARY as any) as EnergyShockType[];
}

// ── Seasonal Calendar ──────────────────────────────────────────
// Month 0 = January, 11 = December

export const SEASONAL_MULTIPLIERS: Record<number, Partial<Record<ShortageType | 'all', number>>> = {
  0:  { butane: 1.40, electricity: 1.10, all: 1.05 },  // January - cold peak
  1:  { butane: 1.35, electricity: 1.08 },              // February - still cold
  2:  { chicken: 1.25, meat: 1.30, sugar: 1.20 },       // March - Ramadan (approximate)
  3:  { chicken: 1.30, meat: 1.35, sugar: 1.30, milk: 1.15 }, // April - Ramadan/Eid
  4:  { electricity: 1.05 },                             // May
  5:  { electricity: 1.15, fuel: 1.05 },                 // June - summer begins
  6:  { electricity: 1.35, water: 1.20 },                // July - peak summer
  7:  { electricity: 1.40, water: 1.25, all: 1.10 },    // August - hottest
  8:  { electricity: 1.20, water: 1.10 },                // September
  9:  { fuel: 1.10 },                                    // October
  10: { butane: 1.15, electricity: 1.05 },               // November - cold approaching
  11: { butane: 1.30, electricity: 1.10, all: 1.05 },    // December - winter peak
};

export const getSeasonalMultiplier = (
  shortageType: ShortageType,
  month?: number
): number => {
  const m = month ?? new Date().getMonth();
  const monthMultipliers = SEASONAL_MULTIPLIERS[m] || {};
  return (monthMultipliers[shortageType] as number)
    || (monthMultipliers.all as number)
    || 1.0;
};

// ── Interior governorates (more vulnerable to shortages) ──────
const INTERIOR_GOVS = [
  'kasserine', 'sidi-bouzid', 'gafsa', 'le-kef',
  'siliana', 'jendouba', 'kairouan', 'tozeur', 'kebili',
  'tataouine'
];

const getVulnerabilityMultiplier = (governorateId?: string): number => {
  if (!governorateId) return 1.0;
  return INTERIOR_GOVS.includes(governorateId.toLowerCase()) ? 1.3 : 1.0;
};

// ── Main detection function ────────────────────────────────────
// Call this after fetching RSS articles

export function detectShortagesInArticles(
  articles: Article[],
  windowHours: number = 48
): {
  shortages: ShortageSignal[];
  energyShocks: EnergyShockSignal[];
  compoundScores: Record<string, number>;
} {
  const now = Date.now();
  const windowMs = windowHours * 60 * 60 * 1000;
  const recentArticles = articles.filter(
    a => now - new Date(a.published_at).getTime() < windowMs
  );

  // Track shortage mentions per type per governorate
  const shortageMap: Map<string, {
    count: number;
    firstAt: number;
    govs: Set<string>;
    articles: string[];
  }> = new Map();

  const energyShocks: EnergyShockSignal[] = [];

  for (const article of recentArticles) {
    const text = [
      article.title,
      article.summary || '',
      article.content || '',
    ].join(' ').toLowerCase();

    // Check shortage keywords
    for (const [type, config] of Object.entries(SHORTAGE_DICTIONARY)) {
      const typedConfig = config as any;
      const allKws = [...(typedConfig.fr || []), ...(typedConfig.ar || []), ...(typedConfig.en || [])];
      const matches = allKws.filter(kw => text.includes(kw.toLowerCase()));

      if (matches.length >= 1) {
        const key = `${type}:${article.governorate || 'national'}`;
        const existing = shortageMap.get(key) || {
          count: 0,
          firstAt: new Date(article.published_at).getTime(),
          govs: new Set<string>(),
          articles: [],
        };
        existing.count++;
        if (article.governorate) existing.govs.add(article.governorate);
        existing.articles.push(article.id);
        shortageMap.set(key, existing);
      }
    }

    // Check energy shock keywords
    for (const [shockId, config] of Object.entries(ENERGY_SHOCK_DICTIONARY)) {
      const typedConfig = config as any;
      const allKws = [...(typedConfig.en || []), ...(typedConfig.fr || []), ...(typedConfig.ar || [])];
      const matches = allKws.filter(kw => text.includes(kw.toLowerCase()));

      if (matches.length >= 1) {
        // Avoid duplicate shocks
        const existing = energyShocks.find(s => s.type === typedConfig.type);
        if (!existing) {
          energyShocks.push({
            type: typedConfig.type,
            source: article.source_name,
            headline: article.title,
            estimatedTunisiaImpactDays: typedConfig.estimatedLagDays,
            severity: typedConfig.severity,
            detectedAt: new Date(article.published_at).getTime(),
          });
        }
      }
    }
  }

  // Convert shortageMap to ShortageSignal array
  const shortages: ShortageSignal[] = [];

  for (const [key, data] of shortageMap.entries()) {
    const [type, gov] = key.split(':');
    if (data.count < 1) continue;  // needs at least 1 mention

    const config = (SHORTAGE_DICTIONARY as any)[type as ShortageType];
    if (!config) continue;

    const seasonal = getSeasonalMultiplier(type as ShortageType);
    const vulnerability = getVulnerabilityMultiplier(
      gov !== 'national' ? gov : undefined
    );

    // Severity based on article count × seasonal × vulnerability
    const rawSeverity = data.count * seasonal * vulnerability;
    const severity = Math.min(5, Math.max(1,
      Math.ceil(rawSeverity)
    )) as 1 | 2 | 3 | 4 | 5;

    shortages.push({
      type: type as ShortageType,
      governorate: gov !== 'national' ? gov : undefined,
      severity,
      articleCount: data.count,
      firstDetected: data.firstAt,
      lastSeen: now,
      confirmedByCitizen: false,
      rriNudge: config.weight * seasonal * vulnerability * (data.count * 0.5),
      rriVariable: config.rriVariable,
    });
  }

  // Compute compound shortage scores per governorate
  const compoundScores: Record<string, number> = {};

  shortages.forEach(s => {
    const gov = s.governorate || 'national';
    compoundScores[gov] = (compoundScores[gov] || 0) +
      s.severity * 10 *
      getSeasonalMultiplier(s.type) *
      getVulnerabilityMultiplier(s.governorate);
  });

  // Normalize to 0-100
  const maxScore = Math.max(...Object.values(compoundScores), 1);
  for (const gov of Object.keys(compoundScores)) {
    compoundScores[gov] = Math.min(
      100, Math.round((compoundScores[gov] / maxScore) * 100)
    );
  }

  return { shortages, energyShocks, compoundScores };
}

// ── Build governorate shortage profiles ───────────────────────

export function buildShortageProfiles(
  shortages: ShortageSignal[],
  compoundScores: Record<string, number>,
  governorates: any[]
): GovernorateShortageProfile[] {
  return governorates.map(gov => {
    const govShortages = shortages.filter(
      s => !s.governorate || s.governorate === gov.id
    );

    const activeTypes = [...new Set(govShortages.map(s => s.type))];
    const score = compoundScores[gov.id] || 0;

    const riskLevel =
      score >= 70 ? 'critical' :
      score >= 40 ? 'high' :
      score >= 20 ? 'medium' :
      'low';

    return {
      governorateId: gov.id,
      governorateName: gov.name?.en || gov.id,
      activeShortages: activeTypes,
      compoundScore: score,
      riskLevel,
      lastUpdated: Date.now(),
    };
  });
}

// ── Seasonal forecast ──────────────────────────────────────────
// Tells analyst what to watch in the coming weeks

export function getSeasonalForecast(): Array<{
  type: ShortageType;
  warning: string;
  timeframe: string;
  priority: 'high' | 'medium' | 'low';
}> {
  const month = new Date().getMonth();
  const forecasts: Array<{
    type: ShortageType;
    warning: string;
    timeframe: string;
    priority: 'high' | 'medium' | 'low';
  }> = [];

  // Next 6 weeks forecast
  for (let offset = 0; offset <= 6; offset++) {
    const futureMonth = (month + Math.floor(offset / 4)) % 12;
    const multipliers = SEASONAL_MULTIPLIERS[futureMonth] || {};

    for (const [type, mult] of Object.entries(multipliers)) {
      if (type === 'all') continue;
      if ((mult as number) >= 1.25) {
        forecasts.push({
          type: type as ShortageType,
          warning: `${type} stress elevated ${Math.round(((mult as number) - 1) * 100)}% above baseline`,
          timeframe: offset === 0 ? 'This week' : `~${offset} weeks`,
          priority: (mult as number) >= 1.35 ? 'high' : 'medium',
        });
      }
    }
  }

  // Deduplicate
  const seen = new Set<string>();
  return forecasts.filter(f => {
    const key = f.type + f.timeframe;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
