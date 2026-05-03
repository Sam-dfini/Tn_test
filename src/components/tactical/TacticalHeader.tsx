import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Clock, Globe, Eye, Download, Home, TrendingUp, Database, Settings, Shield, Zap, Search, HelpCircle } from 'lucide-react';
import { usePipeline } from '../../context/PipelineContext';
import { NotificationBell } from '../NotificationPanel';
import { WeatherMini } from './WeatherMini';

interface TacticalHeaderProps {
  onOpenAI: () => void;
  onOpenPipeline: (tab?: 'pipeline' | 'sources' | 'ai-api') => void;
  onGoHome: () => void;
  data: any;
  activeRegion: string;
  onRegionChange: (region: string) => void;
  viewMode: 'MAP' | 'INTEL';
  onViewModeChange: (mode: 'MAP' | 'INTEL') => void;
  onOpenReport: () => void;
}

export const TacticalHeader: React.FC<TacticalHeaderProps> = ({ 
  onOpenAI, onOpenPipeline, onGoHome, data, activeRegion, onRegionChange, viewMode, onViewModeChange, onOpenReport
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
    <header className="h-[8vh] min-h-[50px] max-h-[80px] border-b border-intel-border bg-[#05070a]/80 backdrop-blur-xl flex items-center justify-between px-6 sticky top-0 z-[100] shrink-0">
      {/* Top accent line - Professional Theme */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-intel-cyan/50 to-transparent" />

      {/* Animated Red Border for Tunisia Focus - Preserved from Tactical */}
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
      
      <div className="flex items-center space-x-8">
        <div className="flex items-center space-x-4">
          <div className="w-9 h-9 bg-intel-cyan/5 border border-intel-cyan/20 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(0,242,255,0.05)]">
            <Eye className="w-5 h-5 text-intel-cyan" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-sm lg:text-base font-bold text-white tracking-[0.2em] uppercase">Tactical OSINT</h1>
              <span className="text-[8px] lg:text-[10px] px-1.5 py-0.5 rounded bg-intel-red/10 border border-intel-red/20 text-intel-red font-mono font-bold">WARTIME RISK</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-1.5 h-1.5 rounded-full bg-intel-red animate-pulse shadow-[0_0_8px_rgba(255,59,59,0.5)]"></div>
              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">System Operational // Node 04</span>
            </div>
          </div>
        </div>

        {/* Global Search Placeholder */}
        <div className="hidden xl:flex items-center relative">
          <Search className="absolute left-3 w-3.5 h-3.5 text-slate-600" />
          <input 
            type="text" 
            placeholder="SEARCH INTELLIGENCE..." 
            aria-label="Global intelligence search"
            className="bg-white/5 border border-intel-border rounded-lg pl-9 pr-4 py-1.5 text-[10px] font-mono text-white w-64 focus:outline-none focus:border-intel-cyan/40 transition-all"
          />
        </div>
      </div>

      <div className="flex items-center space-x-6">
        {/* Live Metrics */}
        <div className="hidden md:flex items-center space-x-6 border-x border-intel-border/30 px-6 h-full">
          <div className="flex flex-col items-end">
            <span className="text-[8px] lg:text-[10px] font-mono text-slate-500 uppercase tracking-widest">RRI Index</span>
            <span className={`text-sm lg:text-xl font-bold font-mono ${(rriState?.rri ?? 0) > 2.5 ? 'text-intel-red' : 'text-intel-cyan'}`}>
              {(rriState?.rri ?? 0).toFixed(2)}
            </span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[8px] lg:text-[10px] font-mono text-slate-500 uppercase tracking-widest">P(Revolution)</span>
            <span className={`text-sm lg:text-xl font-bold font-mono ${(rriState?.p_rev ?? 0) > 0.7 ? 'text-intel-red' : 'text-intel-orange'}`}>
              {((rriState?.p_rev ?? 0) * 100).toFixed(1)}%
            </span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[8px] lg:text-[10px] font-mono text-slate-500 uppercase tracking-widest">V(t)</span>
            <span className={`text-sm lg:text-xl font-bold font-mono ${(rriState?.velocity ?? 0) > 0.15 ? 'text-intel-red' : (rriState?.velocity ?? 0) < -0.15 ? 'text-intel-cyan' : 'text-white'}`}>
              {((rriState?.velocity ?? 0) > 0 ? '+' : '') + (rriState?.velocity ?? 0).toFixed(3)}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center bg-white/5 border border-intel-border rounded-xl p-1">
            <button 
              onClick={onGoHome}
              aria-label="Return to Mode Selection"
              className="p-2 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-all"
              title="Home Screen"
            >
              <Home className="w-4 h-4" />
            </button>
            <button 
              onClick={() => onOpenPipeline('ai-api')}
              aria-label="Open Data Pipeline and Settings"
              className="p-2 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-all"
              title="Data Pipeline"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button 
              onClick={onOpenAI}
              aria-label="Open AI Analyst Panel"
              className="p-2 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-all"
              title="AI Analyst"
            >
              <Zap className="w-4 h-4" />
            </button>
            <button 
              onClick={onOpenReport}
              aria-label="Generate Intelligence Report"
              className="p-2 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-all"
              title="Generate Report"
            >
              <Download className="w-4 h-4" />
            </button>
            <button 
              onClick={() => window.dispatchEvent(new CustomEvent('navigate-to-methodology', { detail: {} }))}
              aria-label="View RRI Methodology and Help"
              className="p-2 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-all"
              title="Help"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>

          <div className="w-px h-8 bg-intel-border/30 mx-1" />

          <NotificationBell />

          <WeatherMini />

          <div className="flex flex-col items-end min-w-[100px]">
            <div className="text-[10px] font-mono text-white font-bold">
              {formatTime(currentTime)}
            </div>
            <div className="text-[8px] font-mono text-slate-500 uppercase">
              {formatDate(currentTime)} UTC
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
