import { create } from 'zustand';
import { IntelligencePipeline } from '../lib/IntelligenceEngine';
import { 
  IntelligenceEvent, 
  deduplicateEvents, 
  filterEventsByTimeframe, 
  DEBUG_EVENTS,
  normalizeEvent
} from '../utils/eventUtils';

// Instantiate the SSOT Engine instance
const engine = new IntelligencePipeline(200);

interface Signal {
  id: string;
  content: string;
  timestamp: string;
  source: string;
}

interface EventsStore {
  events: IntelligenceEvent[];
  signals: Signal[];
  loading: boolean;
  fetchEvents: (timeframe?: string) => Promise<void>;
  fetchSignals: () => Promise<void>;
  ingestData: (raw: any[], source: string) => void;
  setEvents: (rawEvents: any[]) => void;
}

export const useEventsStore = create<EventsStore>((set, get) => ({
  events: [],
  signals: [],
  loading: false,
  
  fetchEvents: async (timeframe = '7d') => {
    set({ loading: true });
    await new Promise(r => setTimeout(r, 600));
    set({ loading: false });
  },

  fetchSignals: async () => {
    set({ loading: true });
    await new Promise(r => setTimeout(r, 400));
    const mockSignals: Signal[] = [
      { id: 'S1', content: 'Abnormal phosphorus transport delay in Gafsa', timestamp: new Date().toISOString(), source: 'SATELLITE' },
      { id: 'S2', content: 'Keyword "bread" rising in southern governorates', timestamp: new Date().toISOString(), source: 'SOCIAL' },
      { id: 'S3', content: 'Unusual capital flight signature detected in offshore nodes', timestamp: new Date().toISOString(), source: 'FIU_MONITOR' },
    ];
    set({ signals: mockSignals, loading: false });
  },

  ingestData: (raw, source) => {
    if (DEBUG_EVENTS) {
      console.group(`[PIPELINE] Ingestion logic starting: ${source}`);
      console.log("Input objects:", raw?.length || 0);
    }

    // Pass through engine's conflict resolution (LWW)
    const mutated = engine.ingest(raw || [], source);
    
    if (mutated) {
      const snapshot = engine.getSnapshot();
      
      // FINAL STORE-LEVEL DEDUP GUARD
      // This is the "Nuclear Option" to ensure zero duplication even if normalization fails.
      const uniqueMap = new Map<string, any>();
      snapshot.forEach(e => {
        if (!e || !e.id) return;
        if (!uniqueMap.has(e.id)) {
          uniqueMap.set(e.id, e);
        }
      });

      const uniqueEvents = Array.from(uniqueMap.values());
      const cleaned = deduplicateEvents(uniqueEvents, source);
      
      if (DEBUG_EVENTS) {
        console.log("[STORE] Unique events count finalized:", cleaned.length);
      }
      
      set({ events: cleaned }); 
    } else if (DEBUG_EVENTS) {
      console.log("Pipeline: No state mutation required.");
    }
    
    if (DEBUG_EVENTS) console.groupEnd();
  },

  setEvents: (rawEvents) => {
    // Force cleaning even on direct sets
    const cleaned = deduplicateEvents(rawEvents || [], 'SET_EVENTS');
    
    // Final duplicate key rescue
    const uniqueMap = new Map();
    cleaned.forEach(e => {
        if (e && e.id) uniqueMap.set(e.id, e);
    });

    const finalEvents = Array.from(uniqueMap.values());
    if (DEBUG_EVENTS) console.log(`[STORE] setEvents count: ${finalEvents.length}`);
    
    set({ events: finalEvents });
  }
}));
