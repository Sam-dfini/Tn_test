/**
 * NationalActorNetwork.tsx
 * TunisiaIntel — Tunisia National (Domestic) Actor Network
 *
 * Full D3 force-directed graph per TunIntel National Actor Network Spec v1.0
 * 16 actors · 36 directed relationships · 6 game theory models
 * PRES fixed at center · Tier-based orbital layout
 */

import React, {
  useState, useEffect, useRef, useMemo,
} from 'react';
import * as d3 from 'd3';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, Filter, Zap, Globe, AlertTriangle,
  RefreshCw, ZoomIn, ZoomOut, Target, Users,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useRSS } from '../../context/RSSContext';
import { useRiskMetrics } from '../../hooks/usePipelineDomains';
import { useAIAnalysis } from '../../context/AIAnalysisContext';
import { classifySignals, SignalTier } from '../../services/signalClassifier';
import { assessGovernmentAgent } from '../../services/govAgent';

// ─── TYPES ────────────────────────────────────────────────────────────────────

type EdgeType = 'coercive' | 'cooperative' | 'competitive' | 'dependent' | 'extractive' | 'spillover';
type Domain = 'constitutional_power' | 'social_control' | 'monetary_policy' | 'social_dialogue' |
  'political_repression' | 'ideological' | 'grassroots' | 'financing' | 'fiscal_policy' |
  'labor_organization' | 'anti_corruption' | 'narrative_warfare' | 'street_politics' |
  'foreign_reserves' | 'exchange_rate' | 'structural_reform' | 'border_economy' |
  'protest_coordination' | 'human_rights' | 'internal_security' | 'narrative' |
  'mobilization' | 'employment' | 'electoral_politics' | 'economic_policy' | 'investment';
type PowerType = 'mobilizational' | 'institutional' | 'financial' | 'narrative' | 'coercive' | 'structural';

interface NationalActorNode extends d3.SimulationNodeDatum {
  id: string;
  label: string;
  tier: 1 | 2 | 3 | 4;
  domain: string[];
  powerType: PowerType;
  resources: { popular: number; institutional: number; economic: number; informational: number };
  goals: string[];
  constraints: string[];
  riskTolerance: 'high' | 'medium' | 'low';
  timeHorizon: 'short' | 'medium' | 'long';
  color: string;
  size: number;
}

interface RelEdge {
  source: string;
  target: string;
  type: EdgeType;
  weight: number;
  domain: Domain | string;
  description: string;
  conditionality: string;
  trend: 'rising' | 'stable' | 'declining';
  evidence: string[];
}

interface GameModel {
  id: string;
  name: string;
  players: [string, string];
  type: 'chicken' | 'prisoners_dilemma' | 'stag_hunt' | 'zero_sum' | 'coordination' | 'asymmetric';
  matrix: [[number, number], [number, number]];
  nashEquilibrium: string;
  currentOutcome: string;
  description: string;
  tunisiaImpact: string;
  labels: { rows: string[]; cols: string[] };
}

// ─── NODE DATA ────────────────────────────────────────────────────────────────

const NODES: NationalActorNode[] = [
  // TIER 1
  { id: 'PRES', label: 'Presidency (Saied)', tier: 1, domain: ['sovereignty', 'constitutional_power'], powerType: 'coercive', resources: { popular: 6, institutional: 9, economic: 4, informational: 7 }, goals: ['Consolidate hyper-presidential system', 'Eliminate horizontal accountability', 'Control narrative via media pressure', 'Secure Gulf/IMF financing without reform'], constraints: ['No parliamentary majority or party apparatus', 'Dependent on UGTT acquiescence', 'Limited economic policy expertise', 'International isolation risk'], riskTolerance: 'high', timeHorizon: 'short', color: '#1F4E78', size: 60 },
  { id: 'UGTT', label: 'UGTT (Labour Union)', tier: 1, domain: ['wage_bargaining', 'social_dialogue', 'general_strikes'], powerType: 'mobilizational', resources: { popular: 9, institutional: 7, economic: 5, informational: 6 }, goals: ['Preserve public sector wage bill', 'Maintain tripartite social dialogue', 'Block IMF structural reforms', 'Position UGTT as national arbiter'], constraints: ['Internal generational divide', 'Membership decline in informal economy', 'Reputational damage from corruption', 'Cannot sustain indefinite strikes'], riskTolerance: 'medium', timeHorizon: 'medium', color: '#C00000', size: 55 },
  { id: 'ENN', label: 'Ennahda Movement', tier: 1, domain: ['grassroots_mobilization', 'religious_social_services'], powerType: 'mobilizational', resources: { popular: 6, institutional: 2, economic: 5, informational: 6 }, goals: ['Survive state-led dismantlement', 'Maintain grassroots network via mosques', 'Preserve diaspora funding channels', 'Rebrand as democratic opposition'], constraints: ['Leadership decapitation (Ghannouchi imprisoned)', 'Bank account seizures and dissolution proceedings', 'Loss of Qatari funding pipeline', 'Stigmatization as terrorist organization'], riskTolerance: 'low', timeHorizon: 'long', color: '#2E7D32', size: 50 },
  { id: 'BCT', label: 'Central Bank (BCT)', tier: 1, domain: ['monetary_policy', 'foreign_reserves', 'exchange_rate'], powerType: 'financial', resources: { popular: 2, institutional: 8, economic: 9, informational: 5 }, goals: ['Prevent sovereign default and currency collapse', 'Maintain banking sector solvency', 'Preserve institutional independence', 'Secure IMF disbursements'], constraints: ['Governor appointed by Saied (2022)', 'Foreign reserves below 3 months', 'Parallel exchange market divergence', 'Political pressure to monetize deficit'], riskTolerance: 'low', timeHorizon: 'short', color: '#D4AF37', size: 48 },
  // TIER 2
  { id: 'UTICA', label: 'UTICA (Employers)', tier: 2, domain: ['private_sector', 'investment', 'social_dialogue'], powerType: 'structural', resources: { popular: 3, institutional: 6, economic: 8, informational: 5 }, goals: ['Secure IMF-backed business reforms', 'Reduce employer social contributions', 'Maintain EU market access', 'Prevent UGTT policy capture'], constraints: ['Fragmented SME base', 'Dependent on state contracts', 'Public perception as corrupt oligarchy', 'Cannot mobilize street pressure'], riskTolerance: 'low', timeHorizon: 'medium', color: '#003366', size: 45 },
  { id: 'PDL', label: 'Free Destourian (PDL)', tier: 2, domain: ['electoral_opposition', 'anti_islamism'], powerType: 'mobilizational', resources: { popular: 5, institutional: 3, economic: 4, informational: 5 }, goals: ['Position Moussi as Saied successor', 'Criminalize Ennahda', 'Restore pre-2011 security architecture', 'Leverage anti-revolutionary sentiment'], constraints: ['Abir Moussi under house arrest', 'No dissolved parliament representation', 'Association with Ben Ali limits appeal', 'Saied views all parties as threats'], riskTolerance: 'medium', timeHorizon: 'short', color: '#1A1A1A', size: 42 },
  { id: 'JUD', label: 'Judiciary (Post-2022)', tier: 2, domain: ['legal_interpretation', 'political_trials'], powerType: 'institutional', resources: { popular: 2, institutional: 6, economic: 3, informational: 4 }, goals: ['Survive institutional purge', 'Retain pockets of independence', 'Manage international scrutiny', 'Protect judicial careers'], constraints: ['57 judges purged 2022', 'Prosecutors subordinated to executive', 'Loss of international credibility', 'Internal resistance from Judges Association'], riskTolerance: 'low', timeHorizon: 'short', color: '#6B7280', size: 40 },
  { id: 'ARM', label: 'Tunisian Armed Forces', tier: 2, domain: ['border_security', 'internal_order'], powerType: 'coercive', resources: { popular: 7, institutional: 7, economic: 4, informational: 3 }, goals: ['Preserve corporate autonomy', 'Avoid domestic policing role', 'Secure US AFRICOM partnerships', 'Maintain political neutrality'], constraints: ['Border overstretch (Libya, Algeria)', 'Equipment obsolescence', 'Presidential surveillance pressure', 'Risk of factionalization'], riskTolerance: 'low', timeHorizon: 'long', color: '#4B5320', size: 44 },
  { id: 'FTDES', label: 'FTDES (Rights Forum)', tier: 2, domain: ['austerity_opposition', 'human_rights', 'protest_coordination'], powerType: 'mobilizational', resources: { popular: 5, institutional: 3, economic: 3, informational: 6 }, goals: ['Block IMF austerity measures', 'Document socioeconomic rights violations', 'Coordinate cross-sectoral protest coalitions', 'Maintain international NGO funding'], constraints: ['Smaller base than UGTT', 'State harassment (office raids, travel bans)', 'Funding dependency on European foundations', 'Difficulty sustaining momentum'], riskTolerance: 'high', timeHorizon: 'short', color: '#E36C0A', size: 38 },
  // TIER 3
  { id: 'IWATCH', label: 'IWatch (Anti-Corruption)', tier: 3, domain: ['anti_corruption', 'transparency'], powerType: 'narrative', resources: { popular: 3, institutional: 2, economic: 3, informational: 8 }, goals: ['Expose grand corruption across all camps', 'Maintain TI/OCCRP network access', 'Preserve whistleblower capacity', 'Influence EU conditionality'], constraints: ['Leadership exile (Jarraya fallout)', 'Legal threats under cybercrime decrees', 'Loss of local media partnerships', 'Resource constraints vs. disinformation'], riskTolerance: 'high', timeHorizon: 'long', color: '#008080', size: 36 },
  { id: 'LIB_ECO', label: 'Liberal Economist Bloc', tier: 3, domain: ['fiscal_policy', 'banking_reform'], powerType: 'financial', resources: { popular: 1, institutional: 4, economic: 6, informational: 5 }, goals: ['Implement IMF structural adjustment', 'Restore central bank independence', 'Privatize loss-making SOEs', 'Reduce public sector wage bill'], constraints: ['No popular mandate', 'Politically toxic as foreign diktat', 'Excluded from Saied inner circle', 'UGTT can block any reform'], riskTolerance: 'low', timeHorizon: 'medium', color: '#87CEEB', size: 35 },
  { id: 'MEDIA', label: 'Media Conglomerates', tier: 3, domain: ['narrative_control', 'presidential_coverage'], powerType: 'narrative', resources: { popular: 4, institutional: 4, economic: 5, informational: 8 }, goals: ['Preserve licenses via regime alignment', 'Capture state advertising revenue', 'Marginalize critical voices', 'Maintain foreign correspondent access'], constraints: ['Decree-Law 54 criminalizes critical reporting', 'Advertising market collapse', 'Brain drain of investigative journalists', 'Social media erosion of broadcast monopoly'], riskTolerance: 'low', timeHorizon: 'short', color: '#800080', size: 38 },
  { id: 'YOUTH', label: 'Youth & Unemployed', tier: 3, domain: ['street_protests', 'emigration', 'digital_activism'], powerType: 'mobilizational', resources: { popular: 7, institutional: 1, economic: 1, informational: 5 }, goals: ['Secure viable employment', 'Reduce cost of living', 'Facilitate legal emigration pathways', 'Reject all existing party structures'], constraints: ['No organizational coherence', 'High emigration rate drains active elements', 'Susceptible to regime co-optation', 'Digital activism disconnected from leverage'], riskTolerance: 'high', timeHorizon: 'short', color: '#FF4444', size: 42 },
  { id: 'DIASP', label: 'Tunisian Diaspora', tier: 3, domain: ['remittances', 'foreign_currency', 'political_advocacy'], powerType: 'financial', resources: { popular: 3, institutional: 2, economic: 8, informational: 4 }, goals: ['Preserve remittance channels', 'Influence host-country policy', 'Maintain dual citizenship rights', 'Support family networks'], constraints: ['Host-country surveillance', 'Currency controls and parallel market', 'Political polarization abroad', 'Brain drain irreversibility'], riskTolerance: 'medium', timeHorizon: 'long', color: '#00CED1', size: 40 },
  // TIER 4
  { id: 'INFORMAL', label: 'Informal Economy', tier: 4, domain: ['parallel_currency', 'smuggling', 'unregulated_labor'], powerType: 'structural', resources: { popular: 5, institutional: 1, economic: 6, informational: 3 }, goals: ['Preserve arbitrage opportunities', 'Maintain cross-border smuggling routes', 'Avoid formalization and taxation', 'Exploit subsidy goods for parallel resale'], constraints: ['Periodic state crackdowns', 'Violence from organized trafficking', 'No legal protection', 'Vulnerable to currency shocks'], riskTolerance: 'high', timeHorizon: 'short', color: '#8B4513', size: 44 },
  { id: 'TRIBAL', label: 'Regional & Tribal Brokers', tier: 4, domain: ['local_governance', 'border_economy', 'protest_coordination'], powerType: 'mobilizational', resources: { popular: 4, institutional: 2, economic: 3, informational: 2 }, goals: ['Extract state resources via protest', 'Control local subcontracting', 'Maintain tribal mediation role', 'Leverage phosphate basin position'], constraints: ['Dependent on state fiscal transfers', 'Co-optation by national parties', 'Environmental degradation of livelihoods', 'Youth outmigration weakening cohesion'], riskTolerance: 'high', timeHorizon: 'short', color: '#A0522D', size: 38 },
];

// ─── EDGE DATA ────────────────────────────────────────────────────────────────

const EDGES: RelEdge[] = [
  // Presidency-centric
  { source: 'PRES', target: 'JUD', type: 'coercive', weight: 9, domain: 'constitutional_power', description: 'Saied dissolved Supreme Judicial Council and subordinated prosecutors to executive', conditionality: 'Loyalty oaths; politically motivated prosecutions; travel bans', trend: 'stable', evidence: ['Decree-Law 2022-11', '57 judge dismissals', 'Prosecutor general appointments'] },
  { source: 'PRES', target: 'ENN', type: 'coercive', weight: 9, domain: 'political_repression', description: 'Systematic dismantlement of Ennahda via arrests, asset freezes, and media demonization', conditionality: 'None — zero-sum elimination strategy', trend: 'rising', evidence: ['Ghannouchi imprisonment', 'Party office closures', 'Bank account seizures'] },
  { source: 'PRES', target: 'UGTT', type: 'competitive', weight: 7, domain: 'social_control', description: 'Saied attempts to break UGTT veto power over economic policy', conditionality: 'Wage freeze acceptance; strike ban enforcement; public sector loyalty', trend: 'rising', evidence: ['Anti-union presidential rhetoric', 'UGTT exclusion from economic councils'] },
  { source: 'PRES', target: 'BCT', type: 'coercive', weight: 7, domain: 'monetary_policy', description: 'Constitutional amendments subordinate BCT to presidential will', conditionality: 'Financing fiscal deficit; exchange rate management', trend: 'rising', evidence: ['2022 constitutional article 124', 'Governor replacement', 'Money supply expansion'] },
  { source: 'PRES', target: 'ARM', type: 'cooperative', weight: 6, domain: 'internal_security', description: 'Saied relies on military neutrality and institutional prestige for regime stability', conditionality: 'Budget increases; procurement autonomy; non-intervention in politics', trend: 'stable', evidence: ['Military budget allocations', 'AFRICOM exercise participation'] },
  { source: 'PRES', target: 'MEDIA', type: 'coercive', weight: 8, domain: 'narrative', description: 'Presidency controls broadcast licenses, state advertising, and uses Decree-Law 54 to silence critics', conditionality: 'Favorable coverage; opposition marginalization; conspiracy amplification', trend: 'rising', evidence: ['Decree-Law 54 prosecutions', 'State advertising redistribution'] },
  { source: 'PRES', target: 'PDL', type: 'competitive', weight: 5, domain: 'electoral_politics', description: 'Tactical anti-Islamist alignment undermined by Saied anti-party ideology', conditionality: 'Support for constitutional coup; abandonment of party independence', trend: 'declining', evidence: ['Abir Moussi house arrest', 'PDL office closures'] },
  { source: 'PRES', target: 'LIB_ECO', type: 'competitive', weight: 6, domain: 'economic_policy', description: "Saied's populist economic nationalism rejects technocratic IMF alignment", conditionality: 'Silence on reform; public endorsement of presidential economic vision', trend: 'stable', evidence: ['Dismissal of reformist ministers', 'Anti-IMF presidential speeches'] },
  // Labour & Business
  { source: 'UGTT', target: 'UTICA', type: 'cooperative', weight: 7, domain: 'social_dialogue', description: 'Tripartite social dialogue: UGTT and UTICA negotiate wages under state auspices', conditionality: 'Wage restraint in exchange for employment protection', trend: 'stable', evidence: ['Tripartite agreement history', 'Joint statements against subsidy cuts'] },
  { source: 'UGTT', target: 'PRES', type: 'competitive', weight: 6, domain: 'economic_policy', description: 'UGTT uses strike threat to block presidential economic decrees and IMF conditionalities', conditionality: 'Wage increases; public sector hiring; rejection of privatization', trend: 'rising', evidence: ['General strike threats 2023-2024', 'Anti-privatization mobilization'] },
  { source: 'UGTT', target: 'FTDES', type: 'cooperative', weight: 5, domain: 'protest_coordination', description: 'UGTT provides institutional cover and logistics for FTDES-led socioeconomic protests', conditionality: 'UGTT retains leadership; FTDES defers on timing', trend: 'stable', evidence: ['Joint protest communiques', 'Shared austerity platform'] },
  { source: 'UGTT', target: 'YOUTH', type: 'extractive', weight: 4, domain: 'mobilization', description: 'UGTT attempts to co-opt youth protests into structured union demands', conditionality: 'Protest discipline; no anti-UGTT slogans', trend: 'declining', evidence: ['Youth rejection of UGTT leadership', 'Independent TikTok activism'] },
  { source: 'UTICA', target: 'LIB_ECO', type: 'cooperative', weight: 7, domain: 'fiscal_policy', description: 'Business federation and technocratic economists align on IMF reform and privatization', conditionality: 'Tax amnesty; regulatory simplification; SOE asset sales', trend: 'stable', evidence: ['Joint policy papers', 'UTICA-IMF consultation participation'] },
  { source: 'UTICA', target: 'PRES', type: 'cooperative', weight: 5, domain: 'investment', description: 'UTICA leadership pragmatically supports Saied to preserve business interests', conditionality: 'Investment protection; crony contract continuity', trend: 'stable', evidence: ['UTICA presidential meeting attendance'] },
  // Political competition
  { source: 'PDL', target: 'ENN', type: 'competitive', weight: 9, domain: 'ideological', description: 'Existential zero-sum conflict: PDL seeks criminalization and elimination of Ennahda', conditionality: 'None — total elimination', trend: 'stable', evidence: ['Moussi terrorist organization rhetoric', 'Legislative proposals to ban Ennahda'] },
  { source: 'ENN', target: 'YOUTH', type: 'cooperative', weight: 5, domain: 'grassroots', description: 'Ennahda maintains student and youth networks via religious education and charitable services', conditionality: 'Ideological conformity; electoral support', trend: 'declining', evidence: ['University cell networks', 'Charitable association funding'] },
  { source: 'ENN', target: 'DIASP', type: 'cooperative', weight: 6, domain: 'financing', description: 'Ennahda relies heavily on European diaspora donations and Gulf fundraising', conditionality: 'Religious messaging; community leadership', trend: 'declining', evidence: ['European fundraising events', 'Money transfer investigations'] },
  { source: 'FTDES', target: 'PRES', type: 'competitive', weight: 6, domain: 'human_rights', description: 'FTDES leads opposition to Saied authoritarian measures and economic mismanagement', conditionality: 'Democratic restoration; austerity rejection; political prisoner release', trend: 'rising', evidence: ['Protest mobilization against Saied', 'International advocacy campaigns'] },
  // Financial & Institutional
  { source: 'BCT', target: 'LIB_ECO', type: 'cooperative', weight: 8, domain: 'monetary_policy', description: 'Central Bank technocrats and liberal economists share IMF-aligned macroeconomic framework', conditionality: 'Exchange rate flexibility; inflation targeting; banking cleanup', trend: 'stable', evidence: ['BCT working papers', 'Joint conference participation'] },
  { source: 'BCT', target: 'DIASP', type: 'dependent', weight: 9, domain: 'foreign_reserves', description: 'BCT survival depends on diaspora remittances ($3B+ annually) to maintain reserve levels', conditionality: 'Favorable exchange rates; transfer mechanisms; dual-currency accounts', trend: 'stable', evidence: ['Remittance flow data', 'BCT reserve reports'] },
  { source: 'BCT', target: 'INFORMAL', type: 'competitive', weight: 7, domain: 'exchange_rate', description: 'BCT attempts to suppress parallel currency market while informal networks arbitrage official rates', conditionality: 'None — zero-sum', trend: 'rising', evidence: ['Parallel market spread', 'Dinar black market rates'] },
  { source: 'LIB_ECO', target: 'UGTT', type: 'competitive', weight: 8, domain: 'structural_reform', description: "Liberal economists seek to break UGTT's public sector wage cartel for IMF compliance", conditionality: 'Wage bill reduction; SOE restructuring; hiring freeze', trend: 'stable', evidence: ['IMF Article IV consultations', 'Public finance reform proposals'] },
  // Civil society & narrative
  { source: 'IWATCH', target: 'ENN', type: 'competitive', weight: 6, domain: 'anti_corruption', description: 'IWatch exposed Ennahda-linked corruption (Karama Bank) during democratic transition', conditionality: 'Transparency; asset declarations; judicial cooperation', trend: 'stable', evidence: ['Karama Bank investigation', 'Party financing reports'] },
  { source: 'IWATCH', target: 'PRES', type: 'competitive', weight: 5, domain: 'anti_corruption', description: 'IWatch pivots to documenting presidential entourage corruption and nepotism', conditionality: 'Judicial independence; access to information; whistleblower protection', trend: 'rising', evidence: ['Presidential circle asset investigations', 'Exile of leadership'] },
  { source: 'MEDIA', target: 'ENN', type: 'coercive', weight: 8, domain: 'narrative_warfare', description: 'State-aligned media conducts systematic demonization campaign against Ennahda', conditionality: 'Complete marginalization; terrorist framing; exclusion from discourse', trend: 'rising', evidence: ['NTN coverage patterns', 'Talk show guest blacklists'] },
  { source: 'MEDIA', target: 'UGTT', type: 'competitive', weight: 4, domain: 'narrative', description: 'Pro-Saied media periodically attacks UGTT corruption to weaken public legitimacy', conditionality: 'Selective exposure; travel agency scandal amplification', trend: 'stable', evidence: ['UGTT corruption coverage', 'Strike delegitimization'] },
  // Social & demographic
  { source: 'YOUTH', target: 'PRES', type: 'competitive', weight: 5, domain: 'street_politics', description: 'Youth protests against economic conditions, authoritarianism, and lack of opportunity', conditionality: 'Employment; emigration facilitation; cost-of-living reduction', trend: 'rising', evidence: ['Kasserine protests', 'TikTok activism', 'Harraga statistics'] },
  { source: 'YOUTH', target: 'INFORMAL', type: 'dependent', weight: 7, domain: 'employment', description: 'Unemployed youth absorbed into informal sector, smuggling, and parallel commerce', conditionality: 'Survival income; no benefits; legal vulnerability', trend: 'rising', evidence: ['Informal employment statistics', 'Cross-border youth smuggling'] },
  { source: 'DIASP', target: 'PRES', type: 'spillover', weight: 4, domain: 'political_advocacy', description: 'Diaspora polarization creates external pressure via host-country lobbying and media', conditionality: 'None — uncoordinated external pressure', trend: 'rising', evidence: ['European parliament resolutions', 'Diaspora protest events'] },
  { source: 'INFORMAL', target: 'UGTT', type: 'competitive', weight: 5, domain: 'labor_organization', description: "Informal sector growth erodes UGTT's organized labor base and dues collection", conditionality: 'None — structural displacement', trend: 'rising', evidence: ['Union membership decline', 'Informal sector GDP share'] },
  { source: 'TRIBAL', target: 'PRES', type: 'dependent', weight: 5, domain: 'local_governance', description: 'Regional brokers demand state resources and threaten protest/disruption if ignored', conditionality: 'Development projects; local hiring; infrastructure spending', trend: 'stable', evidence: ['Phosphate basin protests', 'Road blockades'] },
  { source: 'TRIBAL', target: 'ENN', type: 'cooperative', weight: 4, domain: 'electoral_politics', description: "Southern and interior tribal networks historically aligned with Ennahda's grassroots patronage", conditionality: 'Local development funding; religious infrastructure; mediation', trend: 'declining', evidence: ['Interior governorate voting patterns', 'Mosque construction funding'] },
  { source: 'TRIBAL', target: 'INFORMAL', type: 'cooperative', weight: 6, domain: 'border_economy', description: 'Tribal networks control cross-border smuggling routes and informal trade corridors', conditionality: 'Protection; revenue sharing; local employment', trend: 'stable', evidence: ['Border smuggling seizures', 'Local market control'] },
  { source: 'ARM', target: 'PRES', type: 'cooperative', weight: 5, domain: 'internal_security', description: 'Military maintains institutional loyalty while preserving operational autonomy', conditionality: 'Budget independence; civilian non-interference; no domestic suppression', trend: 'stable', evidence: ['Constitutional neutrality doctrine', 'Post-2011 military restraint'] },
  { source: 'JUD', target: 'PRES', type: 'dependent', weight: 6, domain: 'constitutional_power', description: 'Post-purge judiciary is institutionally captive, performing loyalty-based prosecutions', conditionality: 'Career survival; appointment renewal; case assignment', trend: 'rising', evidence: ['Political trial patterns', 'Opposition prosecution rates'] },
  { source: 'UTICA', target: 'UGTT', type: 'competitive', weight: 4, domain: 'social_dialogue', description: 'UTICA and UGTT compete over economic policy direction within the tripartite framework', conditionality: 'Wage restraint vs employment protection; reform sequencing', trend: 'stable', evidence: ['Tripartite breakdown episodes', 'Competing policy briefs'] },
];

// ─── GAME THEORY ─────────────────────────────────────────────────────────────

const GAMES: GameModel[] = [
  {
    id: 'g1', name: 'The Presidential-UGTT Standoff', players: ['PRES', 'UGTT'],
    type: 'chicken',
    matrix: [[7, 7], [8, 3], [3, 8], [2, 2]],
    nashEquilibrium: '(Cooperate, Cooperate) — unstable',
    currentOutcome: 'Oscillating: Saied tests UGTT red lines → (Defect, Cooperate)',
    labels: { rows: ['PRES: Cooperate (negotiate wages)', 'PRES: Defect (crackdown/ignore)'], cols: ['UGTT: Cooperate (social peace)', 'UGTT: Defect (general strike)'] },
    description: 'Chicken game — mutual defect is catastrophic (2,2). Saied currently oscillating near Defect.',
    tunisiaImpact: 'If both defect: general strike triggers sovereign default acceleration, IMF program collapse, potential military intervention.',
  },
  {
    id: 'g2', name: 'IMF Social Dialogue Trap', players: ['UGTT', 'LIB_ECO'],
    type: 'stag_hunt',
    matrix: [[8, 8], [9, 3], [3, 9], [4, 4]],
    nashEquilibrium: '(Cooperate, Cooperate) AND (Defect, Defect) — two NE',
    currentOutcome: 'Stuck in (Defect, Defect): UGTT rejects all reform; technocrats push shock therapy',
    labels: { rows: ['UGTT: Cooperate (wage restraint)', 'UGTT: Defect (strike mobilization)'], cols: ['Reform Bloc: Cooperate (gradual reform)', 'Reform Bloc: Defect (shock therapy)'] },
    description: 'Stag hunt with two equilibria. Currently trapped in collapse basin.',
    tunisiaImpact: 'Stag hunt failure: no reform, no stability, accelerating default. Tunisia drifts toward the bad equilibrium.',
  },
  {
    id: 'g3', name: 'Ennahda Survival Game', players: ['PRES', 'ENN'],
    type: 'zero_sum',
    matrix: [[5, 3], [8, 1], [2, 6], [4, 4]],
    nashEquilibrium: 'None in pure strategies — mixed strategy equilibrium',
    currentOutcome: 'PRES: Defect (elimination); ENN: Defect (underground survival)',
    labels: { rows: ['PRES: Cooperate (negotiated exit)', 'PRES: Defect (total elimination)'], cols: ['ENN: Cooperate (surrender/dissolve)', 'ENN: Defect (underground resistance)'] },
    description: 'Asymmetric zero-sum. PRES pursuing elimination; ENN in underground resistance mode.',
    tunisiaImpact: 'Protracted conflict radicalizes Islamist fringe, increases terrorism risk, deters foreign investment.',
  },
  {
    id: 'g4', name: 'Central Bank Independence Crisis', players: ['PRES', 'BCT'],
    type: 'prisoners_dilemma',
    matrix: [[6, 6], [8, 3], [4, 8], [3, 4]],
    nashEquilibrium: '(Defect, Cooperate) — PRES dominant strategy to capture',
    currentOutcome: 'PRES defecting; BCT cooperating under duress (monetizing deficit)',
    labels: { rows: ['PRES: Cooperate (respect autonomy)', 'PRES: Defect (political capture)'], cols: ['BCT: Cooperate (finance deficit)', 'BCT: Defect (resist monetization)'] },
    description: 'Principal-agent collapse. PRES has dominant defect strategy; BCT subordinated.',
    tunisiaImpact: 'BCT subordination triggers currency collapse, inflation spiral, and banking sector panic.',
  },
  {
    id: 'g5', name: 'Informal Economy Entropy Field', players: ['PRES', 'INFORMAL'],
    type: 'asymmetric',
    matrix: [[7, 5], [6, 3], [3, 8], [2, 6]],
    nashEquilibrium: 'None — informal networks are not unitary rational actors',
    currentOutcome: 'Stochastic expansion of informal sector (40%+ of GDP)',
    labels: { rows: ['State: Cooperate (inclusive policy)', 'State: Defect (repression)'], cols: ['Informal: Stabilize (formalize)', 'Informal: Expand (capture economy)'] },
    description: 'Not truly a game — informal networks are decentralized. State repression drives expansion.',
    tunisiaImpact: 'State fiscal base erodes; social services collapse; organized crime penetrates politics.',
  },
  {
    id: 'g6', name: 'Diaspora Remittance Leverage', players: ['DIASP', 'PRES'],
    type: 'coordination',
    matrix: [[7, 7], [4, 8], [8, 4], [3, 5]],
    nashEquilibrium: '(Cooperate, Cooperate)',
    currentOutcome: 'Approaching (Defect, Defect) as diaspora loses confidence → crypto/foreign accounts',
    labels: { rows: ['DIASP: Cooperate (send remittances)', 'DIASP: Defect (divert/hoard forex)'], cols: ['PRES: Cooperate (favorable rates)', 'PRES: Defect (controls/confiscation)'] },
    description: 'Coordination game drifting toward mutual defection. Diaspora confidence erosion is the leading indicator.',
    tunisiaImpact: 'Remittance collapse triggers immediate balance-of-payments crisis and import shortages.',
  },
];

// ─── EDGE VISUAL CONFIG ───────────────────────────────────────────────────────

const EDGE_STYLE: Record<EdgeType, { color: string; dash: string; width: (w: number) => number; label: string }> = {
  coercive: { color: '#ef4444', dash: '6,4', width: w => w * 0.28, label: 'Coercive' },
  cooperative: { color: '#3b82f6', dash: 'none', width: w => w * 0.22, label: 'Cooperative' },
  competitive: { color: '#f97316', dash: '3,3', width: w => w * 0.22, label: 'Competitive' },
  dependent: { color: '#a855f7', dash: '8,4', width: w => w * 0.2, label: 'Dependent' },
  extractive: { color: '#1a1a1a', dash: 'none', width: w => w * 0.25, label: 'Extractive' },
  spillover: { color: '#6b7280', dash: '4,6', width: w => w * 0.18, label: 'Spillover' },
};

const RISK_BORDER: Record<string, { width: number }> = {
  high: { width: 3 },
  medium: { width: 2 },
  low: { width: 1 },
};

const ORBIT: Record<number, number> = { 1: 180, 2: 280, 3: 390, 4: 320 };

// ─── ACTOR MAP for signal classification ─────────────────────────────────────

const ACTOR_MAP: Record<string, string> = {
  'Saied': 'PRES', 'Presidency': 'PRES', 'presidential': 'PRES',
  'UGTT': 'UGTT', 'union': 'UGTT', 'strike': 'UGTT', 'labour': 'UGTT',
  'Ennahda': 'ENN', 'Ghannouchi': 'ENN', 'Islamist': 'ENN',
  'Central Bank': 'BCT', 'BCT': 'BCT', 'dinar': 'BCT', 'reserve': 'BCT',
  'UTICA': 'UTICA', 'employer': 'UTICA', 'business': 'UTICA',
  'PDL': 'PDL', 'Moussi': 'PDL',
  'judiciary': 'JUD', 'judge': 'JUD', 'court': 'JUD',
  'military': 'ARM', 'army': 'ARM', 'armed forces': 'ARM',
  'FTDES': 'FTDES', 'protest': 'YOUTH', 'youth': 'YOUTH',
  'diaspora': 'DIASP', 'remittance': 'DIASP',
  'informal': 'INFORMAL', 'smuggling': 'INFORMAL', 'black market': 'INFORMAL',
  'tribal': 'TRIBAL', 'Gafsa': 'TRIBAL', 'Kasserine': 'TRIBAL',
  'media': 'MEDIA', 'Decree-Law 54': 'MEDIA',
  'IWatch': 'IWATCH', 'corruption': 'IWATCH',
  'IMF': 'LIB_ECO', 'reform': 'LIB_ECO',
};

// ─── COMPONENT ────────────────────────────────────────────────────────────────

export const NationalActorNetwork: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const simRef = useRef<d3.Simulation<NationalActorNode, undefined> | null>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const gRef = useRef<SVGGElement | null>(null);

  const [selectedNode, setSelectedNode] = useState<NationalActorNode | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<RelEdge | null>(null);
  const [selectedGame, setSelectedGame] = useState<GameModel | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  const W = 1200, H = 850;
  const CX = W / 2, CY = H / 2;

  // ─── SIGNAL POPS ───────────────────────────────────────────────────────────
  const { articles } = useRSS();
  const { rriState, fullData: data, seiResult } = useRiskMetrics();
  const { miiProfile, actorNetwork: aiActorNetwork } = useAIAnalysis();

  const [pops, setPops] = useState<{ id: string; type: SignalTier; actorId: string; timestamp: number }[]>([]);
  const seenSignals = useRef<Set<string>>(new Set());

  const govAssessment = useMemo(() => {
    try { return assessGovernmentAgent(rriState, data, { miiProfile, actorNetwork: aiActorNetwork, seiResult }); }
    catch { return null; }
  }, [rriState, data, miiProfile, aiActorNetwork, seiResult]);

  useEffect(() => {
    if (!articles.length) return;
    const classified = classifySignals(articles, rriState, data, govAssessment, 20);
    const newPops: typeof pops = [];
    const now = Date.now();

    classified.forEach(sig => {
      if (seenSignals.current.has(sig.id)) return;
      seenSignals.current.add(sig.id);
      const article = articles.find(a => a.id === sig.articleId);
      if (!article) return;

      const targets = new Set<string>();
      const text = `${article.title} ${article.summary || ''}`.toLowerCase();
      Object.entries(ACTOR_MAP).forEach(([key, id]) => {
        if (text.includes(key.toLowerCase())) targets.add(id);
      });
      if (sig.tier === 'SYSTEM_SHOCK' && targets.size === 0) targets.add('PRES');

      targets.forEach(actorId => newPops.push({ id: `${sig.id}-${actorId}`, type: sig.tier, actorId, timestamp: now }));
    });

    if (newPops.length > 0) {
      setPops(prev => [...prev.filter(p => now - p.timestamp < 10000), ...newPops]);
    }
  }, [articles, rriState, data, govAssessment]);

  useEffect(() => {
    if (!svgRef.current || pops.length === 0) return;
    const g = d3.select(svgRef.current).select('g.signal-pops');
    if (g.empty()) return;
    const simulationNodes = simRef.current?.nodes() || [];
    const now = Date.now();

    pops.filter(p => now - p.timestamp < 1000).forEach(pop => {
      const node = simulationNodes.find(n => n.id === pop.actorId);
      if (!node) return;
      const color = pop.type === 'SYSTEM_SHOCK' ? '#ef4444' : pop.type === 'SIGNAL' ? '#fde047' : '#f8fafc';
      const duration = pop.type === 'SYSTEM_SHOCK' ? 3000 : 2000;

      if (pop.type === 'SYSTEM_SHOCK') {
        g.append('circle').attr('data-actor-id', pop.actorId)
          .attr('cx', node.x!).attr('cy', node.y!)
          .attr('r', node.size * 0.45).attr('fill', `${color}44`)
          .attr('stroke', color).attr('stroke-width', 2).attr('opacity', 0.8).attr('class', 'pop-pulse')
          .transition().duration(duration).ease(d3.easeExpOut)
          .attr('r', node.size * 3.5).attr('stroke-width', 0).attr('opacity', 0).remove();
      }

      g.append('circle').attr('data-actor-id', pop.actorId)
        .attr('cx', node.x!).attr('cy', node.y!)
        .attr('r', node.size * 0.45).attr('fill', 'none')
        .attr('stroke', color).attr('stroke-width', 4).attr('opacity', 1).attr('class', 'pop-ring')
        .transition().duration(duration * 0.8).ease(d3.easeCircleOut)
        .attr('r', node.size * 3).attr('stroke-width', 0).attr('opacity', 0).remove();
    });
  }, [pops]);

  // ─── FILTERED GRAPH DATA ──────────────────────────────────────────────────
  const visibleEdges = useMemo(() => EDGES.filter(e => {
    if (filters.type !== 'all' && e.type !== filters.type) return false;
    return true;
  }), [filters]);

  const visibleNodeIds = useMemo(() => {
    const ids = new Set<string>(['PRES']);
    visibleEdges.forEach(e => { ids.add(e.source as string); ids.add(e.target as string); });
    return ids;
  }, [visibleEdges]);

  const visibleNodes = useMemo(() => {
    if (filters.tier === 'all') return NODES.filter(n => visibleNodeIds.has(n.id));
    return NODES.filter(n => (n.tier === filters.tier || n.id === 'PRES') && visibleNodeIds.has(n.id));
  }, [visibleNodeIds, filters.tier]);

  // ─── D3 GRAPH BUILD ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const defs = svg.append('defs');

    Object.entries(EDGE_STYLE).forEach(([type, style]) => {
      defs.append('marker').attr('id', `arrow-nat-${type}`)
        .attr('viewBox', '0 -5 10 10').attr('refX', 20).attr('refY', 0)
        .attr('markerWidth', 6).attr('markerHeight', 6).attr('orient', 'auto')
        .append('path').attr('d', 'M0,-5L10,0L0,5').attr('fill', style.color).attr('opacity', 0.8);
    });

    defs.append('marker').attr('id', 'arrow-nat-competitive-back')
      .attr('viewBox', '0 -5 10 10').attr('refX', -10).attr('refY', 0)
      .attr('markerWidth', 6).attr('markerHeight', 6).attr('orient', 'auto-start-reverse')
      .append('path').attr('d', 'M0,-5L10,0L0,5').attr('fill', '#f97316').attr('opacity', 0.8);

    const glowFilter = defs.append('filter').attr('id', 'nat-glow').attr('x', '-50%').attr('y', '-50%').attr('width', '200%').attr('height', '200%');
    glowFilter.append('feGaussianBlur').attr('stdDeviation', '4').attr('result', 'blur');
    const merge = glowFilter.append('feMerge');
    merge.append('feMergeNode').attr('in', 'blur');
    merge.append('feMergeNode').attr('in', 'SourceGraphic');

    svg.append('rect').attr('width', W).attr('height', H).attr('fill', '#03080f');

    const container = svg.append('g').attr('class', 'zoom-container');
    gRef.current = container.node();

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', event => container.attr('transform', event.transform));
    zoomRef.current = zoom;
    svg.call(zoom);
    svg.call(zoom.transform, d3.zoomIdentity.translate(0, 0).scale(0.85));

    // Orbital rings
    [1, 2, 3].forEach(tier => {
      container.append('circle')
        .attr('cx', CX).attr('cy', CY).attr('r', ORBIT[tier])
        .attr('fill', 'none').attr('stroke', 'rgba(0,210,255,0.05)').attr('stroke-width', 1).attr('stroke-dasharray', '4,6');
    });

    const nodes: NationalActorNode[] = visibleNodes.map(n => ({
      ...n,
      x: n.id === 'PRES' ? CX : undefined,
      y: n.id === 'PRES' ? CY : undefined,
    }));
    const nodeMap = new Map(nodes.map(n => [n.id, n]));

    type SimLink = d3.SimulationLinkDatum<NationalActorNode> & RelEdge;
    const links: SimLink[] = visibleEdges
      .filter(e => nodeMap.has(e.source as string) && nodeMap.has(e.target as string))
      .map(e => ({ ...e }));

    const sim = d3.forceSimulation<NationalActorNode>(nodes)
      .force('link', d3.forceLink<NationalActorNode, SimLink>(links)
        .id(d => d.id).distance(d => ORBIT[(d.target as NationalActorNode).tier] * 0.5).strength(0.4))
      .force('charge', d3.forceManyBody().strength(-380))
      .force('radial', d3.forceRadial<NationalActorNode>(
        d => d.id === 'PRES' ? 0 : ORBIT[d.tier], CX, CY
      ).strength(d => d.id === 'PRES' ? 1 : 0.7))
      .force('collision', d3.forceCollide<NationalActorNode>(d => d.size + 15))
      .force('x', d3.forceX<NationalActorNode>(CX).strength(d => d.id === 'PRES' ? 1 : 0.05))
      .force('y', d3.forceY<NationalActorNode>(CY).strength(d => d.id === 'PRES' ? 1 : 0.05));

    simRef.current = sim;

    const edgeG = container.append('g').attr('class', 'edges');
    container.append('g').attr('class', 'signal-pops');

    const edgePaths = edgeG.selectAll<SVGPathElement, SimLink>('path')
      .data(links).join('path')
      .attr('fill', 'none')
      .attr('stroke', d => EDGE_STYLE[d.type].color)
      .attr('stroke-width', d => EDGE_STYLE[d.type].width(d.weight))
      .attr('stroke-dasharray', d => EDGE_STYLE[d.type].dash)
      .attr('opacity', 0.6)
      .attr('marker-end', d => `url(#arrow-nat-${d.type})`)
      .attr('marker-start', d => d.type === 'competitive' ? 'url(#arrow-nat-competitive-back)' : null)
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
        event.stopPropagation();
        setSelectedEdge(d as RelEdge);
        setSelectedNode(null);
        setSelectedGame(null);
      });

    if (selectedGame) {
      const gamePair = new Set(selectedGame.players);
      edgePaths.attr('opacity', d => {
        const s = (d.source as NationalActorNode).id || d.source;
        const t = (d.target as NationalActorNode).id || d.target;
        return (gamePair.has(s as string) && gamePair.has(t as string)) ? 1 : 0.1;
      });
    }

    const nodeG = container.append('g').attr('class', 'nodes');
    const nodeGroups = nodeG.selectAll<SVGGElement, NationalActorNode>('g')
      .data(nodes).join('g')
      .style('cursor', 'pointer')
      .call(
        d3.drag<SVGGElement, NationalActorNode>()
          .on('start', (event, d) => { if (!event.active) sim.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
          .on('drag', (event, d) => { d.fx = event.x; d.fy = event.y; })
          .on('end', (event, d) => { if (!event.active) sim.alphaTarget(0); if (d.id !== 'PRES') { d.fx = null; d.fy = null; } })
      )
      .on('click', (event, d) => {
        event.stopPropagation();
        setSelectedNode(d);
        setSelectedEdge(null);
        setSelectedGame(GAMES.find(g => g.players.includes(d.id)) || null);
      })
      .on('mouseover', (_, d) => setHoveredNode(d.id))
      .on('mouseout', () => setHoveredNode(null));

    // Outer glow ring (informational power)
    nodeGroups.append('circle')
      .attr('r', d => d.size * 0.7 + d.resources.informational * 0.8)
      .attr('fill', 'none').attr('stroke', d => d.color).attr('stroke-width', 1).attr('opacity', 0.2);

    // Inner ring (institutional power)
    nodeGroups.append('circle')
      .attr('r', d => d.size * 0.52 + d.resources.institutional * 0.5)
      .attr('fill', 'none').attr('stroke', d => d.color).attr('stroke-width', 1).attr('opacity', 0.35);

    // Node body
    nodeGroups.append('circle')
      .attr('r', d => d.size * 0.45)
      .attr('fill', d => `${d.color}22`)
      .attr('stroke', d => d.color)
      .attr('stroke-width', d => RISK_BORDER[d.riskTolerance].width)
      .attr('filter', 'url(#nat-glow)');

    // Resource arcs
    nodeGroups.each(function (d) {
      const g = d3.select(this);
      const r = d.size * 0.45;
      const popPct = d.resources.popular / 10;
      const econPct = d.resources.economic / 10;

      const econArc = d3.arc()({ innerRadius: r + 3, outerRadius: r + 7, startAngle: Math.PI * 0.1, endAngle: Math.PI * 0.1 + Math.PI * econPct * 1.8 });
      g.append('path').attr('d', econArc!).attr('fill', '#f59e0b').attr('opacity', 0.7);

      const popArc = d3.arc()({ innerRadius: r + 3, outerRadius: r + 7, startAngle: -Math.PI * 0.1, endAngle: -Math.PI * 0.1 - Math.PI * popPct * 1.8 });
      g.append('path').attr('d', popArc!).attr('fill', '#ef4444').attr('opacity', 0.7);
    });

    // PRES gravity well stress gauge
    const presNode = nodes.find(n => n.id === 'PRES');
    if (presNode) {
      const incomingWeight = EDGES.filter(e => e.target === 'PRES').reduce((s, e) => s + e.weight, 0);
      const outgoingCoercive = EDGES.filter(e => e.source === 'PRES' && e.type === 'coercive').reduce((s, e) => s + e.weight, 0);
      const stress = Math.min(1, outgoingCoercive / 60);
      const stressArc = d3.arc()({ innerRadius: (presNode.size * 0.45) + 12, outerRadius: (presNode.size * 0.45) + 18, startAngle: -Math.PI, endAngle: -Math.PI + stress * Math.PI * 2 });
      container.append('g').attr('class', 'pres-stress').append('path')
        .attr('d', stressArc!).attr('transform', `translate(${CX},${CY})`)
        .attr('fill', stress > 0.7 ? '#ef4444' : stress > 0.5 ? '#f97316' : '#f59e0b').attr('opacity', 0.9);
      container.select('.pres-stress').append('text')
        .attr('x', CX).attr('y', CY + (presNode.size * 0.45) + 28)
        .attr('text-anchor', 'middle').attr('fill', '#ef4444')
        .attr('font-size', 8).attr('font-family', 'monospace')
        .text(`COERCIVE ${(stress * 100).toFixed(0)}%`);
    }

    // Labels
    nodeGroups.append('text')
      .attr('text-anchor', 'middle').attr('dy', d => d.size * 0.45 + 14)
      .attr('fill', d => d.color)
      .attr('font-size', d => d.id === 'PRES' ? 11 : 9)
      .attr('font-family', 'monospace')
      .attr('font-weight', d => d.id === 'PRES' ? 'bold' : 'normal')
      .text(d => d.label.length > 16 ? d.id : d.label);

    nodeGroups.append('text')
      .attr('text-anchor', 'middle').attr('dy', 4)
      .attr('fill', d => d.color)
      .attr('font-size', d => d.id === 'PRES' ? 11 : 8)
      .attr('font-family', 'monospace').attr('font-weight', 'bold')
      .text(d => d.id);

    svg.on('click', () => { setSelectedNode(null); setSelectedEdge(null); });

    sim.on('tick', () => {
      const pres = nodes.find(n => n.id === 'PRES');
      if (pres) { pres.x = CX; pres.y = CY; }

      edgePaths.attr('d', d => {
        const s = d.source as NationalActorNode;
        const t = d.target as NationalActorNode;
        if (!s.x || !t.x) return '';
        const dx = t.x - s.x, dy = t.y - s.y;
        const len = Math.sqrt(dx * dx + dy * dy) || 1;
        const sR = (s.size * 0.45) / len, tR = (t.size * 0.45) / len;
        const sx = s.x + dx * sR, sy = s.y + dy * sR;
        const tx = t.x - dx * tR * 1.5, ty = t.y - dy * tR * 1.5;
        const cx2 = (sx + tx) / 2 - dy * 0.15, cy2 = (sy + ty) / 2 + dx * 0.15;
        return `M${sx},${sy} Q${cx2},${cy2} ${tx},${ty}`;
      });

      nodeGroups.attr('transform', d => `translate(${d.x ?? CX},${d.y ?? CY})`);

      container.selectAll('.pop-ring, .pop-pulse').each(function () {
        const pop = d3.select(this);
        const actorId = pop.attr('data-actor-id');
        const node = nodes.find(n => n.id === actorId);
        if (node?.x && node?.y) { pop.attr('cx', node.x).attr('cy', node.y); }
      });
    });

    return () => { sim.stop(); };
  }, [visibleNodes, visibleEdges, selectedGame]);

  // ─── HOVER HIGHLIGHTING ───────────────────────────────────────────────────
  useEffect(() => {
    if (!svgRef.current) return;
    const edges = d3.select(svgRef.current).selectAll('.edges path');
    if (!hoveredNode) { edges.transition().duration(200).attr('opacity', 0.6); return; }
    edges.transition().duration(200).attr('opacity', (d: any) => {
      const s = d.source.id || d.source;
      const t = d.target.id || d.target;
      return (s === hoveredNode || t === hoveredNode) ? 1 : 0.15;
    });
  }, [hoveredNode]);

  // ─── DERIVED STATS ────────────────────────────────────────────────────────
  const presOutCoercive = EDGES.filter(e => e.source === 'PRES' && e.type === 'coercive');
  const ugttvPresEdge = EDGES.find(e => e.source === 'UGTT' && e.target === 'PRES');
  const criticalGame = GAMES[0];

  const EDGE_TYPES: EdgeType[] = ['coercive', 'cooperative', 'competitive', 'dependent', 'extractive', 'spillover'];

  return (
    <div className="flex flex-col h-full space-y-4 p-3 md:p-6 relative overflow-hidden bg-dot-white/[0.02]">

      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-intel-cyan" />
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-widest">National Actor Network — Domestic Power Map</h2>
            <p className="text-[8px] font-mono text-slate-600">16 actors · 36 directed relationships · 6 game theory models · PRES as gravity well</p>
          </div>
        </div>
      </div>

      {/* Status strip */}
      <div className="glass rounded-xl border border-intel-border/50 overflow-hidden shrink-0">
        <div className="flex items-center gap-0 divide-x divide-white/5 overflow-x-auto no-scrollbar">
          <div className="px-4 py-2.5 shrink-0">
            <div className="text-[8px] font-mono text-slate-600 uppercase">Presidency Posture</div>
            <div className="text-sm font-mono font-bold text-intel-red">GRAVITY WELL — {presOutCoercive.length} coercive edges out</div>
          </div>
          <div className="px-4 py-2.5 shrink-0">
            <div className="text-[8px] font-mono text-slate-600 uppercase">Primary Veto Actor</div>
            <div className="text-sm font-mono font-bold text-amber-400">UGTT (popular=9, institutional=7)</div>
          </div>
          <div className="px-4 py-2.5 shrink-0">
            <div className="text-[8px] font-mono text-slate-600 uppercase">BCT Fragility</div>
            <div className="text-sm font-mono font-bold text-intel-orange">CAPTURED — Institutional independence eroding</div>
          </div>
          <div className="px-4 py-2.5 shrink-0">
            <div className="text-[8px] font-mono text-slate-600 uppercase">ENN Status</div>
            <div className="text-sm font-mono font-bold text-emerald-500/70">UNDERGROUND — Opacity variable</div>
          </div>
          <div className="px-4 py-2.5 shrink-0">
            <div className="text-[8px] font-mono text-slate-600 uppercase">Critical Game</div>
            <div className="text-sm font-mono font-bold text-purple-400">PRES↔UGTT Chicken → Near (Defect, Defect)</div>
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-3 flex-wrap shrink-0">
        <div className="flex items-center gap-1.5 text-[9px] font-mono text-slate-600 uppercase">
          <Filter className="w-3 h-3" /> Filter:
        </div>
        <select
          className="bg-[#0a0c10] border border-white/10 rounded-lg px-2 py-1 text-[9px] font-mono text-white"
          value={filters.type}
          onChange={e => setFilters(f => ({ ...f, type: e.target.value as EdgeType | 'all' }))}
        >
          <option value="all">All Edge Types</option>
          {EDGE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select
          className="bg-[#0a0c10] border border-white/10 rounded-lg px-2 py-1 text-[9px] font-mono text-white"
          value={filters.tier}
          onChange={e => setFilters(f => ({ ...f, tier: e.target.value === 'all' ? 'all' : parseInt(e.target.value) }))}
        >
          <option value="all">All Tiers</option>
          {[1, 2, 3, 4].map(t => <option key={t} value={t}>Tier {t}</option>)}
        </select>
        <div className="flex items-center gap-3 ml-auto flex-wrap">
          {Object.entries(EDGE_STYLE).map(([type, style]) => (
            <span key={type} className="flex items-center gap-1 text-[8px] font-mono" style={{ color: style.color }}>
              <span className="w-4 h-0.5 inline-block" style={{ backgroundColor: style.color }} />
              {type}
            </span>
          ))}
        </div>
      </div>

      {/* Main interaction layout */}
      <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0 overflow-hidden">
        {/* Left Column: Network Map */}
        <div className="flex-1 flex flex-col gap-4">
          {/* Graph Stage */}
          <div className="glass rounded-3xl border border-intel-border/30 overflow-hidden relative flex-1 bg-black/40">
            <svg ref={svgRef} className="w-full h-full cursor-grab active:cursor-grabbing" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }} />

            {/* Zoom controls */}
            <div className="absolute left-6 bottom-6 flex flex-col gap-2">
              <button onClick={() => { if (svgRef.current && zoomRef.current) d3.select(svgRef.current).transition().duration(300).call(zoomRef.current.scaleBy, 1.3); }}
                className="w-10 h-10 glass rounded-xl border border-white/10 flex items-center justify-center text-slate-400 hover:text-intel-cyan hover:border-intel-cyan/50 transition-all shadow-xl">
                <ZoomIn className="w-5 h-5" />
              </button>
              <button onClick={() => { if (svgRef.current && zoomRef.current) d3.select(svgRef.current).transition().duration(300).call(zoomRef.current.scaleBy, 1 / 1.3); }}
                className="w-10 h-10 glass rounded-xl border border-white/10 flex items-center justify-center text-slate-400 hover:text-intel-cyan hover:border-intel-cyan/50 transition-all shadow-xl">
                <ZoomOut className="w-5 h-5" />
              </button>
              <button onClick={() => { if (svgRef.current && zoomRef.current) d3.select(svgRef.current).transition().duration(500).call(zoomRef.current.transform, d3.zoomIdentity.translate(0, 0).scale(0.85)); }}
                className="w-10 h-10 glass rounded-xl border border-white/10 flex items-center justify-center text-slate-400 hover:text-intel-cyan hover:border-intel-cyan/50 transition-all shadow-xl">
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {/* Interaction overlays */}
            <AnimatePresence>
              {(selectedNode || selectedEdge) && (
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                  className="absolute top-6 left-6 w-72 glass rounded-2xl border border-intel-border/50 bg-[#050a10]/95 p-5 space-y-4 text-[10px] font-mono shadow-2xl backdrop-blur-xl pointer-events-auto">
                  {selectedNode ? (
                    <>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-base font-bold tracking-tight text-white">{selectedNode.label}</div>
                          <div className="text-slate-600 uppercase text-[8px] font-black">Tier {selectedNode.tier} · {selectedNode.powerType}</div>
                        </div>
                        <button onClick={() => setSelectedNode(null)} className="text-slate-600 hover:text-white transition-colors p-1"><X className="w-4 h-4" /></button>
                      </div>
                      <div className="grid grid-cols-2 gap-3 pt-2">
                        {Object.entries(selectedNode.resources).map(([k, v]) => (
                          <div key={k} className="space-y-1">
                            <div className="text-[7px] text-slate-600 uppercase font-black">{k}</div>
                            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                              <div className="h-full bg-intel-cyan rounded-full" style={{ width: `${v * 10}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="space-y-3 pt-2 border-t border-white/5">
                        <div className="space-y-1">
                          <div className="text-[7px] text-slate-600 uppercase font-black">Strategic Goals</div>
                          {selectedNode.goals.map((g, i) => <div key={i} className="text-slate-400 flex gap-2"><span>→</span> {g}</div>)}
                        </div>
                        <div className="space-y-1">
                          <div className="text-[7px] text-red-500/60 uppercase font-black">Constraints</div>
                          {selectedNode.constraints.map((c, i) => <div key={i} className="text-red-400/80 flex gap-2"><span>⚠</span> {c}</div>)}
                        </div>
                      </div>
                    </>
                  ) : selectedEdge ? (
                    <>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-base font-bold tracking-tight text-white">{selectedEdge.source as string} → {selectedEdge.target as string}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: EDGE_STYLE[selectedEdge.type].color }} />
                            <span className="text-slate-500 text-[8px] uppercase font-black">{selectedEdge.type} VECTOR</span>
                          </div>
                        </div>
                        <button onClick={() => setSelectedEdge(null)} className="text-slate-600 hover:text-white p-1"><X className="w-4 h-4" /></button>
                      </div>
                      <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 text-slate-400">{selectedEdge.description}</div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <div className="text-[7px] text-slate-600 uppercase font-black">Conditionality</div>
                          <div className="text-amber-400 font-medium">{selectedEdge.conditionality}</div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-[7px] text-slate-600 uppercase font-black">Weight</div>
                          <div className="text-white font-bold">{selectedEdge.weight} / 10</div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-white/5">
                        <span className="text-slate-600 text-[7px] uppercase font-black">Trend</span>
                        <span className={cn("px-2 py-0.5 rounded-full text-[8px] font-black uppercase",
                          selectedEdge.trend === 'rising' ? 'bg-red-500/20 text-red-500' :
                          selectedEdge.trend === 'declining' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-slate-500/20 text-slate-500'
                        )}>{selectedEdge.trend}</span>
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
            <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between bg-white/[0.03] shrink-0">
              <div className="flex items-center gap-2.5 text-xs font-bold text-white uppercase tracking-widest font-mono">
                <Zap className="w-4 h-4 text-purple-400" />
                Strategic Game Engine
              </div>
              {selectedGame && <button onClick={() => setSelectedGame(null)} className="text-slate-600 hover:text-white p-1"><X className="w-4 h-4" /></button>}
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
              <div className="grid grid-cols-2 gap-2">
                {GAMES.map(g => (
                  <button key={g.id} onClick={() => setSelectedGame(selectedGame?.id === g.id ? null : g)}
                    className={cn('text-left p-3 rounded-2xl border text-[9px] font-mono transition-all flex flex-col gap-1 relative overflow-hidden group',
                      selectedGame?.id === g.id
                        ? 'border-purple-500/50 bg-purple-500/20 text-white shadow-lg'
                        : 'border-white/5 bg-white/[0.02] text-slate-500 hover:border-white/20 hover:bg-white/[0.04]'
                    )}>
                    <div className="font-bold text-[10px] truncate">{g.name}</div>
                    <div className="flex items-center justify-between mt-auto">
                      <span className="text-[7px] uppercase text-purple-400 font-black">{g.type.replace('_',' ')}</span>
                      {selectedGame?.id === g.id && <div className="w-1 h-1 rounded-full bg-purple-400 animate-pulse" />}
                    </div>
                  </button>
                ))}
              </div>

              {selectedGame && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                  <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/30">
                    <div className="text-[7px] text-purple-400 uppercase font-black mb-1.5 tracking-[0.2em]">Projection Summary</div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">"{selectedGame.description}"</p>
                  </div>

                  <div className="overflow-x-auto rounded-2xl border border-white/10 bg-black/40 backdrop-blur-md">
                    <table className="text-[9px] font-mono min-w-[300px] w-full border-collapse">
                      <thead>
                        <tr className="bg-white/5 text-[7px] text-slate-500 font-black uppercase">
                          <th className="px-2 py-2 text-center">VECTOR</th>
                          {selectedGame.labels.cols.map((c, i) => (
                            <th key={i} className="px-2 py-2 text-center border-l border-white/5">{c}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {selectedGame.labels.rows.map((row, ri) => (
                          <tr key={ri} className="border-t border-white/5">
                            <td className="px-2 py-4 bg-white/[0.02] text-slate-500 text-[7px] font-black uppercase text-center">{row}</td>
                            {selectedGame.labels.cols.map((_, ci) => {
                              const idx = ri * selectedGame.labels.cols.length + ci;
                              const vals = selectedGame.matrix[idx] || [0, 0];
                              return (
                                <td key={ci} className="px-2 py-4 text-center border-l border-white/5 text-[10px] font-bold">
                                  <span className={ri === 0 && ci === 0 ? 'text-emerald-400' : ri === 1 && ci === 1 ? 'text-red-400' : 'text-slate-300'}>
                                    {vals[0]},{vals[1]}
                                  </span>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                      <div className="text-[7px] text-emerald-400 uppercase font-black mb-1">Nash Equilibrium</div>
                      <div className="text-[10px] text-slate-300">{selectedGame.nashEquilibrium}</div>
                    </div>
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                      <div className="text-[7px] text-amber-400 uppercase font-black mb-1">Current Outcome</div>
                      <div className="text-[10px] text-slate-300">{selectedGame.currentOutcome}</div>
                    </div>
                  </div>

                  <div className="bg-red-500/8 border border-red-500/20 rounded-xl p-3">
                    <div className="text-[7px] text-red-400 uppercase font-black mb-1">Tunisia Impact</div>
                    <div className="text-[10px] text-red-300/90">{selectedGame.tunisiaImpact}</div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>

          {/* Institutional Stress Dashboard */}
          <div className="glass rounded-2xl border border-intel-border/30 p-4 shrink-0">
            <div className="text-[8px] font-mono text-slate-500 uppercase tracking-widest mb-3">Institutional Stress Dashboard</div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Democratic Backsliding', value: Math.round((EDGES.filter(e => e.source === 'PRES' && e.type === 'coercive').reduce((s, e) => s + e.weight, 0) / 40) * 100), color: '#ef4444' },
                { label: 'Economic Vulnerability', value: Math.round(((EDGES.find(e => e.source === 'BCT' && e.target === 'INFORMAL')?.weight || 7) / 10 + (EDGES.find(e => e.source === 'PRES' && e.target === 'BCT')?.weight || 7) / 10) * 50), color: '#f97316' },
                { label: 'Social Cohesion', value: Math.round(100 - (EDGES.find(e => e.source === 'UGTT' && e.target === 'PRES')?.weight || 6) * 10), color: '#f59e0b' },
                { label: 'Default Probability', value: 45, color: '#dc2626' },
              ].map((m, i) => (
                <div key={i} className="space-y-1">
                  <div className="text-[7px] font-mono text-slate-600 uppercase">{m.label}</div>
                  <div className="text-lg font-bold font-mono" style={{ color: m.color }}>{m.value}%</div>
                  <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${m.value}%`, background: m.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NationalActorNetwork;