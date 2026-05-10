import { create } from 'zustand';

export interface DashboardState {
  selectedGovernorate: string | null;
  setSelectedGovernorate: (gov: string | null) => void;
  timeRange: string;
  setTimeRange: (range: string) => void;
  activeLayers: string[];
  toggleLayer: (layer: string) => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  selectedGovernorate: null,
  setSelectedGovernorate: (gov) => set({ selectedGovernorate: gov }),
  timeRange: '30d',
  setTimeRange: (range) => set({ timeRange: range }),
  activeLayers: ['ndvi', 'boundaries'],
  toggleLayer: (layer) => set((state) => ({
    activeLayers: state.activeLayers.includes(layer)
      ? state.activeLayers.filter((l) => l !== layer)
      : [...state.activeLayers, layer],
  })),
}));
