import React from 'react';
import { HelpCircle, Download } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid, Line } from 'recharts';

const mockTrendData = Array.from({ length: 30 }, (_, i) => ({
  day: i,
  current: 0.35 + Math.sin(i / 5) * 0.1 + (i * -0.002), // declining trend
  average: 0.45 + Math.sin(i / 5) * 0.05
}));

const mockSoilData = Array.from({ length: 15 }, (_, i) => ({
  day: i,
  rain: Math.random() > 0.7 ? Math.random() * 20 : 0,
  soil: 0.2 + (Math.random() * 0.2)
}));

export default function CropMonitoring() {
  return (
    <div className="flex h-full min-h-[400px] w-full flex-col overflow-hidden rounded-lg border border-[#1e3a5f] bg-[#111827]">
      <div className="flex items-center justify-between border-b border-[#1e3a5f] bg-[#1a2332] px-4 py-3">
        <h3 className="text-sm font-bold uppercase tracking-widest text-[#f1f5f9]">Crop Monitoring</h3>
        <button className="text-[#94a3b8] hover:text-[#f1f5f9]">
          <HelpCircle className="h-4 w-4" />
        </button>
      </div>

      <div className="flex gap-1 border-b border-[#1e3a5f] bg-[#0a0f1a] px-2 py-1">
        <button className="rounded bg-[#1a2332] px-3 py-1.5 text-xs font-semibold text-[#f1f5f9]">Wheat</button>
        <button className="rounded px-3 py-1.5 text-xs font-medium text-[#94a3b8] hover:bg-[#111827]">Olive</button>
        <button className="rounded px-3 py-1.5 text-xs font-medium text-[#94a3b8] hover:bg-[#111827]">Vegetables</button>
        <button className="rounded px-3 py-1.5 text-xs font-medium text-[#94a3b8] hover:bg-[#111827]">Dates</button>
      </div>

      <div className="grid flex-1 grid-cols-1 md:grid-cols-2 gap-px bg-[#1e3a5f]">
        
        {/* NDVI Trend */}
        <div className="bg-[#111827] p-4 flex flex-col">
          <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[#94a3b8]">NDVI Trend (30 Days)</div>
          <div className="flex-1 min-h-[120px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockTrendData}>
                <defs>
                  <linearGradient id="colorCurrent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <YAxis domain={[0, 1]} hide />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111827', borderColor: '#1e3a5f', fontSize: '12px' }}
                  itemStyle={{ color: '#f1f5f9' }}
                />
                <Area type="monotone" dataKey="current" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#colorCurrent)" />
                <Area type="monotone" dataKey="average" stroke="#94a3b8" strokeWidth={1} strokeDasharray="3 3" fill="none" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex justify-between text-xs">
            <span className="font-semibold text-[#06b6d4]">0.42 Current</span>
            <span className="text-[#94a3b8]">0.38 Avg</span>
          </div>
        </div>

        {/* Soil Moisture */}
        <div className="bg-[#111827] p-4 flex flex-col">
          <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[#94a3b8]">Soil vs Rainfall</div>
          <div className="flex-1 min-h-[120px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockSoilData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" vertical={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111827', borderColor: '#1e3a5f', fontSize: '12px' }}
                />
                <Bar dataKey="rain" fill="#3b82f6" radius={[2, 2, 0, 0]} barSize={8} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Yield Forecast */}
        <div className="bg-[#111827] p-4 flex flex-col">
          <div className="mb-4 text-[10px] font-bold uppercase tracking-widest text-[#94a3b8]">Yield Forecast</div>
          <div className="flex-1 flex flex-col justify-center px-4">
            <div className="relative h-4 w-full rounded-full bg-[#0a0f1a] overflow-hidden border border-[#1e3a5f]">
              <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#f59e0b] to-[#f97316] w-[78%]" />
            </div>
            <div className="mt-3 flex justify-between text-xs">
              <span className="font-bold text-[#f1f5f9]">Expected: 78%</span>
              <span className="text-[#94a3b8]">Historical: 100%</span>
            </div>
          </div>
        </div>

        {/* Risk Timeline */}
        <div className="bg-[#111827] p-4 flex flex-col relative">
           <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[#94a3b8]">Risk Timeline</div>
           <div className="flex-1 flex items-center justify-between px-2">
             <div className="flex flex-col items-center gap-2 relative z-10 w-full h-[30px] justify-between flex-row">
                <div className="absolute w-full h-px bg-[#1e3a5f] top-[14px] z-0" />
                <div className="h-3 w-3 rounded-full bg-[#10b981] border-2 border-[#111827] z-10" />
                <div className="h-3 w-3 rounded-full bg-[#10b981] border-2 border-[#111827] z-10" />
                <div className="h-3 w-3 rounded-full bg-[#f97316] border-2 border-[#111827] z-10" />
                <div className="h-3 w-3 rounded-full bg-[#ef4444] border-2 border-[#111827] z-10 animate-pulse" />
                <div className="h-3 w-3 rounded-full bg-[#1e3a5f] border-2 border-[#111827] z-10" />
             </div>
           </div>
           
           <div className="absolute right-4 bottom-4 flex gap-2">
              <button className="rounded border border-[#1e3a5f] p-1.5 text-[#94a3b8] hover:bg-[#1a2332] hover:text-[#f1f5f9]">
                <Download className="h-3 w-3" />
              </button>
              <button className="rounded bg-[#1e3a5f] px-3 py-1 text-[10px] font-bold uppercase text-[#f1f5f9] hover:bg-[#3b82f6]">
                View Report
              </button>
           </div>
        </div>

      </div>
    </div>
  );
}
