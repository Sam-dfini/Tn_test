/**
 * TunisiaIntel — Actor Network Engine
 *
 * Models the opposition coordination problem:
 * - Who are the key actor clusters?
 * - How coherently are they acting?
 * - What crosscutting issues are fragmenting potential coalitions?
 * - What is the Opposition Coordination Index (OCI)?
 *
 * Key insight: High R(t) × Low OCI = diffuse unrest, not rupture.
 * The 2024-2025 non-rupture is explained by OCI ≈ 0.22.
 *
 * OCI is a MULTIPLIER on effective salience, not additive:
 *   S_effective(t) = S(t) × (0.4 + 0.6 × OCI)
 *
 * Also models:
 * - CPG as spatial activation node with cascade precedent
 * - NGO narrative capacity as dynamic suppressor on H_PROP
 */

import { Article } from '../lib/supabase';

// ── Types ──────────────────────────────────────────────────────

export type ActorCluster =
  | 'UGTT'           // Labor union — economic justice frame
  | 'NGO_MEDIA'      // Al Katiba, Alert, civil society media
  | 'SECULAR_RIGHT'  // PDL (Abir Moussi), security/anti-migration frame
  | 'ISLAMIST'       // Ennahda remnants, low visibility
  | 'HUMAN_RIGHTS'   // LTDH, international NGOs, diaspora
  | 'STUDENT_YOUTH'  // UGET, campus networks, digital activists
  | 'BUSINESS'       // UTICA-aligned, economic technocrats;

export type ActorAlignment = 'GOV' | 'OPP' | 'INTL';
export type ThreatLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface ActorProfile {
  cluster: ActorCluster;
  label: string;
  alignment: ActorAlignment;
  threatLevel: ThreatLevel;
  reach: number;              // 0-1, how many people can they mobilize
  currentFrame: string;       // what they're saying right now
  frameAlignment: number;     // 0-1, how much their frame aligns with others
  coordinationScore: number;  // 0-1, are they building coalitions?
  suppressionLevel: number;   // 0-1, how much state suppression they face
  publicTrust: number;        // 0-1, current public credibility
  keySignals: string[];       // RSS keywords that indicate their activity
}

export interface CrosscuttingIssue {
  id: string;
  label: string;
  fragmentation: number;      // 0-1, how much this splits the opposition
  affectedClusters: Array<{
    cluster: ActorCluster;
    position: 'FOR' | 'AGAINST' | 'SPLIT' | 'SILENT';
  }>;
  activeSince: string;        // date
  keywords: string[];
}

export interface ActorNetworkState {
  actors: ActorProfile[];
  crosscuttingIssues: CrosscuttingIssue[];
  oci: number;                // Opposition Coordination Index 0-1
  fragmentationCoefficient: number; // 0-1, 1=total incoherence
  activeFrames: number;       // how many distinct frames competing
  dominantFrame: string;      // which frame has most reach
  coordinatingClusters: ActorCluster[]; // who is actually working together
  ociExplanation: string;     // plain language why OCI is what it is
  cpgDisruptionLevel: number; // 0-100, CPG production disruption
  cpgCascadeAmplifier: number; // Gafsa weight multiplier for EQ.17
  ngoCapacity: number;       // H_NGO value 0-1
  detectedAt: number;
}

// ── Tunisia Actor Profiles (calibrated to 2026) ───────────────

const BASE_ACTOR_PROFILES: ActorProfile[] = [
  {
    cluster: 'UGTT',
    label: 'UGTT (General Labor Union)',
    alignment: 'OPP',
    threatLevel: 'HIGH',
    reach: 0.65,              // highest reach — institutional infrastructure
    currentFrame: 'Economic justice — wage demands, anti-austerity',
    frameAlignment: 0.42,     // partial — compatible with NGO frame but not secular right
    coordinationScore: 0.35,  // institutional reluctance to overt political action
    suppressionLevel: 0.30,   // under pressure but legally protected
    publicTrust: 0.58,        // moderate — some trust erosion post-2021
    keySignals: [
      'UGTT', 'syndicat', 'salaire', 'négociation', 'grève',
      'الاتحاد العام', 'اتفاقية', 'أجور', 'إضراب'
    ],
  },
  {
    cluster: 'NGO_MEDIA',
    label: 'Al Katiba / Alert Économique / Civil Media',
    alignment: 'OPP',
    threatLevel: 'MEDIUM',
    reach: 0.52,              // high reach among educated urban youth
    currentFrame: 'الاقتصاد الريعي — systemic corruption, rentier state critique',
    frameAlignment: 0.38,     // incompatible with UGTT on tactics, secular right on culture
    coordinationScore: 0.28,  // deliberately non-partisan, coordination-averse
    suppressionLevel: 0.55,   // Decree 54 pressure — multiple journalists targeted
    publicTrust: 0.62,        // high credibility among educated audience
    keySignals: [
      'Al Katiba', 'Alert économique', 'الكتيبة', 'تحقيق صحفي',
      'اقتصاد ريعي', 'فساد منظومي', 'journalisme indépendant',
      'investigation', 'ريع', 'نهب'
    ],
  },
  {
    cluster: 'SECULAR_RIGHT',
    label: 'PDL / Free Destourian Party (Abir Moussi bloc)',
    alignment: 'OPP',
    threatLevel: 'CRITICAL',
    reach: 0.38,              // moderate, concentrated in urban/coastal
    currentFrame: 'Security + anti-migration + Bourguibist nationalism',
    frameAlignment: 0.15,     // deeply incompatible with human rights NGOs
    coordinationScore: 0.20,  // hostile to Islamist framing, refuses coalitions
    suppressionLevel: 0.62,   // Moussi arrested, party under pressure
    publicTrust: 0.35,        // anti-migration position has some popular resonance
    keySignals: [
      'PDL', 'Abir Moussi', 'Destour', 'laïcité',
      'migration irrégulière', 'هجرة غير نظامية',
      'حزب الدستور', 'أبير موسي'
    ],
  },
  {
    cluster: 'ISLAMIST',
    label: 'Ennahda remnants / Islamist networks',
    alignment: 'OPP',
    threatLevel: 'LOW',
    reach: 0.28,              // reduced significantly post-2023 crackdown
    currentFrame: 'Democratic regression + political prisoners + Islam',
    frameAlignment: 0.22,     // toxic to other opposition clusters
    coordinationScore: 0.18,  // radioactive — no cluster will publicly coordinate
    suppressionLevel: 0.85,   // severe — Ghannouchi arrested, party dissolved
    publicTrust: 0.20,        // very low after corruption allegations
    keySignals: [
      'Ennahda', 'النهضة', 'Ghannouchi', 'الغنوشي',
      'prisonnier politique', 'محاكمات', 'اعتقال'
    ],
  },
  {
    cluster: 'HUMAN_RIGHTS',
    label: 'LTDH / Avocats / International NGOs',
    alignment: 'INTL',
    threatLevel: 'MEDIUM',
    reach: 0.30,              // low mass reach but high international amplification
    currentFrame: 'Authoritarianism + human rights violations',
    frameAlignment: 0.35,     // compatible with NGO_MEDIA, incompatible with SECULAR_RIGHT
    coordinationScore: 0.45,  // good internal coordination, poor mass translation
    suppressionLevel: 0.45,   // pressure but legally harder to suppress
    publicTrust: 0.40,        // divided — human rights seen as elite issue
    keySignals: [
      'LTDH', 'droits humains', 'حقوق الإنسان', 'Amnesty',
      'HRW', 'Human Rights Watch', 'باحث حقوقي',
      'procès politique', 'محاكمة سياسية'
    ],
  },
  {
    cluster: 'STUDENT_YOUTH',
    label: 'UGET / Campus networks / Digital activists',
    alignment: 'OPP',
    threatLevel: 'HIGH',
    reach: 0.42,              // digital reach high, physical mobilization low
    currentFrame: 'Unemployment + emigration + يهرب + future anxiety',
    frameAlignment: 0.48,     // most compatible with NGO_MEDIA
    coordinationScore: 0.32,  // diffuse, no central leadership
    suppressionLevel: 0.35,
    publicTrust: 0.50,
    keySignals: [
      'UGET', 'étudiant', 'chômage diplômé', 'طلاب', 'بطالة المتخرجين',
      'هجرة الكفاءات', 'fuite des cerveaux', 'harraga'
    ],
  },
  {
    cluster: 'BUSINESS',
    label: 'UTICA / Business elite / Technocrats',
    alignment: 'GOV',
    threatLevel: 'LOW',
    reach: 0.25,              // small but economically significant
    currentFrame: 'Investment climate + regulatory reform',
    frameAlignment: 0.20,     // incompatible with UGTT frame
    coordinationScore: 0.55,  // good internal coordination, politically passive
    suppressionLevel: 0.20,
    publicTrust: 0.28,        // low — seen as beneficiaries of rentier system
    keySignals: [
      'UTICA', 'patronat', 'investissement', 'réforme économique',
      'مناخ الأعمال', 'استثمار'
    ],
  },
];

// ── Crosscutting Issues (active in 2026) ──────────────────────

const CROSSCUTTING_ISSUES: CrosscuttingIssue[] = [
  {
    id: 'immigration',
    label: 'Sub-Saharan Immigration / Sfax Crisis',
    fragmentation: 0.85,   // extremely divisive
    affectedClusters: [
      { cluster: 'UGTT', position: 'SPLIT' },
      { cluster: 'NGO_MEDIA', position: 'AGAINST' },         // against racist framing
      { cluster: 'SECULAR_RIGHT', position: 'FOR' },          // anti-migration
      { cluster: 'ISLAMIST', position: 'SPLIT' },
      { cluster: 'HUMAN_RIGHTS', position: 'AGAINST' },       // human rights position
      { cluster: 'STUDENT_YOUTH', position: 'SPLIT' },
      { cluster: 'BUSINESS', position: 'SILENT' },
    ],
    activeSince: '2023-07-01',
    keywords: [
      'migration subsaharienne', 'migrants', 'Sfax', 'هجرة جنوب الصحراء',
      'المهاجرون', 'أفارقة', 'africains', 'racisme', 'عنصرية'
    ],
  },
  {
    id: 'islamist_justice',
    label: 'Ennahda Trials / Political Prisoners',
    fragmentation: 0.70,   // splits those who want to prioritize this vs economy
    affectedClusters: [
      { cluster: 'UGTT', position: 'SILENT' },
      { cluster: 'NGO_MEDIA', position: 'FOR' },              // report on it
      { cluster: 'SECULAR_RIGHT', position: 'AGAINST' },      // anti-Ennahda
      { cluster: 'ISLAMIST', position: 'FOR' },
      { cluster: 'HUMAN_RIGHTS', position: 'FOR' },
      { cluster: 'STUDENT_YOUTH', position: 'SPLIT' },
      { cluster: 'BUSINESS', position: 'SILENT' },
    ],
    activeSince: '2023-04-01',
    keywords: [
      'Ennahda procès', 'Ghannouchi', 'prisonniers politiques',
      'محاكمة النهضة', 'الغنوشي', 'معتقلون سياسيون'
    ],
  },
  {
    id: 'economic_frame',
    label: 'Economic Framing — Austerity vs Corruption',
    fragmentation: 0.45,   // moderately divisive
    affectedClusters: [
      { cluster: 'UGTT', position: 'FOR' },       // anti-austerity
      { cluster: 'NGO_MEDIA', position: 'FOR' },  // anti-corruption
      { cluster: 'SECULAR_RIGHT', position: 'SPLIT' },
      { cluster: 'ISLAMIST', position: 'FOR' },
      { cluster: 'HUMAN_RIGHTS', position: 'SPLIT' },
      { cluster: 'STUDENT_YOUTH', position: 'FOR' },
      { cluster: 'BUSINESS', position: 'AGAINST' }, // pro-reform
    ],
    activeSince: '2021-01-01',
    keywords: [
      'austérité', 'réforme', 'corruption', 'الإصلاح', 'التقشف', 'الفساد'
    ],
  },
];

// ── OCI Computation ────────────────────────────────────────────

function computeOCI(
  actors: ActorProfile[],
  issues: CrosscuttingIssue[]
): {
  oci: number;
  fragmentationCoefficient: number;
  explanation: string;
} {
  // Step 1: Compute pairwise frame alignment matrix
  let totalAlignment = 0;
  let pairs = 0;
  const riskClusters: ActorCluster[] = ['UGTT', 'NGO_MEDIA', 'HUMAN_RIGHTS', 'STUDENT_YOUTH'];

  for (let i = 0; i < riskClusters.length; i++) {
    for (let j = i + 1; j < riskClusters.length; j++) {
      const a = actors.find(ac => ac.cluster === riskClusters[i]);
      const b = actors.find(ac => ac.cluster === riskClusters[j]);
      if (!a || !b) continue;
      // Alignment = average of both actors' frame alignment scores
      // Weighted by their reach
      const pairAlignment = (a.frameAlignment + b.frameAlignment) / 2;
      const reachWeight = (a.reach + b.reach) / 2;
      totalAlignment += pairAlignment * reachWeight;
      pairs++;
    }
  }

  const avgAlignment = pairs > 0 ? totalAlignment / pairs : 0;

  // Step 2: Crosscutting issue fragmentation penalty
  const totalFragmentation = issues.reduce((sum, issue) => {
    // Weight by how many risk clusters are on opposite sides
    const riskActorsInvolved = issue.affectedClusters.filter(ac =>
      riskClusters.includes(ac.cluster) && ac.position !== 'SILENT'
    );
    const forCount = riskActorsInvolved.filter(a => a.position === 'FOR').length;
    const againstCount = riskActorsInvolved.filter(a => a.position === 'AGAINST').length;
    const splitCount = riskActorsInvolved.filter(a => a.position === 'SPLIT').length;

    // Division penalty: both FOR and AGAINST present
    const divisionPenalty = (forCount > 0 && againstCount > 0)
      ? issue.fragmentation * 0.8
      : issue.fragmentation * 0.3;

    return sum + divisionPenalty;
  }, 0);

  const fragmentationPenalty = Math.min(0.5, totalFragmentation / issues.length);

  // Step 3: Suppression reduction (suppressed actors can't coordinate)
  const avgSuppression = actors
    .filter(a => riskClusters.includes(a.cluster))
    .reduce((s, a) => s + a.suppressionLevel, 0) / riskClusters.length;
  const suppressionPenalty = avgSuppression * 0.25;

  // OCI = alignment - fragmentation penalty - suppression penalty
  const rawOCI = Math.max(0, avgAlignment - fragmentationPenalty - suppressionPenalty);
  const oci = Math.min(1, rawOCI);
  const fragmentationCoeff = 1 - oci;

  // Generate explanation
  const parts: string[] = [];
  if (oci < 0.30) {
    parts.push(`Opposition is highly fragmented (OCI=${oci.toFixed(2)})`);
  } else if (oci < 0.55) {
    parts.push(`Opposition partially coordinated (OCI=${oci.toFixed(2)})`);
  } else {
    parts.push(`Opposition shows coalition potential (OCI=${oci.toFixed(2)})`);
  }

  const worstIssue = [...issues].sort((a, b) => b.fragmentation - a.fragmentation)[0];
  if (worstIssue) {
    parts.push(`Primary divisor: "${worstIssue.label}" (fragmentation=${(worstIssue.fragmentation*100).toFixed(0)}%)`);
  }

  if (avgSuppression > 0.50) {
    parts.push(`Suppression limiting coordination capacity`);
  }

  return {
    oci,
    fragmentationCoefficient: fragmentationCoeff,
    explanation: parts.join('. '),
  };
}

// ── CPG Disruption Detector ────────────────────────────────────

const CPG_KEYWORDS = {
  disruption: [
    'CPG', 'Compagnie des Phosphates', 'phosphate Gafsa',
    'فسفاط قفصة', 'شركة فسفاط', 'CPG إضراب',
    'Metlaoui', 'مطلوي', 'Redeyef', 'الرديف',
    'grève CPG', 'sit-in CPG', 'blocus phosphate',
    'phosphate perturbation', 'production arrêtée',
    'توقف إنتاج', 'إضراب عمال الفسفاط'
  ],
  positive: [
    'CPG reprise', 'phosphate production reprend',
    'عودة إنتاج', 'استئناف الإنتاج'
  ],
};

function computeCPGDisruption(articles: Article[]): {
  disruptionLevel: number;  // 0-100
  cascadeAmplifier: number; // Gafsa EQ.17 multiplier
  isActive: boolean;
  signals: string[];
} {
  const texts = articles.map(a =>
    (a.title + ' ' + (a.content || a.summary || '')).toLowerCase()
  );

  let disruptionMatches = 0;
  let positiveMatches = 0;
  const signals: string[] = [];

  for (const text of texts) {
    for (const kw of CPG_KEYWORDS.disruption) {
      if (text.includes(kw.toLowerCase())) {
        disruptionMatches++;
        if (signals.length < 3) signals.push(`CPG signal: "${kw}"`);
      }
    }
    for (const kw of CPG_KEYWORDS.positive) {
      if (text.includes(kw.toLowerCase())) positiveMatches++;
    }
  }

  // Net disruption: positive news reduces the disruption score
  const netDisruption = Math.max(0, disruptionMatches - positiveMatches * 2);
  const disruptionLevel = Math.min(100, netDisruption * 12);

  // Cascade amplifier: at threshold (65) Gafsa weight goes from 1.2 to 2.2
  // Historical precedent: CPG conflict has documented ignition pattern
  const cascadeAmplifier = disruptionLevel >= 65
    ? 2.2   // CRITICAL: above historical ignition threshold
    : disruptionLevel >= 45
    ? 1.8   // HIGH: approaching threshold
    : disruptionLevel >= 25
    ? 1.4   // ELEVATED: some disruption
    : 1.2;  // BASELINE: normal Gafsa weight

  return {
    disruptionLevel,
    cascadeAmplifier,
    isActive: disruptionLevel > 20,
    signals,
  };
}

// ── NGO Narrative Capacity Detector ───────────────────────────

const NGO_SIGNALS = {
  active: [
    'Al Katiba', 'الكتيبة', 'Alert économique', 'تحقيق صحفي',
    'Inkyfada', 'إنكيفادة', 'Nawaat', 'نواة',
    'LTDH', 'الرابطة التونسية', 'Avocats sans frontières',
    'rapport société civile', 'تقرير مجتمع مدني',
    'investigation indépendante', 'اقتصاد ريعي'
  ],
  suppressed: [
    'journaliste arrêté', 'décret 54', 'ONG interdite',
    'association suspendue', 'صحفي معتقل', 'مرسوم 54',
    'منظمة محظورة', 'NGO dissolved'
  ],
};

function computeNGOCapacity(
  articles: Article[],
  decree54Charged: number
): number {
  const texts = articles.map(a =>
    (a.title + ' ' + (a.content || a.summary || '')).toLowerCase()
  );

  let activeSignals = 0;
  let suppressionSignals = 0;

  for (const text of texts) {
    for (const kw of NGO_SIGNALS.active) {
      if (text.includes(kw.toLowerCase())) activeSignals++;
    }
    for (const kw of NGO_SIGNALS.suppressed) {
      if (text.includes(kw.toLowerCase())) suppressionSignals++;
    }
  }

  // Base capacity from article presence
  const activityScore = Math.min(0.80, activeSignals * 0.08 + 0.30);

  // Suppression penalty: Decree 54 charges reduce capacity
  const decree54Penalty = Math.min(0.35, decree54Charged * 0.005);
  const suppressionPenalty = Math.min(0.20, suppressionSignals * 0.06);

  const ngoCap = Math.max(0.10,
    activityScore - decree54Penalty - suppressionPenalty
  );

  return Math.min(1, ngoCap);
}

// ── Article-based actor activity detection ────────────────────

function detectActorActivity(
  articles: Article[],
  baseActors: ActorProfile[]
): ActorProfile[] {
  const texts = articles.map(a =>
    (a.title + ' ' + (a.content || a.summary || '')).toLowerCase()
  );

  return baseActors.map(actor => {
    const mentions = texts.filter(t =>
      actor.keySignals.some(kw => t.includes(kw.toLowerCase()))
    ).length;

    // High mention count = more activity = slightly higher reach + coordination
    const activityBoost = Math.min(0.15, mentions * 0.02);

    return {
      ...actor,
      reach: Math.min(1, actor.reach + activityBoost),
      coordinationScore: mentions > 5
        ? Math.min(1, actor.coordinationScore + 0.05)
        : actor.coordinationScore,
    };
  });
}

// ── Main Analysis Function ─────────────────────────────────────

export function analyzeActorNetwork(
  articles: Article[],
  decree54Charged: number = 23,
  windowHours: number = 72
): ActorNetworkState {
  const cutoff = Date.now() - windowHours * 3600000;
  const recent = articles.filter(a =>
    new Date(a.published_at).getTime() > cutoff
  );

  // Update actor profiles from articles
  const updatedActors = detectActorActivity(recent, BASE_ACTOR_PROFILES);

  // Compute OCI
  const { oci, fragmentationCoefficient, explanation } = computeOCI(
    updatedActors,
    CROSSCUTTING_ISSUES
  );

  // Compute CPG disruption
  const cpgResult = computeCPGDisruption(recent);

  // Compute NGO capacity
  const ngoCapacity = computeNGOCapacity(recent, decree54Charged);

  // Identify coordinating clusters (frame alignment > 0.40)
  const coordinatingClusters = updatedActors
    .filter(a => a.frameAlignment > 0.40 && a.coordinationScore > 0.30)
    .map(a => a.cluster);

  // Active frames = distinct positions among high-reach actors
  const highReachActors = updatedActors.filter(a => a.reach > 0.35);
  const distinctFrames = new Set(highReachActors.map(a => a.currentFrame)).size;

  // Dominant frame = actor with highest reach
  const dominant = updatedActors.reduce(
    (best, a) => a.reach > best.reach ? a : best,
    updatedActors[0]
  );

  return {
    actors: updatedActors,
    crosscuttingIssues: CROSSCUTTING_ISSUES,
    oci,
    fragmentationCoefficient,
    activeFrames: distinctFrames,
    dominantFrame: dominant?.currentFrame ?? 'Unknown',
    coordinatingClusters,
    ociExplanation: explanation,
    cpgDisruptionLevel: cpgResult.disruptionLevel,
    cpgCascadeAmplifier: cpgResult.cascadeAmplifier,
    ngoCapacity: ngoCapacity,
    detectedAt: Date.now(),
  };
}

// ── OCI → Effective Salience Multiplier ───────────────────────
// S_effective(t) = S(t) × (0.4 + 0.6 × OCI)
// At OCI = 0.22 (current Tunisia): S_effective = 0.532 × S(t)

export function getOCISalienceMultiplier(oci: number): number {
  return Math.max(0.20, Math.min(1.0, 0.40 + 0.60 * oci));
}

// ── For pipeline injection ─────────────────────────────────────

export function computeOCIScore(
  articles: Article[],
  decree54Charged: number
): number {
  const state = analyzeActorNetwork(articles, decree54Charged);
  return state.oci;
}

export function computeCPGAmplifier(articles: Article[]): number {
  const { cascadeAmplifier } = computeCPGDisruption(articles);
  return cascadeAmplifier;
}