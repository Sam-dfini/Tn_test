import { create } from 'zustand';
import { calculateRRI } from '../math/rri/engine';

interface SimulationResult {
  peak_infected: number;
  duration: number;
  spread: string[];
  cascade_prob: number;
}

interface ModelStore {
  rriState: any;
  lastSimulation: SimulationResult | null;
  loading: boolean;
  runRRI: (overrides?: any) => void;
  runSimulation: (type: string) => Promise<void>;
  calculateEQ17: () => any;
  calculateEQ18: () => any;
  calculateEQ19: () => any;
}

export const useModelStore = create<ModelStore>((set, get) => ({
  rriState: calculateRRI(),
  lastSimulation: null,
  loading: false,

  runRRI: (overrides) => {
    const newState = calculateRRI(overrides);
    set({ rriState: newState });
    // Global notification for dashboard if needed
    window.dispatchEvent(new CustomEvent('ti:rri:updated', { detail: newState }));
  },

  runSimulation: async (type) => {
    set({ loading: true });
    await new Promise(r => setTimeout(r, 1200));
    
    if (type === 'unrest') {
      const result: SimulationResult = {
        peak_infected: 0.12,
        duration: 18,
        spread: ['Tunis', 'Sfax', 'Gafsa', 'Kasserine'],
        cascade_prob: 0.342
      };
      set({ lastSimulation: result, loading: false });
    } else {
      set({ loading: false });
    }
  },

  calculateEQ17: () => {
    // In a real app, this would call specialized logic
    // For now, it's integrated in RRI result but we can expose it
    return get().rriState.cascade_probability;
  },

  calculateEQ18: () => {
    return get().rriState.elite_defection_prob;
  },

  calculateEQ19: () => {
    return get().rriState.info_amplification;
  }
}));
