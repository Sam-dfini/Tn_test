import { supabase } from '../lib/supabase';

// ── Types ─────────────────────────────────────────────────────

export interface PropagationNode {
  governorateId: string;
  governorateName: string;
  probability: number;        // 0-1
  expectedDays: number;       // days from origin
  path: string[];             // chain of IDs from origin
  riskScore: number;          // 0-100
  status: 'origin' | 'high' | 'medium' | 'low' | 'unreachable';
}

export interface SIRDataPoint {
  day: number;
  S: number;
  I: number;
  R: number;
}

export interface PropagationResult {
  originId: string;
  originName: string;
  nodes: Record<string, PropagationNode>;
  maxReach: number;           // max days simulated
  generatedAt: number;
  cascadeProbability: number; // base EQ.17 value
  activeEvent?: string;       // title of triggering event
  sirData: SIRDataPoint[];    // SIR model data over time
}

export interface HistoricalWave {
  name: string;               // e.g. "Tunisia Revolution 2010"
  origin: string;             // governorate ID
  steps: Array<{
    governorateId: string;
    day: number;              // days from origin event
    intensity: number;        // 0-1
    note: string;             // what happened
  }>;
  outcome: string;
  totalDays: number;
}

// ── Historical Patterns ────────────────────────────────────────

export const HISTORICAL_WAVES: HistoricalWave[] = [
  {
    name: 'Tunisia Revolution 2010–2011',
    origin: 'sidi_bouzid',
    outcome: 'Regime Collapse — Ben Ali fled Jan 14, 2011',
    totalDays: 28,
    steps: [
      { governorateId: 'sidi_bouzid', day: 0,  intensity: 1.0, note: 'Bouazizi self-immolation Dec 17' },
      { governorateId: 'kasserine',   day: 4,  intensity: 0.85, note: 'Protests spread, police response' },
      { governorateId: 'gafsa',       day: 7,  intensity: 0.80, note: 'Mining belt joins, UGTT local' },
      { governorateId: 'kef',         day: 9,  intensity: 0.65, note: 'Interior spread' },
      { governorateId: 'siliana',     day: 10, intensity: 0.60, note: 'Interior spread' },
      { governorateId: 'kairouan',    day: 12, intensity: 0.70, note: 'Central Tunisia activated' },
      { governorateId: 'sfax',        day: 14, intensity: 0.75, note: 'Second city, organized protest' },
      { governorateId: 'gabes',       day: 16, intensity: 0.55, note: 'South joins' },
      { governorateId: 'sousse',      day: 18, intensity: 0.70, note: 'Coastal middle class joins' },
      { governorateId: 'nabeul',      day: 20, intensity: 0.55, note: 'Greater Tunis periphery' },
      { governorateId: 'ben_arous',   day: 22, intensity: 0.65, note: 'Tunis suburb protests' },
      { governorateId: 'ariana',      day: 23, intensity: 0.70, note: 'Tunis suburb' },
      { governorateId: 'manouba',     day: 24, intensity: 0.60, note: 'Tunis suburb' },
      { governorateId: 'tunis',       day: 28, intensity: 1.0, note: 'Capital — Ben Ali flees' },
    ]
  },
  {
    name: 'Gafsa Mining Basin 2008',
    origin: 'gafsa',
    outcome: 'Repressed — Military deployment after 6 months',
    totalDays: 90,
    steps: [
      { governorateId: 'gafsa',       day: 0,  intensity: 1.0, note: 'CPG hiring protests begin' },
      { governorateId: 'sidi_bouzid', day: 12, intensity: 0.45, note: 'Solidarity protests' },
      { governorateId: 'kasserine',   day: 18, intensity: 0.40, note: 'Minor solidarity' },
      { governorateId: 'sfax',        day: 25, intensity: 0.35, note: 'Trade union statements' },
    ]
  },
  {
    name: 'Post-Saied Opposition Wave 2023',
    origin: 'tunis',
    outcome: 'Contained — Mass arrests, NSF dissolved',
    totalDays: 45,
    steps: [
      { governorateId: 'tunis',       day: 0,  intensity: 0.70, note: 'NSF protests, Feb 2023' },
      { governorateId: 'sfax',        day: 5,  intensity: 0.50, note: 'Solidarity protests' },
      { governorateId: 'sousse',      day: 7,  intensity: 0.45, note: 'Opposition rallies' },
      { governorateId: 'gafsa',       day: 10, intensity: 0.40, note: 'Local protests' },
    ]
  }
];

// ── Transmission factors ───────────────────────────────────────

// Higher = faster transmission between these specific pairs
// Based on UGTT structure, truck routes, family networks
const TRANSMISSION_BOOST: Record<string, number> = {
  'sidi_bouzid:kasserine': 1.4,   // historically fast
  'kasserine:gafsa':       1.3,
  'gafsa:sfax':            1.2,
  'sfax:gabes':            1.1,
  'sousse:tunis':          1.2,
  'ariana:tunis':          1.3,
  'ben_arous:tunis':       1.3,
  'kairouan:sousse':       1.1,
};

const getTransmissionBoost = (
  fromId: string,
  toId: string
): number => {
  return TRANSMISSION_BOOST[`${fromId}:${toId}`]
    || TRANSMISSION_BOOST[`${toId}:${fromId}`]
    || 1.0;
};

// Days for unrest to travel between adjacent governorates
// Based on historical data
const getTransmissionDays = (
  fromId: string,
  toId: string,
  govProfiles: Record<string, any>
): number => {
  const from = govProfiles[fromId];
  const to = govProfiles[toId];

  // Base: 2-4 days for adjacent governorates
  let days = 3;

  // Interior governorates transmit faster (higher grievance, less media control)
  const interiorGovs = ['kasserine', 'sidi_bouzid', 'gafsa', 'kef', 'siliana', 'jendouba'];
  if (interiorGovs.includes(toId)) days = 2;

  // Coastal/urban slower (more police, more diverse)
  const coastalGovs = ['tunis', 'sousse', 'sfax', 'nabeul', 'bizerte'];
  if (coastalGovs.includes(toId)) days = 4;

  // Boost for historically fast connections
  const boost = getTransmissionBoost(fromId, toId);
  days = Math.round(days / boost);

  return Math.max(1, days);
};

// ── RRI similarity between governorates ───────────────────────
// Compares risk variable profiles — similar profiles = higher transmission

const calculateSimilarity = (
  govA: any,
  govB: any
): number => {
  if (!govA || !govB) return 0.5;

  // Compare key indicators
  const indicators = [
    'unemployment_rate',
    'poverty_rate',
    'water_stress',
    'youth_unemployment',
    'risk_level_numeric',
  ];

  let totalSim = 0;
  let count = 0;

  for (const ind of indicators) {
    const a = govA[ind] ?? govA.risk_score ?? 0.5;
    const b = govB[ind] ?? govB.risk_score ?? 0.5;
    if (typeof a === 'number' && typeof b === 'number') {
      // Similarity = 1 - normalized difference
      const maxVal = Math.max(a, b, 1);
      totalSim += 1 - Math.abs(a - b) / maxVal;
      count++;
    }
  }

  // Also compare risk levels
  if (govA.risk_level && govB.risk_level) {
    const levels: Record<string, number> = {
      ALERT: 4, HIGH: 3, MEDIUM: 2, LOW: 1, STABLE: 0
    };
    const diff = Math.abs(
      (levels[govA.risk_level] || 2) -
      (levels[govB.risk_level] || 2)
    );
    totalSim += 1 - diff / 4;
    count++;
  }

  return count > 0 ? totalSim / count : 0.5;
};

// ── Main simulation function ───────────────────────────────────

export function simulatePropagation(
  originId: string,
  originName: string,
  adjacencyGraph: Record<string, string[]>,
  governorates: any[],
  cascadeProbability: number,       // from RRI EQ.17
  maxDays: number = 30,
  activeEventTitle?: string
): PropagationResult {

  // Build gov lookup
  const govById: Record<string, any> = {};
  governorates.forEach(g => {
    govById[g.id] = g;
  });

  const nodes: Record<string, PropagationNode> = {};

  // Origin node
  nodes[originId] = {
    governorateId: originId,
    governorateName: originName,
    probability: 1.0,
    expectedDays: 0,
    path: [originId],
    riskScore: 100,
    status: 'origin',
  };

  // BFS propagation
  interface QueueItem {
    id: string;
    day: number;
    prob: number;
    path: string[];
  }

  const queue: QueueItem[] = [{
    id: originId,
    day: 0,
    prob: 1.0,
    path: [originId],
  }];

  const visited = new Set<string>([originId]);

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current.day >= maxDays) continue;

    const neighbors = adjacencyGraph[current.id] || [];

    for (const neighborId of neighbors) {
      if (visited.has(neighborId)) continue;
      visited.add(neighborId);

      const fromGov = govById[current.id];
      const toGov = govById[neighborId];

      // Calculate transmission probability
      const similarity = calculateSimilarity(fromGov, toGov);
      const boost = getTransmissionBoost(current.id, neighborId);

      // Base transmission from EQ.17 cascade probability
      // Decays with distance (path length)
      const distanceDecay = Math.pow(0.75, current.path.length - 1);
      const transmissionProb =
        cascadeProbability *    // base cascade (0-1)
        similarity *            // structural similarity
        boost *                 // historical network boost
        distanceDecay;          // distance decay

      const arrivalProb = current.prob * transmissionProb;
      const arrivalDay = current.day +
        getTransmissionDays(current.id, neighborId, govById);

      // Only include if probability > 5% and within time window
      if (arrivalProb >= 0.05 && arrivalDay <= maxDays) {
        const status: PropagationNode['status'] =
          arrivalProb >= 0.60 ? 'high' :
          arrivalProb >= 0.30 ? 'medium' :
          'low';

        nodes[neighborId] = {
          governorateId: neighborId,
          governorateName: toGov?.name?.en || neighborId,
          probability: Math.min(arrivalProb, 0.99),
          expectedDays: arrivalDay,
          path: [...current.path, neighborId],
          riskScore: Math.round(arrivalProb * 100),
          status,
        };

        queue.push({
          id: neighborId,
          day: arrivalDay,
          prob: arrivalProb,
          path: [...current.path, neighborId],
        });
      } else if (arrivalProb < 0.05) {
        nodes[neighborId] = {
          governorateId: neighborId,
          governorateName: toGov?.name?.en || neighborId,
          probability: arrivalProb,
          expectedDays: arrivalDay,
          path: [...current.path, neighborId],
          riskScore: Math.round(arrivalProb * 100),
          status: 'unreachable',
        };
      }
    }
  }

  // SIR Model Simulation (EQ.4)
  // Base parameters from model_v2.json
  const baseBeta = 0.4;
  const gamma = 0.15;
  // Scale beta by cascade probability to link the models
  const beta = baseBeta * (0.5 + cascadeProbability);
  
  const sirData: SIRDataPoint[] = [];
  let S = 0.99;
  let I = 0.01;
  let R = 0.00;
  
  for (let day = 0; day <= maxDays; day++) {
    sirData.push({ day, S, I, R });
    
    const dS = -beta * S * I;
    const dI = beta * S * I - gamma * I;
    const dR = gamma * I;
    
    S = Math.max(0, S + dS);
    I = Math.max(0, I + dI);
    R = Math.max(0, R + dR);
  }

  return {
    originId,
    originName,
    nodes,
    maxReach: maxDays,
    generatedAt: Date.now(),
    cascadeProbability,
    activeEvent: activeEventTitle,
    sirData,
  };
}

// ── Historical pattern match ───────────────────────────────────
// Compare current simulation to historical waves
// Returns similarity score 0-1

export function compareToHistorical(
  simulation: PropagationResult,
  historical: HistoricalWave
): number {
  const simIds = Object.keys(simulation.nodes).filter(
    id => simulation.nodes[id].status !== 'unreachable'
  );
  const histIds = historical.steps.map(s => s.governorateId);

  // Jaccard similarity of governorate sets
  const intersection = simIds.filter(id => histIds.includes(id));
  const union = new Set([...simIds, ...histIds]);

  const setMatch = intersection.length / union.size;

  // Path similarity — does simulation follow same sequence?
  let pathMatch = 0;
  if (intersection.length > 0) {
    const simSorted = intersection
      .sort((a, b) =>
        simulation.nodes[a].expectedDays -
        simulation.nodes[b].expectedDays
      );
    const histSorted = intersection
      .sort((a, b) => {
        const ha = historical.steps.find(s => s.governorateId === a)?.day || 0;
        const hb = historical.steps.find(s => s.governorateId === b)?.day || 0;
        return ha - hb;
      });

    let matches = 0;
    for (let i = 0; i < Math.min(simSorted.length, histSorted.length); i++) {
      if (simSorted[i] === histSorted[i]) matches++;
    }
    pathMatch = matches / Math.max(simSorted.length, 1);
  }

  return (setMatch * 0.6) + (pathMatch * 0.4);
}

// ── Save simulation to Supabase ────────────────────────────────

export async function saveSimulation(
  result: PropagationResult
): Promise<void> {
  try {
    await supabase.from('rri_snapshots').insert({
      rri: 0,
      p_rev: result.cascadeProbability,
      velocity: 0,
      compound_stress: 0,
      cascade_probability: result.cascadeProbability,
      pattern_similarity: 0,
      threshold_breaches: 0,
      trigger: `propagation:${result.originId}`,
    });
  } catch {}
}
