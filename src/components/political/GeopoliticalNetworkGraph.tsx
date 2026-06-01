/**
 * GeopoliticalNetworkGraph.tsx
 * TunisiaIntel — Tunisia Geopolitical Actor Network
 *
 * Full D3 force-directed graph per TunIntel Network Graph Spec v1.0
 * 13 actors · 42 directed relationships · 6 game theory models
 * Tunisia fixed at center · Tier-based orbital layout
 */

import React, {
  useState, useEffect, useRef, useCallback, useMemo,
} from 'react';
import { select } from 'd3-selection';
import { zoom, zoomIdentity, type ZoomBehavior } from 'd3-zoom';
import { forceSimulation, forceLink, forceManyBody, forceRadial, forceCollide, forceX, forceY, type SimulationNodeDatum, type Simulation, type SimulationLinkDatum } from 'd3-force';
import { drag } from 'd3-drag';
import { easeExpOut, easeCircleOut } from 'd3-ease';
import { arc } from 'd3-shape';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, Filter, Zap, Info, ChevronRight, Target,
  Globe, Activity, AlertTriangle, Eye, Crosshair,
  Plus, Minus, RefreshCw, ZoomIn, ZoomOut
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useRSS } from '../../context/RSSContext';
import { useRiskMetrics } from '../../hooks/usePipelineDomains';
import { useAIAnalysis } from '../../context/AIAnalysisContext';
import { classifySignals, SignalClassification, SignalTier } from '../../services/signalClassifier';
import { assessGovernmentAgent } from '../../services/govAgent';
import { ModuleHeader } from '../shared/ProfessionalShared';
import { fetchEntities, fetchRelations } from '../../services/knowledgeGraphService';

// ─── DATA ────────────────────────────────────────────────────────────────────

const ACTOR_MAP: Record<string, string> = {
  'Tunisia': 'TUN',
  'regime': 'TUN',
  'government': 'TUN',
  'Algeria': 'DZA',
  'Italy': 'ITA',
  'France': 'FRA',
  'European Union': 'EU',
  'EU': 'EU',
  'Brussels': 'EU',
  'United States': 'USA',
  'USA': 'USA',
  'Washington': 'USA',
  'Saudi Arabia': 'KSA',
  'Saudi': 'KSA',
  'UAE': 'UAE',
  'Emirates': 'UAE',
  'Abu Dhabi': 'UAE',
  'China': 'CHN',
  'Beijing': 'CHN',
  'UK': 'GBR',
  'Britain': 'GBR',
  'London': 'GBR',
  'Turkey': 'TUR',
  'Ankara': 'TUR',
  'Qatar': 'QAT',
  'Doha': 'QAT',
  'Russia': 'RUS',
  'Moscow': 'RUS',
  'Libya': 'LBY',
  'Tripoli': 'LBY',
};

type EdgeType = 'coercive' | 'cooperative' | 'competitive' | 'dependent' | 'extractive' | 'spillover';
type Domain = 'energy' | 'migration' | 'security' | 'finance' | 'infrastructure' | 'media' | 'diplomatic' | 'ideological' | 'strategic';

interface ActorNode extends SimulationNodeDatum {
  id: string; label: string; tier: 1 | 2 | 3 | 4;
  domain: Domain[]; powerType: 'hard' | 'soft' | 'structural' | 'extractive';
  resources: { economic: number; military: number; diplomatic: number; informational: number };
  goals: string[]; constraints: string[];
  riskTolerance: 'high' | 'medium' | 'low';
  timeHorizon: 'short' | 'medium' | 'long';
  color: string; size: number;
  fixedX?: number; fixedY?: number;
}

interface RelEdge {
  source: string; target: string; type: EdgeType;
  weight: number; domain: Domain; description: string;
  conditionality: string; trend: 'rising' | 'stable' | 'declining';
  evidence: string[];
}

interface GameModel {
  id: string; name: string; players: [string, string];
  type: 'chicken' | 'prisoners_dilemma' | 'stag_hunt' | 'zero_sum' | 'coordination' | 'asymmetric';
  matrix: number[][]; // 2×2 payoff as [P1C,P1D,P2C,P2D] → [[P1CC,P1CD],[P1DC,P1DD]]
  nashIdx: [number, number]; currentIdx: [number, number];
  labels: { rows: string[]; cols: string[] };
  description: string; tunisiaImpact: string;
}

const FALLBACK_NODES: ActorNode[] = [
  { id: 'TUN', label: 'Tunisia', tier: 1, domain: ['security', 'finance', 'diplomatic'], powerType: 'structural', resources: { economic: 4, military: 4, diplomatic: 5, informational: 4 }, goals: ['Maintain sovereignty', 'Secure financing', 'Prevent social explosion'], constraints: ['Democratic backsliding', 'Foreign debt $40B+', 'Youth unemployment 35%+'], riskTolerance: 'low', timeHorizon: 'short', color: '#1F4E78', size: 60 },
  { id: 'DZA', label: 'Algeria', tier: 1, domain: ['energy', 'security'], powerType: 'structural', resources: { economic: 7, military: 8, diplomatic: 5, informational: 4 }, goals: ['Gas pipeline monopoly', 'Prevent spillover', 'Maghreb depth'], constraints: ['Tebboune succession', 'Economic diversification failure'], riskTolerance: 'medium', timeHorizon: 'long', color: '#C00000', size: 55 },
  { id: 'ITA', label: 'Italy', tier: 1, domain: ['migration', 'energy'], powerType: 'structural', resources: { economic: 8, military: 6, diplomatic: 7, informational: 6 }, goals: ['Block migration', 'Diversify gas', 'ENI partnerships'], constraints: ['Meloni coalition fragility', 'Budget deficit'], riskTolerance: 'low', timeHorizon: 'short', color: '#C00000', size: 55 },
  { id: 'FRA', label: 'France', tier: 1, domain: ['finance', 'security', 'diplomatic'], powerType: 'soft', resources: { economic: 9, military: 7, diplomatic: 8, informational: 7 }, goals: ['Preserve trade leadership', 'Security architecture', 'Francophone sphere'], constraints: ['Macron legitimacy', 'Sahel overstretch', 'Banking exposure'], riskTolerance: 'low', timeHorizon: 'medium', color: '#C00000', size: 55 },
  { id: 'EU', label: 'European Union', tier: 2, domain: ['finance', 'migration', 'diplomatic'], powerType: 'structural', resources: { economic: 10, military: 4, diplomatic: 9, informational: 6 }, goals: ['Migration externalization', 'Neighborhood stability', 'Counter China/Russia'], constraints: ['27-member paralysis', 'Rule-of-law conflicts', 'Ukraine competition'], riskTolerance: 'low', timeHorizon: 'medium', color: '#E36C0A', size: 50 },
  { id: 'USA', label: 'United States', tier: 2, domain: ['security', 'finance', 'strategic'], powerType: 'hard', resources: { economic: 9, military: 10, diplomatic: 8, informational: 8 }, goals: ['NATO southern flank', 'Counter Russia/China', 'IMF alignment'], constraints: ['Indo-Pacific pivot', 'Congressional gridlock'], riskTolerance: 'medium', timeHorizon: 'long', color: '#E36C0A', size: 50 },
  { id: 'KSA', label: 'Saudi Arabia', tier: 3, domain: ['finance', 'ideological'], powerType: 'extractive', resources: { economic: 9, military: 7, diplomatic: 6, informational: 5 }, goals: ['Contain Brotherhood', 'Prestige projection', 'Red Sea corridor'], constraints: ['Vision 2030 demands', 'Yemen fatigue'], riskTolerance: 'high', timeHorizon: 'medium', color: '#FFC000', size: 45 },
  { id: 'UAE', label: 'UAE', tier: 3, domain: ['finance', 'infrastructure', 'media'], powerType: 'extractive', resources: { economic: 9, military: 6, diplomatic: 6, informational: 7 }, goals: ['Displace French finance', 'Port/logistics control', 'Shape narrative'], constraints: ['Small population', 'Qatar/Turkey competition'], riskTolerance: 'high', timeHorizon: 'short', color: '#FFC000', size: 45 },
  { id: 'CHN', label: 'China', tier: 3, domain: ['infrastructure', 'finance', 'strategic'], powerType: 'structural', resources: { economic: 10, military: 7, diplomatic: 6, informational: 5 }, goals: ['BRI corridor', 'Mineral access', 'Huawei/ZTE deploy'], constraints: ['Property crisis', 'Debt-trap narrative', 'Limited Med projection'], riskTolerance: 'medium', timeHorizon: 'long', color: '#FFC000', size: 45 },
  { id: 'GBR', label: 'United Kingdom', tier: 3, domain: ['energy', 'security'], powerType: 'soft', resources: { economic: 7, military: 7, diplomatic: 6, informational: 6 }, goals: ['North African gas', 'Defense exports', 'Post-Brexit pivot'], constraints: ['Brexit contraction', 'Production delays'], riskTolerance: 'medium', timeHorizon: 'medium', color: '#FFC000', size: 42 },
  { id: 'TUR', label: 'Turkey', tier: 3, domain: ['security', 'infrastructure', 'ideological'], powerType: 'hard', resources: { economic: 7, military: 8, diplomatic: 6, informational: 6 }, goals: ['Support Brotherhood actors', 'Bayraktar + construction', 'Counter UAE/KSA'], constraints: ['Hyperinflation', 'NATO friction', 'Overextension'], riskTolerance: 'high', timeHorizon: 'short', color: '#FFC000', size: 42 },
  { id: 'QAT', label: 'Qatar', tier: 3, domain: ['media', 'finance', 'diplomatic'], powerType: 'soft', resources: { economic: 8, military: 4, diplomatic: 7, informational: 8 }, goals: ['Counter UAE/KSA via Al Jazeera', 'Fund civil society', 'Mediation brand'], constraints: ['US base dependency', 'Blockade trauma'], riskTolerance: 'high', timeHorizon: 'medium', color: '#FFC000', size: 40 },
  { id: 'RUS', label: 'Russia', tier: 3, domain: ['security', 'media', 'strategic'], powerType: 'hard', resources: { economic: 5, military: 9, diplomatic: 5, informational: 8 }, goals: ['Wagner Libya presence', 'Grain diplomacy', 'Anti-Western disinfo'], constraints: ['Ukraine drain', 'Sanctions', 'No bilateral leverage'], riskTolerance: 'high', timeHorizon: 'short', color: '#FFC000', size: 40 },
  { id: 'LBY', label: 'Libya', tier: 4, domain: ['security', 'migration'], powerType: 'extractive', resources: { economic: 3, military: 6, diplomatic: 2, informational: 3 }, goals: ['Territorial consolidation', 'Resource control', 'Proxy equilibrium'], constraints: ['State collapse', 'Arms embargo violations', 'Humanitarian crisis'], riskTolerance: 'high', timeHorizon: 'short', color: '#A6A6A6', size: 48 },
];

const FALLBACK_EDGES: RelEdge[] = [
  // Tunisia hub — incoming
  { source: 'DZA', target: 'TUN', type: 'coercive', weight: 9, domain: 'energy', description: 'Algeria controls Trans-Med gas pipeline — can throttle supply', conditionality: 'Border security cooperation; non-interference', trend: 'stable', evidence: ['SONATRACH pricing', 'Pipeline flow data'] },
  { source: 'ITA', target: 'TUN', type: 'coercive', weight: 8, domain: 'migration', description: 'Italy conditions aid and energy deals on migration control', conditionality: 'Coast guard interdiction rates; detention cooperation', trend: 'rising', evidence: ['Italian MOI funding', 'ENI migration clauses'] },
  { source: 'FRA', target: 'TUN', type: 'cooperative', weight: 9, domain: 'finance', description: 'France is Tunisia #1 trade partner and banking anchor', conditionality: 'Economic reform alignment; security intel sharing', trend: 'declining', evidence: ['BCT reserve data', 'French banking exposure'] },
  { source: 'EU', target: 'TUN', type: 'coercive', weight: 7, domain: 'finance', description: 'EU links macro-financial assistance to rule-of-law benchmarks', conditionality: 'GSP+ status; democratic backsliding; Frontex cooperation', trend: 'declining', evidence: ['EC disbursement schedules', 'EP resolutions'] },
  { source: 'USA', target: 'TUN', type: 'cooperative', weight: 6, domain: 'security', description: 'US provides CT training and IMF diplomatic cover', conditionality: 'Counter-terrorism cooperation; IMF program compliance', trend: 'stable', evidence: ['AFRICOM exercises', 'State Dept budget'] },
  { source: 'KSA', target: 'TUN', type: 'extractive', weight: 6, domain: 'finance', description: 'Saudi Arabia provides direct budget support and central bank deposits', conditionality: 'Anti-Brotherhood alignment; Libya policy coordination', trend: 'rising', evidence: ['SAMA deposit announcements'] },
  { source: 'UAE', target: 'TUN', type: 'extractive', weight: 7, domain: 'finance', description: 'UAE provides emergency deposits and seeks port/logistics control', conditionality: 'Constitutional recognition of Saied; media narrative control', trend: 'rising', evidence: ['ADFD deposits', 'Port modernization bids'] },
  { source: 'CHN', target: 'TUN', type: 'extractive', weight: 5, domain: 'infrastructure', description: 'China builds infrastructure while securing mining concessions', conditionality: 'Opaque debt terms; SOE labor; mineral offtake', trend: 'rising', evidence: ['CEXIM loan registry', 'GCT mining concessions'] },
  { source: 'GBR', target: 'TUN', type: 'cooperative', weight: 4, domain: 'energy', description: 'UK seeks gas exploration licenses and defense equipment sales', conditionality: 'Exploration exclusivity; energy transition partnerships', trend: 'stable', evidence: ['BEIS licenses', 'UK-Tunisia Energy Partnership'] },
  { source: 'TUR', target: 'TUN', type: 'cooperative', weight: 4, domain: 'security', description: 'Turkey offers Bayraktar drones and construction contracts', conditionality: 'Political sympathy for Brotherhood-adjacent actors', trend: 'stable', evidence: ['Bayraktar delivery', 'Turkish construction contracts'] },
  { source: 'QAT', target: 'TUN', type: 'cooperative', weight: 3, domain: 'media', description: 'Qatar funds sympathetic media and civil society via Al Jazeera', conditionality: 'Narrative alignment; political party access', trend: 'stable', evidence: ['Al Jazeera Tunisia coverage', 'Qatar Fund grants'] },
  { source: 'RUS', target: 'TUN', type: 'spillover', weight: 3, domain: 'media', description: 'Russia amplifies anti-Western disinformation via Libya proximity', conditionality: 'None direct — operates via Wagner and grain price pressure', trend: 'rising', evidence: ['RT/Sputnik Francophone output', 'Wagner Libya movements'] },
  { source: 'LBY', target: 'TUN', type: 'spillover', weight: 8, domain: 'security', description: 'Libya exports arms, drugs, militants, and refugee surges', conditionality: 'None — uncontrolled spillover', trend: 'stable', evidence: ['Border seizures', 'Militant arrest records', 'IOM data'] },
  // Inter-actor
  { source: 'DZA', target: 'ITA', type: 'cooperative', weight: 8, domain: 'energy', description: 'Algeria supplies Italy via Trans-Med; Italy is top EU gas customer', conditionality: 'Price stability; non-interference', trend: 'rising', evidence: ['ENTSOG flow data', 'SONATRACH-ENI contracts'] },
  { source: 'ITA', target: 'DZA', type: 'coercive', weight: 5, domain: 'migration', description: 'Italy pressures Algeria to control migrant flows', conditionality: 'Development aid; security equipment', trend: 'stable', evidence: ['Italian MOI Algeria agreements'] },
  { source: 'FRA', target: 'DZA', type: 'competitive', weight: 7, domain: 'diplomatic', description: 'France and Algeria compete for Maghreb influence; historical trauma', conditionality: 'Visa politics; memory commission disputes', trend: 'declining', evidence: ['Diplomatic recall incidents', 'Visa restriction wars'] },
  { source: 'EU', target: 'ITA', type: 'coercive', weight: 6, domain: 'migration', description: 'EU funds and mandates Italian migration control operations', conditionality: 'Frontex coordination; human rights compliance', trend: 'stable', evidence: ['EU Trust Fund', 'Frontex operational plans'] },
  { source: 'USA', target: 'FRA', type: 'cooperative', weight: 7, domain: 'security', description: 'US and France coordinate CT and Sahel/Maghreb security', conditionality: 'Intel sharing; AFRICOM coordination', trend: 'declining', evidence: ['AFRICOM-France joint statements'] },
  { source: 'KSA', target: 'UAE', type: 'cooperative', weight: 8, domain: 'ideological', description: 'Saudi-UAE axis coordinates anti-Islamist financing', conditionality: 'Shared intelligence; Yemen coordination', trend: 'stable', evidence: ['Joint deposit announcements'] },
  { source: 'UAE', target: 'QAT', type: 'competitive', weight: 9, domain: 'media', description: 'UAE and Qatar wage narrative war — Al Arabiya vs Al Jazeera', conditionality: 'Blockade legacy; Tunisia political proxy battles', trend: 'stable', evidence: ['Editorial line divergence', 'Competing party funding'] },
  { source: 'KSA', target: 'TUR', type: 'competitive', weight: 8, domain: 'ideological', description: 'Saudi-Turkish competition for Sunni leadership and North Africa influence', conditionality: 'Libya proxy; Muslim Brotherhood status', trend: 'stable', evidence: ['Libya proxy patterns', 'Diplomatic boycott cycles'] },
  { source: 'UAE', target: 'TUR', type: 'competitive', weight: 9, domain: 'ideological', description: 'UAE-Turkey are direct rivals in Libya, Somalia, and Tunisia', conditionality: 'Drone sales vs. port control', trend: 'rising', evidence: ['Libya military supply lines', 'Defense procurement battles'] },
  { source: 'CHN', target: 'USA', type: 'competitive', weight: 9, domain: 'strategic', description: 'China and US compete for infrastructure, tech, and influence in Tunisia', conditionality: '5G exclusion; port access; IMF conditionality', trend: 'rising', evidence: ['Huawei ban pressure', 'Infrastructure contract competition'] },
  { source: 'USA', target: 'CHN', type: 'coercive', weight: 7, domain: 'strategic', description: 'US pressures Tunisia to exclude Chinese tech and limit debt exposure', conditionality: 'Security assistance; IMF support; diplomatic cover', trend: 'rising', evidence: ['State Dept 5G statements', 'IMF transparency demands'] },
  { source: 'CHN', target: 'FRA', type: 'competitive', weight: 6, domain: 'finance', description: 'China displaces French economic dominance via infrastructure', conditionality: 'Market share; concession terms', trend: 'rising', evidence: ['French FDI decline vs Chinese FDI rise'] },
  { source: 'RUS', target: 'TUR', type: 'cooperative', weight: 5, domain: 'security', description: 'Russia and Turkey maintain fragile ceasefire in Libya', conditionality: 'Territorial partition; resource sharing', trend: 'stable', evidence: ['Moscow memorandum', 'Libya ceasefire monitoring'] },
  { source: 'TUR', target: 'RUS', type: 'competitive', weight: 6, domain: 'security', description: 'Turkey and Russia compete for Libyan government alignment', conditionality: 'Military base access; energy contracts', trend: 'stable', evidence: ['Al-Watiya base tensions', 'NOC contract awards'] },
  { source: 'RUS', target: 'FRA', type: 'competitive', weight: 8, domain: 'media', description: 'Russia actively displaces French influence via Wagner and disinfo', conditionality: 'Anti-French sentiment amplification; junta support', trend: 'rising', evidence: ['Wagner Sahel expansion', 'RT Francophone coverage'] },
  { source: 'LBY', target: 'TUR', type: 'dependent', weight: 7, domain: 'security', description: 'Libyan GNA/SNA depends on Turkish military support', conditionality: 'Maritime MoU; construction contracts; drone supply', trend: 'stable', evidence: ['Turkish troop presence', 'Bayraktar deployments'] },
  { source: 'LBY', target: 'UAE', type: 'dependent', weight: 7, domain: 'security', description: 'Libyan LNA depends on UAE financial and military support', conditionality: 'Port access; oil export; anti-Islamist alignment', trend: 'stable', evidence: ['UAE drone supplies to LNA'] },
  { source: 'LBY', target: 'RUS', type: 'dependent', weight: 6, domain: 'security', description: 'Libyan LNA/Wagner depends on Russian mercenary support', conditionality: 'Resource extraction rights; military base access', trend: 'stable', evidence: ['Wagner presence in Sirte-Jufra'] },
  { source: 'ITA', target: 'FRA', type: 'competitive', weight: 5, domain: 'migration', description: 'Italy and France compete for migration policy leadership', conditionality: 'EU burden-sharing; North African energy contracts', trend: 'stable', evidence: ['Ocean Viking diplomatic crisis'] },
  { source: 'GBR', target: 'ITA', type: 'cooperative', weight: 5, domain: 'energy', description: 'UK and Italy coordinate North African gas diversification', conditionality: 'Pipeline interconnection; LNG terminal sharing', trend: 'rising', evidence: ['EastMed pipeline discussions'] },
  { source: 'EU', target: 'USA', type: 'cooperative', weight: 9, domain: 'strategic', description: 'EU and US align on IMF programs, democracy, and China containment', conditionality: 'NATO; trade policy; tech standards', trend: 'stable', evidence: ['Joint IMF statements', 'G7 declarations'] },
];

const GAMES: GameModel[] = [
  {
    id: 'g1', name: 'Energy-Migration Squeeze', players: ['DZA', 'ITA'],
    type: 'chicken',
    matrix: [[7, 7], [4, 8], [8, 4], [2, 2]],
    nashIdx: [0, 0], currentIdx: [0, 0],
    labels: { rows: ['Algeria: Cooperate (stable gas)', 'Algeria: Defect (throttle)'], cols: ['Italy: Cooperate', 'Italy: Defect (pressure)'] },
    description: 'Chicken game — mutual defect is catastrophic (2,2). Tunisia is collateral damage either way.',
    tunisiaImpact: 'If either defects, Tunisia loses energy supply OR faces intensified migration enforcement.',
  },
  {
    id: 'g2', name: 'Gulf Recognition Moment', players: ['UAE', 'EU'],
    type: 'coordination',
    matrix: [[6, 6], [8, 2], [3, 7], [4, 4]],
    nashIdx: [0, 0], currentIdx: [1, 0],
    labels: { rows: ['Gulf: Cooperate (conditioned support)', 'Gulf: Defect (unconditional embrace)'], cols: ['EU: Cooperate (engage Saied)', 'EU: Defect (sanction/isolate)'] },
    description: 'Gulf drifting toward Defect — unconditional embrace of Saied without reform pressure.',
    tunisiaImpact: 'Gulf defects + EU cooperates → Gulf money without reform pressure. Democratic backsliding accelerates.',
  },
  {
    id: 'g3', name: 'Chinese Port Gambit', players: ['CHN', 'USA'],
    type: 'zero_sum',
    matrix: [[5, 5], [2, 7], [7, 2], [3, 3]],
    nashIdx: [2, 1], currentIdx: [0, 1],
    labels: { rows: ['China: Cooperate (transparent bid)', 'China: Defect (opaque capture)'], cols: ['USA: Cooperate (allow)', 'USA: Defect (block/pressure)'] },
    description: 'No pure NE — mixed strategy equilibrium. China currently transparent, USA preparing to block.',
    tunisiaImpact: 'Both defect → aid suspension AND investment freeze. Tunisia loses financing from both sides.',
  },
  {
    id: 'g4', name: 'IMF-Gulf Divergence', players: ['USA', 'KSA'],
    type: 'stag_hunt',
    matrix: [[8, 8], [3, 9], [9, 3], [4, 4]],
    nashIdx: [0, 0], currentIdx: [2, 0],
    labels: { rows: ['IMF: Cooperate (flexible)', 'IMF: Defect (hard conditionality)'], cols: ['Gulf: Cooperate (complement)', 'Gulf: Defect (replace IMF)'] },
    description: 'Moving toward (Defect, Defect) — IMF hardening while Gulf fills gap unilaterally.',
    tunisiaImpact: 'Stuck in (Defect, Defect) → sovereign default, currency collapse, social explosion.',
  },
  {
    id: 'g5', name: 'Libya Spillover Trap', players: ['LBY', 'TUN'],
    type: 'asymmetric',
    matrix: [[6, 5], [2, 3], [5, 4], [3, 2]],
    nashIdx: [-1, -1], currentIdx: [1, 0],
    labels: { rows: ['Tunisia: Cooperate (open border)', 'Tunisia: Defect (seal border)'], cols: ['Libya: Stabilize', 'Libya: Collapse'] },
    description: 'Not truly a game — Tunisia has no dominant strategy. Libya is not a rational unitary actor.',
    tunisiaImpact: 'Tunisia cannot win this game. Only external actors (Turkey, UAE, Russia) can change Libya\'s payoff.',
  },
  {
    id: 'g6', name: 'French Banking Retreat', players: ['FRA', 'UAE'],
    type: 'coordination',
    matrix: [[7, 7], [4, 9], [5, 6], [3, 5]],
    nashIdx: [0, 0], currentIdx: [0, 1],
    labels: { rows: ['France: Cooperate (maintain presence)', 'France: Defect (withdraw)'], cols: ['Gulf: Cooperate (co-invest)', 'Gulf: Defect (displace)'] },
    description: 'France cooperating with declining resources; Gulf defecting via deposit diplomacy.',
    tunisiaImpact: 'France defects → Tunisia loses financial anchor. Gulf defects → opaque Gulf finance dependency.',
  },
];

// ─── EDGE VISUAL CONFIG ───────────────────────────────────────────────────────

const EDGE_STYLE: Record<EdgeType, { color: string; dash: string; width: (w: number) => number; label: string }> = {
  coercive:    { color: '#ef4444', dash: '6,4',  width: w => w * 0.28, label: 'Coercive' },
  cooperative: { color: '#3b82f6', dash: 'none', width: w => w * 0.22, label: 'Cooperative' },
  competitive: { color: '#f97316', dash: '3,3',  width: w => w * 0.22, label: 'Competitive' },
  dependent:   { color: '#a855f7', dash: '8,4',  width: w => w * 0.2,  label: 'Dependent' },
  extractive:  { color: '#1a1a1a', dash: 'none', width: w => w * 0.25, label: 'Extractive' },
  spillover:   { color: '#6b7280', dash: '4,6',  width: w => w * 0.18, label: 'Spillover' },
};

const RISK_BORDER: Record<string, { width: number; color: string }> = {
  high:   { width: 3, color: '#ef4444' },
  medium: { width: 2, color: '#f59e0b' },
  low:    { width: 1, color: '#10b981' },
};

// ─── ORBITAL RADII ────────────────────────────────────────────────────────────
const ORBIT: Record<number, number> = { 1: 210, 2: 310, 3: 420, 4: 330 };

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────

export const GeopoliticalNetworkGraph: React.FC = () => {
  const svgRef    = useRef<SVGSVGElement>(null);
  const simRef    = useRef<Simulation<ActorNode, undefined> | null>(null);
  const [selectedNode, setSelectedNode] = useState<ActorNode | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<RelEdge | null>(null);
  const [selectedGame, setSelectedGame] = useState<GameModel | null>(null);
  const [filters, setFilters] = useState<{ domain: Domain | 'all'; tier: number | 'all'; type: EdgeType | 'all' }>({ domain: 'all', tier: 'all', type: 'all' });
  const [nodes, setNodes] = useState<ActorNode[]>(FALLBACK_NODES);
  const [edges, setEdges] = useState<RelEdge[]>(FALLBACK_EDGES);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetchEntities('geopolitical').catch(() => null),
      fetchRelations('geopolitical').catch(() => null),
    ]).then(([entities, relations]) => {
      if (entities && entities.length > 0) {
        setNodes(entities.map(e => ({
          id: e.id, label: e.label, tier: e.tier || 2,
          domain: (e.domain || []) as Domain[],
          color: e.color || '#6366f1', size: e.size || 25,
          resourceType: (e.power_type || 'structural') as ActorNode['resourceType'],
          resources: {
            economic: e.resources?.economic ?? 5,
            military: e.resources?.military ?? 5,
            diplomatic: e.resources?.diplomatic ?? 5,
            informational: e.resources?.informational ?? 5,
          },
          goals: e.goals || [], constraints: e.constraints || [],
          riskTolerance: e.risk_tolerance || 'medium',
          timeHorizon: e.time_horizon || 'medium',
          fixedX: e.fixed_x ?? undefined, fixedY: e.fixed_y ?? undefined,
        })));
      }
      if (relations && relations.length > 0) {
        setEdges(relations.map(r => ({
          source: r.source_id, target: r.target_id,
          type: r.type as EdgeType, weight: r.weight || 5,
          domain: (r.domain || 'strategic') as Domain,
          description: r.description || '',
          conditionality: r.conditionality || 'conditional',
          trend: (r.trend || 'stable') as 'rising' | 'stable' | 'declining',
        })));
      }
    });
  }, []);
  const panelRef = useRef<HTMLDivElement>(null);

  // Scroll to panel's active content when a game is selected
  useEffect(() => {
    if (selectedGame && panelRef.current) {
      // Find the specific container to scroll within the panel
      const target = panelRef.current.querySelector('.game-details-anchor');
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        panelRef.current.parentElement?.scrollTo({ 
          top: panelRef.current.offsetTop, 
          behavior: 'smooth' 
        });
      }
    }
  }, [selectedGame?.id]);

  // ─── SIGNAL POPS ───────────────────────────────────────────────────────────
  const { articles } = useRSS();
  const { rriState, fullData: data, seiResult } = useRiskMetrics();
  const { miiProfile, actorNetwork: aiActorNetwork } = useAIAnalysis();
  
  const [pops, setPops] = useState<{id: string, type: SignalTier, actorId: string, timestamp: number}[]>([]);
  const seenSignals = useRef<Set<string>>(new Set());

  // Gov agent assessment for signal classification
  const govAssessment = useMemo(() => {
    try {
      return assessGovernmentAgent(rriState, data, {
        miiProfile, actorNetwork: aiActorNetwork, seiResult
      });
    } catch { return null; }
  }, [rriState, data, miiProfile, aiActorNetwork, seiResult]);

  useEffect(() => {
    if (!articles.length) return;

    // Classify recent articles
    const classified = classifySignals(articles, rriState, data, govAssessment, 20);
    const newPops: typeof pops = [];
    const now = Date.now();

    classified.forEach(sig => {
      if (seenSignals.current.has(sig.id)) return;
      seenSignals.current.add(sig.id);

      // Map signal to graph nodes
      const article = articles.find(a => a.id === sig.articleId);
      if (!article) return;

      const targets = new Set<string>();
      
      // 1. Direct actor mentions in article
      article.actors?.forEach(a => {
        Object.entries(ACTOR_MAP).forEach(([key, id]) => {
          if (a.toLowerCase().includes(key.toLowerCase())) targets.add(id);
        });
      });

      // 2. Keyword mentions in title/summary
      const text = `${article.title} ${article.summary}`.toLowerCase();
      Object.entries(ACTOR_MAP).forEach(([key, id]) => {
        if (text.includes(key.toLowerCase())) targets.add(id);
      });

      // 3. Fallback for SYSTEM_SHOCK (usually Tunisia regime)
      if (sig.tier === 'SYSTEM_SHOCK' && targets.size === 0) {
        targets.add('TUN');
      }

      targets.forEach(actorId => {
        newPops.push({
          id: `${sig.id}-${actorId}`,
          type: sig.tier,
          actorId,
          timestamp: now
        });
      });
    });

    if (newPops.length > 0) {
      setPops(prev => {
        const filtered = prev.filter(p => now - p.timestamp < 10000);
        return [...filtered, ...newPops];
      });
    }
  }, [articles, rriState, data, govAssessment]);

  // Handle pop animations using D3
  useEffect(() => {
    if (!svgRef.current || pops.length === 0) return;
    const g = select(svgRef.current).select('g.signal-pops');
    if (g.empty()) return;

    const simulationNodes = simRef.current?.nodes() || [];
    const now = Date.now();
    
    // Process only recent pops (last 1000ms) to avoid duplicates if state updates
    pops.filter(p => now - p.timestamp < 1000).forEach(pop => {
      const node = simulationNodes.find(n => n.id === pop.actorId);
      if (!node) return;

      const color = pop.type === 'SYSTEM_SHOCK' ? '#ef4444' : pop.type === 'SIGNAL' ? '#fde047' : '#f8fafc';
      const duration = pop.type === 'SYSTEM_SHOCK' ? 3000 : 2000;
      
      // Secondary shock pulse for SYSTEM_SHOCK
      if (pop.type === 'SYSTEM_SHOCK') {
        const pulse = g.append('circle')
          .attr('data-actor-id', pop.actorId)
          .attr('cx', node.x!)
          .attr('cy', node.y!)
          .attr('r', node.size * 0.45)
          .attr('fill', `${color}44`)
          .attr('stroke', color)
          .attr('stroke-width', 2)
          .attr('opacity', 0.8)
          .attr('class', 'pop-pulse');

        pulse.transition()
          .duration(duration)
          .ease(easeExpOut)
          .attr('r', node.size * 3.5)
          .attr('stroke-width', 0)
          .attr('opacity', 0)
          .remove();
      }

      const ring = g.append('circle')
        .attr('data-actor-id', pop.actorId)
        .attr('cx', node.x!)
        .attr('cy', node.y!)
        .attr('r', node.size * 0.45)
        .attr('fill', 'none')
        .attr('stroke', color)
        .attr('stroke-width', 4)
        .attr('opacity', 1)
        .attr('class', 'pop-ring');

      ring.transition()
        .duration(duration * 0.8)
        .ease(easeCircleOut)
        .attr('r', node.size * 3)
        .attr('stroke-width', 0)
        .attr('opacity', 0)
        .remove();
    });
  }, [pops]);
  const zoomRef = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const gRef = useRef<SVGGElement | null>(null);
  const W = 1200, H = 850;
  const CX = W / 2, CY = H / 2;

  // Filtered edges
  const visibleEdges = useMemo(() => edges.filter(e => {
    if (filters.domain !== 'all' && e.domain !== filters.domain) return false;
    if (filters.type !== 'all' && e.type !== filters.type) return false;
    return true;
  }), [filters, edges]);

  const visibleNodeIds = useMemo(() => {
    const ids = new Set<string>(['TUN']);
    visibleEdges.forEach(e => { ids.add(e.source as string); ids.add(e.target as string); });
    return ids;
  }, [visibleEdges]);

  const visibleNodes = useMemo(() => {
    if (filters.tier === 'all') return nodes.filter(n => visibleNodeIds.has(n.id));
    return nodes.filter(n => (n.tier === filters.tier || n.id === 'TUN') && visibleNodeIds.has(n.id));
  }, [visibleNodeIds, filters.tier, nodes]);

  // Build graph
  useEffect(() => {
    if (!svgRef.current) return;
    const svg = select(svgRef.current);
    svg.selectAll('*').remove();

    const defs = svg.append('defs');

    // Arrowhead markers per edge type
    Object.entries(EDGE_STYLE).forEach(([type, style]) => {
      defs.append('marker')
        .attr('id', `arrow-${type}`)
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 20).attr('refY', 0)
        .attr('markerWidth', 6).attr('markerHeight', 6)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,-5L10,0L0,5')
        .attr('fill', style.color)
        .attr('opacity', 0.8);
    });

    // Double arrowhead for competitive
    defs.append('marker')
      .attr('id', 'arrow-competitive-back')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', -10).attr('refY', 0)
      .attr('markerWidth', 6).attr('markerHeight', 6)
      .attr('orient', 'auto-start-reverse')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#f97316')
      .attr('opacity', 0.8);

    // Node glow filters
    const glowFilter = defs.append('filter').attr('id', 'node-glow').attr('x', '-50%').attr('y', '-50%').attr('width', '200%').attr('height', '200%');
    glowFilter.append('feGaussianBlur').attr('stdDeviation', '4').attr('result', 'blur');
    const merge = glowFilter.append('feMerge');
    merge.append('feMergeNode').attr('in', 'blur');
    merge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Background
    svg.append('rect').attr('width', W).attr('height', H).attr('fill', '#03080f');

    // Create a container group for zoom/pan
    const container = svg.append('g').attr('class', 'zoom-container');
    gRef.current = container.node();

    // Zoom behavior
    const zoom = zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        container.attr('transform', event.transform);
      });
    
    zoomRef.current = zoom;
    svg.call(zoom);

    // Initial zoom - centered
    const initialScale = 0.95;
    const initialTx = W / 2 - (W / 2 * initialScale);
    const initialTy = H / 2 - (H / 2 * initialScale);
    svg.call(zoom.transform, zoomIdentity.translate(initialTx, initialTy).scale(initialScale));

    // Orbital rings (decorative) - inside container
    [1, 2, 3].forEach(tier => {
      container.append('circle')
        .attr('cx', CX).attr('cy', CY)
        .attr('r', ORBIT[tier])
        .attr('fill', 'none')
        .attr('stroke', 'rgba(0,210,255,0.06)')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '4,6');
    });

    // Clone nodes for D3 (mutable)
    const nodes: ActorNode[] = visibleNodes.map(n => ({
      ...n,
      x: n.id === 'TUN' ? CX : undefined,
      y: n.id === 'TUN' ? CY : undefined,
    }));

    // Map id→node for edge lookup
    const nodeMap = new Map(nodes.map(n => [n.id, n]));

    // Links
    type SimLink = SimulationLinkDatum<ActorNode> & RelEdge;
    const links: SimLink[] = visibleEdges
      .filter(e => nodeMap.has(e.source as string) && nodeMap.has(e.target as string))
      .map(e => ({ ...e }));

    // Force simulation
    const sim = forceSimulation<ActorNode>(nodes)
      .force('link', forceLink<ActorNode, SimLink>(links)
        .id(d => d.id)
        .distance(d => {
          const t = d.target as ActorNode;
          return ORBIT[t.tier] * 0.5;
        })
        .strength(0.4)
      )
      .force('charge', forceManyBody().strength(-400)) // Stronger repulsion for bigger screen
      .force('radial', forceRadial<ActorNode>(
        d => d.id === 'TUN' ? 0 : ORBIT[d.tier],
        CX, CY
      ).strength(d => d.id === 'TUN' ? 1 : 0.7))
      .force('collision', forceCollide<ActorNode>(d => d.size + 15)) // More spacing
      .force('x', forceX<ActorNode>(CX).strength(d => d.id === 'TUN' ? 1 : 0.05))
      .force('y', forceY<ActorNode>(CY).strength(d => d.id === 'TUN' ? 1 : 0.05));

    simRef.current = sim;

    // Edge group - inside container
    const edgeG = container.append('g').attr('class', 'edges');
    
    // Signal Pop group (behind nodes, in front of edges)
    container.append('g').attr('class', 'signal-pops');

    const edgePaths = edgeG.selectAll<SVGPathElement, SimLink>('path')
      .data(links)
      .join('path')
      .attr('fill', 'none')
      .attr('stroke', d => EDGE_STYLE[d.type].color)
      .attr('stroke-width', d => EDGE_STYLE[d.type].width(d.weight))
      .attr('stroke-dasharray', d => EDGE_STYLE[d.type].dash)
      .attr('opacity', d => hoveredNode ? (d.source === hoveredNode || d.target === hoveredNode ? 1 : 0.15) : 0.6)
      .attr('marker-end', d => `url(#arrow-${d.type})`)
      .attr('marker-start', d => d.type === 'competitive' ? 'url(#arrow-competitive-back)' : null)
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
        event.stopPropagation();
        setSelectedEdge(d as RelEdge);
        setSelectedNode(null);
        setSelectedGame(null);
      });

    // Animate spillover edges
    edgePaths.filter(d => d.type === 'spillover')
      .attr('stroke-dasharray', '8,6')
      .style('animation', 'arc-flow 2s linear infinite');

    // Game highlight arcs
    if (selectedGame) {
      const gamePair = new Set(selectedGame.players);
      edgePaths.attr('opacity', d => {
        const s = (d.source as ActorNode).id || d.source;
        const t = (d.target as ActorNode).id || d.target;
        return (gamePair.has(s) && gamePair.has(t)) ? 1 : 0.1;
      });
    }

    // Node group - inside container
    const nodeG = container.append('g').attr('class', 'nodes');
    const nodeGroups = nodeG.selectAll<SVGGElement, ActorNode>('g')
      .data(nodes)
      .join('g')
      .style('cursor', 'pointer')
      .call(
        drag<SVGGElement, ActorNode>()
          .on('start', (event, d) => {
            if (!event.active) sim.alphaTarget(0.3).restart();
            d.fx = d.x; d.fy = d.y;
          })
          .on('drag', (event, d) => { d.fx = event.x; d.fy = event.y; })
          .on('end', (event, d) => {
            if (!event.active) sim.alphaTarget(0);
            if (d.id !== 'TUN') { d.fx = null; d.fy = null; }
          })
      )
      .on('click', (event, d) => {
        event.stopPropagation();
        setSelectedNode(d);
        setSelectedEdge(null);
        setSelectedGame(GAMES.find(g => g.players.includes(d.id)) || null);
      })
      .on('mouseover', (_, d) => setHoveredNode(d.id))
      .on('mouseout', () => setHoveredNode(null));

    // Node outer glow ring (informational power)
    nodeGroups.append('circle')
      .attr('r', d => d.size * 0.7 + d.resources.informational * 0.8)
      .attr('fill', 'none')
      .attr('stroke', d => d.color)
      .attr('stroke-width', 1)
      .attr('opacity', 0.2);

    // Node inner ring (diplomatic power)
    nodeGroups.append('circle')
      .attr('r', d => d.size * 0.52 + d.resources.diplomatic * 0.5)
      .attr('fill', 'none')
      .attr('stroke', d => d.color)
      .attr('stroke-width', 1)
      .attr('opacity', 0.35);

    // Node body
    nodeGroups.append('circle')
      .attr('r', d => d.size * 0.45)
      .attr('fill', d => `${d.color}22`)
      .attr('stroke', d => d.color)
      .attr('stroke-width', d => RISK_BORDER[d.riskTolerance].width)
      .attr('filter', 'url(#node-glow)');

    // Resource bars (economic/military) as arc segment
    nodeGroups.each(function (d) {
      const g = select(this);
      const r = d.size * 0.45;
      const econPct = d.resources.economic / 10;
      const milPct = d.resources.military / 10;

      // Econ arc (bottom)
      const econArc = arc()({ innerRadius: r + 3, outerRadius: r + 7, startAngle: Math.PI * 0.1, endAngle: Math.PI * 0.1 + Math.PI * econPct * 1.8 });
      g.append('path').attr('d', econArc!).attr('fill', '#f59e0b').attr('opacity', 0.7);

      // Mil arc (top)
      const milArc = arc()({ innerRadius: r + 3, outerRadius: r + 7, startAngle: -Math.PI * 0.1, endAngle: -Math.PI * 0.1 - Math.PI * milPct * 1.8 });
      g.append('path').attr('d', milArc!).attr('fill', '#ef4444').attr('opacity', 0.7);
    });

    // Tunisia stress gauge
    const tunNode = nodes.find(n => n.id === 'TUN');
    if (tunNode) {
      const incomingWeight = edges.filter(e => e.target === 'TUN').reduce((s, e) => s + e.weight, 0);
      const stressMax = 90;
      const stress = Math.min(1, incomingWeight / stressMax);
      const stressGroup = container.append('g').attr('class', 'tun-stress');
      const stressArc = arc()({
        innerRadius: (tunNode.size * 0.45) + 12,
        outerRadius: (tunNode.size * 0.45) + 18,
        startAngle: -Math.PI,
        endAngle: -Math.PI + stress * Math.PI * 2,
      });
      stressGroup.append('path')
        .attr('d', stressArc!)
        .attr('transform', `translate(${CX},${CY})`)
        .attr('fill', stress > 0.7 ? '#ef4444' : stress > 0.5 ? '#f97316' : '#f59e0b')
        .attr('opacity', 0.9);
      stressGroup.append('text')
        .attr('x', CX).attr('y', CY + (tunNode.size * 0.45) + 28)
        .attr('text-anchor', 'middle')
        .attr('fill', '#ef4444')
        .attr('font-size', 8)
        .attr('font-family', 'monospace')
        .text(`STRESS ${(stress * 100).toFixed(0)}%`);
    }

    // Label
    nodeGroups.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', d => d.size * 0.45 + 28)
      .attr('fill', d => d.color)
      .attr('font-size', d => d.id === 'TUN' ? 12 : 9)
      .attr('font-family', 'monospace')
      .attr('font-weight', d => d.id === 'TUN' ? 'bold' : 'normal')
      .text(d => d.label);

    // Tier badge
    nodeGroups.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', 4)
      .attr('fill', d => d.color)
      .attr('font-size', d => d.id === 'TUN' ? 11 : 8)
      .attr('font-family', 'monospace')
      .attr('font-weight', 'bold')
      .text(d => d.id);

    // Click background to deselect
    svg.on('click', () => { setSelectedNode(null); setSelectedEdge(null); });

    // Tick
    sim.on('tick', () => {
      // Fix TUN at center
      const tun = nodes.find(n => n.id === 'TUN');
      if (tun) { tun.x = CX; tun.y = CY; }

      // Curved edge paths
      edgePaths.attr('d', (d) => {
        const s = d.source as ActorNode;
        const t = d.target as ActorNode;
        if (!s.x || !t.x) return '';
        const dx = t.x - s.x, dy = t.y - s.y;
        const len = Math.sqrt(dx * dx + dy * dy) || 1;
        const sR = (s.size * 0.45) / len;
        const tR = (t.size * 0.45) / len;
        const sx = s.x + dx * sR, sy = s.y + dy * sR;
        const tx = t.x - dx * tR * 1.5, ty = t.y - dy * tR * 1.5;
        // Slight curve for multiple edges
        const cx2 = (sx + tx) / 2 - dy * 0.15;
        const cy2 = (sy + ty) / 2 + dx * 0.15;
        return `M${sx},${sy} Q${cx2},${cy2} ${tx},${ty}`;
      });

      nodeGroups.attr('transform', d => `translate(${d.x ?? CX},${d.y ?? CY})`);

      // Sync pop positions in tick
      container.selectAll('.pop-ring, .pop-pulse')
        .each(function() {
           const pop = select(this);
           const actorId = pop.attr('data-actor-id');
           const node = nodes.find(n => n.id === actorId);
           if (node && node.x && node.y) {
             pop.attr('cx', node.x).attr('cy', node.y);
           }
        });
    });

    return () => { sim.stop(); };
  }, [visibleNodes, visibleEdges]);

  // Handle visual state updates (hover, game highlights) without rebuilding the whole graph
  useEffect(() => {
    if (!gRef.current) return;
    const container = select(gRef.current);

    // Update edge opacities based on hover/game state
    container.selectAll<SVGPathElement, any>('g.edges path')
      .interrupt()
      .transition().duration(200)
      .attr('opacity', (d) => {
        if (!d) return 0.6;
        if (selectedGame) {
          const gamePair = new Set(selectedGame.players);
          const s = (d.source as ActorNode).id || d.source;
          const t = (d.target as ActorNode).id || d.target;
          return (gamePair.has(s) && gamePair.has(t)) ? 1 : 0.05;
        }
        if (hoveredNode) {
          return (d.source.id === hoveredNode || d.target.id === hoveredNode) ? 1 : 0.1;
        }
        return 0.6;
      });

    // Highlight hovered node or game players
    container.selectAll<SVGGElement, any>('g.nodes g')
      .interrupt()
      .transition().duration(200)
      .attr('opacity', (d) => {
        if (!d) return 1;
        if (selectedGame) {
          return selectedGame.players.includes(d.id) ? 1 : 0.2;
        }
        if (hoveredNode) {
          return (d.id === hoveredNode || visibleEdges.some(e => 
            (e.source === hoveredNode && e.target === d.id) || 
            (e.target === hoveredNode && e.source === d.id)
          )) ? 1 : 0.3;
        }
        return 1;
      });
  }, [hoveredNode, selectedGame, visibleEdges]);

  const tunIncomingEdges = edges.filter(e => e.target === 'TUN');
  const dominantActor = tunIncomingEdges.sort((a, b) => b.weight - a.weight)[0];

  const DOMAINS: Domain[] = ['energy', 'migration', 'security', 'finance', 'infrastructure', 'media', 'diplomatic', 'ideological', 'strategic'];
  const EDGE_TYPES: EdgeType[] = ['coercive', 'cooperative', 'competitive', 'dependent', 'extractive', 'spillover'];

  // Main content layout: Graph Left, Game Theory Right
  return (
    <div className="flex flex-col h-full space-y-4 p-3 md:p-6 relative overflow-hidden bg-dot-white/[0.02]">

      {/* Header */}
      <ModuleHeader 
        title="Geopolitical Actor Network" 
        subtitle="13 actors · 42 directed relationships · 6 game theory models" 
        icon={Globe}
        statusLabel="UPLINK SECURE"
        nodeId="GEO-NODE-07"
      />

      {/* Secondary Actions / Status */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/5 bg-white/[0.02] text-[9px] font-mono text-slate-500 uppercase">
             <Activity className="w-3.5 h-3.5 text-intel-cyan" />
             Strategic Analysis Matrix
          </div>
        </div>
      </div>

      {/* Tunisia pressure summary strip */}
      <div className="glass rounded-xl border border-intel-border/30 overflow-hidden shrink-0 bg-white/[0.01]">
        <div className="flex items-center gap-0 divide-x divide-white/5 overflow-x-auto no-scrollbar">
          <div className="px-4 py-2.5 shrink-0">
            <div className="text-[8px] font-mono text-slate-600 uppercase">Tunisia Pressure</div>
            <div className="text-sm font-mono font-bold text-intel-red">SINK NODE — {tunIncomingEdges.length} incoming</div>
          </div>
          <div className="px-4 py-2.5 shrink-0">
            <div className="text-[8px] font-mono text-slate-600 uppercase">Dominant Actor</div>
            <div className="text-sm font-mono font-bold text-amber-400">{dominantActor?.source} (w={dominantActor?.weight})</div>
          </div>
          <div className="px-4 py-2.5 shrink-0">
            <div className="text-[8px] font-mono text-slate-600 uppercase">Outgoing Coercive</div>
            <div className="text-sm font-mono font-bold text-emerald-400">0 — Tunisia cannot coerce</div>
          </div>
          <div className="px-4 py-2.5 shrink-0">
            <div className="text-[8px] font-mono text-slate-600 uppercase">Highest Threat</div>
            <div className="text-sm font-mono font-bold text-intel-red">LBY spillover w=8 + ITA coercive w=8</div>
          </div>
          <div className="px-4 py-2.5 shrink-0">
            <div className="text-[8px] font-mono text-slate-600 uppercase">Critical Game</div>
            <div className="text-sm font-mono font-bold text-purple-400">IMF-Gulf Stag Hunt → Defect/Defect</div>
          </div>
        </div>
      </div>

      {/* Main interaction layout */}
      <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0 overflow-hidden">
        {/* Left Column: Network Map */}
        <div className="flex-1 flex flex-col gap-4">
          {/* Filters mini-bar */}
          <div className="flex items-center gap-3 flex-wrap shrink-0">
            <div className="flex items-center gap-1.5 text-[9px] font-mono text-slate-600 uppercase">
              <Filter className="w-3 h-3" /> Filter:
            </div>
            <select
              className="bg-[#0a0c10] border border-white/10 rounded-lg px-2 py-1 text-[9px] font-mono text-on-surface"
              value={filters.domain}
              onChange={e => setFilters(f => ({ ...f, domain: e.target.value as Domain | 'all' }))}
            >
              <option value="all">All Domains</option>
              {DOMAINS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <select
              className="bg-[#0a0c10] border border-white/10 rounded-lg px-2 py-1 text-[9px] font-mono text-on-surface"
              value={filters.type}
              onChange={e => setFilters(f => ({ ...f, type: e.target.value as EdgeType | 'all' }))}
            >
              <option value="all">All Edge Types</option>
              {EDGE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <select
              className="bg-[#0a0c10] border border-white/10 rounded-lg px-2 py-1 text-[9px] font-mono text-on-surface"
              value={filters.tier}
              onChange={e => setFilters(f => ({ ...f, tier: e.target.value === 'all' ? 'all' : parseInt(e.target.value) }))}
            >
              <option value="all">All Tiers</option>
              {[1, 2, 3, 4].map(t => <option key={t} value={t}>Tier {t}</option>)}
            </select>
            {/* Legend mini */}
            <div className="flex items-center gap-3 ml-auto opacity-50">
               {['coercive', 'cooperative'].map(type => (
                 <span key={type} className="flex items-center gap-1 text-[8px] font-mono" style={{ color: EDGE_STYLE[type as EdgeType].color }}>
                   <span className="w-2 h-0.5" style={{ backgroundColor: EDGE_STYLE[type as EdgeType].color }} /> {type}
                 </span>
               ))}
            </div>
          </div>

          {/* Graph Stage */}
          <div className="glass rounded-3xl border border-intel-border/30 overflow-hidden relative flex-1 bg-black/40">
            <svg ref={svgRef} className="w-full h-full cursor-grab active:cursor-grabbing" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }} />

            {/* Floating Controls */}
            <div className="absolute left-6 bottom-6 flex flex-col gap-2">
              <button 
                onClick={() => {
                  if (svgRef.current && zoomRef.current) {
                    select(svgRef.current).transition().duration(300).call(zoomRef.current.scaleBy, 1.3);
                  }
                }}
                className="w-10 h-10 glass rounded-xl border border-white/10 flex items-center justify-center text-slate-400 hover:text-intel-cyan hover:border-intel-cyan/50 transition-all shadow-xl"
                title="Zoom In"
              >
                <ZoomIn className="w-5 h-5" />
              </button>
              <button 
                onClick={() => {
                  if (svgRef.current && zoomRef.current) {
                    select(svgRef.current).transition().duration(300).call(zoomRef.current.scaleBy, 1/1.3);
                  }
                }}
                className="w-10 h-10 glass rounded-xl border border-white/10 flex items-center justify-center text-slate-400 hover:text-intel-cyan hover:border-intel-cyan/50 transition-all shadow-xl"
                title="Zoom Out"
              >
                <ZoomOut className="w-5 h-5" />
              </button>
              <button 
                onClick={() => {
                  if (svgRef.current && zoomRef.current) {
                    const initialScale = 0.85;
                    const initialTx = (W / 2) * (1 - initialScale);
                    const initialTy = (H / 2) * (1 - initialScale);
                    select(svgRef.current).transition().duration(500).call(zoomRef.current.transform, zoomIdentity.translate(initialTx, initialTy).scale(initialScale));
                  }
                }}
                className="w-10 h-10 glass rounded-xl border border-white/10 flex items-center justify-center text-slate-400 hover:text-intel-cyan hover:border-intel-cyan/50 transition-all shadow-xl"
                title="Reset View"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {/* Interaction Overlays */}
            <AnimatePresence>
              {(selectedNode || selectedEdge) && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="absolute top-6 left-6 w-72 glass rounded-2xl border border-intel-border/50 bg-[#050a10]/95 p-5 space-y-4 text-[10px] font-mono shadow-2xl backdrop-blur-xl pointer-events-auto"
                >
                  {selectedNode ? (
                    <>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-base font-bold tracking-tight text-on-surface">{selectedNode.label}</div>
                          <div className="text-slate-600 uppercase text-[8px] font-black">Tier {selectedNode.tier} · {selectedNode.powerType} VECTOR</div>
                        </div>
                        <button onClick={() => setSelectedNode(null)} className="text-slate-600 hover:text-white transition-colors p-1"><X className="w-4 h-4" /></button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 pt-2">
                         {Object.entries(selectedNode.resources).map(([k, v]) => (
                            <div key={k} className="space-y-1">
                               <div className="text-[9px] text-slate-600 uppercase font-black">{k}</div>
                               <div className="h-1.5 bg-white/5 rounded-full overflow-hidden flex items-center">
                                  <div className="h-full bg-intel-cyan rounded-full" style={{ width: `${v * 10}%` }} />
                               </div>
                            </div>
                         ))}
                      </div>

                      <div className="space-y-3 pt-2 border-t border-white/5">
                        <div className="space-y-1">
                           <div className="text-[9px] text-slate-600 uppercase font-black">Strategic Goals</div>
                           {selectedNode.goals.map((g, i) => <div key={i} className="text-slate-400 flex gap-2"><span>→</span> {g}</div>)}
                        </div>
                        <div className="space-y-1">
                           <div className="text-[9px] text-red-500/60 uppercase font-black">Structural Constraints</div>
                           {selectedNode.constraints.map((c, i) => <div key={i} className="text-red-400/80 flex gap-2"><span>⚠</span> {c}</div>)}
                        </div>
                      </div>

                      {GAMES.filter(g => g.players.includes(selectedNode.id)).map(game => (
                        <button key={game.id} onClick={() => setSelectedGame(game)}
                          className="w-full flex items-center justify-between p-3 rounded-xl border border-purple-500/30 bg-purple-500/10 text-purple-400 text-[10px] hover:bg-purple-500/20 transition-all font-bold">
                          <span className="flex items-center gap-2"><Target className="w-3.5 h-3.5" /> {game.name}</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      ))}
                    </>
                  ) : selectedEdge ? (
                    <>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-base font-bold tracking-tight text-on-surface mb-0.5">
                            {selectedEdge.source as string} → {selectedEdge.target as string}
                          </div>
                          <div className="flex items-center gap-2">
                             <div className="w-2 h-2 rounded-full" style={{ backgroundColor: EDGE_STYLE[selectedEdge.type].color }} />
                             <span className="text-slate-500 text-[8px] uppercase font-black tracking-widest">{selectedEdge.type} VECTOR</span>
                          </div>
                        </div>
                        <button onClick={() => setSelectedEdge(null)} className="text-slate-600 hover:text-white p-1"><X className="w-4 h-4" /></button>
                      </div>
                      
                      <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 leading-relaxed text-slate-400">
                         {selectedEdge.description}
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-2">
                         <div className="space-y-1">
                            <div className="text-[9px] text-slate-600 uppercase font-black">Conditionality</div>
                            <div className="text-amber-400 font-medium leading-tight">{selectedEdge.conditionality}</div>
                         </div>
                         <div className="space-y-1">
                            <div className="text-[9px] text-slate-600 uppercase font-black">Force Multiplier</div>
                            <div className="text-on-surface font-bold">{selectedEdge.weight} / 10</div>
                         </div>
                      </div>

                      <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                         <span className="text-slate-600 uppercase text-[9px] font-black">Strategic Trend</span>
                         <div className={cn("px-2 py-0.5 rounded-full text-[8px] font-black uppercase",
                            selectedEdge.trend === 'rising' ? 'bg-red-500/20 text-red-500' : 
                            selectedEdge.trend === 'declining' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-slate-500/20 text-slate-500'
                         )}>
                            {selectedEdge.trend}
                         </div>
                      </div>
                    </>
                  ) : null}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right Column: Game Theory Panel (Permanent) */}
          <div className="w-full lg:w-[540px] flex flex-col gap-4 overflow-hidden pr-1">
          <div className="flex-1 glass rounded-3xl border border-purple-500/20 overflow-hidden bg-white/[0.01] flex flex-col">
            <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between bg-white/[0.03]">
              <div className="flex items-center gap-2.5 text-xs font-bold text-on-surface uppercase tracking-widest font-mono">
                <Zap className="w-4 h-4 text-purple-400" />
                Strategic Game Engine
              </div>
              {selectedGame && <button onClick={() => setSelectedGame(null)} className="text-slate-600 hover:text-white p-1"><X className="w-4 h-4" /></button>}
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar" ref={panelRef}>
              <div className="grid grid-cols-2 gap-2">
                {GAMES.map(g => (
                  <button key={g.id} onClick={() => setSelectedGame(selectedGame === g ? null : g)}
                    className={cn('text-left p-3.5 rounded-2xl border text-[9px] font-mono transition-all flex flex-col gap-1.5 relative overflow-hidden group',
                      selectedGame?.id === g.id
                        ? 'border-purple-500/50 bg-purple-500/20 text-on-surface shadow-lg'
                        : 'border-white/5 bg-white/[0.02] text-slate-500 hover:border-white/20 hover:bg-white/[0.04]'
                    )}>
                    <div className="font-bold text-[10px] truncate leading-tight transition-colors group-hover:text-white">{g.name}</div>
                    <div className="flex items-center justify-between mt-auto">
                       <span className="text-[9px] uppercase text-purple-400 font-black tracking-tighter">{g.type.replace('_',' ')}</span>
                       {selectedGame?.id === g.id && <div className="w-1 h-1 rounded-full bg-purple-400 animate-pulse" />}
                    </div>
                  </button>
                ))}
              </div>

              {selectedGame ? (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pt-2">
                  <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/30 shadow-inner">
                     <div className="text-[9px] text-purple-400 uppercase font-black mb-1.5 tracking-[0.2em]">Projection Summary</div>
                     <p className="text-[11px] text-slate-300 leading-relaxed font-italic">"{selectedGame.description}"</p>
                  </div>

                  {/* Matrix */}
                  <div className="space-y-3 game-details-anchor">
                    <div className="text-[8px] text-slate-600 uppercase tracking-[0.2em] px-1 font-black font-mono">Real-Time Payoff Matrix</div>
                    <div className="overflow-x-auto rounded-2xl border border-white/10 bg-black/40 backdrop-blur-md">
                      <table className="text-[9px] font-mono min-w-[300px] w-full border-collapse">
                        <thead>
                          <tr className="bg-white/5 text-[9px] text-slate-500 font-black uppercase tracking-tighter">
                            <th className="px-2 py-2 text-center">VECTOR</th>
                            {selectedGame.labels.cols.map((c, i) => (
                              <th key={i} className="px-2 py-2 text-center border-l border-white/5">{c}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {selectedGame.labels.rows.map((row, ri) => (
                            <tr key={ri} className="border-t border-white/5">
                              <td className="px-2 py-4 bg-white/[0.02] text-slate-500 text-[9px] font-black uppercase leading-tight text-center">{row}</td>
                              {selectedGame.labels.cols.map((_, ci) => {
                                const idx = ri * selectedGame.labels.cols.length + ci;
                                const vals = selectedGame.matrix[idx] || [0, 0];
                                const isCurrent = selectedGame.currentIdx[0] === ri && selectedGame.currentIdx[1] === ci;
                                const isNash = selectedGame.nashIdx[0] === ri && selectedGame.nashIdx[1] === ci;
                                return (
                                  <td key={ci} className={cn('px-2 py-4 text-center border-l border-white/5 transition-colors relative',
                                    isCurrent ? 'bg-red-500/20' : isNash ? 'bg-emerald-500/15' : ''
                                  )}>
                                    <div className={cn("font-bold text-[11px] mb-1", 
                                       isCurrent ? 'text-red-400 drop-shadow-[0_0_8px_rgba(239,68,68,0.4)]' : 
                                       isNash ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'text-slate-200'
                                    )}>
                                      ({vals[0]}, {vals[1]})
                                    </div>
                                    {isCurrent && <div className="text-[9px] text-red-500 font-black uppercase tracking-tighter">SITUATION</div>}
                                    {isNash && !isCurrent && <div className="text-[9px] text-emerald-500 font-black uppercase tracking-tighter">EQUILIBRIUM</div>}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-500/5 space-y-2 group">
                    <div className="flex items-center gap-2">
                       <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                       <div className="text-[8px] text-amber-500 uppercase font-black tracking-[0.2em]">Tunisia Sovereignty Impact</div>
                    </div>
                    <p className="text-[11px] text-amber-500/90 leading-relaxed font-medium">{selectedGame.tunisiaImpact}</p>
                  </div>
                </motion.div>
              ) : (
                <div className="py-24 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 rounded-full border border-slate-800 flex items-center justify-center mb-6 animate-pulse">
                     <Activity className="w-8 h-8 text-slate-800" />
                  </div>
                  <p className="text-[11px] text-slate-600 px-12 leading-relaxed uppercase tracking-wider font-mono">
                    Awaiting Scenario Selection for Strategic Payload Calculation
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
