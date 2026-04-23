import React from 'react';
import { motion } from 'motion/react';
import { Lock, AlertCircle, ShoppingBag, TrendingUp, AlertTriangle, ShieldAlert, Activity } from 'lucide-react';
import { ModuleHeader, BackgroundGrid, ScanlineOverlay } from './ProfessionalShared';

function StatRow({ label, official, real, gap }: { label: string; official: string; real: string; gap: number }) {
  return (
    <div className="flex grid-cols-4 items-center justify-between border-b border-white/5 py-3 text-xs">
      <div className="w-1/4 font-medium text-white">{label}</div>
      <div className="w-1/4 font-mono text-slate-400">{official}</div>
      <div className="w-1/4 font-mono font-bold text-white">{real}</div>
      <div className="w-1/4 text-right">
        <span className={`px-2 py-1 border rounded font-mono font-bold text-[10px] ${gap > 50 ? 'bg-intel-red/20 text-intel-red border-intel-red/30' : 'bg-intel-orange/20 text-intel-orange border-intel-orange/30'}`}>
          +{gap}%
        </span>
      </div>
    </div>
  );
}

function ComponentBar({ label, value, weight }: { label: string; value: number; weight: number }) {
  return (
    <div className="flex items-center gap-4 text-xs group">
      <div className="w-28 text-slate-400 tracking-wide font-mono uppercase text-[10px] group-hover:text-intel-cyan transition-colors">{label}</div>
      <div className="w-10 font-mono font-bold text-white">{value.toFixed(2)}</div>
      <div className="flex-1 h-3 bg-black/40 rounded overflow-hidden border border-white/10">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${value * 100}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className="h-full bg-gradient-to-r from-intel-orange to-intel-red" 
          style={{ opacity: weight }}
        />
      </div>
    </div>
  );
}

export const BlackMarketIntelligencePanel: React.FC = () => {
  return (
    <div className="space-y-6 pb-20">
      <ModuleHeader 
        title="Black Market Detection"
        subtitle="Parallel economy monitoring, informal currency distortion, and price divergence engines."
        icon={ShoppingBag}
        nodeId="ECON-NODE-BM-01"
        statusLabel="ACTIVE"
      />

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 relative">
        <BackgroundGrid />
        <ScanlineOverlay />

        {/* Top KPI row */}
        <div className="col-span-1 md:col-span-12 grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
          <div className="glass rounded-xl p-6 border border-intel-border/50 bg-[#0f141a]/90 backdrop-blur">
            <div className="flex items-end justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="font-mono text-4xl font-bold tracking-tight text-white">0.68</span>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#94a3b8]">Black Market Index (BMI)</span>
                  <span className="flex items-center gap-1 text-[10px] font-bold text-intel-orange mt-1 px-2 py-0.5 border border-intel-orange/30 bg-intel-orange/10 rounded">
                    <AlertCircle className="h-3 w-3" /> ELEVATED
                  </span>
                </div>
              </div>
            </div>
            <div className="h-2.5 w-full rounded-full bg-black/40 overflow-hidden border border-white/10">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: '68%' }}
                className="h-full bg-gradient-to-r from-intel-orange to-intel-red" 
              />
            </div>
          </div>

          <div className="glass rounded-xl p-6 border border-intel-border/50 bg-[#0f141a]/90 backdrop-blur">
             <div className="flex justify-between items-start mb-2">
               <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Currency Distortion</span>
               <TrendingUp className="w-4 h-4 text-intel-red" />
             </div>
             <div className="flex items-baseline gap-2 mb-2">
               <span className="font-mono text-3xl font-bold text-white">22%</span>
               <span className="font-mono text-xs text-intel-red">GAP</span>
             </div>
             <div className="text-xs font-mono text-slate-400">
               Official: 3.15 TND/USD<br />
               Parallel: 3.85 TND/USD
             </div>
          </div>
          
          <div className="glass rounded-xl p-6 border border-intel-border/50 bg-[#0f141a]/90 backdrop-blur">
             <div className="flex justify-between items-start mb-2">
               <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Avg. Basket Inflation</span>
               <Lock className="w-4 h-4 text-intel-orange" />
             </div>
             <div className="flex items-baseline gap-2 mb-2">
               <span className="font-mono text-3xl font-bold text-white">48.5%</span>
             </div>
             <div className="text-xs font-mono text-slate-400">
               Informal margin over official subsidized pricing ceilings.
             </div>
          </div>
        </div>

        {/* Left Column */}
        <div className="col-span-1 md:col-span-12 lg:col-span-6 flex flex-col gap-6 relative z-10">
          <div className="glass rounded-xl p-6 border border-intel-border/50 bg-[#0f141a]/90 backdrop-blur">
            <h3 className="text-xs font-bold text-slate-400 font-mono uppercase tracking-widest mb-6 flex items-center">
              <ShieldAlert className="w-4 h-4 mr-2 text-intel-cyan" />
              Price Divergence Forensics
            </h3>
            <div className="rounded border border-white/10 bg-black/30 p-4">
               <div className="flex grid-cols-4 items-center justify-between border-b border-white/10 pb-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                 <div className="w-1/4">Commodity</div>
                 <div className="w-1/4">Official Ceiling</div>
                 <div className="w-1/4">Real Street</div>
                 <div className="w-1/4 text-right">Divergence</div>
               </div>
               <div className="mt-2">
                 <StatRow label="Bread (Baguette)" official="0.200 TND" real="0.320 TND" gap={60} />
                 <StatRow label="Chicken (kg)" official="8.500 TND" real="12.50 TND" gap={47} />
                 <StatRow label="Flour (kg)" official="0.850 TND" real="1.400 TND" gap={65} />
                 <StatRow label="Fuel (L)" official="2.300 TND" real="3.100 TND" gap={35} />
                 <StatRow label="Cooking Oil (L)" official="0.900 TND" real="2.500 TND" gap={177} />
               </div>
            </div>
            <div className="mt-4 p-3 bg-intel-orange/10 border border-intel-orange/30 rounded text-xs text-intel-orange font-mono">
              [WARNING] Multi-layered price distortion detected. Systemic shift away from regulated market.
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="col-span-1 md:col-span-12 lg:col-span-6 flex flex-col gap-6 relative z-10">
          <div className="glass rounded-xl p-6 border border-intel-border/50 bg-[#0f141a]/90 backdrop-blur">
            <h3 className="text-xs font-bold text-slate-400 font-mono uppercase tracking-widest mb-6 flex items-center">
              <Activity className="w-4 h-4 mr-2 text-intel-cyan" />
              Index Component Breakdown
            </h3>
            <div className="space-y-4">
              <ComponentBar label="Price Gap" value={0.82} weight={1} />
              <ComponentBar label="Supply Availability" value={0.55} weight={0.8} />
              <ComponentBar label="Currency Divergence" value={0.71} weight={0.6} />
              <ComponentBar label="Informal Signals" value={0.45} weight={0.4} />
            </div>
          </div>

          <div className="glass rounded-xl p-6 border border-intel-border/50 bg-[#0f141a]/90 backdrop-blur">
             <h3 className="text-xs font-bold text-slate-400 font-mono uppercase tracking-widest mb-4 flex items-center">
               <AlertTriangle className="w-4 h-4 mr-2 text-intel-orange" />
               Automated OSINT Intercepts
             </h3>
             <div className="grid grid-cols-1 gap-3">
               <div className="bg-black/30 border border-white/5 p-3 rounded-lg flex items-center gap-3">
                 <div className="w-8 h-8 rounded-full bg-intel-red/20 border border-intel-red/30 flex items-center justify-center text-xs">🔥</div>
                 <div className="flex-1">
                   <div className="text-white font-mono text-sm leading-tight">"prix ytir"</div>
                   <div className="text-[10px] text-slate-500 font-mono uppercase mt-0.5">Social Media Vector</div>
                 </div>
                 <div className="text-intel-red font-mono font-bold text-sm bg-intel-red/10 px-2 py-1 rounded">
                   +340%
                 </div>
               </div>
               
               <div className="bg-black/30 border border-white/5 p-3 rounded-lg flex items-center gap-3">
                 <div className="w-8 h-8 rounded-full bg-intel-red/20 border border-intel-red/30 flex items-center justify-center text-xs">🔥</div>
                 <div className="flex-1">
                   <div className="text-white font-mono text-sm leading-tight">"mafama chay"</div>
                   <div className="text-[10px] text-slate-500 font-mono uppercase mt-0.5">Supply Intercept</div>
                 </div>
                 <div className="text-intel-red font-mono font-bold text-sm bg-intel-red/10 px-2 py-1 rounded">
                   +280%
                 </div>
               </div>

               <div className="bg-black/30 border border-white/5 p-3 rounded-lg flex items-center gap-3">
                 <div className="w-8 h-8 rounded-full bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-xs">⚠️</div>
                 <div className="flex-1">
                   <div className="text-white font-mono text-sm leading-tight">"souk parallèle"</div>
                   <div className="text-[10px] text-slate-500 font-mono uppercase mt-0.5">Grey Market Keywords</div>
                 </div>
                 <div className="text-amber-400 font-mono font-bold text-sm bg-amber-400/10 px-2 py-1 rounded">
                   +120%
                 </div>
               </div>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
};