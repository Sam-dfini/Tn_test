import React, { useState, useEffect } from 'react';
import { Loader2, Sprout, Droplets, Wheat } from 'lucide-react';
import { ModuleHeader } from '../shared/ProfessionalShared';
import clsx from 'clsx';
import KpiRow from './KpiRow';
import TacticalMap from './TacticalMap';
import GovernoratePanel from './GovernoratePanel';
import CropMonitoring from './CropMonitoring';
import ProteinMarket from './ProteinMarket';
import PipelineStatus from './PipelineStatus';
import PricePrediction from './PricePrediction';
import AlertPanel from './AlertPanel';
import { useDashboardStore } from './store';

export default function TunisiaAgricultureDashboard() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'strategic' | 'technical' | 'market'>('strategic');

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
            Initializing AGRI-INTEL ASIL...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-[#f1f5f9] font-sans selection:bg-[#3b82f6] selection:text-white pb-12">
      <div className="p-4 lg:p-6 pb-0">
        <ModuleHeader 
          title="Agriculture & Food Intelligence" 
          subtitle="National Food Security & Crop Stress Analysis" 
          icon={Sprout}
          nodeId="AGRI-INTEL-01"
          statusLabel="ACTIVE"
        />
        
        {/* Navigation Tabs */}
        <div className="mt-6 flex items-center gap-1 border-b border-[#1e3a5f]/50 pb-px">
          {[
            { id: 'strategic', label: 'Strategic Overview', icon: Sprout },
            { id: 'technical', label: 'Technical Drilldown', icon: Droplets },
            { id: 'market', label: 'Food Security & Market', icon: Wheat },
          ].map((tab) => (
            <button
              key={`agri-tab-${tab.id}`}
              id={`tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id as any)}
              className={clsx(
                "flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-widest transition-all border-b-2 outline-none",
                activeTab === tab.id 
                  ? "border-[#3b82f6] text-[#3b82f6] bg-[#3b82f6]/5" 
                  : "border-transparent text-[#94a3b8] hover:text-[#f1f5f9] hover:bg-white/5"
              )}
            >
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      
      <main className="mx-auto max-w-[1600px] p-4 lg:p-6">
        <KpiRow />
        
        <div className="mt-6">
          {activeTab === 'strategic' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 min-h-[500px] animate-in fade-in duration-500">
              <div className="lg:col-span-7 xl:col-span-8 flex flex-col">
                <TacticalMap />
              </div>
              <div className="lg:col-span-12 xl:col-span-12 w-full mt-4 lg:hidden">
                 <GovernoratePanel />
              </div>
              <div className="hidden lg:flex lg:col-span-5 xl:col-span-4 flex-col">
                <GovernoratePanel />
              </div>
            </div>
          )}

          {activeTab === 'technical' && (
            <div className="flex flex-col gap-6 animate-in fade-in duration-500">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 min-h-[400px]">
                <CropMonitoring />
                <ProteinMarket />
              </div>
              <div className="w-full">
                <PipelineStatus />
              </div>
            </div>
          )}

          {activeTab === 'market' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 min-h-[350px] animate-in fade-in duration-500">
              <PricePrediction />
              <AlertPanel />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
