/**
 * TunisiaIntel — Radicalisation Dynamics Engine (RDE)
 *
 * Detects progressive radicalisation as a trajectory,
 * not a binary state. Measures movement across 6 escalation
 * levels. Feeds three RRI equations (EQ.3, EQ.4, EQ.19).
 *
 * Key principle: system detects STRUCTURE of discourse,
 * never content or ideological direction.
 *
 * Pipeline:
 *   War W(t) → Emotional Activation
 *     → Narrative Alignment (3 poles)
 *       → Synergy Injection
 *         → Escalation Gradient (0–5)
 *           → RPI (0–1)
 *             → EQ.3 salience modifier
 *             → EQ.4 SIR β/γ modifier
 *             → EQ.19 amplification modifier
 */

import { Article } from '../lib/supabase';

// ── Types ──────────────────────────────────────────────────────

export type EscalationLevel =
  | 0  // Awareness
  | 1  // Emotional engagement
  | 2  // Identity alignment
  | 3  // Us vs Them worldview
  | 4  // Justification of violence
  | 5; // Mobilisation / action

export type NarrativePole =
  | 'TRANSNATIONAL_SOLIDARITY' // Religious-identity, ummah, Gaza → duty
  | 'ANTI_SYSTEMIC'            // Anti-imperialist, left, colonialism
  | 'REGIME_CAPTURE'           // Nationalist-sovereignty — regime tool, suppressor
  | 'MIXED';

export interface RadicalisationProfile {
  exposureLevel: number;       // 0–1: how much war/conflict content in environment
  emotionalActivation: number; // 0–1: anger, injustice, humiliation signals
  narrativeAlignment: number;  // 0–1: coherence of framing across sources
  ideologicalRigidity: number; // 0–1: exclusionary language, dismissal of alternatives
  escalationRisk: number;      // 0–1: composite RPI
  escalationLevel: EscalationLevel;
  escalationDelta: number;     // change since last computation (+ = deteriorating)
  dominantPole: NarrativePole;
  poleScores: Record<NarrativePole, number>;
  synergyCoefficent: number;   // how much poles are converging
  levelAlert: boolean;         // true if crossed level 3→4 threshold
  interventionWindow: boolean; // true if level ≤ 3
  detectedAt: number;
  articleCount: number;
  keySignals: string[];        // human-readable evidence
}

// ── Lexicons ───────────────────────────────────────────────────
// Structural signals only — shape of discourse, not direction

// EMOTIONAL ACTIVATION — anger, injustice, humiliation, identity threat
const EMOTIONAL_ACTIVATION_LEXICON: string[] = [
  // Arabic — core emotional signals
  'غضب', 'ظلم', 'إهانة', 'مجزرة', 'شهداء', 'دماء', 'أطفال يُقتلون',
  'لن نصمت', 'حرام', 'انتقام', 'لن نسامح', 'دفاع عن',
  'عار', 'خيانة', 'مذبحة', 'إبادة', 'جرائم',
  // French
  'injustice', 'massacre', 'honte', 'trahison', 'crime de guerre',
  'enfants tués', 'nous ne nous tairons pas', 'vengeance',
  'humiliation', 'génocide', 'atrocité', 'indignation',
  // English
  'massacre', 'genocide', 'war crime', 'shame', 'betrayal',
  'children killed', 'we will not be silent', 'outrage',
  'humiliation', 'atrocity', 'bloodshed',
];

// POLE 1 — TRANSNATIONAL SOLIDARITY (Religious-Identity)
// Highest RDE risk: connects external war to local identity + duty
const POLE1_LEXICON: string[] = [
  // Arabic
  'الأمة', 'الأمة الإسلامية', 'الأخوة', 'واجب ديني', 'فريضة',
  'الجهاد', 'المقاومة', 'شهيد', 'الشهادة', 'المسجد الأقصى',
  'القدس', 'فلسطين', 'غزة', 'نصرة', 'المسلمون',
  'الكفار', 'المرتدون', 'خونة الأمة', 'من ليس معنا فهو ضدنا',
  // French
  'oumma', 'devoir religieux', 'martyr', 'résistance',
  'Al-Aqsa', 'Jérusalem', 'fraternité islamique', 'solidarité',
  // English
  'ummah', 'religious duty', 'martyr', 'martyrdom', 'Al-Aqsa',
  'Jerusalem', 'Islamic solidarity', 'obligation',
];

// POLE 2 — ANTI-SYSTEMIC (Anti-Imperialist/Left)
// Medium RDE risk: strong activation but less likely to reach Level 4
const POLE2_LEXICON: string[] = [
  // Arabic
  'الاستعمار', 'الإمبريالية', 'الغرب', 'أمريكا الإمبريالية',
  'الرأسمالية', 'الصهيونية', 'المقاومة التحررية', 'التضامن',
  'النضال', 'الثورة', 'الشعوب المقهورة',
  // French
  'colonialisme', 'impérialisme', 'l\'Occident', 'capitalisme',
  'résistance', 'libération', 'solidarité', 'lutte',
  'peuples opprimés', 'révolution',
  // English
  'colonialism', 'imperialism', 'the West', 'capitalism',
  'resistance', 'liberation', 'solidarity', 'struggle',
  'oppressed peoples', 'revolution',
];

// POLE 3 — REGIME CAPTURE (Nationalist-Sovereignty)
// LOW RDE risk: regime channeling — suppression mechanism, not radicalization
// High score here = regime successfully redirecting emotional energy
const POLE3_LEXICON: string[] = [
  // Arabic — specifically Saied framing
  'الرئيس سعيّد', 'سيادة تونس', 'الشعب التونسي يقف', 'الدبلوماسية',
  'القطيعة مع', 'الاعتراف بالدولة الفلسطينية', 'الموقف التونسي',
  'دولة القانون', 'تونس تدعم', 'الحكومة التونسية',
  // French
  'la Tunisie soutient', 'diplomatie tunisienne', 'souveraineté',
  'position officielle', 'le gouvernement tunisien',
  'le président tunisien',
  // English
  'Tunisia supports', 'Tunisian diplomacy', 'sovereignty',
  'official position', 'Tunisian government', 'Tunisian president',
];

// IDEOLOGICAL RIGIDITY — structural signals of us/them hardening
// These are the critical Level 3→4 indicators
const RIGIDITY_LEXICON: string[] = [
  // Exclusionary language
  'الخونة', 'العملاء', 'المرتدون', 'الكفار', 'أعداء الشعب',
  'من ليس معنا فهو ضدنا', 'لا حياد', 'لا مكان للمحايدين',
  // Violence-adjacent justification
  'يستحقون', 'ما تبقى من حل', 'لا بد من', 'لا خيار',
  'حق الدفاع', 'استحقوا', 'حتمية التصادم',
  // French
  'traîtres', 'agents', 'apostats', 'ennemis du peuple',
  'qui n\'est pas avec nous est contre nous', 'pas de neutralité',
  'ils le méritent', 'il n\'y a plus d\'autre choix',
  'droit à la résistance', 'inévitable',
  // English
  'traitors', 'agents', 'apostates', 'enemies of the people',
  'who is not with us is against us', 'no neutrality',
  'they deserve it', 'no other choice', 'right to resist',
  'inevitable clash',
  // Dismissal of alternatives (key Level 3 signal)
  'لا فائدة من الحوار', 'النقاش لن يجدي', 'الكلام انتهى',
  'le dialogue est inutile', 'les mots ne suffisent plus',
  'talking is over', 'dialogue is useless', 'words are not enough',
];

// ESCALATION LEVEL KEYWORDS — specific to levels 4 and 5
const LEVEL4_SIGNALS: string[] = [
  // Justification of violence — the critical threshold
  'المقاومة المسلحة مشروعة', 'حق الكفاح المسلح',
  'العنف وسيلة مشروعة', 'لا بد من العمل المسلح',
  'la résistance armée est légitime', 'le droit à la lutte armée',
  'la violence est un moyen légitime',
  'armed resistance is legitimate', 'right to armed struggle',
  'violence is a legitimate means',
];

const LEVEL5_SIGNALS: string[] = [
  // Mobilization calls — action imminent
  'انضم إلى', 'تجنيد', 'الاستعداد للقتال', 'التحرك الآن',
  'الوقت للفعل', 'كل واحد منا مسؤول',
  'rejoignez', 'recrutement', 'préparez-vous au combat',
  'agissez maintenant', 'chacun d\'entre nous est responsable',
  'join', 'recruit', 'prepare to fight', 'act now',
  'every one of us is responsible',
];

// PEER NORMALIZATION — signals of spreading radicalization
const PEER_NORMALIZATION_RDE: string[] = [
  'الجميع يقول', 'الشباب يستيقظ', 'الأجيال القادمة',
  'صحب وأقارب', 'في كل الأحياء', 'حتى المعتدلون',
  'tout le monde dit', 'la jeunesse se réveille', 'même les modérés',
  'dans tous les quartiers', 'mes amis disent',
  'everyone is saying', 'youth are waking up', 'even moderates',
  'in every neighborhood', 'my friends say',
];

// ── Scoring Functions ──────────────────────────────────────────

function scoreExposure(articles: Article[], w_t: number): number {
  // Exposure = war coverage volume + W(t) contribution
  const warKeywords = [
    'guerre', 'war', 'حرب', 'bombardement', 'bombing', 'قصف',
    'Gaza', 'غزة', 'Palestine', 'فلسطين', 'Liban', 'لبنان',
    'Iran', 'إيران', 'Yémen', 'Yemen', 'اليمن',
    'Israel', 'إسرائيل', 'conflit', 'conflict', 'صراع',
    'attaque', 'attack', 'هجوم', 'victime', 'victim', 'ضحايا',
  ];

  const texts = articles.map(a =>
    (a.title + ' ' + (a.content || a.summary || '')).toLowerCase()
  );

  let warArticleCount = 0;
  for (const text of texts) {
    if (warKeywords.some(kw => text.includes(kw.toLowerCase()))) {
      warArticleCount++;
    }
  }

  const articleExposure = Math.min(1,
    warArticleCount / Math.max(articles.length, 1)
  );

  // Blend article exposure with W(t) (war intensity from EQ.8)
  return Math.min(1, articleExposure * 0.6 + w_t * 0.4);
}

function scoreEmotionalActivation(articles: Article[]): {
  score: number;
  signals: string[];
} {
  const signals: string[] = [];
  const texts = articles.map(a =>
    (a.title + ' ' + (a.content || a.summary || '')).toLowerCase()
  );

  let matches = 0;
  const matchedPhrases = new Set<string>();

  for (const text of texts) {
    for (const phrase of EMOTIONAL_ACTIVATION_LEXICON) {
      if (text.includes(phrase.toLowerCase())) {
        matches++;
        matchedPhrases.add(phrase);
      }
    }
  }

  // Also count ALARMIST-toned articles
  const alarmistCount = articles.filter(a => a.bias_tone === 'ALARMIST').length;
  matches += alarmistCount * 2;

  // High severity articles
  const highSev = articles.filter(a => a.severity >= 4).length;
  matches += highSev;

  // Sample signals for UI
  Array.from(matchedPhrases).slice(0, 4).forEach(p => signals.push(`Emotional phrase: "${p}"`));
  if (alarmistCount > 0) signals.push(`${alarmistCount} ALARMIST-tone articles`);

  return {
    score: Math.min(1, matches / (Math.max(articles.length, 1) * 3)),
    signals,
  };
}

function scorePoles(articles: Article[]): {
  poles: Record<NarrativePole, number>;
  dominant: NarrativePole;
  synergy: number;
  signals: string[];
} {
  const texts = articles.map(a =>
    (a.title + ' ' + (a.content || a.summary || '')).toLowerCase()
  );

  const signals: string[] = [];

  const countMatches = (lexicon: string[]) => {
    let count = 0;
    for (const text of texts) {
      for (const phrase of lexicon) {
        if (text.includes(phrase.toLowerCase())) count++;
      }
    }
    return count;
  };

  const p1Raw = countMatches(POLE1_LEXICON);
  const p2Raw = countMatches(POLE2_LEXICON);
  const p3Raw = countMatches(POLE3_LEXICON);
  const total = Math.max(p1Raw + p2Raw + p3Raw, 1);

  const poles: Record<NarrativePole, number> = {
    TRANSNATIONAL_SOLIDARITY: Math.min(1, p1Raw / total),
    ANTI_SYSTEMIC: Math.min(1, p2Raw / total),
    REGIME_CAPTURE: Math.min(1, p3Raw / total),
    MIXED: 0,
  };

  // Mixed = when P1 and P2 are both significant
  if (poles.TRANSNATIONAL_SOLIDARITY > 0.25 && poles.ANTI_SYSTEMIC > 0.25) {
    poles.MIXED = Math.min(1, (poles.TRANSNATIONAL_SOLIDARITY + poles.ANTI_SYSTEMIC) / 2);
  }

  // Dominant pole
  const sorted = Object.entries(poles)
    .filter(([k]) => k !== 'MIXED')
    .sort(([, a], [, b]) => b - a);
  const dominant = sorted[0][0] as NarrativePole;

  if (p1Raw > 0) signals.push(`Pole 1 (Solidarity): ${p1Raw} matches`);
  if (p2Raw > 0) signals.push(`Pole 2 (Anti-Systemic): ${p2Raw} matches`);
  if (p3Raw > 0) signals.push(`Pole 3 (Regime capture): ${p3Raw} matches`);

  // Synergy: poles converging on same emotional trigger
  // High when P1 and P2 are BOTH elevated (most dangerous combination)
  const riskPoles = [poles.TRANSNATIONAL_SOLIDARITY, poles.ANTI_SYSTEMIC];
  const minRisk = Math.min(...riskPoles);
  const maxRisk = Math.max(...riskPoles);
  const synergy = maxRisk > 0.1 ? minRisk / maxRisk : 0;

  if (synergy > 0.5) {
    signals.push(`HIGH SYNERGY: Poles 1+2 converging (${(synergy * 100).toFixed(0)}%)`);
  }

  return { poles, dominant, synergy, signals };
}

function scoreIdeologicalRigidity(articles: Article[]): {
  score: number;
  level4Detected: boolean;
  level5Detected: boolean;
  signals: string[];
} {
  const signals: string[] = [];
  const texts = articles.map(a =>
    (a.title + ' ' + (a.content || a.summary || '')).toLowerCase()
  );

  let rigidityMatches = 0;
  let level4Matches = 0;
  let level5Matches = 0;
  const rigidityFound = new Set<string>();

  for (const text of texts) {
    // General rigidity
    for (const phrase of RIGIDITY_LEXICON) {
      if (text.includes(phrase.toLowerCase())) {
        rigidityMatches++;
        rigidityFound.add(phrase);
      }
    }
    // Level 4: violence justification
    for (const phrase of LEVEL4_SIGNALS) {
      if (text.includes(phrase.toLowerCase())) {
        level4Matches++;
        signals.push(`⚠ Level 4 signal: "${phrase}"`);
      }
    }
    // Level 5: mobilization
    for (const phrase of LEVEL5_SIGNALS) {
      if (text.includes(phrase.toLowerCase())) {
        level5Matches++;
        signals.push(`🚨 Level 5 signal: "${phrase}"`);
      }
    }
  }

  // Peer normalization amplifies rigidity
  let peerMatches = 0;
  for (const text of texts) {
    for (const phrase of PEER_NORMALIZATION_RDE) {
      if (text.includes(phrase.toLowerCase())) peerMatches++;
    }
  }

  Array.from(rigidityFound).slice(0, 3).forEach(p =>
    signals.push(`Rigidity phrase: "${p}"`)
  );

  const baseScore = Math.min(0.8,
    (rigidityMatches * 0.08) +
    (level4Matches * 0.15) +
    (level5Matches * 0.20) +
    (peerMatches * 0.05)
  );

  return {
    score: Math.min(1, baseScore),
    level4Detected: level4Matches > 0,
    level5Detected: level5Matches > 0,
    signals,
  };
}

// ── Escalation Level Classifier ────────────────────────────────

function classifyEscalationLevel(
  emotional: number,
  alignment: number,
  rigidity: number,
  level4Detected: boolean,
  level5Detected: boolean
): EscalationLevel {
  if (level5Detected) return 5;
  if (level4Detected || rigidity > 0.65) return 4;
  if (rigidity > 0.45 || (emotional > 0.6 && alignment > 0.5)) return 3;
  if (alignment > 0.35 || emotional > 0.5) return 2;
  if (emotional > 0.25) return 1;
  return 0;
}

// ── RPI Composite Score ────────────────────────────────────────
// Additive with interaction terms — not purely multiplicative

function computeRPI(
  exposure: number,
  emotional: number,
  alignment: number,
  rigidity: number,
  synergy: number,
  dominantPole: NarrativePole
): number {
  // Base score: additive
  let rpi = (
    0.15 * exposure +
    0.30 * emotional +
    0.20 * alignment +
    0.25 * rigidity +
    0.10 * synergy
  );

  // Interaction terms: co-elevation multiplies risk
  // Emotional × Rigidity is the most dangerous combination
  const emotRigidInteraction = emotional * rigidity * 0.20;
  rpi += emotRigidInteraction;

  // Synergy boosts when two risk poles converge
  if (synergy > 0.5) {
    rpi *= (1 + synergy * 0.15);
  }

  // Pole modifier:
  // Pole 1 (Transnational Solidarity) is highest risk — identity + duty
  // Pole 2 (Anti-Systemic) is medium risk
  // Pole 3 (Regime Capture) is suppressor — slightly reduces RPI
  if (dominantPole === 'TRANSNATIONAL_SOLIDARITY') rpi *= 1.15;
  else if (dominantPole === 'ANTI_SYSTEMIC') rpi *= 1.05;
  else if (dominantPole === 'REGIME_CAPTURE') rpi *= 0.85;
  // MIXED: no modifier — handled by synergy term

  return Math.min(1, Math.max(0, rpi));
}

// ── RPI History (for delta computation) ───────────────────────

let _previousRPI: number = 0;
let _previousLevel: EscalationLevel = 0;

// ── Main Analysis Function ─────────────────────────────────────

export function analyzeRadicalisation(
  articles: Article[],
  w_t: number = 0.35  // War intensity from EQ.8
): RadicalisationProfile {
  if (!articles.length) {
    return {
      exposureLevel: 0,
      emotionalActivation: 0,
      narrativeAlignment: 0,
      ideologicalRigidity: 0,
      escalationRisk: 0,
      escalationLevel: 0,
      escalationDelta: 0,
      dominantPole: 'REGIME_CAPTURE',
      poleScores: {
        TRANSNATIONAL_SOLIDARITY: 0,
        ANTI_SYSTEMIC: 0,
        REGIME_CAPTURE: 0,
        MIXED: 0,
      },
      synergyCoefficent: 0,
      levelAlert: false,
      interventionWindow: true,
      detectedAt: Date.now(),
      articleCount: 0,
      keySignals: [],
    };
  }

  const allSignals: string[] = [];

  // 1. Exposure
  const exposure = scoreExposure(articles, w_t);
  if (exposure > 0.5) allSignals.push(`War exposure: ${(exposure * 100).toFixed(0)}%`);

  // 2. Emotional activation
  const emotResult = scoreEmotionalActivation(articles);
  allSignals.push(...emotResult.signals.slice(0, 2));

  // 3. Pole analysis
  const poleResult = scorePoles(articles);
  allSignals.push(...poleResult.signals.slice(0, 2));

  // 4. Ideological rigidity
  const rigidResult = scoreIdeologicalRigidity(articles);
  allSignals.push(...rigidResult.signals.slice(0, 3));

  // 5. Narrative alignment (how coherent is the framing)
  const alignment = Math.min(1,
    poleResult.poles[poleResult.dominant] * 1.5
  );

  // 6. Compute RPI
  const rpi = computeRPI(
    exposure,
    emotResult.score,
    alignment,
    rigidResult.score,
    poleResult.synergy,
    poleResult.dominant
  );

  // 7. Escalation level
  const level = classifyEscalationLevel(
    emotResult.score,
    alignment,
    rigidResult.score,
    rigidResult.level4Detected,
    rigidResult.level5Detected
  );

  // 8. Delta (change from previous)
  const delta = rpi - _previousRPI;
  const prevLevel = _previousLevel;
  _previousRPI = rpi;
  _previousLevel = level;

  // 9. Level alert: crossing 3→4 OR rapid delta > 0.15 in one cycle
  const levelAlert = (prevLevel <= 3 && level >= 4) || Math.abs(delta) > 0.15;

  return {
    exposureLevel: exposure,
    emotionalActivation: emotResult.score,
    narrativeAlignment: alignment,
    ideologicalRigidity: rigidResult.score,
    escalationRisk: rpi,
    escalationLevel: level,
    escalationDelta: delta,
    dominantPole: poleResult.dominant,
    poleScores: poleResult.poles,
    synergyCoefficent: poleResult.synergy,
    levelAlert,
    interventionWindow: level <= 3,
    detectedAt: Date.now(),
    articleCount: articles.length,
    keySignals: allSignals.slice(0, 8),
  };
}

// ── Equation Modifiers (what feeds back to rriEngine) ─────────

/**
 * EQ.4 SIR modifier
 * Radicalized individuals: higher β (spread), lower γ (recovery)
 *
 * Returns modified { beta, gamma } for eq4_sir call
 */
export function getSIRModifiers(rpi: number): {
  beta: number;
  gamma: number;
} {
  const BASE_BETA = 0.4;
  const BASE_GAMMA = 0.15;

  // RPI boosts transmission — radicalized spreads narrative faster
  // Max effect: β × 1.5 at RPI = 1
  const beta = Math.min(0.8, BASE_BETA * (1 + rpi * 0.5));

  // RPI reduces recovery — identity-level alignment is hard to reverse
  // Min effect: γ × 0.5 at RPI = 1
  const gamma = Math.max(0.05, BASE_GAMMA * (1 - rpi * 0.5));

  return { beta, gamma };
}

/**
 * EQ.3 Salience modifier
 * High RPI + High W(t) = war amplifies rather than suppresses salience
 * Returns μ coefficient: add μ × RPI × W(t) to salience numerator
 */
export const SALIENCE_MU = 0.15; // coupling coefficient

export function getSalienceRDEModifier(rpi: number, w_t: number): number {
  // War-synchronization effect:
  // When RPI is high, war stops suppressing domestic salience
  // and starts amplifying it instead
  return SALIENCE_MU * rpi * w_t;
}

/**
 * EQ.19 Information Amplification modifier
 * Radical content spreads faster and amplifies more
 * Returns multiplier applied to amplification output
 */
export function getAmplificationRDEMultiplier(rpi: number): number {
  // At RPI = 0: multiplier = 1.0 (no effect)
  // At RPI = 1: multiplier = 1.4 (40% more amplification)
  return 1 + rpi * 0.4;
}

// ── RPI for cluster pipeline (0-1) ────────────────────────────

export function computeRPIFromArticles(
  articles: Article[],
  w_t: number = 0.35
): number {
  const profile = analyzeRadicalisation(articles, w_t);
  return profile.escalationRisk;
}
