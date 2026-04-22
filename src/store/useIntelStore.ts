import { create } from 'zustand';
import { computeClusters } from '../services/clusters';
import { analyzeActorNetwork } from '../services/actorNetwork';
import { computeCrossSource } from '../services/narrativeEngine';

interface IntelStore {
  clusters: any;
  actors: any;
  narrative: any;
  loading: boolean;
  runClusters: (signals: any) => Promise<void>;
  runActors: (articles: any[]) => Promise<void>;
  runNarrative: (articles: any[]) => Promise<void>;
}

export const useIntelStore = create<IntelStore>((set) => ({
  clusters: null,
  actors: null,
  narrative: null,
  loading: false,

  runClusters: async (signals) => {
    set({ loading: true });
    await new Promise(r => setTimeout(r, 800));
    const result = computeClusters(signals);
    set({ clusters: result, loading: false });
  },

  runActors: async (articles) => {
    set({ loading: true });
    await new Promise(r => setTimeout(r, 1000));
    const result = analyzeActorNetwork(articles);
    set({ actors: result, loading: false });
  },

  runNarrative: async (articles) => {
    set({ loading: true });
    await new Promise(r => setTimeout(r, 900));
    const result = computeCrossSource(articles);
    set({ narrative: result, loading: false });
  }
}));
