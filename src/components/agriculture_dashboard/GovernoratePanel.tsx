import React from 'react';
import { useDashboardStore } from './index';
import { X, Activity, Droplets, Wheat, AlertTriangle } from 'lucide-react';
import clsx from 'clsx';

function ProgressBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-12 text-xs font-semibold text-[#94a3b8]">{label}</div>
      <div className="text-xs font-mono w-10 text-right">{value.toFixed(2)}</div>
      <div className="flex-1 h-1.5 bg-[#0a0f1a] rounded-full overflow-hidden">
        <div 
          className={`h-full ${color}`} 
          style={{ width: `${value * 100}%` }}
        />
      </div>
    </div>
  );
}

export default function GovernoratePanel() {
  const { selectedGovernorate, setSelectedGovernorate } = useDashboardStore();
  const [activeSubTab, setActiveSubTab] = React.useState<'overview' | 'crops' | 'water' | 'protein'>('overview');

  if (!selectedGovernorate) {
    return (
      <div className="flex h-full min-h-[500px] w-full flex-col items-center justify-center rounded-lg border border-[#1e3a5f] bg-[#111827] p-6 text-center">
        <Activity className="mb-4 h-12 w-12 text-[#1e3a5f]" />
        <h3 className="text-lg font-medium text-[#f1f5f9]">No Governorate Selected</h3>
        <p className="mt-2 text-sm text-[#94a3b8]">Select a region on the map to view detailed intelligence.</p>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-[500px] w-full flex-col overflow-hidden rounded-lg border border-[#1e3a5f] bg-[#111827] shadow-xl">
      <div className="flex items-center justify-between border-b border-[#1e3a5f] bg-[#1a2332] p-4 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold tracking-tight text-[#f1f5f9] font-mono">{selectedGovernorate}</span>
            <span className="rounded bg-[#ef4444]/20 px-2 py-0.5 text-[10px] font-bold text-[#ef4444]">CRITICAL</span>
          </div>
          <div className="text-xs font-medium text-[#94a3b8]">Central Tunisia | Node: AGRI-ASIL-02</div>
        </div>
        <button 
          onClick={() => setSelectedGovernorate(null)}
          className="rounded p-1 text-[#94a3b8] hover:bg-[#111827] hover:text-[#f1f5f9]"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex gap-1 border-b border-[#1e3a5f] bg-[#0a0f1a] p-1 shrink-0">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'crops', label: 'Crops' },
          { id: 'water', label: 'Water' },
          { id: 'protein', label: 'Protein' },
        ].map((tab) => (
          <button
            key={`subtab-${tab.id}`}
            onClick={() => setActiveSubTab(tab.id as any)}
            className={clsx(
              "flex-1 rounded px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all outline-none",
              activeSubTab === tab.id 
                ? "bg-[#3b82f6]/20 text-[#3b82f6] border border-[#3b82f6]/30" 
                : "text-[#94a3b8] hover:text-[#f1f5f9] hover:bg-white/5"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {activeSubTab === 'overview' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Risk Summary */}
            <div className="space-y-3">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#94a3b8]">Risk Summary</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded border border-[#1e3a5f] bg-[#0a0f1a] p-3 text-center border-l-2 border-l-[#ef4444]">
                  <div className="text-2xl font-mono font-bold text-[#f1f5f9]">0.72</div>
                  <div className="text-[10px] font-bold uppercase text-[#ef4444]">High Agro Risk</div>
                </div>
                <div className="rounded border border-[#1e3a5f] bg-[#0a0f1a] p-3 text-center border-l-2 border-l-[#f59e0b]">
                  <div className="text-2xl font-mono font-bold text-[#f1f5f9]">0.55</div>
                  <div className="text-[10px] font-bold uppercase text-[#f59e0b]">Medium Water</div>
                </div>
              </div>
            </div>

            {/* Primary Threats */}
            <div className="space-y-3">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#94a3b8]">Primary Threats</h4>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 rounded border border-[#ef4444]/30 bg-[#ef4444]/10 p-2 text-xs font-mono">
                  <Wheat className="h-4 w-4 text-[#ef4444]" />
                  <span className="text-[#f1f5f9]">Wheat stress: 0.78 <span className="text-[#ef4444] font-bold">CRIT</span></span>
                </div>
                <div className="flex items-center gap-2 rounded border border-[#f97316]/30 bg-[#f97316]/10 p-2 text-xs font-mono">
                  <Droplets className="h-4 w-4 text-[#f97316]" />
                  <span className="text-[#f1f5f9]">Water reserve: 0.31 <span className="text-[#f97316] font-bold">LOW</span></span>
                </div>
              </div>
            </div>

            {/* Satellite Status */}
            <div className="space-y-3">
              <div className="flex items-center justify-between font-mono">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#94a3b8]">Satellite Status</h4>
                <span className="text-[9px] text-[#94a3b8]">LATEST</span>
              </div>
              <div className="flex flex-col gap-3 rounded border border-[#1e3a5f] bg-[#0a0f1a] p-3">
                <ProgressBar label="NDVI" value={0.42} color="bg-[#10b981]" />
                <ProgressBar label="RAIN" value={0.23} color="bg-[#ef4444]" />
                <ProgressBar label="SOIL" value={0.38} color="bg-[#f59e0b]" />
              </div>
            </div>
          </div>
        )}

        {activeSubTab === 'crops' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#94a3b8]">Crop Analysis</h4>
            <div className="space-y-2">
              <div className="rounded border border-[#1e3a5f] bg-[#0a0f1a] p-3">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[#94a3b8]">Durum Wheat Yield:</span>
                  <span className="text-[#ef4444] font-bold">-18% vs avg</span>
                </div>
                <div className="text-[10px] text-slate-500 italic">Heat wave during flowering phase caused sterility in 12% of stalks.</div>
              </div>
              <div className="rounded border border-[#1e3a5f] bg-[#0a0f1a] p-3">
                <div className="flex justify-between text-xs mb-1 font-mono">
                  <span className="text-[#94a3b8]">Olive Flowering:</span>
                  <span className="text-[#10b981] font-bold uppercase">Normal</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSubTab === 'water' && (
          <div className="space-y-4 animate-in fade-in duration-300 font-mono">
             <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#94a3b8]">Hydrology Detail</h4>
             <div className="space-y-3">
               <div className="flex items-center justify-between text-xs border-b border-[#1e3a5f] pb-2">
                 <span className="text-[#94a3b8]">Dam level:</span>
                 <span className="text-[#ef4444] font-bold">14.2%</span>
               </div>
               <div className="flex items-center justify-between text-xs border-b border-[#1e3a5f] pb-2">
                 <span className="text-[#94a3b8]">Soil moisture:</span>
                 <span className="text-[#f59e0b] font-bold">Low (0.34)</span>
               </div>
               <div className="bg-[#ef4444]/10 p-2 rounded text-[10px] text-[#ef4444]">
                  ⚠️ Immediate irrigation restriction recommended for non-strategic crops.
               </div>
             </div>
          </div>
        )}

        {activeSubTab === 'protein' && (
          <div className="space-y-4 animate-in fade-in duration-300 font-mono">
             <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#94a3b8]">Local Market Gap</h4>
             <div className="space-y-2">
               <div className="flex justify-between text-xs p-2 bg-[#0a0f1a] rounded">
                 <span className="text-[#94a3b8]">Chicken Price:</span>
                 <span className="text-white font-bold">14.20 TND <span className="text-[#ef4444] ml-1">↑</span></span>
               </div>
               <div className="flex justify-between text-xs p-2 bg-[#0a0f1a] rounded">
                 <span className="text-[#94a3b8]">Egg Availability:</span>
                 <span className="text-[#f59e0b] font-bold uppercase">Moderate</span>
               </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
