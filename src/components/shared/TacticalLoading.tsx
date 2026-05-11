import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Terminal, Shield, Activity, Globe, Zap } from 'lucide-react';
import { generateStableKey } from '../../lib/keyUtils';

const MODE_MESSAGES: Record<string, string[]> = {
  professional: [
    'VERIFYING_ANALYST_CLEARANCE...',
    'LOADING_RRI_ENGINE_v4.2... [OK]',
    'ESTABLISHING_SECURE_UPLINK... [OK]',
    'DECRYPTING_INTELLIGENCE_LEDGER... [OK]',
    'SYNCING_PREDICTIVE_MODEL_STATE... [OK]',
    'CALIBRATING_RRI_THRESHOLD_MONITORS... [OK]',
    'ACTIVATING_RBAC_ACCESS_CONTROLS... [OK]',
    'PROFESSIONAL_CLEARANCE_GRANTED.',
  ],
  advanced: [
    'INIT_OSINT_RECONNAISSANCE_MODE...',
    'CONNECTING_RSS_INTEL_STREAMS... [OK]',
    'MAPPING_GOVERNORATE_GRID_ARRAY... [OK]',
    'SCANNING_SOCIAL_SIGNAL_CLUSTERS... [OK]',
    'INDEXING_EVENT_TIMELINE_ENGINE... [OK]',
    'TACTICAL_ENVIRONMENT_READY.',
  ],
  bloomberg: [
    'INIT_ECONOMIC_INTELLIGENCE_TERMINAL...',
    'FETCHING_MACRO_DATA_FEEDS... [OK]',
    'LOADING_MARKET_ANALYSIS_ENGINE... [OK]',
    'CALIBRATING_FX_RESERVE_MONITORS... [OK]',
    'BLOOMBERG_MODE_ACTIVE.',
  ],
  agriculture: [
    'INIT_AGRI_CLIMATE_SYSTEM...',
    'CONNECTING_SATELLITE_NDVI_FEEDS... [OK]',
    'LOADING_CROP_STRESS_INDICES... [OK]',
    'CALIBRATING_RAINFALL_ANOMALY_SENSORS... [OK]',
    'ASIL_SYSTEM_READY.',
  ],
  default: [
    'INIT_KERNEL_BOOT_SEQUENCE...',
    'ESTABLISHING_SECURE_UPLINK... [OK]',
    'DECRYPTING_RRI_MODEL_V2.4... [OK]',
    'FETCHING_RSS_INTEL_STREAMS... [OK]',
    'SYNC_GEOSPATIAL_LAYERS_TUNISIA... [OK]',
    'CALIBRATING_SENSOR_GRID_ARRAY... [OK]',
    'ESTABLISHING_REALTIME_DATA_STREAM... [OK]',
    'FINALIZING_OPERATIONAL_ENVIRONMENT... [OK]',
    'SYSTEM_READY_FOR_OPERATOR_INPUT.',
  ],
};

export const TacticalLoading: React.FC<{
  onComplete: () => void;
  mode?: 'simplified' | 'advanced' | 'professional' | null;
}> = ({ onComplete, mode }) => {
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const statusMessages =
    MODE_MESSAGES[mode ?? 'default'] ?? MODE_MESSAGES.default;

  useEffect(() => {
    if (progress >= 100) {
      const timeout = setTimeout(onComplete, 1200);
      return () => clearTimeout(timeout);
    }

    const timer = setInterval(() => {
      setProgress(prev => Math.min(100, prev + Math.random() * 9));
    }, 200);

    return () => clearInterval(timer);
  }, [progress, onComplete]);

  useEffect(() => {
    const messageIndex = Math.floor((progress / 100) * statusMessages.length);
    setLogs(statusMessages.slice(0, messageIndex + 1));
  }, [progress]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const stats = [
    { label: 'UPLINK', value: 'ENCRYPTED', color: 'text-intel-cyan' },
    { label: 'THREAT_LVL', value: 'ELEVATED', color: 'text-amber-500' },
    { label: 'NODE', value: 'TUNIS_01', color: 'text-slate-400' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-[#05070a] z-[999] flex flex-col items-center justify-center p-4 md:p-8 overflow-hidden font-mono"
    >
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-[0.06] pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle, #00f2ff 1px, transparent 1px)', backgroundSize: '40px 40px' }}
      />
      {/* Scanline */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#00f2ff]/5 to-transparent h-20 w-full animate-scanline pointer-events-none" />

      <div className="max-w-3xl w-full space-y-6 md:space-y-8 relative z-20">
        {/* Logo */}
        <div className="flex flex-col items-center space-y-4 mb-8 md:mb-10">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="relative w-16 h-16 md:w-20 md:h-20"
          >
            <div className="absolute inset-0 border-2 border-intel-cyan/10 animate-ping rounded-full" />
            <div className="absolute inset-0 border-t-2 border-intel-cyan animate-spin rounded-full" />
            <div className="w-full h-full rounded-full border-2 border-intel-cyan/30 flex items-center justify-center bg-intel-cyan/5">
              <Shield className="w-8 h-8 md:w-9 md:h-9 text-intel-cyan" />
            </div>
          </motion.div>

          <div className="text-center space-y-1">
            <h1 className="text-2xl md:text-4xl tracking-[0.2em] md:tracking-[0.3em] font-bold text-white uppercase">
              TUNISIA<span className="text-intel-cyan">INTEL</span>
            </h1>
            <div className="flex items-center justify-center gap-3">
              <div className="h-px w-8 md:w-12 bg-intel-cyan/30" />
              <div className="text-[8px] md:text-[9px] text-intel-cyan/70 uppercase tracking-[0.4em]">
                Sovereign Risk Intelligence Engine
              </div>
              <div className="h-px w-8 md:w-12 bg-intel-cyan/30" />
            </div>
          </div>
        </div>

        {/* Status grid */}
        <div className="grid grid-cols-3 gap-2 md:gap-3 mb-4">
          {stats.map((stat, i) => (
            <div
              key={generateStableKey(stat, i, 'stat')}
              className="glass-card p-2 md:p-3 flex flex-col items-center text-center gap-1"
            >
              <span className="text-[6px] md:text-[8px] text-slate-500 uppercase tracking-widest">{stat.label}</span>
              <span className={`text-[9px] md:text-[11px] font-bold ${stat.color}`}>{stat.value}</span>
            </div>
          ))}
        </div>

        {/* Terminal window */}
        <div className="bg-black/90 border border-intel-border rounded-xl overflow-hidden shadow-[0_0_50px_rgba(0,242,255,0.08)]">
          <div className="bg-intel-card border-b border-intel-border px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-intel-cyan" />
              <span className="text-[9px] text-slate-400 uppercase tracking-widest font-bold">
                Secure Boot Sequence // Alpha-9
              </span>
            </div>
            <div className="flex gap-1.5">
              <div className="w-2 h-2 rounded-full bg-red-500/50" />
              <div className="w-2 h-2 rounded-full bg-amber-500/50" />
              <div className="w-2 h-2 rounded-full bg-intel-cyan/50 animate-pulse" />
            </div>
          </div>

          <div
            ref={scrollRef}
            className="p-4 md:p-5 h-36 md:h-52 overflow-y-auto scrollbar-hide text-[9px] md:text-[10px] space-y-1.5 text-intel-cyan/70"
          >
            <AnimatePresence>
              {logs.map((log, i) => {
                const hasOk = log.endsWith('[OK]');
                const message = hasOk ? log.replace(' [OK]', '') : log;
                return (
                  <motion.div
                    key={generateStableKey(null, i, 'log')}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center justify-between w-full border-b border-intel-cyan/5 pb-1 gap-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-slate-700 font-bold shrink-0">
                        [{new Date().toISOString().split('T')[1].slice(0, 8)}]
                      </span>
                      <span className={`truncate ${i === logs.length - 1 ? 'text-white font-bold' : ''}`}>
                        {message}
                      </span>
                    </div>
                    {hasOk && (
                      <span className="text-intel-cyan font-bold bg-intel-cyan/10 px-1.5 py-0.5 rounded text-[7px] shrink-0">
                        OK
                      </span>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
            {progress < 100 && (
              <div className="flex items-center gap-2">
                <span className="text-slate-700 font-bold">
                  [{new Date().toISOString().split('T')[1].slice(0, 8)}]
                </span>
                <span className="w-2 h-3 md:h-4 bg-intel-cyan animate-pulse rounded-sm" />
              </div>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between items-end">
            <div>
              <div className="text-[9px] text-slate-500 uppercase tracking-[0.2em]">System Initialization</div>
              <div className="text-[7px] text-intel-cyan/50 uppercase tracking-widest">Loading core modules...</div>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl md:text-3xl font-bold text-white tabular-nums">
                {Math.min(100, Math.floor(progress))}
              </span>
              <span className="text-xs text-intel-cyan font-bold">%</span>
            </div>
          </div>
          <div className="h-1.5 w-full bg-intel-card border border-intel-border rounded-full overflow-hidden p-[2px]">
            <motion.div
              className="h-full bg-gradient-to-r from-intel-cyan/60 via-intel-cyan to-intel-cyan rounded-full shadow-[0_0_12px_rgba(0,242,255,0.5)]"
              animate={{ width: `${progress}%` }}
              transition={{ ease: 'easeOut', duration: 0.3 }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-[7px] md:text-[8px] text-slate-600 uppercase tracking-[0.2em] pt-3 border-t border-intel-border/20">
          <div className="flex items-center gap-1.5">
            <Activity className="w-2.5 h-2.5 text-intel-cyan animate-pulse" />
            <span>Kernel: v4.2.0-stable</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Globe className="w-2.5 h-2.5 text-intel-cyan" />
            <span>Region: North Africa // Tunisia</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Zap className="w-2.5 h-2.5 text-intel-cyan" />
            <span>Latency: 14ms</span>
          </div>
        </div>
      </div>

      {/* Corner accents */}
      <div className="absolute top-4 left-4 md:top-8 md:left-8 w-8 h-8 md:w-14 md:h-14 border-t-2 border-l-2 border-intel-cyan/20" />
      <div className="absolute top-4 right-4 md:top-8 md:right-8 w-8 h-8 md:w-14 md:h-14 border-t-2 border-r-2 border-intel-cyan/20" />
      <div className="absolute bottom-4 left-4 md:bottom-8 md:left-8 w-8 h-8 md:w-14 md:h-14 border-b-2 border-l-2 border-intel-cyan/20" />
      <div className="absolute bottom-4 right-4 md:bottom-8 md:right-8 w-8 h-8 md:w-14 md:h-14 border-b-2 border-r-2 border-intel-cyan/20" />
    </motion.div>
  );
};
