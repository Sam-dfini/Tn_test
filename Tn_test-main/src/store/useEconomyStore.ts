import { create } from 'zustand';
import { getRealTimeMacroIndicators, MacroIndicator } from '../services/economicDataService';

interface EconomyStore {
  indicators: MacroIndicator[];
  loading: boolean;
  error: string | null;
  fetchEconomy: () => Promise<void>;
  updateIndicator: (label: string, value: string) => void;
}

export const useEconomyStore = create<EconomyStore>((set) => ({
  indicators: [],
  loading: false,
  error: null,
  
  fetchEconomy: async () => {
    set({ loading: true, error: null });
    try {
      const data = await getRealTimeMacroIndicators();
      set({ indicators: data, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  updateIndicator: (label, value) => {
    set((state) => ({
      indicators: state.indicators.map((ind) => 
        ind.label === label ? { ...ind, value } : ind
      )
    }));
  }
}));
