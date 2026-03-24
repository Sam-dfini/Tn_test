import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { Radio, Bell, Zap, AlertCircle } from 'lucide-react';
import { usePipeline } from '../../context/PipelineContext';

interface BreakingIntelFeedProps {
  externalAlerts?: any[];
}

export const BreakingIntelFeed: React.FC<BreakingIntelFeedProps> = ({ externalAlerts = [] }) => {
  const { data, rriState } = usePipeline();

  const updates = useMemo(() => [
    {
      id: 1,
      source: 'RRI_ENGINE',
      time: new Date().toTimeString().slice(0,8) + 'Z',
      type: rriState.rri >= 2.625 ? 'CRITICAL' : 'UPDATE',
      content: `RRI INDEX AT ${rriState.rri.toFixed(4)} — REVOLUTION PROBABILITY ${(rriState.p_rev*100).toFixed(1)}% — CI [${rriState.ci_low}%, ${rriState.ci_high}%]`,
      urgent: rriState.rri >= 2.625
    },
    {
      id: 2,
      source: 'BCT_WIRE',
      time: data.economy.last_updated || '06:00Z',
      type: data.economy.fx_reserves < 90 ? 'SIGNAL' : 'UPDATE',
      content: `FX RESERVES: ${data.economy.fx_reserves} DAYS IMPORT COVER. TND/USD: ${data.economy.tnd_usd}. INFLATION: ${data.economy.inflation}%.`,
      urgent: data.economy.fx_reserves < 90
    },
    {
      id: 3,
      source: 'UGTT_MONITOR',
      time: data.social.last_updated || '04:00Z',
      type: data.social.ugtt_mobilisation_level === 'HIGH' ? 'BREAKING' : 'INTEL',
      content: `UGTT MOBILISATION: ${data.social.ugtt_mobilisation_level}. ${data.social.ugtt_strike_count_2025 || 847} STRIKES IN 2025. GENERAL STRIKE TRIGGER: 64%.`,
      urgent: data.social.ugtt_mobilisation_level === 'HIGH'
    },
    {
      id: 4,
      source: 'DECREE54_TRACKER',
      time: '02:00Z',
      type: 'INTEL',
      content: `DECREE 54: ${data.social.decree54_charged} INDIVIDUALS CHARGED. RSF PRESS FREEDOM RANK: ${data.social.press_freedom_rank || 118}. ${data.social.water_crisis_govs} GOVS IN WATER CRISIS.`,
      urgent: false
    },
    {
      id: 5,
      source: 'CASCADE_MONITOR',
      time: '01:00Z',
      type: rriState.cascade_probability > 0.6 ? 'SIGNAL' : 'UPDATE',
      content: `CASCADE RISK: P_cascade = ${(rriState.cascade_probability*100).toFixed(0)}%. PRIMARY PATH: SFAX → KASSERINE. COMPOUND STRESS CS(t) = ${rriState.compound_stress.toFixed(3)}.`,
      urgent: rriState.cascade_probability > 0.6
    },
    ...externalAlerts
  ], [rriState, data, externalAlerts]);

  const allUpdates = updates;

  return (
    <div className="glass p-4 rounded-lg border border-intel-border h-[400px] flex flex-col">
      <div className="flex items-center justify-between mb-4 border-b border-intel-cyan/20 pb-2">
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Radio className="w-3 h-3 text-intel-red" />
            <motion.div 
              animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 bg-intel-red rounded-full"
            />
          </div>
          <h3 className="text-[10px] font-mono text-intel-cyan uppercase font-bold tracking-widest">Breaking Intel Feed</h3>
        </div>
        <div className="flex items-center space-x-1">
          <span className="w-1 h-1 rounded-full bg-intel-red animate-pulse"></span>
          <span className="text-[8px] font-mono text-slate-500 uppercase">Live Stream</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-thin scrollbar-thumb-intel-cyan/20">
        {allUpdates.map((update, idx) => (
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            key={update.id || idx} 
            className={`p-2 border-l-2 ${update.urgent ? 'border-intel-red bg-intel-red/5' : 'border-intel-cyan/30 bg-white/5'} space-y-1`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className={`text-[8px] font-mono font-bold px-1 rounded ${update.urgent ? 'bg-intel-red text-white' : 'bg-intel-cyan/20 text-intel-cyan'}`}>
                  {update.type}
                </span>
                <span className="text-[9px] font-bold text-slate-400 font-mono">{update.source}</span>
              </div>
              <span className="text-[8px] font-mono text-slate-600">{update.time}</span>
            </div>
            <div className="text-[10px] text-slate-300 leading-relaxed uppercase font-medium">
              {update.content}
            </div>
            {update.urgent && (
              <div className="flex items-center space-x-1 text-intel-red">
                <AlertCircle className="w-2 h-2" />
                <span className="text-[7px] font-mono uppercase font-bold">Priority Action Required</span>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      <div className="mt-4 pt-2 border-t border-intel-cyan/10">
        <div className="flex items-center justify-between text-[7px] font-mono text-slate-600 uppercase">
          <span>Buffer Status: 98%</span>
          <span>Encryption: AES-256</span>
        </div>
      </div>
    </div>
  );
};
