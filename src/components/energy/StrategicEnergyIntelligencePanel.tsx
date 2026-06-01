import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  Zap, 
  AlertTriangle,
  Activity,
  Droplets,
  Building2,
  TrendingUp,
  BatteryWarning,
  Flame,
  Globe2
} from 'lucide-react';
import { ModuleHeader, BackgroundGrid, ScanlineOverlay } from '../shared/ProfessionalShared';
import { 
  mockEnergySecurityOutput, 
  mockNESIComponents,
  mockFuelShocks,
  mockButaneData,
  mockGeneratorData,
  mockExtractionData
} from '../../intel/energy/StrategicEnergyIntel';

export const StrategicEnergyIntelligencePanel: React.FC = () => {
  const data = useMemo(() => mockEnergySecurityOutput, []);

  const getStatusColor = (flag: string) => {
    switch (flag) {
      case 'CRITICAL': return 'text-intel-red';
      case 'STRESSED': return 'text-intel-orange';
      case 'VULNERABLE': return 'text-amber-400';
      default: return 'text-intel-cyan';
    }
  };

  const getStatusBg = (flag: string) => {
    switch (flag) {
      case 'CRITICAL': return 'bg-intel-red/20 border-intel-red/50';
      case 'STRESSED': return 'bg-intel-orange/20 border-intel-orange/50';
      case 'VULNERABLE': return 'bg-amber-400/20 border-amber-400/50';
      default: return 'bg-intel-cyan/10 border-intel-cyan/30';
    }
  };

  const renderProgressBar = (value: number, colorClass: string) => (
    <div className="w-full h-1.5 bg-black/40 rounded overflow-hidden flex mt-2 border border-white/5">
      <div 
        className={`h-full ${colorClass}`} 
        style={{ width: `${Math.min(100, Math.max(0, value * 100))}%` }}
      />
    </div>
  );

  return (
    <div className="space-y-6 pb-20">
      <ModuleHeader 
        title="Strategic Energy Intelligence"
        subtitle="National energy security, subsidy collapse risk, and social contract breach probability."
        icon={Zap}
        nodeId="ENERGY-NODE-01"
        statusLabel={data.riskLevel}
      />

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 relative">
        <BackgroundGrid />
        <ScanlineOverlay />

        {/* --- MAIN KPI BLOCK --- */}
        <div className="col-span-1 md:col-span-12 lg:col-span-8 flex flex-col gap-6 relative z-10">
          
          <div className="glass rounded-xl p-6 border border-intel-border/50 bg-[#0f141a]/90 backdrop-blur">
            <div className="flex justify-between items-start mb-6">
              <div>
                 <h2 className="text-sm font-mono text-intel-cyan uppercase tracking-widest mb-1 flex items-center">
                   <Activity className="w-4 h-4 mr-2" />
                   National Energy Security Index (NESI)
                 </h2>
                 <p className="text-3xl font-bold text-on-surface font-mono tracking-tight">{data.nesi.toFixed(3)}</p>
              </div>
              <div className={`px-4 py-2 border rounded font-bold font-mono tracking-wider ${getStatusBg(data.riskLevel)} ${getStatusColor(data.riskLevel)}`}>
                {data.riskLevel}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 bg-black/30 border border-white/5 rounded-lg">
                 <div className="text-[10px] text-slate-500 font-mono tracking-widest uppercase mb-1">ESI</div>
                 <div className={`text-lg font-bold font-mono ${data.energyStressIndex > 0.7 ? 'text-intel-red' : 'text-intel-orange'}`}>
                   {data.energyStressIndex.toFixed(3)}
                 </div>
              </div>
              <div className="p-3 bg-black/30 border border-white/5 rounded-lg">
                 <div className="text-[10px] text-slate-500 font-mono tracking-widest uppercase mb-1">Breach Prob.</div>
                 <div className={`text-lg font-bold font-mono ${data.socialContractBreach > 0.6 ? 'text-intel-red' : 'text-amber-400'}`}>
                   {(data.socialContractBreach * 100).toFixed(1)}%
                 </div>
              </div>
              <div className="p-3 bg-black/30 border border-white/5 rounded-lg">
                 <div className="text-[10px] text-slate-500 font-mono tracking-widest uppercase mb-1">Butane BSI</div>
                 <div className="text-lg font-bold font-mono text-on-surface">
                   {mockButaneData.BSI.toFixed(3)}
                 </div>
              </div>
              <div className="p-3 bg-black/30 border border-white/5 rounded-lg">
                 <div className="text-[10px] text-slate-500 font-mono tracking-widest uppercase mb-1">Generator GSI</div>
                 <div className="text-lg font-bold font-mono text-on-surface">
                   {mockGeneratorData.GSI.toFixed(3)}
                 </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {/* SEASONAL STRESS */}
             <div className="glass rounded-xl p-5 border border-intel-border/50 bg-[#0f141a]/90 backdrop-blur">
                <h3 className="text-xs font-bold text-slate-400 font-mono uppercase tracking-widest mb-4 flex items-center">
                  <Flame className="w-4 h-4 mr-2 text-intel-orange" />
                  Seasonal Subsidy Stress
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-[10px] font-mono mb-1">
                      <span className="text-slate-300">Summer Electricity (AC Load)</span>
                      <span className="text-intel-orange">{mockNESIComponents.seasonalStress.toFixed(2)}</span>
                    </div>
                    {renderProgressBar(mockNESIComponents.seasonalStress, 'bg-intel-orange')}
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] font-mono mb-1">
                      <span className="text-slate-300">Winter Butane (Heating)</span>
                      <span className="text-intel-cyan">{mockButaneData.BSI.toFixed(2)}</span>
                    </div>
                    {renderProgressBar(mockButaneData.BSI, 'bg-intel-cyan')}
                  </div>
                  <div className="border-t border-white/10 pt-3 mt-3">
                     <p className="text-[10px] text-slate-500 leading-relaxed font-mono">
                       Subsidy Burden: <span className="text-intel-red font-bold">8.2% GDP</span><br/>
                       Fiscal Sustainability: <span className="text-amber-400 font-bold">{mockNESIComponents.subsidySustainability.toFixed(2)}</span>
                     </p>
                  </div>
                </div>
             </div>

             {/* GEOPOLITICAL & EXTRACTION */}
             <div className="glass rounded-xl p-5 border border-intel-border/50 bg-[#0f141a]/90 backdrop-blur">
                <h3 className="text-xs font-bold text-slate-400 font-mono uppercase tracking-widest mb-4 flex items-center">
                  <Globe2 className="w-4 h-4 mr-2 text-indigo-400" />
                  Geopolitical & Extraction
                </h3>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-[10px] font-mono mb-1">
                      <span className="text-slate-300">Algeria/Libya Stability</span>
                      <span className="text-indigo-400">0.65</span>
                    </div>
                    {renderProgressBar(0.65, 'bg-indigo-400')}
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] font-mono mb-1">
                      <span className="text-slate-300">Domestic Sufficiency (Oil/Gas)</span>
                      <span className="text-emerald-400">{mockExtractionData.domesticSufficiencyRatio.toFixed(2)}</span>
                    </div>
                    {renderProgressBar(mockExtractionData.domesticSufficiencyRatio, 'bg-emerald-400')}
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] font-mono mb-1">
                      <span className="text-slate-300">Global Tension (Ukraine/ME)</span>
                      <span className="text-intel-red">0.72</span>
                    </div>
                    {renderProgressBar(0.72, 'bg-intel-red')}
                  </div>
                </div>
             </div>
          </div>

        </div>

        {/* --- RIGHT COLUMN --- */}
        <div className="col-span-1 lg:col-span-4 flex flex-col gap-6 relative z-10">
           
           {/* THREAT MATRIX */}
           <div className="glass rounded-xl p-5 border border-intel-border/50 bg-[#0f141a]/90 backdrop-blur">
             <h3 className="text-[10px] font-bold text-slate-400 font-mono uppercase tracking-widest mb-4 flex items-center">
               <AlertTriangle className="w-3 h-3 mr-2 text-intel-red" />
               Threat Matrix
             </h3>
             <ul className="space-y-3">
               {data.topThreats.map((threat, idx) => (
                 <li key={idx} className="bg-black/40 border border-white/5 p-3 rounded flex items-start space-x-3">
                   <div className="mt-0.5 min-w-[12px] h-3 w-3 rounded-full border border-intel-red bg-intel-red/20 shadow-[0_0_8px_rgba(255,0,0,0.4)]" />
                   <span className="text-xs font-mono text-slate-300 leading-relaxed">{threat}</span>
                 </li>
               ))}
               <li className="bg-black/40 border border-white/5 p-3 rounded flex items-start space-x-3">
                 <div className="mt-0.5 min-w-[12px] h-3 w-3 rounded-full border border-intel-orange bg-intel-orange/20" />
                 <span className="text-xs font-mono text-slate-300 leading-relaxed">
                   Butane: BSI {(mockButaneData.BSI).toFixed(2)} (tight distribution)
                 </span>
               </li>
               <li className="bg-black/40 border border-white/5 p-3 rounded flex items-start space-x-3">
                 <div className="mt-0.5 min-w-[12px] h-3 w-3 rounded-full border border-amber-400 bg-amber-400/20" />
                 <span className="text-xs font-mono text-slate-300 leading-relaxed">
                   Generator: GSI {(mockGeneratorData.GSI).toFixed(2)} (rising stealth power)
                 </span>
               </li>
               <li className="bg-black/40 border border-white/5 p-3 rounded flex items-start space-x-3">
                 <div className="mt-0.5 min-w-[12px] h-3 w-3 rounded-full border border-intel-green bg-intel-green/20" />
                 <span className="text-xs font-mono text-slate-300 leading-relaxed">
                   Extraction: Stable depletion trajectory
                 </span>
               </li>
             </ul>
           </div>

           {/* ACTIONS */}
           <div className="glass rounded-xl p-5 border border-intel-border/50 bg-[#0f141a]/90 backdrop-blur">
             <h3 className="text-[10px] font-bold text-slate-400 font-mono uppercase tracking-widest mb-4 flex items-center">
               <Zap className="w-3 h-3 mr-2 text-intel-cyan" />
               Prescribed Actions
             </h3>
             <div className="flex flex-col space-y-2">
               {data.recommendedActions.map((action, idx) => (
                 <button key={idx} className="text-left w-full px-3 py-2 text-[10px] font-mono text-intel-cyan border border-intel-cyan/30 rounded bg-intel-cyan/5 hover:bg-intel-cyan/20 transition-all">
                   &gt; {action}
                 </button>
               ))}
               <div className="mt-8 pt-4 border-t border-white/10 flex gap-2">
                 <button className="flex-1 px-2 py-1.5 text-[10px] font-mono bg-white/5 border border-white/10 text-slate-300 rounded hover:text-white transition-all text-center">
                   [ VIEW CONTRACTS ]
                 </button>
                 <button className="flex-1 px-2 py-1.5 text-[10px] font-mono bg-white/5 border border-white/10 text-slate-300 rounded hover:text-white transition-all text-center">
                   [ STEG DATA ]
                 </button>
               </div>
             </div>
           </div>

        </div>

      </div>
    </div>
  );
};