import React, { useState, useEffect } from 'react';
import { create } from 'zustand';
import { Loader2 } from 'lucide-react';
import HeaderBar from './HeaderBar';
import KpiRow from './KpiRow';
import TacticalMap from './TacticalMap';
import GovernoratePanel from './GovernoratePanel';
import CropMonitoring from './CropMonitoring';
import ProteinMarket from './ProteinMarket';
import PipelineStatus from './PipelineStatus';
import PricePrediction from './PricePrediction';
import AlertPanel from './AlertPanel';

interface DashboardState {
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

export default function TunisiaAgricultureDashboard() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate initial data loading
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#0a0f1a] text-[#f1f5f9]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-[#3b82f6]" />
          <div className="text-sm font-semibold uppercase tracking-widest text-[#94a3b8]">
            Initializing ASIL System...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-[#f1f5f9] font-sans selection:bg-[#3b82f6] selection:text-white pb-12">
      <HeaderBar />
      
      <main className="mx-auto max-w-[1600px] p-4 lg:p-6 flex flex-col gap-6">
        <KpiRow />
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 min-h-[500px]">
          <div className="lg:col-span-7 xl:col-span-8 flex flex-col">
            <TacticalMap />
          </div>
          <div className="lg:col-span-5 xl:col-span-4 flex flex-col">
            <GovernoratePanel />
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 min-h-[400px]">
          <CropMonitoring />
          <ProteinMarket />
        </div>
        
        <div className="w-full">
          <PipelineStatus />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 min-h-[350px]">
          <PricePrediction />
          <AlertPanel />
        </div>
        
      </main>
    </div>
  );
}
