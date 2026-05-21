import { IntelEvent, ShockSignal } from '../types/intel';
import { SHOCK_MAPPINGS, getDomainForVariable } from '../config/shockMappings';

/**
 * Realistic override ranges per target variable.
 * Maps variable name to its normal (baseline) and crisis (max-intensity) absolute values.
 * Intensity is used to linearly interpolate between the two.
 */
const VARIABLE_RANGES: Record<string, { normal: number; crisis: number }> = {
  'social.protest_events_30d':           { normal: 23,   crisis: 80 },
  'social.ugtt_strike_count_2025':       { normal: 847,  crisis: 1300 },
  'social.ugtt_mobilisation_level':      { normal: 0.5,  crisis: 0.95 },
  'economy.inflation':                   { normal: 7.1,  crisis: 16 },
  'social.water_crisis_govs':            { normal: 8,    crisis: 18 },
  'social.coast_guard_interceptions':    { normal: 23000,crisis: 42000 },
  'social.decree54_charged':             { normal: 67,   crisis: 160 },
  'geopolitical.imf_deal_probability':   { normal: 31,   crisis: 5 },
};

/**
 * Returns a realistic absolute override value for a given variable + intensity.
 * Clamps to a sensible range for that variable.
 */
function computeOverride(targetVariable: string, intensity: number): number {
  const range = VARIABLE_RANGES[targetVariable];
  if (!range) {
    // Unknown variable: use intensity as a 0-100 scaled value
    return Math.round(intensity * 100);
  }
  const delta = range.crisis - range.normal;
  return Math.round((range.normal + intensity * delta) * 100) / 100;
}

/**
 * Converts a raw IntelEvent (e.g. from RSS feed or OSINT DB) into a standardized 
 * ShockSignal that can be ingested by the PipelineContext and propagated through the engine.
 */
export const adaptEventToShock = (event: IntelEvent): ShockSignal | null => {
  const mapping = SHOCK_MAPPINGS[event.type] || Object.values(SHOCK_MAPPINGS).find(m => event.title.toLowerCase().includes(m.eventType));
  
  if (!mapping) {
    // Fallback for unknown events
    return {
      id: `shock-${event.id}`,
      type: 'SYSTEM',
      source: event.source || 'Unknown',
      intensity: (event.severity || 1) / 3,
      message: event.title,
      timestamp: new Date(event.date).getTime(),
      overrides: {},
      governorates: [event.gov].filter(Boolean),
      affectedEquations: []
    };
  }

  const normalizedIntensity = Math.min(1.0, Math.max(0.0, ((event.severity || 1) / 3) * Math.abs(mapping.baseIntensityMultiplier)));
  const overrides: Record<string, number> = {};

  if (normalizedIntensity > 0) {
    overrides[mapping.targetVariable] = computeOverride(mapping.targetVariable, normalizedIntensity);
  }

  return {
    id: `shock-${event.id}`,
    type: getDomainForVariable(mapping.targetVariable),
    source: event.source,
    intensity: normalizedIntensity,
    message: event.summary || event.title,
    timestamp: new Date(event.date).getTime(),
    overrides,
    governorates: [event.gov].filter(Boolean),
    affectedEquations: mapping.affectedEquations
  };
};

/**
 * Creates a manual ShockSignal for Sandbox mode.
 */
export const createManualShock = (
  domain: ShockSignal['type'],
  targetVariable: string,
  intensity: number,
  originGovernorate: string,
  description: string
): ShockSignal => {
  
  const mapping = Object.values(SHOCK_MAPPINGS).find(m => m.targetVariable === targetVariable);
  const equations = mapping?.affectedEquations || ['EQ.13'];

  return {
    id: `manual-shock-${Date.now()}`,
    type: domain,
    source: 'Analyst Sandbox',
    intensity: intensity,
    message: description,
    timestamp: Date.now(),
    overrides: {
      [targetVariable]: computeOverride(targetVariable, intensity),
    },
    governorates: [originGovernorate],
    affectedEquations: equations
  };
};
