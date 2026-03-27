import { generateAnalystResponse } from './geminiService';

export const FIELD_MAP = {
  'economy.gdp_growth': {
    label: 'GDP Growth Rate',
    unit: '%',
    description: 'Annual GDP growth percentage',
    keywords: ['GDP', 'croissance', 'growth', 'PIB'],
    sources: ['INS', 'BCT', 'IMF', 'World Bank'],
    module: 'Economy'
  },
  'economy.inflation': {
    label: 'Inflation Rate (CPI)',
    unit: '%',
    description: 'Consumer price index annual change',
    keywords: ['inflation', 'CPI', 'prix', 'IPC'],
    sources: ['INS', 'BCT'],
    module: 'Economy'
  },
  'economy.fx_reserves': {
    label: 'FX Reserves',
    unit: 'days import cover',
    description: 'Foreign exchange reserves in days of imports',
    keywords: ['réserves', 'reserves', 'devises', 'import cover', 'jours'],
    sources: ['BCT'],
    module: 'Economy'
  },
  'economy.public_debt': {
    label: 'Public Debt',
    unit: '% GDP',
    description: 'Total public debt as percentage of GDP',
    keywords: ['dette', 'debt', 'PIB', 'GDP'],
    sources: ['BCT', 'IMF'],
    module: 'Economy'
  },
  'economy.tnd_usd': {
    label: 'TND/USD Exchange Rate',
    unit: 'TND per USD',
    description: 'Tunisian Dinar to US Dollar rate',
    keywords: ['TND', 'USD', 'dollar', 'exchange', 'taux de change'],
    sources: ['BCT'],
    module: 'Economy'
  },
  'economy.unemployment': {
    label: 'Unemployment Rate',
    unit: '%',
    description: 'National unemployment rate',
    keywords: ['chômage', 'unemployment', 'emploi'],
    sources: ['INS'],
    module: 'Economy'
  },
  'economy.trade_deficit': {
    label: 'Trade Deficit',
    unit: 'B TND',
    description: 'Annual trade imbalance',
    keywords: ['trade', 'deficit', 'imports', 'exports'],
    sources: ['INS'],
    module: 'Economy'
  },
  'economy.remittances_total_bnd': {
    label: 'Total Remittances',
    unit: 'B TND',
    description: 'Total annual remittances from diaspora',
    keywords: ['remittances', 'diaspora', 'transfers'],
    sources: ['BCT'],
    module: 'Economy'
  },
  'economy.remittances_pct_gdp': {
    label: 'Remittances % GDP',
    unit: '%',
    description: 'Remittances as percentage of GDP',
    keywords: ['remittances', 'gdp', 'dependency'],
    sources: ['BCT', 'World Bank'],
    module: 'Economy'
  },
  'economy.remittances_urban_bnd': {
    label: 'Urban Remittances',
    unit: 'B TND',
    description: 'Remittances flowing to urban areas',
    keywords: ['remittances', 'urban', 'distribution'],
    sources: ['BCT Estimate'],
    module: 'Economy'
  },
  'economy.remittances_rural_bnd': {
    label: 'Rural Remittances',
    unit: 'B TND',
    description: 'Remittances flowing to rural areas',
    keywords: ['remittances', 'rural', 'distribution'],
    sources: ['BCT Estimate'],
    module: 'Economy'
  },
  'economy.remittances_growth_yoy': {
    label: 'Remittance Growth',
    unit: '%',
    description: 'Year-on-year growth in remittances',
    keywords: ['remittances', 'growth', 'trend'],
    sources: ['BCT'],
    module: 'Economy'
  },
  'economy.remittances_france_pct': {
    label: 'France Remittance Share',
    unit: '%',
    description: 'Percentage of remittances originating from France',
    keywords: ['remittances', 'france', 'concentration'],
    sources: ['BCT'],
    module: 'Economy'
  },
  'economy.heritage_freedom_score': {
    label: 'Heritage Economic Freedom Score',
    unit: '/100',
    description: 'Heritage Foundation Economic Freedom Index',
    keywords: ['Heritage', 'economic freedom', 'liberté économique'],
    sources: ['Heritage Foundation'],
    module: 'Economy'
  },
  'economy.cpi_score': {
    label: 'Corruption Perceptions Index',
    unit: '/100',
    description: 'Transparency International CPI score',
    keywords: ['CPI', 'corruption', 'Transparency International'],
    sources: ['Transparency International'],
    module: 'Economy'
  },
  'economy.parallel_market_premium': {
    label: 'Parallel Market Premium',
    unit: '%',
    description: 'TND parallel market premium above official BCT rate',
    keywords: ['parallel', 'marché noir', 'premium', 'black market'],
    sources: ['Forex monitors', 'FTDES'],
    module: 'Economy'
  },
  'economy.fdi_inflow_usd': {
    label: 'FDI Inflow',
    unit: 'B USD',
    description: 'Annual foreign direct investment inflow',
    keywords: ['FDI', 'investissement étranger', 'foreign investment'],
    sources: ['BCT', 'FIPA'],
    module: 'Economy'
  },
  'energy.steg_debt': {
    label: 'STEG Debt to State',
    unit: 'B TND',
    description: 'STEG accumulated debt to state budget',
    keywords: ['STEG', 'dette', 'debt', 'subvention'],
    sources: ['STEG', 'Ministry of Finance'],
    module: 'Energy'
  },
  'energy.gas_import_pct': {
    label: 'Gas Import Dependency',
    unit: '%',
    description: 'Percentage of gas needs met by imports',
    keywords: ['gaz', 'gas', 'Algérie', 'Algeria', 'import', 'Transmed'],
    sources: ['ANME', 'STEG'],
    module: 'Energy'
  },
  'energy.renewable_pct': {
    label: 'Renewable Energy Share',
    unit: '%',
    description: 'Renewables as % of electricity generation',
    keywords: ['renouvelable', 'renewable', 'solaire', 'solar', 'éolien'],
    sources: ['ANME', 'STEG'],
    module: 'Energy'
  },
  'energy.fuel_subsidy_cost': {
    label: 'Fuel Subsidy Cost',
    unit: 'B TND',
    description: 'Annual cost of fuel and energy subsidies',
    keywords: ['subvention', 'subsidy', 'carburant', 'fuel', 'compensation'],
    sources: ['Ministry of Finance', 'BCT'],
    module: 'Energy'
  },
  'geopolitical.imf_deal_probability': {
    label: 'IMF Deal Probability',
    unit: '%',
    description: 'Estimated probability of IMF deal closure',
    keywords: ['IMF', 'FMI', 'deal', 'accord', 'programme'],
    sources: ['IMF', 'Reuters', 'Al Monitor'],
    module: 'Geopolitical'
  },
  'social.protest_events_30d': {
    label: 'Protest Events (30 days)',
    unit: 'events',
    description: 'Number of protest events in last 30 days',
    keywords: ['protest', 'manifestation', 'sit-in', 'grève', 'strike'],
    sources: ['TAP', 'Nawaat', 'Business News'],
    module: 'Social'
  },
  'social.decree54_charged': {
    label: 'Decree 54 Charges',
    unit: 'individuals',
    description: 'Total individuals charged under Decree 54',
    keywords: ['Decree 54', 'Décret 54', 'fake news', 'poursuivi', 'charged'],
    sources: ['RSF', 'CPJ', 'Nawaat'],
    module: 'Social'
  },
  'social.happiness_index': {
    label: 'Happiness Index',
    unit: '0-10',
    description: 'National happiness and life satisfaction index',
    keywords: ['happiness', 'bonheur', 'satisfaction', 'well-being'],
    sources: ['UN World Happiness Report', 'Local Surveys'],
    module: 'Social'
  },
  'social.youth_rage_index': {
    label: 'Youth Rage Index',
    unit: '0-10',
    description: 'Level of frustration and anger among youth population',
    keywords: ['rage', 'colère', 'frustration', 'jeunesse', 'youth'],
    sources: ['Interior Ministry', 'Social Monitoring'],
    module: 'Social'
  },
  'social.street_signal': {
    label: 'Street Signal S(t)',
    unit: '0-1',
    description: 'Probability of imminent street protests',
    keywords: ['street signal', 'protest probability', 'unrest', 'manifestation'],
    sources: ['AI Predictive Model', 'Social Listening'],
    module: 'Social'
  },
  'social.divorce_rate': {
    label: 'Divorce Rate',
    unit: '%',
    description: 'Annual divorce rate as percentage of marriages',
    keywords: ['divorce', 'séparation', 'marriage', 'famille'],
    sources: ['Ministry of Justice', 'INS'],
    module: 'Social'
  },
  'social.diaspora_total': {
    label: 'Total Diaspora',
    unit: 'people',
    description: 'Total Tunisians living abroad',
    keywords: ['diaspora', 'migration', 'population'],
    sources: ['OTE'],
    module: 'Social'
  },
  'social.diaspora_pct_population': {
    label: 'Diaspora % Population',
    unit: '%',
    description: 'Diaspora as percentage of total population',
    keywords: ['diaspora', 'migration', 'demographics'],
    sources: ['OTE / INS'],
    module: 'Social'
  },
  'social.engineers_leaving_per_year': {
    label: 'Engineer Brain Drain',
    unit: 'per year',
    description: 'Number of engineers emigrating annually',
    keywords: ['brain drain', 'engineers', 'migration'],
    sources: ['OIT'],
    module: 'Social'
  },
  'social.doctors_leaving_per_year': {
    label: 'Medical Brain Drain',
    unit: 'per year',
    description: 'Number of doctors emigrating annually',
    keywords: ['brain drain', 'doctors', 'migration'],
    sources: ['Medical Council'],
    module: 'Social'
  },
  'social.phd_emigration_pct': {
    label: 'PhD Emigration Rate',
    unit: '%',
    description: 'Percentage of PhD holders seeking to emigrate',
    keywords: ['brain drain', 'phd', 'academia'],
    sources: ['University Survey'],
    module: 'Social'
  },
  'social.illegal_crossing_attempts': {
    label: 'Illegal Crossing Attempts',
    unit: 'count',
    description: 'Recorded attempts to cross Mediterranean illegally',
    keywords: ['migration', 'illegal', 'crossings'],
    sources: ['FTDES / Coast Guard'],
    module: 'Social'
  },
  'social.illegal_crossing_deaths': {
    label: 'Illegal Crossing Deaths',
    unit: 'count',
    description: 'Recorded deaths/missing during illegal crossings',
    keywords: ['migration', 'deaths', 'tragedy'],
    sources: ['FTDES / IOM'],
    module: 'Social'
  },
  'social.youth_emigration_aspiration_pct': {
    label: 'Youth Emigration Aspiration',
    unit: '%',
    description: 'Percentage of youth expressing desire to emigrate',
    keywords: ['youth', 'migration', 'aspiration'],
    sources: ['FTDES Survey'],
    module: 'Social'
  },
  'social.return_migration_annual': {
    label: 'Annual Return Migration',
    unit: 'count',
    description: 'Number of Tunisians returning permanently',
    keywords: ['migration', 'return', 'reintegration'],
    sources: ['OTE'],
    module: 'Social'
  },
  'social.net_migration': {
    label: 'Net Migration',
    unit: 'count',
    description: 'Difference between immigration and emigration',
    keywords: ['migration', 'net', 'demographics'],
    sources: ['INS'],
    module: 'Social'
  },
  'social.smuggling_network_revenue_usd_m': {
    label: 'Smuggling Revenue',
    unit: 'M USD',
    description: 'Estimated annual revenue of smuggling networks',
    keywords: ['smuggling', 'crime', 'migration'],
    sources: ['Security Estimate'],
    module: 'Social'
  },
  'social.coast_guard_interceptions': {
    label: 'Coast Guard Interceptions',
    unit: 'count',
    description: 'Number of migrants intercepted by coast guard',
    keywords: ['security', 'migration', 'interception'],
    sources: ['Ministry of Interior'],
    module: 'Social'
  },
  'social.sub_saharan_transit_pct': {
    label: 'Sub-Saharan Transit %',
    unit: '%',
    description: 'Percentage of intercepted migrants from Sub-Saharan Africa',
    keywords: ['migration', 'transit', 'sub-saharan'],
    sources: ['Ministry of Interior'],
    module: 'Social'
  },
  'rri.p_rev': {
    label: 'P(Revolution)',
    unit: '0-1',
    description: 'Probability of revolutionary event',
    keywords: ['RRI', 'revolution', 'instability', 'risk'],
    sources: ['RRI Engine'],
    module: 'RRI'
  }
};

export const DOCUMENT_TYPES = [
  { 
    id: 'bct', 
    name: 'BCT Report', 
    domain: 'bct.gov.tn',
    icon: '🏦',
    color: '#00f2ff',
    relevantFields: ['economy.fx_reserves', 'economy.inflation', 'economy.tnd_usd', 'economy.public_debt']
  },
  { 
    id: 'ins', 
    name: 'INS Statistics', 
    domain: 'ins.tn',
    icon: '📊',
    color: '#22c55e',
    relevantFields: ['economy.gdp_growth', 'economy.unemployment', 'economy.youth_unemployment']
  },
  { 
    id: 'imf', 
    name: 'IMF Report', 
    domain: 'imf.org',
    icon: '🌐',
    color: '#bf00ff',
    relevantFields: ['economy.public_debt', 'geopolitical.imf_deal_probability', 'economy.current_account']
  },
  { 
    id: 'steg', 
    name: 'STEG / Energy', 
    domain: 'steg.com.tn',
    icon: '⚡',
    color: '#f97316',
    relevantFields: ['energy.steg_debt', 'energy.renewable_pct', 'energy.gas_import_pct']
  },
  { 
    id: 'worldbank', 
    name: 'World Bank', 
    domain: 'worldbank.org',
    icon: '🏛',
    color: '#3b82f6',
    relevantFields: ['economy.gdp_growth', 'economy.public_debt', 'economy.trade_deficit']
  },
  {
    id: 'tap',
    name: 'TAP / News',
    domain: 'tap.info.tn',
    icon: '📰',
    color: '#ef4444',
    relevantFields: ['social.protest_events_30d', 'social.decree54_charged']
  }
];

export interface ExtractedField {
  field: string;
  label: string;
  value: any;
  oldValue: any;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  sourceQuote: string;
  unit: string;
  module: string;
}

export const extractFieldsFromContent = async (
  content: string,
  documentType: string,
  currentData: any
): Promise<ExtractedField[]> => {
  
  const docType = DOCUMENT_TYPES.find(d => d.id === documentType);
  const relevantFields = docType?.relevantFields || Object.keys(FIELD_MAP);
  
  const fieldDescriptions = relevantFields.map(f => {
    const fm = FIELD_MAP[f as keyof typeof FIELD_MAP];
    return `- ${f}: ${fm.label} (${fm.unit}) — keywords: ${fm.keywords.join(', ')}`;
  }).join('\n');

  const prompt = `You are a data extraction specialist for a Tunisia 
political risk intelligence platform.

Extract specific numerical values from this document content.
Current platform values are shown for comparison.

FIELDS TO EXTRACT:
${fieldDescriptions}

DOCUMENT CONTENT:
${content.slice(0, 8000)}

Return ONLY a valid JSON array. Each object must have:
{
  "field": "exact.field.path",
  "value": <extracted number>,
  "confidence": "HIGH" | "MEDIUM" | "LOW",
  "sourceQuote": "exact quote from document supporting this value (max 120 chars)"
}

Only include fields where you found clear evidence in the text.
Do not guess. If unsure, set confidence to LOW.
Return [] if nothing found.
Return ONLY the JSON array, no other text.`;

  try {
    const response = await generateAnalystResponse(prompt, {});
    const cleaned = response.replace(/\`\`\`json|\`\`\`/g, '').trim();
    const extracted = JSON.parse(cleaned);
    
    return extracted.map((e: any) => {
      const fm = FIELD_MAP[e.field as keyof typeof FIELD_MAP];
      if (!fm) return null;
      
      // Get current value from nested path
      let oldValue = currentData;
      e.field.split('.').forEach((key: string) => {
        oldValue = oldValue?.[key];
      });
      
      return {
        field: e.field,
        label: fm.label,
        value: e.value,
        oldValue,
        confidence: e.confidence,
        sourceQuote: e.sourceQuote,
        unit: fm.unit,
        module: fm.module
      };
    }).filter(Boolean);
    
  } catch (err) {
    console.error('Extraction failed:', err);
    return [];
  }
};

export const detectDocumentType = (url: string): string => {
  for (const dt of DOCUMENT_TYPES) {
    if (url.includes(dt.domain)) return dt.id;
  }
  return 'unknown';
};

/**
 * Fetches content from a URL via the backend proxy.
 */
export const fetchURLContent = async (url: string): Promise<string> => {
  try {
    const proxyUrl = `/api/proxy?url=${encodeURIComponent(url)}`;
    const response = await fetch(proxyUrl);
    
    if (!response.ok) {
      throw new Error(`Proxy fetch failed: ${response.status} ${response.statusText}`);
    }
    
    const content = await response.text();
    return content;
  } catch (error) {
    console.error('fetchURLContent failed:', error);
    // Fallback to informative message
    const domain = new URL(url).hostname.replace('www.', '');
    const docType = DOCUMENT_TYPES.find(d => url.includes(d.domain));
    
    return `Document from: ${domain}
URL: ${url}
Type: ${docType?.name || 'Unknown'}
Error: ${error instanceof Error ? error.message : String(error)}
Note: Direct fetch failed. Please check the backend proxy or paste content manually.`;
  }
};

/**
 * World Bank Indicator Mappings for Tunisia
 */
export const WB_INDICATORS = {
  'economy.gdp_growth': 'NY.GDP.MKTP.KD.ZG',
  'economy.inflation': 'FP.CPI.TOTL.ZG',
  'economy.public_debt': 'GC.DOD.TOTL.GD.ZS',
  'economy.unemployment': 'SL.UEM.TOTL.ZS',
};

/**
 * IMF Indicator Mappings for Tunisia (WEO)
 */
export const IMF_INDICATORS = {
  'economy.gdp_growth': 'NGDP_RPCH',
  'economy.inflation': 'PCPIPCH',
  'economy.public_debt': 'GGXWDG_NGDP',
};

/**
 * Fetches a specific indicator from the World Bank API.
 */
export const fetchWorldBankIndicator = async (fieldPath: string, retries = 2): Promise<any> => {
  const indicator = WB_INDICATORS[fieldPath as keyof typeof WB_INDICATORS];
  if (!indicator) return null;

  const url = `https://api.worldbank.org/v2/country/TUN/indicator/${indicator}?format=json&per_page=5`;
  const proxyUrl = `/api/proxy?url=${encodeURIComponent(url)}`;

  for (let i = 0; i <= retries; i++) {
    try {
      const response = await fetch(proxyUrl);
      if (!response.ok) throw new Error(`WB API error: ${response.status}`);
      
      const data = await response.json();
      // WB response structure: [ {page: 1, ...}, [ {indicator: ..., value: ..., date: ...}, ... ] ]
      if (Array.isArray(data) && data.length > 1 && Array.isArray(data[1])) {
        // Find the most recent non-null value
        const latest = data[1].find((d: any) => d.value !== null);
        if (latest) {
          return {
            value: parseFloat(latest.value.toFixed(2)),
            date: latest.date,
            source: 'World Bank'
          };
        }
      }
      return null;
    } catch (error) {
      if (i === retries) {
        console.error(`World Bank Fetch Error (${fieldPath}) after ${retries} retries:`, error);
        return null;
      }
      await new Promise(r => setTimeout(r, 1000 * (i + 1))); // Exponential backoff
    }
  }
};

/**
 * Fetches a specific indicator from the IMF Data API.
 */
export const fetchIMFIndicator = async (fieldPath: string, retries = 2): Promise<any> => {
  const indicator = IMF_INDICATORS[fieldPath as keyof typeof IMF_INDICATORS];
  if (!indicator) return null;

  // Using WEO (World Economic Outlook) dataset via SDMX JSON API
  // Using https for better security and compatibility
  const url = `https://dataservices.imf.org/REST/SDMX_JSON.svc/CompactData/WEO/A.TUN.${indicator}`;
  const proxyUrl = `/api/proxy?url=${encodeURIComponent(url)}`;

  for (let i = 0; i <= retries; i++) {
    try {
      const response = await fetch(proxyUrl);
      if (!response.ok) throw new Error(`IMF API error: ${response.status}`);
      
      const data = await response.json();
      
      // IMF SDMX JSON structure is deeply nested and can vary
      // CompactData structure: DataSet -> Series -> Obs
      const dataSet = data?.Structure?.Data?.DataSet || data?.DataSet;
      const series = dataSet?.Series;
      
      if (series) {
        const seriesData = Array.isArray(series) ? series[0] : series;
        const observations = seriesData?.Obs;
        
        if (observations && Array.isArray(observations) && observations.length > 0) {
          // Get the last observation with a valid value
          const validObs = [...observations].reverse().find(obs => obs['@OBS_VALUE'] !== undefined);
          if (validObs) {
            return {
              value: parseFloat(parseFloat(validObs['@OBS_VALUE']).toFixed(2)),
              date: validObs['@TIME_PERIOD'],
              source: 'IMF'
            };
          }
        }
      }
      return null;
    } catch (error) {
      if (i === retries) {
        console.error(`IMF Fetch Error (${fieldPath}) after ${retries} retries:`, error);
        return null;
      }
      await new Promise(r => setTimeout(r, 1000 * (i + 1))); // Exponential backoff
    }
  }
};

/**
 * Synchronizes external data for a set of fields.
 */
export const syncExternalData = async (fields: string[]): Promise<ExtractedField[]> => {
  const results: ExtractedField[] = [];

  for (const field of fields) {
    let externalData = null;

    // Try World Bank first
    if (WB_INDICATORS[field as keyof typeof WB_INDICATORS]) {
      externalData = await fetchWorldBankIndicator(field);
    }

    // If WB failed or not available, try IMF
    if (!externalData && IMF_INDICATORS[field as keyof typeof IMF_INDICATORS]) {
      externalData = await fetchIMFIndicator(field);
    }

    if (externalData) {
      const fm = FIELD_MAP[field as keyof typeof FIELD_MAP];
      results.push({
        field,
        label: fm.label,
        value: externalData.value,
        oldValue: null, // Should be populated by caller if needed
        confidence: 'HIGH',
        sourceQuote: `Source: ${externalData.source} (${externalData.date})`,
        unit: fm.unit,
        module: fm.module
      });
    }
  }

  return results;
};
