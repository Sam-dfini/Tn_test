/**
 * TRGMDashboard.tsx
 * TunisiaIntel — Triarchical Recursive Governance Matrix
 * Command Center Branch — "State of the Triad"
 *
 * Full interactive SVG with animation system per TRGM-TN Specification v1.0
 * Recursive triangle-of-triangles visualization with live GSI calculation,
 * cascade simulation, lateral coupling arcs, and drill-down interaction.
 */

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Triangle,
  Zap,
  AlertTriangle,
  Activity,
  ChevronRight,
  RefreshCw,
  Play,
  RotateCcw,
  Info,
  ChevronDown,
  ChevronUp,
  TrendingDown,
  Shield,
  Brain,
  DollarSign,
  AlertCircle,
} from "lucide-react";
import { usePipeline } from "../../context/PipelineContext";
import { useNotifications } from "../../context/NotificationContext";
import { cn } from "../../utils/cn";

// ─── TRGM EQUATIONS ──────────────────────────────────────────────────────────

const EPSILON = 1e-6;

function computeGSI(F: number, N: number, P: number): number {
  const num = Math.sqrt((F - N) ** 2 + (N - P) ** 2 + (P - F) ** 2);
  const den = Math.sqrt(6) * Math.max(F, N, P) + EPSILON;
  return Math.max(0, Math.min(1, 1 - num / den));
}

function gsiLabel(gsi: number): { label: string; color: string; cls: string } {
  if (gsi >= 0.85)
    return { label: "EQUILIBRIUM", color: "#00D2FF", cls: "equilibrium" };
  if (gsi >= 0.6)
    return { label: "MANAGED STRESS", color: "#00FF88", cls: "growth" };
  if (gsi >= 0.35)
    return { label: "CASCADE RISK", color: "#FFD700", cls: "cascade-risk" };
  return { label: "SYSTEMIC FRACTURE", color: "#FF0044", cls: "fracture" };
}

// Lateral coupling matrix Λ (Tunisia-calibrated)
const LAMBDA = [
  [0, 0.72, 0.68], // F→N, F→P
  [0.55, 0, 0.45], // N→F, N→P
  [0.38, 0.81, 0], // P→F, P→N
];

function computeSigma(F: number, N: number, P: number): number {
  const triad = [F, N, P];
  let sigma = 0;
  let count = 0;
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (i !== j && LAMBDA[i][j] > 0) {
        sigma += LAMBDA[i][j] * (LAMBDA[i][j] > 0.7 ? 1 : 0);
        count++;
      }
    }
  }
  return sigma / 6;
}

// ─── TUNISIA NODE DATA ─────────────────────────────────────────────────────────

type Pole = "Father" | "Mother" | "Son";
type TRGMState = "EQUILIBRIUM" | "STRESS" | "CASCADE" | "FRACTURE";

interface TRGMNode {
  id: string;
  label: string;
  pole: Pole;
  layer: 0 | 1 | 2 | 3;
  F: number;
  N: number;
  P: number;
  weight: number;
  children?: TRGMNode[];
  lateralTargets?: { id: string; coeff: number }[];
}

const TUNISIA_NODES: TRGMNode[] = [
  // Layer 0 — Strategic High Echelon (Father pole)
  {
    id: "presidency",
    label: "Presidency (Saied)",
    pole: "Father",
    layer: 0,
    F: 0.72,
    N: 0.48,
    P: 0.35,
    weight: 0.4,
  },
  {
    id: "army",
    label: "Army (neutral arbiter)",
    pole: "Father",
    layer: 0,
    F: 0.85,
    N: 0.62,
    P: 0.4,
    weight: 0.35,
  },
  {
    id: "interior",
    label: "Interior / Nat. Guard",
    pole: "Father",
    layer: 0,
    F: 0.61,
    N: 0.38,
    P: 0.42,
    weight: 0.25,
  },
  // Layer 0 — Mother
  {
    id: "ugtt",
    label: "UGTT (labor narrative)",
    pole: "Mother",
    layer: 0,
    F: 0.35,
    N: 0.81,
    P: 0.52,
    weight: 0.4,
  },
  {
    id: "zitouna",
    label: "Religious (Zitouna)",
    pole: "Mother",
    layer: 0,
    F: 0.42,
    N: 0.68,
    P: 0.38,
    weight: 0.25,
  },
  {
    id: "diaspora",
    label: "Diaspora media / NGO",
    pole: "Mother",
    layer: 0,
    F: 0.15,
    N: 0.71,
    P: 0.44,
    weight: 0.35,
  },
  // Layer 0 — Son
  {
    id: "informal",
    label: "Informal economy",
    pole: "Son",
    layer: 0,
    F: 0.28,
    N: 0.42,
    P: 0.68,
    weight: 0.35,
  },
  {
    id: "phosphate",
    label: "Phosphate / Agri / Tourism",
    pole: "Son",
    layer: 0,
    F: 0.45,
    N: 0.48,
    P: 0.55,
    weight: 0.35,
  },
  {
    id: "youth",
    label: "Youth / Remittances",
    pole: "Son",
    layer: 0,
    F: 0.18,
    N: 0.52,
    P: 0.48,
    weight: 0.3,
  },
];

// Layer 1 branch aggregates
const LAYER1_BRANCHES = {
  Father: {
    label: "FORCE",
    color: "#FF0044",
    nodes: [
      {
        id: "national-guard",
        label: "National Guard",
        F: 0.71,
        N: 0.42,
        P: 0.33,
      },
      {
        id: "usgct",
        label: "Anti-terrorism (USGCT)",
        F: 0.82,
        N: 0.55,
        P: 0.28,
      },
      {
        id: "anssi",
        label: "Cyber Defense (ANSSI)",
        F: 0.45,
        N: 0.38,
        P: 0.51,
      },
    ],
  },
  Mother: {
    label: "NARRATIVE",
    color: "#FFD700",
    nodes: [
      { id: "state-tv", label: "State TV / TAP", F: 0.61, N: 0.38, P: 0.22 },
      {
        id: "social-media",
        label: "Social Media (TikTok/FB)",
        F: 0.12,
        N: 0.67,
        P: 0.71,
      },
      {
        id: "eu-metrics",
        label: "European Democracy Metrics",
        F: 0.08,
        N: 0.74,
        P: 0.33,
      },
    ],
  },
  Son: {
    label: "PRODUCTION",
    color: "#00FF88",
    nodes: [
      {
        id: "textiles",
        label: "Textiles / Manufacturing",
        F: 0.44,
        N: 0.51,
        P: 0.63,
      },
      { id: "tourism", label: "Tourism / Services", F: 0.52, N: 0.48, P: 0.41 },
      {
        id: "remittances",
        label: "Remittances / Diaspora",
        F: 0.22,
        N: 0.38,
        P: 0.77,
      },
    ],
  },
};

// Compute aggregate GSI per pole
function computePoleAggregate(pole: Pole): {
  F: number;
  N: number;
  P: number;
  gsi: number;
} {
  const nodes = TUNISIA_NODES.filter((n) => n.pole === pole);
  const totalWeight = nodes.reduce((s, n) => s + n.weight, 0);
  const F = nodes.reduce((s, n) => s + n.F * n.weight, 0) / totalWeight;
  const N = nodes.reduce((s, n) => s + n.N * n.weight, 0) / totalWeight;
  const P = nodes.reduce((s, n) => s + n.P * n.weight, 0) / totalWeight;
  return { F, N, P, gsi: computeGSI(F, N, P) };
}

// ─── CASCADE SIMULATION ───────────────────────────────────────────────────────

interface CascadeEvent {
  type: string;
  nodeId: string;
  magnitude: number;
  description: string;
}

const PRESET_SCENARIOS: CascadeEvent[] = [
  {
    type: "IMF Collapse",
    nodeId: "phosphate",
    magnitude: -0.35,
    description: "IMF Stand-By suspension → dinar freefall → 96h to critical",
  },
  {
    type: "UGTT General Strike",
    nodeId: "ugtt",
    magnitude: -0.28,
    description:
      "UGTT mobilization → Narrative captures system → Force overreaction",
  },
  {
    type: "Gafsa CPG Disruption",
    nodeId: "phosphate",
    magnitude: -0.22,
    description: "Production halt → Revenue collapse → Governance stress",
  },
  {
    type: "Social Media Cascade",
    nodeId: "social-media",
    magnitude: -0.31,
    description:
      "Viral narrative → P→N coupling activated → Street mobilization",
  },
];

interface SimResult {
  apex_gsi: number;
  fracture_probability: number;
  cascade_path: string[];
  time_to_critical_hours: number;
  weakest_pole: Pole;
  sigma: number;
  lateral_alert: boolean;
  delta_F: number;
  delta_N: number;
  delta_P: number;
}

function runCascadeSimulation(
  event: CascadeEvent,
  fatherAgg: any,
  motherAgg: any,
  sonAgg: any,
): SimResult {
  const gamma = 0.85;
  const delta = Math.abs(event.magnitude);
  let { F: dF, N: dN, P: dP } = { F: fatherAgg.F, N: motherAgg.N, P: sonAgg.P };

  // Apply perturbation to target pole
  const targetPole =
    TUNISIA_NODES.find((n) => n.id === event.nodeId)?.pole || "Son";
  let dF2 = dF,
    dN2 = dN,
    dP2 = dP;

  if (targetPole === "Father") dF2 = Math.max(0, dF + event.magnitude * 0.6);
  if (targetPole === "Mother") dN2 = Math.max(0, dN + event.magnitude * 0.6);
  if (targetPole === "Son") dP2 = Math.max(0, dP + event.magnitude * 0.6);

  // Lateral propagation (depth 1)
  const lateralF = dP2 * LAMBDA[2][0] * (1 - dF2) * 0.4 * delta;
  const lateralN = dP2 * LAMBDA[2][1] * (1 - dN2) * 0.4 * delta;
  const lateralFfromN = dN2 * LAMBDA[1][0] * (1 - dF2) * 0.3 * delta;

  dF2 = Math.max(0, dF2 - lateralF - lateralFfromN);
  dN2 = Math.max(0, dN2 - lateralN);

  const apex_gsi = computeGSI(dF2, dN2, dP2);
  const sigma = computeSigma(dF2, dN2, dP2);

  const poleValues = { Father: dF2, Mother: dN2, Son: dP2 };
  const weakest_pole = Object.entries(poleValues).sort(
    (a, b) => a[1] - b[1],
  )[0][0] as Pole;

  const cascade_path = [
    `${event.type} → ${targetPole} pole destabilized`,
    LAMBDA[2][1] > 0.7 ? "P→N lateral (0.81): Narrative amplification" : "",
    LAMBDA[1][0] > 0.5 ? "N→F lateral (0.55): Force mobilization" : "",
    apex_gsi < 0.5 ? "UGTT counter-narrative surge" : "",
    apex_gsi < 0.35 ? "SYSTEMIC FRACTURE — apex GSI below 0.35" : "",
  ].filter(Boolean);

  const time_to_critical_hours =
    apex_gsi < 0.35 ? 24 : apex_gsi < 0.5 ? 72 : apex_gsi < 0.65 ? 168 : 999;

  return {
    apex_gsi,
    fracture_probability: 1 - apex_gsi,
    cascade_path,
    time_to_critical_hours,
    weakest_pole,
    sigma,
    lateral_alert: sigma > 0.5,
    delta_F: dF2 - dF,
    delta_N: dN2 - dN,
    delta_P: dP2 - dP,
  };
}

// ─── ANIMATED TRIANGLE SVG ───────────────────────────────────────────────────

const TRGM_STYLE = `
@keyframes apex-pulse {
  0%,100% { transform: scale(1); opacity: 0.9; }
  50%      { transform: scale(1.03); opacity: 1; }
}
@keyframes arc-flow {
  to { stroke-dashoffset: -100; }
}
@keyframes lightning {
  0%,100% { opacity: 1; }
  50%      { opacity: 0.2; }
}
@keyframes force-strobe {
  0%,100% { fill-opacity: 0.15; }
  50%      { fill-opacity: 0.4; filter: drop-shadow(0 0 25px #FF0044); }
}
@keyframes narrative-jitter {
  0%,100% { transform: translate(0,0); }
  25%      { transform: translate(-1.5px,1px); }
  75%      { transform: translate(1.5px,-1px); }
}
@keyframes fracture-shake {
  0%,100% { transform: translate(0,0) rotate(0deg); }
  25%      { transform: translate(-3px,2px) rotate(-0.4deg); }
  75%      { transform: translate(3px,-2px) rotate(0.4deg); }
}
@keyframes sensor-blink {
  0%,100% { opacity:0.3; r:3; }
  50%      { opacity:1;   r:5; }
}
@keyframes particle-rise {
  0%   { transform: translateY(0) scale(1); opacity:1; }
  100% { transform: translateY(-60px) scale(0); opacity:0; }
}
@keyframes trgm-glow {
  0%,100% { filter: drop-shadow(0 0 8px currentColor); }
  50%      { filter: drop-shadow(0 0 20px currentColor); }
}
`;

// Inject styles
if (
  typeof document !== "undefined" &&
  !document.getElementById("trgm-styles")
) {
  const s = document.createElement("style");
  s.id = "trgm-styles";
  s.textContent = TRGM_STYLE;
  document.head.appendChild(s);
}

interface TriangleSVGProps {
  father: { F: number; N: number; P: number; gsi: number };
  mother: { F: number; N: number; P: number; gsi: number };
  son: { F: number; N: number; P: number; gsi: number };
  apexGSI: number;
  trgmState: TRGMState;
  simResult: SimResult | null;
  selectedPole: Pole | null;
  onSelectPole: (p: Pole | null) => void;
}

const TriangleSVG: React.FC<TriangleSVGProps> = ({
  father,
  mother,
  son,
  apexGSI,
  trgmState,
  simResult,
  selectedPole,
  onSelectPole,
}) => {
  const W = 700,
    H = 560;
  // Positions
  const OP_F = { x: 350, y: 100 }; // Father top
  const OP_N = { x: 130, y: 420 }; // Mother bottom-left
  const OP_P = { x: 570, y: 420 }; // Son bottom-right
  const APEX = { x: 350, y: 285 }; // Equilibrium center

  const fatherGsi = gsiLabel(father.gsi);
  const motherGsi = gsiLabel(mother.gsi);
  const sonGsi = gsiLabel(son.gsi);
  const apexInfo = gsiLabel(apexGSI);
  const isCascade = trgmState === "CASCADE" || trgmState === "FRACTURE";
  const isFracture = trgmState === "FRACTURE";

  // Apex triangle points (equilateral, centered at APEX)
  const AS = 190;
  const apexPts = `${APEX.x},${APEX.y - AS * 0.58} ${APEX.x - AS * 0.5},${APEX.y + AS * 0.29} ${APEX.x + AS * 0.5},${APEX.y + AS * 0.29}`;

  // Operational triangle points
  function triPts(cx: number, cy: number, s: number) {
    return `${cx},${cy - s * 0.58} ${cx - s * 0.5},${cy + s * 0.29} ${cx + s * 0.5},${cy + s * 0.29}`;
  }

  // Tactical mini-triangles (3 per operational)
  function tactiPts(cx: number, cy: number, i: number) {
    const ts = 30,
      offsets = [
        [-36, 46],
        [0, 46],
        [36, 46],
      ];
    const [ox, oy] = offsets[i];
    return triPts(cx + ox, cy + oy, ts);
  }

  // Bar chart for triad values inside triangle
  function triadBars(
    cx: number,
    cy: number,
    F: number,
    N: number,
    P: number,
    gsiC: string,
  ) {
    const bars = [
      { label: "F", val: F, color: "#FF0044" },
      { label: "N", val: N, color: "#FFD700" },
      { label: "P", val: P, color: "#00FF88" },
    ];
    const bw = 12,
      gap = 5,
      totalW = bars.length * bw + (bars.length - 1) * gap;
    const startX = cx - totalW / 2;
    return bars.map((b, i) => {
      const bx = startX + i * (bw + gap);
      const maxH = 28;
      const bh = Math.max(2, b.val * maxH);
      return (
        <g key={b.label}>
          <rect
            x={bx}
            y={cy + 2 - bh}
            width={bw}
            height={bh}
            fill={b.color}
            fillOpacity={0.7}
            rx={2}
          />
          <text
            x={bx + bw / 2}
            y={cy + 14}
            fill={b.color}
            fontSize={7}
            fontFamily="monospace"
            textAnchor="middle"
            fontWeight="bold"
          >
            {b.label}
          </text>
        </g>
      );
    });
  }

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      style={{ display: "block" }}
      className={isFracture ? "fracture-shake" : ""}
    >
      <defs>
        <filter id="glow-cyan" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="glow-purple" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="8" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="glow-red" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient id="arc-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#00D2FF" stopOpacity="0" />
          <stop
            offset="50%"
            stopColor={isCascade ? "#AA00FF" : "#00D2FF"}
            stopOpacity="1"
          />
          <stop offset="100%" stopColor="#00D2FF" stopOpacity="0" />
        </linearGradient>
        <pattern
          id="grid-pat"
          width="40"
          height="40"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M 40 0 L 0 0 0 40"
            fill="none"
            stroke="#00D2FF"
            strokeWidth="0.3"
          />
        </pattern>
      </defs>

      {/* Background grid */}
      <rect width="100%" height="100%" fill="url(#grid-pat)" opacity="0.08" />

      {/* ── LATERAL COUPLING ARCS ── */}
      <g className={isCascade ? "cascade-active" : ""}>
        {/* F ↔ N */}
        <path
          d={`M ${OP_F.x} ${OP_F.y} Q ${(OP_F.x + OP_N.x) / 2 - 40} ${(OP_F.y + OP_N.y) / 2} ${OP_N.x} ${OP_N.y}`}
          fill="none"
          stroke={isCascade ? "#AA00FF" : "url(#arc-grad)"}
          strokeWidth={isCascade ? 2.5 : 1.5}
          strokeDasharray="12 8"
          style={{
            animation: `arc-flow ${isCascade ? "0.8s" : "2s"} linear infinite`,
          }}
          opacity={0.8}
          filter={isCascade ? "url(#glow-purple)" : undefined}
        />
        {/* N ↔ P */}
        <path
          d={`M ${OP_N.x} ${OP_N.y} Q ${(OP_N.x + OP_P.x) / 2} ${(OP_N.y + OP_P.y) / 2 + 40} ${OP_P.x} ${OP_P.y}`}
          fill="none"
          stroke={isCascade ? "#AA00FF" : "url(#arc-grad)"}
          strokeWidth={isCascade ? 3 : 1.5}
          strokeDasharray="12 8"
          style={{
            animation: `arc-flow ${isCascade ? "0.6s" : "1.8s"} linear infinite`,
          }}
          opacity={0.8}
          filter={isCascade ? "url(#glow-purple)" : undefined}
        />
        {/* F ↔ P */}
        <path
          d={`M ${OP_F.x} ${OP_F.y} Q ${(OP_F.x + OP_P.x) / 2 + 40} ${(OP_F.y + OP_P.y) / 2} ${OP_P.x} ${OP_P.y}`}
          fill="none"
          stroke={isCascade ? "#AA00FF" : "url(#arc-grad)"}
          strokeWidth={isCascade ? 2 : 1.2}
          strokeDasharray="12 8"
          style={{
            animation: `arc-flow ${isCascade ? "1s" : "2.5s"} linear infinite`,
          }}
          opacity={0.7}
          filter={isCascade ? "url(#glow-purple)" : undefined}
        />
        {/* Apex to each operational */}
        {[OP_F, OP_N, OP_P].map((op, i) => (
          <line
            key={i}
            x1={APEX.x}
            y1={APEX.y}
            x2={op.x}
            y2={op.y}
            stroke="rgba(0,210,255,0.2)"
            strokeWidth={1}
            strokeDasharray="6 6"
          />
        ))}
      </g>

      {/* Coupling labels */}
      <text
        x={(OP_F.x + OP_N.x) / 2 - 40}
        y={(OP_F.y + OP_N.y) / 2 + 5}
        fill={isCascade ? "#AA00FF" : "#FFD700"}
        fontSize={9}
        fontFamily="monospace"
        textAnchor="middle"
      >
        Λ=0.72
      </text>
      <text
        x={(OP_N.x + OP_P.x) / 2}
        y={(OP_N.y + OP_P.y) / 2 + 50}
        fill={isCascade ? "#AA00FF" : "#00FF88"}
        fontSize={9}
        fontFamily="monospace"
        textAnchor="middle"
      >
        Λ=0.81★
      </text>
      <text
        x={(OP_F.x + OP_P.x) / 2 + 40}
        y={(OP_F.y + OP_P.y) / 2 + 5}
        fill="rgba(255,255,255,0.3)"
        fontSize={9}
        fontFamily="monospace"
        textAnchor="middle"
      >
        Λ=0.68
      </text>

      {/* ── TACTICAL TRIANGLES ── */}
      {[
        { center: OP_F, color: fatherGsi.color },
        { center: OP_N, color: motherGsi.color },
        { center: OP_P, color: sonGsi.color },
      ].map(({ center, color }, bi) => (
        <g key={bi} opacity={0.6}>
          {[0, 1, 2].map((ti) => (
            <polygon
              key={ti}
              points={tactiPts(center.x, center.y, ti)}
              fill="none"
              stroke={color}
              strokeWidth={0.8}
              opacity={0.6}
            />
          ))}
        </g>
      ))}

      {/* ── DATA SENSORS (Layer 3 substrate) ── */}
      <g>
        {[
          { x: 140, y: 510, color: "#00D2FF", dur: "2.1s", label: "FX Rate" },
          { x: 215, y: 525, color: "#00FF88", dur: "3.2s", label: "UGTT NLP" },
          { x: 290, y: 515, color: "#FFD700", dur: "1.8s", label: "GDELT" },
          { x: 350, y: 530, color: "#00D2FF", dur: "2.5s", label: "Wheat" },
          { x: 410, y: 518, color: "#FF0044", dur: "1.5s", label: "Sentiment" },
          { x: 480, y: 525, color: "#00FF88", dur: "2.8s", label: "Migration" },
          {
            x: 555,
            y: 510,
            color: "#FFD700",
            dur: "2.0s",
            label: "Groundwater",
          },
        ].map((s, i) => (
          <g key={i}>
            <circle cx={s.x} cy={s.y} r={4} fill={s.color} opacity={0.5}>
              <animate
                attributeName="opacity"
                values="0.2;0.9;0.2"
                dur={s.dur}
                repeatCount="indefinite"
              />
              <animate
                attributeName="r"
                values="3;5;3"
                dur={s.dur}
                repeatCount="indefinite"
              />
            </circle>
            <text
              x={s.x}
              y={s.y + 14}
              fill={s.color}
              fontSize={6.5}
              fontFamily="monospace"
              textAnchor="middle"
              opacity={0.5}
            >
              {s.label}
            </text>
          </g>
        ))}
        <text
          x={350}
          y={548}
          fill="#00D2FF"
          fontSize={8}
          fontFamily="monospace"
          textAnchor="middle"
          opacity={0.3}
        >
          DATA CLUSTERS — SENSOR SUBSTRATE (LAYER 3)
        </text>
      </g>

      {/* ── OPERATIONAL TRIANGLES (F, N, P) ── */}
      {(
        [
          {
            center: OP_F,
            pole: "Father" as Pole,
            data: father,
            gsiInfo: fatherGsi,
            label: "FORCE",
            animCls: isFracture ? "force-strobe" : "",
          },
          {
            center: OP_N,
            pole: "Mother" as Pole,
            data: mother,
            gsiInfo: motherGsi,
            label: "NARRATIVE",
            animCls: isFracture ? "narrative-jitter" : "",
          },
          {
            center: OP_P,
            pole: "Son" as Pole,
            data: son,
            gsiInfo: sonGsi,
            label: "PRODUCTION",
            animCls: "",
          },
        ] as const
      ).map(({ center, pole, data, gsiInfo, label, animCls }) => {
        const isSelected = selectedPole === pole;
        const s = 140;
        return (
          <g
            key={pole}
            onClick={() => onSelectPole(selectedPole === pole ? null : pole)}
            style={{ cursor: "pointer" }}
            className={animCls}
          >
            {/* Glow fill */}
            <polygon
              points={triPts(center.x, center.y, s + 8)}
              fill={gsiInfo.color}
              fillOpacity={isSelected ? 0.22 : 0.08}
            />
            {/* Border */}
            <polygon
              points={triPts(center.x, center.y, s)}
              fill="none"
              stroke={gsiInfo.color}
              strokeWidth={isSelected ? 2.5 : 1.8}
              filter={`url(#glow-${gsiInfo.color === "#00D2FF" ? "cyan" : gsiInfo.color === "#FF0044" ? "red" : "cyan"})`}
              style={{ animation: `trgm-glow 3s ease-in-out infinite` }}
            />
            {/* Label */}
            <text
              x={center.x}
              y={center.y - s * 0.72}
              fill={gsiInfo.color}
              fontSize={10}
              fontFamily="monospace"
              fontWeight="bold"
              textAnchor="middle"
              letterSpacing="1"
            >
              {label}
            </text>
            {/* GSI score */}
            <text
              x={center.x}
              y={center.y - 14}
              fill={gsiInfo.color}
              fontSize={15}
              fontFamily="monospace"
              fontWeight="bold"
              textAnchor="middle"
            >
              {data.gsi.toFixed(3)}
            </text>
            {/* Triad bars */}
            {triadBars(
              center.x,
              center.y + 4,
              data.F,
              data.N,
              data.P,
              gsiInfo.color,
            )}
            {/* Status */}
            <text
              x={center.x}
              y={center.y + s * 0.55}
              fill={gsiInfo.color}
              fontSize={7.5}
              fontFamily="monospace"
              textAnchor="middle"
              opacity={0.8}
            >
              {gsiInfo.label}
            </text>
          </g>
        );
      })}

      {/* ── APEX TRIANGLE ── */}
      <g style={{ animation: "apex-pulse 4s ease-in-out infinite" }}>
        {/* Outer glow */}
        <polygon
          points={apexPts}
          fill={apexInfo.color}
          fillOpacity={0.08}
          filter="url(#glow-cyan)"
        />
        <polygon
          points={apexPts}
          fill="none"
          stroke={apexInfo.color}
          strokeWidth={2.5}
          filter="url(#glow-cyan)"
        />
        {/* Label */}
        <text
          x={APEX.x}
          y={APEX.y - AS * 0.38}
          fill={apexInfo.color}
          fontSize={9}
          fontFamily="monospace"
          textAnchor="middle"
          letterSpacing="0.5"
          opacity={0.9}
        >
          STRATEGIC HIGH ECHELON
        </text>
        {/* GSI */}
        <text
          x={APEX.x}
          y={APEX.y + 4}
          fill={apexInfo.color}
          fontSize={22}
          fontFamily="monospace"
          fontWeight="bold"
          textAnchor="middle"
          style={{
            animation:
              apexGSI < 0.35 ? "count-alarm 0.5s steps(1) infinite" : undefined,
          }}
          filter={apexGSI < 0.5 ? "url(#glow-red)" : "url(#glow-cyan)"}
        >
          {apexGSI.toFixed(3)}
        </text>
        <text
          x={APEX.x}
          y={APEX.y + 22}
          fill={apexInfo.color}
          fontSize={8.5}
          fontFamily="monospace"
          textAnchor="middle"
          opacity={0.85}
        >
          {apexInfo.label}
        </text>
        {/* Core pulse */}
        <circle
          cx={APEX.x}
          cy={APEX.y - (AS * 0.58) / 2}
          r={5}
          fill={apexInfo.color}
          opacity={0.9}
          filter="url(#glow-cyan)"
        >
          <animate
            attributeName="r"
            values="5;8;5"
            dur="4s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="0.7;1;0.7"
            dur="4s"
            repeatCount="indefinite"
          />
        </circle>
      </g>

      {/* Lateral cascade alert badge */}
      {simResult?.lateral_alert && (
        <g>
          <rect
            x={W - 180}
            y={10}
            width={168}
            height={36}
            rx={6}
            fill="#AA00FF"
            fillOpacity={0.2}
            stroke="#AA00FF"
            strokeWidth={1}
          />
          <text
            x={W - 96}
            y={26}
            fill="#AA00FF"
            fontSize={9}
            fontFamily="monospace"
            fontWeight="bold"
            textAnchor="middle"
          >
            ⚡ LATERAL CASCADE ALERT
          </text>
          <text
            x={W - 96}
            y={40}
            fill="#AA00FF"
            fontSize={8}
            fontFamily="monospace"
            textAnchor="middle"
          >
            Σ={simResult.sigma.toFixed(3)} &gt; 0.50 threshold
          </text>
        </g>
      )}

      {/* HUD box */}
      <g>
        <rect
          x={10}
          y={10}
          width={175}
          height={110}
          rx={5}
          fill="rgba(0,15,30,0.85)"
          stroke="#00D2FF"
          strokeWidth={0.8}
        />
        <text
          x={20}
          y={28}
          fill="#00D2FF"
          fontSize={9}
          fontFamily="monospace"
          fontWeight="bold"
        >
          TRGM-TN v1.0
        </text>
        <text
          x={20}
          y={44}
          fill={apexInfo.color}
          fontSize={9}
          fontFamily="monospace"
        >
          GSI Apex: {apexGSI.toFixed(3)}
        </text>
        <text x={20} y={58} fill="#FFD700" fontSize={9} fontFamily="monospace">
          Imbalance: {(1 - apexGSI).toFixed(3)}
        </text>
        <text x={20} y={72} fill="#FF0044" fontSize={9} fontFamily="monospace">
          Weakest: {simResult?.weakest_pole || "—"} pole
        </text>
        <text x={20} y={86} fill="#AA00FF" fontSize={9} fontFamily="monospace">
          Σ Coupling: {computeSigma(father.F, mother.N, son.P).toFixed(3)}
        </text>
        <text
          x={20}
          y={110}
          fill={apexInfo.color}
          fontSize={9}
          fontFamily="monospace"
          fontWeight="bold"
        >
          STATUS: {apexInfo.label}
        </text>
      </g>
    </svg>
  );
};

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────

export const TRGMDashboard: React.FC = () => {
  const { data, rriState } = usePipeline();
  const { addNotification } = useNotifications();
  const [selectedPole, setSelectedPole] = useState<Pole | null>(null);
  const [selectedScenario, setSelectedScenario] = useState<CascadeEvent | null>(
    null,
  );
  const [simResult, setSimResult] = useState<SimResult | null>(null);
  const [trgmState, setTrgmState] = useState<TRGMState>("STRESS");
  const [simRunning, setSimRunning] = useState(false);
  const [showEquations, setShowEquations] = useState(false);
  const [showNodes, setShowNodes] = useState(false);

  // Track previous state for notifications
  const prevStateRef = useRef<TRGMState>("STRESS");

  // Compute pole aggregates — live from pipeline if available
  const fatherAgg = useMemo(() => computePoleAggregate("Father"), []);
  const motherAgg = useMemo(() => computePoleAggregate("Mother"), []);
  const sonAgg = useMemo(() => computePoleAggregate("Son"), []);

  const apexGSI = useMemo(() => {
    // Recursive aggregation: α=0.6 direct, β=0.4 children average
    const alpha = 0.6,
      beta = 0.4;
    const childMean = {
      F: (fatherAgg.F + motherAgg.F + sonAgg.F) / 3,
      N: (fatherAgg.N + motherAgg.N + sonAgg.N) / 3,
      P: (fatherAgg.P + motherAgg.P + sonAgg.P) / 3,
    };
    const rri = (data as any)?.rri?.rri ?? 1.47;
    const directF = Math.max(0, 0.65 - (rri - 1.0) * 0.1);
    const directN = Math.max(0, 0.58 - (rri - 1.0) * 0.08);
    const directP = Math.max(0, 0.46 - (rri - 1.0) * 0.12);
    const F = alpha * directF + beta * childMean.F;
    const N = alpha * directN + beta * childMean.N;
    const P = alpha * directP + beta * childMean.P;
    return computeGSI(F, N, P);
  }, [data, fatherAgg, motherAgg, sonAgg]);

  // Set TRGM state from GSI
  useEffect(() => {
    let newState: TRGMState = "EQUILIBRIUM";
    if (apexGSI < 0.35) newState = "FRACTURE";
    else if (simResult?.lateral_alert) newState = "CASCADE";
    else if (apexGSI < 0.6) newState = "STRESS";
    else newState = "EQUILIBRIUM";

    if (newState !== trgmState) {
      setTrgmState(newState);

      // Trigger notification for critical state entering
      if (newState === "FRACTURE" && prevStateRef.current !== "FRACTURE") {
        addNotification({
          type: "SYSTEM",
          priority: "CRITICAL",
          title: "SYSTEMIC FRACTURE DETECTED",
          message: `TRGM GSI dropped below 0.35. Recursive coherence lost.`,
        });
      } else if (newState === "CASCADE" && prevStateRef.current !== "CASCADE") {
        addNotification({
          type: "SYSTEM",
          priority: "HIGH",
          title: "PROPAGATIVE CASCADE ACTIVE",
          message: "Lateral coupling Λ thresholds breached. State instability spreading.",
        });
      }
      prevStateRef.current = newState;
    }
  }, [apexGSI, simResult, trgmState, addNotification]);

  const runSim = useCallback(() => {
    if (!selectedScenario) return;
    setSimRunning(true);
    setTimeout(() => {
      const result = runCascadeSimulation(
        selectedScenario,
        fatherAgg,
        motherAgg,
        sonAgg,
      );
      setSimResult(result);
      setSimRunning(false);
      if (result.apex_gsi < 0.35) setTrgmState("FRACTURE");
      else if (result.lateral_alert) setTrgmState("CASCADE");
    }, 800);
  }, [selectedScenario, fatherAgg, motherAgg, sonAgg]);

  const resetSim = useCallback(() => {
    setSimResult(null);
    setSelectedScenario(null);
    setTrgmState(
      apexGSI < 0.35 ? "FRACTURE" : apexGSI < 0.6 ? "STRESS" : "EQUILIBRIUM",
    );
  }, [apexGSI]);

  const apexInfo = gsiLabel(apexGSI);

  const stateColors: Record<TRGMState, string> = {
    EQUILIBRIUM: "#00D2FF",
    STRESS: "#00FF88",
    CASCADE: "#AA00FF",
    FRACTURE: "#FF0044",
  };
  const stateColor = stateColors[trgmState];

  // Selected pole data
  const poleDetails = selectedPole
    ? {
        Father: {
          agg: fatherAgg,
          branch: LAYER1_BRANCHES.Father,
          nodes: TUNISIA_NODES.filter((n) => n.pole === "Father"),
        },
        Mother: {
          agg: motherAgg,
          branch: LAYER1_BRANCHES.Mother,
          nodes: TUNISIA_NODES.filter((n) => n.pole === "Mother"),
        },
        Son: {
          agg: sonAgg,
          branch: LAYER1_BRANCHES.Son,
          nodes: TUNISIA_NODES.filter((n) => n.pole === "Son"),
        },
      }[selectedPole]
    : null;

  return (
    <div className="p-3 md:p-4 space-y-5 relative pb-10">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-[9px] font-mono text-slate-600 uppercase tracking-widest">
          <div
            className="w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ backgroundColor: stateColor }}
          />
          TRGM-TN-NODE-01 // STATUS: ACTIVE
        </div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
              <Triangle className="w-6 h-6" style={{ color: stateColor }} />
              Triarchical Governance Matrix
            </h1>
            <p className="text-[10px] text-white/30 font-mono uppercase tracking-widest mt-1">
              Force · Narrative · Production — Recursive stability model ·
              Tunisia calibration v1.0
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span
              className="text-[9px] font-mono px-3 py-1.5 rounded-xl border font-bold uppercase"
              style={{
                color: stateColor,
                borderColor: `${stateColor}40`,
                backgroundColor: `${stateColor}12`,
              }}
            >
              {trgmState}
            </span>
          </div>
        </div>
      </div>

      {/* Apex GSI strip */}
      <div
        className="glass rounded-xl border overflow-hidden"
        style={{ borderColor: `${apexInfo.color}30` }}
      >
        <div className="grid grid-cols-2 md:grid-cols-5 divide-x divide-white/5">
          {[
            {
              label: "Apex GSI",
              value: apexGSI.toFixed(3),
              color: apexInfo.color,
            },
            {
              label: "Father (Force)",
              value: fatherAgg.gsi.toFixed(3),
              color: gsiLabel(fatherAgg.gsi).color,
            },
            {
              label: "Mother (Narrative)",
              value: motherAgg.gsi.toFixed(3),
              color: gsiLabel(motherAgg.gsi).color,
            },
            {
              label: "Son (Production)",
              value: sonAgg.gsi.toFixed(3),
              color: gsiLabel(sonAgg.gsi).color,
            },
            {
              label: "Σ Coupling",
              value: computeSigma(fatherAgg.F, motherAgg.N, sonAgg.P).toFixed(
                3,
              ),
              color:
                computeSigma(fatherAgg.F, motherAgg.N, sonAgg.P) > 0.5
                  ? "#AA00FF"
                  : "#64748b",
            },
          ].map((k, i) => (
            <div key={i} className="px-4 py-3 space-y-1">
              <div className="text-[8px] font-mono text-slate-600 uppercase tracking-widest">
                {k.label}
              </div>
              <div
                className="text-lg font-bold font-mono"
                style={{ color: k.color }}
              >
                {k.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main SVG canvas */}
      <div
        className="glass rounded-2xl border overflow-hidden bg-[#03080f]"
        style={{ borderColor: `${stateColor}25` }}
      >
        <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between text-[9px] font-mono">
          <span className="text-slate-600 uppercase tracking-widest">
            Recursive Triangle — Click operational node to drill down
          </span>
          <span style={{ color: stateColor }} className="font-bold uppercase">
            {apexInfo.label}
          </span>
        </div>
        <TriangleSVG
          father={fatherAgg}
          mother={motherAgg}
          son={sonAgg}
          apexGSI={apexGSI}
          trgmState={trgmState}
          simResult={simResult}
          selectedPole={selectedPole}
          onSelectPole={setSelectedPole}
        />
      </div>

      {/* Drill-down panel */}
      <AnimatePresence>
        {selectedPole && poleDetails && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="glass rounded-2xl border overflow-hidden"
            style={{ borderColor: `${poleDetails.branch.color}30` }}
          >
            <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-sm"
                  style={{ backgroundColor: poleDetails.branch.color }}
                />
                <span
                  className="text-sm font-bold font-mono uppercase"
                  style={{ color: poleDetails.branch.color }}
                >
                  {selectedPole} Pole — {poleDetails.branch.label}
                </span>
                <span className="text-[9px] font-mono text-slate-600">
                  GSI: {poleDetails.agg.gsi.toFixed(3)}
                </span>
              </div>
              <button
                onClick={() => setSelectedPole(null)}
                className="text-slate-600 hover:text-white text-[9px] font-mono"
              >
                × CLOSE
              </button>
            </div>
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Layer 0 nodes */}
              <div className="space-y-3">
                <div className="text-[9px] font-mono text-slate-600 uppercase tracking-widest">
                  Layer 0 — Strategic Nodes
                </div>
                {poleDetails.nodes.map((node, i) => {
                  const ng = gsiLabel(computeGSI(node.F, node.N, node.P));
                  return (
                    <div
                      key={i}
                      className="p-3 rounded-xl border space-y-2"
                      style={{ borderColor: `${ng.color}20` }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-white">
                          {node.label}
                        </span>
                        <span
                          className="text-[9px] font-mono font-bold"
                          style={{ color: ng.color }}
                        >
                          GSI {computeGSI(node.F, node.N, node.P).toFixed(3)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[9px] font-mono">
                        <span className="text-red-400">F={node.F}</span>
                        <span className="text-yellow-400">N={node.N}</span>
                        <span className="text-emerald-400">P={node.P}</span>
                        <span
                          className="text-[8px] ml-auto"
                          style={{ color: ng.color }}
                        >
                          {ng.label}
                        </span>
                      </div>
                      <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${computeGSI(node.F, node.N, node.P) * 100}%`,
                            backgroundColor: ng.color,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* Layer 1 operational nodes */}
              <div className="space-y-3">
                <div className="text-[9px] font-mono text-slate-600 uppercase tracking-widest">
                  Layer 1 — Operational Branch
                </div>
                {poleDetails.branch.nodes.map((node, i) => {
                  const ng = gsiLabel(computeGSI(node.F, node.N, node.P));
                  return (
                    <div
                      key={i}
                      className="p-3 rounded-xl border space-y-2"
                      style={{ borderColor: `${ng.color}20` }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-white">
                          {node.label}
                        </span>
                        <span
                          className="text-[9px] font-mono font-bold"
                          style={{ color: ng.color }}
                        >
                          GSI {computeGSI(node.F, node.N, node.P).toFixed(3)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[9px] font-mono">
                        <span className="text-red-400">F={node.F}</span>
                        <span className="text-yellow-400">N={node.N}</span>
                        <span className="text-emerald-400">P={node.P}</span>
                        <span
                          className="text-[8px] ml-auto"
                          style={{ color: ng.color }}
                        >
                          {ng.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cascade Simulation Panel */}
      <div className="glass rounded-2xl border border-intel-border overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-bold text-white uppercase tracking-widest">
              Cascade Simulation Engine
            </span>
          </div>
          {simResult && (
            <button
              onClick={resetSim}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 text-[9px] font-mono text-slate-400 hover:text-white"
            >
              <RotateCcw className="w-3 h-3" /> Reset
            </button>
          )}
        </div>
        <div className="p-5 space-y-4">
          {/* Scenario selector */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {PRESET_SCENARIOS.map((s, i) => (
              <button
                key={i}
                onClick={() => setSelectedScenario(s)}
                className={cn(
                  "text-left p-3 rounded-xl border text-[10px] font-mono transition-all space-y-1",
                  selectedScenario?.type === s.type
                    ? "border-purple-500/50 bg-purple-500/10 text-white"
                    : "border-intel-border text-slate-500 hover:border-white/20 hover:text-white",
                )}
              >
                <div className="font-bold">{s.type}</div>
                <div className="text-[9px] opacity-70">{s.description}</div>
                <div className="text-red-400">Magnitude: {s.magnitude}</div>
              </button>
            ))}
          </div>

          <button
            onClick={runSim}
            disabled={!selectedScenario || simRunning}
            className={cn(
              "w-full py-3 rounded-xl border font-mono text-[11px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all",
              selectedScenario && !simRunning
                ? "border-purple-500/50 bg-purple-500/20 text-purple-400 hover:bg-purple-500/30"
                : "border-white/5 bg-white/5 text-slate-600 cursor-not-allowed",
            )}
          >
            {simRunning ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> Simulating
                cascade...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" /> Run Cascade Simulation
              </>
            )}
          </button>

          {/* Simulation results */}
          <AnimatePresence>
            {simResult && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                {/* Result KPIs */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    {
                      label: "Post-Cascade GSI",
                      value: simResult.apex_gsi.toFixed(3),
                      color: gsiLabel(simResult.apex_gsi).color,
                      warn: simResult.apex_gsi < 0.5,
                    },
                    {
                      label: "Fracture Probability",
                      value: `${(simResult.fracture_probability * 100).toFixed(1)}%`,
                      color:
                        simResult.fracture_probability > 0.6
                          ? "#FF0044"
                          : "#f97316",
                      warn: simResult.fracture_probability > 0.5,
                    },
                    {
                      label: "Time to Critical",
                      value:
                        simResult.time_to_critical_hours < 999
                          ? `${simResult.time_to_critical_hours}h`
                          : "Safe",
                      color:
                        simResult.time_to_critical_hours < 48
                          ? "#FF0044"
                          : "#f59e0b",
                      warn: simResult.time_to_critical_hours < 48,
                    },
                    {
                      label: "Weakest Pole",
                      value: simResult.weakest_pole,
                      color:
                        simResult.weakest_pole === "Father"
                          ? "#FF0044"
                          : simResult.weakest_pole === "Mother"
                            ? "#FFD700"
                            : "#00FF88",
                      warn: false,
                    },
                  ].map((k, i) => (
                    <div
                      key={i}
                      className={cn(
                        "rounded-xl border p-3 space-y-1",
                        k.warn
                          ? "border-red-500/30 bg-red-500/5"
                          : "border-intel-border",
                      )}
                    >
                      <div className="text-[8px] font-mono text-slate-600 uppercase">
                        {k.label}
                      </div>
                      <div
                        className="text-lg font-bold font-mono"
                        style={{ color: k.color }}
                      >
                        {k.value}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Cascade path */}
                <div className="glass rounded-xl border border-purple-500/20 p-4 space-y-3">
                  <div className="text-[9px] font-mono text-purple-400 uppercase tracking-widest font-bold">
                    Cascade Propagation Path
                  </div>
                  <div className="space-y-2">
                    {simResult.cascade_path.map((step, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-3 text-[10px] font-mono"
                      >
                        <span className="text-purple-400 shrink-0">
                          Step {i + 1}
                        </span>
                        <ChevronRight className="w-3 h-3 text-slate-600 shrink-0 mt-0.5" />
                        <span
                          className={
                            i === simResult.cascade_path.length - 1 &&
                            simResult.fracture_probability > 0.6
                              ? "text-red-400 font-bold"
                              : "text-slate-400"
                          }
                        >
                          {step}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pole delta */}
                <div className="glass rounded-xl border border-intel-border p-4 space-y-3">
                  <div className="text-[9px] font-mono text-slate-600 uppercase tracking-widest">
                    Pole Triad Δ (post-cascade)
                  </div>
                  <div className="flex items-center gap-6 text-[10px] font-mono">
                    <span className="text-red-400">
                      ΔF: {simResult.delta_F > 0 ? "+" : ""}
                      {simResult.delta_F.toFixed(3)}
                    </span>
                    <span className="text-yellow-400">
                      ΔN: {simResult.delta_N > 0 ? "+" : ""}
                      {simResult.delta_N.toFixed(3)}
                    </span>
                    <span className="text-emerald-400">
                      ΔP: {simResult.delta_P > 0 ? "+" : ""}
                      {simResult.delta_P.toFixed(3)}
                    </span>
                  </div>
                </div>

                {simResult.lateral_alert && (
                  <div className="flex items-center gap-3 p-4 rounded-xl border border-purple-500/30 bg-purple-500/10">
                    <Zap
                      className="w-5 h-5 text-purple-400 shrink-0"
                      style={{ animation: "lightning 0.3s steps(2) infinite" }}
                    />
                    <p className="text-[10px] font-mono text-purple-400 leading-relaxed">
                      <span className="font-bold">LATERAL CASCADE ALERT</span> —
                      Σ={simResult.sigma.toFixed(3)} exceeds 0.50 threshold.
                      Cross-pole coupling activated. P→N (0.81) is the primary
                      propagation vector — production failure amplifies via
                      narrative channels before security forces can respond.
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Equations accordion */}
      <div className="glass rounded-2xl border border-intel-border overflow-hidden">
        <button
          onClick={() => setShowEquations(!showEquations)}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/[0.02] transition-colors"
        >
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <Info className="w-4 h-4 text-intel-cyan" />
            Mathematical Core — TRGM Equations
          </div>
          {showEquations ? (
            <ChevronUp className="w-4 h-4 text-slate-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-500" />
          )}
        </button>
        <AnimatePresence>
          {showEquations && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="p-5 border-t border-white/5 space-y-4 text-[10px] font-mono">
                {[
                  {
                    label: "Node Triad",
                    eq: "T(n) = [F_n, N_n, P_n]  where  F_n, N_n, P_n ∈ [0,1]",
                  },
                  {
                    label: "GSI",
                    eq: "GSI(n) = 1 - √((F-N)²+(N-P)²+(P-F)²) / (√6·max(F,N,P)+ε)",
                  },
                  {
                    label: "Recursive Aggregate",
                    eq: "T(p) = 0.6·T_direct + 0.4·mean(T_children)",
                  },
                  {
                    label: "Systemic Coupling",
                    eq: "Σ = (1/6)·Σ λ_ij · I(λ_ij > 0.7)  →  Alert if Σ > 0.50",
                  },
                  {
                    label: "Propagation",
                    eq: "ΔGSI_sys = δ · γ^d · Π(1 + λ_k)  where γ=0.85",
                  },
                  {
                    label: "Fracture Probability",
                    eq: "P_fracture = 1 - GSI_apex",
                  },
                  {
                    label: "Lateral Coupling Λ (TN)",
                    eq: "F↔N=0.72  F↔P=0.68  N↔F=0.55  N↔P=0.45  P↔F=0.38  P↔N=0.81★",
                  },
                ].map((e, i) => (
                  <div
                    key={i}
                    className="flex gap-3 py-2 border-b border-white/5 last:border-0"
                  >
                    <span className="text-slate-600 w-36 shrink-0 uppercase">
                      {e.label}
                    </span>
                    <span className="text-intel-cyan">{e.eq}</span>
                  </div>
                ))}
                <div className="text-slate-600 pt-2">
                  ★ P→N coupling (0.81) is the highest lateral vector:
                  production failure amplifies via narrative faster than any
                  other path.
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Node taxonomy accordion */}
      <div className="glass rounded-2xl border border-intel-border overflow-hidden">
        <button
          onClick={() => setShowNodes(!showNodes)}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/[0.02] transition-colors"
        >
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <Triangle className="w-4 h-4 text-intel-cyan" />
            Tunisia Node Taxonomy — Layer 0 Full Table
          </div>
          {showNodes ? (
            <ChevronUp className="w-4 h-4 text-slate-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-500" />
          )}
        </button>
        <AnimatePresence>
          {showNodes && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="p-5 border-t border-white/5 overflow-x-auto">
                <table className="w-full min-w-[550px] text-[10px] font-mono">
                  <thead>
                    <tr className="border-b border-white/10">
                      {[
                        "Pole",
                        "Institution",
                        "F",
                        "N",
                        "P",
                        "GSI",
                        "Status",
                      ].map((h) => (
                        <th
                          key={h}
                          className="pb-2 text-left text-[8px] text-slate-600 uppercase tracking-widest pr-3"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {TUNISIA_NODES.map((node, i) => {
                      const gsi = computeGSI(node.F, node.N, node.P);
                      const info = gsiLabel(gsi);
                      const poleColor =
                        node.pole === "Father"
                          ? "#FF0044"
                          : node.pole === "Mother"
                            ? "#FFD700"
                            : "#00FF88";
                      return (
                        <tr key={i} className="hover:bg-white/[0.02]">
                          <td
                            className="py-2 pr-3 font-bold"
                            style={{ color: poleColor }}
                          >
                            {node.pole}
                          </td>
                          <td className="py-2 pr-3 text-white">{node.label}</td>
                          <td className="py-2 pr-3 text-red-400">{node.F}</td>
                          <td className="py-2 pr-3 text-yellow-400">
                            {node.N}
                          </td>
                          <td className="py-2 pr-3 text-emerald-400">
                            {node.P}
                          </td>
                          <td
                            className="py-2 pr-3 font-bold"
                            style={{ color: info.color }}
                          >
                            {gsi.toFixed(3)}
                          </td>
                          <td className="py-2">
                            <span
                              className="px-1.5 py-0.5 rounded border text-[8px] uppercase font-bold"
                              style={{
                                color: info.color,
                                borderColor: `${info.color}30`,
                                backgroundColor: `${info.color}10`,
                              }}
                            >
                              {info.label.split(" ")[0]}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
