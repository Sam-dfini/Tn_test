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

export const fetchURLContent = async (url: string): Promise<string> => {
  // In production this goes through a backend proxy
  // For now return a context-rich placeholder that Gemini 
  // can still reason about based on URL structure
  const domain = new URL(url).hostname.replace('www.', '');
  const docType = DOCUMENT_TYPES.find(d => url.includes(d.domain));
  
  return `Document from: ${domain}
URL: ${url}
Type: ${docType?.name || 'Unknown'}
Note: Direct fetch blocked by CORS. 
Please paste document text content directly, 
or use the backend proxy when available.
Domain suggests this is a ${docType?.name || 'government/institutional'} 
document. Relevant fields: ${docType?.relevantFields?.join(', ') || 'unknown'}`;
};
