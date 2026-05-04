import { CanonicalEvent, EventSource } from '../types/pipeline';
import { generateEventId } from '../utils/idUtils';

/**
 * Single Source of Truth for Data Pipeline Operations
 */
export class IntelligencePipeline {
  private store: Map<string, CanonicalEvent> = new Map();
  private maxBufferSize: number;

  constructor(maxBufferSize: number = 200) {
    this.maxBufferSize = maxBufferSize;
  }

  /**
   * Normalizer: Ensures all events entering the pipeline obey a strict schema
   */
  private normalize(rawEvent: any, source: string): CanonicalEvent | null {
    if (!rawEvent || (!rawEvent.id && !rawEvent.content && !rawEvent.title)) return null;

    const sysSource = rawEvent.source || source;
    const title = rawEvent.title || rawEvent.content || "Unknown";
    const dateObj = new Date(rawEvent.date || rawEvent.timestamp || rawEvent.time || Date.now());
    const dateStr = dateObj.toISOString();

    // Step 2: Use stable deterministic ID if not already a pipeline ID
    let finalId = rawEvent.id;
    if (!finalId || !String(finalId).startsWith('evt_')) {
      finalId = generateEventId({ title, source: sysSource });
    }

    return {
      id: finalId,
      source_id: String(rawEvent.id || rawEvent.guid || finalId),
      source: sysSource,
      timestamp: dateObj.getTime(),
      updated_at: rawEvent.updated_at || dateObj.getTime(),
      version: rawEvent.version || 1,
      type: rawEvent.type || (rawEvent.urgent ? 'CRITICAL' : 'INFO'),
      content: title,
      metadata: {
        ...rawEvent.metadata,
        description: rawEvent.description || rawEvent.summary || rawEvent.content || "",
        location: rawEvent.location || rawEvent.gov || null,
        date: dateStr
      },
      urgent: !!rawEvent.urgent
    };
  }

  /**
   * The ingestion gate resolving conflicts safely
   */
  public ingest(rawPayloads: any[], source: string): boolean {
    let hasMutated = false;

    for (const raw of rawPayloads) {
      const incoming = this.normalize(raw, source);
      if (!incoming) continue;

      const existing = this.store.get(incoming.id);

      if (existing) {
        // Last-Write-Wins (LWW): Reject data physically older than the currently parsed state
        if (incoming.version < existing.version || incoming.updated_at <= existing.updated_at) {
           continue; 
        }
        incoming.version = existing.version + 1;
      }

      // Upsert: Pushes to the end of the Map structure automatically if deleted first
      if (existing) this.store.delete(incoming.id);
      this.store.set(incoming.id, incoming);
      hasMutated = true;
    }

    if (hasMutated) this.prune();
    return hasMutated;
  }

  /**
   * Memory pruning function dropping oldest timestamps
   */
  private prune(): void {
    if (this.store.size <= this.maxBufferSize) return;

    // Convert map values to array and sort DESCENDING by timestamp (newest first)
    const sorted = Array.from(this.store.values()).sort((a, b) => b.timestamp - a.timestamp);
    
    // Target the overflow tail (the oldest items)
    const keysToSever = sorted.slice(this.maxBufferSize).map(evt => evt.id);
    keysToSever.forEach(key => this.store.delete(key));
  }

  /**
   * Projection output to UI layer
   */
  public getSnapshot(): CanonicalEvent[] {
    return Array.from(this.store.values()).sort((a, b) => b.timestamp - a.timestamp);
  }
}
