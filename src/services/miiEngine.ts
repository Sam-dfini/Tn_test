/**
 * TunisiaIntel — Ministerial Instability Index (MII) Engine
 * EQ.21 — Political Elite Stability
 *
 * Measures government reshuffle patterns as a leading indicator
 * of regime stress, policy failure, and elite fracture.
 *
 * Key insight: the PATTERN of changes is the signal,
 * not the change itself.
 *
 * Four phases:
 *   Phase 1 STABLE     → few changes, long tenure
 *   Phase 2 ADAPTIVE   → some changes, looks healthy, actually stressed
 *   Phase 3 CHAOTIC    → frequent changes, pre-crisis zone
 *   Phase 4 FREEZE     → no changes, deceptive stability, pre-rupture
 *
 * Feeds into:
 *   EQ.7  — Elite Defection Utility (current_defections parameter)
 *   EQ.16 — Velocity (MII delta adds to V(t))
 *   EQ.18 — Elite Cohesion Dynamics (delta_defection parameter)
 *   EQ.15 — Compound Stress (new CS_PAIR: D_MII + E51)
 *   R(t)  — via Category D weight
 */

import { Article } from '../lib/supabase';

// ── Types ──────────────────────────────────────────────────────

export type MIIPhase =
  | 'STABLE'      // Phase 1: few changes, long tenures
  | 'ADAPTIVE'    // Phase 2: managed reshuffling, stress masked
  | 'CHAOTIC'     // Phase 3: high frequency, pre-crisis
  | 'FREEZE';     // Phase 4: artificial stability, highest fragility

export type MinistryTier =
  | 'COERCIVE'    // Interior, Defence, Justice — last to change, most significant
  | 'ECONOMIC'    // Finance, Economy, Energy — high RRI variable sensitivity
  | 'SOCIAL'      // Social Affairs, Education, Health — testing ground
  | 'PERIPHERAL'; // Other — lower weight

export type ChangeType =
  | 'ROUTINE'         // Normal rotation
  | 'CRISIS_TRIGGERED'// After protest/scandal/shock
  | 'PREEMPTIVE'      // Before visible crisis — regime perceives internal threat
  | 'LOYALTY_INSTALL' // Loyalist replacing technocrat
  | 'TECHNOCRAT_IN';  // Technocrat replacing loyalist (rare, positive signal)

export interface CabinetEvent {
  id: string;
  date: string;               // ISO date
  ministry: string;
  outgoingName?: string;
  incomingName?: string;
  tier: MinistryTier;
  changeType: ChangeType;
  crisisContext?: string;     // what event triggered it
  loyalistShift: number;      // -1 to +1 (-1=technocrat in, +1=loyalist in)
  articleId?: string;         // source RSS article
  source: 'RSS' | 'MANUAL' | 'SUPABASE';
}

export interface MinistryProfile {
  name: string;
  tier: MinistryTier;
  currentMinister?: string;
  tenureDays: number;
  changesLast12m: number;
  lastChangeType?: ChangeType;
  lastChangeTrigger?: string;
  loyalistScore: number;      // 0-1, 1 = full loyalist cabinet
  rriVariables: string[];     // which RRI vars this ministry affects
}

export interface MIIProfile {
  // EQ.21 components
  changeFrequency: number;      // CF: changes per year (normalized 0-1)
  avgTenureScore: number;       // 1/tenure normalized (high = short tenure = bad)
  crisisChangeRatio: number;    // % of changes crisis-triggered (0-1)
  keyMinistryScore: number;     // KM: weighted by tier importance
  loyaltyShiftIndex: number;    // LS: 0-1, 1 = full loyalist concentration

  // Composite
  mii: number;                  // EQ.21 output (0-1)
  miiDelta: number;             // change from previous calculation
  phase: MIIPhase;
  phaseConfidence: number;      // 0-1

  // Predictive interpretation
  interpretation: string;
  prediction: string;
  timeHorizon: string;

  // Equation modifiers
  eq7_defections: number;       // feeds current_defections in EQ.7
  eq18_delta_defection: number; // additional delta_defection for EQ.18
  eq16_velocity_addon: number;  // ΔMII added to V(t)

  // Detail
  totalEvents: number;
  ministryProfiles: MinistryProfile[];
  recentEvents: CabinetEvent[];
  detectedAt: number;
  keySignals: string[];
}

// ── Tunisia Ministry Registry ──────────────────────────────────
// Historical data from 2021-2026 (Saied era)
// Manually calibrated from TAP/news records

const TUNISIA_MINISTRY_REGISTRY: Record<string, {
  tier: MinistryTier;
  rriVariables: string[];
  currentMinister: string;
  appointedDate: string;
  loyalistScore: number;
}> = {
  'Interior': {
    tier: 'COERCIVE',
    rriVariables: ['N141', 'N142', 'D66'],
    currentMinister: 'Khaled Nouri',
    appointedDate: '2023-08-01',
    loyalistScore: 0.90,
  },
  'Justice': {
    tier: 'COERCIVE',
    rriVariables: ['D69', 'D75', 'G71'],
    currentMinister: 'Leila Jaffel',
    appointedDate: '2021-10-11',
    loyalistScore: 0.95,
  },
  'Defence': {
    tier: 'COERCIVE',
    rriVariables: ['N141', 'J_WAR'],
    currentMinister: 'Imed Memmiche',
    appointedDate: '2023-08-01',
    loyalistScore: 0.85,
  },
  'Finance': {
    tier: 'ECONOMIC',
    rriVariables: ['A_FX', 'A06', 'I92'],
    currentMinister: 'Sihem Boughdiri Nemsia',
    appointedDate: '2021-10-11',
    loyalistScore: 0.70,
  },
  'Economy': {
    tier: 'ECONOMIC',
    rriVariables: ['A01', 'A03', 'A05'],
    currentMinister: 'Samir Saied',
    appointedDate: '2023-08-01',
    loyalistScore: 0.75,
  },
  'Energy': {
    tier: 'ECONOMIC',
    rriVariables: ['H01', 'H02', 'B23', 'B25'],
    currentMinister: 'Wael Chouchane',
    appointedDate: '2023-08-01',
    loyalistScore: 0.80,
  },
  'Social Affairs': {
    tier: 'SOCIAL',
    rriVariables: ['E51', 'M_UGTT', 'O232'],
    currentMinister: 'Mabrouk Kharchich',
    appointedDate: '2024-02-01',
    loyalistScore: 0.65,
  },
  'Education': {
    tier: 'SOCIAL',
    rriVariables: ['O244', 'M206'],
    currentMinister: 'Mohamed Ali Boughdiri',
    appointedDate: '2022-04-01',
    loyalistScore: 0.60,
  },
  'Agriculture': {
    tier: 'SOCIAL',
    rriVariables: ['B24', 'B21'],
    currentMinister: 'Abdelmonem Belati',
    appointedDate: '2023-08-01',
    loyalistScore: 0.70,
  },
  'Transport': {
    tier: 'PERIPHERAL',
    rriVariables: [],
    currentMinister: 'Rabii Majidi',
    appointedDate: '2023-08-01',
    loyalistScore: 0.60,
  },
};

// ── Historical reshuffle events (Saied era 2021-2026) ──────────
// Ground truth for MII baseline calibration

const HISTORICAL_CABINET_EVENTS: CabinetEvent[] = [
  // 2021 — Post-coup installation
  {
    id: 'ev001', date: '2021-10-11',
    ministry: 'Justice', tier: 'COERCIVE',
    changeType: 'LOYALTY_INSTALL', loyalistShift: 0.9,
    crisisContext: 'Post-coup consolidation',
    source: 'MANUAL',
    incomingName: 'Leila Jaffel',
  },
  {
    id: 'ev002', date: '2021-10-11',
    ministry: 'Interior', tier: 'COERCIVE',
    changeType: 'LOYALTY_INSTALL', loyalistShift: 0.85,
    crisisContext: 'Post-coup security consolidation',
    source: 'MANUAL',
    incomingName: 'Taoufik Charfeddine',
  },
  {
    id: 'ev003', date: '2021-10-11',
    ministry: 'Finance', tier: 'ECONOMIC',
    changeType: 'LOYALTY_INSTALL', loyalistShift: 0.6,
    crisisContext: 'Post-coup government formation',
    source: 'MANUAL',
    incomingName: 'Sihem Boughdiri Nemsia',
  },
  // 2022 — Consolidation phase
  {
    id: 'ev004', date: '2022-04-11',
    ministry: 'Education', tier: 'SOCIAL',
    changeType: 'CRISIS_TRIGGERED', loyalistShift: 0.5,
    crisisContext: 'UGTT education strike confrontation',
    source: 'MANUAL',
    incomingName: 'Mohamed Ali Boughdiri',
  },
  {
    id: 'ev005', date: '2022-08-25',
    ministry: 'Interior', tier: 'COERCIVE',
    changeType: 'PREEMPTIVE', loyalistShift: 0.9,
    crisisContext: 'Pre-referendum security — preemptive loyalty reinforcement',
    source: 'MANUAL',
    incomingName: 'Taoufik Charfeddine (retained)',
  },
  // 2023 — Stress acceleration
  {
    id: 'ev006', date: '2023-01-15',
    ministry: 'Economy', tier: 'ECONOMIC',
    changeType: 'CRISIS_TRIGGERED', loyalistShift: 0.6,
    crisisContext: 'IMF negotiations stalling — economic pressure',
    source: 'MANUAL',
    incomingName: 'Samir Saied',
  },
  {
    id: 'ev007', date: '2023-08-01',
    ministry: 'Interior', tier: 'COERCIVE',
    changeType: 'LOYALTY_INSTALL', loyalistShift: 0.95,
    crisisContext: 'Sfax migration crisis — loyalty reinforcement in coercive core',
    source: 'MANUAL',
    incomingName: 'Khaled Nouri',
  },
  {
    id: 'ev008', date: '2023-08-01',
    ministry: 'Energy', tier: 'ECONOMIC',
    changeType: 'CRISIS_TRIGGERED', loyalistShift: 0.75,
    crisisContext: 'STEG debt crisis / energy price pressure',
    source: 'MANUAL',
    incomingName: 'Wael Chouchane',
  },
  {
    id: 'ev009', date: '2023-08-01',
    ministry: 'Social Affairs', tier: 'SOCIAL',
    changeType: 'ROUTINE', loyalistShift: 0.55,
    crisisContext: 'Government reshuffle',
    source: 'MANUAL',
  },
  // 2024 — Testing social sector
  {
    id: 'ev010', date: '2024-02-01',
    ministry: 'Social Affairs', tier: 'SOCIAL',
    changeType: 'CRISIS_TRIGGERED', loyalistShift: 0.60,
    crisisContext: 'UGTT pressure / wage dispute escalation',
    source: 'MANUAL',
    incomingName: 'Mabrouk Kharchich',
  },
  {
    id: 'ev011', date: '2024-09-01',
    ministry: 'Agriculture', tier: 'SOCIAL',
    changeType: 'CRISIS_TRIGGERED', loyalistShift: 0.65,
    crisisContext: 'Food shortage signals / shortage detector alerts',
    source: 'MANUAL',
  },
];

// ── MII Metric Calculators ─────────────────────────────────────

const TIER_WEIGHTS: Record<MinistryTier, number> = {
  COERCIVE:   0.40, // Interior, Justice, Defence — most significant
  ECONOMIC:   0.35, // Finance, Economy, Energy
  SOCIAL:     0.20, // Social, Education, Agriculture
  PERIPHERAL: 0.05, // Others
};

function computeChangeFrequency(
  events: CabinetEvent[],
  windowDays: number = 365
): number {
  const cutoff = Date.now() - windowDays * 86400000;
  const recent = events.filter(e =>
    new Date(e.date).getTime() > cutoff
  );

  // Normalize: 0 changes = 0, 12+ changes/year = 1.0
  return Math.min(1, recent.length / 12);
}

function computeAvgTenureScore(
  ministries: Record<string, { appointedDate: string }>
): number {
  const tenures = Object.values(ministries).map(m => {
    const days = (Date.now() - new Date(m.appointedDate).getTime()) / 86400000;
    return days;
  });

  if (!tenures.length) return 0.5;

  const avgTenure = tenures.reduce((s, t) => s + t, 0) / tenures.length;

  // Short tenure = high score (bad)
  // < 180 days = 1.0, > 730 days = 0.1
  const tenureScore = Math.max(0.1, Math.min(1.0,
    1.0 - (avgTenure - 180) / (730 - 180)
  ));

  return tenureScore;
}

function computeCrisisChangeRatio(events: CabinetEvent[]): number {
  if (!events.length) return 0;
  const crisisTypes: ChangeType[] = [
    'CRISIS_TRIGGERED', 'PREEMPTIVE', 'LOYALTY_INSTALL'
  ];
  const crisisChanges = events.filter(e =>
    crisisTypes.includes(e.changeType)
  ).length;
  return crisisChanges / events.length;
}

function computeKeyMinistryScore(
  events: CabinetEvent[],
  windowDays: number = 365
): number {
  const cutoff = Date.now() - windowDays * 86400000;
  const recent = events.filter(e =>
    new Date(e.date).getTime() > cutoff
  );

  let weightedScore = 0;
  let totalWeight = 0;

  for (const event of recent) {
    const weight = TIER_WEIGHTS[event.tier];
    // Crisis/loyalty changes weighted higher than routine
    const typeMultiplier =
      event.changeType === 'LOYALTY_INSTALL' ? 1.5 :
      event.changeType === 'CRISIS_TRIGGERED' ? 1.3 :
      event.changeType === 'PREEMPTIVE' ? 1.8 : // most alarming
      1.0;

    weightedScore += weight * typeMultiplier * Math.abs(event.loyalistShift);
    totalWeight += weight;
  }

  return totalWeight > 0
    ? Math.min(1, weightedScore / totalWeight)
    : 0;
}

function computeLoyaltyShiftIndex(
  ministries: typeof TUNISIA_MINISTRY_REGISTRY
): number {
  const scores = Object.values(ministries).map(m => m.loyalistScore);
  if (!scores.length) return 0.5;
  return scores.reduce((s, v) => s + v, 0) / scores.length;
}

// ── Phase Classifier ───────────────────────────────────────────

function classifyPhase(
  cf: number,
  tenure: number,
  crisisRatio: number,
  loyaltyShift: number
): { phase: MIIPhase; confidence: number } {

  // Phase 4 FREEZE: low frequency + high loyalty concentration
  // Deceptive stability — most fragile
  if (cf < 0.15 && loyaltyShift > 0.75) {
    return { phase: 'FREEZE', confidence: 0.80 };
  }

  // Phase 3 CHAOTIC: high frequency + high crisis ratio
  if (cf > 0.50 && crisisRatio > 0.55) {
    return { phase: 'CHAOTIC', confidence: 0.85 };
  }

  // Phase 2 ADAPTIVE: moderate frequency + rising crisis ratio
  if (cf > 0.20 && crisisRatio > 0.35) {
    return { phase: 'ADAPTIVE', confidence: 0.75 };
  }

  // Phase 1 STABLE: low frequency, long tenure
  if (cf < 0.20 && tenure < 0.4) {
    return { phase: 'STABLE', confidence: 0.70 };
  }

  // Default: ADAPTIVE (most common ambiguous state)
  return { phase: 'ADAPTIVE', confidence: 0.55 };
}

// ── Predictive Interpretation ──────────────────────────────────

function interpret(
  phase: MIIPhase,
  mii: number,
  loyaltyShift: number,
  kmScore: number,
  crisisRatio: number
): { interpretation: string; prediction: string; timeHorizon: string } {

  const interpretations: Record<MIIPhase, {
    interpretation: string;
    prediction: string;
    timeHorizon: string;
  }> = {
    STABLE: {
      interpretation: 'Low ministerial instability. Government maintaining continuity. Institutional memory intact.',
      prediction: 'Continued stability unless external shock occurs. Monitor for sudden change in key ministries.',
      timeHorizon: '90-180 days stable horizon',
    },
    ADAPTIVE: {
      interpretation: 'Managed reshuffling active. Regime responding to pressure but maintaining control. Structural problems masked, not solved.',
      prediction: 'Transition to CHAOTIC if crisis-triggered changes increase. Elite dissent accumulating below surface.',
      timeHorizon: '30-90 days before phase shift if pressures continue',
    },
    CHAOTIC: {
      interpretation: 'High-frequency reshuffling signals regime losing control of policy agenda. Institutional continuity breaking down. Elite uncertainty high.',
      prediction: 'Structural crisis within 30-60 days if pattern continues. Watch: coercive ministry stability — if Interior/Justice change, immediate alert.',
      timeHorizon: '30-60 days to visible structural crisis',
    },
    FREEZE: {
      interpretation: loyaltyShift > 0.80
        ? 'Authoritarian lock-in. Regime replacing competence with loyalty. Surface calm concealing maximum structural fragility. This is the pre-rupture pattern.'
        : 'Artificial stability. Reshuffles paused but structural problems accumulating. When freeze breaks, it breaks fast.',
      prediction: loyaltyShift > 0.80
        ? 'Elite defection risk elevated. Loyalists face increasing calculation pressure as regime survival probability declines. Single defection can cascade.'
        : 'Next reshuffle will be crisis-driven and destabilizing. Monitor external shocks that could break the freeze.',
      timeHorizon: kmScore > 0.6
        ? 'Acute — key ministry changes imminent'
        : '60-120 days until forced reshuffle or rupture',
    },
  };

  const base = interpretations[phase];

  // Add loyalist concentration warning
  let interp = base.interpretation;
  if (loyaltyShift > 0.78 && phase === 'FREEZE') {
    interp += ' Cabinet loyalist concentration at ' +
      (loyaltyShift * 100).toFixed(0) + '%. ' +
      'Remaining independent figures face maximum defection pressure.';
  }

  return { ...base, interpretation: interp };
}

// ── RSS Cabinet Event Detector ─────────────────────────────────
// Detects reshuffle events from RSS articles

const CABINET_CHANGE_KEYWORDS = {
  appointment: [
    // French
    'nommé', 'nomination', 'nouveau ministre', 'remplacé',
    'remplaçant', 'portefeuille', 'secrétaire d\'état',
    'limogeage', 'limogé', 'démission', 'démissionné',
    // Arabic
    'تعيين', 'تغيير وزير', 'وزير جديد', 'استقالة',
    'إقالة', 'تكليف', 'حقيبة وزارية', 'تعديل وزاري',
    'حكومة جديدة', 'إعادة هيكلة',
    // English
    'appointed', 'new minister', 'replaced', 'resignation',
    'cabinet reshuffle', 'portfolio', 'dismissed', 'fired',
  ],
  ministry_names: [
    'وزارة الداخلية', 'Interior Ministry', 'Ministère de l\'Intérieur',
    'وزارة المالية', 'Ministry of Finance', 'Ministère des Finances',
    'وزارة العدل', 'Ministry of Justice', 'Ministère de la Justice',
    'وزارة الطاقة', 'Ministry of Energy', 'Ministère de l\'Énergie',
    'وزارة التربية', 'Ministry of Education', 'Ministère de l\'Education',
    'وزارة الشؤون الاجتماعية', 'Ministry of Social Affairs',
    'وزارة الدفاع', 'Ministry of Defence',
    'وزارة الاقتصاد', 'Ministry of Economy',
  ],
  crisis_context: [
    'suite aux manifestations', 'après la grève', 'pression',
    'following protests', 'after strike', 'pressure',
    'إثر الاحتجاجات', 'بعد الإضراب', 'ضغط',
  ],
};

export function detectCabinetEventsFromArticles(
  articles: Article[]
): CabinetEvent[] {
  const detected: CabinetEvent[] = [];

  for (const article of articles) {
    const text = (article.title + ' ' + (article.content || article.summary || '')).toLowerCase();

    // Check for appointment keywords
    const hasAppointment = CABINET_CHANGE_KEYWORDS.appointment.some(kw =>
      text.includes(kw.toLowerCase())
    );

    if (!hasAppointment) continue;

    // Check for ministry name
    const mentionedMinistry = CABINET_CHANGE_KEYWORDS.ministry_names.find(mn =>
      text.includes(mn.toLowerCase())
    );

    if (!mentionedMinistry) continue;

    // Determine tier from ministry name
    const tier: MinistryTier =
      ['Intérieur', 'Justice', 'Défense', 'Intérieur', 'Interior', 'الداخلية', 'العدل', 'الدفاع']
        .some(t => mentionedMinistry.includes(t))
        ? 'COERCIVE'
      : ['Finances', 'Économie', 'Énergie', 'Finance', 'Economy', 'Energy', 'المالية', 'الاقتصاد', 'الطاقة']
        .some(t => mentionedMinistry.includes(t))
        ? 'ECONOMIC'
      : ['Education', 'Social', 'Agriculture', 'التربية', 'الشؤون', 'الفلاحة']
        .some(t => mentionedMinistry.includes(t))
        ? 'SOCIAL'
      : 'PERIPHERAL';

    // Detect crisis context
    const hasCrisis = CABINET_CHANGE_KEYWORDS.crisis_context.some(kw =>
      text.includes(kw.toLowerCase())
    );

    const changeType: ChangeType = hasCrisis ? 'CRISIS_TRIGGERED' : 'ROUTINE';

    detected.push({
      id: `rss-${article.id}`,
      date: article.published_at.slice(0, 10),
      ministry: mentionedMinistry,
      tier,
      changeType,
      loyalistShift: tier === 'COERCIVE' ? 0.7 : 0.5, // default assumption
      articleId: article.id,
      source: 'RSS',
    });
  }

  return detected;
}

// ── Build Ministry Profiles ────────────────────────────────────

function buildMinistryProfiles(
  events: CabinetEvent[]
): MinistryProfile[] {
  const now = Date.now();
  const yearAgo = now - 365 * 86400000;

  return Object.entries(TUNISIA_MINISTRY_REGISTRY).map(([name, reg]) => {
    const ministryEvents = events.filter(e =>
      e.ministry.toLowerCase().includes(name.toLowerCase()) ||
      name.toLowerCase().includes(e.ministry.toLowerCase())
    );

    const recentEvents = ministryEvents.filter(e =>
      new Date(e.date).getTime() > yearAgo
    );

    const tenureDays = Math.round(
      (now - new Date(reg.appointedDate).getTime()) / 86400000
    );

    const lastEvent = ministryEvents
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

    return {
      name,
      tier: reg.tier,
      currentMinister: reg.currentMinister,
      tenureDays,
      changesLast12m: recentEvents.length,
      lastChangeType: lastEvent?.changeType,
      lastChangeTrigger: lastEvent?.crisisContext,
      loyalistScore: reg.loyalistScore,
      rriVariables: reg.rriVariables,
    };
  });
}

// ── Previous MII for delta ─────────────────────────────────────

let _previousMII: number = 0;

// ── EQ.21 Main Function ────────────────────────────────────────

export function computeMII(
  extraEvents: CabinetEvent[] = []  // RSS-detected or manually added
): MIIProfile {

  // Combine historical + new events
  const allEvents = [...HISTORICAL_CABINET_EVENTS, ...extraEvents];

  // Compute five components
  const cf = computeChangeFrequency(allEvents, 365);
  const tenure = computeAvgTenureScore(TUNISIA_MINISTRY_REGISTRY);
  const crisisRatio = computeCrisisChangeRatio(
    allEvents.filter(e => new Date(e.date).getTime() > Date.now() - 365 * 86400000)
  );
  const km = computeKeyMinistryScore(allEvents, 365);
  const ls = computeLoyaltyShiftIndex(TUNISIA_MINISTRY_REGISTRY);

  // EQ.21:
  // MII(t) = α·CF + β·(1/tenure_normalized) + γ·CrisisChanges + δ·KM + ε·LS
  const ALPHA = 0.20;
  const BETA  = 0.25;
  const GAMMA = 0.20;
  const DELTA = 0.20;
  const EPS   = 0.15;

  const mii = Math.min(1, Math.max(0,
    ALPHA * cf +
    BETA  * tenure +
    GAMMA * crisisRatio +
    DELTA * km +
    EPS   * ls
  ));

  const miiDelta = mii - _previousMII;
  _previousMII = mii;

  // Phase
  const { phase, confidence: phaseConfidence } = classifyPhase(cf, tenure, crisisRatio, ls);

  // Interpretation
  const { interpretation, prediction, timeHorizon } = interpret(
    phase, mii, ls, km, crisisRatio
  );

  // Ministry profiles
  const ministryProfiles = buildMinistryProfiles(allEvents);

  // Key signals for UI
  const keySignals: string[] = [];
  if (cf > 0.4) keySignals.push(`High change frequency: ${(cf * 12).toFixed(1)}/year`);
  if (tenure > 0.6) keySignals.push(`Short avg tenure: <${Math.round(tenure * 365)}d`);
  if (crisisRatio > 0.5) keySignals.push(`${(crisisRatio * 100).toFixed(0)}% changes crisis-triggered`);
  if (km > 0.5) keySignals.push(`Key ministry sensitivity elevated (${(km * 100).toFixed(0)}%)`);
  if (ls > 0.75) keySignals.push(`Loyalist concentration: ${(ls * 100).toFixed(0)}% cabinet`);
  if (phase === 'FREEZE') keySignals.push('⚠ PHASE 4 FREEZE: deceptive stability');
  if (miiDelta > 0.05) keySignals.push(`MII accelerating +${miiDelta.toFixed(3)} this cycle`);

  // Equation modifiers
  // EQ.7: current_defections proxy — loyalist concentration creates internal pressure
  const eq7_defections = Math.round(ls * 10 + mii * 5);

  // EQ.18: additional delta_defection from crisis changes
  const eq18_delta_defection = Math.min(0.08, crisisRatio * 0.10 + km * 0.05);

  // EQ.16: velocity addon — sudden MII spike adds to V(t)
  const eq16_velocity_addon = miiDelta * 0.3;

  return {
    changeFrequency: cf,
    avgTenureScore: tenure,
    crisisChangeRatio: crisisRatio,
    keyMinistryScore: km,
    loyaltyShiftIndex: ls,
    mii,
    miiDelta,
    phase,
    phaseConfidence,
    interpretation,
    prediction,
    timeHorizon,
    eq7_defections,
    eq18_delta_defection,
    eq16_velocity_addon,
    totalEvents: allEvents.length,
    ministryProfiles,
    recentEvents: allEvents
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10),
    detectedAt: Date.now(),
    keySignals,
  };
}

// ── For cluster pipeline (0-1 normalized) ─────────────────────

export function computeMIIScore(extraEvents: CabinetEvent[] = []): number {
  return computeMII(extraEvents).mii;
}
