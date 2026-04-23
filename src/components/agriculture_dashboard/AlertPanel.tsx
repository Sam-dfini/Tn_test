import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const mockRriData = Array.from({ length: 15 }, (_, i) => ({
  day: i,
  rri: 2.1 + Math.sin(i/3)*0.2 + (i*0.02)
}));

export default function AlertPanel() {
  return (
    <div className="flex h-full min-h-[350px] w-full flex-col overflow-hidden rounded-lg border border-[#1e3a5f] bg-[#111827]">
      <div className="flex items-center justify-between border-b border-[#1e3a5f] bg-[#1a2332] px-4 py-3">
        <h3 className="text-sm font-bold uppercase tracking-widest text-[#f1f5f9]">System Alerts & Shocks</h3>
        <span className="rounded bg-[#ef4444] px-2 py-0.5 text-[10px] font-bold text-white">5 ACTIVE</span>
      </div>

      <div className="flex-1 p-4 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto w-full">
        
        {/* Left Col: Alerts List */}
        <div className="space-y-3">
          
          <div className="rounded border border-[#ef4444]/50 bg-[#ef4444]/10 p-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="h-2 w-2 rounded-full bg-[#ef4444] animate-pulse"></span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#ef4444]">CRITICAL</span>
              <span className="text-xs text-[#94a3b8] ml-auto">2h ago</span>
            </div>
            <div className="text-xs text-[#f1f5f9] font-medium font-mono mb-1">Wheat stress {'>'} 0.75</div>
            <div className="text-xs text-[#94a3b8]">Kairouan, Gafsa</div>
            <div className="text-xs text-[#f97316] font-mono mt-1 pr-2">ε(t) += 0.25 triggered</div>
            <div className="flex gap-2 mt-3">
              <button className="rounded bg-[#1e3a5f] px-2 py-1 text-[10px] font-bold text-white hover:bg-[#3b82f6]">Acknowledge</button>
              <button className="rounded border border-[#1e3a5f] px-2 py-1 text-[10px] font-bold text-[#94a3b8] hover:text-white">Details</button>
            </div>
          </div>

          <div className="rounded border border-[#f97316]/30 bg-[#f97316]/10 p-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="h-2 w-2 rounded-full bg-[#f97316]"></span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#f97316]">HIGH</span>
              <span className="text-xs text-[#94a3b8] ml-auto">4h ago</span>
            </div>
            <div className="text-xs text-[#f1f5f9] font-medium font-mono mb-1">Protein stress {'>'} 0.6</div>
            <div className="text-xs text-[#94a3b8]">National level</div>
          </div>

          <div className="rounded border border-[#f59e0b]/30 bg-[#f59e0b]/10 p-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="h-2 w-2 rounded-full bg-[#f59e0b]"></span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#f59e0b]">ELEVATED</span>
              <span className="text-xs text-[#94a3b8] ml-auto">6h ago</span>
            </div>
            <div className="text-xs text-[#f1f5f9] font-medium font-mono mb-1">BMI velocity {'>'} 0.2</div>
            <div className="text-xs text-[#94a3b8]">Rapid distortion alert</div>
          </div>

        </div>

        {/* Right Col: RRI Trajectory & History */}
        <div className="space-y-6 flex flex-col w-full min-w-0 pr-4">
          <div className="flex-1 min-h-[120px] flex flex-col min-w-0">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#94a3b8] mb-2 shrink-0">RRI Trajectory</h4>
            <div className="flex-1 rounded border border-[#1e3a5f] bg-[#0a0f1a] p-2 relative w-full h-full min-h-[100px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mockRriData}>
                  <defs>
                    <linearGradient id="colorRri" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <YAxis domain={['auto', 'auto']} hide />
                  <Area type="monotone" dataKey="rri" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorRri)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-between text-xs mt-2 shrink-0">
              <span className="font-mono text-[#f1f5f9]"><b>Current:</b> 2.45</span>
              <span className="font-mono text-[#ef4444]"><b>Threshold:</b> 2.625</span>
            </div>
          </div>

          <div className="shrink-0 w-full min-w-0">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#94a3b8] mb-2">Shock History</h4>
            <div className="rounded border border-[#1e3a5f] bg-[#0a0f1a] p-2 text-xs font-mono space-y-2">
              <div className="flex grid-cols-3 justify-between">
                <span className="text-[#94a3b8] w-1/4">t+0</span>
                <span className="text-[#ef4444] font-bold text-center flex-1">ε += 0.25</span>
                <span className="text-[#f1f5f9] text-right w-1/4">Wheat</span>
              </div>
              <div className="flex grid-cols-3 justify-between">
                <span className="text-[#94a3b8] w-1/4">t-2d</span>
                <span className="text-[#f97316] font-bold text-center flex-1">ε += 0.30</span>
                <span className="text-[#f1f5f9] text-right w-1/4">BMI</span>
              </div>
              <div className="flex grid-cols-3 justify-between">
                <span className="text-[#94a3b8] w-1/4">t-5d</span>
                <span className="text-[#f59e0b] font-bold text-center flex-1">ε += 0.15</span>
                <span className="text-[#f1f5f9] text-right w-1/4">Water</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
