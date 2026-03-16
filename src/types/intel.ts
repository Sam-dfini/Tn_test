export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'ALERT';
export type TensionLevel = 'stable' | 'moderate' | 'tension' | 'high' | 'alert';

export interface Governorate {
  id: string;
  name: {
    en: string;
    ar: string;
  };
  risk_level: RiskLevel;
  tension: TensionLevel;
  rri_score: number;
  protest_count: number;
  unemp: number;
  water_cut_hours: number;
  internet_score: number;
  event_count: number;
  pop: number;
  area_km2: number;
  pop_density: number;
  youth_pct: number;
  rural_pct: number;
  gdp_pc_tnd: number;
  poverty_pct: number;
  literacy_pct: number;
  internal_migration: number;
  healthcare_beds_1k: number;
  lat?: number;
  lon?: number;
  tribal_influence: 'LOW' | 'MEDIUM' | 'HIGH';
  police_presence: 'LOW' | 'MEDIUM' | 'HIGH';
  main_tribes: string[];
  key_industry: string;
  pred_7d: number;
  pred_30d: number;
  pred_90d: number;
}

export interface IntelEvent {
  id: string;
  date: string;
  type: 'protest' | 'arrest' | 'economic' | 'water' | 'migration' | 'internet' | 'political' | 'detention';
  title: string;
  summary: string;
  gov: string;
  lat: number;
  lon: number;
  severity: 1 | 2 | 3;
  urgent: boolean;
  actors: string[];
  source: string;
  cases: string[];
}

export interface RRIVariable {
  id: string;
  category: string;
  name: string;
  value: number; // normalized 0-1
  weight: number;
  direction: 'positive' | 'negative';
  source: string;
  last_updated: string;
}

export interface Actor {
  id: string;
  name: string;
  role: string;
  faction: string;
  influence: number;
  defection_score: number;
  last_seen: string;
  threat_level: 'ACTIVE' | 'MONITORED' | 'INACTIVE';
  connections: string[];
  recent_activity: {
    date: string;
    text: string;
  }[];
}

export interface IntelCase {
  id: string;
  title: string;
  status: 'ACTIVE' | 'MONITORED' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  opened: string;
  summary: string;
  governorates: string[];
  actors: string[];
  suspects: string[];
  events: string[];
  timeline: {
    date: string;
    event: string;
  }[];
  classification: string;
}
