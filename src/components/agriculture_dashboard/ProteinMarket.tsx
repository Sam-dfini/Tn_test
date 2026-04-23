import React from 'react';
import { Lock, AlertCircle } from 'lucide-react';

function StatRow({ label, official, real, gap }: { label: string; official: string; real: string; gap: number }) {
  return (
    <div className="flex grid-cols-4 items-center justify-between border-b border-[#1e3a5f]/50 py-2 text-xs">
      <div className="w-1/4 font-medium text-[#f1f5f9]">{label}</div>
      <div className="w-1/4 font-mono text-[#94a3b8]">{official}</div>
      <div className="w-1/4 font-mono text-[#f1f5f9]">{real}</div>
      <div className="w-1/4 text-right">
        <span className={`rounded px-1.5 py-0.5 font-bold ${gap > 50 ? 'bg-[#ef4444]/20 text-[#ef4444]' : 'bg-[#f59e0b]/20 text-[#f59e0b]'}`}>
          {gap}%
        </span>
      </div>
    </div>
  );
}

function ComponentBar({ label, value, weight }: { label: string; value: number; weight: number }) {
  return (
    <div className="flex items-center gap-3 text-xs">
      <div className="w-24 text-[#94a3b8]">{label}</div>
      <div className="w-8 font-mono">{value.toFixed(2)}</div>
      <div className="flex-1 h-2 bg-[#0a0f1a] rounded-full overflow-hidden border border-[#1e3a5f]">
        <div 
          className="h-full bg-[#ef4444]" 
          style={{ width: `${value * 100}%`, opacity: weight }}
        />
      </div>
    </div>
  );
}

export default function ProteinMarket() {
  return (
    <div className="flex h-full min-h-[400px] w-full flex-col overflow-hidden rounded-lg border border-[#ef4444]/30 bg-[#111827]">
      <div className="flex items-center justify-between border-b border-[#ef4444]/30 bg-[#ef4444]/10 px-4 py-3">
        <div className="flex items-center gap-2">
          <Lock className="h-4 w-4 text-[#ef4444]" />
          <h3 className="text-sm font-bold uppercase tracking-widest text-[#ef4444]">Black Market Detection</h3>
        </div>
      </div>

      <div className="flex gap-1 border-b border-[#1e3a5f] bg-[#0a0f1a] px-2 py-1">
        <button className="rounded px-3 py-1.5 text-xs font-medium text-[#94a3b8] hover:bg-[#111827]">Livestock</button>
        <button className="rounded px-3 py-1.5 text-xs font-medium text-[#94a3b8] hover:bg-[#111827]">Poultry</button>
        <button className="rounded px-3 py-1.5 text-xs font-medium text-[#94a3b8] hover:bg-[#111827]">Fish</button>
        <button className="rounded bg-[#ef4444]/20 px-3 py-1.5 text-xs font-semibold text-[#ef4444] border border-[#ef4444]/30">Black Market</button>
      </div>

      <div className="p-4 space-y-6 overflow-y-auto">
        {/* Top Status */}
        <div>
          <div className="flex items-end justify-between mb-2">
            <div className="flex items-center gap-3">
              <span className="font-mono text-3xl font-bold text-[#f1f5f9]">0.68</span>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#94a3b8]">BMI Level</span>
                <span className="flex items-center gap-1 text-xs font-bold text-[#f97316]">
                  <AlertCircle className="h-3 w-3" /> ACTIVE
                </span>
              </div>
            </div>
          </div>
          <div className="h-2 w-full rounded-full bg-[#0a0f1a] overflow-hidden border border-[#1e3a5f]">
            <div className="h-full bg-gradient-to-r from-[#f59e0b] to-[#ef4444] w-[68%]" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Component Breakdown */}
          <div className="space-y-3">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#94a3b8]">Component Breakdown</h4>
            <div className="space-y-2">
              <ComponentBar label="Price Gap" value={0.82} weight={1} />
              <ComponentBar label="Availability" value={0.55} weight={0.8} />
              <ComponentBar label="Currency Dist." value={0.71} weight={0.6} />
              <ComponentBar label="Informal Sig." value={0.45} weight={0.4} />
            </div>
          </div>

          {/* Price Divergence */}
          <div className="space-y-3">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#94a3b8]">Price Divergence</h4>
            <div className="rounded border border-[#1e3a5f] bg-[#0a0f1a] p-2">
               <div className="flex grid-cols-4 items-center justify-between border-b border-[#1e3a5f] pb-2 text-[10px] font-bold uppercase text-[#94a3b8]">
                 <div className="w-1/4">Product</div>
                 <div className="w-1/4">Official</div>
                 <div className="w-1/4">Real</div>
                 <div className="w-1/4 text-right">Gap</div>
               </div>
               <StatRow label="Bread" official="0.200" real="0.320" gap={60} />
               <StatRow label="Chicken" official="8.500" real="12.50" gap={47} />
               <StatRow label="Flour" official="0.850" real="1.400" gap={65} />
               <StatRow label="Fuel" official="2.300" real="3.100" gap={35} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Currency Distortion */}
          <div className="space-y-3">
             <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#94a3b8]">Currency Distortion</h4>
             <div className="rounded border border-[#1e3a5f] bg-[#0a0f1a] p-3 text-xs space-y-1">
               <div className="flex justify-between"><span className="text-[#94a3b8]">Official:</span> <span>3.15 TND/USD</span></div>
               <div className="flex justify-between"><span className="text-[#94a3b8]">Parallel:</span> <span className="text-[#f1f5f9] font-bold">3.85 TND/USD</span></div>
               <div className="mt-2 pt-2 border-t border-[#1e3a5f] flex items-center justify-between">
                 <span className="text-[#94a3b8]">Gap: <span className="text-[#ef4444] font-bold">22%</span></span>
                 <div className="w-24 h-1.5 bg-[#111827] rounded-full overflow-hidden inline-block ml-2">
                   <div className="h-full bg-[#ef4444] w-[22%]" />
                 </div>
               </div>
             </div>
          </div>
          
          {/* Keyword Alerts */}
          <div className="space-y-3">
             <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#94a3b8]">Keyword Alerts</h4>
             <div className="space-y-1.5">
               <div className="flex items-center gap-2 text-xs">
                 <span>🔥</span>
                 <span className="text-[#f1f5f9]">"prix ytir"</span>
                 <span className="ml-auto font-bold text-[#ef4444]">+340%</span>
               </div>
               <div className="flex items-center gap-2 text-xs">
                 <span>🔥</span>
                 <span className="text-[#f1f5f9]">"mafama chay"</span>
                 <span className="ml-auto font-bold text-[#ef4444]">+280%</span>
               </div>
               <div className="flex items-center gap-2 text-xs">
                 <span>⚠️</span>
                 <span className="text-[#f1f5f9]">"souk parallèle"</span>
                 <span className="ml-auto font-bold text-[#f59e0b]">+120%</span>
               </div>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
}
