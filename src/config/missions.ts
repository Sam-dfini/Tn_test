import { MissionConfig } from '../types/intel';

export const MISSIONS: MissionConfig[] = [
  {
    id: 'food-security',
    title: 'Food Security Crisis',
    description: 'Monitoring BCI levels, wheat dependency, and subsidy burdens to predict potential social contract breakdown.',
    status: 'ACTIVE',
    involvedDomains: ['Agriculture', 'Climate', 'Informal Economy', 'Social Dynamics', 'Narrative'],
    preloadedVariables: {
      'economy.inflation': 0.85,
      'social.water_crisis_govs': 0.7,
      'social.ugtt_mobilisation_level': 0.5,
    },
    widgetLayout: ['bci-gauge', 'wheat-dependency', 'subsidy-burden', 'flour-prices'],
    priority: 'HIGH'
  },
  {
    id: 'elite-fracture',
    title: 'Elite Fracture',
    description: 'Tracking Ministerial Instability Index (MII) and coalition fragmentation signals.',
    status: 'MONITORING',
    involvedDomains: ['Actor Network', 'Political', 'Governance Matrix', 'Societal Fracture'],
    preloadedVariables: {
      'geopolitical.imf_deal_probability': 0.25,
    },
    widgetLayout: ['mii-index', 'elite-network', 'coalition-health'],
    priority: 'CRITICAL'
  },
  {
    id: 'ugtt-escalation',
    title: 'UGTT Escalation',
    description: 'Analyzing strike frequency and labor mobilization patterns across industrial zones.',
    status: 'DORMANT',
    involvedDomains: ['Social Dynamics', 'Events', 'Hotspot Clusters', 'Narrative', 'Simulation'],
    preloadedVariables: {
      'social.ugtt_strike_count_2025': 0.75,
    },
    widgetLayout: ['strike-map', 'mobilization-trend', 'ugtt-narrative'],
    priority: 'MEDIUM'
  },
  {
    id: 'water-collapse',
    title: 'Water Collapse',
    description: 'Monitoring dam levels, aquifer depletion, and agricultural water rationing risks.',
    status: 'DORMANT',
    involvedDomains: ['Climate & Water', 'Agriculture', 'Governorates', 'Social Dynamics'],
    preloadedVariables: {
      'social.water_crisis_govs': 0.9,
    },
    widgetLayout: ['dam-capacity', 'aquifer-status', 'water-grievance'],
    priority: 'HIGH'
  },
  {
    id: 'border-instability',
    title: 'Border Instability',
    description: 'Tracking smuggling route activation and radicalisation gradients in border governorates.',
    status: 'DORMANT',
    involvedDomains: ['Security & Borders', 'Geopolitical', 'Informal Economy', 'Radicalisation'],
    preloadedVariables: {
      'social.coast_guard_interceptions': 0.8,
    },
    widgetLayout: ['border-activity', 'smuggling-revenue', 'radicalisation-map'],
    priority: 'MEDIUM'
  },
  {
    id: 'narrative-war',
    title: 'Narrative War',
    description: 'Monitoring disinformation velocity and cognitive warfare signals from foreign actors.',
    status: 'DORMANT',
    involvedDomains: ['Cognitive Warfare', 'Narrative Intelligence', 'Social Media Signals', 'Political'],
    preloadedVariables: {
      'social.decree54_charged': 0.6,
    },
    widgetLayout: ['disinfo-velocity', 'narrative-divergence', 'actor-amplification'],
    priority: 'LOW'
  }
];
