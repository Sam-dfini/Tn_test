/**
 * TunisiaIntel — Investment Intelligence Report Engine
 *
 * Synthesizes platform state into structured reports for
 * entrepreneurs, investors, and NGOs entering Tunisia.
 *
 * The key insight: every section reads from live model outputs.
 * When conditions change, the report changes.
 *
 * Covers:
 *   - Timing assessment (should you go now, wait, or defer?)
 *   - Location intelligence (top governorates by use case)
 *   - Risk scenarios (base/deterioration/improvement)
 *   - Structural constraints (FX, labor, regulatory)
 *   - Regime risk assessment (from Gov Agent)
 *   - Watch indicators (model signals triggering reassessment)
 *   - Sector-specific analysis
 */

// ── Types ──────────────────────────────────────────────────────

export type InvestorProfile =
  | 'ENTREPRENEUR_SME'    // Small business, services, retail
  | 'INVESTOR_FDI'        // Foreign direct investment, manufacturing
  | 'NGO_DEVELOPMENT'     // Development, humanitarian, civil society
  | 'INVESTOR_FINANCIAL'  // Financial instruments, bonds, equities
  | 'GOVERNMENT_PARTNER'; // B2G, public contracts, infrastructure

export type Sector =
  | 'DIGITAL_TECH'
  | 'MANUFACTURING_LIGHT'
  | 'MANUFACTURING_HEAVY'
  | 'AGRIBUSINESS'
  | 'TOURISM_HOSPITALITY'
  | 'ENERGY_RENEWABLE'
  | 'LOGISTICS_TRANSPORT'
  | 'FINANCIAL_SERVICES'
  | 'HEALTHCARE'
  | 'EDUCATION_TRAINING'
  | 'RETAIL_CONSUMER'
  | 'CONSTRUCTION_REAL_ESTATE';

export type InvestmentHorizon = 'SHORT' | 'MEDIUM' | 'LONG'; // <1y, 1-3y, 3-10y

export type TimingVerdict =
  | 'ENTER_NOW'         // Conditions favorable, act
  | 'CONDITIONAL_ENTRY' // Viable but specific conditions must be met first
  | 'WAIT_FOR_TRIGGER'  // Clear trigger conditions identified, wait
  | 'DEFER'             // Conditions unfavorable, defer 12+ months
  | 'AVOID';            // Structural barriers too high for this profile

export interface ReportQuery {
  profile: InvestorProfile;
  sector: Sector;
  horizon: InvestmentHorizon;
  capitalScale: 'MICRO' | 'SMALL' | 'MEDIUM' | 'LARGE'; // <50K, 50K-500K, 500K-5M, >5M USD
  preferredRegion?: string; // optional: specific governorate or 'coastal' / 'interior'
}

export interface GovernorateScore {
  name: string;
  overall: number;           // 0-100
  infrastructure: number;    // grid reliability, roads, telecoms
  labor: number;             // workforce quality, cost, availability
  logistics: number;         // port/highway access, transport time
  socialRisk: number;        // protest risk, security — lower is better
  bureaucracy: number;       // permit speed, corruption exposure
  economy: number;           // market size, purchasing power, competitors
  recommendation: 'RECOMMENDED' | 'VIABLE' | 'CAUTION' | 'AVOID';
  rationale: string;
  keyStrengths: string[];
  keyRisks: string[];
}

export interface RiskScenario {
  label: 'BASE_CASE' | 'DETERIORATION' | 'IMPROVEMENT';
  probability: number;       // 0-1
  timeframe: string;
  rriTrajectory: string;
  investmentImpact: string;
  triggerConditions: string[];
  mitigationActions: string[];
}

export interface StructuralConstraint {
  category: 'FX_REPATRIATION' | 'LABOR' | 'REGULATORY' | 'INFRASTRUCTURE' | 'FINANCING';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  currentState: string;
  workaround?: string;
  timeToResolve?: string;
}

export interface WatchIndicator {
  signal: string;
  currentValue: string;
  threshold: string;
  interpretation: string;
  action: string;            // what investor should do when this triggers
  probability: number;
}

export interface InvestmentIntelReport {
  // Meta
  query: ReportQuery;
  generatedAt: string;
  modelState: {
    rri: number; p_rev: number; velocity: string;
    fxReserves: number; inflation: number;
    imfDealProb: number; ugttLevel: string;
  };

  // Executive summary
  executiveSummary: string;          // 3 sentences
  timingVerdict: TimingVerdict;
  timingRationale: string;
  confidenceScore: number;           // 0-100, how confident in assessment
  entryWindow: string;               // "Q4 2026", "Immediate", "12-18 months"

  // Trigger conditions (for WAIT verdicts)
  entryTriggers: Array<{
    condition: string;
    currentValue: string;
    targetValue: string;
    probability: number;
    estimatedDate: string;
  }>;

  // Location intelligence
  governorateRankings: GovernorateScore[];
  topGovernorate: GovernorateScore;
  avoidZones: string[];

  // Risk scenarios
  scenarios: RiskScenario[];

  // Structural constraints
  structuralConstraints: StructuralConstraint[];
  criticalConstraint: StructuralConstraint | null;

  // Regime risk (from Gov Agent)
  regimeRiskAssessment: string;
  predictedRegimeActions: string[];
  regimeThreatLevel: string;

  // Watch indicators
  watchIndicators: WatchIndicator[];

  // Sector analysis
  sectorAnalysis: {
    sectorLabel: string;
    viabilityScore: number;        // 0-100
    keyOpportunity: string;
    keyChallenge: string;
    comparableSuccesses: string;
    estimatedROIHorizon: string;
    marketSize: string;
    competitorLandscape: string;
  };

  // Actionable next steps
  immediateActions: string[];
  resourceLinks: string[];
}

// ── Governorate Intelligence Database ─────────────────────────
// Calibrated to Tunisia 2026 conditions

const GOVERNORATE_DATABASE: Record<string, {
  infrastructure: number;
  labor: number;
  logistics: number;
  baseSocialRisk: number;
  bureaucracy: number;
  economy: number;
  keyIndustries: string[];
  ports: string[];
  distanceToTunis: number;  // km
  powerOutageHours: number; // daily average
  techPark: boolean;
  freeZone: boolean;
}> = {
  'Tunis': {
    infrastructure: 82, labor: 85, logistics: 80,
    baseSocialRisk: 32, bureaucracy: 55, economy: 88,
    keyIndustries: ['finance', 'tech', 'services', 'government'],
    ports: ['La Goulette'], distanceToTunis: 0,
    powerOutageHours: 1.5, techPark: true, freeZone: false,
  },
  'Sfax': {
    infrastructure: 72, labor: 75, logistics: 85,
    baseSocialRisk: 45, bureaucracy: 60, economy: 75,
    keyIndustries: ['olive oil', 'fishing', 'manufacturing', 'services'],
    ports: ['Sfax Port'], distanceToTunis: 270,
    powerOutageHours: 2.5, techPark: false, freeZone: false,
  },
  'Sousse': {
    infrastructure: 78, labor: 72, logistics: 75,
    baseSocialRisk: 28, bureaucracy: 58, economy: 72,
    keyIndustries: ['tourism', 'textiles', 'automotive components'],
    ports: ['Sousse Port'], distanceToTunis: 140,
    powerOutageHours: 2.0, techPark: true, freeZone: true,
  },
  'Nabeul': {
    infrastructure: 75, labor: 70, logistics: 72,
    baseSocialRisk: 22, bureaucracy: 55, economy: 68,
    keyIndustries: ['ceramics', 'tourism', 'agribusiness'],
    ports: [], distanceToTunis: 65,
    powerOutageHours: 1.8, techPark: false, freeZone: false,
  },
  'Monastir': {
    infrastructure: 74, labor: 70, logistics: 72,
    baseSocialRisk: 25, bureaucracy: 56, economy: 65,
    keyIndustries: ['textiles', 'tourism', 'manufacturing'],
    ports: ['Monastir Airport'], distanceToTunis: 160,
    powerOutageHours: 2.0, techPark: false, freeZone: true,
  },
  'Bizerte': {
    infrastructure: 70, labor: 68, logistics: 78,
    baseSocialRisk: 30, bureaucracy: 60, economy: 62,
    keyIndustries: ['petrochemicals', 'steelworks', 'fishing'],
    ports: ['Bizerte Port'], distanceToTunis: 65,
    powerOutageHours: 2.2, techPark: false, freeZone: true,
  },
  'Gafsa': {
    infrastructure: 52, labor: 58, logistics: 45,
    baseSocialRisk: 78, bureaucracy: 65, economy: 42,
    keyIndustries: ['phosphate mining', 'CPG'],
    ports: [], distanceToTunis: 360,
    powerOutageHours: 5.5, techPark: false, freeZone: false,
  },
  'Kasserine': {
    infrastructure: 48, labor: 55, logistics: 42,
    baseSocialRisk: 82, bureaucracy: 68, economy: 38,
    keyIndustries: ['agriculture', 'livestock'],
    ports: [], distanceToTunis: 280,
    powerOutageHours: 6.0, techPark: false, freeZone: false,
  },
  'Sidi Bouzid': {
    infrastructure: 50, labor: 56, logistics: 44,
    baseSocialRisk: 75, bureaucracy: 67, economy: 40,
    keyIndustries: ['agriculture', 'livestock', 'cereals'],
    ports: [], distanceToTunis: 265,
    powerOutageHours: 5.8, techPark: false, freeZone: false,
  },
};

// ── Sector Analysis Database ───────────────────────────────────

const SECTOR_INTELLIGENCE: Record<Sector, {
  label: string;
  viabilityBase: number;
  fxSensitivity: 'HIGH' | 'MEDIUM' | 'LOW';
  ugttExposure: 'HIGH' | 'MEDIUM' | 'LOW';
  capitalIntensity: 'HIGH' | 'MEDIUM' | 'LOW';
  bestRegions: string[];
  opportunity: string;
  challenge: string;
  comparables: string;
  roiHorizon: string;
  marketSizeNote: string;
  competitors: string;
}> = {
  DIGITAL_TECH: {
    label: 'Digital & Technology',
    viabilityBase: 78,
    fxSensitivity: 'MEDIUM',
    ugttExposure: 'LOW',
    capitalIntensity: 'LOW',
    bestRegions: ['Tunis', 'Sousse', 'Sfax'],
    opportunity: 'Deep engineering talent pool, 3,500+ engineers emigrating annually — many remain. EU time zone alignment. Government digitalization contracts available.',
    challenge: 'Talent retention is critical: 60% of PhDs emigrate. Salary expectations rising with diaspora benchmarking. BCT foreign currency payment restrictions for SaaS subscriptions.',
    comparables: 'Vermeg (fintech), Talan Group (IT services), IntiGo — all scaled from Tunis base.',
    roiHorizon: '18-36 months to profitability for services model',
    marketSizeNote: '~$800M IT sector (2025 est.), growing 12% YoY driven by government digitalization',
    competitors: 'IBM Tunisia, Accenture Tunisia, local players; limited competition in AI/ML space',
  },
  MANUFACTURING_LIGHT: {
    label: 'Light Manufacturing',
    viabilityBase: 65,
    fxSensitivity: 'HIGH',
    ugttExposure: 'HIGH',
    capitalIntensity: 'MEDIUM',
    bestRegions: ['Sousse', 'Monastir', 'Bizerte', 'Sfax'],
    opportunity: 'Automotive components (Leoni, Nexans precedent), electronics assembly, textile/apparel with EU preferential access. Free zone benefits available.',
    challenge: 'UGTT collective bargaining mandatory in many subsectors. Power grid reliability in interior. Profit repatriation requires BCT approval — currently 6-12 month delays.',
    comparables: 'Leoni (cables, 40,000 employees), Aptiv, Yazaki — all operating near-shore manufacturing.',
    roiHorizon: '3-5 years for capital recovery',
    marketSizeNote: 'Manufacturing exports €7B/year, 80% to EU. EU Association Agreement provides tariff access.',
    competitors: 'Morocco competing for same FDI — Morocco has better FX regime currently',
  },
  MANUFACTURING_HEAVY: {
    label: 'Heavy Manufacturing',
    viabilityBase: 35,
    fxSensitivity: 'HIGH',
    ugttExposure: 'HIGH',
    capitalIntensity: 'HIGH',
    bestRegions: ['Bizerte', 'Sfax'],
    opportunity: 'Limited. Petrochemicals at Bizerte, steel at Menzel Bourguiba have existing infrastructure.',
    challenge: 'Energy reliability is critical constraint. Grid cannot support heavy industry in interior. BCT FX restrictions severely impact equipment import/capital servicing. High UGTT exposure.',
    comparables: 'Few recent entrants. Existing plants are legacy investments pre-2011.',
    roiHorizon: '7-12 years — too long given current political risk horizon',
    marketSizeNote: 'Domestic heavy industry market limited. Must export — requires FX regime stability.',
    competitors: 'Morocco, Egypt have better infrastructure and FX regimes for this sector',
  },
  AGRIBUSINESS: {
    label: 'Agribusiness',
    viabilityBase: 60,
    fxSensitivity: 'MEDIUM',
    ugttExposure: 'LOW',
    capitalIntensity: 'MEDIUM',
    bestRegions: ['Nabeul', 'Sousse', 'Sfax', 'Sidi Bouzid'],
    opportunity: 'Olive oil (Tunisia #2 global exporter), dates, tomatoes, citrus. EU organic certification demand. Water stress is creating consolidation opportunities.',
    challenge: 'Water rights increasingly contested. Climate variability (drought 2022-2024). Land registration complexity. Rural supply chain underdevelopment.',
    comparables: 'Délice Danone JV, Tunisie Lait — food processing succeeds with local partnership.',
    roiHorizon: '3-7 years depending on crop cycle',
    marketSizeNote: 'Agriculture 10.1% of GDP. Olive oil exports $1.2B/year peak.',
    competitors: 'Morocco, Spain in EU olive market. Domestic consolidators active.',
  },
  TOURISM_HOSPITALITY: {
    label: 'Tourism & Hospitality',
    viabilityBase: 70,
    fxSensitivity: 'MEDIUM',
    ugttExposure: 'MEDIUM',
    capitalIntensity: 'MEDIUM',
    bestRegions: ['Sousse', 'Nabeul', 'Monastir', 'Tunis'],
    opportunity: 'Post-COVID recovery — tourism revenue $2.1B (2025) recovering toward $3B potential. Heritage tourism underdeveloped vs beach package tourism. High-end boutique hotel gap.',
    challenge: 'Seasonal concentration (May-Sept). Political instability perception discount. UGTT in hotel sector is organized. Security incidents (2015 legacy) still affect some European market segments.',
    comparables: 'Les Orangers (boutique), Laico hotels, Club Med — range of models viable.',
    roiHorizon: '4-8 years for hotel property',
    marketSizeNote: 'Pre-COVID high was 9.4M tourists. 2025: ~7.5M. Potential at political normalization: 12M+.',
    competitors: 'Morocco increasingly dominant in premium/heritage segment',
  },
  ENERGY_RENEWABLE: {
    label: 'Renewable Energy',
    viabilityBase: 72,
    fxSensitivity: 'MEDIUM',
    ugttExposure: 'LOW',
    capitalIntensity: 'HIGH',
    bestRegions: ['Sfax', 'Tataouine', 'Tozeur', 'Bizerte'],
    opportunity: 'STEG debt $4.2B creates desperate need for IPP arrangements. Solar irradiation among highest in Mediterranean. Government ELMED interconnector project creates export route to Italy.',
    challenge: 'PPA negotiation with STEG is slow (STEG itself is stressed). BCT FX for project financing. Permitting 18-24 months. Political risk to long-term contract sanctity.',
    comparables: 'TotalEnergies (Tataouine solar), Engie (wind Thyna) — major players present.',
    roiHorizon: '8-15 years (infrastructure timeline)',
    marketSizeNote: 'Tunisia renewable target: 35% by 2030 (currently 4.1%). Gap = opportunity.',
    competitors: 'European majors dominating large-scale; SME gap in distributed generation',
  },
  LOGISTICS_TRANSPORT: {
    label: 'Logistics & Transport',
    viabilityBase: 58,
    fxSensitivity: 'HIGH',
    ugttExposure: 'MEDIUM',
    capitalIntensity: 'MEDIUM',
    bestRegions: ['Tunis', 'Sfax', 'Bizerte', 'Sousse'],
    opportunity: 'E-commerce logistics underdeveloped. Last-mile delivery gap. Cold chain for agriculture. Port logistics at Sfax needs private operators.',
    challenge: 'Informal logistics sector is large and price-competitive. BCT FX restrictions on imported vehicles/equipment. UGTT in transport sector.',
    comparables: 'DHL, Aramex present — gap at mid-market regional level.',
    roiHorizon: '2-4 years for asset-light models',
    marketSizeNote: 'Logistics market ~$1.8B, fragmented, 60%+ informal sector.',
    competitors: 'Informal sector (difficult to displace on price), regional players',
  },
  FINANCIAL_SERVICES: {
    label: 'Financial Services',
    viabilityBase: 45,
    fxSensitivity: 'CRITICAL' as any,
    ugttExposure: 'LOW',
    capitalIntensity: 'MEDIUM',
    bestRegions: ['Tunis'],
    opportunity: 'Fintech gap significant — only 37% banked adults. Mobile payment penetration low. Microfinance demand very high.',
    challenge: 'BCT heavily regulates financial services. FX restrictions are existential for cross-border fintech. Licensing takes 18-36 months. Banking sector NPL ratios elevated.',
    comparables: 'Enda Tamweel (microfinance success), limited fintech exits.',
    roiHorizon: '5-8 years given regulatory friction',
    marketSizeNote: '11M unbanked/underbanked adults. Significant microfinance demand.',
    competitors: 'State banks dominant. Limited private competition at SME level.',
  },
  HEALTHCARE: {
    label: 'Healthcare',
    viabilityBase: 68,
    fxSensitivity: 'MEDIUM',
    ugttExposure: 'MEDIUM',
    capitalIntensity: 'HIGH',
    bestRegions: ['Tunis', 'Sousse', 'Sfax'],
    opportunity: 'Medical tourism from Libya/Algeria ($300M+ market). Private hospital gap. Pharmaceutical manufacturing with EU certification potential.',
    challenge: 'Brain drain of doctors (800/year emigrating). Public procurement delays. Pharmaceutical import FX restrictions cause medicine shortages.',
    comparables: 'Polyclinique El Manar, Clinique Les Berges du Lac — private hospital models.',
    roiHorizon: '5-10 years',
    marketSizeNote: 'Healthcare 6.1% of GDP. Medical tourism potential $500M+ if political stability improves.',
    competitors: 'Limited direct competition at premium level. State system under-resourced.',
  },
  EDUCATION_TRAINING: {
    label: 'Education & Training',
    viabilityBase: 62,
    fxSensitivity: 'LOW',
    ugttExposure: 'MEDIUM',
    capitalIntensity: 'LOW',
    bestRegions: ['Tunis', 'Sousse', 'Sfax'],
    opportunity: 'Private higher education demand high. Vocational training gap matches FDI labor needs. E-learning infrastructure improving.',
    challenge: 'Ministry of Education accreditation slow and opaque. Brain drain reduces faculty pool. Market price sensitivity (low household incomes).',
    comparables: 'ESPRIT, ESB — private universities with EU partnerships.',
    roiHorizon: '3-6 years',
    marketSizeNote: '200,000+ university graduates/year. Significant skills mismatch vs labor market.',
    competitors: 'Public universities (free but quality gap). Few strong private players.',
  },
  RETAIL_CONSUMER: {
    label: 'Retail & Consumer',
    viabilityBase: 55,
    fxSensitivity: 'HIGH',
    ugttExposure: 'LOW',
    capitalIntensity: 'LOW',
    bestRegions: ['Tunis', 'Sousse', 'Sfax'],
    opportunity: 'Modern retail penetration low outside Tunis. E-commerce early stage. Premium consumer goods gap.',
    challenge: 'Parallel (informal) market for consumer goods is massive. Purchasing power constrained by inflation 7.1%. FX for imported inventory is challenging.',
    comparables: 'Carrefour Tunisia, Monoprix — established mid-market. Limited premium players.',
    roiHorizon: '2-5 years',
    marketSizeNote: 'Retail market $15B+. But 47% informal economy distorts formal market share.',
    competitors: 'Informal market dominant at price-sensitive end.',
  },
  CONSTRUCTION_REAL_ESTATE: {
    label: 'Construction & Real Estate',
    viabilityBase: 40,
    fxSensitivity: 'HIGH',
    ugttExposure: 'HIGH',
    capitalIntensity: 'HIGH',
    bestRegions: ['Tunis', 'Sousse'],
    opportunity: 'Housing deficit significant. Commercial real estate for FDI-adjacent office space needed.',
    challenge: 'Land registration is one of the most difficult bureaucratic processes in Tunisia. Construction permits 6-12 months. FX for materials. UGTT in construction.',
    comparables: 'Limited successful FDI in this sector. Mostly local developers.',
    roiHorizon: '7-15 years',
    marketSizeNote: 'Housing deficit estimated at 400,000 units. But purchasing power gap limits returns.',
    competitors: 'Local developers with political connections dominate.',
  },
};

// ── Timing Assessment Engine ───────────────────────────────────

function assessTiming(
  query: ReportQuery,
  rriState: any,
  data: any,
  govAssessment: any
): {
  verdict: TimingVerdict;
  rationale: string;
  window: string;
  triggers: InvestmentIntelReport['entryTriggers'];
  confidence: number;
} {
  const fx = data?.economy?.fx_reserves ?? 84;
  const inflation = data?.economy?.inflation ?? 7.1;
  const imf = data?.geopolitical?.imf_deal_probability ?? 31;
  const velocity = rriState.velocity ?? 0.18;
  const rri = rriState.rri ?? 2.31;
  const ugtt = data?.social?.ugtt_mobilisation_level ?? 'ELEVATED';

  const sector = SECTOR_INTELLIGENCE[query.sector];
  const isFXSensitive = sector.fxSensitivity === 'HIGH' || sector.fxSensitivity === 'CRITICAL' as any;
  const isCapitalHeavy = sector.capitalIntensity === 'HIGH';
  const isLongHorizon = query.horizon === 'LONG';
  const isMicroOrSmall = query.capitalScale === 'MICRO' || query.capitalScale === 'SMALL';

  // AVOID conditions
  if (sector.viabilityBase < 40 && !isLongHorizon) {
    return {
      verdict: 'AVOID',
      rationale: `Sector viability score is ${sector.viabilityBase}/100 under current conditions. Structural barriers exceed returns on the ${query.horizon} horizon selected.`,
      window: '18-24 months minimum',
      triggers: [],
      confidence: 75,
    };
  }

  // DEFER conditions: FX crisis approaching + capital-heavy + short horizon
  if (fx < 72 && isCapitalHeavy && !isLongHorizon) {
    return {
      verdict: 'DEFER',
      rationale: `FX reserves at ${fx} days approaching crisis threshold. Capital-intensive investment in this sector carries repatriation risk that is currently unacceptable.`,
      window: '12-18 months',
      triggers: [{
        condition: 'FX reserves above 90 days',
        currentValue: `${fx} days`,
        targetValue: '90+ days',
        probability: 0.45,
        estimatedDate: 'Q3-Q4 2026',
      }],
      confidence: 70,
    };
  }

  // WAIT conditions: IMF unresolved + high FX sensitivity + medium/large capital
  if (imf < 40 && isFXSensitive && !isMicroOrSmall) {
    const triggers: InvestmentIntelReport['entryTriggers'] = [
      {
        condition: 'IMF deal probability exceeds 60%',
        currentValue: `${imf}%`,
        targetValue: '60%+',
        probability: 0.48,
        estimatedDate: 'Q4 2026',
      },
      {
        condition: 'FX reserves above 100 days',
        currentValue: `${fx} days`,
        targetValue: '100+ days',
        probability: 0.42,
        estimatedDate: 'Q4 2026 – Q1 2027',
      },
    ];

    return {
      verdict: 'WAIT_FOR_TRIGGER',
      rationale: `Investment case is structurally valid but IMF financing resolution is a prerequisite for FX-sensitive sectors. At ${imf}% deal probability, the BCT cannot guarantee currency convertibility for profits. Entry before IMF resolution exposes capital to repatriation freeze risk.`,
      window: 'Q4 2026 – Q1 2027 (conditional on IMF/FX triggers)',
      triggers,
      confidence: 72,
    };
  }

  // CONDITIONAL ENTRY: viable with specific actions required first
  if ((rri > 2.2 && velocity > 0.12) || ugtt === 'HIGH') {
    const conditions: string[] = [];
    if (ugtt === 'HIGH') conditions.push('Await UGTT formal action resolution before committing to labor-intensive structures');
    if (velocity > 0.12) conditions.push('Structure for rapid exit/pause — do not commit to 3+ year fixed costs until V(t) stabilizes below 0.10');
    if (isFXSensitive) conditions.push('Establish dual-currency invoicing structure before entering');

    return {
      verdict: 'CONDITIONAL_ENTRY',
      rationale: `Core opportunity remains viable. System velocity at V(t)=${velocity.toFixed(3)} and ${ugtt} UGTT mobilisation require specific structural precautions before capital commitment.`,
      window: 'Now, with preconditions',
      triggers: conditions.map((c, i) => ({
        condition: c,
        currentValue: i === 0 ? ugtt : velocity.toFixed(3),
        targetValue: i === 0 ? 'MODERATE' : 'Below 0.10',
        probability: 0.55 + i * 0.05,
        estimatedDate: '30-90 days',
      })),
      confidence: 65,
    };
  }

  // ENTER NOW: favorable conditions
  if (rri < 2.2 && fx > 90 && imf > 50 && velocity < 0.10) {
    return {
      verdict: 'ENTER_NOW',
      rationale: 'Political risk metrics are within acceptable range for this profile. FX reserves adequate, IMF relationship stable, system velocity low. Current entry captures pre-normalization discount.',
      window: 'Immediate',
      triggers: [],
      confidence: 78,
    };
  }

  // Default: conditional entry
  return {
    verdict: 'CONDITIONAL_ENTRY',
    rationale: `Tunisia presents a viable but carefully managed entry. R(t)=${rri.toFixed(2)}, FX=${fx}d, IMF=${imf}%. Sector fundamentals support investment but macro conditions require hedging structure.`,
    window: 'Now, with preconditions',
    triggers: isFXSensitive ? [{
      condition: 'Establish FX hedging or offshore invoicing structure',
      currentValue: 'Not yet structured',
      targetValue: 'Dual-currency or offshore entity in place',
      probability: 0.90,
      estimatedDate: '30-60 days (legal setup)',
    }] : [],
    confidence: 62,
  };
}

// ── Location Ranker ────────────────────────────────────────────

function rankGovernorates(
  query: ReportQuery,
  rriState: any,
  cascadeRisks?: Array<{ name: string; risk: number }>
): GovernorateScore[] {
  const sector = SECTOR_INTELLIGENCE[query.sector];
  const isCoastalFocus = query.preferredRegion?.toLowerCase().includes('coast');
  const isInteriorFocus = query.preferredRegion?.toLowerCase().includes('interior');

  const scores: GovernorateScore[] = [];

  for (const [name, profile] of Object.entries(GOVERNORATE_DATABASE)) {
    // Skip if explicit regional filter applies
    const isCoastal = ['Tunis','Sfax','Sousse','Nabeul','Monastir','Bizerte'].includes(name);
    if (isCoastalFocus && !isCoastal) continue;
    if (isInteriorFocus && isCoastal) continue;

    // Cascade risk adjustment
    const cascadeEntry = cascadeRisks?.find(c => c.name === name);
    const cascadeAdjustment = cascadeEntry ? cascadeEntry.risk * 0.3 : 0;

    // Social risk = base + cascade adjustment
    const socialRisk = Math.min(100, profile.baseSocialRisk + cascadeAdjustment);

    // Sector-specific weights
    const sectorWeights = getSectorWeights(query.sector);

    const overall = Math.round(
      profile.infrastructure * sectorWeights.infrastructure +
      profile.labor * sectorWeights.labor +
      profile.logistics * sectorWeights.logistics +
      (100 - socialRisk) * sectorWeights.security +
      profile.bureaucracy * sectorWeights.bureaucracy +
      profile.economy * sectorWeights.economy
    );

    // Recommendation
    const isBestRegion = sector.bestRegions.includes(name);
    const rec: GovernorateScore['recommendation'] =
      overall >= 72 && isBestRegion ? 'RECOMMENDED' :
      overall >= 60 ? 'VIABLE' :
      overall >= 45 ? 'CAUTION' : 'AVOID';

    // Rationale
    const rationale = buildGovernorateRationale(name, profile, query.sector, rec, overall);
    const strengths = buildStrengths(name, profile, query.sector);
    const risks = buildRisks(name, profile, socialRisk, query.sector);

    scores.push({
      name, overall,
      infrastructure: profile.infrastructure,
      labor: profile.labor,
      logistics: profile.logistics,
      socialRisk: Math.round(socialRisk),
      bureaucracy: profile.bureaucracy,
      economy: profile.economy,
      recommendation: rec,
      rationale, keyStrengths: strengths, keyRisks: risks,
    });
  }

  return scores.sort((a, b) => b.overall - a.overall).slice(0, 6);
}

function getSectorWeights(sector: Sector): Record<string,number> {
  const weights: Record<Sector, Record<string,number>> = {
    DIGITAL_TECH:         { infrastructure: 0.15, labor: 0.30, logistics: 0.10, security: 0.20, bureaucracy: 0.15, economy: 0.10 },
    MANUFACTURING_LIGHT:  { infrastructure: 0.20, labor: 0.25, logistics: 0.20, security: 0.15, bureaucracy: 0.10, economy: 0.10 },
    MANUFACTURING_HEAVY:  { infrastructure: 0.30, labor: 0.15, logistics: 0.25, security: 0.15, bureaucracy: 0.10, economy: 0.05 },
    AGRIBUSINESS:         { infrastructure: 0.15, labor: 0.20, logistics: 0.20, security: 0.20, bureaucracy: 0.10, economy: 0.15 },
    TOURISM_HOSPITALITY:  { infrastructure: 0.15, labor: 0.20, logistics: 0.15, security: 0.25, bureaucracy: 0.10, economy: 0.15 },
    ENERGY_RENEWABLE:     { infrastructure: 0.25, labor: 0.10, logistics: 0.20, security: 0.20, bureaucracy: 0.15, economy: 0.10 },
    LOGISTICS_TRANSPORT:  { infrastructure: 0.20, labor: 0.15, logistics: 0.30, security: 0.15, bureaucracy: 0.10, economy: 0.10 },
    FINANCIAL_SERVICES:   { infrastructure: 0.10, labor: 0.25, logistics: 0.05, security: 0.20, bureaucracy: 0.25, economy: 0.15 },
    HEALTHCARE:           { infrastructure: 0.20, labor: 0.30, logistics: 0.10, security: 0.15, bureaucracy: 0.15, economy: 0.10 },
    EDUCATION_TRAINING:   { infrastructure: 0.10, labor: 0.25, logistics: 0.10, security: 0.20, bureaucracy: 0.15, economy: 0.20 },
    RETAIL_CONSUMER:      { infrastructure: 0.10, labor: 0.20, logistics: 0.20, security: 0.20, bureaucracy: 0.10, economy: 0.20 },
    CONSTRUCTION_REAL_ESTATE: { infrastructure: 0.15, labor: 0.20, logistics: 0.20, security: 0.20, bureaucracy: 0.25, economy: 0.00 },
  };
  return weights[sector] ?? { infrastructure: 0.20, labor: 0.20, logistics: 0.20, security: 0.15, bureaucracy: 0.15, economy: 0.10 };
}

function buildGovernorateRationale(
  name: string, profile: any, sector: Sector, rec: string, score: number
): string {
  const si = SECTOR_INTELLIGENCE[sector];
  if (si.bestRegions.includes(name)) {
    return `${name} is among the preferred regions for ${si.label}. Score ${score}/100. ` +
      (profile.freeZone ? 'Free zone benefits available. ' : '') +
      (profile.techPark ? 'Technology park infrastructure present. ' : '') +
      `Power outages average ${profile.powerOutageHours}h/day.`;
  }
  if (rec === 'AVOID') {
    return `${name} is not recommended for ${si.label}. Social risk score ${profile.baseSocialRisk}/100 and infrastructure score ${profile.infrastructure}/100 create unacceptable operational friction for this sector.`;
  }
  return `${name} viable but not optimal for ${si.label}. Score ${score}/100. Consider if specific local factors (supplier proximity, specific labor pool) justify the compromise.`;
}

function buildStrengths(name: string, profile: any, sector: Sector): string[] {
  const s: string[] = [];
  if (profile.infrastructure >= 75) s.push(`Strong infrastructure (${profile.infrastructure}/100)`);
  if (profile.labor >= 75) s.push(`Skilled labor pool available`);
  if (profile.logistics >= 75) s.push(`Excellent logistics access${profile.ports.length ? ': ' + profile.ports.join(', ') : ''}`);
  if (profile.baseSocialRisk < 35) s.push(`Low social risk environment`);
  if (profile.freeZone) s.push('Free zone tax and customs advantages');
  if (profile.techPark) s.push('Technology park co-location available');
  if (profile.powerOutageHours < 2) s.push('Reliable power grid');
  return s.slice(0, 3);
}

function buildRisks(name: string, profile: any, socialRisk: number, sector: Sector): string[] {
  const r: string[] = [];
  if (socialRisk > 55) r.push(`Elevated social risk (${Math.round(socialRisk)}/100) — protest exposure`);
  if (profile.powerOutageHours > 4) r.push(`Power grid unreliable — ${profile.powerOutageHours}h/day average outage`);
  if (profile.bureaucracy < 55) r.push('High bureaucratic friction — permit delays expected');
  if (profile.logistics < 50) r.push('Limited logistics infrastructure');
  if (profile.distanceToTunis > 300) r.push(`Remote location — ${profile.distanceToTunis}km from capital`);
  return r.slice(0, 3);
}

// ── Structural Constraints Builder ────────────────────────────

function buildConstraints(
  query: ReportQuery,
  data: any,
  rriState: any
): StructuralConstraint[] {
  const fx = data?.economy?.fx_reserves ?? 84;
  const sector = SECTOR_INTELLIGENCE[query.sector];
  const constraints: StructuralConstraint[] = [];

  // FX Repatriation — always present, severity varies
  const fxSeverity: StructuralConstraint['severity'] =
    fx < 75 ? 'CRITICAL' : fx < 90 ? 'HIGH' : 'MEDIUM';
  constraints.push({
    category: 'FX_REPATRIATION',
    severity: fxSeverity,
    title: 'Foreign Currency Repatriation Restrictions',
    currentState: `BCT reserves at ${fx} days of import cover. Profit repatriation currently requires BCT approval averaging 6-12 months. Dividends to foreign shareholders subject to annual ceiling.`,
    workaround: 'Structure investment through offshore holding company (Malta, Netherlands, UAE). Invoice services to Tunisian subsidiary from offshore entity. Reduces repatriation friction significantly.',
    timeToResolve: fx < 85 ? 'Unresolved until IMF deal. 12-18 months.' : '6-12 months post-IMF deal',
  });

  // Labor — if UGTT exposure is high
  if (sector.ugttExposure === 'HIGH' || sector.ugttExposure === 'MEDIUM') {
    const ugtt = data?.social?.ugtt_mobilisation_level ?? 'ELEVATED';
    constraints.push({
      category: 'LABOR',
      severity: ugtt === 'HIGH' ? 'HIGH' : 'MEDIUM',
      title: 'UGTT Collective Bargaining Exposure',
      currentState: `UGTT mobilisation at ${ugtt}. In ${sector.label}, collective bargaining agreements are mandatory in most subsectors. Individual contracts limited above 10 employees in organized sectors.`,
      workaround: 'Structure initial headcount below collective bargaining thresholds. Use freelance/contractor arrangements for first 12-18 months. Engage local labor law specialist before hiring.',
      timeToResolve: 'Structural — not time-limited. Budget for collective agreement negotiations.',
    });
  }

  // Regulatory — always present
  constraints.push({
    category: 'REGULATORY',
    severity: 'MEDIUM',
    title: 'Investment Authorization & Permit Delays',
    currentState: `Foreign investment requires FIPA (Foreign Investment Promotion Agency) authorization. Processing: 15-90 days depending on sector. Construction permits: average 47 days. Environmental clearances: 90-180 days for manufacturing.`,
    workaround: 'Engage FIPA advisor from day 1. Use FIPA\'s one-stop-shop mechanism. Budget 6 months from authorization filing to operational launch.',
    timeToResolve: '3-6 months with proper preparation',
  });

  // Infrastructure — if power-dependent
  if (sector.capitalIntensity !== 'LOW') {
    const outages = rriState.category_scores?.H ?? 0.6;
    if (outages < 0.65) {
      constraints.push({
        category: 'INFRASTRUCTURE',
        severity: 'MEDIUM',
        title: 'Power Grid Reliability',
        currentState: 'Average 2-6h/day outages depending on governorate. Interior regions worse than coastal. STEG debt $4.2B constrains grid investment.',
        workaround: 'Budget for on-site generator/UPS. Solar + battery backup viable for <500kW demand. Free zone locations typically have priority grid access.',
        timeToResolve: 'Structural — 3-5 years for grid improvement',
      });
    }
  }

  // Financing
  if (query.capitalScale !== 'MICRO') {
    constraints.push({
      category: 'FINANCING',
      severity: 'MEDIUM',
      title: 'Local Financing Access',
      currentState: 'Tunisian bank NPL ratios elevated (~15%). Credit to SMEs constrained. Foreign investor local borrowing possible but at 12-15% rates. Development finance (BERD, IFC) available for qualifying projects.',
      workaround: 'EIB, IFC, AfDB all have active Tunisia programs. European Neighborhood Instrument provides blended finance for qualifying SMEs. Local banks viable only for short-term working capital.',
      timeToResolve: 'Immediate if engaging development finance institutions',
    });
  }

  // Sort by severity
  const sevOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
  return constraints.sort((a, b) => sevOrder[a.severity] - sevOrder[b.severity]);
}

// ── Risk Scenarios Builder ─────────────────────────────────────

function buildScenarios(
  rriState: any,
  data: any
): RiskScenario[] {
  const velocity = rriState.velocity ?? 0.18;
  const rri = rriState.rri ?? 2.31;
  const fx = data?.economy?.fx_reserves ?? 84;
  const imf = data?.geopolitical?.imf_deal_probability ?? 31;

  // Base case probability (slightly deterioration-leaning given V(t) > 0)
  const baseProb = velocity > 0.10 ? 0.40 : 0.50;
  const detProb = velocity > 0.15 ? 0.38 : 0.28;
  const impProb = 1 - baseProb - detProb;

  return [
    {
      label: 'BASE_CASE',
      probability: baseProb,
      timeframe: '6-12 months',
      rriTrajectory: `R(t) continues gradual rise from ${rri.toFixed(2)} toward 2.5-2.6. No rupture but sustained elevated stress.`,
      investmentImpact: 'Investment case intact but FX restrictions continue. Operating conditions stressed but manageable. Planning horizon: maintain but limit capital deployment.',
      triggerConditions: ['Continued IMF deadlock', 'Inflation persists above 7%', 'MII FREEZE phase holds'],
      mitigationActions: ['Offshore holding structure', 'Local revenue > local costs balance', 'Quarterly exposure review'],
    },
    {
      label: 'DETERIORATION',
      probability: detProb,
      timeframe: '3-6 months',
      rriTrajectory: `R(t) crosses 2.5 threshold. FX reserves breach 75-day floor. IMF relationship ruptures. Probability of significant unrest elevated.`,
      investmentImpact: 'FX repatriation effectively frozen. UGTT likely calls general strike. Operations disrupted. Consider pause or exit depending on exposure.',
      triggerConditions: [
        `FX reserves below 75 days (currently ${fx}d)`,
        'UGTT general strike called',
        `IMF deal probability below 15% (currently ${imf}%)`,
        'Elite defection event',
      ],
      mitigationActions: ['Pre-position offshore cash buffer', 'Document force majeure clauses', 'Emergency operations protocol'],
    },
    {
      label: 'IMPROVEMENT',
      probability: impProb,
      timeframe: '6-18 months',
      rriTrajectory: 'IMF deal signed. Gulf bridge financing. FX reserves recover toward 110-120 days. R(t) retreats toward 2.0.',
      investmentImpact: 'Full investment case opens. FX repatriation normalizes. Tunisia risk premium drops — early entry discount available now. Accelerate deployment on this scenario.',
      triggerConditions: [
        'IMF deal signed (probability crosses 60%)',
        'Gulf bridge loan $2B+',
        'UGTT wage deal reached',
        'FX above 100 days',
      ],
      mitigationActions: ['Prepare scale-up capital for this scenario', 'Identify acquisition targets now at discount'],
    },
  ];
}

// ── Executive Summary Builder ──────────────────────────────────

function buildExecutiveSummary(
  query: ReportQuery,
  verdict: TimingVerdict,
  timingRationale: string,
  topGov: GovernorateScore,
  criticalConstraint: StructuralConstraint | null
): string {
  const sector = SECTOR_INTELLIGENCE[query.sector];
  const profileLabel: Record<InvestorProfile, string> = {
    ENTREPRENEUR_SME: 'SME entrepreneur',
    INVESTOR_FDI: 'foreign direct investor',
    NGO_DEVELOPMENT: 'development organization',
    INVESTOR_FINANCIAL: 'financial investor',
    GOVERNMENT_PARTNER: 'government partner',
  };

  const verdictText: Record<TimingVerdict, string> = {
    ENTER_NOW: 'conditions are currently favorable for entry',
    CONDITIONAL_ENTRY: 'entry is viable with specific preconditions',
    WAIT_FOR_TRIGGER: 'entry should await specific trigger conditions',
    DEFER: 'entry should be deferred 12-18 months',
    AVOID: 'this profile/sector combination is not recommended at this time',
  };

  const sentences = [
    `For a ${profileLabel[query.profile]} in ${sector.label}, Tunisia's investment climate assessment (${new Date().toLocaleDateString('en-GB', {month:'long',year:'numeric'})}) concludes that ${verdictText[verdict]}.`,
    topGov.recommendation === 'RECOMMENDED'
      ? `${topGov.name} is the recommended entry point (overall score ${topGov.overall}/100) — ${topGov.rationale.split('.')[0]}.`
      : `No governorate scores above the recommendation threshold given sector-specific requirements; ${topGov.name} is the best available option at ${topGov.overall}/100.`,
    criticalConstraint
      ? `The critical structural constraint is ${criticalConstraint.title.toLowerCase()} — ${criticalConstraint.workaround ?? 'requires specialist legal advice before proceeding'}.`
      : 'No single structural constraint is currently at critical severity; proceed with standard precautions.',
  ];

  return sentences.join(' ');
}

// ── Watch Indicators Builder ───────────────────────────────────

function buildWatchIndicators(
  query: ReportQuery,
  data: any,
  rriState: any
): WatchIndicator[] {
  const fx = data?.economy?.fx_reserves ?? 84;
  const imf = data?.geopolitical?.imf_deal_probability ?? 31;
  const ugtt = data?.social?.ugtt_mobilisation_level ?? 'ELEVATED';
  const sector = SECTOR_INTELLIGENCE[query.sector];

  const indicators: WatchIndicator[] = [
    {
      signal: 'BCT Foreign Exchange Reserves',
      currentValue: `${fx} days`,
      threshold: 'Below 75 days = repatriation risk critical; Above 100 days = FX normalization approaching',
      interpretation: fx < 80
        ? 'Approaching critical threshold. FX risk elevated.'
        : fx > 95
        ? 'Adequate. Monitor monthly for trend.'
        : 'Borderline. Weekly monitoring recommended.',
      action: fx < 80
        ? 'Activate offshore holding structure before any capital commitment. Consult BCT foreign exchange desk.'
        : 'Schedule investment when reserves cross 100-day threshold if waiting.',
      probability: fx < 80 ? 0.72 : 0.38,
    },
    {
      signal: 'IMF Deal Probability',
      currentValue: `${imf}%`,
      threshold: 'Above 60% = investment timing window opens for FX-sensitive sectors',
      interpretation: `At ${imf}%, IMF deal remains unlikely in near term. This is the primary macro unlock for ${sector.fxSensitivity !== 'LOW' ? 'this sector' : 'large-scale investment'}.`,
      action: imf < 40
        ? 'Do not commit large capital before this crosses 60%. Monitor TAP Agency, BCT press releases.'
        : 'Prepare investment documentation now for rapid deployment when trigger fires.',
      probability: imf < 40 ? 0.45 : 0.65,
    },
  ];

  if (sector.ugttExposure !== 'LOW') {
    indicators.push({
      signal: 'UGTT Mobilisation Level',
      currentValue: ugtt,
      threshold: 'HIGH = imminent strike action; MODERATE = normal operations safe',
      interpretation: ugtt === 'HIGH'
        ? 'UGTT at HIGH — formal 72-hour strike notice possible within 21 days. Labor-intensive activity should pause.'
        : `UGTT at ${ugtt} — monitor wage negotiation calendar, especially CPG phosphate sector.`,
      action: ugtt === 'HIGH'
        ? 'Delay hiring or operational launch until UGTT situation resolves. Consult local labor lawyer.'
        : 'Standard monitoring. Check UGTT website for national sector collective agreement calendar.',
      probability: ugtt === 'HIGH' ? 0.72 : 0.35,
    });
  }

  indicators.push({
    signal: 'R(t) Revolutionary Risk Index',
    currentValue: rriState.rri?.toFixed(2) ?? '2.31',
    threshold: 'Above 2.5 = elevated disruption risk; Below 2.0 = normal operations',
    interpretation: rriState.rri > 2.2
      ? `R(t)=${rriState.rri?.toFixed(2)} is elevated. Significant protest disruption possible. Interior governorates higher risk than coastal.`
      : `R(t) within manageable range. Standard business continuity planning sufficient.`,
    action: rriState.rri > 2.5
      ? 'Activate business continuity protocols. Interior operations should have evacuation/suspension procedures.'
      : 'Monitor weekly. No immediate operational action required.',
    probability: rriState.rri > 2.2 ? 0.48 : 0.22,
  });

  return indicators;
}

// ── Main Report Generation Function ───────────────────────────

export function generateInvestmentReport(
  query: ReportQuery,
  rriState: any,
  data: any,
  govAssessment: any = null,
  cascadeRisks?: Array<{ name: string; risk: number }>
): InvestmentIntelReport {

  const sector = SECTOR_INTELLIGENCE[query.sector];

  // Timing
  const { verdict, rationale: timingRationale, window: entryWindow,
          triggers: entryTriggers, confidence } = assessTiming(query, rriState, data, govAssessment);

  // Location
  const governorateRankings = rankGovernorates(query, rriState, cascadeRisks);
  const topGovernorate = governorateRankings[0];
  const avoidZones = governorateRankings
    .filter(g => g.recommendation === 'AVOID')
    .map(g => g.name);

  // Scenarios
  const scenarios = buildScenarios(rriState, data);

  // Constraints
  const structuralConstraints = buildConstraints(query, data, rriState);
  const criticalConstraint = structuralConstraints.find(c => c.severity === 'CRITICAL') ?? null;

  // Executive summary
  const executiveSummary = buildExecutiveSummary(
    query, verdict, timingRationale, topGovernorate, criticalConstraint
  );

  // Regime risk
  const regimeThreat = govAssessment?.threatLevel ?? 'DEFENSIVE';
  const regimeActions = (govAssessment?.predictedActions ?? [])
    .slice(0, 3)
    .map((a: any) => `${a.type.replace(/_/g,' ')} (${Math.round(a.probability * 100)}%)`) as string[];

  const regimeRiskText =
    regimeThreat === 'CRISIS' || regimeThreat === 'EMERGENCY'
      ? `ELEVATED: Regime is in ${regimeThreat.toLowerCase()} mode. Political instability risk is materially higher than baseline. Operational planning must include disruption scenarios.`
      : regimeThreat === 'DEFENSIVE'
      ? `MODERATE: Regime is in defensive consolidation. Predicted actions include targeted suppression and narrative injection. Operational environment is tense but functional.`
      : `BASELINE: Regime is in stable operations mode. Political risk within normal elevated-country parameters. Standard monitoring sufficient.`;

  // Watch indicators
  const watchIndicators = buildWatchIndicators(query, data, rriState);

  // Immediate actions
  const immediateActions: string[] = [];
  if (criticalConstraint?.category === 'FX_REPATRIATION') {
    immediateActions.push('Establish offshore holding company structure (Malta/Netherlands/UAE) before any capital commitment');
  }
  immediateActions.push(`Contact FIPA (Foreign Investment Promotion Agency) for ${sector.label} sector authorization pathway`);
  if (sector.ugttExposure !== 'LOW') {
    immediateActions.push('Consult local labor law specialist on collective agreement obligations for your specific headcount and sector');
  }
  immediateActions.push('Request BCT circular 1993-08 interpretation for your specific investment structure');
  immediateActions.push('Engage a Tunisia-based notary (notaire) for land/premises due diligence — title registration is complex');

  return {
    query,
    generatedAt: new Date().toISOString(),
    modelState: {
      rri: rriState.rri ?? 2.31,
      p_rev: rriState.p_rev ?? 0.643,
      velocity: rriState.velocity_label ?? 'DETERIORATING',
      fxReserves: data?.economy?.fx_reserves ?? 84,
      inflation: data?.economy?.inflation ?? 7.1,
      imfDealProb: data?.geopolitical?.imf_deal_probability ?? 31,
      ugttLevel: data?.social?.ugtt_mobilisation_level ?? 'ELEVATED',
    },
    executiveSummary,
    timingVerdict: verdict,
    timingRationale,
    confidenceScore: confidence,
    entryWindow,
    entryTriggers,
    governorateRankings,
    topGovernorate,
    avoidZones,
    scenarios,
    structuralConstraints,
    criticalConstraint,
    regimeRiskAssessment: regimeRiskText,
    predictedRegimeActions: regimeActions,
    regimeThreatLevel: regimeThreat,
    watchIndicators,
    sectorAnalysis: {
      sectorLabel: sector.label,
      viabilityScore: sector.viabilityBase,
      keyOpportunity: sector.opportunity,
      keyChallenge: sector.challenge,
      comparableSuccesses: sector.comparables,
      estimatedROIHorizon: sector.roiHorizon,
      marketSize: sector.marketSizeNote,
      competitorLandscape: sector.competitors,
    },
    immediateActions,
    resourceLinks: [
      'FIPA — Foreign Investment Promotion Agency: investintunisia.tn',
      'BCT — Central Bank foreign exchange circulars: bct.gov.tn',
      'UGTT — Union collective agreement calendar: ugtt.org.tn',
      'STEG — Grid reliability map: steg.com.tn',
      'IFC Tunisia — Development finance: ifc.org/tunisia',
    ],
  };
}
