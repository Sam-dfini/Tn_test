
export interface StructuredResult {
  type: "result" | "error" | "loading";
  title: string;
  data: any;
  interpretation?: string;
  rriImpact?: {
    r: number;
    s: number;
    direction: 'up' | 'down' | 'stable';
  };
  suggestedActions?: string[];
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  meta?: {
    timestamp: number;
    source: string;
    confidence: number;
  };
}

export interface TerminalLine {
  id: string;
  type: 'command' | 'output' | 'error' | 'system' | 'success' | 'structured';
  content?: string;
  structured?: StructuredResult;
  timestamp: number;
}

export interface CommandDefinition {
  command: string;
  description: string;
  parameters?: string[];
  category: 'general' | 'rri' | 'economy' | 'events' | 'intel' | 'simulation' | 'advanced';
}

export const COMMANDS: CommandDefinition[] = [
  // GENERAL
  { command: 'help', description: 'Show available commands', category: 'general' },
  { command: 'clear', description: 'Clear terminal console', category: 'general' },
  { command: 'status', description: 'Show system status', category: 'general' },
  
  // RRI MODEL
  { command: 'show rri', description: 'Display current Revolution Risk Index', category: 'rri' },
  { command: 'explain rri', description: 'Logical breakdown of RRI composition', category: 'rri' },
  { command: 'show variables', description: 'List all active variables in the system', category: 'rri' },
  { command: 'variable [id]', description: 'Inspect specific variable status/history', category: 'rri', parameters: ['id'] },
  
  // ECONOMY
  { command: 'show economy', description: 'Macroeconomic pulse overview', category: 'economy' },
  { command: 'show inflation', description: 'Inflation trends [7d|30d|1y]', category: 'economy', parameters: ['timeframe'] },
  { command: 'show remittances', description: 'Remittance inflow analysis', category: 'economy' },
  
  // EVENTS
  { command: 'show events', description: 'List events in timeframe', category: 'events', parameters: ['timeframe'] },
  { command: 'show signals', description: 'Real-time signal feed', category: 'events' },
  { command: 'timeline', description: 'Display event timeline', category: 'events' },
  
  // INTELLIGENCE
  { command: 'detect clusters', description: 'Run group/threat cluster detection', category: 'intel' },
  { command: 'show actors', description: 'Display actor network mapping', category: 'intel' },
  { command: 'analyze narrative', description: 'Extract dominant narratives', category: 'intel' },
  { command: 'show radicalisation', description: 'Monitoring regional radicalisation trends', category: 'intel' },
  
  // SIMULATION
  { command: 'simulate unrest', description: 'Run baseline unrest simulation', category: 'simulation' },
  { command: 'simulate protest', description: 'Simulate protest spread [city] [days]', category: 'simulation', parameters: ['city', 'days'] },
  { command: 'simulate economic shock', description: 'Stress test economy models', category: 'simulation' },
  
  // ADVANCED
  { command: 'run eq17', description: 'Cascade probability model', category: 'advanced' },
  { command: 'run eq18', description: 'Elite defection probability engine', category: 'advanced' },
  { command: 'run eq19', description: 'Information amplification/echo-chamber analysis', category: 'advanced' },
];
