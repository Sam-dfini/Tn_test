import { ShockEventMap } from '../types/intel';

// This matrix maps external real-world event types (e.g. from RSS or OSINT) 
// directly into the specific pipeline variables and attributes the impacted RRI equations.
// This bridges the "Event Space" with the "Mathematical Space".

export const SHOCK_MAPPINGS: Record<string, ShockEventMap> = {
  // Social & Labor Events
  'protest': {
    eventType: 'protest',
    targetVariable: 'social.protest_events_30d',
    baseIntensityMultiplier: 1.5,
    decayRate: 0.1, // decays by 10% per day
    affectedEquations: ['EQ.1', 'EQ.17', 'EQ.19']
  },
  'strike': {
    eventType: 'strike',
    targetVariable: 'social.ugtt_strike_count_2025',
    baseIntensityMultiplier: 2.0,
    decayRate: 0.05, 
    affectedEquations: ['EQ.1', 'EQ.17', 'EQ.24']
  },
  'ugtt': {
    eventType: 'ugtt',
    targetVariable: 'social.ugtt_mobilisation_level',
    baseIntensityMultiplier: 3.0,
    decayRate: 0.02,
    affectedEquations: ['EQ.2', 'EQ.17']
  },
  
  // Economic & Resource Events
  'economic': {
    eventType: 'economic',
    targetVariable: 'economy.inflation',
    baseIntensityMultiplier: 1.2,
    decayRate: 0.01,
    affectedEquations: ['EQ.1', 'EQ.10', 'EQ.13']
  },
  'water': {
    eventType: 'water',
    targetVariable: 'social.water_crisis_govs',
    baseIntensityMultiplier: 2.5,
    decayRate: 0.05,
    affectedEquations: ['EQ.13', 'EQ.17']
  },

  // Security & Border Events
  'migration': {
    eventType: 'migration',
    targetVariable: 'social.coast_guard_interceptions',
    baseIntensityMultiplier: 1.1,
    decayRate: 0.15,
    affectedEquations: ['EQ.4']
  },
  'arrest': {
    eventType: 'arrest',
    targetVariable: 'social.decree54_charged',
    baseIntensityMultiplier: 1.8,
    decayRate: 0.08,
    affectedEquations: ['EQ.2']
  },
  'political': {
    eventType: 'political',
    targetVariable: 'geopolitical.imf_deal_probability',
    baseIntensityMultiplier: -1.5, // Negative intensity lowers the probability
    decayRate: 0.05,
    affectedEquations: ['EQ.1', 'EQ.2']
  }
};

/**
 * Helper to determine which overarching domain an event belongs to 
 * based on the target variable.
 */
export const getDomainForVariable = (variable: string): 'ECON' | 'SEC' | 'AGRI' | 'SOCIAL' | 'SYSTEM' | 'POLITICAL' | 'CLIMATE' => {
  if (variable.startsWith('economy.')) return 'ECON';
  if (variable.startsWith('social.water') || variable.startsWith('agri')) return 'AGRI';
  if (variable.startsWith('social.ugtt') || variable.startsWith('social.protest')) return 'SOCIAL';
  if (variable.startsWith('social.coast_guard')) return 'SEC';
  if (variable.startsWith('geopolitical.')) return 'POLITICAL';
  return 'SYSTEM';
};
