import React from 'react';
import { useDashboardStore } from './index';
import { X, Activity, Droplets, Wheat, AlertTriangle } from 'lucide-react';

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
      <div className="flex items-center justify-between border-b border-[#1e3a5f] bg-[#1a2332] p-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold tracking-tight text-[#f1f5f9]">{selectedGovernorate}</span>
            <span className="rounded bg-[#ef4444]/20 px-2 py-0.5 text-[10px] font-bold text-[#ef4444]">CRITICAL</span>
          </div>
          <div className="text-xs font-medium text-[#94a3b8]">Central Tunisia | Pop: 570K</div>
        </div>
        <button 
          onClick={() => setSelectedGovernorate(null)}
          className="rounded p-1 text-[#94a3b8] hover:bg-[#111827] hover:text-[#f1f5f9]"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex gap-1 border-b border-[#1e3a5f] bg-[#0a0f1a] p-1">
        <button className="rounded bg-[#1a2332] px-3 py-1.5 text-xs font-semibold text-[#f1f5f9]">Overview</button>
        <button className="rounded px-3 py-1.5 text-xs font-medium text-[#94a3b8] hover:bg-[#111827]">Crops</button>
        <button className="rounded px-3 py-1.5 text-xs font-medium text-[#94a3b8] hover:bg-[#111827]">Water</button>
        <button className="rounded px-3 py-1.5 text-xs font-medium text-[#94a3b8] hover:bg-[#111827]">Protein</button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
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
            <div className="flex items-center gap-2 rounded border border-[#ef4444]/30 bg-[#ef4444]/10 p-2 text-xs">
              <Wheat className="h-4 w-4 text-[#ef4444]" />
              <span className="text-[#f1f5f9]">Wheat stress: 0.78 <span className="text-[#ef4444] font-bold">(CRITICAL)</span></span>
            </div>
            <div className="flex items-center gap-2 rounded border border-[#f97316]/30 bg-[#f97316]/10 p-2 text-xs">
              <Droplets className="h-4 w-4 text-[#f97316]" />
              <span className="text-[#f1f5f9]">Water reserve: 0.31 <span className="text-[#f97316] font-bold">(LOW)</span></span>
            </div>
            <div className="flex items-center gap-2 rounded border border-[#f59e0b]/30 bg-[#f59e0b]/10 p-2 text-xs">
              <AlertTriangle className="h-4 w-4 text-[#f59e0b]" />
              <span className="text-[#f1f5f9]">Feed stress: 0.62 <span className="text-[#f59e0b] font-bold">(ELEVATED)</span></span>
            </div>
          </div>
        </div>

        {/* Satellite Status */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#94a3b8]">Satellite Status</h4>
            <span className="text-[10px] text-[#94a3b8]">Updated 2h ago</span>
          </div>
          <div className="flex flex-col gap-3 rounded border border-[#1e3a5f] bg-[#0a0f1a] p-3">
            <ProgressBar label="NDVI" value={0.42} color="bg-[#10b981]" />
            <ProgressBar label="RAIN" value={0.23} color="bg-[#ef4444]" />
            <ProgressBar label="SOIL" value={0.38} color="bg-[#f59e0b]" />
          </div>
        </div>
      </div>
    </div>
  );
}
