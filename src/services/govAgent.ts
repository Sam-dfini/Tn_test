/**
 * TunisiaIntel — Government Agent
 *
 * A deterministic cognitive model of the Saied regime's
 * decision-making. Not a prompt. Not an LLM. A rule-based
 * engine that reads model state and outputs predicted
 * regime behavior.
 *
 * Architecture:
 *   Strategic Brain  → hard constraints + survival function
 *   Narrative Mouth  → public positioning, audience-targeted
 *   Consistency Filter → detects brain/mouth divergence
 *   Reflex Layer     → security apparatus, faster than both
 *
 * The regime's objective function:
 *   Maximize(survival) subject to:
 *     - Military loyalty ≥ minimum threshold
 *     - Western security cooperation ≠ broken
 *     - Domestic economic minimum ≠ breached
 *     - Elite cohesion ≥ minimum threshold
 *
 * Outputs:
 *   - Threat perception (how the regime sees current state)
 *   - Predicted actions (7-day, 30-day, 90-day horizons)
 *   - Narrative prediction (what it will say publicly)
 *   - Brain/Mouth divergence (strategic ambiguity signals)
 *   - Constraint stress (which hard limits are under pressure)
 */

// ── Types ──────────────────────────────────────────────────────

export type ThreatLevel =
  | 'BASELINE'      // Normal operations, no acute threat
  | 'ELEVATED'      // Increased attention, monitoring intensified
  | 'DEFENSIVE'     // Active defensive measures, suppression rising
  | 'CRISIS'        // Survival-mode operations
  | 'EMERGENCY';    // Existential threat, all tools deployed

export type RegimeActionType =
  | 'SUPPRESSION_TARGETED'     // Decree 54 / specific arrest
  | 'SUPPRESSION_BROAD'        // Mass arrests, media shutdown
  | 'NARRATIVE_INJECTION'      // State media campaign
  | 'DISTRACTION_GENERATE'     // Create diversionary event
  | 'ELITE_LOYALTY_REINFORCE'  // Cabinet reshuffle, patronage
  | 'ECONOMIC_EMERGENCY'       // IMF outreach, Gulf call, subsidy move
  | 'MIGRATION_DEPLOY'         // Use migration as EU leverage/distraction
  | 'ANTI_CORRUPTION_ARREST'   // Former official prosecution
  | 'CONSTITUTIONAL_MOVE'      // Legal/institutional maneuver
  | 'SECURITY_APPARATUS_SIGNAL' // Military/police public display
  | 'DIPLOMATIC_RESET'         // Foreign relations move
  | 'DIGITAL_SUPPRESSION';     // Internet throttling, social media pressure

export type NarrativeFrame =
  | 'SOVEREIGNTY'         // "We are not a protectorate"
  | 'ANTI_CORRUPTION'     // "Cleaning up the old system"
  | 'STABILITY'           // "Chaos or order"
  | 'MIGRATION_BUFFER'    // "We defend Europe's border"
  | 'ECONOMIC_REFORM'     // "Difficult but necessary"
  | 'ANTI_IMPERIALISM'    // "Foreign interference rejected"
  | 'SOCIAL_UNITY'        // "Tunisians united"
  | 'SECURITY_THREAT';    // "Enemies of the state"

export const ACTION_LABELS: Record<RegimeActionType, string> = {
  SUPPRESSION_TARGETED: 'Targeted Suppression',
  SUPPRESSION_BROAD: 'Broad Suppression',
  NARRATIVE_INJECTION: 'Narrative Injection',
  DISTRACTION_GENERATE: 'Distraction Event',
  ELITE_LOYALTY_REINFORCE: 'Elite Loyalty Signal',
  ECONOMIC_EMERGENCY: 'Economic Emergency Outreach',
  MIGRATION_DEPLOY: 'Migration Lever Deployed',
  ANTI_CORRUPTION_ARREST: 'Anti-Corruption Arrest',
  CONSTITUTIONAL_MOVE: 'Constitutional/Legal Move',
  SECURITY_APPARATUS_SIGNAL: 'Security Apparatus Signal',
  DIPLOMATIC_RESET: 'Diplomatic Reset',
  DIGITAL_SUPPRESSION: 'Digital Suppression',
};

export const FRAME_LABELS: Record<NarrativeFrame, string> = {
  SOVEREIGNTY: 'Sovereignty / Anti-Interference',
  ANTI_CORRUPTION: 'Anti-Corruption Campaign',
  STABILITY: 'Stability vs Chaos',
  MIGRATION_BUFFER: 'Migration Buffer Leverage',
  ECONOMIC_REFORM: 'Difficult Reform Narrative',
  ANTI_IMPERIALISM: 'Anti-Imperialist Signaling',
  SOCIAL_UNITY: 'Social Unity Frame',
  SECURITY_THREAT: 'Security Threat Narrative',
};

export interface RegimeAction {
  type: RegimeActionType;
  probability: number;         // 0-1
  horizon: '7d' | '30d' | '90d';
  trigger: string;             // what condition is driving this
  mechanism: string;           // how it will manifest
  targetVariable: string;      // which RRI variable this affects
  estimatedEffect: string;     // what happens to that variable
  historicalPrecedent?: string; // Tunisia case evidence
  detectableSignal: string;    // how to observe this in RSS/pipeline
}

export interface ConstraintStress {
  constraint: string;
  current: number;             // 0-1, 0=healthy, 1=critical
  threshold: number;           // when crossed, behavior changes
  status: 'HEALTHY' | 'STRESSED' | 'NEAR_LIMIT' | 'BREACHED';
  implication: string;
}

export interface BrainMouthDivergence {
  topic: string;
  brainPosition: string;       // what regime is actually doing/planning
  mouthPosition: string;       // what it says publicly
  divergenceScore: number;     // 0-1, how far apart they are
  audienceTargeted: string;    // who the mouth is talking to
  strategicPurpose: string;    // why the divergence serves the regime
}

export interface GovAgentAssessment {
  // Threat perception
  threatLevel: ThreatLevel;
  threatScore: number;         // 0-100
  threatDrivers: string[];     // top 3 signals regime is watching

  // Constraints
  constraintStresses: ConstraintStress[];
  criticalConstraint: string | null;

  // Predicted actions
  predictedActions: RegimeAction[];
  mostLikelyAction: RegimeAction | null;
  urgentActions: RegimeAction[];   // probability > 0.55

  // Brain/Mouth
  activeNarrativeFrame: NarrativeFrame;
  narrativePrediction: string;     // what it will say
  brainMouthDivergences: BrainMouthDivergence[];
  strategicAmbiguityLevel: number; // 0-1

  // Regime state
  survivalConfidence: number;  // 0-100, how secure the regime feels
  adaptationMode: string;      // what operational mode it's in
  regimePhase: string;         // historical pattern label

  // Intelligence summary
  analystAssessment: string;
  watchSignals: string[];      // what to watch in RSS
  generatedAt: string;
}

// ── Constraint Stress Evaluators ──────────────────────────────

function evalMilitaryLoyalty(
  eliteCohesion: number,
  eliteDefectionProb: number,
  mii: number,
  miiPhase: string,
  loyalistConcentration: number
): ConstraintStress {
  // Military loyalty is a step function, not gradual
  // High loyalist concentration LOOKS stable but is actually fragile
  const stressScore = Math.min(1,
    (1 - eliteCohesion) * 0.45 +
    eliteDefectionProb * 0.35 +
    (miiPhase === 'FREEZE' ? 0.15 : miiPhase === 'CHAOTIC' ? 0.20 : 0.05)
  );

  return {
    constraint: 'Military Loyalty',
    current: stressScore,
    threshold: 0.55,
    status: stressScore >= 0.55 ? 'NEAR_LIMIT'
          : stressScore >= 0.40 ? 'STRESSED'
          : 'HEALTHY',
    implication: stressScore >= 0.55
      ? 'Military cohesion under serious pressure. Single public defection could cascade. Watch: Interior Ministry changes.'
      : stressScore >= 0.40
      ? 'Loyalty maintained but calculation pressure rising. Patronage networks need reinforcement.'
      : 'Military loyalty stable. Regime can operate without existential concern on this dimension.',
  };
}

function evalWesternAlignment(
  imfDealProbability: number,
  fxReserves: number,
  decree54Charged: number,
  pressFreedomRank: number
): ConstraintStress {
  // Western alignment stress: too much suppression risks the structural dependency
  const suppressionVisibility = Math.min(1,
    (decree54Charged / 40) * 0.40 +
    (pressFreedomRank / 180) * 0.30
  );
  const economicDependency = Math.min(1,
    (1 - imfDealProbability / 100) * 0.50 +
    (1 - fxReserves / 120) * 0.50
  );
  const stressScore = suppressionVisibility * 0.35 + economicDependency * 0.65;

  return {
    constraint: 'Western Structural Alignment',
    current: stressScore,
    threshold: 0.65,
    status: stressScore >= 0.65 ? 'NEAR_LIMIT'
          : stressScore >= 0.45 ? 'STRESSED'
          : 'HEALTHY',
    implication: stressScore >= 0.65
      ? 'Western alignment under maximum pressure. Regime cannot afford IMF rupture but suppression is generating diplomatic costs. Migration leverage is being actively deployed.'
      : stressScore >= 0.45
      ? 'Tension between domestic legitimacy needs and Western dependency. Expect mouth-brain divergence to intensify.'
      : 'Western alignment stable. Economic and security cooperation continuing.',
  };
}

function evalEconomicMinimum(
  fxReserves: number,
  inflation: number,
  seiMax: number,
  seiPhase: number,
  unemployment: number
): ConstraintStress {
  // Economic minimum: not "good economy" but "below rupture threshold"
  const stressScore = Math.min(1,
    (1 - fxReserves / 120) * 0.35 +
    (inflation / 15) * 0.25 +
    seiMax * 0.25 +
    (seiPhase >= 4 ? 0.15 : seiPhase >= 3 ? 0.08 : 0)
  );

  return {
    constraint: 'Domestic Economic Minimum',
    current: stressScore,
    threshold: 0.60,
    status: stressScore >= 0.60 ? 'NEAR_LIMIT'
          : stressScore >= 0.40 ? 'STRESSED'
          : 'HEALTHY',
    implication: stressScore >= 0.60
      ? 'Economic floor at risk. Bread/fuel supply chain stress directly threatens urban middle class activation. This is the regime\'s hardest constraint — domestic economic failure triggers the groups that 2011 required.'
      : stressScore >= 0.40
      ? 'Economic pressure elevated but manageable. Interior governorate distress continues. Coastal urban calm maintained.'
      : 'Economic indicators above minimum threshold. Regime not in survival-economic mode.',
  };
}

function evalEliteCohesion(
  mii: number,
  miiPhase: string,
  loyalistConcentration: number,
  eliteDefectionProb: number
): ConstraintStress {
  // Paradox: HIGH loyalist concentration = FREEZE = actually high risk
  const stressScore = Math.min(1,
    mii * 0.40 +
    (miiPhase === 'FREEZE' ? 0.20 : miiPhase === 'CHAOTIC' ? 0.25 : 0.05) +
    eliteDefectionProb * 0.25 +
    (loyalistConcentration > 0.80 ? 0.15 : 0.05) // high loyalism = fragility
  );

  return {
    constraint: 'Elite Cohesion Network',
    current: stressScore,
    threshold: 0.55,
    status: stressScore >= 0.55 ? 'NEAR_LIMIT'
          : stressScore >= 0.35 ? 'STRESSED'
          : 'HEALTHY',
    implication: miiPhase === 'FREEZE' && loyalistConcentration > 0.75
      ? 'FREEZE with high loyalist concentration is the most dangerous configuration. Surface stability masks maximum internal fragility. Remaining independents face increasing calculation pressure.'
      : stressScore >= 0.55
      ? 'Elite cohesion network under pressure. Patronage distribution may be insufficient. Watch for informal defection signals.'
      : 'Elite cohesion adequate. Core institutional loyalty maintained.',
  };
}

// ── Threat Perception Engine ───────────────────────────────────

function computeThreatPerception(
  rri: number,
  velocity: number,
  cascadeProb: number,
  oci: number,
  protestCount: number,
  ugttLevel: string,
  seiAngerWindow: boolean,
  miiPhase: string
): {
  level: ThreatLevel;
  score: number;
  drivers: string[];
} {
  // Regime threat perception ≠ actual risk
  // The regime is MOST sensitive to:
  //   1. Tunis activation (not Gafsa alone)
  //   2. Elite defection signals (more than street protests)
  //   3. UGTT formal action (not informal sentiment)
  // It is LESS sensitive to:
  //   1. Interior grievance (viewed as manageable/containable)
  //   2. International pressure (handled via divergence)

  const drivers: string[] = [];
  let score = 0;

  // UGTT — highest threat sensitivity
  if (ugttLevel === 'HIGH') {
    score += 28;
    drivers.push(`UGTT at HIGH — formal strike action proximity`);
  } else if (ugttLevel === 'ELEVATED') {
    score += 14;
    drivers.push(`UGTT elevated — monitoring wage escalation`);
  }

  // Velocity — acceleration feels more threatening than level
  if (velocity > 0.20) {
    score += 22;
    drivers.push(`System accelerating V(t)=${velocity.toFixed(3)} — rapid deterioration`);
  } else if (velocity > 0.12) {
    score += 12;
  }

  // SEI anger window — food crisis reaches Tunis
  if (seiAngerWindow) {
    score += 20;
    drivers.push(`Food anger window active — commodity crisis approaching urban population`);
  }

  // Elite signals
  if (miiPhase === 'CHAOTIC') {
    score += 18;
    drivers.push(`MII CHAOTIC — internal elite management failing`);
  } else if (miiPhase === 'FREEZE') {
    score += 8; // regime created this, sees it as control not crisis
  }

  // Protest density
  if (protestCount > 35) {
    score += 15;
    drivers.push(`Protest density ${protestCount}/month approaching urban threshold`);
  } else if (protestCount > 25) {
    score += 8;
  }

  // Cascade — only becomes threat when Tunis at risk
  if (cascadeProb > 0.65) {
    score += 12;
    drivers.push(`Cascade probability ${(cascadeProb*100).toFixed(0)}% — spread to Sfax/Tunis corridor`);
  }

  // OCI — low OCI is GOOD for regime (opposition fragmented)
  // High OCI is BAD (opposition coordinating)
  if (oci > 0.50) {
    score += 15;
    drivers.push(`OCI rising ${(oci*100).toFixed(0)}% — opposition coordination increasing`);
  } else if (oci < 0.25) {
    score -= 5; // regime partially reassured by fragmentation
  }

  score = Math.min(100, Math.max(0, score));

  const level: ThreatLevel =
    score >= 80 ? 'EMERGENCY' :
    score >= 60 ? 'CRISIS' :
    score >= 40 ? 'DEFENSIVE' :
    score >= 20 ? 'ELEVATED' :
    'BASELINE';

  return { level, score, drivers: drivers.slice(0, 3) };
}

// ── Action Prediction Engine ───────────────────────────────────

function predictActions(
  threatLevel: ThreatLevel,
  threatScore: number,
  constraints: ConstraintStress[],
  rri: number,
  velocity: number,
  oci: number,
  ngoCapacity: number,
  decree54Charged: number,
  fxReserves: number,
  inflation: number,
  seiMax: number,
  seiPhase: number,
  ugttLevel: string,
  miiPhase: string,
  cascadeProb: number,
  imfDealProb: number
): RegimeAction[] {
  const actions: RegimeAction[] = [];

  const westernStress = constraints.find(c => c.constraint === 'Western Structural Alignment');
  const eliteStress = constraints.find(c => c.constraint === 'Elite Cohesion Network');
  const economicStress = constraints.find(c => c.constraint === 'Domestic Economic Minimum');

  // ── Action 1: Targeted suppression (Decree 54) ──────────────
  // Fires when NGO capacity is between 0.35-0.65 (too active but not yet controlled)
  // and threat is at least ELEVATED
  if (ngoCapacity > 0.35 && ngoCapacity < 0.70 && threatScore >= 20) {
    const baseProbability = 0.40 + (ngoCapacity - 0.35) * 0.60 + (threatScore / 200);
    actions.push({
      type: 'SUPPRESSION_TARGETED',
      probability: Math.min(0.88, baseProbability),
      horizon: ngoCapacity > 0.55 ? '7d' : '30d',
      trigger: `NGO narrative capacity at ${(ngoCapacity*100).toFixed(0)}% — regime needs information control reinforcement`,
      mechanism: 'Decree 54 prosecution of media figure or activist with high social media reach. Likely targeting: investigative journalist or civil society coordinator.',
      targetVariable: 'G71 / H_NGO',
      estimatedEffect: 'NGO capacity −0.05 to −0.12. Chilling effect on remaining active voices.',
      historicalPrecedent: '2023-2024: Al Katiba journalists, LTDH members, economists targeted as digital reach grew',
      detectableSignal: 'RSS: "décret 54 arrestation", "journaliste arrêté", "arrêté Tunis", "مرسوم 54 اعتقال"',
    });
  }

  // ── Action 2: Anti-corruption narrative injection ────────────
  // Classic distraction when economic pressure rises
  if (inflation > 7.0 || seiMax > 0.50 || (economicStress?.current ?? 0) > 0.40) {
    const prob = Math.min(0.82,
      0.35 + (inflation / 20) * 0.25 + seiMax * 0.20
    );
    actions.push({
      type: 'ANTI_CORRUPTION_ARREST',
      probability: prob,
      horizon: '30d',
      trigger: `Economic pressure (inflation=${inflation.toFixed(1)}%, SEI=${(seiMax*100).toFixed(0)}%) requiring legitimacy displacement`,
      mechanism: 'Arrest/investigation of former RCD-era official or businessperson linked to "old regime." High-profile, media-saturated. Targeted to shift anger from current governance to historical corruption.',
      targetVariable: 'D41 / O151',
      estimatedEffect: 'Temporary legitimacy boost (+0.05 D41). Salience redirection for 7-14 days. No structural improvement.',
      historicalPrecedent: '2022-2024: Multiple "big fish" arrests used to absorb economic anger cycles',
      detectableSignal: 'RSS: "arrestation corruption", "ancien responsable arrêté", "قضية فساد جديدة", "محاسبة"',
    });
  }

  // ── Action 3: Migration leverage deployment ──────────────────
  // Deploys when Western (EU) pressure on human rights increases
  // AND FX reserves need external financing
  if (fxReserves < 95 && (westernStress?.current ?? 0) > 0.40) {
    const prob = Math.min(0.75,
      0.30 + (1 - fxReserves/120) * 0.30 + (westernStress?.current ?? 0) * 0.25
    );
    actions.push({
      type: 'MIGRATION_DEPLOY',
      probability: prob,
      horizon: '30d',
      trigger: `Western dependency pressure (FX=${fxReserves}d, IMF=${imfDealProb}%) — EU leverage activation`,
      mechanism: 'Border incident escalation, public statement on migration burden, or selective enforcement loosening that generates EU alarm. Message: "Tunisia is indispensable." Simultaneously signals domestic audience anti-migration credentials.',
      targetVariable: 'F63 / I92',
      estimatedEffect: 'Resets EU financial discussion. Buys 30-60 days of diplomatic cover. Domestic OCI remains low (keeps immigration issue active as opposition splitter).',
      historicalPrecedent: '2023 Sfax incident used to negotiate EU migration deal. Pattern repeats at FX pressure points.',
      detectableSignal: 'RSS: "Sfax migrants", "accord migration UE", "بيان رئاسي هجرة", "رفع تونس طلبًا أوروبيًا"',
    });
  }

  // ── Action 4: Elite loyalty reinforcement ───────────────────
  // Cabinet adjustment, patronage redistribution
  if (miiPhase === 'FREEZE' && (eliteStress?.current ?? 0) > 0.40) {
    actions.push({
      type: 'ELITE_LOYALTY_REINFORCE',
      probability: Math.min(0.65, 0.30 + (eliteStress?.current ?? 0) * 0.50),
      horizon: '30d',
      trigger: `MII FREEZE with ${((eliteStress?.current ?? 0)*100).toFixed(0)}% elite stress — patronage networks need maintenance`,
      mechanism: 'Appointment/promotion within security apparatus or judiciary. Salary adjustments for specific institutional loyalists. Not publicly visible — manifests in personnel announcements.',
      targetVariable: 'D_MII / N141',
      estimatedEffect: 'Short-term loyalty reinforcement. Does not address structural MII fragility. Pattern historically delays but accelerates eventual fracture.',
      historicalPrecedent: 'August 2023 Interior Ministry appointment: Khaled Nouri installed at peak of migration crisis',
      detectableSignal: 'RSS: "nomination ministre", "nouveau directeur", "وزير جديد", "تعيين مسؤول"',
    });
  }

  // ── Action 5: Economic emergency outreach ───────────────────
  if (fxReserves < 85 || imfDealProb < 25) {
    const urgency = fxReserves < 75 ? 'CRISIS' : 'ELEVATED';
    actions.push({
      type: 'ECONOMIC_EMERGENCY',
      probability: Math.min(0.78,
        0.35 + (1 - fxReserves/100) * 0.35 + (1 - imfDealProb/100) * 0.15
      ),
      horizon: fxReserves < 80 ? '7d' : '30d',
      trigger: `FX reserves at ${fxReserves} days — ${urgency} financial pressure requiring emergency financing`,
      mechanism: 'Gulf sovereign wealth fund call (Saudi/UAE/Qatar). IMF technical negotiation restart. Public: "we handle our own affairs." Private: emergency financing request. Mouth says sovereignty, brain calls Riyadh.',
      targetVariable: 'A_FX / I92',
      estimatedEffect: 'Gulf bridge loan (+$1-2B) buys 30-60 days. Does not resolve structural deficit. Resets IMF timeline.',
      historicalPrecedent: 'December 2022, March 2024: Gulf calls preceded public IMF rejection statements',
      detectableSignal: 'RSS: "visite officielle Arabie", "Qatar aide Tunisie", "زيارة الرياض", "دعم مالي خليجي"',
    });
  }

  // ── Action 6: Security apparatus signal ─────────────────────
  // Military/police visibility display when protest density rises
  if (cascadeProb > 0.55 || (threatScore >= 50 && ugttLevel === 'HIGH')) {
    actions.push({
      type: 'SECURITY_APPARATUS_SIGNAL',
      probability: Math.min(0.70,
        0.25 + cascadeProb * 0.35 + (threatScore / 200)
      ),
      horizon: '7d',
      trigger: `Cascade probability ${(cascadeProb*100).toFixed(0)}% — regime deploys deterrence signal`,
      mechanism: 'Security force visibility in interior governorates. Military vehicle presence. Gafsa or Kasserine security deployment announcement. Not necessarily violent — demonstrates presence to preempt mobilization.',
      targetVariable: 'N141 / N142',
      estimatedEffect: 'Short-term deterrence. Raises cost of street mobilization. May backfire if perceived as overreaction — historical precedent: 2011 excessive force accelerated cascade.',
      historicalPrecedent: 'Pre-emptive security presence in Gafsa basin deployed 3x in 2022-2024 at CPG tension peaks',
      detectableSignal: 'RSS: "déploiement sécurité Gafsa", "رجال الأمن قفصة", "حضور أمني مكثف", "قوات الجيش"',
    });
  }

  // ── Action 7: Digital suppression ───────────────────────────
  // When viral content threatens control
  if (ngoCapacity > 0.60 && velocity > 0.15) {
    actions.push({
      type: 'DIGITAL_SUPPRESSION',
      probability: Math.min(0.55, 0.20 + ngoCapacity * 0.25 + velocity * 0.20),
      horizon: '7d',
      trigger: `Information amplification high + NGO capacity ${(ngoCapacity*100).toFixed(0)}% — digital control threatened`,
      mechanism: 'VPN restrictions, social media throttling, strategic platform slowdown during peak content periods. Plausibly deniable as "technical issues." Targets reach without generating visible arrest.',
      targetVariable: 'C_DD / H_NGO',
      estimatedEffect: 'Reduces information amplification A(t). NGO narrative reach drops 15-25%.',
      historicalPrecedent: 'Instagram/TikTok throttling documented during protest episodes 2022-2023',
      detectableSignal: 'RSS: "internet lent", "réseau ralenti", "VPN Tunisie", "إنترنت بطيء تونس", "تباطؤ الإنترنت"',
    });
  }

  // ── Action 8: Constitutional/legal maneuver ──────────────────
  // Institutional capture when external pressure increases
  if ((westernStress?.current ?? 0) > 0.50 && threatScore >= 35) {
    actions.push({
      type: 'CONSTITUTIONAL_MOVE',
      probability: Math.min(0.45, 0.15 + (westernStress?.current ?? 0) * 0.35),
      horizon: '90d',
      trigger: `Western alignment stress ${((westernStress?.current ?? 0)*100).toFixed(0)}% — institutional consolidation accelerates`,
      mechanism: 'New decree or constitutional interpretation that extends executive control over remaining independent institution. Judiciary, electoral commission, or media authority. Pattern: external pressure → domestic consolidation, not liberalization.',
      targetVariable: 'D69 / G71 / D41',
      estimatedEffect: 'Captures remaining institutional independence. Increases D41 (political stability) short-term, reduces D75 (judicial independence). Net: higher fragility with lower measurable instability.',
      historicalPrecedent: 'July 2021, September 2022: external pressure events preceded constitutional consolidation moves',
      detectableSignal: 'RSS: "décret présidentiel", "réforme judiciaire", "مرسوم رئاسي", "إصلاح قضائي"',
    });
  }

  // Sort by probability descending
  return actions.sort((a, b) => b.probability - a.probability);
}

// ── Narrative Prediction Engine ────────────────────────────────

function predictNarrative(
  threatLevel: ThreatLevel,
  constraints: ConstraintStress[],
  inflation: number,
  fxReserves: number,
  ugttLevel: string,
  decree54Charged: number,
  imfDealProb: number
): {
  frame: NarrativeFrame;
  prediction: string;
  divergences: BrainMouthDivergence[];
  strategicAmbiguityLevel: number;
} {
  const westernStress = constraints.find(c => c.constraint === 'Western Structural Alignment');
  const economicStress = constraints.find(c => c.constraint === 'Domestic Economic Minimum');

  // Primary frame selection
  let frame: NarrativeFrame = 'STABILITY';
  let divergences: BrainMouthDivergence[] = [];

  if (westernStress && westernStress.current > 0.50) {
    frame = 'SOVEREIGNTY';
  } else if (economicStress && economicStress.current > 0.45) {
    frame = 'ANTI_CORRUPTION';
  } else if (ugttLevel === 'HIGH') {
    frame = 'STABILITY';
  }

  // Build narrative prediction text
  const framePredictions: Record<NarrativeFrame, string> = {
    SOVEREIGNTY: 'Expect sovereignty discourse amplification. Statements rejecting "foreign interference in Tunisian affairs." Anti-IMF rhetoric that does not translate to actual deal refusal. Probable trigger: Western diplomatic statement on human rights or Decree 54.',
    ANTI_CORRUPTION: `Expect anti-corruption prosecution announcement or investigative commission report. High-profile target from "old regime" will be identified. Inflation at ${inflation.toFixed(1)}% needs legitimacy displacement toward historical culprits, not current policy.`,
    STABILITY: 'Expect chaos-or-order framing. Opposition characterized as destabilizing agents serving foreign interests. Security discourse emphasizing that current instability is engineered, not structural.',
    MIGRATION_BUFFER: 'Expect migration/border management statements directed at European audience. Tunisia as indispensable buffer. Domestic: sovereignty over migration management. European: cooperation signal with implicit financial dependency leverage.',
    ECONOMIC_REFORM: 'Expect "difficult but necessary" economic framing. Sacrifice narrative. Historical failures blamed on predecessor government.',
    ANTI_IMPERIALISM: 'Expect regional solidarity signaling — Palestine solidarity statements, anti-Western multilateralism rhetoric. Targeted at domestic and MENA audience. Does not reflect actual alignment.',
    SOCIAL_UNITY: '"All Tunisians are united" framing. Minimization of social divisions. Interior governorate distress characterized as isolated, not systemic.',
    SECURITY_THREAT: 'Threat-actor identification. Opposition figures characterized as security threats. Links drawn between protest activity and foreign funding.',
  };

  // Brain/Mouth divergences (the core intelligence value)
  divergences = [
    {
      topic: 'IMF / Western financing',
      brainPosition: 'Regime desperately needs IMF deal or Gulf bridge financing. FX floor approaching. Real decisions: emergency financial calls to Riyadh, quiet IMF technical negotiations continuing.',
      mouthPosition: '"Tunisia does not accept dictated conditions." "We manage our own economy." Rejection of IMF conditionality framing.',
      divergenceScore: 0.75,
      audienceTargeted: 'Domestic — anti-austerity sentiment requires sovereignty narrative',
      strategicPurpose: 'Prevent domestic backlash to IMF conditions while keeping negotiations alive. Maintain Gulf and EU financial options simultaneously.',
    },
    {
      topic: 'Migration / European cooperation',
      brainPosition: 'Migration cooperation with EU is a primary financial lever. Security and coast guard cooperation continues uninterrupted regardless of public statements.',
      mouthPosition: '"We will not be a policeman for Europe." Sovereignty over migration management. Anti-racist framing toward Sub-Saharan migrants is simultaneously used as domestic legitimacy signal.',
      divergenceScore: 0.65,
      audienceTargeted: 'Two audiences simultaneously: EU (dependency reminder) + domestic (sovereignty/anti-migration)',
      strategicPurpose: 'Extract maximum financial value from EU migration dependency while maintaining domestic support via anti-migration positioning.',
    },
    {
      topic: 'Opposition / Civil society',
      brainPosition: 'Targeted suppression calibrated to reduce coordination capacity without triggering mass sympathy. Specific actors identified as threats to information control.',
      mouthPosition: '"Judicial independence." "The law applies equally." "We respect freedom within the law."',
      divergenceScore: 0.80,
      audienceTargeted: 'International — maintains plausible deniability for Western partners who need to continue cooperation',
      strategicPurpose: 'Continue suppression while maintaining Western partner cooperation. Partners need the fiction of judicial independence to justify their own continued engagement.',
    },
  ];

  if (imfDealProb < 30 && fxReserves < 90) {
    divergences[0].divergenceScore = 0.88; // maximum divergence at financial crisis
  }

  const avgDivergence = divergences.reduce((s, d) => s + d.divergenceScore, 0) / divergences.length;

  return {
    frame,
    prediction: framePredictions[frame],
    divergences,
    strategicAmbiguityLevel: avgDivergence,
  };
}

// ── Regime Phase Classification ────────────────────────────────

function classifyRegimePhase(
  threatLevel: ThreatLevel,
  miiPhase: string,
  constraintStresses: ConstraintStress[]
): { phase: string; adaptationMode: string; survivalConfidence: number } {
  const breached = constraintStresses.filter(c => c.status === 'NEAR_LIMIT').length;
  const stressed = constraintStresses.filter(c => c.status === 'STRESSED').length;

  if (threatLevel === 'EMERGENCY' || breached >= 2) {
    return {
      phase: 'SURVIVAL_MODE',
      adaptationMode: 'All tools deployed. Strategic coherence secondary to immediate survival. Expect rapid, unpredictable actions.',
      survivalConfidence: 25,
    };
  }

  if (threatLevel === 'CRISIS' || breached >= 1) {
    return {
      phase: 'DEFENSIVE_CONSOLIDATION',
      adaptationMode: 'Protecting core constraints. Suppression intensifying. Narrative becoming more aggressive. Gulf outreach active.',
      survivalConfidence: 45,
    };
  }

  if (miiPhase === 'FREEZE' && stressed >= 2) {
    return {
      phase: 'AUTHORITARIAN_LOCK_IN',
      adaptationMode: 'Replacing competence with loyalty. Institutional capture accelerating. Surface calm masking maximum fragility. Historical pre-rupture pattern.',
      survivalConfidence: 60,
    };
  }

  if (threatLevel === 'DEFENSIVE') {
    return {
      phase: 'ACTIVE_MANAGEMENT',
      adaptationMode: 'Managing multiple pressure points. Using full toolkit. Not yet in survival mode but elevated operational tempo.',
      survivalConfidence: 65,
    };
  }

  return {
    phase: 'STABLE_OPERATIONS',
    adaptationMode: 'Routine governance with elevated monitoring. Toolkit available but not urgently deployed.',
    survivalConfidence: 78,
  };
}

// ── Watch Signals ──────────────────────────────────────────────

function buildWatchSignals(
  predictedActions: RegimeAction[],
  threatLevel: ThreatLevel
): string[] {
  const signals: string[] = [];

  const topActions = predictedActions.slice(0, 4);
  for (const action of topActions) {
    if (action.probability > 0.45) {
      signals.push(action.detectableSignal);
    }
  }

  if (threatLevel === 'CRISIS' || threatLevel === 'EMERGENCY') {
    signals.push('RSS: "armée tunisienne", "état d\'urgence", "إعلان الطوارئ", "الجيش التونسي"');
  }

  return [...new Set(signals)].slice(0, 5);
}

// ── Analyst Assessment ─────────────────────────────────────────

function buildAnalystAssessment(
  threatLevel: ThreatLevel,
  regimePhase: string,
  survivalConfidence: number,
  constraintStresses: ConstraintStress[],
  mostLikelyAction: RegimeAction | null,
  strategicAmbiguityLevel: number
): string {
  const parts: string[] = [];

  // Opening: regime operational state
  if (regimePhase === 'AUTHORITARIAN_LOCK_IN') {
    parts.push(
      'The Saied regime is in authoritarian lock-in configuration — surface stability masking maximum structural fragility. ' +
      'The high loyalist cabinet concentration (76%) is not a sign of strength: it reflects the elimination of competent independent figures and creates a brittle, non-adaptive governance structure.'
    );
  } else if (regimePhase === 'DEFENSIVE_CONSOLIDATION') {
    parts.push(
      'The regime is in active defensive consolidation. Multiple pressure points are simultaneously active. Operational tempo is elevated and the full toolkit is being deployed.'
    );
  } else {
    parts.push(
      `The regime is in ${regimePhase.replace(/_/g,' ').toLowerCase()} with ${survivalConfidence}% survival confidence on current trajectory.`
    );
  }

  // Most likely action
  if (mostLikelyAction) {
    parts.push(
      `Most probable near-term action: ${mostLikelyAction.type.replace(/_/g,' ')} ` +
      `(${Math.round(mostLikelyAction.probability * 100)}% probability, ${mostLikelyAction.horizon} horizon). ` +
      `${mostLikelyAction.mechanism}`
    );
  }

  // Strategic ambiguity
  if (strategicAmbiguityLevel > 0.65) {
    parts.push(
      `Strategic ambiguity is at maximum level (${Math.round(strategicAmbiguityLevel * 100)}%). ` +
      `Brain/mouth divergence is highest on Western financing — the regime publicly rejects IMF conditionality while privately maintaining all channels. ` +
      `Do not read public statements as strategy; read patterns of actual behavior.`
    );
  }

  return parts.join(' ');
}

// ── Main Function ──────────────────────────────────────────────

export function assessGovernmentAgent(
  rriState: any,
  data: any,
  engines: {
    miiProfile?: any;
    actorNetwork?: any;
    seiResult?: any;
  } = {}
): GovAgentAssessment {

  const mii = engines.miiProfile?.mii ?? 0.572;
  const miiPhase = engines.miiProfile?.phase ?? 'FREEZE';
  const loyalistConc = engines.miiProfile?.loyaltyShiftIndex ?? 0.76;
  const oci = engines.actorNetwork?.oci ?? 0.22;
  const ngoCapacity = engines.actorNetwork?.ngoCapacity ?? 0.55;
  const cpgDisruption = engines.actorNetwork?.cpgDisruptionLevel ?? 35;
  const seiMax = engines.seiResult?.maxSEI ?? 0.42;
  const seiPhase = engines.seiResult?.dominantPhase ?? 2;
  const seiAngerWindow = engines.seiResult?.angerWindowAlert ?? false;

  const rri = rriState.rri ?? 2.31;
  const velocity = rriState.velocity ?? 0.18;
  const eliteCohesion = rriState.elite_cohesion_dynamics ?? 0.65;
  const eliteDefection = rriState.elite_defection_prob ?? 0.12;
  const cascadeProb = rriState.cascade_probability ?? 0.58;

  const econ = data?.economy || {};
  const social = data?.social || {};
  const geo = data?.geopolitical || {};

  const inflation = econ.inflation ?? 7.1;
  const fxReserves = econ.fx_reserves ?? 84;
  const imfDealProb = geo.imf_deal_probability ?? 31;
  const decree54 = social.decree54_charged ?? 23;
  const ugttLevel = social.ugtt_mobilisation_level ?? 'ELEVATED';
  const protests = social.protest_events_30d ?? 23;
  const pressFreedom = social.press_freedom_rank ?? 118;

  // Evaluate all four hard constraints
  const constraintStresses: ConstraintStress[] = [
    evalMilitaryLoyalty(eliteCohesion, eliteDefection, mii, miiPhase, loyalistConc),
    evalWesternAlignment(imfDealProb, fxReserves, decree54, pressFreedom),
    evalEconomicMinimum(fxReserves, inflation, seiMax, seiPhase, econ.unemployment ?? 16.4),
    evalEliteCohesion(mii, miiPhase, loyalistConc, eliteDefection),
  ];

  // Threat perception (what regime sees)
  const { level: threatLevel, score: threatScore, drivers: threatDrivers } =
    computeThreatPerception(
      rri, velocity, cascadeProb, oci, protests,
      ugttLevel, seiAngerWindow, miiPhase
    );

  // Predicted actions
  const predictedActions = predictActions(
    threatLevel, threatScore, constraintStresses,
    rri, velocity, oci, ngoCapacity, decree54,
    fxReserves, inflation, seiMax, seiPhase,
    ugttLevel, miiPhase, cascadeProb, imfDealProb
  );

  const mostLikelyAction = predictedActions[0] ?? null;
  const urgentActions = predictedActions.filter(a => a.probability > 0.55);

  // Narrative prediction
  const { frame, prediction, divergences, strategicAmbiguityLevel } = predictNarrative(
    threatLevel, constraintStresses, inflation, fxReserves,
    ugttLevel, decree54, imfDealProb
  );

  // Regime phase
  const { phase: regimePhase, adaptationMode, survivalConfidence } =
    classifyRegimePhase(threatLevel, miiPhase, constraintStresses);

  // Watch signals from RSS
  const watchSignals = buildWatchSignals(predictedActions, threatLevel);

  // Analyst assessment
  const analystAssessment = buildAnalystAssessment(
    threatLevel, regimePhase, survivalConfidence,
    constraintStresses, mostLikelyAction, strategicAmbiguityLevel
  );

  return {
    threatLevel,
    threatScore,
    threatDrivers,
    constraintStresses,
    criticalConstraint: constraintStresses.find(c => c.status === 'NEAR_LIMIT')?.constraint ?? null,
    predictedActions,
    mostLikelyAction,
    urgentActions,
    activeNarrativeFrame: frame,
    narrativePrediction: prediction,
    brainMouthDivergences: divergences,
    strategicAmbiguityLevel,
    survivalConfidence,
    adaptationMode,
    regimePhase,
    analystAssessment,
    watchSignals,
    generatedAt: new Date().toISOString(),
  };
}
