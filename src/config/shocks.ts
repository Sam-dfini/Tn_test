import { ShockSignal } from '../types/intel';

export const PRESET_SHOCKS: Record<string, Omit<ShockSignal, 'timestamp'>> = {
  'EID_PRICE_SHOCK': {
    id: 'EID_PRICE_SHOCK',
    type: 'AGRI',
    source: 'Market Monitor (OSINT)',
    intensity: 0.85,
    message: 'Sheep prices for Eid al-Adha projected to breach 1,200 TND in major urban centers.',
    overrides: {
      'economy.inflation': 9.2,
      'A2': 9.2,
      'E81': 22.5, // Poverty increase
      'M202': 0.65, // Protest mobilization up
    },
    governorates: ['Tunis', 'Sfax', 'Sousse']
  },
  'WATER_CRISIS_EXPANSION': {
    id: 'WATER_CRISIS_EXPANSION',
    type: 'SYSTEM',
    source: 'SONEDE Alert System',
    intensity: 0.92,
    message: 'Scheduled water cuts expanded to 14 governorates; duration >12h in Sahel region.',
    overrides: {
      'social.water_crisis_govs': 14,
      'B26': 0.95, // Water stress
      'M202': 0.78, // Protest mobilization spikes
    }
  },
  'IMF_BREAKDOWN_SIGNAL': {
    id: 'IMF_BREAKDOWN_SIGNAL',
    type: 'ECON',
    source: 'Diplomatic Cables (Unverified)',
    intensity: 0.75,
    message: 'IMF technical mission reportedly delayed indefinitely over subsidy reform disagreement.',
    overrides: {
      'geopolitical.imf_deal_probability': 5,
      'economy.fx_reserves': 62,
      'economy.tnd_usd': 3.45,
    }
  }
};
