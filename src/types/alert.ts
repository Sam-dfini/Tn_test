export type AlertSeverity = 'TACTICAL' | 'OPERATIONAL' | 'STRATEGIC';

export interface SystemAlert {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  severity: AlertSeverity;
  domain: string;
  source: string;
  governorates?: string[];
  affectedEquations?: string[];
  metadata?: Record<string, any>;
  read?: boolean;
}

export interface AlertCluster {
  id: string;
  baseAlert: SystemAlert;
  relatedAlerts: SystemAlert[];
  totalSignals: number;
  timeSpanHours: number;
}
