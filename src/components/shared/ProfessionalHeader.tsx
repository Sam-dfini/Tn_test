import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, Shield, Eye, Download, Home, Settings, Zap, Bell, HelpCircle, Loader2, Printer, Menu, MoreVertical, Calendar, TerminalSquare, AlertTriangle, ChevronDown, Check } from 'lucide-react';
import { useRiskMetrics } from '../../hooks/usePipelineDomains';
import { NotificationBell } from './NotificationPanel';
import { WeatherMini } from '../tactical/WeatherMini';
import { useViewMode, ViewMode } from '../../hooks/useViewMode';

interface ProfessionalHeaderProps {
  onOpenAI: () => void;
  onOpenPipeline: (tab?: 'pipeline' | 'sources' | 'ai-api') => void;
  onGoHome: () => void;
  onOpenReport: () => void;
  onOpenCalendar: () => void;
  onOpenTerminal: () => void;
  onToggleDebug: () => void;
  onToggleSidebar?: () => void;
  sidebarOpen?: boolean;
  children?: React.ReactNode;
}

export const ProfessionalHeader: React.FC<ProfessionalHeaderProps> = ({ 
  onOpenAI, onOpenPipeline, onGoHome, onOpenReport, onOpenCalendar, onOpenTerminal, onToggleDebug, onToggleSidebar, sidebarOpen = true, children
}) => {
  const { rriState, fullData: data } = useRiskMetrics();
  const { viewMode, setViewMode } = useViewMode();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showModeSelector, setShowModeSelector] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const modeSelectorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Close mobile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setMobileMenuOpen(false);
      }
      if (modeSelectorRef.current && !modeSelectorRef.current.contains(event.target as Node)) {
        setShowModeSelector(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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
    <header className="h-16 border-b border-intel-border bg-[#05070a]/80 backdrop-blur-xl flex items-center justify-between px-4 sticky top-0 z-[100]">
      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-intel-cyan/50 to-transparent" />
      
      <div className="flex items-center space-x-2 md:space-x-6">
        <div className="flex items-center space-x-2 md:space-x-4">
          <button 
            onClick={onToggleSidebar}
            className={`p-2 rounded-lg transition-all ${
              sidebarOpen 
                ? 'text-intel-cyan bg-intel-cyan/10' 
                : 'text-slate-500 hover:text-white hover:bg-white/5'
            }`}
            title={sidebarOpen ? "Close Sidebar" : "Open Sidebar"}
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="w-9 h-9 hidden md:flex bg-intel-cyan/5 border border-intel-cyan/20 rounded-xl items-center justify-center shadow-[0_0_15px_rgba(0,242,255,0.05)]">
            <Shield className="w-5 h-5 text-intel-cyan" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-sm font-bold text-white tracking-[0.2em] uppercase">Tunisia Intel</h1>
              <div className="relative" ref={modeSelectorRef}>
                <button 
                  onClick={() => setShowModeSelector(!showModeSelector)}
                  className={`text-[8px] px-1.5 py-0.5 rounded font-mono font-bold transition-all flex items-center space-x-1 ${
                    viewMode === 'STRATEGIC' ? 'bg-intel-red/10 border border-intel-red/20 text-intel-red shadow-[0_0_10px_rgba(239,68,68,0.1)]' :
                    viewMode === 'ANALYST' ? 'bg-intel-cyan/10 border border-intel-cyan/20 text-intel-cyan' :
                    'bg-intel-green/10 border border-intel-green/20 text-intel-green'
                  }`}
                >
                  <span>{viewMode}</span>
                  <ChevronDown className={`w-2 h-2 transition-transform ${showModeSelector ? 'rotate-180' : ''}`} />
                </button>
                
                <AnimatePresence>
                  {showModeSelector && (
                    <motion.div
                      initial={{ opacity: 0, y: 5, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 5, scale: 0.95 }}
                      className="absolute top-full left-0 mt-2 w-36 bg-[#0a0c10] border border-intel-border rounded-lg shadow-2xl overflow-hidden z-[200]"
                    >
                      {(['PUBLIC', 'ANALYST', 'STRATEGIC'] as ViewMode[]).map((mode) => (
                        <button
                          key={mode}
                          onClick={() => { setViewMode(mode); setShowModeSelector(false); }}
                          className={`w-full px-3 py-2 text-[9px] font-mono uppercase tracking-wider text-left transition-colors flex items-center justify-between ${
                            viewMode === mode ? 'bg-intel-cyan/10 text-intel-cyan' : 'text-slate-500 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          <span>{mode}</span>
                          {viewMode === mode && <Check className="w-2.5 h-2.5" />}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-1.5 h-1.5 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)] ${
                viewMode === 'STRATEGIC' ? 'bg-intel-red' : 
                viewMode === 'ANALYST' ? 'bg-intel-cyan' : 
                'bg-intel-green'
              }`}></div>
              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">
                {viewMode === 'STRATEGIC' ? 'Strategic Intelligence Tier' : 
                 viewMode === 'ANALYST' ? 'Professional Analyst Mode' : 
                 'Public OSINT Access'}
              </span>
            </div>
          </div>
        </div>

      </div>

      <div className="flex items-center space-x-2 md:space-x-6">
        {/* Live Metrics */}
        <div className="hidden lg:flex items-center space-x-6 border-x border-intel-border/30 px-6">
          <div className="flex flex-col items-end">
            <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest">RRI Index</span>
            <span className={`text-sm font-bold font-mono ${rriState.rri > 2.5 ? 'text-intel-red' : 'text-intel-cyan'}`}>
              {rriState.rri.toFixed(2)}
            </span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest">P(Revolution)</span>
            <span className={`text-sm font-bold font-mono ${rriState.p_rev > 0.7 ? 'text-intel-red' : 'text-intel-orange'}`}>
              {(rriState.p_rev * 100).toFixed(1)}%
            </span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest">FX Reserves</span>
            <span className={`text-sm font-bold font-mono ${data.economy.fx_reserves < 90 ? 'text-intel-orange' : 'text-intel-green'}`}>
              {data.economy.fx_reserves}d
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-1 sm:space-x-3">
          {children}
          <div className="flex items-center bg-white/5 border border-intel-border rounded-xl p-0.5 sm:p-1 relative" ref={mobileMenuRef}>
            <button 
              onClick={onGoHome}
              className="p-1.5 sm:p-2 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-all"
              title="Home Screen"
            >
              <Home className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
            <button 
              onClick={() => onOpenPipeline('ai-api')}
              className="p-1.5 sm:p-2 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-all hidden sm:block"
              title="Data Pipeline"
            >
              <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
            <button 
              onClick={onOpenAI}
              className="p-1.5 sm:p-2 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-all hidden sm:block"
              title="AI Analyst"
            >
              <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
            <button 
              onClick={onOpenReport}
              className="p-1.5 sm:p-2 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-all hidden sm:block"
              title="Generate AI Report"
            >
              <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
            <button 
              onClick={onOpenCalendar}
              className="p-1.5 sm:p-2 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-all hidden sm:block"
              title="Calendar"
            >
              <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
            <button 
              onClick={onOpenTerminal}
              className="p-1.5 sm:p-2 rounded-lg text-intel-cyan/60 hover:text-intel-cyan hover:bg-intel-cyan/10 transition-all border border-intel-cyan/20 ml-1 hidden sm:block"
              title="Intelligence Terminal"
            >
              <TerminalSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
            <button 
              onClick={onToggleDebug}
              className="p-1.5 sm:p-2 rounded-lg text-red-400/60 hover:text-red-400 hover:bg-red-500/10 transition-all border border-red-500/20 ml-1 hidden sm:block"
              title="Pipeline Debugger"
            >
              <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
            <button 
              onClick={() => window.dispatchEvent(new CustomEvent('navigate-to-methodology', { detail: {} }))}
              className="p-1.5 sm:p-2 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-all hidden sm:block"
              title="Help"
            >
              <HelpCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
            
            {/* Mobile "More" Button */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-all sm:hidden"
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>

            {/* Mobile Dropdown Menu */}
            <AnimatePresence>
              {mobileMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full right-0 mt-2 w-48 bg-surface-container border border-outline-variant rounded-xl shadow-2xl overflow-hidden z-50 sm:hidden"
                >
                  <div className="p-1 flex flex-col">
                    <button 
                      onClick={() => { onOpenPipeline('ai-api'); setMobileMenuOpen(false); }}
                      className="flex items-center space-x-3 px-3 py-2 text-xs text-on-surface hover:bg-white/5 rounded-lg transition-colors text-left"
                    >
                      <Settings className="w-3.5 h-3.5" />
                      <span>Data Pipeline</span>
                    </button>
                    <button 
                      onClick={() => { onOpenAI(); setMobileMenuOpen(false); }}
                      className="flex items-center space-x-3 px-3 py-2 text-xs text-on-surface hover:bg-white/5 rounded-lg transition-colors text-left"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>AI Analyst</span>
                    </button>
                    <button 
                      onClick={() => { onOpenReport(); setMobileMenuOpen(false); }}
                      className="flex items-center space-x-3 px-3 py-2 text-xs text-on-surface hover:bg-white/5 rounded-lg transition-colors text-left"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Generate AI Report</span>
                    </button>
                    <button 
                      onClick={() => { onOpenCalendar(); setMobileMenuOpen(false); }}
                      className="flex items-center space-x-3 px-3 py-2 text-xs text-on-surface hover:bg-white/5 rounded-lg transition-colors text-left"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Calendar</span>
                    </button>
                    <button 
                      onClick={() => { onOpenTerminal(); setMobileMenuOpen(false); }}
                      className="flex items-center space-x-3 px-3 py-2 text-xs text-intel-cyan hover:bg-intel-cyan/10 rounded-lg transition-colors text-left"
                    >
                      <TerminalSquare className="w-3.5 h-3.5" />
                      <span>Intelligence Terminal</span>
                    </button>
                    <button 
                      onClick={() => { onToggleDebug(); setMobileMenuOpen(false); }}
                      className="flex items-center space-x-3 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 rounded-lg transition-colors text-left"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Command Center</span>
                    </button>
                    <button 
                      onClick={() => { window.dispatchEvent(new CustomEvent('navigate-to-methodology', { detail: {} })); setMobileMenuOpen(false); }}
                      className="flex items-center space-x-3 px-3 py-2 text-xs text-on-surface hover:bg-white/5 rounded-lg transition-colors text-left"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>Help / Methodology</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="w-px h-8 bg-intel-border/30 mx-0.5 sm:mx-1" />

          <NotificationBell />

          <div className="hidden sm:block">
            <WeatherMini />
          </div>

          <div className="hidden sm:flex flex-col items-end min-w-[70px] sm:min-w-[100px]">
            <div className="text-[10px] sm:text-[10px] font-mono text-white font-bold">
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
