import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ViewMode = 'PUBLIC' | 'ANALYST' | 'STRATEGIC';

interface ViewModeState {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
}

/**
 * useViewMode
 * Manages the platform's access level / visibility tier.
 * PUBLIC: Limited data, no sensitive modeling.
 * ANALYST: Full standard dashboard.
 * STRATEGIC: Adds forecasts, scenarios, and executive actions.
 */
export const useViewMode = create<ViewModeState>()(
  persist(
    (set) => ({
      viewMode: 'ANALYST', // Default to Analyst for now
      setViewMode: (mode: ViewMode) => set({ viewMode: mode }),
    }),
    {
      name: 'tunisiaintel-view-mode',
    }
  )
);
