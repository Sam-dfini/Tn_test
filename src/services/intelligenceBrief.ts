/**
 * TunisiaIntel — Intelligence Brief Engine
 *
 * Synthesizes the complete intelligence state into a single
 * structured brief. Answers: "What do I need to know right now?"
 *
 * Reads: rriState + data + all engine outputs
 * Produces: one unified brief with situation, developments,
 *           assessment, watch indicators, time horizon, actions
 *
 * Also exports: ShockTaxonomy — structured event→ε(t) mapping
 */

// ── Types ──────────────────────────────────────────────────────

import { assessGovernmentAgent, ACTION_LABELS, FRAME_LABELS } from './govAgent';

export type BriefClassification =
  | 'ROUTINE'    // R(t) < 1.8, no active alerts
  | 'ELEVATED'   // R(t) 1.8-2.2 or single significant signal
  | 'HIGH'       // R(t) 2.2-2.5 or multiple signals converging
  | 'CRITICAL'   // R(t) > 2.5 or compound trigger active
  | 'EMERGENCY'; // R(t) > 2.8 or P_rev > 80%

export type ActionPriority = 'IMMEDIATE' | 'URGENT' | 'MONITOR' | 'PREPARE';

export interface BriefDevelopment {
  signal: string;           // what changed
  source: string;           // which equation/engine/variable
  direction: 'up' | 'down' | 'new';
  severity: 'critical' | 'high' | 'medium' | 'low';
  value?: string;           // current value
}

export interface WatchIndicator {
  indicator: string;        // the specific observable
  currentValue: string;     // where it is now
  threshold: string;        // what would trigger upgrade
  consequence: string;      // what happens if threshold crossed
  timeframe: string;        // expected window
  probability: number;      // 0-1 model estimate
}

export interface BriefAction {
  priority: ActionPriority;
  action: string;           // what to do
  rationale: string;        // why
  owner?: string;           // who (analyst, decision-maker, etc.)
}

export interface IntelligenceBrief {
  id: string;
  generatedAt: string;
  classification: BriefClassification;
  classificationBasis: string;     // why this classification

  // THE BRIEF
  situation: string;               // 2-3 sentences, plain language
  keyDevelopments: BriefDevelopment[];
  assessment: string;              // direct analytical judgment
  contradictions: string[];        // where frameworks disagree (the nuance)

  watchIndicators: WatchIndicator[];

  timeHorizon: {
    window: string;                // "7-14 days", "48-72 hours"
    confidence: number;            // 0-1
    basis: string;                 // which signals drive this
    criticalDate?: string;         // specific date if computable
  };

  recommendedActions: BriefAction[];

  regimeResponse?: {
    threatLevel: string;
    mostLikelyAction: string;
    narrativeFrame: string;
    watchSignals: string[];
  };

  // Model state snapshot for context
  modelState: {
    rri: number;
    p_rev: number;
    velocity: string;
    mii: number;
    miiPhase: string;
    rpi: number;
    escalationLevel: number;
    etmClosure: number;
    seiMax: number;
    seiDominantPhase: number;
    oci: number;
    cpgDisruption: number;
  };

  // Focal geography
  triggerZones: string[];          // where it will start
  primaryDrivers: string[];        // top 3 drivers
}

// ── Classification Logic ───────────────────────────────────────

function classify(
  rri: number,
  pRev: number,
  velocity: number,
  compoundStress: number,
  mii: number,
  rpi: number,
  etmClosure: number,
  seiAngerWindow: boolean,
  cascadeProb: number,
  oci: number,
  cpg: number
): { classification: BriefClassification; basis: string } {

  // EMERGENCY
  if (rri > 2.8 || pRev > 0.80 || oci > 0.65) {
    return {
      classification: 'EMERGENCY',
      basis: oci > 0.65 
        ? `OCI=${(oci*100).toFixed(0)}% — critical opposition coordination`
        : `R(t)=${rri.toFixed(2)} · P_rev=${(pRev*100).toFixed(0)}% — threshold exceeded`,
    };
  }

  // CRITICAL: threshold breach OR compound trigger
  if (rri >= 2.5 || (seiAngerWindow && rpi > 0.40) ||
      (etmClosure > 0.70 && cascadeProb > 0.60)) {
    const bases: string[] = [];
    if (rri >= 2.5) bases.push(`R(t)=${rri.toFixed(2)}`);
    if (seiAngerWindow) bases.push('Food anger window active');
    if (etmClosure > 0.70) bases.push(`ETM closure ${(etmClosure*100).toFixed(0)}%`);
    return { classification: 'CRITICAL', basis: bases.join(' · ') };
  }

  // HIGH: multiple signals converging
  const highSignals: string[] = [];
  if (rri >= 2.2) highSignals.push(`R(t)=${rri.toFixed(2)}`);
  if (velocity > 0.20) highSignals.push('rapid deterioration');
  if (mii > 0.60) highSignals.push(`MII=${(mii*100).toFixed(0)}%`);
  if (rpi > 0.40) highSignals.push(`RPI=${(rpi*100).toFixed(0)}%`);
  if (etmClosure > 0.50) highSignals.push(`ETM=${(etmClosure*100).toFixed(0)}%`);
  if (cascadeProb > 0.55) highSignals.push(`cascade=${(cascadeProb*100).toFixed(0)}%`);
  if (oci > 0.45) highSignals.push(`OCI=${(oci*100).toFixed(0)}%`);
  if (cpg > 60) highSignals.push(`CPG=${cpg.toFixed(0)}`);

  if (highSignals.length >= 2) {
    return {
      classification: 'HIGH',
      basis: highSignals.join(' · '),
    };
  }

  // ELEVATED: single significant signal
  if (rri >= 1.8 || velocity > 0.12 || mii > 0.50 || rpi > 0.25) {
    const basis =
      rri >= 1.8 ? `R(t)=${rri.toFixed(2)}` :
      velocity > 0.12 ? `V(t)=${velocity.toFixed(3)} deteriorating` :
      mii > 0.50 ? `MII=${(mii*100).toFixed(0)}%` :
      `RPI=${(rpi*100).toFixed(0)}%`;
    return { classification: 'ELEVATED', basis };
  }

  return { classification: 'ROUTINE', basis: 'No significant threshold breaches' };
}

// ── Situation Generator ────────────────────────────────────────

function buildSituation(
  classification: BriefClassification,
  rri: number,
  pRev: number,
  miiPhase: string,
  escalationLevel: number,
  etmPhase: string,
  seiMax: number,
  seiDomPhase: number,
  fxReserves: number,
  ugtt: string,
  protests: number,
  inflation: number,
  oci: number
): string {
  const riskLabel =
    classification === 'EMERGENCY' ? 'EMERGENCY risk level' :
    classification === 'CRITICAL' ? 'CRITICAL risk level' :
    classification === 'HIGH' ? 'HIGH risk' :
    classification === 'ELEVATED' ? 'ELEVATED risk' : 'routine monitoring';

  const sentences: string[] = [];

  // Sentence 1: Core structural state
  sentences.push(
    `Tunisia's political risk index stands at R(t)=${rri.toFixed(2)} (${riskLabel}), ` +
    `with a ${(pRev*100).toFixed(0)}% estimated probability of systemic disruption.`
  );

  // Sentence 2: Most pressing active signal
  if (oci > 0.50) {
    sentences.push(
      `Opposition coordination (OCI) has reached ${(oci*100).toFixed(0)}%, indicating ` +
      `that structural grievances are now being channeled into a unified political frame.`
    );
  } else if (seiDomPhase >= 4 && seiMax > 0.65) {
    sentences.push(
      `A commodity shortage escalation at Phase ${seiDomPhase} (SEI ${(seiMax*100).toFixed(0)}%) ` +
      `is the most immediate pressure point — intervention effectiveness is declining.`
    );
  } else if (ugtt === 'HIGH') {
    sentences.push(
      `UGTT mobilisation at HIGH level with ${protests} recorded protest events this month ` +
      `indicates the union is approaching formal strike action.`
    );
  } else if (etmPhase === 'CLOSURE') {
    sentences.push(
      `A narrative has reached ETM closure — the information environment is now ` +
      `unfalsifiable, with fact-checking counterproductive.`
    );
  } else if (miiPhase === 'FREEZE') {
    sentences.push(
      `The cabinet is in Phase 4 FREEZE — artificial stability over a 76% loyalist ` +
      `concentration masking maximum structural fragility.`
    );
  } else if (fxReserves < 85) {
    sentences.push(
      `Foreign exchange reserves at ${fxReserves} days of import cover are approaching ` +
      `the 75-day warning threshold, constraining policy options.`
    );
  } else if (inflation > 8) {
    sentences.push(
      `Inflation at ${inflation.toFixed(1)}% is above the compound trigger threshold, ` +
      `amplifying sensitivity to commodity shortages and UGTT wage demands.`
    );
  }

  // Sentence 3: Trajectory
  if (escalationLevel >= 3) {
    sentences.push(
      `Radicalization dynamics at Level ${escalationLevel}/5 indicate an ` +
      `us-vs-them worldview is consolidating in the information environment.`
    );
  }

  return sentences.join(' ');
}

// ── Key Developments Builder ───────────────────────────────────

function buildDevelopments(
  rriState: any,
  data: any,
  engines: any
): BriefDevelopment[] {
  const devs: BriefDevelopment[] = [];

  const mii = engines.miiProfile?.mii ?? 0.572;
  const miiPhase = engines.miiProfile?.phase ?? 'FREEZE';
  const rpi = engines.rpiProfile?.escalationRisk ?? 0.28;
  const escalation = engines.rpiProfile?.escalationLevel ?? 2;
  const etmClosure = engines.cognitiveEnvironment?.narrativeClosure ?? 0.35;
  const etmPhase = engines.cognitiveEnvironment?.phase ?? 'AMPLIFICATION';
  const seiMax = engines.seiResult?.maxSEI ?? 0.42;
  const seiDomPhase = engines.seiResult?.dominantPhase ?? 2;
  const velocity = rriState.velocity ?? 0.18;

  // RRI velocity
  if (Math.abs(velocity) > 0.10) {
    devs.push({
      signal: velocity > 0 ? `R(t) accelerating (+${velocity.toFixed(3)})` : `R(t) improving (${velocity.toFixed(3)})`,
      source: 'EQ.16 Velocity',
      direction: velocity > 0 ? 'up' : 'down',
      severity: velocity > 0.20 ? 'critical' : velocity > 0.12 ? 'high' : 'medium',
      value: rriState.rri.toFixed(3),
    });
  }

  // MII
  if (mii > 0.55) {
    devs.push({
      signal: `Ministerial instability at ${(mii*100).toFixed(0)}% — Phase: ${miiPhase}`,
      source: 'EQ.21 MII',
      direction: miiPhase === 'FREEZE' ? 'new' : 'up',
      severity: mii > 0.70 ? 'critical' : mii > 0.60 ? 'high' : 'medium',
      value: `MII=${(mii*100).toFixed(0)}%`,
    });
  }

  // RPI / escalation
  if (escalation >= 3) {
    devs.push({
      signal: `Radicalization at Level ${escalation}/5 (${
        ['Awareness','Emotional','Identity','Us vs Them','Justification','Mobilisation'][escalation]
      })`,
      source: 'RDE Engine',
      direction: 'up',
      severity: escalation >= 4 ? 'critical' : escalation >= 3 ? 'high' : 'medium',
      value: `RPI=${(rpi*100).toFixed(0)}%`,
    });
  }

  // ETM
  if (etmPhase === 'CLOSURE' || etmPhase === 'AMPLIFICATION') {
    devs.push({
      signal: etmPhase === 'CLOSURE'
        ? 'Narrative closure reached — unfalsifiable belief system active'
        : `Narrative amplification underway (ETM ${(etmClosure*100).toFixed(0)}%)`,
      source: 'ETM Engine',
      direction: etmPhase === 'CLOSURE' ? 'new' : 'up',
      severity: etmPhase === 'CLOSURE' ? 'critical' : 'high',
      value: `Closure=${(etmClosure*100).toFixed(0)}%`,
    });
  }

  // SEI
  if (seiDomPhase >= 3) {
    const phaseLabels = ['','Early Stress','Denial','Acceleration','Intervention','Distortion','Anger Ignition'];
    devs.push({
      signal: `Commodity shortage at Phase ${seiDomPhase}: ${phaseLabels[seiDomPhase]}`,
      source: 'SEI Engine',
      direction: 'up',
      severity: seiDomPhase >= 5 ? 'critical' : seiDomPhase >= 4 ? 'high' : 'medium',
      value: `SEI=${(seiMax*100).toFixed(0)}%`,
    });
  }

  const econ = data?.economy || {};
  const social = data?.social || {};

  // FX
  if ((econ.fx_reserves ?? 100) < 90) {
    devs.push({
      signal: `FX reserves at ${econ.fx_reserves} days — approaching warning threshold`,
      source: 'A_FX variable',
      direction: 'down',
      severity: (econ.fx_reserves ?? 100) < 70 ? 'critical' : (econ.fx_reserves ?? 100) < 80 ? 'high' : 'medium',
      value: `${econ.fx_reserves}d`,
    });
  }

  // UGTT
  if (social.ugtt_mobilisation_level === 'HIGH') {
    devs.push({
      signal: 'UGTT mobilisation at HIGH — strike action imminent',
      source: 'M_UGTT variable',
      direction: 'up',
      severity: 'critical',
      value: 'HIGH',
    });
  }

  // Cascade
  if (rriState.cascade_probability > 0.55) {
    devs.push({
      signal: `Regional cascade probability at ${(rriState.cascade_probability*100).toFixed(0)}%`,
      source: 'EQ.17 Cascade',
      direction: 'up',
      severity: rriState.cascade_probability > 0.65 ? 'critical' : 'high',
      value: `${(rriState.cascade_probability*100).toFixed(0)}%`,
    });
  }

  // Actor Network
  const oci = engines.actorNetwork?.oci ?? 0.22;
  const cpg = engines.actorNetwork?.cpgDisruptionLevel ?? 35;

  if (oci > 0.40) {
    devs.push({
      signal: `Opposition coordination (OCI) rising: ${(oci*100).toFixed(0)}%`,
      source: 'Actor Network Engine',
      direction: 'up',
      severity: oci > 0.60 ? 'critical' : 'high',
      value: `${(oci*100).toFixed(0)}%`,
    });
  }

  if (cpg > 60) {
    devs.push({
      signal: `CPG production disruption at critical level: ${cpg.toFixed(0)}`,
      source: 'Actor Network Engine',
      direction: 'up',
      severity: 'high',
      value: cpg.toFixed(0),
    });
  }

  // Sort by severity
  const sevOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  return devs.sort((a, b) => sevOrder[a.severity] - sevOrder[b.severity]).slice(0, 6);
}

// ── Assessment Generator ───────────────────────────────────────

function buildAssessment(
  classification: BriefClassification,
  rri: number,
  pRev: number,
  miiPhase: string,
  escalationLevel: number,
  etmPhase: string,
  seiDomPhase: number,
  cascadeProb: number,
  patternLabel: string,
  contradictions: string[],
  oci: number
): string {
  const parts: string[] = [];

  // Core judgment
  if (classification === 'EMERGENCY') {
    parts.push(
      `Tunisia is in immediate pre-crisis condition. Multiple structural, cognitive, and ` +
      `political pressure layers are simultaneously activated. Historical pattern similarity ` +
      `(${patternLabel}) indicates this configuration has preceded systemic rupture.`
    );
  } else if (classification === 'CRITICAL') {
    parts.push(
      `Structural conditions for significant unrest are present and converging. ` +
      `The system is not on a trajectory toward stability — it is in an active deterioration cycle.`
    );
  } else if (classification === 'HIGH') {
    parts.push(
      `Risk is elevated across multiple dimensions but has not yet reached convergence threshold. ` +
      `The structural substrate is fragile; a single significant trigger event could rapidly ` +
      `move the system to CRITICAL.`
    );
  } else {
    parts.push(
      `Current conditions represent elevated background risk without acute convergence. ` +
      `Structural vulnerabilities persist — monitor for trigger events.`
    );
  }

  // OCI Insight
  if (oci < 0.30) {
    parts.push(
      `The low Opposition Coordination Index (OCI=${(oci*100).toFixed(0)}%) remains the ` +
      `regime's primary survival factor. High social salience is currently fragmented ` +
      `across competing frames, preventing the formation of a cross-class rupture coalition.`
    );
  } else if (oci > 0.50) {
    parts.push(
      `The rising OCI (${(oci*100).toFixed(0)}%) is highly significant. The fragmentation ` +
      `that historically protected the regime is dissolving as clusters align on a ` +
      `unified narrative.`
    );
  }

  // Phase-specific insight
  if (miiPhase === 'FREEZE' && classification !== 'ROUTINE') {
    parts.push(
      `The Phase 4 FREEZE in cabinet stability is analytically significant: ` +
      `this is deceptive calm, not genuine stability. When the freeze breaks, ` +
      `it historically breaks fast and with disproportionate political impact.`
    );
  }

  if (etmPhase === 'CLOSURE') {
    parts.push(
      `Narrative closure means the information environment has become self-reinforcing. ` +
      `Traditional fact-checking will amplify rather than counter the dominant frame. ` +
      `Intervention strategy must shift from refutation to narrative substitution.`
    );
  }

  if (escalationLevel >= 4) {
    parts.push(
      `Violence justification language is now present in the information environment. ` +
      `The window for standard counter-messaging has closed.`
    );
  }

  // Contradiction note if present
  if (contradictions.length > 0) {
    parts.push(`Note: ${contradictions[0]}`);
  }

  return parts.join(' ');
}

// ── Watch Indicators Builder ───────────────────────────────────

function buildWatchIndicators(
  rriState: any,
  data: any,
  engines: any,
  classification: BriefClassification
): WatchIndicator[] {
  const indicators: WatchIndicator[] = [];
  const mii = engines.miiProfile?.mii ?? 0.572;
  const seiMax = engines.seiResult?.maxSEI ?? 0.42;
  const seiDomPhase = engines.seiResult?.dominantPhase ?? 2;

  const econ = data?.economy || {};
  const social = data?.social || {};

  // FX reserves
  if ((econ.fx_reserves ?? 150) < 110) {
    indicators.push({
      indicator: 'BCT Foreign Exchange Reserves',
      currentValue: `${econ.fx_reserves} days`,
      threshold: 'Below 75 days (warning) / Below 60 days (crisis)',
      consequence: 'Import disruptions begin → medicine/food shortages within weeks → immediate R(t) +0.15',
      timeframe: (econ.fx_reserves ?? 100) < 90 ? '30-60 days' : '60-120 days',
      probability: Math.min(0.85, (110 - (econ.fx_reserves ?? 110)) / 80),
    });
  }

  // UGTT
  if (social.ugtt_mobilisation_level !== 'LOW' && social.ugtt_mobilisation_level) {
    indicators.push({
      indicator: 'UGTT Mobilisation Level',
      currentValue: social.ugtt_mobilisation_level,
      threshold: 'HIGH + formal 72-hour strike notice filed',
      consequence: 'General strike → economic paralysis → R(t) +0.14 minimum',
      timeframe: social.ugtt_mobilisation_level === 'HIGH' ? '7-21 days' : '30-60 days',
      probability: social.ugtt_mobilisation_level === 'HIGH' ? 0.72 : 0.38,
    });
  }

  // SEI
  if (seiMax > 0.40 || seiDomPhase >= 3) {
    indicators.push({
      indicator: 'Commodity Shortage Escalation (SEI)',
      currentValue: `${(seiMax*100).toFixed(0)}% — Phase ${seiDomPhase}`,
      threshold: 'SEI > 0.70 AND inflation > 7% → anger window',
      consequence: 'Civil anger ignition in 7-14 days → localized protests → cascade risk',
      timeframe: seiDomPhase >= 4 ? '7-14 days' : '14-30 days',
      probability: Math.min(0.80, seiMax * 0.85 + (seiDomPhase >= 4 ? 0.20 : 0)),
    });
  }

  // Interior ministry change
  if (mii > 0.55) {
    indicators.push({
      indicator: 'Coercive Ministry Changes (Interior/Justice)',
      currentValue: `MII ${(mii*100).toFixed(0)}% — ${engines.miiProfile?.phase ?? 'FREEZE'}`,
      threshold: 'Any PREEMPTIVE change in Interior Ministry',
      consequence: 'Highest-severity signal — precursor to elite defection cascade. Immediate R(t) impact.',
      timeframe: 'Monitor continuously',
      probability: 0.22,
    });
  }

  // Elite defection
  if (rriState.elite_defection_prob > 0.18) {
    indicators.push({
      indicator: 'Elite Cohesion / Military Signal',
      currentValue: `Defection prob ${(rriState.elite_defection_prob*100).toFixed(0)}%`,
      threshold: 'Military political statement OR public cabinet defection',
      consequence: 'System-changing. Historical precedent: July 2021 military statement preceded coup.',
      timeframe: 'Low probability but monitor weekly',
      probability: rriState.elite_defection_prob * 0.6,
    });
  }

  // Cascade trigger
  if (rriState.cascade_probability > 0.45) {
    indicators.push({
      indicator: 'Gafsa/Kasserine Protest Activation',
      currentValue: `Cascade ${(rriState.cascade_probability*100).toFixed(0)}%`,
      threshold: 'Confirmed protest >100 people in Gafsa or Kasserine with road blockade',
      consequence: 'Activates Gafsa→Kasserine→Sidi Bouzid cascade. 2010 pattern match.',
      timeframe: data.social.protest_events_30d > 25 ? '7-21 days' : '30-60 days',
      probability: rriState.cascade_probability * 0.70,
    });
  }

  return indicators.sort((a, b) => b.probability - a.probability).slice(0, 5);
}

// ── Actions Builder ────────────────────────────────────────────

function buildActions(
  classification: BriefClassification,
  miiPhase: string,
  etmPhase: string,
  escalationLevel: number,
  seiDomPhase: number,
  ugtt: string,
  fxReserves: number,
  contradictions: string[]
): BriefAction[] {
  const actions: BriefAction[] = [];

  if (classification === 'EMERGENCY' || classification === 'CRITICAL') {
    actions.push({
      priority: 'IMMEDIATE',
      action: 'Activate maximum monitoring — all RSS sources, citizen nodes, and social media feeds',
      rationale: 'CRITICAL classification requires real-time situational awareness. Gaps in monitoring at this stage are operationally unacceptable.',
      owner: 'Analyst',
    });
  }

  if (etmPhase === 'CLOSURE') {
    actions.push({
      priority: 'IMMEDIATE',
      action: 'Shift counter-narrative strategy from refutation to substitution',
      rationale: 'Narrative at ETM closure — direct rebuttals amplify the belief system. Only narrative substitution addressing the same underlying anxiety is effective.',
      owner: 'Strategic',
    });
  } else if (etmPhase === 'AMPLIFICATION') {
    actions.push({
      priority: 'URGENT',
      action: 'Deploy counter-narrative while intervention window is open',
      rationale: `ETM at ${etmPhase} phase — alternative framings can still compete. Window will close at closure threshold (>65%).`,
      owner: 'Strategic',
    });
  }

  if (fxReserves < 85) {
    actions.push({
      priority: 'URGENT',
      action: 'Monitor BCT reserve announcements daily, watch for subsidy cut signals',
      rationale: `FX at ${fxReserves} days — approaching warning threshold. Any subsidy cut announcement will trigger immediate SEI escalation and compound R(t) impact.`,
      owner: 'Analyst',
    });
  }

  if (ugtt === 'HIGH') {
    actions.push({
      priority: 'URGENT',
      action: 'Track UGTT regional secretary statements and formal strike notice filings',
      rationale: 'At HIGH mobilisation, UGTT is 72-hour notice away from general strike. CPG wage arrear schedule and phosphate production data are leading indicators.',
      owner: 'Analyst',
    });
  }

  if (seiDomPhase >= 4) {
    actions.push({
      priority: 'URGENT',
      action: 'Activate citizen node reporting for interior governorates, especially Kasserine and Gafsa',
      rationale: `Commodity shortage at Phase ${seiDomPhase} — state intervention active. Black market emergence within 5-10 days. Ground truth from interior is essential.`,
      owner: 'Analyst',
    });
  }

  if (miiPhase === 'FREEZE') {
    actions.push({
      priority: 'MONITOR',
      action: 'Flag any Interior Ministry or Security Apparatus personnel changes immediately',
      rationale: 'Phase 4 FREEZE means structural fragility is maximum. Any change in coercive ministry is the highest-priority signal in the current configuration.',
      owner: 'Analyst',
    });
  }

  if (escalationLevel >= 3) {
    actions.push({
      priority: 'PREPARE',
      action: 'Prepare cascade simulation for Gafsa-Kasserine corridor activation',
      rationale: `Radicalization at Level ${escalationLevel} — if focal point protest ignites, cascade simulation from Gafsa should be pre-run to brief decision-makers.`,
      owner: 'Strategic',
    });
  }

  actions.push({
    priority: 'MONITOR',
    action: 'Run next model snapshot in 48-72 hours and compare to current brief',
    rationale: 'Learning loop: store this brief as prediction baseline. Evaluate against reality when horizon elapses.',
    owner: 'Analyst',
  });

  return actions.slice(0, 6);
}

// ── Trigger Zones ──────────────────────────────────────────────

function identifyTriggerZones(
  cascadeProb: number,
  seiResult: any,
  protests: number,
  waterGovs: number
): string[] {
  const zones: Array<{ name: string; score: number }> = [
    { name: 'Gafsa', score: 0.78 + (cascadeProb * 0.15) },
    { name: 'Kasserine', score: 0.72 + (protests > 25 ? 0.10 : 0) },
    { name: 'Sidi Bouzid', score: 0.65 + (waterGovs > 8 ? 0.08 : 0) },
  ];

  if (seiResult?.commodities?.some((c: any) =>
    c.governoratesActive?.some((g: string) =>
      ['sfax','صفاقس'].includes(g.toLowerCase())
    )
  )) {
    zones.push({ name: 'Sfax', score: 0.60 });
  }

  if (cascadeProb > 0.60) {
    zones.push({ name: 'Gabès', score: 0.55 });
  }

  return zones
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(z => z.name);
}

// ── Primary Drivers ────────────────────────────────────────────

function identifyPrimaryDrivers(
  rriState: any,
  data: any,
  mii: number,
  rpi: number,
  seiMax: number
): string[] {
  const econ = data?.economy || {};
  const social = data?.social || {};

  const candidates = [
    { driver: `Food inflation + shortage pressure (SEI ${(seiMax*100).toFixed(0)}%)`, score: seiMax * 0.8 + ((econ.inflation ?? 7.1) / 15) * 0.4 },
    { driver: `FX reserve depletion (${econ.fx_reserves ?? 84}d)`, score: (1 - (econ.fx_reserves ?? 84) / 120) * 0.9 },
    { driver: `UGTT mobilisation (${social.ugtt_mobilisation_level ?? 'MEDIUM'})`, score: social.ugtt_mobilisation_level === 'HIGH' ? 0.85 : social.ugtt_mobilisation_level === 'ELEVATED' ? 0.55 : 0.25 },
    { driver: `Elite instability / loyalist concentration (MII ${(mii*100).toFixed(0)}%)`, score: mii * 0.75 },
    { driver: `Youth unemployment + structural grievance (${econ.youth_unemployment ?? 35}%)`, score: (econ.youth_unemployment ?? 35) / 50 },
    { driver: `Radicalization dynamics (Level ${rpiState?.escalationLevel ?? 2})`, score: rpi * 0.70 },
    { driver: `Cascade risk — interior corridor (${(rriState.cascade_probability*100).toFixed(0)}%)`, score: rriState.cascade_probability * 0.80 },
    { driver: `Decree 54 suppression (${social.decree54_charged ?? 0} charged)`, score: ((social.decree54_charged ?? 0) / 50) * 0.65 },
  ];

  return candidates
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(c => c.driver);
}

// Placeholder for rpiState access
let rpiState: any = null;

// ── Main Brief Generator ───────────────────────────────────────

export function generateIntelligenceBrief(
  rriState_: any,
  data: any,
  engines: {
    miiProfile?: any;
    rpiProfile?: any;
    cognitiveEnvironment?: any;
    seiResult?: any;
    actorNetwork?: any;
  } = {},
  contradictionTexts: string[] = []
): IntelligenceBrief {

  rpiState = engines.rpiProfile;

  const mii = engines.miiProfile?.mii ?? 0.572;
  const miiPhase = engines.miiProfile?.phase ?? 'FREEZE';
  const loyalist = engines.miiProfile?.loyaltyShiftIndex ?? 0.76;
  const rpi = engines.rpiProfile?.escalationRisk ?? 0.28;
  const escalationLevel = engines.rpiProfile?.escalationLevel ?? 2;
  const etmClosure = engines.cognitiveEnvironment?.narrativeClosure ?? 0.35;
  const etmPhase = engines.cognitiveEnvironment?.phase ?? 'AMPLIFICATION';
  const seiMax = engines.seiResult?.maxSEI ?? 0.42;
  const seiDomPhase = engines.seiResult?.dominantPhase ?? 2;
  const seiAngerWindow = engines.seiResult?.angerWindowAlert ?? false;
  const oci = engines.actorNetwork?.oci ?? 0.22;
  const cpg = engines.actorNetwork?.cpgDisruptionLevel ?? 35;

  const { classification, basis } = classify(
    rriState_.rri ?? 2.31,
    rriState_.p_rev ?? 0.643,
    rriState_.velocity ?? 0.18,
    rriState_.compound_stress ?? 0.08,
    mii, rpi, etmClosure, seiAngerWindow,
    rriState_.cascade_probability ?? 0.58,
    oci, cpg
  );

  const situation = buildSituation(
    classification,
    rriState_.rri ?? 2.31,
    rriState_.p_rev ?? 0.643,
    miiPhase, escalationLevel, etmPhase, seiMax, seiDomPhase,
    data?.economy?.fx_reserves ?? 84,
    data?.social?.ugtt_mobilisation_level ?? 'ELEVATED',
    data?.social?.protest_events_30d ?? 23,
    data?.economy?.inflation ?? 7.1,
    oci
  );

  const keyDevelopments = buildDevelopments(rriState_, data, engines);
  const assessment = buildAssessment(
    classification,
    rriState_.rri ?? 2.31,
    rriState_.p_rev ?? 0.643,
    miiPhase, escalationLevel, etmPhase, seiDomPhase,
    rriState_.cascade_probability ?? 0.58,
    rriState_.pattern_label ?? '',
    contradictionTexts,
    oci
  );

  const watchIndicators = buildWatchIndicators(rriState_, data, engines, classification);
  const recommendedActions = buildActions(
    classification, miiPhase, etmPhase, escalationLevel, seiDomPhase,
    data?.social?.ugtt_mobilisation_level ?? 'ELEVATED',
    data?.economy?.fx_reserves ?? 84,
    contradictionTexts
  );

  const triggerZones = identifyTriggerZones(
    rriState_.cascade_probability ?? 0.58,
    engines.seiResult,
    data?.social?.protest_events_30d ?? 23,
    data?.social?.water_crisis_govs ?? 8
  );

  const primaryDrivers = identifyPrimaryDrivers(rriState_, data, mii, rpi, seiMax);

  // Government agent predicted response
  const govAssessment = assessGovernmentAgent(rriState_, data, {
    miiProfile: engines.miiProfile,
    actorNetwork: engines.actorNetwork,
    seiResult: engines.seiResult,
  });

  // Time horizon
  let window = '30-90 days';
  let confidence = 0.55;
  let horizonBasis = 'Moderate structural pressure without acute trigger';

  if (classification === 'EMERGENCY') {
    window = '0-7 days'; confidence = 0.82;
    horizonBasis = 'R(t) > 2.8 — immediate risk window';
  } else if (classification === 'CRITICAL') {
    window = seiAngerWindow ? '7-14 days' : '14-30 days';
    confidence = 0.72;
    horizonBasis = seiAngerWindow
      ? 'Food anger window compound trigger active'
      : 'Multiple critical signals converging';
  } else if (classification === 'HIGH') {
    window = '21-45 days'; confidence = 0.62;
    horizonBasis = 'Elevated multi-signal state without acute convergence';
  }

  return {
    id: `brief-${Date.now()}`,
    generatedAt: new Date().toISOString(),
    classification,
    classificationBasis: basis,
    situation,
    keyDevelopments,
    assessment,
    contradictions: contradictionTexts,
    watchIndicators,
    timeHorizon: { window, confidence, basis: horizonBasis },
    recommendedActions,
    modelState: {
      rri: rriState_.rri ?? 2.31,
      p_rev: rriState_.p_rev ?? 0.643,
      velocity: rriState_.velocity_label ?? 'DETERIORATING',
      mii,
      miiPhase,
      rpi,
      escalationLevel,
      etmClosure,
      seiMax,
      seiDominantPhase: seiDomPhase,
      oci,
      cpgDisruption: cpg,
    },
    triggerZones,
    primaryDrivers,
    regimeResponse: {
      threatLevel: govAssessment.threatLevel,
      mostLikelyAction: govAssessment.predictedActions.length > 0
        ? `${ACTION_LABELS[govAssessment.predictedActions[0].type]} ` +
          `(${Math.round(govAssessment.predictedActions[0].probability * 100)}%)`
        : 'No urgent action predicted',
      narrativeFrame: FRAME_LABELS[govAssessment.activeNarrativeFrame],
      watchSignals: govAssessment.watchSignals.slice(0, 3),
    },
  };
}

// ══════════════════════════════════════════════════════════════
// SHOCK TAXONOMY
// Structured event → ε(t) mapping
// ══════════════════════════════════════════════════════════════

export type ShockEventType =
  // Economic
  | 'imf_deal_collapse' | 'imf_deal_signed' | 'subsidy_cut_bread'
  | 'subsidy_cut_fuel' | 'dinar_devaluation' | 'fx_floor_breach'
  | 'debt_default' | 'gulf_loan' | 'remittance_surge'
  // Political
  | 'military_statement' | 'cabinet_reshuffle_coercive'
  | 'presidential_health' | 'elite_defection_public'
  | 'opposition_arrest_major' | 'decree54_new_wave'
  // Social
  | 'ugtt_strike_general' | 'ugtt_strike_sector'
  | 'protest_violent_interior' | 'protest_violent_tunis'
  | 'hunger_strike_prisoner'
  // Security
  | 'libya_border_incident' | 'terror_attack_domestic'
  | 'migration_crisis_escalation'
  // Information
  | 'internet_shutdown' | 'journalist_arrest_major'
  | 'viral_video_corruption' | 'viral_video_violence'
  | 'anti_corruption_arrest' | 'security_apparatus_signal'
  // Commodity
  | 'butane_shortage_national' | 'chicken_shortage_acute'
  | 'bread_disappears' | 'medicine_shortage_acute'
  // External
  | 'war_regional_escalation' | 'eu_sanctions'
  | 'afcon_tunisia' | 'ramadan_start';

export interface ShockEvent {
  type: ShockEventType;
  label: string;
  epsilon_magnitude: number;    // ε(t) injection value
  decay_days: number;           // how long the shock lasts
  primary_variable: string;     // main RRI variable affected
  secondary_variables: string[]; // other variables nudged
  direction: 1 | -1;            // +1 = worsens, -1 = improves
  keywords: string[];           // for RSS auto-detection
  category: 'economic' | 'political' | 'social' | 'security' | 'information' | 'commodity' | 'external';
  autoDetectable: boolean;      // can be auto-classified from RSS
}

export const SHOCK_TAXONOMY: Record<ShockEventType, ShockEvent> = {
  // ── Economic ──────────────────────────────────────────────
  imf_deal_collapse: {
    type: 'imf_deal_collapse', label: 'IMF Deal Collapses Permanently',
    epsilon_magnitude: 0.18, decay_days: 90, direction: 1,
    primary_variable: 'I92',
    secondary_variables: ['A_FX', 'A06', 'A03'],
    keywords: ['IMF collapse', 'deal collapse', 'FMI rompu', 'انهيار اتفاق صندوق النقد'],
    category: 'economic', autoDetectable: true,
  },
  imf_deal_signed: {
    type: 'imf_deal_signed', label: 'IMF Deal Signed',
    epsilon_magnitude: 0.14, decay_days: 60, direction: -1,
    primary_variable: 'I92',
    secondary_variables: ['A_FX', 'A01'],
    keywords: ['IMF agreement', 'accord FMI', 'توقيع اتفاق صندوق النقد'],
    category: 'economic', autoDetectable: true,
  },
  subsidy_cut_bread: {
    type: 'subsidy_cut_bread', label: 'Bread/Semolina Subsidy Cut',
    epsilon_magnitude: 0.16, decay_days: 45, direction: 1,
    primary_variable: 'A01',
    secondary_variables: ['E51', 'B24', 'O232'],
    keywords: ['subvention pain', 'semoule prix', 'دعم الخبز', 'إلغاء دعم السميد'],
    category: 'commodity', autoDetectable: true,
  },
  subsidy_cut_fuel: {
    type: 'subsidy_cut_fuel', label: 'Fuel/Energy Subsidy Cut',
    epsilon_magnitude: 0.12, decay_days: 60, direction: 1,
    primary_variable: 'H01',
    secondary_variables: ['A01', 'B25', 'M_UGTT'],
    keywords: ['carburant prix', 'subvention énergie', 'دعم الوقود', 'رفع دعم البنزين'],
    category: 'commodity', autoDetectable: true,
  },
  dinar_devaluation: {
    type: 'dinar_devaluation', label: 'Dinar Official Devaluation',
    epsilon_magnitude: 0.14, decay_days: 30, direction: 1,
    primary_variable: 'A_TND',
    secondary_variables: ['A01', 'A_PARALLEL', 'H01'],
    keywords: ['dinar chute', 'dévaluation', 'انخفاض الدينار', 'تراجع الدينار'],
    category: 'economic', autoDetectable: true,
  },
  fx_floor_breach: {
    type: 'fx_floor_breach', label: 'FX Reserves Below 60-Day Threshold',
    epsilon_magnitude: 0.12, decay_days: 45, direction: 1,
    primary_variable: 'A_FX',
    secondary_variables: ['A03', 'A01'],
    keywords: ['réserves change plancher', 'forex plancher', 'احتياطيات النقد الأجنبي تنخفض'],
    category: 'economic', autoDetectable: false,
  },
  debt_default: {
    type: 'debt_default', label: 'Debt Default / Restructuring',
    epsilon_magnitude: 0.22, decay_days: 120, direction: 1,
    primary_variable: 'A06',
    secondary_variables: ['A_FX', 'I92', 'L121'],
    keywords: ['défaut dette', 'restructuration dette', 'عجز عن سداد الديون'],
    category: 'economic', autoDetectable: true,
  },
  gulf_loan: {
    type: 'gulf_loan', label: 'Gulf Bridge Loan / Emergency Financing',
    epsilon_magnitude: 0.10, decay_days: 30, direction: -1,
    primary_variable: 'A_FX',
    secondary_variables: ['I92', 'A01'],
    keywords: ['prêt Golfe', 'financement saoudien', 'قرض خليجي', 'دعم مالي'],
    category: 'economic', autoDetectable: true,
  },
  remittance_surge: {
    type: 'remittance_surge', label: 'Remittance Surge (Ramadan/Eid)',
    epsilon_magnitude: 0.05, decay_days: 21, direction: -1,
    primary_variable: 'A_REMIT_URBAN',
    secondary_variables: ['A03'],
    keywords: ['transferts argent', 'virements diaspora', 'تحويلات المغتربين'],
    category: 'economic', autoDetectable: false,
  },

  // ── Political ─────────────────────────────────────────────
  military_statement: {
    type: 'military_statement', label: 'Military Issues Political Statement',
    epsilon_magnitude: 0.28, decay_days: 14, direction: 1,
    primary_variable: 'N141',
    secondary_variables: ['D41', 'L121', 'M133'],
    keywords: ['armée déclaration', 'militaire communiqué', 'الجيش يصدر بيانًا', 'بيان عسكري'],
    category: 'political', autoDetectable: true,
  },
  cabinet_reshuffle_coercive: {
    type: 'cabinet_reshuffle_coercive', label: 'Interior/Justice Ministry Change',
    epsilon_magnitude: 0.12, decay_days: 21, direction: 1,
    primary_variable: 'D_MII',
    secondary_variables: ['N141', 'D69', 'L121'],
    keywords: ['nouveau ministre intérieur', 'minister interior replaced', 'وزير داخلية جديد'],
    category: 'political', autoDetectable: true,
  },
  presidential_health: {
    type: 'presidential_health', label: 'Presidential Health Crisis',
    epsilon_magnitude: 0.24, decay_days: 30, direction: 1,
    primary_variable: 'D41',
    secondary_variables: ['L121', 'N141', 'M133'],
    keywords: ['santé président', 'Saied santé', 'صحة الرئيس سعيد'],
    category: 'political', autoDetectable: true,
  },
  elite_defection_public: {
    type: 'elite_defection_public', label: 'Public Elite Defection',
    epsilon_magnitude: 0.20, decay_days: 21, direction: 1,
    primary_variable: 'D50',
    secondary_variables: ['L123', 'M133'],
    keywords: ['démission ministre', 'défection élite', 'استقالة مسؤول', 'انشقاق'],
    category: 'political', autoDetectable: true,
  },
  opposition_arrest_major: {
    type: 'opposition_arrest_major', label: 'Major Opposition Figure Arrested',
    epsilon_magnitude: 0.10, decay_days: 14, direction: 1,
    primary_variable: 'G71',
    secondary_variables: ['D44', 'M133', 'E51'],
    keywords: ['arrestation opposant', 'opposition leader arrested', 'اعتقال معارض'],
    category: 'political', autoDetectable: true,
  },
  anti_corruption_arrest: {
    type: 'anti_corruption_arrest', label: 'Anti-Corruption Arrest',
    epsilon_magnitude: 0.08, decay_days: 14, direction: 1,
    primary_variable: 'D50',
    secondary_variables: ['D44', 'H_CP'],
    keywords: ['arrestation corruption', 'anti-corruption arrest', 'اعتقال بتهمة الفساد'],
    category: 'political', autoDetectable: true,
  },
  security_apparatus_signal: {
    type: 'security_apparatus_signal', label: 'Security Apparatus Signal',
    epsilon_magnitude: 0.05, decay_days: 7, direction: 1,
    primary_variable: 'N141',
    secondary_variables: ['D69'],
    keywords: ['appareil sécuritaire', 'security apparatus', 'جهاز أمني'],
    category: 'political', autoDetectable: true,
  },
  decree54_new_wave: {
    type: 'decree54_new_wave', label: 'New Wave of Decree 54 Arrests',
    epsilon_magnitude: 0.08, decay_days: 21, direction: 1,
    primary_variable: 'G71',
    secondary_variables: ['D44', 'H_CP'],
    keywords: ['décret 54 arrestation', 'decree 54 charged', 'مرسوم 54 اعتقال'],
    category: 'political', autoDetectable: true,
  },

  // ── Social ────────────────────────────────────────────────
  ugtt_strike_general: {
    type: 'ugtt_strike_general', label: 'UGTT General Strike',
    epsilon_magnitude: 0.20, decay_days: 14, direction: 1,
    primary_variable: 'M_UGTT',
    secondary_variables: ['E51', 'A03', 'D41'],
    keywords: ['grève générale', 'UGTT grève générale', 'إضراب عام', 'الاتحاد العام إضراب'],
    category: 'social', autoDetectable: true,
  },
  ugtt_strike_sector: {
    type: 'ugtt_strike_sector', label: 'UGTT Sectoral Strike',
    epsilon_magnitude: 0.08, decay_days: 7, direction: 1,
    primary_variable: 'M_UGTT',
    secondary_variables: ['E51'],
    keywords: ['grève sectorielle', 'UGTT grève', 'إضراب قطاعي'],
    category: 'social', autoDetectable: true,
  },
  protest_violent_interior: {
    type: 'protest_violent_interior', label: 'Violent Protest — Interior Governorate',
    epsilon_magnitude: 0.14, decay_days: 7, direction: 1,
    primary_variable: 'E51',
    secondary_variables: ['N142', 'B21', 'O232'],
    keywords: ['affrontements Gafsa', 'violence Kasserine', 'اشتباكات قفصة', 'عنف القصرين'],
    category: 'social', autoDetectable: true,
  },
  protest_violent_tunis: {
    type: 'protest_violent_tunis', label: 'Violent Protest — Tunis',
    epsilon_magnitude: 0.18, decay_days: 10, direction: 1,
    primary_variable: 'E51',
    secondary_variables: ['N141', 'D41'],
    keywords: ['émeutes Tunis', 'violence Bardo', 'اشتباكات تونس', 'عنف العاصمة'],
    category: 'social', autoDetectable: true,
  },
  hunger_strike_prisoner: {
    type: 'hunger_strike_prisoner', label: 'Political Prisoner Hunger Strike',
    epsilon_magnitude: 0.06, decay_days: 14, direction: 1,
    primary_variable: 'G71',
    secondary_variables: ['M133', 'H_CP'],
    keywords: ['grève faim prisonnier', 'détenu grève faim', 'إضراب عن الطعام', 'معتقل يضرب'],
    category: 'social', autoDetectable: true,
  },

  // ── Security ──────────────────────────────────────────────
  libya_border_incident: {
    type: 'libya_border_incident', label: 'Armed Militia Libya Border Incident',
    epsilon_magnitude: 0.10, decay_days: 14, direction: 1,
    primary_variable: 'J_WAR',
    secondary_variables: ['N141', 'I92'],
    keywords: ['Libye frontière', 'milice frontière', 'حدود ليبيا', 'مليشيا الحدود'],
    category: 'security', autoDetectable: true,
  },
  terror_attack_domestic: {
    type: 'terror_attack_domestic', label: 'Domestic Terror Attack',
    epsilon_magnitude: 0.16, decay_days: 21, direction: 1,
    primary_variable: 'N142',
    secondary_variables: ['J_WAR', 'D41', 'H_PROP'],
    keywords: ['attentat Tunisie', 'attaque terroriste', 'هجوم إرهابي تونس'],
    category: 'security', autoDetectable: true,
  },
  migration_crisis_escalation: {
    type: 'migration_crisis_escalation', label: 'Migration Crisis Escalation — Sfax',
    epsilon_magnitude: 0.09, decay_days: 14, direction: 1,
    primary_variable: 'F66',
    secondary_variables: ['I92', 'E51'],
    keywords: ['Sfax migration', 'crise migratoire', 'أزمة الهجرة صفاقس'],
    category: 'security', autoDetectable: true,
  },

  // ── Information ────────────────────────────────────────────
  internet_shutdown: {
    type: 'internet_shutdown', label: 'Internet Throttling / Shutdown',
    epsilon_magnitude: 0.12, decay_days: 7, direction: 1,
    primary_variable: 'C37',
    secondary_variables: ['H_CP', 'D44', 'C_DD'],
    keywords: ['internet coupé', 'throttling', 'قطع الإنترنت', 'تباطؤ الإنترنت'],
    category: 'information', autoDetectable: true,
  },
  journalist_arrest_major: {
    type: 'journalist_arrest_major', label: 'Senior Journalist Arrested',
    epsilon_magnitude: 0.08, decay_days: 14, direction: 1,
    primary_variable: 'D44',
    secondary_variables: ['H_CP', 'G71'],
    keywords: ['journaliste arrêté', 'journaliste détenu', 'صحفي يُعتقل', 'اعتقال صحفي'],
    category: 'information', autoDetectable: true,
  },
  viral_video_corruption: {
    type: 'viral_video_corruption', label: 'Viral Video — Elite Corruption',
    epsilon_magnitude: 0.10, decay_days: 10, direction: 1,
    primary_variable: 'D41',
    secondary_variables: ['H_CP', 'O151', 'E51'],
    keywords: ['vidéo corruption virale', 'scandale viral', 'فيديو فساد ينتشر'],
    category: 'information', autoDetectable: true,
  },
  viral_video_violence: {
    type: 'viral_video_violence', label: 'Viral Video — State Violence',
    epsilon_magnitude: 0.14, decay_days: 10, direction: 1,
    primary_variable: 'E51',
    secondary_variables: ['O151', 'M133', 'N141'],
    keywords: ['vidéo violence virale', 'violence police virale', 'فيديو عنف ينتشر'],
    category: 'information', autoDetectable: true,
  },

  // ── Commodity ─────────────────────────────────────────────
  butane_shortage_national: {
    type: 'butane_shortage_national', label: 'National Butane Shortage',
    epsilon_magnitude: 0.07, decay_days: 14, direction: 1,
    primary_variable: 'B22',
    secondary_variables: ['E51', 'O232'],
    keywords: ['pénurie butane nationale', 'gaz butane introuvable', 'نقص غاز البوطان الوطني'],
    category: 'commodity', autoDetectable: true,
  },
  chicken_shortage_acute: {
    type: 'chicken_shortage_acute', label: 'Acute Chicken/Poultry Shortage',
    epsilon_magnitude: 0.06, decay_days: 10, direction: 1,
    primary_variable: 'B24',
    secondary_variables: ['A01', 'E51'],
    keywords: ['pénurie poulet', 'poulet introuvable', 'نقص الدجاج', 'دجاج مفقود'],
    category: 'commodity', autoDetectable: true,
  },
  bread_disappears: {
    type: 'bread_disappears', label: 'Bread Unavailable — Multiple Cities',
    epsilon_magnitude: 0.14, decay_days: 7, direction: 1,
    primary_variable: 'B24',
    secondary_variables: ['E51', 'O232', 'A01'],
    keywords: ['pain introuvable', 'pénurie pain', 'خبز مفقود', 'أزمة الخبز'],
    category: 'commodity', autoDetectable: true,
  },
  medicine_shortage_acute: {
    type: 'medicine_shortage_acute', label: 'Acute Medicine Shortage',
    epsilon_magnitude: 0.10, decay_days: 21, direction: 1,
    primary_variable: 'B24',
    secondary_variables: ['O232', 'E51'],
    keywords: ['médicaments manquent', 'pénurie médicaments', 'نقص أدوية', 'دواء مفقود'],
    category: 'commodity', autoDetectable: true,
  },

  // ── External ──────────────────────────────────────────────
  war_regional_escalation: {
    type: 'war_regional_escalation', label: 'Regional War Escalation (Gaza/Lebanon)',
    epsilon_magnitude: 0.08, decay_days: 30, direction: 1,
    primary_variable: 'J_WAR',
    secondary_variables: ['O151', 'F66', 'I92'],
    keywords: ['escalade Gaza', 'guerre Liban', 'تصعيد غزة', 'حرب لبنان'],
    category: 'external', autoDetectable: true,
  },
  eu_sanctions: {
    type: 'eu_sanctions', label: 'EU Suspends Tunisia Partnership',
    epsilon_magnitude: 0.12, decay_days: 45, direction: 1,
    primary_variable: 'I92',
    secondary_variables: ['A05', 'A_FX', 'F_DP'],
    keywords: ['UE suspend partenariat', 'sanctions Tunisie', 'تعليق الشراكة الأوروبية'],
    category: 'external', autoDetectable: true,
  },
  afcon_tunisia: {
    type: 'afcon_tunisia', label: 'AFCON / Major Football — Tunisia Competing',
    epsilon_magnitude: 0.04, decay_days: 21, direction: -1,
    primary_variable: 'O151',
    secondary_variables: ['E51'],
    keywords: ['CAN Tunisie', 'AFCON Tunisia', 'كان تونس', 'منتخب تونس كأس أمم'],
    category: 'external', autoDetectable: true,
  },
  ramadan_start: {
    type: 'ramadan_start', label: 'Ramadan Begins (Salience Suppressor)',
    epsilon_magnitude: 0.05, decay_days: 30, direction: -1,
    primary_variable: 'O151',
    secondary_variables: ['E51', 'F66'],
    keywords: ['ramadan', 'رمضان', 'début ramadan', 'بداية رمضان'],
    category: 'external', autoDetectable: false,
  },
};

// ── Auto-detect shocks from RSS articles ──────────────────────

export function detectShocksFromArticles(
  articles: Array<{ title: string; content?: string; summary?: string; published_at: string }>
): Array<{ event: ShockEvent; headline: string; detectedAt: string }> {
  const detected: Array<{ event: ShockEvent; headline: string; detectedAt: string }> = [];
  const seenTypes = new Set<ShockEventType>();

  for (const article of articles) {
    const text = (article.title + ' ' + (article.content || article.summary || '')).toLowerCase();

    for (const [, shock] of Object.entries(SHOCK_TAXONOMY)) {
      if (!shock.autoDetectable) continue;
      if (seenTypes.has(shock.type)) continue;

      const matched = shock.keywords.some(kw => text.includes(kw.toLowerCase()));
      if (matched) {
        detected.push({
          event: shock,
          headline: article.title,
          detectedAt: article.published_at,
        });
        seenTypes.add(shock.type);
      }
    }
  }

  return detected;
}

// ── Build ε(t) overrides from active shocks ───────────────────

export function buildShockOverrides(
  activeShocks: Array<{ event: ShockEvent; detectedAt: string }>
): { _sei_shock_magnitude: number; _shock_variable_nudges: Record<string, number> } {
  let totalMagnitude = 0;
  const variableNudges: Record<string, number> = {};

  const now = Date.now();

  for (const { event, detectedAt } of activeShocks) {
    // Apply decay: shock diminishes over decay_days
    const ageHours = (now - new Date(detectedAt).getTime()) / 3600000;
    const ageDays = ageHours / 24;
    const decayFactor = Math.max(0, 1 - ageDays / event.decay_days);
    const effectiveMagnitude = event.epsilon_magnitude * decayFactor * event.direction;

    totalMagnitude += Math.abs(effectiveMagnitude);

    // Nudge primary variable
    variableNudges[event.primary_variable] =
      (variableNudges[event.primary_variable] ?? 0) + effectiveMagnitude * 0.1;

    // Nudge secondary variables (smaller effect)
    for (const secVar of event.secondary_variables) {
      variableNudges[secVar] =
        (variableNudges[secVar] ?? 0) + effectiveMagnitude * 0.04;
    }
  }

  return {
    _sei_shock_magnitude: Math.min(0.12, totalMagnitude),
    _shock_variable_nudges: variableNudges,
  };
}