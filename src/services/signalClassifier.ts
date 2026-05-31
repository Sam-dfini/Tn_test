/**
 * TunisiaIntel — Signal Classification Engine
 *
 * Translates incoming articles into structured intelligence signals.
 * The sensemaking layer between raw RSS and the model.
 *
 * For each article, produces:
 *   - Signal type (SYSTEM_SHOCK / SIGNAL / NOISE)
 *   - Actor attribution (GOV / OPPOSITION / EXTERNAL / UNKNOWN)
 *   - Intent (CONTROL / DISTRACT / MOBILIZE / DIVIDE / INFORM)
 *   - Hidden objective (plain language from Gov Agent + ETM context)
 *   - Model impact (equations affected, ε(t) magnitude, variable nudges)
 *   - Prediction match (was this predicted by Gov Agent?)
 *
 * The key insight: the platform already knows things about each article
 * (bias_alignment, propaganda_score, category, severity, keywords).
 * This engine combines that knowledge with the Gov Agent's predicted
 * actions to produce: "This is what happened, who did it, why, and
 * what it means for the model."
 */

import { Article } from '../lib/supabase';
import {
  SHOCK_TAXONOMY, ShockEvent, ShockEventType,
  detectShocksFromArticles,
} from './intelligenceBrief';
import {
  GovAgentAssessment, RegimeActionType,
} from './govAgent';

// ── Types ──────────────────────────────────────────────────────

export type SignalTier = 'SYSTEM_SHOCK' | 'SIGNAL' | 'NOISE';

export type ActorAttribution =
  | 'REGIME'         // Government / security apparatus action
  | 'OPPOSITION'     // Opposition parties, civil society, UGTT
  | 'EXTERNAL'       // International actors, foreign media
  | 'CITIZEN'        // Bottom-up, organic public reaction
  | 'UNKNOWN';       // Insufficient evidence to attribute

export type IntentType =
  | 'CONTROL'        // Regime: information control, suppression
  | 'DISTRACT'       // Regime: legitimacy displacement
  | 'REPRESS'        // Regime: direct suppression action
  | 'MOBILIZE'       // Opposition: organizing, calling to action
  | 'DIVIDE'         // Any actor: fragmentation of opposition
  | 'PRESSURE'       // External: diplomatic or financial pressure
  | 'DOCUMENT'       // Civil society: recording, witnessing
  | 'INFORM'         // Neutral information sharing
  | 'EXPLOIT';       // Opportunistic framing of existing events

export interface ModelImpact {
  epsilonMagnitude: number;      // ε(t) injection value (0 = no shock)
  epsilonDirection: 1 | -1;      // +1 worsens, -1 improves
  decayDays: number;             // how long the effect lasts
  primaryVariable: string;       // main RRI variable affected
  secondaryVariables: string[];  // others nudged
  affectedEquations: string[];   // which equations change
  estimatedRRIDelta: number;     // rough R(t) change
}

export interface PredictionMatch {
  govActionType: RegimeActionType;
  predictedProbability: number;
  confirmed: boolean;            // this article confirms the predicted action
  matchConfidence: number;       // 0-1 how strong the match is
}

export interface SignalClassification {
  id: string;            // Stable unique ID (usually article.id)
  articleId: string;
  tier: SignalTier;
  tierReason: string;            // why this tier

  // Attribution
  actor: ActorAttribution;
  actorLabel: string;            // plain language: "Regime security apparatus"
  actorConfidence: number;       // 0-1

  // Intent
  intent: IntentType;
  intentLabel: string;           // plain language: "Suppress information environment"
  hiddenObjective: string;       // the deeper strategic purpose

  // Model impact
  shockEvent?: ShockEvent;       // matched Shock Taxonomy entry
  shockEventType?: ShockEventType;
  modelImpact: ModelImpact;

  // Prediction traceability
  predictionMatch?: PredictionMatch;
  confirmsGovAction: boolean;    // shortcut: does this confirm a gov predicted action?

  // Why now
  contextualTiming: string;      // why this event is happening at this moment
  briefRelevance: string;        // one sentence for the intelligence brief

  // Grouping (UI only)
  groupCount?: number;
  groupedArticleIds?: string[];

  // Confidence
  classificationConfidence: number; // 0-1 overall
  classifiedAt: string;
}

// ── Signal Type Resolution ─────────────────────────────────────

function resolveTier(
  severity: number,
  shockEvent: ShockEvent | null,
  category: string,
  geoRelevanceScore: number = 100,
): { tier: SignalTier; reason: string } {

  // ── GEO-RELEVANCE GATE ──────────────────────────────────────────────────
  // Prevents non-Tunisia events from becoming SYSTEM_SHOCK.
  if (geoRelevanceScore < 35) {
    return { tier: 'NOISE', reason: `Geo-relevance too low (score=${geoRelevanceScore})` };
  }
  // BUG 5 FIX: Don't cap severity >= 4 at SIGNAL — allow high-severity to reach SYSTEM_SHOCK
  // ────────────────────────────────────────────────────────────────────────

  // Tier 1: System Shock — relaxed gates
  if (severity >= 4 && shockEvent && shockEvent.epsilon_magnitude >= 0.08) {
    return {
      tier: 'SYSTEM_SHOCK',
      reason: `Severity ${severity} + shock event ε=${shockEvent.epsilon_magnitude.toFixed(2)}`,
    };
  }
  if (shockEvent && shockEvent.epsilon_magnitude >= 0.12) {
    return {
      tier: 'SYSTEM_SHOCK',
      reason: `High-magnitude shock event: ${shockEvent.label}`,
    };
  }
  if (severity >= 5) {
    return { tier: 'SYSTEM_SHOCK', reason: 'Maximum severity event' };
  }

  // Tier 2: Signal
  if (severity >= 3 || (shockEvent && shockEvent.epsilon_magnitude >= 0.05)) {
    return {
      tier: 'SIGNAL',
      reason: severity >= 3
        ? `Severity ${severity} event`
        : `Low-magnitude shock: ${shockEvent?.label}`,
    };
  }
  if (['arrest','protest','political','labor','shortage_food','shortage_butane']
      .includes(category)) {
    return { tier: 'SIGNAL', reason: `High-relevance category: ${category}` };
  }

  // Tier 3: Noise
  return { tier: 'NOISE', reason: 'Low severity, no shock match, general category' };
}

// ── Actor Attribution ──────────────────────────────────────────

function resolveActor(
  article: Article,
  shockEvent: ShockEvent | null
): { actor: ActorAttribution; label: string; confidence: number } {
  const text = (article.title + ' ' + (article.summary || '')).toLowerCase();

  // Regime signals
  if (article.bias_alignment === 'PRO_GOV') {
    if (['SUPPRESSION_TARGETED','SUPPRESSION_BROAD','ANTI_CORRUPTION_ARREST',
         'CONSTITUTIONAL_MOVE','DIGITAL_SUPPRESSION'].some(type =>
      shockEvent?.keywords.some(kw => text.includes(kw.toLowerCase()))
    )) {
      return {
        actor: 'REGIME',
        label: 'Regime security apparatus',
        confidence: 0.82,
      };
    }
    return {
      actor: 'REGIME',
      label: 'Regime / state-aligned media',
      confidence: 0.70,
    };
  }

  // Opposition signals
  if (article.bias_alignment === 'CRITICAL') {
    const oppKeywords = [
      'opposition', 'UGTT', 'syndicat', 'manifestation', 'protestataires',
      'société civile', 'ONG', 'NGO', 'droits humains',
      'المعارضة', 'الاتحاد العام', 'مجتمع مدني', 'حقوق الإنسان'
    ];
    if (oppKeywords.some(kw => text.includes(kw))) {
      return {
        actor: 'OPPOSITION',
        label: 'Opposition / civil society',
        confidence: 0.72,
      };
    }
  }

  // Citizen/organic signals
  const citizenKeywords = [
    'viral', 'virale', 'vidéo', 'témoignage', 'citoyen', 'habitant',
    'fيديو ينتشر', 'شهادات', 'مواطن'
  ];
  if (citizenKeywords.some(kw => text.includes(kw))) {
    return {
      actor: 'CITIZEN',
      label: 'Citizen / organic public reaction',
      confidence: 0.65,
    };
  }

  // External signals
  const externalKeywords = [
    'EU', 'UE', 'United States', 'États-Unis', 'France', 'Germany',
    'IMF', 'FMI', 'World Bank', 'HRW', 'Amnesty', 'RSF',
    'الأمم المتحدة', 'الاتحاد الأوروبي', 'صندوق النقد'
  ];
  if (externalKeywords.some(kw => text.includes(kw))) {
    return {
      actor: 'EXTERNAL',
      label: 'International actor / external pressure',
      confidence: 0.68,
    };
  }

  return {
    actor: 'UNKNOWN',
    label: 'Unknown / unclear attribution',
    confidence: 0.30,
  };
}

// ── Intent Classification ──────────────────────────────────────

function resolveIntent(
  actor: ActorAttribution,
  shockEvent: ShockEvent | null,
  category: string,
  biasAlignment: string,
  biasTone: string,
  propagandaScore: number
): { intent: IntentType; label: string; hiddenObjective: string } {

  // Regime intent patterns
  if (actor === 'REGIME') {
    if (shockEvent?.type === 'journalist_arrest_major' ||
        shockEvent?.type === 'decree54_new_wave' ||
        shockEvent?.type === 'internet_shutdown') {
      return {
        intent: 'CONTROL',
        label: 'Information environment control',
        hiddenObjective: 'Reduce NGO narrative capacity before coordination potential rises. ' +
          'Targeted suppression calibrated to disrupt information flow, not silence all criticism.',
      };
    }
    if (shockEvent?.type === 'anti_corruption_arrest' ||
        category === 'political' && propagandaScore > 0.5) {
      return {
        intent: 'DISTRACT',
        label: 'Legitimacy displacement',
        hiddenObjective: 'Redirect public anger from current economic conditions to historical ' +
          'corruption figures. Classic displacement when inflation/shortage pressure rises.',
      };
    }
    if (shockEvent?.type === 'military_statement' ||
        shockEvent?.type === 'security_apparatus_signal') {
      return {
        intent: 'REPRESS',
        label: 'Deterrence / power display',
        hiddenObjective: 'Raise cost of mobilization before protest density crosses threshold. ' +
          'Physical deterrence signal to interior governorate communities.',
      };
    }
    if (category === 'migration' && biasAlignment === 'PRO_GOV') {
      return {
        intent: 'DISTRACT',
        label: 'Migration lever / audience segmentation',
        hiddenObjective: 'Dual-audience signal: domestic sovereignty credentials + ' +
          'EU dependency reminder. Keeps immigration issue active as opposition splitter (OCI reduction).',
      };
    }
  }

  // Opposition intent patterns
  if (actor === 'OPPOSITION') {
    if (category === 'labor' || category === 'protest') {
      return {
        intent: 'MOBILIZE',
        label: 'Mobilization / coordination',
        hiddenObjective: 'Build protest mass toward UGTT formal action threshold. ' +
          'Each event adds to SIR infected population (β term).',
      };
    }
    if (category === 'rights' || category === 'arrest') {
      return {
        intent: 'DOCUMENT',
        label: 'Documentation / international amplification',
        hiddenObjective: 'Build international pressure record. Targets Western diplomatic ' +
          'attention to impose costs on regime suppression strategy.',
      };
    }
  }

  // External intent
  if (actor === 'EXTERNAL') {
    if (category === 'economic' || category === 'political') {
      return {
        intent: 'PRESSURE',
        label: 'External diplomatic/financial pressure',
        hiddenObjective: 'Impose costs on regime behavior through conditionality or public ' +
          'criticism. Regime reads these as threats to Western alignment constraint.',
      };
    }
  }

  // Citizen intent
  if (actor === 'CITIZEN') {
    return {
      intent: 'MOBILIZE',
      label: 'Organic mobilization / viral content',
      hiddenObjective: 'Bottom-up anger expression. High amplification potential ' +
        '(A(t) boost). Not strategically directed but can be captured by political frames.',
    };
  }

  return {
    intent: 'INFORM',
    label: 'General information',
    hiddenObjective: 'Informational signal with no clear strategic intent detected.',
  };
}

// ── Model Impact Calculator ────────────────────────────────────

function computeModelImpact(
  shockEvent: ShockEvent | null,
  tier: SignalTier,
  category: string,
  severity: number
): ModelImpact {
  if (shockEvent) {
    const equationMap: Record<string, string[]> = {
      // Map variable categories to equations
      'A': ['EQ.2 Category Score', 'EQ.3 Salience', 'EQ.13 Shock'],
      'E': ['EQ.4 SIR Spread', 'EQ.3 Salience'],
      'N': ['EQ.17 Cascade', 'EQ.7 Elite Defection'],
      'D': ['EQ.7 Elite Defection', 'EQ.18 Cohesion', 'EQ.21 MII'],
      'G': ['EQ.3 Salience', 'EQ.19 Amplification'],
      'H': ['EQ.19 Amplification', 'EQ.3 Salience'],
      'M': ['EQ.7 Elite Defection', 'EQ.15 Compound Stress'],
      'J': ['EQ.17 Cascade', 'EQ.8 War Intensity'],
      'B': ['EQ.3 Salience', 'EQ.17 Cascade'],
    };

    const varCategory = shockEvent.primary_variable.charAt(0);
    const equations = equationMap[varCategory] ?? ['EQ.13 Shock', 'EQ.2 Category Score'];
    if (!equations.includes('EQ.13 Shock')) equations.push('EQ.13 Shock');

    return {
      epsilonMagnitude: shockEvent.epsilon_magnitude,
      epsilonDirection: shockEvent.direction,
      decayDays: shockEvent.decay_days,
      primaryVariable: shockEvent.primary_variable,
      secondaryVariables: shockEvent.secondary_variables,
      affectedEquations: equations,
      estimatedRRIDelta: shockEvent.epsilon_magnitude * shockEvent.direction * 0.08,
    };
  }

  // No shock match — estimate from severity/category
  const baseMagnitude = tier === 'SIGNAL' ? 0.03 + severity * 0.01 : 0.01;
  const categoryVariables: Record<string, string> = {
    arrest: 'G71', protest: 'E51', labor: 'M_UGTT',
    economic: 'A01', political: 'D41', water: 'B21',
    migration: 'F63', security: 'N141', energy: 'H128',
    shortage_food: 'B24', shortage_butane: 'B22',
  };

  return {
    epsilonMagnitude: baseMagnitude,
    epsilonDirection: 1,
    decayDays: 7,
    primaryVariable: categoryVariables[category] ?? 'E51',
    secondaryVariables: [],
    affectedEquations: ['EQ.13 Shock'],
    estimatedRRIDelta: baseMagnitude * 0.06,
  };
}

// ── Prediction Match Detector ──────────────────────────────────

function checkPredictionMatch(
  article: Article,
  govAssessment: GovAgentAssessment | null,
  shockEvent: ShockEvent | null
): PredictionMatch | undefined {
  if (!govAssessment || !shockEvent) return undefined;

  const text = (article.title + ' ' + (article.summary || '')).toLowerCase();

  // Map shock event types to gov agent action types
  const shockToActionMap: Partial<Record<ShockEventType, RegimeActionType>> = {
    journalist_arrest_major: 'SUPPRESSION_TARGETED',
    decree54_new_wave: 'SUPPRESSION_TARGETED',
    internet_shutdown: 'DIGITAL_SUPPRESSION',
    anti_corruption_arrest: 'ANTI_CORRUPTION_ARREST',
    elite_defection_public: 'ELITE_LOYALTY_REINFORCE',
    migration_crisis_escalation: 'MIGRATION_DEPLOY',
    military_statement: 'SECURITY_APPARATUS_SIGNAL',
    cabinet_reshuffle_coercive: 'ELITE_LOYALTY_REINFORCE',
    presidential_health: 'CONSTITUTIONAL_MOVE',
  };

  const mappedActionType = shockToActionMap[shockEvent.type];
  if (!mappedActionType) return undefined;

  // Find matching predicted action
  const predictedAction = govAssessment.predictedActions.find(
    a => a.type === mappedActionType
  );
  if (!predictedAction) return undefined;

  // Check if the article's keywords match the action's detectable signal
  const signalKeywords = predictedAction.detectableSignal
    .replace(/RSS:\s*/g, '')
    .split(',')
    .map(k => k.trim().replace(/['"]/g, '').toLowerCase());

  const keywordMatch = signalKeywords.some(kw => text.includes(kw));

  return {
    govActionType: mappedActionType,
    predictedProbability: predictedAction.probability,
    confirmed: keywordMatch,
    matchConfidence: keywordMatch ? 0.78 : 0.45,
  };
}

// ── Contextual Timing ──────────────────────────────────────────

function buildContextualTiming(
  intent: IntentType,
  actor: ActorAttribution,
  rriState: any,
  data: any
): string {
  const econ = data?.economy || {};
  const social = data?.social || {};
  
  const inflation = econ.inflation ?? 7.1;
  const fxReserves = econ.fx_reserves ?? 84;
  const ugtt = social.ugtt_mobilisation_level ?? 'ELEVATED';
  const velocity = rriState?.velocity ?? 0.18;

  if (intent === 'DISTRACT' && actor === 'REGIME') {
    if (inflation > 7.0) {
      return `Timing correlates with inflation at ${inflation.toFixed(1)}% — regime deploying legitimacy displacement`;
    }
    return 'Timing correlates with elevated R(t) — distraction pattern active';
  }

  if (intent === 'CONTROL' && actor === 'REGIME') {
    return `Preemptive suppression while R(t)=${rriState.rri?.toFixed(2)} and system accelerating V(t)=${velocity.toFixed(3)}`;
  }

  if (intent === 'MOBILIZE' && actor === 'OPPOSITION') {
    if (ugtt === 'HIGH' || ugtt === 'ELEVATED') {
      return `UGTT at ${ugtt} provides institutional mobilization infrastructure`;
    }
    return `Rising R(t) creating mobilization window`;
  }

  if (intent === 'PRESSURE' && actor === 'EXTERNAL') {
    if (fxReserves < 90) {
      return `External pressure while FX reserves at ${fxReserves}d — regime financial vulnerability window`;
    }
    return 'External actor exploiting elevated instability visibility';
  }

  return `Occurring during system acceleration phase (V(t)=${velocity.toFixed(3)})`;
}

// ── Main Classification Function ───────────────────────────────

export function classifySignal(
  article: Article,
  rriState: any,
  data: any,
  govAssessment: GovAgentAssessment | null = null
): SignalClassification {
  const text = article.title + ' ' + (article.content || article.summary || '');
  const category = article.category ?? 'general';
  const propagandaScore = article.propaganda_score ?? 0;

  // 1. Detect shock event
  const detectedShocks = detectShocksFromArticles([article]);
  const shockEvent = detectedShocks[0]?.event ?? null;
  const shockEventType = detectedShocks[0]?.event?.type ?? undefined;

  // 2. Tier classification
  const { tier, reason: tierReason } = resolveTier(
    article.severity, shockEvent, category,
    (article as any).geo_relevance_score ?? 100
  );

  // 3. Actor attribution
  const { actor, label: actorLabel, confidence: actorConfidence } =
    resolveActor(article, shockEvent);

  // 4. Intent classification
  const { intent, label: intentLabel, hiddenObjective } = resolveIntent(
    actor, shockEvent, category,
    article.bias_alignment, article.bias_tone, propagandaScore
  );

  // 5. Model impact
  const modelImpact = computeModelImpact(shockEvent, tier, category, article.severity);

  // 6. Prediction match
  const predictionMatch = checkPredictionMatch(article, govAssessment, shockEvent);
  const confirmsGovAction = predictionMatch?.confirmed === true;

  // 7. Contextual timing
  const contextualTiming = buildContextualTiming(intent, actor, rriState, data);

  // 8. Brief relevance (one sentence)
  const briefRelevance = shockEvent
    ? `${shockEvent.label} (ε=${shockEvent.epsilon_magnitude.toFixed(2)}) — ${intentLabel.toLowerCase()}`
    : `${intentLabel} via ${actorLabel.toLowerCase()}`;

  // 9. Overall confidence
  const classificationConfidence = Math.min(0.95, Math.max(0.25,
    actorConfidence * 0.40 +
    (shockEvent ? 0.35 : 0.10) +
    (article.severity >= 3 ? 0.15 : 0.05) +
    (propagandaScore > 0 ? 0.10 : 0)
  ));

  return {
    id: article.id,
    articleId: article.id,
    tier,
    tierReason,
    actor,
    actorLabel,
    actorConfidence,
    intent,
    intentLabel,
    hiddenObjective,
    shockEvent: shockEvent ?? undefined,
    shockEventType,
    modelImpact,
    predictionMatch,
    confirmsGovAction,
    contextualTiming,
    briefRelevance,
    classificationConfidence,
    classifiedAt: new Date().toISOString(),
  };
}

// ── Batch Classification ───────────────────────────────────────

export function classifySignals(
  articles: Article[],
  rriState: any,
  data: any,
  govAssessment: GovAgentAssessment | null = null,
  maxArticles: number = 20
): SignalClassification[] {
  return articles
    .slice(0, maxArticles)
    .map(a => classifySignal(a, rriState, data, govAssessment))
    .sort((a, b) => {
      // System shocks first, then signals, then noise
      const tierOrder = { SYSTEM_SHOCK: 0, SIGNAL: 1, NOISE: 2 };
      if (tierOrder[a.tier] !== tierOrder[b.tier]) {
        return tierOrder[a.tier] - tierOrder[b.tier];
      }
      // Within tier, confirmed predictions first
      if (a.confirmsGovAction !== b.confirmsGovAction) {
        return a.confirmsGovAction ? -1 : 1;
      }
      return b.modelImpact.epsilonMagnitude - a.modelImpact.epsilonMagnitude;
    });
}

// ── Summary for brief ──────────────────────────────────────────

export function buildSignalSummary(classifications: SignalClassification[]): {
  systemShocks: number;
  signals: number;
  confirmedPredictions: number;
  totalEpsilon: number;
  dominantIntent: IntentType | null;
  dominantActor: ActorAttribution | null;
} {
  const shocks = classifications.filter(c => c.tier === 'SYSTEM_SHOCK');
  const sigs = classifications.filter(c => c.tier === 'SIGNAL');
  const confirmed = classifications.filter(c => c.confirmsGovAction);
  const totalEps = classifications.reduce(
    (s, c) => s + c.modelImpact.epsilonMagnitude * c.modelImpact.epsilonDirection, 0
  );

  // Most common intent among non-noise
  const intentCounts: Partial<Record<IntentType, number>> = {};
  const actorCounts: Partial<Record<ActorAttribution, number>> = {};
  for (const c of classifications.filter(c => c.tier !== 'NOISE')) {
    intentCounts[c.intent] = (intentCounts[c.intent] ?? 0) + 1;
    actorCounts[c.actor] = (actorCounts[c.actor] ?? 0) + 1;
  }

  const domIntent = Object.entries(intentCounts)
    .sort(([,a],[,b]) => b - a)[0]?.[0] as IntentType | null;
  const domActor = Object.entries(actorCounts)
    .sort(([,a],[,b]) => b - a)[0]?.[0] as ActorAttribution | null;

  return {
    systemShocks: shocks.length,
    signals: sigs.length,
    confirmedPredictions: confirmed.length,
    totalEpsilon: parseFloat(totalEps.toFixed(4)),
    dominantIntent: domIntent ?? null,
    dominantActor: domActor ?? null,
  };
}
