import { IntelEvent, ShockSignal } from '../types/intel';
import { SHOCK_MAPPINGS, getDomainForVariable } from '../config/shockMappings';

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
      intensity: (event.severity || 1) / 3, // Normalize 1-3 to 0-1
      message: event.title,
      timestamp: new Date(event.date).getTime(),
      overrides: {},
      governorates: [event.gov].filter(Boolean),
      affectedEquations: []
    };
  }

  const normalizedIntensity = Math.min(1.0, Math.max(0.0, ((event.severity || 1) / 3) * mapping.baseIntensityMultiplier));
  const overrides: Record<string, number> = {};
  
  // Calculate the override value. 
  // In a real scenario, we'd add to the baseline variable. Here we just return an absolute or relative shift based on intensity.
  // For demonstration, we assume intensity > 0.5 means a severe shift.
  if (normalizedIntensity > 0) {
    overrides[mapping.targetVariable] = normalizedIntensity * 100; // Mock absolute scaling
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
  
  // Try to find matching equations
  const mapping = Object.values(SHOCK_MAPPINGS).find(m => m.targetVariable === targetVariable);
  const equations = mapping?.affectedEquations || ['EQ.13']; // default fallback

  return {
    id: `manual-shock-${Date.now()}`,
    type: domain,
    source: 'Analyst Sandbox',
    intensity: intensity,
    message: description,
    timestamp: Date.now(),
    overrides: {
      [targetVariable]: intensity * 100 // scaled
    },
    governorates: [originGovernorate],
    affectedEquations: equations
  };
};
