export type EventSource = 'REST' | 'WS' | 'RSS' | 'INTERNAL';

export interface CanonicalEvent {
  id: string;              // ULID or Deterministic Hash
  source_id: string;       // Original ID (Database PK, RSS GUID, etc.)
  source: string;          // Origin boundary
  timestamp: number;       // The analytical time of the event (for sorting)
  updated_at: number;      // System ingestion time (for Last-Write-Wins conflict resolution)
  version: number;         // Monotonically increasing update counter
  type: string;            // 'INFO' | 'UPDATE' | 'WARNING' | 'CRITICAL' | 'SIGNAL' | 'BREAKING'
  content: string;
  metadata: Record<string, any>;
  urgent: boolean;
}
