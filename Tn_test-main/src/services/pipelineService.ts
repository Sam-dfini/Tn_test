/**
 * pipelineService.ts
 * Refactored to separate data definitions, UI logic, and business logic.
 * Metadata is now fetched from the backend or uses local defaults.
 */

// Fallback metadata (actual variables now live in Supabase/backend)
export let FIELD_MAP: Record<string, any> = {
  'economy.gdp_growth': { label: 'GDP Growth Rate', unit: '%', module: 'Economy' },
  'economy.inflation':  { label: 'Inflation Rate', unit: '%', module: 'Economy' }
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

/**
 * Initializes variables from the backend database.
 */
export const initializeVariables = async (retries = 8, delay = 3000) => {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch('/api/variables');
      if (response.ok) {
        const variables = await response.json();
        const newMap: Record<string, any> = {};
        variables.forEach((v: any) => {
          const id = v.id || v.pipeline_field;
          newMap[id] = {
             ...v,
             label: v.label || v.name || id
          };
        });
        FIELD_MAP = newMap;
        return true;
      }
      
      // If we got a 502/503/504, it might mean the backend is still starting
      if (response.status >= 502) {
        console.warn(`Backend starting up (Attempt ${i + 1}/${retries})...`);
      } else {
        throw new Error(`Variables fetch failed with status: ${response.status}`);
      }
    } catch (error) {
      console.warn(`Attempt ${i + 1}/${retries} to initialize variables failed:`, error);
    }
    
    // Wait before next retry
    if (i < retries - 1) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  console.error('Failed to initialize variables from backend after maximum retries.');
  return false;
};

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

/**
 * Extracts fields from document content using the backend AI agent.
 */
export const extractFieldsFromContent = async (
  content: string,
  documentType: string,
  currentData: any
): Promise<ExtractedField[]> => {
  
  const docType = DOCUMENT_TYPES.find(d => d.id === documentType);
  const relevantFieldIds = docType?.relevantFields || Object.keys(FIELD_MAP);
  
  const schema = relevantFieldIds.map(f => {
    const fm = FIELD_MAP[f];
    return {
      field: f,
      label: fm?.label || f,
      unit: fm?.unit || '',
      description: fm?.description || ''
    };
  });

  try {
    const response = await fetch('/api/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, extraction_schema: schema })
    });
    
    if (!response.ok) throw new Error('Backend extraction failed');
    
    const extractionResult = await response.json();
    const extracted = extractionResult.structured_data?.extracted_fields || [];
    
    return extracted.map((e: any) => {
      const fm = FIELD_MAP[e.field];
      
      // Get current value from nested path
      let oldValue = currentData;
      (e.field || '').split('.').forEach((key: string) => {
        oldValue = oldValue?.[key];
      });
      
      return {
        field: e.field,
        label: fm?.label || e.field,
        value: e.value,
        oldValue,
        confidence: e.confidence,
        sourceQuote: e.source_quote || e.sourceQuote || 'N/A',
        unit: fm?.unit || '',
        module: fm?.module || ''
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
export const fetchURLContent = async (url: string, mobile = false): Promise<string> => {
  try {
    const proxyUrl = `/api/proxy?url=${encodeURIComponent(url)}${mobile ? '&mobile=true' : ''}`;
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
 * This is now proxying to backend to clean up frontend.
 */
export const fetchWorldBankIndicator = async (fieldPath: string): Promise<any> => {
  const indicator = WB_INDICATORS[fieldPath as keyof typeof WB_INDICATORS];
  if (!indicator) return null;

  const url = `https://api.worldbank.org/v2/country/TUN/indicator/${indicator}?format=json&per_page=5`;
  const proxyUrl = `/api/proxy?url=${encodeURIComponent(url)}`;

  try {
    const response = await fetch(proxyUrl);
    if (!response.ok) throw new Error(`WB API error: ${response.status}`);
    
    const data = await response.json();
    if (Array.isArray(data) && data.length > 1 && Array.isArray(data[1])) {
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
    console.error(`World Bank Fetch Error (${fieldPath}):`, error);
    return null;
  }
};

/**
 * Synchronizes external data for a set of fields.
 */
export const syncExternalData = async (fields: string[]): Promise<ExtractedField[]> => {
  const results: ExtractedField[] = [];

  for (const field of fields) {
    let externalData = await fetchWorldBankIndicator(field);

    if (externalData) {
      const fm = FIELD_MAP[field];
      results.push({
        field,
        label: fm?.label || field,
        value: externalData.value,
        oldValue: null,
        confidence: 'HIGH',
        sourceQuote: `Source: ${externalData.source} (${externalData.date})`,
        unit: fm?.unit || '',
        module: fm?.module || ''
      });
    }
  }

  return results;
};
