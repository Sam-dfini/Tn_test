import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  Building2, 
  Map, 
  AlertTriangle,
  Activity,
  Zap,
  TrendingDown,
  TrendingUp,
  Box,
  Truck,
  Briefcase
} from 'lucide-react';
import { ModuleHeader, BackgroundGrid } from '../shared/ProfessionalShared';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, Cell } from 'recharts';
import {
  IndustrialSystemEngine,
  mockGovernorateData,
  mockPhosphateData,
  mockStartupData,
  mockEnergyData
} from '../../intel/industry/IndustrialIntel';

export const IndustrialIntelligencePanel: React.FC = () => {
  const [selectedGovernorate, setSelectedGovernorate] = useState<string | null>(null);

  // Compute National and Regional Stress
  const nationalData = useMemo(() => {
    const regional = mockGovernorateData.map(gov => 
      IndustrialSystemEngine.computeGovernorateStress(
        gov, 
        governorateRequiresPhosphateData(gov.governorate) ? mockPhosphateData : null, 
        mockStartupData, 
        mockEnergyData
      )
    );
    return IndustrialSystemEngine.computeNationalStress(
      regional, 
      mockPhosphateData, 
      mockStartupData, 
      mockEnergyData
    );
  }, []);

  function governorateRequiresPhosphateData(gov: string) {
    return gov.toLowerCase() === 'gafsa' || gov.toLowerCase() === 'gabès';
  }

  const getStatusColor = (flag: string) => {
    switch (flag) {
      case 'CRITICAL': return 'text-intel-red';
      case 'HIGH': return 'text-intel-orange';
      case 'ELEVATED': return 'text-amber-400';
      default: return 'text-intel-cyan';
    }
  };

  const getStatusBg = (flag: string) => {
    switch (flag) {
      case 'CRITICAL': return 'bg-intel-red/20 border-intel-red/50';
      case 'HIGH': return 'bg-intel-orange/20 border-intel-orange/50';
      case 'ELEVATED': return 'bg-amber-400/20 border-amber-400/50';
      default: return 'bg-intel-cyan/10 border-intel-cyan/30';
    }
  };

  const selectedRegionData = useMemo(() => {
    if (!selectedGovernorate) return null;
    return nationalData.governorate_breakdown.find(g => g.governorate === selectedGovernorate) || null;
  }, [selectedGovernorate, nationalData]);

  return (
    <div className="space-y-6 pb-20">
      <ModuleHeader 
        title="Industrial & Strategic Asset Intelligence"
        subtitle="National manufacturing density, strategic phosphate reserves, employment stress, and cross-cutting energy vulnerability."
        icon={Building2}
        nodeId="IND-NODE-01"
      />

      {/* Top Level KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass rounded-xl p-4 border border-intel-border/50 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-intel-cyan/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="flex justify-between items-start mb-2 relative z-10">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">National Ind. Stress</span>
            <Activity className={`w-4 h-4 ${nationalData.national_stress_index > 0.6 ? 'text-intel-red' : 'text-intel-cyan'}`} />
          </div>
          <div className="text-3xl font-bold font-mono text-white mb-1">
            {nationalData.national_stress_index.toFixed(3)}
          </div>
          <div className="flex items-center space-x-2 text-[10px] font-mono">
            {nationalData.national_stress_index > 0.6 ? (
              <span className="text-intel-red bg-intel-red/10 px-1.5 py-0.5 rounded flex items-center">
                <TrendingUp className="w-3 h-3 mr-1" /> HIGH RISK
              </span>
            ) : (
              <span className="text-intel-cyan bg-intel-cyan/10 px-1.5 py-0.5 rounded flex items-center">
                <TrendingDown className="w-3 h-3 mr-1" /> STABLE
              </span>
            )}
          </div>
        </div>

        <div className="glass rounded-xl p-4 border border-intel-border/50 relative overflow-hidden group">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Phosphate Sec. Risk</span>
            <Box className="w-4 h-4 text-intel-orange" />
          </div>
          <div className="text-3xl font-bold font-mono text-white mb-1">
            {nationalData.phosphate_national_risk.toFixed(3)}
          </div>
          <div className="flex items-center space-x-2 text-[10px] font-mono">
             <span className="text-intel-orange bg-intel-orange/10 px-1.5 py-0.5 rounded">
                STRATEGIC THREAT
             </span>
          </div>
        </div>

        <div className="glass rounded-xl p-4 border border-intel-border/50 relative overflow-hidden group">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Energy Stress</span>
            <Zap className={`w-4 h-4 ${nationalData.energy_national_stress > 0.7 ? 'text-intel-red animate-pulse' : 'text-intel-cyan'}`} />
          </div>
          <div className="text-3xl font-bold font-mono text-white mb-1">
            {nationalData.energy_national_stress.toFixed(3)}
          </div>
          <div className="flex items-center space-x-2 text-[10px] font-mono">
             <span className="text-slate-400">Cross-cutting amplifier</span>
          </div>
        </div>
        
        <div className="glass rounded-xl p-4 border border-intel-border/50 relative overflow-hidden group">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Startup Ecosystem</span>
            <Briefcase className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-bold font-mono text-white mb-1">
            {nationalData.startup_national_health.toFixed(3)}
          </div>
          <div className="flex items-center space-x-2 text-[10px] font-mono">
             <span className="text-emerald-400">Health Index</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Governorate Map/List */}
        <div className="lg:col-span-1 space-y-4">
           <div className="glass rounded-xl border border-intel-border/50 p-4">
             <h3 className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-4 flex items-center">
               <Map className="w-3 h-3 mr-2 text-intel-cyan" />
               Regional Industrial Nodes
             </h3>
             <div className="space-y-2">
               {nationalData.governorate_breakdown.map((gov) => {
                 const isSelected = selectedGovernorate === gov.governorate;
                 return (
                   <button
                     key={gov.governorate}
                     onClick={() => setSelectedGovernorate(isSelected ? null : gov.governorate)}
                     className={`w-full text-left p-3 rounded-lg border transition-all ${
                       isSelected 
                       ? 'bg-white/10 border-intel-cyan shadow-[0_0_10px_rgba(0,242,255,0.2)]' 
                       : 'bg-black/20 border-white/5 hover:border-white/20 hover:bg-white/5'
                     }`}
                   >
                     <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-bold text-white tracking-wide">{gov.governorate}</span>
                        <span className={`text-[10px] font-mono px-1.5 py-0.5 border rounded ${getStatusBg(gov.risk_flag)} ${getStatusColor(gov.risk_flag)}`}>
                          {gov.risk_flag}
                        </span>
                     </div>
                     <div className="flex items-center justify-between mt-2">
                        <div className="text-[10px] text-slate-500 font-mono">
                          Stress: <span className="text-white">{gov.industrial_stress_index.toFixed(2)}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          FDI Vulnerability: <span className="text-white">{gov.export_vulnerability.toFixed(2)}</span>
                        </div>
                     </div>
                   </button>
                 );
               })}
             </div>
           </div>
        </div>

        {/* Right Column - Deep Dive */}
        <div className="lg:col-span-2">
           {selectedRegionData ? (
             <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                key={selectedRegionData.governorate}
                className="glass rounded-xl border border-intel-border/50 p-6 relative overflow-hidden"
             >
                <BackgroundGrid />
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-1">{selectedRegionData.governorate} Sector Analysis</h2>
                      <p className="text-[10px] font-mono text-slate-500">INDUSTRIAL NODE FORENSICS</p>
                    </div>
                    <span className={`px-2 py-1 border rounded text-xs font-bold tracking-wider font-mono ${getStatusBg(selectedRegionData.risk_flag)} ${getStatusColor(selectedRegionData.risk_flag)}`}>
                      {selectedRegionData.risk_flag} // {selectedRegionData.industrial_stress_index.toFixed(3)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                     <div className="bg-black/40 border border-white/10 rounded-lg p-3">
                       <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Emp. Risk</div>
                       <div className="text-lg font-mono text-white">{selectedRegionData.employment_risk.toFixed(2)}</div>
                     </div>
                     <div className="bg-black/40 border border-white/10 rounded-lg p-3">
                       <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Export Vuln.</div>
                       <div className="text-lg font-mono text-white">{selectedRegionData.export_vulnerability.toFixed(2)}</div>
                     </div>
                     <div className="bg-black/40 border border-white/10 rounded-lg p-3">
                       <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Concentration</div>
                       <div className="text-lg font-mono text-white">{selectedRegionData.sector_concentration_risk.toFixed(2)}</div>
                     </div>
                     <div className="bg-black/40 border border-white/10 rounded-lg p-3">
                       <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Energy Stress</div>
                       <div className="text-lg font-mono text-white">{selectedRegionData.energy_stress.toFixed(2)}</div>
                     </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-white flex items-center">
                      <AlertTriangle className="w-4 h-4 mr-2 text-intel-orange" />
                      Active Risk Factors
                    </h4>
                    {selectedRegionData.contributing_factors.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {selectedRegionData.contributing_factors.map(factor => (
                          <span key={factor} className="px-2 py-1 bg-red-900/20 text-red-400 border border-red-500/30 rounded text-[10px] font-mono">
                            ERR::{(factor).toUpperCase()}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <div className="text-[10px] font-mono text-emerald-500 border border-emerald-500/20 bg-emerald-500/10 p-2 rounded">
                        NO ANOMALIES DETECTED
                      </div>
                    )}
                  </div>

                  {selectedRegionData.phosphate_risk !== null && (
                    <div className="mt-6 p-4 border border-intel-orange/30 bg-intel-orange/5 rounded-lg space-y-2">
                      <h4 className="text-xs font-bold text-intel-orange tracking-widest uppercase flex items-center">
                        <Activity className="w-4 h-4 mr-2" />
                        Phosphate Node Extraction Risk
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Strategic extraction node indicates significant pressure. 
                        Calculated systemic risk impact multiplier applied to governorate level.
                      </p>
                      <div className="text-lg font-mono font-bold text-intel-orange mt-2">
                        {selectedRegionData.phosphate_risk.toFixed(3)}
                      </div>
                    </div>
                  )}

                </div>
             </motion.div>
           ) : (
             <div className="h-full glass rounded-xl border border-intel-border/50 flex flex-col items-center justify-center p-12 text-center">
                <Box className="w-12 h-12 text-slate-700 mb-4" />
                <h3 className="text-sm font-bold text-slate-400 tracking-widest uppercase">No Node Selected</h3>
                <p className="text-[10px] text-slate-500 mt-2 font-mono">Select a regional hub to view detailed industrial telemetry.</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};