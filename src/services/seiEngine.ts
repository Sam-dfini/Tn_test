/**
 * TunisiaIntel — Shortage Escalation Index (SEI) Engine
 *
 * Converts raw shortage detection (what exists) into phase
 * classification (where in the escalation cycle) and time-to-anger
 * prediction.
 *
 * The six-phase model:
 *   1 EARLY_STRESS      → price rise + rumors, SEI 0.1-0.30
 *   2 DENIAL            → official reassurance, SEI 0.30-0.50
 *   3 ACCELERATION      → visible supply drop, SEI 0.50-0.65
 *   4 INTERVENTION      → state action (price controls, raids), SEI 0.65-0.75
 *   5 DISTORTION        → black market, trust collapse, SEI 0.75-0.87
 *   6 ANGER_IGNITION    → viral content, local protests, SEI 0.87-1.0
 *
 * Feeds into:
 *   EQ.3  S(t) — food salience boost (food = universal, daily)
 *   EQ.13 ε(t) — shortage shock injection
 *   EQ.15 CS   — new pair: SEI × A01 (inflation)
 *   EQ.17      — cascade probability boost (interior govs)
 *   SmartAlert — food-anger-window compound trigger
 */

import { Article } from '../lib/supabase';
import { calculateSEI } from '../math/economic';
import {
  ShortageSignal, ShortageType,
  detectShortagesInArticles,
} from './shortageDetector';

// ── Types ──────────────────────────────────────────────────────

export type EscalationPhase =
  | 1  // Early stress
  | 2  // Denial / Reassurance
  | 3  // Acceleration
  | 4  // Intervention
  | 5  // Distortion
  | 6; // Anger Ignition

export interface CommodityEscalation {
  type: ShortageType;
  phase: EscalationPhase;
  sei: number;               // 0-1 Shortage Escalation Index
  seiDelta: number;          // change since last computation
  priceVolatility: number;   // 0-1 estimated from article density delta
  stateInterventionDetected: boolean;
  blackMarketDetected: boolean;
  angerSignalsDetected: boolean;
  governoratesActive: string[];
  timeToAngerDays: number | null; // null if already at anger phase
  interventionStillEffective: boolean; // false at Phase 4+
  articleCount: number;
  keyPhrases: string[];
  detectedAt: number;
}

export interface SEIResult {
  commodities: CommodityEscalation[];
  dominantPhase: EscalationPhase;
  maxSEI: number;             // highest SEI across all commodities
  compoundTrigger: boolean;   // SEI > 0.70 AND inflation high AND secondary stress
  compoundScore: number;      // 0-1 compound anger window probability
  angerWindowAlert: boolean;  // fires when compound conditions met
  angerWindowMessage: string;

  // Equation modifiers
  sei_salience_boost: number;   // added to EQ.3 numerator
  sei_shock_magnitude: number;  // injected as ε(t) event weight
  sei_cascade_boost: number;    // added to EQ.17 cascade probability
  sei_cs_pair_value: number;    // SEI value for EQ.15 CS pair with A01

  detectedAt: number;
  windowHours: number;
}

// ── Phase detection lexicons ────────────────────────────────────

// Phase 2 — DENIAL: official reassurance language
const DENIAL_PHRASES: string[] = [
  // French
  'sous contrôle', 'situation maîtrisée', 'pas de pénurie',
  'approvisionnement normal', 'stocks suffisants',
  'rassurer', 'spéculateurs responsables', 'intermédiaires',
  'mesures prises', 'prix va baisser', 'transitoire',
  // Arabic
  'تحت السيطرة', 'الوضع تحت السيطرة', 'لا نقص', 'المخزون كافٍ',
  'المضاربون', 'الوسطاء مسؤولون', 'الوضع مؤقت',
  'الحكومة تطمئن', 'ستنخفض الأسعار',
  // English
  'under control', 'no shortage', 'sufficient stocks',
  'speculators to blame', 'temporary situation',
  'government reassures',
];

// Phase 3 — ACCELERATION: visible supply collapse
const ACCELERATION_PHRASES: string[] = [
  // French
  'file d\'attente', 'rayon vide', 'introuvable',
  'prix explose', 'flambée des prix', 'rupture de stock',
  'pénurie s\'aggrave', 'queue interminable',
  'marché dépourvu', 'commerce fermé', 'plus disponible',
  // Arabic
  'طابور', 'رف فارغ', 'مفقود من الأسواق', 'غير متوفر',
  'ارتفاع حاد', 'انهيار العرض', 'أزمة حادة',
  'طوابير طويلة', 'السوق خالٍ', 'اختفى من المحلات',
  // English
  'queue', 'empty shelves', 'not available', 'price spike',
  'supply collapse', 'shortage worsens', 'out of stock',
];

// Phase 4 — INTERVENTION: state action
const INTERVENTION_PHRASES: string[] = [
  // French
  'saisie', 'confiscation', 'contrôle des prix',
  'descente police', 'intervention', 'fermeture magasin',
  'arrêté préfectoral', 'forces de l\'ordre marché',
  'gel des prix', 'taxation', 'réquisition',
  // Arabic
  'مصادرة', 'ضبط الأسعار', 'تدخل الشرطة', 'حملة أسواق',
  'تجميد الأسعار', 'إغلاق محل', 'قرار والٍ',
  'تدخل الحكومة', 'حملة تفتيش', 'ضبط المضاربين',
  // English
  'confiscation', 'price controls', 'police raid', 'market raid',
  'price freeze', 'government intervention', 'shop closure',
];

// Phase 5 — DISTORTION: black market + trust collapse
const DISTORTION_PHRASES: string[] = [
  // French
  'marché noir', 'marché informel', 'sous le manteau',
  'prix double', 'revendeur illégal', 'système D',
  'détournement', 'corruption approvisionnement',
  'confiance perdue', 'état ne contrôle plus',
  // Arabic
  'السوق السوداء', 'سوق غير رسمي', 'تحت الطاولة',
  'سعر مضاعف', 'باعة غير شرعيين', 'تلاعب بالتوزيع',
  'فساد في التوزيع', 'انهار ثقة', 'الدولة فقدت السيطرة',
  // English
  'black market', 'informal market', 'under the table',
  'double price', 'illegal resellers', 'distribution corruption',
  'trust collapsed', 'state lost control',
];

// Phase 6 — ANGER IGNITION: viral + protest + frame "state failing"
const ANGER_IGNITION_PHRASES: string[] = [
  // French
  'vidéo virale', 'émeute', 'altercation marché',
  'colère populaire', 'l\'état défaille', 'ras le bol',
  'on ne peut plus', 'les gens se révoltent',
  'affrontements', 'blocage route', 'incendie marché',
  // Arabic
  'فيديو ينتشر', 'اشتباكات السوق', 'غضب شعبي',
  'الدولة فاشلة', 'لقد فاض الكيل', 'لا يمكن الاستمرار',
  'الناس ثائرون', 'اعتراض الطريق', 'حريق السوق',
  'مواجهات', 'احتجاج أمام السوق',
  // English
  'viral video', 'market riot', 'market altercation',
  'popular anger', 'state is failing', 'enough is enough',
  'people are revolting', 'road block', 'market fire',
];

// ── Phase Scorer ───────────────────────────────────────────────

function detectPhaseSignals(articles: Article[], shortageType: ShortageType): {
  denial: number;
  acceleration: number;
  intervention: number;
  distortion: number;
  angerIgnition: number;
  stateIntervention: boolean;
  blackMarket: boolean;
  angerSignals: boolean;
  keyPhrases: string[];
} {
  const keyPhrases: string[] = [];

  const texts = articles.map(a =>
    (a.title + ' ' + (a.content || a.summary || '')).toLowerCase()
  );

  const countPhrases = (phrases: string[], maxSample = 2): number => {
    let count = 0;
    let sampled = 0;
    for (const text of texts) {
      for (const phrase of phrases) {
        if (text.includes(phrase.toLowerCase())) {
          count++;
          if (sampled < maxSample) {
            keyPhrases.push(`"${phrase}"`);
            sampled++;
          }
        }
      }
    }
    return count;
  };

  const denialCount = countPhrases(DENIAL_PHRASES);
  const accelCount = countPhrases(ACCELERATION_PHRASES);
  const interventionCount = countPhrases(INTERVENTION_PHRASES);
  const distortionCount = countPhrases(DISTORTION_PHRASES);
  const angerCount = countPhrases(ANGER_IGNITION_PHRASES);

  return {
    denial: Math.min(1, denialCount / 3),
    acceleration: Math.min(1, accelCount / 4),
    intervention: Math.min(1, interventionCount / 3),
    distortion: Math.min(1, distortionCount / 3),
    angerIgnition: Math.min(1, angerCount / 3),
    stateIntervention: interventionCount >= 2,
    blackMarket: distortionCount >= 2,
    angerSignals: angerCount >= 2,
    keyPhrases: [...new Set(keyPhrases)].slice(0, 6),
  };
}

// ── SEI Calculator ─────────────────────────────────────────────

function computeSEI(
  shortage: ShortageSignal,
  phaseSignals: ReturnType<typeof detectPhaseSignals>
): number {
  return calculateSEI({
    severityBase: shortage.severity * 0.10,
    denial: phaseSignals.denial,
    acceleration: phaseSignals.acceleration,
    intervention: phaseSignals.intervention,
    distortion: phaseSignals.distortion,
    angerIgnition: phaseSignals.angerIgnition,
    densityBoost: Math.min(0.15, shortage.articleCount * 0.015)
  });
}

// ── Phase Classifier from SEI ──────────────────────────────────

function classifyPhase(
  sei: number,
  signals: ReturnType<typeof detectPhaseSignals>
): EscalationPhase {
  // Direct phase signal override (most specific)
  if (signals.angerSignals) return 6;
  if (signals.blackMarket) return 5;
  if (signals.stateIntervention) return 4;

  // SEI-based fallback
  if (sei >= 0.87) return 6;
  if (sei >= 0.75) return 5;
  if (sei >= 0.65) return 4;
  if (sei >= 0.50) return 3;
  if (sei >= 0.30) return 2;
  return 1;
}

// ── Time-to-Anger Estimator ────────────────────────────────────

function estimateTimeToAnger(
  phase: EscalationPhase,
  sei: number,
  seiDelta: number
): number | null {
  if (phase >= 6) return null; // already there

  // Base days by phase
  const baseDays: Record<EscalationPhase, number> = {
    1: 30, 2: 21, 3: 14, 4: 10, 5: 5, 6: 0
  };

  let days = baseDays[phase];

  // Accelerate if SEI rising fast
  if (seiDelta > 0.10) days = Math.round(days * 0.6);
  else if (seiDelta > 0.05) days = Math.round(days * 0.8);

  // Interior governorate = faster
  // (handled at compound level)

  return Math.max(1, days);
}

// ── Previous SEI tracking ──────────────────────────────────────

const _previousSEI: Record<string, number> = {};

// ── Main Analysis Function ─────────────────────────────────────

export function analyzeSEI(
  articles: Article[],
  windowHours: number = 72,
  inflationRate: number = 7.1,   // from pipeline data.economy.inflation
  waterStressActive: boolean = false,
  electricityStressActive: boolean = false
): SEIResult {

  // Run base shortage detection
  const { shortages, compoundScores } = detectShortagesInArticles(
    articles, windowHours
  );

  if (!shortages.length) {
    return {
      commodities: [],
      dominantPhase: 1,
      maxSEI: 0,
      compoundTrigger: false,
      compoundScore: 0,
      angerWindowAlert: false,
      angerWindowMessage: 'No active shortage signals detected.',
      sei_salience_boost: 0,
      sei_shock_magnitude: 0,
      sei_cascade_boost: 0,
      sei_cs_pair_value: 0,
      detectedAt: Date.now(),
      windowHours,
    };
  }

  // Analyze each detected shortage
  const commodities: CommodityEscalation[] = [];

  for (const shortage of shortages) {
    // Filter articles mentioning this shortage type
    const relevantArticles = articles.filter(a => {
      const text = (a.title + ' ' + (a.content || a.summary || '')).toLowerCase();
      // Check if article is about this shortage type
      return text.includes(shortage.type.toLowerCase()) ||
        (shortage.type === 'chicken' &&
          (text.includes('poulet') || text.includes('دجاج'))) ||
        (shortage.type === 'butane' &&
          (text.includes('butane') || text.includes('بوطان'))) ||
        (shortage.type === 'water' &&
          (text.includes('eau') || text.includes('ماء') || text.includes('مياه')));
    });

    const phaseSignals = detectPhaseSignals(relevantArticles, shortage.type);
    const sei = computeSEI(shortage, phaseSignals);
    const phase = classifyPhase(sei, phaseSignals);
    const prevSEI = _previousSEI[shortage.type] ?? sei;
    const seiDelta = sei - prevSEI;
    _previousSEI[shortage.type] = sei;

    const govs = shortage.governorate ? [shortage.governorate] : [];

    commodities.push({
      type: shortage.type,
      phase,
      sei,
      seiDelta,
      priceVolatility: Math.min(1, shortage.articleCount * 0.08),
      stateInterventionDetected: phaseSignals.stateIntervention,
      blackMarketDetected: phaseSignals.blackMarket,
      angerSignalsDetected: phaseSignals.angerSignals,
      governoratesActive: govs,
      timeToAngerDays: estimateTimeToAnger(phase, sei, seiDelta),
      interventionStillEffective: phase <= 3,
      articleCount: shortage.articleCount,
      keyPhrases: phaseSignals.keyPhrases,
      detectedAt: Date.now(),
    });
  }

  // Sort by SEI descending
  commodities.sort((a, b) => b.sei - a.sei);

  const maxSEI = commodities[0]?.sei ?? 0;
  const dominantPhase = commodities[0]?.phase ?? 1;

  // ── Compound Trigger Logic ──────────────────────────────────
  // Non-linear: three stresses together = qualitatively different

  const foodSEI = Math.max(
    ...commodities
      .filter(c => ['chicken','meat','milk','sugar','oil','flour'].includes(c.type))
      .map(c => c.sei),
    0
  );

  const inflationHigh = inflationRate > 7.0;
  const secondaryStress = waterStressActive || electricityStressActive;

  // Base compound score
  let compoundScore = foodSEI * 0.50;

  // Inflation multiplier
  if (inflationHigh) {
    compoundScore += 0.20;
    if (inflationRate > 9.0) compoundScore += 0.10; // extra for severe inflation
  }

  // Secondary stress multiplier
  if (secondaryStress) {
    compoundScore += 0.15;
    if (waterStressActive && electricityStressActive) compoundScore += 0.10; // both = worse
  }

  // Interior governorate active (faster anger, higher vulnerability)
  const interiorActive = commodities.some(c =>
    c.governoratesActive.some(g =>
      ['kasserine', 'gafsa', 'sidi-bouzid', 'tataouine', 'medenine'].includes(g.toLowerCase())
    )
  );
  if (interiorActive) compoundScore += 0.10;

  compoundScore = Math.min(1, compoundScore);
  const compoundTrigger = foodSEI > 0.70 && inflationHigh;
  const angerWindowAlert = compoundTrigger && compoundScore > 0.65;

  // Anger window message
  let angerWindowMessage = '';
  if (angerWindowAlert) {
    const topCommodity = commodities.find(c =>
      ['chicken','meat','milk','sugar','oil','flour'].includes(c.type)
    ) || commodities[0];
    const daysStr = topCommodity?.timeToAngerDays
      ? `within ${topCommodity.timeToAngerDays}-${topCommodity.timeToAngerDays + 7} days`
      : 'imminent';
    angerWindowMessage =
      `${topCommodity?.type.toUpperCase()} crisis Phase ${topCommodity?.phase} · ` +
      `SEI ${(topCommodity?.sei ?? 0).toFixed(2)} · ` +
      `Compound: inflation ${inflationRate.toFixed(1)}%` +
      (waterStressActive ? ' + water stress' : '') +
      (electricityStressActive ? ' + electricity stress' : '') +
      ` · Civil anger ignition probable ${daysStr}.`;
  } else if (compoundTrigger) {
    angerWindowMessage =
      `Food SEI elevated (${foodSEI.toFixed(2)}) with high inflation. ` +
      `Compound score: ${(compoundScore * 100).toFixed(0)}%. Monitor secondary stresses.`;
  } else if (maxSEI > 0.50) {
    angerWindowMessage =
      `Commodity stress escalating (SEI ${maxSEI.toFixed(2)}). ` +
      `Watch for compound triggers: inflation threshold 7%, secondary utility stress.`;
  } else {
    angerWindowMessage = `Commodity monitoring active. Current SEI below alert threshold.`;
  }

  // ── Equation modifiers ──────────────────────────────────────

  // EQ.3 S(t): food salience boost
  // Food = universal daily exposure → high emotional load
  // Add to salience numerator: 0.05 at SEI=0.5, 0.15 at SEI=1.0
  const sei_salience_boost = Math.max(0, maxSEI - 0.3) * 0.20;

  // EQ.13 ε(t): shortage shock
  // Injected as a shock event when phase >= 4
  const sei_shock_magnitude = dominantPhase >= 4
    ? maxSEI * 0.08  // up to 0.08 shock at SEI=1.0
    : dominantPhase >= 3
    ? maxSEI * 0.04
    : 0;

  // EQ.17 cascade: food stress in interior govs boosts cascade probability
  const sei_cascade_boost = interiorActive
    ? maxSEI * 0.12  // up to 0.12 cascade boost
    : maxSEI * 0.06;

  // EQ.15 CS: SEI value for compound stress pair with A01 (inflation)
  const sei_cs_pair_value = maxSEI;

  return {
    commodities,
    dominantPhase,
    maxSEI,
    compoundTrigger,
    compoundScore,
    angerWindowAlert,
    angerWindowMessage,
    sei_salience_boost,
    sei_shock_magnitude,
    sei_cascade_boost,
    sei_cs_pair_value,
    detectedAt: Date.now(),
    windowHours,
  };
}

// ── For pipeline injection (single scalar) ─────────────────────

export function computeSEIScore(
  articles: Article[],
  inflationRate: number = 7.1
): number {
  const result = analyzeSEI(articles, 72, inflationRate);
  return result.maxSEI;
}

// ── Phase config for UI ────────────────────────────────────────

export const SEI_PHASE_CONFIG: Record<EscalationPhase, {
  label: string;
  color: string;
  bg: string;
  border: string;
  description: string;
  intervention: string;
  seiRange: string;
}> = {
  1: {
    label: 'Early Stress',
    color: 'text-intel-cyan',
    bg: 'bg-intel-cyan/5',
    border: 'border-intel-cyan/20',
    description: 'Slight price increase. Rumors circulating. Social media complaints beginning.',
    intervention: 'Monitor. Price watch. No public intervention needed.',
    seiRange: '0.10 – 0.30',
  },
  2: {
    label: 'Denial / Reassurance',
    color: 'text-slate-400',
    bg: 'bg-slate-800/40',
    border: 'border-slate-700',
    description: 'Government denies crisis. Blames speculators. Official statements detected.',
    intervention: 'Watch: denial is an escalation signal. Price controls likely imminent.',
    seiRange: '0.30 – 0.50',
  },
  3: {
    label: 'Acceleration',
    color: 'text-yellow-500',
    bg: 'bg-yellow-500/5',
    border: 'border-yellow-500/20',
    description: 'Prices spike sharply. Supply visibly drops. Queues forming. Empty shelves.',
    intervention: 'Urgent: address supply chain directly. State intervention window closing.',
    seiRange: '0.50 – 0.65',
  },
  4: {
    label: 'Intervention',
    color: 'text-intel-orange',
    bg: 'bg-intel-orange/5',
    border: 'border-intel-orange/30',
    description: 'Price controls, confiscations, police market raids. State acting.',
    intervention: 'Critical: intervention often worsens shortage. Black market forming. Monitor.',
    seiRange: '0.65 – 0.75',
  },
  5: {
    label: 'Distortion',
    color: 'text-intel-red',
    bg: 'bg-intel-red/8',
    border: 'border-intel-red/40',
    description: 'Black market active. Prices doubled. Trust in state supply chain collapsed.',
    intervention: 'Late: supply normalization only solution. Political anger 5-10 days out.',
    seiRange: '0.75 – 0.87',
  },
  6: {
    label: 'Anger Ignition',
    color: 'text-intel-red',
    bg: 'bg-intel-red/15',
    border: 'border-intel-red/60',
    description: 'Viral videos. Local confrontations. "State is failing" narrative dominant.',
    intervention: 'Crisis: political response required. Protest event imminent.',
    seiRange: '0.87 – 1.00',
  },
};
