import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Clock, Globe, Eye, AlertTriangle, Download, Home, TrendingUp, Database, Settings } from 'lucide-react';
import { usePipeline } from '../../context/PipelineContext';

interface TacticalHeaderProps {
  onOpenAI: () => void;
  onOpenPipeline: (tab?: 'pipeline' | 'sources' | 'hub') => void;
  onGoHome: () => void;
  data: any;
  activeRegion: string;
  onRegionChange: (region: string) => void;
  viewMode: 'MAP' | 'INTEL';
  onViewModeChange: (mode: 'MAP' | 'INTEL') => void;
}

export const TacticalHeader: React.FC<TacticalHeaderProps> = ({ 
  onOpenAI, onOpenPipeline, onGoHome, data, activeRegion, onRegionChange, viewMode, onViewModeChange 
}) => {
  const { rriState } = usePipeline();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).toUpperCase();
  };
  
  return (
    <header className="h-14 border-b border-intel-border bg-intel-card/50 backdrop-blur-md flex items-center justify-between px-4 sticky top-0 z-[100] overflow-hidden">
      {/* Animated Red Border for Tunisia Focus */}
      <motion.div 
        animate={{ 
          opacity: [0.3, 0.8, 0.3],
          boxShadow: [
            '0 0 5px rgba(255, 59, 59, 0.2)',
            '0 0 15px rgba(255, 59, 59, 0.6)',
            '0 0 5px rgba(255, 59, 59, 0.2)'
          ]
        }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-0 left-0 right-0 h-[2px] bg-intel-red z-10"
      />
      
      <div className="flex items-center space-x-2 sm:space-x-6">
        <div className="flex items-center space-x-2 sm:space-x-3">
          <div className="w-7 h-7 sm:w-8 sm:h-8 bg-intel-cyan/10 border border-intel-cyan/20 rounded flex items-center justify-center">
            <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-intel-cyan" />
          </div>
          <div>
            <h1 className="text-[10px] sm:text-sm font-bold text-white tracking-[0.1em] sm:tracking-[0.2em] uppercase truncate max-w-[120px] sm:max-w-none">Tactical OSINT</h1>
            <div className="flex items-center space-x-1 sm:space-x-2">
              <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-intel-red animate-pulse"></span>
              <span className="text-[6px] sm:text-[8px] font-mono text-intel-red uppercase font-bold">Wartime Risk</span>
            </div>
          </div>
        </div>

        <nav className="hidden lg:flex items-center space-x-1">
          <div className="flex items-center bg-black/40 rounded p-0.5 mr-4 border border-white/10 space-x-1">
            <button 
              onClick={() => onViewModeChange('MAP')}
              className={`px-2 py-1 text-[9px] font-mono uppercase tracking-widest transition-all rounded flex items-center space-x-2 ${
                viewMode === 'MAP'
                  ? 'bg-intel-cyan text-intel-bg font-bold'
                  : 'text-slate-500 hover:text-white'
              }`}
            >
              <Globe className="w-3 h-3" />
              <span>Tactical Map</span>
            </button>
            <button 
              onClick={() => onOpenPipeline('hub')}
              className="px-2 py-1 text-[9px] font-mono uppercase tracking-widest transition-all rounded flex items-center space-x-2 text-slate-500 hover:text-white hover:bg-white/5"
              title="Intelligence & Sources"
            >
              <Settings className="w-3 h-3" />
            </button>
          </div>

          <div className="w-px h-4 bg-white/10 mx-2" />

          {['National', 'North', 'Sahel', 'Central', 'South', 'Borders'].map((tab) => (
            <button 
              key={tab}
              onClick={() => onRegionChange(tab)}
              className={`px-2 py-1 text-[9px] font-mono uppercase tracking-widest transition-all rounded ${
                activeRegion === tab
                  ? 'bg-intel-cyan text-intel-bg font-bold'
                  : 'text-slate-500 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      <div className="flex items-center space-x-2 sm:space-x-8">
        <div className="hidden sm:flex flex-col items-end">
          <div className="flex items-center space-x-2 text-[10px] font-mono text-slate-500 uppercase">
            <span>V(t)</span>
            <span className={`font-bold ${
              rriState.velocity > 0.15 ? 'text-intel-red' :
              rriState.velocity < -0.15 ? 'text-intel-cyan' :
              'text-white'
            }`}>
              {rriState.velocity_label}
            </span>
          </div>
          <div className="text-[10px] font-mono text-white">
            {formatDate(currentTime)}{' '}
            <span className="text-intel-cyan">{formatTime(currentTime)}</span>
          </div>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-4">
          <button 
            onClick={onGoHome}
            className="p-1.5 sm:p-2 rounded bg-intel-cyan/10 border border-intel-cyan/20 text-intel-cyan hover:bg-intel-cyan/20 transition-all"
            title="Go to Home Screen"
          >
            <Home className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
          <button 
            onClick={() => onOpenPipeline('hub')}
            className="p-1.5 sm:p-2 rounded bg-intel-cyan/10 border border-intel-cyan/20 text-intel-cyan hover:bg-intel-cyan/20 transition-all"
            title="Intelligence & Sources"
          >
            <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
          <button 
            onClick={onOpenAI}
            className="p-1.5 sm:p-2 rounded bg-intel-cyan/10 border border-intel-cyan/20 text-intel-cyan hover:bg-intel-cyan/20 transition-all"
            title="AI Analyst"
          >
            <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
          <button 
            onClick={() => {
              const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `tunisiaintel_export_${new Date().toISOString().split('T')[0]}.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="hidden sm:block p-2 rounded bg-intel-cyan/10 border border-intel-cyan/20 text-intel-cyan hover:bg-intel-cyan/20 transition-all"
            title="Export Intel Data"
          >
            <Download className="w-4 h-4" />
          </button>
          <div className="hidden lg:flex flex-col items-end">
            <div className="text-[8px] font-mono text-slate-500 uppercase">RRI</div>
            <div className={`text-xs font-bold font-mono ${rriState.rri > 2.5 ? 'text-intel-red' : 'text-intel-cyan'}`}>
              {rriState.rri.toFixed(2)}
            </div>
          </div>
          <div className="hidden lg:flex flex-col items-end">
            <div className="text-[8px] font-mono text-slate-500 uppercase">P_REV</div>
            <div className={`text-xs font-bold font-mono ${rriState.p_rev > 0.7 ? 'text-intel-red' : 'text-intel-cyan'}`}>
              {(rriState.p_rev * 100).toFixed(1)}%
            </div>
          </div>
          <div className={`px-2 sm:px-3 py-1 text-[8px] sm:text-[10px] font-bold uppercase tracking-widest rounded ${rriState.rri > 2.5 ? 'bg-intel-red text-white' : 'bg-intel-orange text-black'}`}>
            {rriState.rri > 2.5 ? 'High' : 'Elevated'}
          </div>
        </div>
      </div>
    </header>
  );
};
