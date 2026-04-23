/**
 * IdeologicalCycle.tsx
 * EQ.23 — Ideological Cycle Index (ICI)
 *
 * Models the 7-phase cycle of ideological ecology under state pressure:
 *   1 SUPPRESSION → 2 VACUUM → 3 FRAGMENTATION → 4 POLARIZATION
 *   → 5 SHOCK → 6 REORGANIZATION → 7 → 1 REPRESSION RESET
 *
 * ICI(t) = f(Phase(t), Polarization(t), ShockExposure(t))
 *
 * Phase detection is deterministic from existing pipeline variables.
 * No new data sources required.
 */

import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Brain, AlertTriangle, Activity, Radio,
  ChevronRight, RotateCcw, Zap, Shield,
  Eye, TrendingUp,
} from 'lucide-react';
import { usePipeline } from '../context/PipelineContext';

// ── Constants ──────────────────────────────────────────────────

const PHASE_COLORS = {
  SUPPRESSION: '#ff2d55',
  VACUUM: '#6898be',
  FRAGMENTATION: '#ffd60a',
  POLARIZATION: '#ff9f0a',
  SHOCK: '#bf5af2',
  REORGANIZATION: '#ff9f0a',
  REPRESSION_RESET: '#ff2d55',
} as const;

const THEME = {
  bg: '#020810',
  border: '#0d1e36',
  text: '#132030',
  arrow: '#1c3654',
} as const;

// ── Types ──────────────────────────────────────────────────────

type CyclePhaseId =
  | 'SUPPRESSION'
  | 'VACUUM'
  | 'FRAGMENTATION'
  | 'POLARIZATION'
  | 'SHOCK'
  | 'REORGANIZATION'
  | 'REPRESSION_RESET';

interface CyclePhase {
  id: CyclePhaseId;
  number: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  label: string;
  sublabel: string;
  color: string;
  riskMultiplier: number;  // how this phase amplifies R(t)
  description: string;
  mechanism: string;       // the system dynamic driving this phase
  tunesiaEvidence: string; // documented Tunisia example
  nextPhaseSignals: string; // what to watch for the transition
}

interface ICIState {
  currentPhase: CyclePhase;
  phaseConfidence: number;        // 0-1
  polarizationLevel: number;      // 0-1
  shockExposure: number;          // 0-1
  ici: number;                    // 0-1 composite index
  iciLabel: string;
  daysInPhase: number | null;     // estimated
  nextPhase: CyclePhase;
  transitionProbability: number;  // 0-1, probability of moving to next phase
  transitionTriggers: string[];   // what would accelerate the transition
  deepInsight: string;            // the "why" behind current configuration
}

// ── Phase definitions ──────────────────────────────────────────

const PHASES: CyclePhase[] = [
  {
    id: 'SUPPRESSION',
    number: 1,
    label: 'Suppression',
    sublabel: 'Organized movements eliminated',
    color: PHASE_COLORS.SUPPRESSION,
    riskMultiplier: 0.7,
    description:
      'State represses organized ideological movements — political parties, ' +
      'religious networks, civil society. Leaders jailed, networks dismantled. ' +
      'Public space becomes controlled. Structured actors disappear.',
    mechanism:
      'Repression succeeds in eliminating visible opposition but drives ' +
      'meaning underground. Anger accumulates without organizational vehicle.',
    tunesiaEvidence:
      'Ben Ali period (1987–2010): Ennahda banned, MTI dismantled, secular left ' +
      'neutralized. Post-2023: Saied Decree 54, Ennahda dissolution, 23+ journalists ' +
      'charged, Ghannouchi imprisoned.',
    nextPhaseSignals:
      'Watch for: apolitical language proliferating, youth disengagement from ' +
      'organized politics, "nothing can change" fatalism in surveys and social media.',
  },
  {
    id: 'VACUUM',
    number: 2,
    label: 'Vacuum',
    sublabel: 'No dominant ideology — fatalism spreads',
    color: PHASE_COLORS.VACUUM,
    riskMultiplier: 0.5,
    description:
      'No strong ideological leadership remains. Society becomes apolitical, ' +
      'fatalistic, disengaged. Low mobilization capacity. People shift toward ' +
      '"nothing can change" belief systems.',
    mechanism:
      'Surface stability. The state reads this as success. Actually: ' +
      'pressure is accumulating without outlet. The vacuum is not stable — ' +
      'it is the loading phase before fragmentation.',
    tunesiaEvidence:
      '2000s: Depoliticized public sphere. 2010: Pre-revolution apparent calm. ' +
      'Current parallel: social cohesion rated LOW, youth emigration at 65% ' +
      'aspiration rate — exit as the dominant response to vacuum.',
    nextPhaseSignals:
      'Watch for: proliferation of small civil society groups, micro-ideologies ' +
      'emerging online, cultural/identity debates replacing political ones.',
  },
  {
    id: 'FRAGMENTATION',
    number: 3,
    label: 'Fragmentation',
    sublabel: 'Micro-ideologies multiply',
    color: PHASE_COLORS.FRAGMENTATION,
    riskMultiplier: 0.65,
    description:
      'In absence of structure, multiple micro-ideologies emerge: individualist, ' +
      'counter-cultural, reactionary conservative, moderate positioning. ' +
      'Society loses coherence. No dominant narrative. Competing frames proliferate.',
    mechanism:
      'The OCI (Opposition Coordination Index) is at maximum fragmentation here. ' +
      'High anger but no direction. Multiple actors pursuing incompatible frames ' +
      'without ability to build coalitions.',
    tunesiaEvidence:
      '2011–2013: 200+ parties registered within 6 months of revolution. ' +
      'Current: 7 distinct actor clusters with incompatible frames (immigration, ' +
      'Islamist justice, economic framing all create crosscutting divisions). ' +
      'OCI at 0.22 confirms fragmentation.',
    nextPhaseSignals:
      'Watch for: binary culture war framing emerging, single crosscutting issue ' +
      'dominating public discourse, OCI beginning to rise above 0.35.',
  },
  {
    id: 'POLARIZATION',
    number: 4,
    label: 'Polarization',
    sublabel: 'Value conflict intensifies',
    color: PHASE_COLORS.POLARIZATION,
    riskMultiplier: 0.80,
    description:
      'Tensions grow between value systems. Cultural conflicts intensify. ' +
      'Identity becomes politicized. The fragmented micro-ideologies begin to ' +
      'consolidate around opposing poles. Society divides more than it diversifies.',
    mechanism:
      'The immigration issue is a paradigm case: it forces binary positions ' +
      'on all actors, collapses nuanced frames into FOR/AGAINST, and makes ' +
      'coalition building impossible across the divide.',
    tunesiaEvidence:
      '2013–2019: Ennahda vs Nidaa Tounes as cultural war proxy. ' +
      'Post-2023: محافظين vs liberal framing, sub-Saharan migration as ' +
      'polarizing wedge issue (85% fragmentation score in actor network model). ' +
      'Information amplification A(t) elevated as partisan frames spread.',
    nextPhaseSignals:
      'Watch for: external shock (regional war, economic collapse, symbolic ' +
      'event) that reactivates dormant ideological narratives across the divide.',
  },
  {
    id: 'SHOCK',
    number: 5,
    label: 'External Shock',
    sublabel: 'Trigger reactivates dormant narratives',
    color: PHASE_COLORS.SHOCK,
    riskMultiplier: 1.10,
    description:
      'Regional war, geopolitical crisis, or symbolic domestic event. ' +
      'Emotional and ideological activation. Dormant narratives reactivated. ' +
      'The shock is the match — the accumulated tension is the fuel.',
    mechanism:
      'W(t) war distraction suppressor inverts: instead of suppressing salience, ' +
      'the external shock amplifies it. Gaza/Libya/regional conflicts feed ' +
      'into existing polarization rather than distracting from it.',
    tunesiaEvidence:
      '2010: Bouazizi self-immolation as symbolic trigger for accumulated anger. ' +
      '2019: COVID economic collapse + Saied election. ' +
      '2021: July 25 "exceptional measures" as self-coup using pandemic crisis. ' +
      'Each shock crystallized pre-existing structural conditions.',
    nextPhaseSignals:
      'Watch for: new organized movements claiming to "fix the chaos," ' +
      'rapid OCI increase, previously dormant actors re-emerging publicly.',
  },
  {
    id: 'REORGANIZATION',
    number: 6,
    label: 'Radical Reorganization',
    sublabel: 'New structures emerge — more intense',
    color: PHASE_COLORS.REORGANIZATION,
    riskMultiplier: 1.20,
    description:
      'New structured movements emerge, often more intense than previous ones. ' +
      'They claim to fix the chaos. The organizational form changes — ' +
      'not the same ideology returning, but a mutated version that learned ' +
      'from the previous suppression cycle.',
    mechanism:
      'Ideologies do not disappear under repression — they mutate. ' +
      'What returns after suppression is decentralized, harder to surveil, ' +
      'more radical in framing because moderate options have been foreclosed.',
    tunesiaEvidence:
      '1987–2011: Ben Ali as "corrective movement" after Bourguiba. ' +
      '2011: Revolution as reorganization after 23 years of suppression. ' +
      '2021: Saied movement as reorganization after failed democratic transition. ' +
      'Each reorganization was more centralized and less tolerant than previous.',
    nextPhaseSignals:
      'Watch for: state security apparatus identifying new movement as threat, ' +
      'first Decree 54-style arrests of reorganization actors, ' +
      'narrative shift from "we are correcting" to "we are protecting order."',
  },
  {
    id: 'REPRESSION_RESET',
    number: 7,
    label: 'Repression Reset',
    sublabel: 'Cycle restarts from Phase 1',
    color: PHASE_COLORS.REPRESSION_RESET,
    riskMultiplier: 0.75,
    description:
      'State reacts to Phase 6 reorganization: arrests, legal restrictions, ' +
      'crackdowns. The cycle resets to Phase 1. The new suppression targets ' +
      'the new organizational forms — and the cycle begins again, typically ' +
      'with higher baseline tension than the previous iteration.',
    mechanism:
      'Each cycle iteration leaves a residue of unresolved structural tension. ' +
      'The system does not return to the same baseline — it returns to a higher ' +
      'fragility floor. This is the ratchet mechanism of civilizational decay.',
    tunesiaEvidence:
      'We are observing this now: Saied (Phase 6, 2021) → Decree 54, party ' +
      'dissolution, journalist arrests (Phase 7 → Phase 1 reset, 2023–present). ' +
      'The 120-year cycle shows Tunisia in Structural Rigidity because each ' +
      'reset iteration has failed to address the underlying structural conditions.',
    nextPhaseSignals:
      'Watch for: apolitical language, emigration acceleration, fatalism signals — ' +
      'same as Phase 2 entry indicators. The new vacuum forming beneath the surface.',
  },
];

// ── Phase detection engine ─────────────────────────────────────

function detectCurrentPhase(
  rriState: any,
  data: any,
  actorNetwork: any,
  seiResult: any,
  miiProfile: any
): { phase: CyclePhase; confidence: number } {
  const decree54     = data.social?.decree54_charged ?? 23;
  const pressFreedom = data.social?.press_freedom_rank ?? 118;
  const protestCount = data.social?.protest_events_30d ?? 23;
  const ugtt         = data.social?.ugtt_mobilisation_level ?? 'ELEVATED';
  const cohesion     = data.social?.social_cohesion ?? 'LOW';
  const oci          = actorNetwork?.oci ?? 0.22;
  const fragCoeff    = actorNetwork?.fragmentationCoefficient ?? 0.78;
  const ngoCapacity  = actorNetwork?.ngoCapacity ?? 0.55;
  const miiPhase     = miiProfile?.phase ?? 'FREEZE';
  const velocity     = rriState?.velocity ?? 0.18;
  const wt           = rriState?.w_t ?? 0.72;
  const seiAlert     = seiResult?.angerWindowAlert ?? false;
  const rri          = rriState?.rri ?? 2.31;
  const compoundStress = rriState?.compound_stress ?? 0.12;
  const infoAmp      = rriState?.info_amplification ?? 0.35;

  // ── Phase 1: SUPPRESSION
  // High decree54 + low press freedom + declining NGO + MII FREEZE
  const suppressionScore =
    (decree54 > 15 ? 0.35 : 0) +
    (pressFreedom > 100 ? 0.25 : 0) +
    (ngoCapacity < 0.55 ? 0.20 : 0) +
    (miiPhase === 'FREEZE' ? 0.20 : 0);

  // ── Phase 2: VACUUM
  // Low protest + low OCI + low mobilization + social cohesion LOW
  const vacuumScore =
    (protestCount < 15 ? 0.30 : 0) +
    (oci < 0.25 ? 0.30 : 0) +
    (cohesion === 'LOW' ? 0.25 : 0) +
    (ugtt === 'LOW' || ugtt === 'MODERATE' ? 0.15 : 0);

  // ── Phase 3: FRAGMENTATION
  // High fragmentation coefficient + multiple competing frames + low OCI
  const fragmentationScore =
    (fragCoeff > 0.70 ? 0.35 : 0) +
    (oci > 0.15 && oci < 0.35 ? 0.25 : 0) +
    (protestCount > 10 && protestCount < 25 ? 0.20 : 0) +
    (ngoCapacity > 0.40 ? 0.20 : 0);

  // ── Phase 4: POLARIZATION
  // High compound stress + high info amplification + elevated protests
  const polarizationScore =
    (compoundStress > 0.15 ? 0.30 : 0) +
    (infoAmp > 0.40 ? 0.25 : 0) +
    (protestCount > 20 ? 0.25 : 0) +
    (fragCoeff > 0.60 && oci > 0.30 ? 0.20 : 0);

  // ── Phase 5: SHOCK
  // SEI anger window + high W(t) or sudden spike + velocity high
  const shockScore =
    (seiAlert ? 0.35 : 0) +
    (velocity > 0.20 ? 0.30 : 0) +
    (rri > 2.5 ? 0.20 : 0) +
    (wt < 0.60 ? 0.15 : 0);

  // ── Phase 6: REORGANIZATION
  // Rising OCI + increasing protests + lower suppression
  const reorganizationScore =
    (oci > 0.40 ? 0.35 : 0) +
    (protestCount > 30 ? 0.30 : 0) +
    (miiPhase === 'CHAOTIC' ? 0.20 : 0) +
    (velocity > 0.15 && rri > 2.4 ? 0.15 : 0);

  const scores: Array<{ phase: CyclePhase; score: number }> = [
    { phase: PHASES[0], score: suppressionScore },
    { phase: PHASES[1], score: vacuumScore },
    { phase: PHASES[2], score: fragmentationScore },
    { phase: PHASES[3], score: polarizationScore },
    { phase: PHASES[4], score: shockScore },
    { phase: PHASES[5], score: reorganizationScore },
  ];

  scores.sort((a, b) => b.score - a.score);
  const winner = scores[0];
  const total  = scores.reduce((s, x) => s + x.score, 0) || 1;
  const confidence = winner.score / total;

  return { phase: winner.phase, confidence: Math.min(0.95, confidence * 1.8) };
}

function computeICI(
  phase: CyclePhase,
  rriState: any,
  data: any,
  actorNetwork: any,
  seiResult: any
): ICIState {
  // Polarization(t) — from existing model variables
  const compoundStress = rriState?.compound_stress ?? 0.12;
  const fragCoeff      = actorNetwork?.fragmentationCoefficient ?? 0.78;
  const infoAmp        = rriState?.info_amplification ?? 0.35;
  const polarizationLevel = Math.min(1,
    compoundStress * 0.35 + fragCoeff * 0.40 + infoAmp * 0.25
  );

  // ShockExposure(t) — from W(t), SEI, velocity
  const wt       = rriState?.w_t ?? 0.72;
  const velocity = rriState?.velocity ?? 0.18;
  const seiMax   = seiResult?.maxSEI ?? 0;
  const seiAlert = seiResult?.angerWindowAlert ?? false;
  const shockExposure = Math.min(1,
    (1 - wt) * 0.40 +
    Math.min(1, velocity * 5) * 0.30 +
    seiMax * 0.20 +
    (seiAlert ? 0.10 : 0)
  );

  // ICI(t) = phase_risk × (1 + polarization × 0.4 + shock × 0.3)
  const phaseBase = phase.riskMultiplier;
  const ici = Math.min(1,
    phaseBase * (1 + polarizationLevel * 0.40 + shockExposure * 0.30)
  );

  // Label
  const iciLabel = ici >= 0.85 ? 'CRITICAL'
    : ici >= 0.70 ? 'HIGH'
    : ici >= 0.55 ? 'ELEVATED'
    : ici >= 0.40 ? 'MODERATE'
    : 'LOW';

  // Next phase
  const currentIdx = PHASES.findIndex(p => p.id === phase.id);
  const nextPhase  = PHASES[(currentIdx + 1) % PHASES.length];

  // Transition probability
  const transitionProb = Math.min(0.92,
    polarizationLevel * 0.45 +
    shockExposure * 0.35 +
    (velocity > 0.15 ? 0.20 : 0.10)
  );

  // Transition triggers
  const triggers: string[] = [];
  const protestCount = data.social?.protest_events_30d ?? 23;
  const oci = actorNetwork?.oci ?? 0.22;
  if (phase.id === 'SUPPRESSION') {
    triggers.push(`OCI rising above 0.30 (currently ${oci.toFixed(2)})`);
    triggers.push('Civil society networks resuming visible activity');
    triggers.push('Economic shock forcing social disengagement');
  } else if (phase.id === 'VACUUM') {
    triggers.push('New digital-native movement emerging without formal structure');
    triggers.push('Cultural/identity debate replacing economic framing');
    triggers.push('Diaspora-driven narrative injection');
  } else if (phase.id === 'FRAGMENTATION') {
    triggers.push(`Protest density above 30/month (currently ${protestCount})`);
    triggers.push('Binary issue forcing all actors to take sides');
    triggers.push('External conflict activating dormant narratives');
  } else if (phase.id === 'POLARIZATION') {
    triggers.push('SEI anger window activation — material scarcity triggering symbolic conflict');
    triggers.push('High-profile arrest creating martyrdom narrative');
    triggers.push(`W(t) collapse below 0.55 (currently ${wt.toFixed(2)})`);
  } else if (phase.id === 'SHOCK') {
    triggers.push('OCI crossing 0.40 as shock creates coordination opportunity');
    triggers.push('New structured actor claiming to represent post-shock order');
  } else if (phase.id === 'REORGANIZATION') {
    triggers.push('State identifying new movement as security threat');
    triggers.push('First arrests of reorganization leaders');
    triggers.push('Media narrative shifting from "reform" to "threat"');
  }

  // Deep insight
  const insights: Record<CyclePhaseId, string> = {
    SUPPRESSION:
      `Tunisia is in active suppression (Decree 54, ${data.social?.decree54_charged ?? 23} charged). ` +
      `The cycle model predicts this produces a vacuum — not stability. ` +
      `Ideological pressure is not relieved; it is driven underground where it mutates. ` +
      `The MII FREEZE pattern (loyalist cabinet concentration) is the elite-level expression of this phase.`,
    VACUUM:
      `Surface calm masks accumulated pressure without outlet. ` +
      `The 65% youth emigration aspiration rate is the behavioral signature of vacuum — ` +
      `exit replaces voice. This is the loading phase before fragmentation.`,
    FRAGMENTATION:
      `High fragmentation (OCI=${oci.toFixed(2)}) confirms the system is in fragmented competition. ` +
      `Multiple frames compete without coalition-building capacity. ` +
      `The immigration crosscutting issue (85% fragmentation score) is the paradigm case — ` +
      `it prevents the economic grievance coalition that could challenge the regime.`,
    POLARIZATION:
      `Value conflict has intensified to binary framing. ` +
      `Information amplification (A(t)=${infoAmp.toFixed(2)}) reflects partisan frame spread. ` +
      `The system is loaded for shock activation — material grievance is ready to ` +
      'convert to ideological confrontation with the right trigger.',
    SHOCK:
      `External shock has activated dormant narratives. ` +
      `System velocity (V(t)=${velocity.toFixed(3)}) reflects rapid state change. ` +
      `This is the most unstable phase — the direction of reorganization is not yet determined.`,
    REORGANIZATION:
      `New structured actors are emerging. Historically, each reorganization in Tunisia ` +
      `has been more centralized and less tolerant than the previous one. ` +
      `OCI rise signals coordination capacity returning — the model's rupture threshold approaches.`,
    REPRESSION_RESET:
      `The cycle is resetting but at a higher baseline fragility. ` +
      `Each iteration leaves unresolved structural tension. ` +
      `The 120-year cycle at 58% of arc confirms the ratchet mechanism: ` +
      `Tunisia does not return to the same baseline — it returns to a higher floor.`,
  };

  return {
    currentPhase: phase,
    phaseConfidence: 0, // filled by caller
    polarizationLevel: parseFloat(polarizationLevel.toFixed(3)),
    shockExposure: parseFloat(shockExposure.toFixed(3)),
    ici: parseFloat(ici.toFixed(3)),
    iciLabel,
    daysInPhase: null,
    nextPhase,
    transitionProbability: parseFloat(transitionProb.toFixed(3)),
    transitionTriggers: triggers,
    deepInsight: insights[phase.id] ?? '',
  };
}

// ── Phase arc visual ───────────────────────────────────────────

const PhaseArc: React.FC<{ 
  currentPhase: CyclePhase; 
  selectedPhase: CyclePhase | null;
  onPhaseSelect: (phase: CyclePhase) => void;
  iciState: ICIState;
}> = ({ currentPhase, selectedPhase, onPhaseSelect, iciState }) => {
  const displayPhases = PHASES.slice(0, 6); // 1-6, phase 7 merges back to 1
  const n = displayPhases.length;

  return (
    <svg viewBox="0 0 400 240" className="w-full max-w-[320px] mx-auto overflow-visible">
      {displayPhases.map((phase, i) => {
        const isCurrent = phase.id === currentPhase.id;
        const isSelected = selectedPhase?.id === phase.id;
        const anglePer  = 360 / n;
        const startAngle = -90 + i * anglePer;
        const endAngle   = startAngle + anglePer - 4;
        const midAngle   = startAngle + anglePer / 2;
        const r1 = 88, r2 = 64, cx = 200, cy = 120;

        const rad = (a: number) => (a * Math.PI) / 180;
        const x1o = cx + r1 * Math.cos(rad(startAngle));
        const y1o = cy + r1 * Math.sin(rad(startAngle));
        const x2o = cx + r1 * Math.cos(rad(endAngle));
        const y2o = cy + r1 * Math.sin(rad(endAngle));
        const x1i = cx + r2 * Math.cos(rad(startAngle));
        const y1i = cy + r2 * Math.sin(rad(startAngle));
        const x2i = cx + r2 * Math.cos(rad(endAngle));
        const y2i = cy + r2 * Math.sin(rad(endAngle));

        const d = `M${x1i.toFixed(1)},${y1i.toFixed(1)} L${x1o.toFixed(1)},${y1o.toFixed(1)} A${r1},${r1} 0 0,1 ${x2o.toFixed(1)},${y2o.toFixed(1)} L${x2i.toFixed(1)},${y2i.toFixed(1)} A${r2},${r2} 0 0,0 ${x1i.toFixed(1)},${y1i.toFixed(1)} Z`;

        const lx = cx + (r1 + 16) * Math.cos(rad(midAngle));
        const ly = cy + (r1 + 16) * Math.sin(rad(midAngle));

        // Arrow position - placed outside the wheel
        const arrowAngle = midAngle;
        const ax = cx + (r1 + 24) * Math.cos(rad(arrowAngle));
        const ay = cy + (r1 + 24) * Math.sin(rad(arrowAngle));

        // Calculate probability for this phase
        const prob = isCurrent 
          ? iciState.transitionProbability 
          : Math.min(0.95, iciState.transitionProbability * (phase.riskMultiplier / iciState.currentPhase.riskMultiplier));

        return (
          <g 
            key={phase.id} 
            className="cursor-pointer transition-all duration-300"
            onClick={() => onPhaseSelect(phase)}
          >
            <motion.path
              d={d}
              fill={phase.color}
              initial={false}
              animate={{
                opacity: isCurrent ? 0.9 : isSelected ? 0.6 : 0.18,
                scale: isSelected ? 1.05 : 1,
              }}
              stroke={THEME.bg}
              strokeWidth={isCurrent || isSelected ? 2 : 1}
              style={{ transformOrigin: 'center' }}
            />
            {(isCurrent || isSelected) && (
              <path d={d} fill="none" stroke={phase.color} strokeWidth="2.5" opacity="0.7" />
            )}
            <text
              x={lx.toFixed(1)}
              y={(ly + 3).toFixed(1)}
              textAnchor="middle"
              fontSize={isCurrent || isSelected ? '7.5' : '6'}
              fill={isCurrent || isSelected ? phase.color : `${phase.color}88`}
              fontFamily="JetBrains Mono, monospace"
              fontWeight={isCurrent || isSelected ? '700' : '400'}
              className="pointer-events-none"
            >
              {phase.number}
            </text>

            {/* Transition Arrow - placed outside */}
            {isCurrent && (
              <g transform={`translate(${ax}, ${ay}) rotate(${arrowAngle + 90})`}>
                <motion.path
                  d="M0,-6 L0,6 M-3,3 L0,6 L3,3"
                  fill="none"
                  stroke={phase.color}
                  strokeWidth="2"
                  animate={{ y: [0, -4, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                />
                <text
                  y="18"
                  textAnchor="middle"
                  fontSize="8"
                  fill={phase.color}
                  fontFamily="JetBrains Mono, monospace"
                  fontWeight="bold"
                >
                  {(prob * 100).toFixed(0)}%
                </text>
              </g>
            )}
          </g>
        );
      })}

      {/* Center */}
      <circle cx="200" cy="120" r="54" fill={THEME.bg} stroke={THEME.border} strokeWidth="1" />
      <text x="200" y="108" textAnchor="middle" fontSize="8" fill={THEME.text}
        fontFamily="JetBrains Mono, monospace">PHASE</text>
      <text x="200" y="122" textAnchor="middle" fontSize="12" fill={currentPhase.color}
        fontFamily="JetBrains Mono, monospace" fontWeight="700">
        {currentPhase.number}
      </text>
      <text x="200" y="136" textAnchor="middle" fontSize="8" fill={currentPhase.color}
        fontFamily="JetBrains Mono, monospace">
        {currentPhase.label.toUpperCase().slice(0, 11)}
      </text>

      {/* Arrow showing direction */}
      <path d="M250,120 L264,114 L264,126 Z" fill={THEME.arrow} opacity="0.6" />
    </svg>
  );
};

// ── Main component ─────────────────────────────────────────────

export const IdeologicalCycle: React.FC = () => {
  const { rriState, data, actorNetwork, seiResult, miiProfile } = usePipeline();
  const [selectedPhase, setSelectedPhase] = useState<CyclePhase | null>(null);

  const { phase: detectedPhase, confidence } = useMemo(
    () => detectCurrentPhase(rriState, data, actorNetwork, seiResult, miiProfile),
    [rriState, data, actorNetwork, seiResult, miiProfile]
  );

  const iciState = useMemo(() => {
    const state = computeICI(detectedPhase, rriState, data, actorNetwork, seiResult);
    state.phaseConfidence = confidence;
    return state;
  }, [detectedPhase, rriState, data, actorNetwork, seiResult, confidence]);

  const rriColor = useMemo(() => {
    switch (detectedPhase.id) {
      case 'SHOCK':
      case 'REORGANIZATION':
        return 'text-intel-red';
      case 'POLARIZATION':
      case 'SUPPRESSION':
      case 'REPRESSION_RESET':
        return 'text-intel-orange';
      case 'VACUUM':
      case 'FRAGMENTATION':
      default:
        return 'text-intel-cyan';
    }
  }, [detectedPhase.id]);

  const iciColor = iciState.iciLabel === 'CRITICAL' ? 'text-intel-red'
    : iciState.iciLabel === 'HIGH' ? 'text-intel-red'
    : iciState.iciLabel === 'ELEVATED' ? 'text-intel-orange'
    : 'text-yellow-500';

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Header */}
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 rounded-lg bg-intel-purple/10 border border-intel-purple/20
          flex items-center justify-center text-[11px] font-bold text-intel-purple font-mono">
          06
        </div>
        <h2 className="text-lg font-bold text-white uppercase tracking-widest">
          Ideological Cycle Index
        </h2>
        <span className="text-[9px] font-mono text-slate-600 ml-auto">
          EQ.23 · 7-phase ecological model
        </span>
      </div>

      {/* Formula */}
      <div className="glass p-4 rounded-2xl border border-intel-purple/20 space-y-1">
        <div className="text-[8px] font-mono text-slate-500 uppercase tracking-widest">
          EQ.23 — Ideological Cycle Index
        </div>
        <div className="text-[10px] font-mono text-intel-purple">
          ICI(t) = Phase_risk(t) × (1 + Polarization(t)·0.4 + ShockExposure(t)·0.3)
        </div>
        <div className="text-[9px] font-mono text-slate-500">
          Polarization(t) = f(compound_stress, fragmentation, info_amplification)
          · ShockExposure(t) = f(W(t), velocity, SEI)
        </div>
      </div>

      {/* Main metrics row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {[
          { label: 'RRI(t)', value: rriState.rri.toFixed(4),
            sub: 'Revolutionary Risk', color: rriColor, subColor: rriColor },
          { label: 'ICI(t)', value: iciState.ici.toFixed(3),
            sub: iciState.iciLabel, color: iciColor, subColor: iciColor },
          { label: 'Polarization', value: `${(iciState.polarizationLevel*100).toFixed(0)}%`,
            sub: 'fragmentation × stress × amp',
            color: iciState.polarizationLevel > 0.6 ? 'text-intel-red' : 'text-intel-orange' },
          { label: 'Shock Exposure', value: `${(iciState.shockExposure*100).toFixed(0)}%`,
            sub: 'W(t) + velocity + SEI',
            color: iciState.shockExposure > 0.5 ? 'text-intel-orange' : 'text-yellow-500' },
          { label: 'Phase Confidence', value: `${(iciState.phaseConfidence*100).toFixed(0)}%`,
            sub: `Phase ${iciState.currentPhase.number} of 7`,
            color: 'text-intel-purple' },
        ].map(m => (
          <div key={m.label} className="glass p-4 rounded-2xl border border-intel-border/50 space-y-1">
            <div className="text-[8px] font-mono text-slate-500 uppercase">{m.label}</div>
            <div className={`text-2xl font-bold font-mono ${m.color}`}>{m.value}</div>
            <div className={`text-[8px] font-mono ${m.subColor || 'text-slate-600'}`}>{m.sub}</div>
          </div>
        ))}
      </div>

      {/* Arc + current phase */}
      <div className="glass p-5 rounded-2xl border border-intel-border/50">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">

          {/* Arc visual */}
          <div className="space-y-3">
            <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">
              Cycle Position
            </div>
            <PhaseArc 
              currentPhase={iciState.currentPhase} 
              selectedPhase={selectedPhase}
              onPhaseSelect={(p) => setSelectedPhase(p.id === selectedPhase?.id ? null : p)}
              iciState={iciState}
            />
            <div className="text-center">
              <div className="text-[8px] font-mono text-slate-600">
                ← tap a phase to explore details
              </div>
            </div>
          </div>

          {/* Current/Selected phase detail */}
          <div className="space-y-3">
            <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">
              {selectedPhase ? 'Selected Phase — explorer' : 'Current Phase — detected'}
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedPhase?.id || iciState.currentPhase.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="p-4 rounded-xl border space-y-2"
                style={{
                  borderColor: `${(selectedPhase || iciState.currentPhase).color}44`,
                  background: `${(selectedPhase || iciState.currentPhase).color}08`,
                }}
              >
                <div className="flex items-center space-x-2">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center
                      text-[9px] font-bold font-mono text-black"
                    style={{ background: (selectedPhase || iciState.currentPhase).color }}
                  >
                    {(selectedPhase || iciState.currentPhase).number}
                  </div>
                  <span className="font-bold text-white text-[12px]">
                    {(selectedPhase || iciState.currentPhase).label}
                  </span>
                </div>
                <div className="text-[9px] font-mono"
                  style={{ color: (selectedPhase || iciState.currentPhase).color }}>
                  {(selectedPhase || iciState.currentPhase).sublabel}
                </div>
                <p className="text-[9px] text-slate-400 leading-relaxed">
                  {(selectedPhase || iciState.currentPhase).description}
                </p>

                {/* Transition Probability Bar (only for current phase) */}
                {!selectedPhase && (
                  <div className="pt-2 space-y-1.5">
                    <div className="flex justify-between text-[7px] font-mono uppercase">
                      <span style={{ color: `${iciState.currentPhase.color}88` }}>Transition Probability</span>
                      <span style={{ color: iciState.currentPhase.color }}>{(iciState.transitionProbability * 100).toFixed(0)}%</span>
                    </div>
                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${iciState.transitionProbability * 100}%` }}
                        className="h-full"
                        style={{ background: iciState.currentPhase.color }}
                      />
                    </div>
                  </div>
                )}

                {/* Selected Phase Details */}
                {selectedPhase && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="pt-2 space-y-3 border-t border-white/5 mt-2"
                  >
                    <div className="space-y-1">
                      <div className="text-[7px] font-mono text-slate-500 uppercase">Mechanism</div>
                      <div className="text-[9px] text-slate-400">{selectedPhase.mechanism}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-[7px] font-mono text-slate-500 uppercase">Tunisia Evidence</div>
                      <div className="text-[9px] text-slate-400">{selectedPhase.tunesiaEvidence}</div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Next phase */}
            <div className="flex items-center space-x-2">
              <ChevronRight className="w-3 h-3 text-slate-600 shrink-0" />
              <div className="flex-1">
                <div className="text-[8px] font-mono text-slate-600">
                  Next: <span style={{ color: iciState.nextPhase.color }}>
                    {iciState.nextPhase.label}
                  </span>
                  {' '}· System Pressure: {(iciState.transitionProbability*100).toFixed(0)}%
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Deep insight */}
      <div className="glass p-5 rounded-2xl border border-intel-purple/15 space-y-2">
        <div className="flex items-center space-x-2">
          <Brain className="w-3.5 h-3.5 text-intel-purple" />
          <div className="text-[9px] font-mono text-intel-purple uppercase tracking-widest">
            Analytical Assessment
          </div>
        </div>
        <p className="text-[10px] text-slate-300 leading-relaxed">
          {iciState.deepInsight}
        </p>
      </div>

      {/* Transition triggers */}
      {iciState.transitionTriggers.length > 0 && (
        <div className="glass p-5 rounded-2xl border border-intel-border/50 space-y-3">
          <div className="flex items-center space-x-2">
            <Eye className="w-3.5 h-3.5 text-intel-cyan" />
            <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">
              Watch for Phase Transition
            </div>
          </div>
          {iciState.transitionTriggers.map((t, i) => (
            <div key={i} className="flex items-start space-x-2">
              <div className="w-1.5 h-1.5 rounded-full bg-intel-cyan mt-1.5 shrink-0" />
              <span className="text-[9px] text-slate-400 leading-relaxed">{t}</span>
            </div>
          ))}
        </div>
      )}

      {/* All 7 phases explorer */}
      <motion.div layout className="space-y-2">
        <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">
          All Phases — Cycle Map
        </div>
        {PHASES.map((phase) => {
          const isCurrent = phase.id === iciState.currentPhase.id;
          const isSelected = selectedPhase?.id === phase.id;
          return (
            <motion.div
              key={phase.id}
              layout
              className="rounded-xl border overflow-hidden cursor-pointer"
              style={{
                borderColor: `${phase.color}${isCurrent ? '66' : '22'}`,
                background: `${phase.color}${isCurrent ? '0a' : '04'}`,
              }}
              onClick={() =>
                setSelectedPhase(isSelected ? null : phase)
              }
            >
              <div className="flex items-center space-x-3 p-3">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center
                    text-[9px] font-bold font-mono text-black shrink-0"
                  style={{
                    background: phase.color,
                    opacity: isCurrent ? 1 : 0.4,
                  }}
                >
                  {phase.number}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span
                      className="text-[10px] font-bold"
                      style={{ color: isCurrent ? phase.color : `${phase.color}88` }}
                    >
                      {phase.label}
                    </span>
                    {isCurrent && (
                      <span className="text-[7px] font-mono px-1.5 py-0.5 rounded"
                        style={{
                          background: `${phase.color}22`,
                          color: phase.color,
                          border: `1px solid ${phase.color}44`,
                        }}>
                        CURRENT
                      </span>
                    )}
                  </div>
                  <div className="text-[8px]"
                    style={{ color: `${phase.color}66` }}>
                    {phase.sublabel}
                  </div>

                  {/* Transition Probability Indicator */}
                  <div className="mt-1.5 space-y-1 max-w-[120px]">
                    <div className="flex justify-between text-[6px] font-mono uppercase tracking-tighter">
                      <span style={{ color: `${phase.color}66` }}>Next Phase Pressure</span>
                      <span style={{ color: phase.color }}>
                        {((isCurrent ? iciState.transitionProbability : iciState.transitionProbability * (phase.riskMultiplier / iciState.currentPhase.riskMultiplier)) * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="h-0.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(isCurrent ? iciState.transitionProbability : Math.min(0.95, iciState.transitionProbability * (phase.riskMultiplier / iciState.currentPhase.riskMultiplier))) * 100}%` }}
                        className="h-full"
                        style={{ background: phase.color, opacity: isCurrent ? 1 : 0.4 }}
                      />
                    </div>
                  </div>
                </div>
                <div className="text-[8px] font-mono shrink-0"
                  style={{ color: `${phase.color}66` }}>
                  ×{phase.riskMultiplier.toFixed(1)}
                </div>
                <ChevronRight
                  className="w-3 h-3 shrink-0 transition-transform"
                  style={{
                    color: `${phase.color}44`,
                    transform: isSelected ? 'rotate(90deg)' : 'none',
                  }}
                />
              </div>

              <AnimatePresence initial={false}>
                {isSelected && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ 
                      height: { duration: 0.4, ease: [0.04, 0.62, 0.23, 0.98] },
                      opacity: { duration: 0.25, delay: 0.1 }
                    }}
                    className="border-t overflow-hidden"
                    style={{ borderColor: `${phase.color}22` }}
                  >
                    <div className="px-4 py-4 space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[9px]">
                        <div className="space-y-2">
                          <div className="font-mono text-slate-500 uppercase text-[7px]">
                            System Mechanism
                          </div>
                          <p className="text-slate-400 leading-relaxed">
                            {phase.mechanism}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <div className="font-mono text-slate-500 uppercase text-[7px]">
                            Tunisia Evidence
                          </div>
                          <p className="text-slate-400 leading-relaxed">
                            {phase.tunesiaEvidence}
                          </p>
                        </div>
                      </div>
                      <div className="border-t pt-3 space-y-1"
                        style={{ borderColor: `${phase.color}15` }}>
                        <div className="font-mono text-slate-500 uppercase text-[7px]">
                          Next Phase Signals
                        </div>
                        <p className="text-[9px] text-slate-500 leading-relaxed italic">
                          {phase.nextPhaseSignals}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Key insight box */}
      <div className="glass p-5 rounded-2xl border border-intel-orange/15 space-y-2">
        <div className="text-[9px] font-mono text-intel-orange uppercase tracking-widest">
          System Law
        </div>
        <p className="text-[10px] text-slate-300 leading-relaxed">
          Ideologies do not disappear under repression — they mutate, fragment, and return
          in stronger or different forms. Each iteration leaves a higher baseline tension.
          Tunisia's current suppression phase is not producing stability — it is producing
          the next vacuum, which will produce the next fragmentation cycle.
          The question is not whether the cycle continues, but which organizational form
          the next reorganization phase will take.
        </p>
        <p className="text-[9px] font-mono text-intel-orange">
          → Watch: OCI crossing 0.35 is the leading indicator of fragmentation → polarization transition.
        </p>
      </div>

    </div>
  );
};
