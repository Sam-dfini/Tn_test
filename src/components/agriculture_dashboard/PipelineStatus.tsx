import React from 'react';
import { Settings, RefreshCw } from 'lucide-react';

export default function PipelineStatus() {
  return (
    <div className="flex w-full flex-col md:flex-row items-center justify-between overflow-hidden rounded-lg border border-[#1e3a5f] bg-[#111827] px-4 py-3 text-xs md:h-12">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="flex gap-0.5">
            <span className="h-2 w-2 rounded-full bg-[#10b981]"></span>
            <span className="h-2 w-2 rounded-full bg-[#10b981]"></span>
            <span className="h-2 w-2 rounded-full bg-[#10b981]"></span>
            <span className="h-2 w-2 rounded-full border border-[#94a3b8]"></span>
          </div>
          <span className="font-semibold text-[#f1f5f9]">System Health</span>
        </div>
        
        <div className="hidden h-4 w-px bg-[#1e3a5f] md:block"></div>
        
        <div className="flex items-center gap-4 text-[#94a3b8]">
          <span className="flex items-center gap-1">🛰 Sentinel-2: <span className="text-[#f1f5f9]">2h ago</span></span>
          <span className="flex items-center gap-1">🌧 CHIRPS: <span className="text-[#f1f5f9]">5h ago</span></span>
          <span className="flex items-center gap-1">💧 Soil: <span className="text-[#f1f5f9]">12h ago</span></span>
          <span className="flex items-center gap-1">📊 Feed: <span className="text-[#f1f5f9]">1d ago</span></span>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-4 border-t border-[#1e3a5f] pt-3 md:mt-0 md:border-t-0 md:pt-0">
        <span className="text-[#94a3b8]">Next refresh: <span className="text-[#f1f5f9]">6h</span></span>
        <button className="flex items-center gap-1 text-[#3b82f6] hover:text-white transition-colors">
          <RefreshCw className="h-3 w-3" /> Refresh All
        </button>
        <button className="text-[#94a3b8] hover:text-white transition-colors">
          <Settings className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
