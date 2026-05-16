import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import * as d3 from 'd3';
import { motion, AnimatePresence } from 'motion/react';
import { Search, X, Filter, ZoomIn, ZoomOut, RefreshCw, Globe, Users, Activity, Info, ArrowRight, AlertTriangle, RotateCw } from 'lucide-react';
import { cn } from '../../utils/cn';
import { ModuleHeader } from '../shared/ProfessionalShared';
import {
  fetchEntities, fetchRelations, fetchNeighbors, seedGraph,
  type Entity, type Relation,
} from '../../services/knowledgeGraphService';

type GraphNode = Entity & {
  x?: number; y?: number;
  fx?: number | null; fy?: number | null;
  group: 'geopolitical' | 'national';
};

type GraphLink = d3.SimulationLinkDatum<GraphNode> & {
  type: string; weight: number; description?: string;
  trend?: string; conditionality?: string;
};

const EDGE_COLORS: Record<string, string> = {
  coercive: '#ef4444', cooperative: '#22c55e', competitive: '#f97316',
  dependent: '#a855f7', extractive: '#f59e0b', spillover: '#06b6d4',
};

const GEO_COLOR = '#6366f1';
const NAT_COLOR = '#f97316';

const GEO_IDS = new Set(['TUN','DZA','ITA','FRA','EU','USA','KSA','UAE','CHN','GBR','TUR','QAT','RUS','LBY']);

const FALLBACK_ENTITIES: Entity[] = [
  { id: 'TUN', type: 'actor', label: 'Tunisia', tier: 1, domain: ['energy','migration','security','finance','infrastructure','diplomatic','ideological','strategic'], power_type: 'soft', color: '#00f2ff', size: 50, resources: { economic: 3, military: 2, diplomatic: 4, informational: 3 }, goals: ['IMF agreement','EU partnership','Security stability'], constraints: ['Debt trap','Youth unemployment','Regional instability'], risk_tolerance: 'medium', time_horizon: 'medium', fixed_x: 0, fixed_y: 0 },
  { id: 'DZA', type: 'actor', label: 'Algeria', tier: 2, domain: ['energy','security','diplomatic'], power_type: 'hard', color: '#10b981', size: 30, resources: { economic: 5, military: 7, diplomatic: 6, informational: 4 }, goals: ['Regional influence','Counter Morocco','Energy exports'], constraints: ['Oil dependency','Internal stability'], risk_tolerance: 'medium', time_horizon: 'long' },
  { id: 'ITA', type: 'actor', label: 'Italy', tier: 2, domain: ['migration','energy','diplomatic'], power_type: 'hard', color: '#3b82f6', size: 30, resources: { economic: 7, military: 6, diplomatic: 7, informational: 7 }, goals: ['Migration control','Energy diversification','Mediterranean influence'], constraints: ['EU constraints','Domestic politics'], risk_tolerance: 'medium', time_horizon: 'long' },
  { id: 'FRA', type: 'actor', label: 'France', tier: 2, domain: ['security','finance','diplomatic','ideological'], power_type: 'soft', color: '#6366f1', size: 30, resources: { economic: 8, military: 8, diplomatic: 9, informational: 8 }, goals: ['Neocolonial influence','Counter China','IMF alignment'], constraints: ['Post-colonial resentment','EU bureaucracy'], risk_tolerance: 'medium', time_horizon: 'long' },
  { id: 'EU', type: 'institution', label: 'European Union', tier: 2, domain: ['finance','diplomatic','ideological','strategic'], power_type: 'structural', color: '#a855f7', size: 30, resources: { economic: 9, military: 9, diplomatic: 10, informational: 9 }, goals: ['Southern neighborhood stability','Migration management','Rule of law promotion'], constraints: ['Consensus requirement','Visegrad resistance'], risk_tolerance: 'medium', time_horizon: 'long' },
  { id: 'USA', type: 'actor', label: 'United States', tier: 2, domain: ['security','finance','strategic'], power_type: 'hard', color: '#E36C0A', size: 50, resources: { economic: 9, military: 10, diplomatic: 8, informational: 8 }, goals: ['NATO southern flank','Counter Russia/China','IMF alignment'], constraints: ['Indo-Pacific pivot','Congressional gridlock'], risk_tolerance: 'medium', time_horizon: 'long' },
  { id: 'KSA', type: 'actor', label: 'Saudi Arabia', tier: 3, domain: ['finance','ideological','strategic'], power_type: 'extractive', color: '#10b981', size: 20, resources: { economic: 7, military: 5, diplomatic: 5, informational: 4 }, goals: ['Vision 2030 investment','Counter Iran','Energy market share'], constraints: ['Vision 2030 timeline','Regional rivalry'], risk_tolerance: 'medium', time_horizon: 'long' },
  { id: 'UAE', type: 'actor', label: 'United Arab Emirates', tier: 3, domain: ['finance','strategic','diplomatic'], power_type: 'extractive', color: '#f59e0b', size: 20, resources: { economic: 7, military: 4, diplomatic: 6, informational: 5 }, goals: ['Port/finance expansion','Counter Islamism','Gulf leadership'], constraints: ['Small population','Regional perception'], risk_tolerance: 'high', time_horizon: 'long' },
  { id: 'CHN', type: 'actor', label: 'China', tier: 3, domain: ['finance','infrastructure','strategic'], power_type: 'structural', color: '#ef4444', size: 20, resources: { economic: 10, military: 9, diplomatic: 7, informational: 6 }, goals: ['Belt & Road expansion','Resource access','Debt diplomacy'], constraints: ['Geographic distance','EU scrutiny'], risk_tolerance: 'medium', time_horizon: 'long' },
  { id: 'GBR', type: 'actor', label: 'United Kingdom', tier: 3, domain: ['finance','diplomatic','strategic'], power_type: 'soft', color: '#14b8a6', size: 20, resources: { economic: 7, military: 6, diplomatic: 5, informational: 6 }, goals: ['Post-Brexit trade','Security partnerships','Africa engagement'], constraints: ['Post-Brexit bandwidth','Economic constraints'], risk_tolerance: 'medium', time_horizon: 'medium' },
  { id: 'TUR', type: 'actor', label: 'Turkey', tier: 3, domain: ['security','diplomatic','ideological','strategic'], power_type: 'hard', color: '#f97316', size: 20, resources: { economic: 6, military: 7, diplomatic: 6, informational: 5 }, goals: ['Africa expansion','Counter PKK/PYD','Drone exports'], constraints: ['Economic crisis','Regional overextension'], risk_tolerance: 'high', time_horizon: 'medium' },
  { id: 'QAT', type: 'actor', label: 'Qatar', tier: 3, domain: ['finance','diplomatic','ideological'], power_type: 'extractive', color: '#ec4899', size: 20, resources: { economic: 6, military: 2, diplomatic: 7, informational: 7 }, goals: ['Mediation role','LNG exports','Soft power projection'], constraints: ['Blockade trauma','Regional alignment'], risk_tolerance: 'high', time_horizon: 'short' },
  { id: 'RUS', type: 'actor', label: 'Russia', tier: 4, domain: ['security','ideological','strategic'], power_type: 'hard', color: '#dc2626', size: 15, resources: { economic: 5, military: 9, diplomatic: 6, informational: 7 }, goals: ['Counter NATO','Influence in Africa','Wagner/PMC network'], constraints: ['Ukraine war','Sanctions'], risk_tolerance: 'high', time_horizon: 'long' },
  { id: 'LBY', type: 'actor', label: 'Libya', tier: 4, domain: ['migration','security','energy'], power_type: 'hard', color: '#78716c', size: 15, resources: { economic: 3, military: 4, diplomatic: 2, informational: 2 }, goals: ['Stabilization','Resource control','Border management'], constraints: ['Civil war','Militia fragmentation'], risk_tolerance: 'high', time_horizon: 'short' },
  { id: 'PRES', type: 'actor', label: 'Presidency', tier: 1, domain: ['constitutional_power','political_repression','narrative_warfare'], power_type: 'institutional', color: '#ef4444', size: 55, resources: { popular: 3, institutional: 9, economic: 6, informational: 7 }, goals: ['Control security apparatus','Maintain elite cohesion','Neutralize opposition'], constraints: ['UGTT veto','BCT limits','ENN resistance'], risk_tolerance: 'high', time_horizon: 'short' },
  { id: 'UGTT', type: 'institution', label: 'UGTT', tier: 2, domain: ['social_dialogue','labor_organization','protest_coordination'], power_type: 'mobilizational', color: '#f59e0b', size: 40, resources: { popular: 9, institutional: 7, economic: 3, informational: 6 }, goals: ['Protect public sector','Block IMF reforms','Maintain social peace'], constraints: ['Co-optation risk','Internal divide','Financial pressure'], risk_tolerance: 'high', time_horizon: 'long' },
  { id: 'BCT', type: 'institution', label: 'Central Bank', tier: 2, domain: ['monetary_policy','foreign_reserves','exchange_rate'], power_type: 'institutional', color: '#22c55e', size: 25, resources: { popular: 2, institutional: 8, economic: 9, informational: 4 }, goals: ['Defend currency','Maintain reserves','Control inflation'], constraints: ['Political pressure','Fiscal dominance'], risk_tolerance: 'low', time_horizon: 'medium' },
  { id: 'ENN', type: 'institution', label: 'Ennahda Movement', tier: 3, domain: ['ideological','electoral_politics','narrative_warfare'], power_type: 'mobilizational', color: '#a855f7', size: 25, resources: { popular: 4, institutional: 3, economic: 5, informational: 5 }, goals: ['Political survival','Anti-authoritarian coalition','International legitimacy'], constraints: ['Repression','Internal splits','Electoral decline'], risk_tolerance: 'medium', time_horizon: 'long' },
  { id: 'UTICA', type: 'institution', label: 'UTICA', tier: 3, domain: ['economic_policy','social_dialogue','investment'], power_type: 'financial', color: '#3b82f6', size: 20, resources: { popular: 3, institutional: 5, economic: 8, informational: 3 }, goals: ['Business-friendly policy','Tax stability','Avoid unrest'], constraints: ['Divided membership'], risk_tolerance: 'low', time_horizon: 'medium' },
  { id: 'ARM', type: 'institution', label: 'Armed Forces', tier: 1, domain: ['internal_security','constitutional_power'], power_type: 'institutional', color: '#10b981', size: 35, resources: { popular: 8, institutional: 8, economic: 4, informational: 3 }, goals: ['Professional neutrality','Institutional protection','Anti-terrorism'], constraints: ['Economic constraints','Political pressure'], risk_tolerance: 'low', time_horizon: 'long' },
  { id: 'INT', type: 'institution', label: 'Ministry of Interior', tier: 2, domain: ['internal_security','political_repression'], power_type: 'coercive', color: '#ef4444', size: 30, resources: { popular: 2, institutional: 7, economic: 5, informational: 4 }, goals: ['Regime protection','Protest control'], constraints: ['Police morale'], risk_tolerance: 'high', time_horizon: 'short' },
  { id: 'COURT', type: 'institution', label: 'Judiciary', tier: 3, domain: ['constitutional_power','human_rights'], power_type: 'institutional', color: '#f59e0b', size: 20, resources: { popular: 3, institutional: 5, economic: 2, informational: 3 }, goals: ['Judicial independence','Rule of law','Anti-corruption'], constraints: ['Executive pressure','Public trust'], risk_tolerance: 'medium', time_horizon: 'long' },
  { id: 'MEDIA', type: 'institution', label: 'Media Landscape', tier: 3, domain: ['narrative_warfare','ideological'], power_type: 'narrative', color: '#06b6d4', size: 20, resources: { popular: 5, institutional: 2, economic: 3, informational: 7 }, goals: ['Fragmented influence','Truth-seeking','Regime criticism'], constraints: ['Decree 54','Economic pressure','Polarization'], risk_tolerance: 'medium', time_horizon: 'long' },
  { id: 'LPR', type: 'actor', label: 'Labor & Protest', tier: 4, domain: ['protest_coordination','mobilization','street_politics'], power_type: 'mobilizational', color: '#f97316', size: 18, resources: { popular: 7, institutional: 1, economic: 2, informational: 5 }, goals: ['Economic justice','Anti-repression'], constraints: ['Fragmentation','Co-optation'], risk_tolerance: 'high', time_horizon: 'short' },
  { id: 'INFORMAL', type: 'actor', label: 'Informal Economy', tier: 4, domain: ['border_economy','employment','economic_policy'], power_type: 'structural', color: '#78716c', size: 18, resources: { popular: 6, institutional: 0, economic: 6, informational: 2 }, goals: ['Operate freely'], constraints: ['Crackdowns'], risk_tolerance: 'high', time_horizon: 'short' },
  { id: 'DONOR', type: 'institution', label: 'International Donors', tier: 3, domain: ['fiscal_policy','structural_reform','investment'], power_type: 'financial', color: '#6366f1', size: 22, resources: { popular: 2, institutional: 6, economic: 8, informational: 4 }, goals: ['Reform conditionality','Fiscal discipline'], constraints: ['Political resistance'], risk_tolerance: 'low', time_horizon: 'long' },
  { id: 'YOUTH', type: 'actor', label: 'Marginalized Youth', tier: 4, domain: ['mobilization','employment','street_politics'], power_type: 'mobilizational', color: '#a855f7', size: 18, resources: { popular: 8, institutional: 1, economic: 1, informational: 6 }, goals: ['Employment','Freedom'], constraints: ['Fragmentation'], risk_tolerance: 'high', time_horizon: 'short' },
  { id: 'DIASPORA', type: 'actor', label: 'Diaspora', tier: 4, domain: ['remittance','investment','ideological'], power_type: 'financial', color: '#ec4899', size: 15, resources: { popular: 3, institutional: 2, economic: 7, informational: 3 }, goals: ['Economic stability','Family remittances'], constraints: ['Limited political leverage'], risk_tolerance: 'medium', time_horizon: 'long' },
  { id: 'FTDES', type: 'actor', label: 'FTDES', tier: 4, domain: ['human_rights','social_justice','advocacy'], power_type: 'mobilizational', color: '#0ea5e9', size: 15, resources: { popular: 5, institutional: 2, economic: 2, informational: 5 }, goals: ['Economic & social rights','Migration justice','Anti-torture'], constraints: ['Government harassment','Funding constraints'], risk_tolerance: 'high', time_horizon: 'long' },
  { id: 'LTDH', type: 'actor', label: 'LTDH', tier: 4, domain: ['human_rights','advocacy','monitoring'], power_type: 'mobilizational', color: '#06b6d4', size: 15, resources: { popular: 4, institutional: 3, economic: 2, informational: 6 }, goals: ['Human rights monitoring','Legal advocacy','International reporting'], constraints: ['Decree 54','Funding pressure'], risk_tolerance: 'medium', time_horizon: 'long' },
  // ── Infrastructure ────────────────────────────────────────────────
  { id: 'STEG', type: 'utility', label: 'STEG', tier: 2, domain: ['energy','electricity','subsidies'], power_type: 'structural', color: '#f97316', size: 35, resources: { economic: 8, institutional: 7, technical: 9, informational: 3 }, goals: ['Grid stability','Reduce STEG debt','Integrate renewables'], constraints: ['Gas import dependency','Aging infrastructure','Subsidy burden'], risk_tolerance: 'medium', time_horizon: 'long' },
  { id: 'CPG', type: 'institution', label: 'CPG Phosphate', tier: 3, domain: ['industry','phosphate','mining','trade'], power_type: 'structural', color: '#f59e0b', size: 22, resources: { economic: 7, industrial: 8, logistics: 6 }, goals: ['Phosphate production & export','Gafsa basin employment','State revenue'], constraints: ['Depleting reserves','Environmental damage','Global price volatility'], risk_tolerance: 'medium', time_horizon: 'long' },
  { id: 'RADES_PP', type: 'infrastructure', label: 'Radès Power Plant', tier: 2, domain: ['energy','electricity'], power_type: 'structural', color: '#fb923c', size: 22, resources: { economic: 5, technical: 7 }, goals: ['Baseload generation','Peak demand coverage'], constraints: ['Aging gas turbines','Fuel supply dependency'], risk_tolerance: 'medium', time_horizon: 'medium' },
  { id: 'SOUSSE_PP', type: 'infrastructure', label: 'Sousse Power Plant', tier: 3, domain: ['energy'], power_type: 'structural', color: '#fdba74', size: 18, resources: { economic: 4, technical: 6 }, goals: ['Regional electricity supply'], constraints: ['Gas supply','Maintenance backlog'], risk_tolerance: 'medium', time_horizon: 'medium' },
  { id: 'SFAX_PP', type: 'infrastructure', label: 'Sfax Power Plant', tier: 3, domain: ['energy'], power_type: 'structural', color: '#fed7aa', size: 16, resources: { economic: 3, technical: 5 }, goals: ['Southern grid stability'], constraints: ['Fuel costs','Efficiency losses'], risk_tolerance: 'medium', time_horizon: 'medium' },
  { id: 'RADES_PORT', type: 'infrastructure', label: 'Radès Port', tier: 2, domain: ['trade','logistics','import_export'], power_type: 'structural', color: '#3b82f6', size: 28, resources: { economic: 9, logistics: 9 }, goals: ['Container throughput','Import clearance efficiency'], constraints: ['Congestion','Draft depth limits','Customs delays'], risk_tolerance: 'medium', time_horizon: 'medium' },
  { id: 'SFAX_PORT', type: 'infrastructure', label: 'Sfax Port', tier: 3, domain: ['trade','fishing','logistics'], power_type: 'structural', color: '#60a5fa', size: 20, resources: { economic: 5, logistics: 6 }, goals: ['Commercial & fishing operations','Regional export hub'], constraints: ['Siltation','Limited container capacity'], risk_tolerance: 'medium', time_horizon: 'medium' },
  { id: 'GABES_PORT', type: 'infrastructure', label: 'Gabès Port', tier: 3, domain: ['industry','chemicals','trade'], power_type: 'structural', color: '#93c5fd', size: 18, resources: { economic: 6, logistics: 5 }, goals: ['Phosphate & chemical exports','Industrial zone supply'], constraints: ['Environmental damage','Industrial accident risk'], risk_tolerance: 'high', time_horizon: 'medium' },
  { id: 'BIZERTE_PORT', type: 'infrastructure', label: 'Bizerte Port', tier: 3, domain: ['trade','military','logistics'], power_type: 'structural', color: '#2563eb', size: 20, resources: { economic: 4, logistics: 6, military: 5 }, goals: ['Commercial & naval operations','Hydrocarbon storage'], constraints: ['Competition with Radès','Infrastructure age'], risk_tolerance: 'medium', time_horizon: 'medium' },
  { id: 'SONEDE', type: 'utility', label: 'SONEDE', tier: 2, domain: ['water','infrastructure','environment'], power_type: 'structural', color: '#06b6d4', size: 32, resources: { economic: 6, institutional: 7, technical: 8 }, goals: ['Water distribution','Leak reduction','Desalination expansion'], constraints: ['Dam depletion','Network losses (35%+)','Climate stress'], risk_tolerance: 'medium', time_horizon: 'long' },
  { id: 'DAM_SALEM', type: 'infrastructure', label: 'Sidi Salem Dam', tier: 2, domain: ['water','agriculture','environment'], power_type: 'structural', color: '#22d3ee', size: 26, resources: { economic: 7, water_capacity: 580 }, goals: ['Water storage (580M m³)','Irrigation supply','Flood control'], constraints: ['Siltation','Climate change','Evaporation losses'], risk_tolerance: 'medium', time_horizon: 'long' },
  { id: 'DAM_BARRAK', type: 'infrastructure', label: 'Sidi Barrak Dam', tier: 3, domain: ['water','agriculture'], power_type: 'structural', color: '#67e8f9', size: 22, resources: { economic: 5, water_capacity: 270 }, goals: ['Water storage (270M m³)','North-west water security'], constraints: ['Siltation','Reduced rainfall'], risk_tolerance: 'medium', time_horizon: 'long' },
  { id: 'PIPELINE_NS', type: 'infrastructure', label: 'North-South Pipeline', tier: 2, domain: ['water','infrastructure'], power_type: 'structural', color: '#0891b2', size: 24, resources: { economic: 8, technical: 7 }, goals: ['Transfer north water to south','Drought relief','Irrigation'], constraints: ['High operating cost','Pumping power needs','Leakage'], risk_tolerance: 'high', time_horizon: 'long' },
  { id: 'A1_HWY', type: 'infrastructure', label: 'A1 Highway', tier: 2, domain: ['transport','logistics','trade'], power_type: 'structural', color: '#a855f7', size: 26, resources: { economic: 9, logistics: 9 }, goals: ['North-south freight corridor','Regional connectivity'], constraints: ['Toll revenue','Maintenance backlog','Accident rates'], risk_tolerance: 'low', time_horizon: 'long' },
  { id: 'SNCFT', type: 'utility', label: 'SNCFT Railway', tier: 2, domain: ['transport','logistics','industry'], power_type: 'structural', color: '#ec4899', size: 24, resources: { economic: 5, institutional: 6, technical: 5 }, goals: ['Passenger & freight rail','Phosphate transport','Urban commuter service'], constraints: ['Aging rolling stock','Underinvestment','Low speed'], risk_tolerance: 'medium', time_horizon: 'long' },
  { id: 'TUNIS_AIRPORT', type: 'infrastructure', label: 'Tunis-Carthage Airport', tier: 2, domain: ['transport','tourism','trade'], power_type: 'structural', color: '#f472b6', size: 24, resources: { economic: 7, logistics: 7 }, goals: ['International air hub','Tourism gateway','Cargo operations'], constraints: ['Runway capacity','Aging terminals','Airspace constraints'], risk_tolerance: 'low', time_horizon: 'long' },
];

const FALLBACK_RELATIONS: Relation[] = [
  { id: 'g1', source_id: 'TUN', target_id: 'DZA', type: 'cooperative', weight: 6, domain: 'energy', conditionality: 'Unstable', trend: 'declining', description: 'Algeria supplies 60% of gas via ENI pipeline.' },
  { id: 'g2', source_id: 'TUN', target_id: 'FRA', type: 'dependent', weight: 8, domain: 'finance', conditionality: 'Conditional', trend: 'declining', description: 'France is Tunisia\'s 2nd largest trade partner.' },
  { id: 'g3', source_id: 'TUN', target_id: 'EU', type: 'cooperative', weight: 4, domain: 'diplomatic', conditionality: 'Partial', trend: 'declining', description: 'EU-Tunisia association agreement.' },
  { id: 'g4', source_id: 'TUN', target_id: 'USA', type: 'cooperative', weight: 3, domain: 'security', conditionality: 'Limited', trend: 'stable', description: 'US counter-terrorism training.' },
  { id: 'g5', source_id: 'TUN', target_id: 'KSA', type: 'dependent', weight: 5, domain: 'finance', conditionality: 'At risk', trend: 'declining', description: 'Saudi aid package and deposits.' },
  { id: 'g6', source_id: 'TUN', target_id: 'UAE', type: 'cooperative', weight: 4, domain: 'finance', conditionality: 'Stable', trend: 'stable', description: 'UAE investments in banking.' },
  { id: 'g7', source_id: 'TUN', target_id: 'CHN', type: 'cooperative', weight: 3, domain: 'infrastructure', conditionality: 'Emerging', trend: 'rising', description: 'Growing BRI presence.' },
  { id: 'g8', source_id: 'TUN', target_id: 'LBY', type: 'spillover', weight: 8, domain: 'migration', conditionality: 'Uncontrolled', trend: 'rising', description: 'Libyan conflict creates migration waves.' },
  { id: 'g9', source_id: 'ITA', target_id: 'TUN', type: 'coercive', weight: 8, domain: 'migration', conditionality: 'Conditional', trend: 'stable', description: 'Italy pressures Tunisia on deportations.' },
  { id: 'g10', source_id: 'FRA', target_id: 'TUN', type: 'coercive', weight: 5, domain: 'finance', conditionality: 'Conditional', trend: 'declining', description: 'France conditions aid on IMF compliance.' },
  { id: 'n1', source_id: 'PRES', target_id: 'UGTT', type: 'competitive', weight: 8, domain: 'social_dialogue', description: 'PRES vs UGTT over wage bill and IMF reform.', trend: 'rising' },
  { id: 'n2', source_id: 'PRES', target_id: 'BCT', type: 'coercive', weight: 7, domain: 'monetary_policy', description: 'PRES pressure on BCT independence.', trend: 'rising' },
  { id: 'n3', source_id: 'PRES', target_id: 'INT', type: 'coercive', weight: 9, domain: 'internal_security', description: 'PRES controls Interior for protest repression.', trend: 'stable' },
  { id: 'n4', source_id: 'PRES', target_id: 'ARM', type: 'cooperative', weight: 6, domain: 'constitutional_power', description: 'PRES maintains military relationship.', trend: 'stable' },
  { id: 'n5', source_id: 'PRES', target_id: 'MEDIA', type: 'coercive', weight: 8, domain: 'narrative_warfare', description: 'Decree 54 used to jail journalists.', trend: 'rising' },
  { id: 'n6', source_id: 'PRES', target_id: 'ENN', type: 'coercive', weight: 7, domain: 'political_repression', description: 'Ennahda leaders imprisoned.', trend: 'stable' },
  { id: 'n7', source_id: 'PRES', target_id: 'COURT', type: 'coercive', weight: 7, domain: 'constitutional_power', description: 'Presidential control over judiciary.', trend: 'rising' },
  { id: 'n8', source_id: 'PRES', target_id: 'DONOR', type: 'competitive', weight: 5, domain: 'fiscal_policy', description: 'PRES resists IMF conditions.', trend: 'stable' },
  { id: 'n9', source_id: 'UGTT', target_id: 'PRES', type: 'competitive', weight: 7, domain: 'labor_organization', description: 'UGTT blocks civil service reform.', trend: 'stable' },
  { id: 'n10', source_id: 'UGTT', target_id: 'LPR', type: 'cooperative', weight: 6, domain: 'protest_coordination', description: 'UGTT channels protest energy.', trend: 'stable' },
  { id: 'n11', source_id: 'BCT', target_id: 'DONOR', type: 'dependent', weight: 8, domain: 'monetary_policy', description: 'BCT relies on donor FX reserves.', trend: 'declining' },
  { id: 'n12', source_id: 'YOUTH', target_id: 'LPR', type: 'cooperative', weight: 7, domain: 'mobilization', description: 'Marginalized youth are primary protest demographic.', trend: 'stable' },
  { id: 'n13', source_id: 'PRES', target_id: 'FTDES', type: 'coercive', weight: 5, domain: 'social_justice', description: 'FTDES offices raided, staff detained.', trend: 'rising' },
  { id: 'n14', source_id: 'PRES', target_id: 'LTDH', type: 'coercive', weight: 6, domain: 'human_rights', description: 'PRES pressures LTDH via Decree 54.', trend: 'rising' },
  // ── Infrastructure ────────────────────────────────────────────────
  { id: 'if1', source_id: 'STEG', target_id: 'RADES_PP', type: 'cooperative', weight: 9, domain: 'energy', description: 'Radès supplies ~20% of national grid capacity.', trend: 'stable' },
  { id: 'if2', source_id: 'TUN', target_id: 'STEG', type: 'dependent', weight: 8, domain: 'energy', description: 'STEG debt of 4.2B TND is a sovereign fiscal risk.', trend: 'declining' },
  { id: 'if3', source_id: 'TUN', target_id: 'RADES_PORT', type: 'dependent', weight: 9, domain: 'trade', description: 'Radès handles ~60% of Tunisia\'s container traffic.', trend: 'stable' },
  { id: 'if4', source_id: 'SONEDE', target_id: 'DAM_SALEM', type: 'dependent', weight: 9, domain: 'water', description: 'Sidi Salem is SONEDE\'s primary reservoir (580M m³).', trend: 'stable' },
  { id: 'if5', source_id: 'SONEDE', target_id: 'PIPELINE_NS', type: 'dependent', weight: 8, domain: 'water', description: 'North-South pipeline transfers water from north to south.', trend: 'stable' },
  { id: 'if6', source_id: 'TUN', target_id: 'SONEDE', type: 'dependent', weight: 8, domain: 'water', description: 'SONEDE\'s 35%+ network losses threaten water security.', trend: 'declining' },
  { id: 'if7', source_id: 'A1_HWY', target_id: 'RADES_PORT', type: 'cooperative', weight: 8, domain: 'logistics', description: 'A1 connects Radès Port to the south.', trend: 'stable' },
  { id: 'if8', source_id: 'SNCFT', target_id: 'CPG', type: 'dependent', weight: 7, domain: 'industry', description: 'SNCFT transports CPG phosphate from Gafsa to Skhira.', trend: 'stable' },
  { id: 'if9', source_id: 'A1_HWY', target_id: 'TUNIS_AIRPORT', type: 'cooperative', weight: 5, domain: 'transport', description: 'A1 provides airport access from southern regions.', trend: 'stable' },
  { id: 'if10', source_id: 'SKHIRA_PORT', target_id: 'CPG', type: 'dependent', weight: 8, domain: 'phosphate', description: 'Skhira port is CPG\'s primary phosphate export terminal.', trend: 'stable' },
  { id: 'if11', source_id: 'SONEDE', target_id: 'STEG', type: 'dependent', weight: 6, domain: 'energy', description: 'SONEDE is STEG\'s largest electricity consumer (pumping + desal).', trend: 'rising' },
  { id: 'if12', source_id: 'DZA', target_id: 'STEG', type: 'dependent', weight: 7, domain: 'energy', description: 'Algeria supplies 60%+ of STEG\'s natural gas via ENI pipeline.', trend: 'stable' },
  { id: 'if13', source_id: 'A1_HWY', target_id: 'SNCFT', type: 'competitive', weight: 3, domain: 'transport', description: 'Highway and rail compete on the Tunis-Sfax corridor.', trend: 'stable' },
  { id: 'if14', source_id: 'RADES_PORT', target_id: 'RADES_RAIL', type: 'cooperative', weight: 5, domain: 'logistics', description: 'Intermodal freight between port and rail.', trend: 'stable' },
  { id: 'if15', source_id: 'RADES_PORT', target_id: 'TUNIS_AIRPORT', type: 'cooperative', weight: 2, domain: 'logistics', description: 'Both serve Greater Tunis as trade/travel gateways.', trend: 'stable' },
];

const W = 1200, H = 850, CX = W / 2, CY = H / 2;

const KnowledgeGraphExplorer: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const simRef = useRef<d3.Simulation<GraphNode, undefined> | null>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const gRef = useRef<SVGGElement | null>(null);

  const [entities, setEntities] = useState<Entity[]>(FALLBACK_ENTITIES);
  const [relations, setRelations] = useState<Relation[]>(FALLBACK_RELATIONS);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [usingFallback, setUsingFallback] = useState(false);
  const [search, setSearch] = useState('');
  const [groupFilter, setGroupFilter] = useState<'all' | 'geopolitical' | 'national'>('all');
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [neighbors, setNeighbors] = useState<{ entity: Entity; relations: Relation[]; neighbors: Entity[] } | null>(null);

  const loadData = useCallback(() => {
    setLoading(true);
    setFetchError(null);
    Promise.all([
      fetchEntities().catch(() => [] as Entity[]),
      fetchRelations().catch(() => [] as Relation[]),
    ]).then(([ents, rels]) => {
      if (ents.length > 0) {
        setEntities(ents);
        setUsingFallback(false);
      } else {
        setUsingFallback(true);
      }
      if (rels.length > 0) {
        setRelations(rels);
      }
    }).catch((err) => {
      setFetchError(err?.message || 'Failed to load');
      setUsingFallback(true);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const nodes = useMemo<GraphNode[]>(() => {
    const geoIds = new Set(entities.filter(e => GEO_IDS.has(e.id)).map(e => e.id));
    return entities.map(e => ({
      ...e,
      group: geoIds.has(e.id) ? 'geopolitical' as const : 'national' as const,
    }));
  }, [entities]);

  const links = useMemo<GraphLink[]>(() => {
    const nodeIds = new Set(nodes.map(n => n.id));
    return relations
      .filter(r => nodeIds.has(r.source_id) && nodeIds.has(r.target_id))
      .map(r => ({
        source: r.source_id, target: r.target_id,
        type: r.type, weight: r.weight || 5,
        description: r.description, trend: r.trend, conditionality: r.conditionality,
      }));
  }, [relations, nodes]);

  const filteredNodes = useMemo(() => {
    let result = nodes;
    if (groupFilter !== 'all') result = result.filter(n => n.group === groupFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(n =>
        n.label.toLowerCase().includes(q) || n.id.toLowerCase().includes(q) ||
        (n.aliases && n.aliases.some(a => a.toLowerCase().includes(q)))
      );
    }
    return result;
  }, [nodes, groupFilter, search]);

  const filteredNodeIds = useMemo(() => new Set(filteredNodes.map(n => n.id)), [filteredNodes]);
  const filteredLinks = useMemo(() =>
    links.filter(l => filteredNodeIds.has((l.source as string)) && filteredNodeIds.has((l.target as string))),
    [links, filteredNodeIds]
  );

  const handleNodeClick = useCallback(async (node: GraphNode) => {
    setSelectedNode(node);
    try {
      const result = await fetchNeighbors(node.id);
      setNeighbors(result);
    } catch { setNeighbors(null); }
  }, []);

  // Build D3 graph
  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    svg.append('rect').attr('width', W).attr('height', H).attr('fill', '#03080f');

    if (filteredNodes.length === 0) {
      svg.append('text').attr('x', CX).attr('y', CY).attr('text-anchor', 'middle')
        .attr('fill', '#64748b').attr('font-size', 14).attr('font-family', 'monospace')
        .text('No matching entities');
      return;
    }

    const defs = svg.append('defs');
    Object.entries(EDGE_COLORS).forEach(([type, color]) => {
      defs.append('marker').attr('id', `kge-arrow-${type}`).attr('viewBox', '0 -5 10 10')
        .attr('refX', 20).attr('refY', 0).attr('markerWidth', 6).attr('markerHeight', 6).attr('orient', 'auto')
        .append('path').attr('d', 'M0,-5L10,0L0,5').attr('fill', color).attr('opacity', 0.8);
    });

    const glow = defs.append('filter').attr('id', 'kge-glow').attr('x', '-50%').attr('y', '-50%').attr('width', '200%').attr('height', '200%');
    glow.append('feGaussianBlur').attr('stdDeviation', '3').attr('result', 'blur');
    const merge = glow.append('feMerge');
    merge.append('feMergeNode').attr('in', 'blur');
    merge.append('feMergeNode').attr('in', 'SourceGraphic');

    const container = svg.append('g').attr('class', 'zoom-container');
    gRef.current = container.node();

    const zoom = d3.zoom<SVGSVGElement, unknown>().scaleExtent([0.1, 4])
      .on('zoom', event => container.attr('transform', event.transform));
    zoomRef.current = zoom;
    svg.call(zoom);
    svg.call(zoom.transform, d3.zoomIdentity.translate(0, 0).scale(0.85));

    const graphNodes: GraphNode[] = filteredNodes.map(n => ({ ...n }));
    const nodeMap = new Map(graphNodes.map(n => [n.id, n]));
    const graphLinks: GraphLink[] = filteredLinks
      .filter(l => nodeMap.has(l.source as string) && nodeMap.has(l.target as string))
      .map(l => ({ ...l }));

    const sim = d3.forceSimulation<GraphNode>(graphNodes)
      .force('link', d3.forceLink<GraphNode, GraphLink>(graphLinks).id(d => d.id).distance(150).strength(0.3))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(CX, CY))
      .force('collision', d3.forceCollide<GraphNode>(d => (d.size || 20) + 10));
    simRef.current = sim;

    const edgeG = container.append('g').attr('class', 'edges');
    const edgePaths = edgeG.selectAll<SVGPathElement, GraphLink>('path')
      .data(graphLinks).join('path')
      .attr('fill', 'none')
      .attr('stroke', d => EDGE_COLORS[d.type] || '#64748b')
      .attr('stroke-width', d => Math.max(1, (d.weight || 5) / 2))
      .attr('stroke-dasharray', d => d.type === 'spillover' ? '6,4' : 'none')
      .attr('opacity', 0.4)
      .attr('marker-end', d => `url(#kge-arrow-${d.type})`)
      .style('cursor', 'pointer');

    const nodeG = container.append('g').attr('class', 'nodes');
    const nodeGroups = nodeG.selectAll<SVGGElement, GraphNode>('g')
      .data(graphNodes).join('g').style('cursor', 'pointer')
      .call(d3.drag<SVGGElement, GraphNode>()
        .on('start', (event, d) => { if (!event.active) sim.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
        .on('drag', (event, d) => { d.fx = event.x; d.fy = event.y; })
        .on('end', (event, d) => { if (!event.active) sim.alphaTarget(0); d.fx = null; d.fy = null; })
      )
      .on('click', (event, d) => { event.stopPropagation(); handleNodeClick(d); })
      .on('mouseover', (_, d) => setHoveredNode(d.id))
      .on('mouseout', () => setHoveredNode(null));

    nodeGroups.append('circle')
      .attr('r', d => (d.size || 20) * 0.45)
      .attr('fill', d => `${d.group === 'geopolitical' ? GEO_COLOR : NAT_COLOR}22`)
      .attr('stroke', d => d.group === 'geopolitical' ? GEO_COLOR : NAT_COLOR)
      .attr('stroke-width', 2)
      .attr('filter', 'url(#kge-glow)');

    nodeGroups.append('circle')
      .attr('r', d => (d.size || 20) * 0.15)
      .attr('fill', d => d.group === 'geopolitical' ? GEO_COLOR : NAT_COLOR)
      .attr('cy', d => -(d.size || 20) * 0.35);

    nodeGroups.append('text')
      .attr('text-anchor', 'middle').attr('dy', d => (d.size || 20) * 0.45 + 12)
      .attr('fill', d => d.group === 'geopolitical' ? GEO_COLOR : NAT_COLOR)
      .attr('font-size', d => d.id.length > 5 ? 7 : 9).attr('font-family', 'monospace')
      .text(d => d.label.length > 14 ? d.id : d.label);

    nodeGroups.append('text')
      .attr('text-anchor', 'middle').attr('dy', 3)
      .attr('fill', '#fff').attr('font-size', 8).attr('font-family', 'monospace').attr('font-weight', 'bold')
      .text(d => d.id);

    svg.on('click', () => { setSelectedNode(null); setNeighbors(null); });

    sim.on('tick', () => {
      edgePaths.attr('d', (d) => {
        const s = d.source as GraphNode, t = d.target as GraphNode;
        if (!s.x || !t.x) return '';
        const dx = t.x - s.x, dy = t.y - s.y, len = Math.sqrt(dx * dx + dy * dy) || 1;
        const sR = ((s.size || 20) * 0.45) / len, tR = ((t.size || 20) * 0.45) / len;
        return `M${s.x + dx * sR},${s.y + dy * sR}L${t.x - dx * tR},${t.y - dy * tR}`;
      });
      nodeGroups.attr('transform', d => `translate(${d.x ?? CX},${d.y ?? CY})`);
    });

    return () => { sim.stop(); };
  }, [filteredNodes, filteredLinks, handleNodeClick]);

  // Hover/select highlight
  useEffect(() => {
    if (!gRef.current) return;
    const container = d3.select(gRef.current);
    container.selectAll<SVGPathElement, any>('g.edges path')
      .transition().duration(200).attr('opacity', (d) => {
        if (!d) return 0.4;
        if (hoveredNode || selectedNode) {
          const id = hoveredNode || selectedNode!.id;
          const s = (d.source as GraphNode).id || d.source;
          const t = (d.target as GraphNode).id || d.target;
          return (s === id || t === id) ? 0.8 : 0.1;
        }
        return 0.4;
      });
    container.selectAll<SVGGElement, any>('g.nodes g')
      .transition().duration(200).attr('opacity', (d) => {
        if (!d) return 1;
        if (hoveredNode) return d.id === hoveredNode ? 1 : 0.3;
        if (selectedNode) {
          if (d.id === selectedNode.id) return 1;
          const related = filteredLinks.some(l =>
            ((l.source as GraphNode).id || l.source) === selectedNode.id && ((l.target as GraphNode).id || l.target) === d.id
          ) || filteredLinks.some(l =>
            ((l.source as GraphNode).id || l.source) === d.id && ((l.target as GraphNode).id || l.target) === selectedNode.id
          );
          return related ? 0.8 : 0.2;
        }
        return 1;
      });
  }, [hoveredNode, selectedNode, filteredLinks]);

  if (loading) {
    return (
      <div className="flex flex-col h-full items-center justify-center gap-4">
        <Activity className="w-8 h-8 animate-spin text-intel-cyan" />
        <span className="text-sm font-mono text-slate-500">Loading knowledge graph...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full space-y-4 p-3 md:p-6 relative overflow-hidden bg-dot-white/[0.02]">
      <ModuleHeader
        title="Knowledge Graph Explorer"
        subtitle={`${entities.length} entities · ${relations.length} relations · Combined geopolitical & domestic view`}
        icon={Globe}
        statusLabel={usingFallback ? "FALLBACK MODE" : "GRAPH LIVE"}
        nodeId="KG-NODE-01"
      />

      {fetchError && (
        <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-[10px] font-mono text-red-400">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span>API unavailable: {fetchError}. Showing fallback data.</span>
          <button onClick={loadData} className="ml-auto flex items-center gap-1 px-2 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 transition-colors">
            <RotateCw className="w-3 h-3" /> Retry
          </button>
        </div>
      )}

      {usingFallback && !fetchError && (
        <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[10px] font-mono text-amber-400">
          <Info className="w-3.5 h-3.5 shrink-0" />
          <span>Using built-in data (API returned empty). <button onClick={loadData} className="underline hover:text-white">Retry</button></span>
          <button onClick={() => seedGraph().then(loadData).catch(() => {})} className="ml-auto flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 transition-colors">
            <RotateCw className="w-3 h-3" /> Seed & Retry
          </button>
        </div>
      )}

      {/* Controls bar */}
      <div className="flex items-center gap-3 flex-wrap shrink-0">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search actors, institutions..."
            className="w-full bg-[#0a0c10] border border-white/10 rounded-lg pl-9 pr-3 py-2 text-[11px] font-mono text-white placeholder:text-slate-600 focus:outline-none focus:border-intel-cyan/50" />
          {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-white"><X className="w-3 h-3" /></button>}
        </div>
        <div className="flex items-center gap-1.5 text-[9px] font-mono text-slate-600 uppercase"><Filter className="w-3 h-3" /> Group:</div>
        <select value={groupFilter} onChange={e => setGroupFilter(e.target.value as typeof groupFilter)}
          className="bg-[#0a0c10] border border-white/10 rounded-lg px-2 py-1 text-[9px] font-mono text-white">
          <option value="all">All Groups</option>
          <option value="geopolitical">Geopolitical</option>
          <option value="national">National</option>
        </select>
        <div className="flex items-center gap-3 ml-auto">
          <span className="flex items-center gap-1 text-[8px] font-mono" style={{ color: GEO_COLOR }}>
            <span className="w-3 h-0.5 inline-block" style={{ backgroundColor: GEO_COLOR }} /> Geopolitical
          </span>
          <span className="flex items-center gap-1 text-[8px] font-mono" style={{ color: NAT_COLOR }}>
            <span className="w-3 h-0.5 inline-block" style={{ backgroundColor: NAT_COLOR }} /> National
          </span>
        </div>
      </div>

      {/* Main layout */}
      <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0 overflow-hidden">
        {/* Graph */}
        <div className="flex-1 glass rounded-3xl border border-intel-border/30 overflow-hidden relative bg-black/40">
          <svg ref={svgRef} className="w-full h-full cursor-grab active:cursor-grabbing" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }} />
          <div className="absolute left-6 bottom-6 flex flex-col gap-2">
            <button onClick={() => { if (svgRef.current && zoomRef.current) d3.select(svgRef.current).transition().duration(300).call(zoomRef.current.scaleBy, 1.3); }}
              className="w-10 h-10 glass rounded-xl border border-white/10 flex items-center justify-center text-slate-400 hover:text-intel-cyan transition-all shadow-xl"><ZoomIn className="w-5 h-5" /></button>
            <button onClick={() => { if (svgRef.current && zoomRef.current) d3.select(svgRef.current).transition().duration(300).call(zoomRef.current.scaleBy, 1 / 1.3); }}
              className="w-10 h-10 glass rounded-xl border border-white/10 flex items-center justify-center text-slate-400 hover:text-intel-cyan transition-all shadow-xl"><ZoomOut className="w-5 h-5" /></button>
            <button onClick={() => { if (svgRef.current && zoomRef.current) d3.select(svgRef.current).transition().duration(500).call(zoomRef.current.transform, d3.zoomIdentity.translate(0, 0).scale(0.85)); }}
              className="w-10 h-10 glass rounded-xl border border-white/10 flex items-center justify-center text-slate-400 hover:text-intel-cyan transition-all shadow-xl"><RefreshCw className="w-4 h-4" /></button>
          </div>

          {/* Node detail panel */}
          <AnimatePresence>
            {selectedNode && (
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="absolute top-6 left-6 w-80 glass rounded-2xl border border-intel-border/50 bg-[#050a10]/95 p-5 space-y-3 text-[10px] font-mono shadow-2xl backdrop-blur-xl pointer-events-auto max-h-[calc(100%-3rem)] overflow-y-auto">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-base font-bold tracking-tight text-white">{selectedNode.label}</div>
                    <div className="text-slate-600 uppercase text-[8px] font-black mt-0.5">{selectedNode.id} · {selectedNode.group}</div>
                  </div>
                  <button onClick={() => { setSelectedNode(null); setNeighbors(null); }} className="text-slate-600 hover:text-white p-1"><X className="w-4 h-4" /></button>
                </div>
                {selectedNode.domain && selectedNode.domain.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {(selectedNode.domain as string[]).map(d => (
                      <span key={d} className="px-1.5 py-0.5 rounded bg-white/5 text-[7px] text-slate-400 uppercase font-mono">{d}</span>
                    ))}
                  </div>
                )}
                {neighbors && (
                  <div className="space-y-2 pt-2 border-t border-white/5">
                    <div className="text-[7px] text-slate-600 uppercase font-black flex items-center gap-1">
                      <ArrowRight className="w-3 h-3" /> Connected Entities ({neighbors.neighbors.length})
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {neighbors.neighbors.map(n => (
                        <span key={n.id} onClick={() => { const f = nodes.find(node => node.id === n.id); if (f) handleNodeClick(f); }}
                          className="px-2 py-0.5 rounded-full bg-white/5 text-[8px] text-slate-400 border border-white/5 cursor-pointer hover:border-intel-cyan/50 hover:text-white transition-colors">{n.label}</span>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Side panel */}
        <div className="w-full lg:w-[300px] flex flex-col gap-4 overflow-hidden">
          <div className="glass rounded-2xl border border-intel-border/30 p-4 shrink-0">
            <div className="text-[8px] font-mono text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2"><Info className="w-3 h-3" /> Graph Statistics</div>
            <div className="space-y-2">
              {[
                { label: 'Total Entities', value: entities.length, color: '#00f2ff' },
                { label: 'Total Relations', value: relations.length, color: '#a855f7' },
                { label: 'Geopolitical', value: nodes.filter(n => n.group === 'geopolitical').length, color: GEO_COLOR },
                { label: 'National', value: nodes.filter(n => n.group === 'national').length, color: NAT_COLOR },
                { label: 'Visible (filtered)', value: filteredNodes.length, color: '#f59e0b' },
              ].map((s, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-[9px] font-mono text-slate-500">{s.label}</span>
                  <span className="text-sm font-bold font-mono" style={{ color: s.color }}>{s.value}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="glass rounded-2xl border border-intel-border/30 p-4 shrink-0">
            <div className="text-[8px] font-mono text-slate-500 uppercase tracking-widest mb-3">Edge Legend</div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(EDGE_COLORS).map(([type, color]) => (
                <span key={type} className="flex items-center gap-1 text-[8px] font-mono" style={{ color }}>
                  <span className="w-4 h-0.5 inline-block" style={{ backgroundColor: color }} /> {type}
                </span>
              ))}
            </div>
          </div>
          {neighbors && (
            <div className="glass rounded-2xl border border-intel-border/30 p-4 flex-1 overflow-y-auto">
              <div className="text-[8px] font-mono text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                <ArrowRight className="w-3 h-3" /> Relations from {selectedNode?.label}
              </div>
              <div className="space-y-2">
                {neighbors.relations.map(r => {
                  const isOut = r.source_id === selectedNode?.id;
                  const tNode = nodes.find(n => n.id === (isOut ? r.target_id : r.source_id));
                  return (
                    <div key={r.id} className="p-2 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
                      <div className="flex items-center gap-1 text-[8px]">
                        <span className="text-white font-bold">{r.source_id}</span>
                        <span className="text-slate-600">→</span>
                        <span className="text-white font-bold">{r.target_id}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-0.5 rounded" style={{ backgroundColor: EDGE_COLORS[r.type] || '#64748b' }} />
                        <span className="text-[7px] text-slate-500 uppercase">{r.type}</span>
                        <span className="text-[7px] text-slate-600">w={r.weight}</span>
                      </div>
                      {r.description && <div className="text-[7px] text-slate-500 leading-tight">{r.description}</div>}
                      {tNode && <button onClick={() => { const f = nodes.find(n => n.id === tNode!.id); if (f) handleNodeClick(f); }}
                        className="text-[7px] text-intel-cyan hover:text-white transition-colors">Navigate to {tNode.label} →</button>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default KnowledgeGraphExplorer;
