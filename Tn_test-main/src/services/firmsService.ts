import { FireData } from '../types/intel';

/**
 * NASA FIRMS Data Normalization
 * Converts raw format into internal intelligence model
 */
export const normalizeFireData = (raw: any): FireData => {
  return {
    lat: parseFloat(raw.latitude),
    lon: parseFloat(raw.longitude),
    date: new Date(raw.acq_date),
    intensity: parseFloat(raw.brightness),
    brightness: parseFloat(raw.brightness),
    confidence: normalizeConfidence(raw.confidence),
    frp: raw.frp ? parseFloat(raw.frp) : undefined
  };
};

const normalizeConfidence = (val: string | number): 'low' | 'nominal' | 'high' => {
  if (typeof val === 'number') {
    if (val >= 80) return 'high';
    if (val >= 30) return 'nominal';
    return 'low';
  }
  
  const v = val.toLowerCase();
  if (v.includes('h') || v.includes('high')) return 'high';
  if (v.includes('n') || v.includes('nominal')) return 'nominal';
  return 'low';
};

/**
 * Time filtering system
 * today, 7d, 30d
 */
export const filterFires = (fires: FireData[], range: 'today' | '7d' | '30d'): FireData[] => {
  const now = new Date();
  const filterDate = new Date();
  
  if (range === 'today') {
    filterDate.setHours(0, 0, 0, 0);
  } else if (range === '7d') {
    filterDate.setDate(now.getDate() - 7);
  } else if (range === '30d') {
    filterDate.setDate(now.getDate() - 30);
  }
  
  return fires.filter(f => f.date >= filterDate);
};

/**
 * Mock data generator for testing (Tunisia region)
 */
export const getMockFires = (count: number = 350): FireData[] => {
  const fires: FireData[] = [];
  const now = new Date();
  
  for (let i = 0; i < count; i++) {
    const lat = 33.0 + Math.random() * 4.0; // Tunisia range
    const lon = 8.0 + Math.random() * 3.0;
    const daysAgo = Math.floor(Math.random() * 30);
    const date = new Date();
    date.setDate(now.getDate() - daysAgo);
    
    const brightness = 300 + Math.random() * 200;
    const confs: ('low' | 'nominal' | 'high')[] = ['low', 'nominal', 'high'];
    const confidence = confs[Math.floor(Math.random() * 3)];
    
    fires.push({
      lat,
      lon,
      date,
      brightness,
      intensity: brightness,
      confidence
    });
  }
  
  return fires;
};

// --- LEGACY / PANEL SUPPORT ---
// These are required by FireIntelligencePanel.tsx

export type FireType = 'PROTEST_HIGH' | 'PROTEST_MEDIUM' | 'PROTEST_LOW' | 'INDUSTRIAL' | 'AGRICULTURAL' | 'UNKNOWN';

export interface FireSignal {
  id: string;
  lat: number;
  lon: number;
  fireType: FireType;
  protestProbability: number;
  nearestUrbanCenter: string;
  distanceToUrban: number;
  localHour: number;
  clusterSize: number;
  classificationReason: string;
  epsilonContribution: number;
  affectsEQ17: boolean;
  governorate: string;
}

export interface FireIntelligenceState {
  hotspots: FireSignal[];
  activeProtestSignals: FireSignal[];
  governoratesAffected: string[];
  totalEpsilon: number;
  cascadeRisk: boolean;
  lastFetched: Date;
  fetchError?: boolean;
}

export const getSimulatedFireData = (): FireIntelligenceState => {
  const hotspots: FireSignal[] = [
    {
      id: 'viirs-001',
      lat: 34.431,
      lon: 8.783,
      fireType: 'PROTEST_HIGH',
      protestProbability: 0.92,
      nearestUrbanCenter: 'Gafsa Center',
      distanceToUrban: 1.2,
      localHour: 22,
      clusterSize: 4,
      classificationReason: 'EQ.13: Urban night cluster at strategic phosphate hub.',
      epsilonContribution: 0.08,
      affectsEQ17: true,
      governorate: 'Gafsa'
    },
    {
      id: 'viirs-002',
      lat: 35.172,
      lon: 8.831,
      fireType: 'PROTEST_MEDIUM',
      protestProbability: 0.68,
      nearestUrbanCenter: 'Kasserine City',
      distanceToUrban: 2.8,
      localHour: 20,
      clusterSize: 2,
      classificationReason: 'Urban signal detected outside curfew window.',
      epsilonContribution: 0.045,
      affectsEQ17: false,
      governorate: 'Kasserine'
    },
    {
      id: 'viirs-003',
      lat: 36.8,
      lon: 10.1,
      fireType: 'INDUSTRIAL',
      protestProbability: 0.12,
      nearestUrbanCenter: 'Bizerte Port',
      distanceToUrban: 0.5,
      localHour: 14,
      clusterSize: 1,
      classificationReason: 'Daytime signal at known industrial facility.',
      epsilonContribution: 0,
      affectsEQ17: false,
      governorate: 'Bizerte'
    }
  ];

  return {
    hotspots,
    activeProtestSignals: hotspots.filter(h => h.protestProbability > 0.6),
    governoratesAffected: ['Gafsa', 'Kasserine'],
    totalEpsilon: 0.125,
    cascadeRisk: true,
    lastFetched: new Date()
  };
};

export const fetchFireIntelligence = async (simulated: boolean = true): Promise<FireIntelligenceState> => {
  if (simulated) {
    return getSimulatedFireData();
  }
  // NASA FIRMS API would go here, falling back to simulated for this environment
  return { ...getSimulatedFireData(), fetchError: true };
};
