export interface Variable {
  id: string;
  category: string;
  name: string;
  value: number | null;
  weight: number;
  threshold: number;
  volatility: number;
  history: number[];
  pipelineField: string;
  nlpKeywords: string[];
  dataSource?: string;
}

export type VariableMap = Record<string, Variable>;

export interface Governorate {
  id: string;
  name: string;
  unemp: number;
  water_stress: number;
  hist_protest: number;
  security_presence: number;
}

export type GovernorateMap = Record<string, Governorate>;

export interface NewsFeedItem {
  id: string;
  title: string;
  impact: number;
  variablesAffected: string[];
  timestamp: number;
}
