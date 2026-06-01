import { safeStorage } from './utils/storage';
import React, { useState, useEffect, useRef, useCallback, Suspense, lazy } from 'react';
import { supabase } from './lib/supabase';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldAlert, RefreshCw, Terminal, Activity } from 'lucide-react';
import { logBootEvent, BootMarkers, printBootSummary } from './utils/bootSequence';
import { BootMarkers as BM } from './utils/bootSequence';

const appStart = Date.now();

// Lazy load mode components
const ModeSelection = lazy(() => import('./components/modes/ModeSelection').then(m => ({ default: m.ModeSelection })));
const TunisiaTerminal = lazy(() => import('./components/modes/TunisiaTerminal').then(m => ({ default: m.TunisiaTerminal })));
const CitizenEdition = lazy(() => import('./components/modes/CitizenEdition').then(m => ({ default: m.CitizenEdition })));
const ProfessionalIntel = lazy(() => import('./components/modes/ProfessionalIntel').then(m => ({ default: m.ProfessionalIntel })));
const TacticalDashboard = lazy(() => import('./components/tactical/TacticalDashboard').then(m => ({ default: m.TacticalDashboard })));
const PalantirDashboard = lazy(() => import('./components/modes/PalantirDashboard').then(m => ({ default: m.PalantirDashboard })));
const BloombergTerminal = lazy(() => import('./components/economy/BloombergTerminal').then(m => ({ default: m.BloombergTerminal })));
const BusinessInvestigator = lazy(() => import('./components/economy/BusinessInvestigator').then(m => ({ default: m.BusinessInvestigator })));
const DataPipeline = lazy(() => import('./components/system/DataPipeline').then(m => ({ default: m.DataPipeline })));
const ObservabilityDashboard = lazy(() => import('./pages/ObservabilityDashboard').then(m => ({ default: m.ObservabilityDashboard })));
const RRIMethodology = lazy(() => import('./components/system/RRIMethodology').then(m => ({ default: m.RRIMethodology })));
const TestMode = lazy(() => import('./components/modes/TestMode').then(m => ({ default: m.TestMode })));
const TunisiaAgricultureDashboard = lazy(() => import('./components/agriculture_dashboard/index').then(m => ({ default: m.default })));

// Import BrainMode component
const BrainMode = lazy(() => import('./brain/components/BrainMode'));

import { Authentication } from './components/shared/Authentication';
import { IntelligenceDossierExporterModal } from './components/shared/IntelligenceDossierExporterModal';
import { CalendarOverlay } from './components/shared/CalendarOverlay';
import { Onboarding } from './components/shared/Onboarding';
import { NotificationProvider } from './context/NotificationContext';
import { AuditProvider } from './context/AuditContext';
import { PipelineProvider, usePipeline } from './context/PipelineContext';
import { AIAnalysisProvider, useAIAnalysis } from './context/AIAnalysisContext';
import { AgriIntelProvider, useAgriIntel } from './context/AgriIntelContext';
import { RSSProvider, useRSS } from './context/RSSContext';
import { AlertProvider } from './context/AlertContext';
import { AIProvider_ } from './context/AIContext';
import { ObservabilityProvider } from './context/ObservabilityContext';
import { NotificationToast } from './components/shared/NotificationToast';
import { NotificationPanel } from './components/shared/NotificationPanel';

import { TacticalLoading } from './components/shared/TacticalLoading';
import { AIAnalystPanel } from './components/system/AIAnalystPanel';

// Data imports
import govData from './data/governorates.json';
import eventData from './data/events.json'

import { initializeVariables } from './services/pipelineService';
import { useEventsStore } from './store/useEventsStore';
import { seedInitialEvents } from './lib/ingestionEngine';

import { SystemCommandCenter } from './components/system/SystemCommandCenter';

import { useNotificationTriggers } from './hooks/useNotificationTriggers';

const safeGetItem = (key: string) => {
  try { return safeStorage.getItem(key); } catch (e) { return null; }
};

// Only mounts when a real mode is active — keeps notifications silent during auth/selection
const ActiveModeServices: React.FC = React.memo(() => {
  useNotificationTriggers();
  return null;
});

const AppContent: React.FC = React.memo(() => {

  // Track boot sequence (once on mount only)
  useEffect(() => {
    BootMarkers.APP_MOUNT();
    logBootEvent('APP_INIT', 'App Component Mounted', appStart);
  }, []);

  // Add 'brain' to the mode type
  const [mode, setMode] = useState<'selection' | 'simplified' | 'professional' | 'advanced' | 'palantir' | 'bloomberg' | 'business_investigator' | 'terminal' | 'test' | 'agriculture' | 'brain'>(
    'selection'
  );
  const [isAuthenticated, setIsAuthenticated] = useState(safeGetItem('ti_authenticated') === 'true');
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingLogs, setLoadingLogs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingMode, setPendingMode] = useState<string | null>(null);
  const [showAIAnalyst, setShowAIAnalyst] = useState(false);
  const [showPipeline, setShowPipeline] = useState(false);
  const [pipelineTab, setPipelineTab] = useState<'pipeline' | 'sources' | 'ai-api'>('pipeline');
  const [showReport, setShowReport] = useState(false);
  const [showMethodology, setShowMethodology] = useState(false);
  const [methodologyEquation, setMethodologyEquation] = useState<string | undefined>(undefined);
  const [showDebug, setShowDebug] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showObservability, setShowObservability] = useState(false);
  
  const { pipelineData, rriState, loadPipelineData } = usePipeline();
  const { events: liveEvents, setEvents } = useEventsStore();

  useEffect(() => {
    const checkSession = async () => {
      const authStart = Date.now();
      logBootEvent('AUTH', 'Auth Check Started', authStart);

      try {
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 4000));
        const result = await Promise.race([sessionPromise, timeoutPromise]);

        if (result && (result as any).data?.session) {
          setIsAuthenticated(true);
        } else if (safeGetItem('ti_authenticated') === 'true') {
          setIsAuthenticated(true);
        }
      } catch {
        if (safeGetItem('ti_authenticated') === 'true') {
          setIsAuthenticated(true);
        }
      }

      setIsLoadingAuth(false);
      logBootEvent('AUTH', 'Auth Check Complete', authStart);
      
      if (pipelineData && liveEvents.length === 0) {
        const seedStart = Date.now();
        logBootEvent('DATA_LOADING', 'Seeding Initial Events', seedStart);
        // seedInitialEvents expects { rri, velocity, ... } and { social, economy, ... }
        const rriData = { rri: rriState.rri || 1.5, velocity: rriState.velocity || 0 };
        const contextData = { social: pipelineData.social, economy: pipelineData.economy };
        const initialEvents = seedInitialEvents(rriData, contextData);
        setEvents(initialEvents);
        logBootEvent('DATA_LOADING', 'Events Seeded', seedStart);
      }
    };
    checkSession();
  }, [setEvents, liveEvents.length]);

  const dataLoadedRef = useRef(false);

  const getModeSteps = (m: string | null): string[] => {
    const map: Record<string, string[]> = {
      professional: [
        'CONFIGURING_ANALYST_INTERFACE... [OK]',
        'BINDING_RRI_THRESHOLD_MONITORS... [OK]',
        'MOUNTING_PREDICTIVE_MODULES... [OK]',
      ],
      brain: [
        'CONFIGURING_COGNITIVE_INTERFACE... [OK]',
        'MOUNTING_PROPAGATION_GRAPH_ENGINE... [OK]',
        'BINDING_STATE_MACHINE_PHASES... [OK]',
      ],
      advanced: [
        'CONFIGURING_TACTICAL_INTERFACE... [OK]',
        'MOUNTING_GEOSPATIAL_RENDERER... [OK]',
        'ACTIVATING_OSINT_STREAM_HANDLERS... [OK]',
      ],
      bloomberg: [
        'CONFIGURING_ECONOMIC_TERMINAL... [OK]',
        'BINDING_MACRO_DATA_FEEDS... [OK]',
      ],
      agriculture: [
        'CONFIGURING_AGRI_CLIMATE_INTERFACE... [OK]',
        'MOUNTING_NDVI_SATELLITE_LAYER... [OK]',
      ],
    };
    return map[m || ''] || [
      'CONFIGURING_INTERFACE_MODULES... [OK]',
      'BINDING_DATA_LAYER... [OK]',
    ];
  };

  const runLoadPipelineData = useCallback(async () => {
    if (dataLoadedRef.current) return;
    dataLoadedRef.current = true;
    const pipelineStart = Date.now();

    const addLog = (msg: string) => setLoadingLogs(prev => [...prev, msg]);

    // Step 1: Load cached platform state (synchronous localStorage read)
    addLog('LOADING_PLATFORM_STATE_CACHE...');
    setLoadingProgress(5);
    loadPipelineData();
    addLog('PLATFORM_STATE_CACHE_LOADED... [OK]');
    setLoadingProgress(15);
    logBootEvent('PIPELINE', 'Platform State Loaded', pipelineStart);

    // Step 2: Mode-specific interface configuration
    const modeSteps = getModeSteps(pendingMode);
    for (let i = 0; i < modeSteps.length; i++) {
      await new Promise(r => setTimeout(r, 80));
      addLog(modeSteps[i]);
      setLoadingProgress(15 + Math.round(((i + 1) / modeSteps.length) * 45));
    }

    // Step 3: Fetch RRI variable registry from backend (real network call, may retry)
    setLoadingProgress(65);
    logBootEvent('PIPELINE', 'Variables Init Started', pipelineStart);

    // Keep progress bar moving slowly during backend retries so it never looks frozen
    const progressTick = setInterval(() => {
      setLoadingProgress(prev => (prev < 95 ? prev + 0.4 : prev));
    }, 200);

    try {
      await initializeVariables(8, 3000, addLog);
      logBootEvent('PIPELINE', 'Variables Initialized', pipelineStart);
    } catch (e) {
      addLog('RRI_VARIABLES_FALLBACK_MODE... [WARN]');
      logBootEvent('PIPELINE', 'Variables Init Failed', pipelineStart, { error: String(e) });
    } finally {
      clearInterval(progressTick);
    }

    addLog('INTELLIGENCE_CORE_READY. [OK]');
    setLoadingProgress(100);
    BootMarkers.BOOT_COMPLETE();
    printBootSummary();
  }, [loadPipelineData, pendingMode]);

  const runLoadRef = useRef(runLoadPipelineData);
  runLoadRef.current = runLoadPipelineData;

  // Trigger loading when user selects a mode (pendingMode + isLoading)
  useEffect(() => {
    if (pendingMode && isLoading) {
      dataLoadedRef.current = false;
      runLoadRef.current();
    }
  }, [pendingMode, isLoading]);

  const handleAuthenticate = useCallback(() => {
    setIsAuthenticated(true);
    try { safeStorage.setItem('ti_authenticated', 'true'); } catch(e) {}
    
    // Show onboarding if first time
    if (safeGetItem('ti_onboarding_done') !== 'true') {
      setShowOnboarding(true);
    }
  }, []);

  const handleModeSelect = useCallback((newMode: any) => {
    // Going home never needs a loading screen
    if (newMode === 'selection') {
      setMode('selection');
      return;
    }
    setLoadingProgress(0);
    setLoadingLogs([]);
    dataLoadedRef.current = false;
    setPendingMode(newMode);
    setIsLoading(true);
  }, []);

  const handleLoadingComplete = useCallback(() => {
    setPendingMode(prev => {
      if (prev) {
        setMode(prev as any);
        try { safeStorage.setItem('ti_current_mode', prev); } catch(e) {}
        setTimeout(() => setRSSEnabled(true), 500);
      }
      return null;
    });
    setIsLoading(false);
  }, []);

  const handleOpenPipeline = useCallback((tab: 'pipeline' | 'sources' | 'ai-api' = 'pipeline') => {
    setPipelineTab(tab);
    setShowPipeline(true);
  }, []);

  const handleOpenMethodology = useCallback((equation?: string) => {
    setMethodologyEquation(equation);
    setShowMethodology(true);
  }, []);

  useEffect(() => {
    const handleMethodology = (e: any) => {
      handleOpenMethodology(e.detail?.equation);
    };
    const PIPELINE_VALID_TABS = new Set(['pipeline', 'sources', 'ai-api']);
    const handlePipeline = (e: any) => {
      const tab = e.detail?.tab;
      handleOpenPipeline(PIPELINE_VALID_TABS.has(tab) ? tab : 'pipeline');
    };
    
    window.addEventListener('navigate-to-methodology', handleMethodology);
    window.addEventListener('navigate-to-pipeline', handlePipeline);
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '`') {
        setShowDebug(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    
    const handleObservability = () => setShowObservability(true);
    window.addEventListener('navigate-to-observability', handleObservability);
    BootMarkers.REALTIME_CONNECT();

    const handleGoHome = () => setMode('selection');
    window.addEventListener('navigate-to-home', handleGoHome);

    const handleSystemCommand = () => setShowDebug(prev => !prev);
    window.addEventListener('navigate-to-system-command', handleSystemCommand);

    // navigate-main: fired by notification action buttons (tab = target area)
    const handleNavigateMain = (e: any) => {
      const tab = e.detail?.tab;
      if (!tab) return;
      const tabToOverlay: Record<string, () => void> = {
        risk:       () => handleOpenPipeline('pipeline'),
        pipeline:   () => handleOpenPipeline('pipeline'),
        alerts:     () => handleOpenPipeline('pipeline'),
        'ai-api':   () => handleOpenPipeline('ai-api'),
        newsfeed:   () => handleOpenPipeline('sources'),
        agri:       () => handleOpenPipeline('pipeline'),
        economy:    () => handleOpenPipeline('pipeline'),
        political:  () => handleOpenPipeline('pipeline'),
        security:   () => handleOpenPipeline('pipeline'),
        system:     () => setShowDebug(prev => !prev),
        methodology:() => setShowMethodology(true),
      };
      const action = tabToOverlay[tab];
      if (action) action();
    };
    window.addEventListener('navigate-main', handleNavigateMain);

    return () => {
      window.removeEventListener('navigate-to-methodology', handleMethodology);
      window.removeEventListener('navigate-to-pipeline', handlePipeline);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('navigate-to-observability', handleObservability);
      window.removeEventListener('navigate-to-home', handleGoHome);
      window.removeEventListener('navigate-to-system-command', handleSystemCommand);
      window.removeEventListener('navigate-main', handleNavigateMain);
    };
  }, []);

  useEffect(() => {
    if (mode === 'selection') {
      const t = setTimeout(() => setRSSEnabled(true), 100);
      return () => clearTimeout(t);
    }
  }, [mode]);

  const renderMode = () => {
    if (isLoadingAuth) {
      return (
        <div className="min-h-screen bg-intel-bg flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-intel-cyan border-t-transparent rounded-full animate-spin"></div>
        </div>
      );
    }
    if (!isAuthenticated) {
      return <Authentication onAuthenticate={handleAuthenticate} />;
    }
    switch (mode) {
      case 'simplified':
        return (
          <motion.div key="simplified" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.4 }} className="h-full">
            <CitizenEdition 
              governorates={govData.governorates as any}
              events={liveEvents.length > 0 ? liveEvents : (eventData.events as any)}
              rri={rriState.rri}
              pRev={rriState.p_rev}
              onOpenAI={() => setShowAIAnalyst(true)} 
              onOpenPipeline={handleOpenPipeline}
              onGoHome={() => handleModeSelect('selection')}
              onOpenReport={() => setShowReport(true)}
              data={pipelineData}
            />
          </motion.div>
        );
      case 'professional':
        return (
          <motion.div key="professional" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.02 }} transition={{ duration: 0.4 }} className="h-full">
            <ProfessionalIntel 
              onOpenAI={() => setShowAIAnalyst(true)} 
              onOpenPipeline={handleOpenPipeline}
              onGoHome={() => handleModeSelect('selection')}
              onOpenReport={() => setShowReport(true)}
              onToggleDebug={() => setShowDebug(prev => !prev)}
              context={{
                governorates: govData.governorates,
                events: liveEvents.length > 0 ? liveEvents : eventData.events
              }}
            />
          </motion.div>
        );
      case 'advanced':
        return (
          <motion.div key="advanced" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.4 }} className="h-full">
            <TacticalDashboard 
              governorates={govData.governorates as any}
              events={liveEvents.length > 0 ? liveEvents : (eventData.events as any)}
              onOpenAI={() => setShowAIAnalyst(true)} 
              onOpenPipeline={handleOpenPipeline}
              onGoHome={() => handleModeSelect('selection')}
              onOpenReport={() => setShowReport(true)}
              data={pipelineData}
            />
          </motion.div>
        );
      case 'palantir':
        return (
          <motion.div key="palantir" initial={{ opacity: 0, filter: 'blur(10px)' }} animate={{ opacity: 1, filter: 'blur(0px)' }} exit={{ opacity: 0, filter: 'blur(10px)' }} transition={{ duration: 0.6 }} className="h-full">
            <PalantirDashboard 
              onOpenAI={() => setShowAIAnalyst(true)} 
              onOpenPipeline={handleOpenPipeline}
              onGoHome={() => handleModeSelect('selection')}
              onOpenReport={() => setShowReport(true)}
              onOpenObservability={() => setShowObservability(true)}
              context={{
                governorates: govData.governorates,
                events: eventData.events
              }}
            />
          </motion.div>
        );
      case 'bloomberg':
        return (
          <motion.div key="bloomberg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="h-full">
            <BloombergTerminal 
              onOpenAI={() => setShowAIAnalyst(true)} 
              onOpenPipeline={handleOpenPipeline}
              onGoHome={() => handleModeSelect('selection')}
              onOpenReport={() => setShowReport(true)}
              context={{
                governorates: govData.governorates,
                events: eventData.events
              }}
            />
          </motion.div>
        );
      case 'business_investigator':
        return (
          <motion.div key="investigator" initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }} transition={{ duration: 0.5 }} className="h-full">
            <BusinessInvestigator 
              onOpenAI={() => setShowAIAnalyst(true)} 
              onOpenPipeline={handleOpenPipeline}
              onGoHome={() => handleModeSelect('selection')}
              onOpenReport={() => setShowReport(true)}
              context={{
                governorates: govData.governorates,
                events: eventData.events
              }}
            />
          </motion.div>
        );
      case 'test':
        return (
          <motion.div key="test" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
            <TestMode onGoHome={() => handleModeSelect('selection')} />
          </motion.div>
        );
      case 'terminal':
        return (
          <motion.div key="terminal" initial={{ opacity: 0, scale: 1.1 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.4 }} className="h-full">
            <TunisiaTerminal
              onGoHome={() => handleModeSelect('selection')}
              governorates={govData.governorates as any}
            />
          </motion.div>
        );
      case 'brain':
        return (
          <motion.div key="brain" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.6 }} className="h-full">
            <BrainMode
              onOpenAI={() => setShowAIAnalyst(true)}
              onOpenPipeline={handleOpenPipeline}
              onGoHome={() => handleModeSelect('selection')}
              onOpenReport={() => setShowReport(true)}
            />
          </motion.div>
        );
      case 'agriculture':
        return (
          <motion.div key="agri" initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 100 }} transition={{ type: 'spring', damping: 20 }} className="h-full">
            <TunisiaAgricultureDashboard />
          </motion.div>
        );

      default:
        return (
          <motion.div key="selection" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }} className="h-full">
            <ModeSelection onSelect={handleModeSelect} onLogoff={() => { supabase.auth.signOut(); setIsAuthenticated(false); try { safeStorage.removeItem('ti_authenticated'); } catch(e) {} setMode('selection'); }} />
          </motion.div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-intel-bg text-slate-300 selection:bg-intel-cyan/30 selection:text-white">
      <AnimatePresence mode="wait">
        <Suspense fallback={<div style={{ position: 'fixed', inset: 0, background: '#040609' }} />}>
          {renderMode()}
          {/* Notification triggers only active once a real mode is running */}
          {isAuthenticated && mode !== 'selection' && <ActiveModeServices />}
        </Suspense>
      </AnimatePresence>

      {/* Global Overlays */}
      <AnimatePresence>
        {isLoading && (
          <TacticalLoading
            key="tactical-loading"
            onComplete={handleLoadingComplete}
            progress={loadingProgress}
            logs={loadingLogs}
          />
        )}
        {showMethodology && (
          <RRIMethodology 
            onClose={() => setShowMethodology(false)} 
            jumpToEquation={methodologyEquation}
            onNavigateToPipeline={(tab) => handleOpenPipeline(tab as any)}
          />
        )}
        {showPipeline && (
          <DataPipeline 
            initialTab={pipelineTab as 'ingestion' | 'processing' | 'storage' | 'analysis'} 
            onClose={() => setShowPipeline(false)} 
          />
        )}
        <IntelligenceDossierExporterModal key="dossier-exporter"
          isOpen={showReport}
          onClose={() => setShowReport(false)}
        />
        {showOnboarding && (
          <Onboarding onComplete={() => {
            setShowOnboarding(false);
            try { safeStorage.setItem('ti_onboarding_done', 'true'); } catch(e) {}
          }} />
        )}
        <NotificationPanel key="notification-panel"
          isOpen={showNotifications}
          onClose={() => setShowNotifications(false)} 
        />
        <AIAnalystPanel key="ai-analyst"
          isOpen={showAIAnalyst}
          onClose={() => setShowAIAnalyst(false)}
        />
        {showObservability && (
          <div className="fixed inset-0 z-toast">
             <ObservabilityDashboard onBack={() => setShowObservability(false)} />
          </div>
        )}
      </AnimatePresence>

      {/* Global Toast */}
      <NotificationToast />
      
      {/* Visual Debugger */}
      <AnimatePresence>
        {showDebug && (
          <div className="fixed inset-0 z-overlay flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDebug(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative z-10 w-full max-w-[1400px] h-full sm:h-auto md:h-full sm:max-h-[85vh]"
            >
              <SystemCommandCenter onClose={() => setShowDebug(false)} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
});

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: any }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#05070a] text-intel-cyan font-mono flex flex-col items-center justify-center p-6 text-center space-y-8 relative overflow-hidden">
          {/* Background grid */}
          <div
            className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{ backgroundImage: 'radial-gradient(#00f2ff 1px, transparent 1px)', backgroundSize: '32px 32px' }}
          />
          
          <div className="relative z-10 space-y-6 max-w-2xl w-full">
            <div className="flex flex-col items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-500 animate-pulse">
                <ShieldAlert className="w-10 h-10" />
              </div>
              <div className="space-y-1">
                <h2 className="text-3xl font-black tracking-tighter text-on-surface uppercase">Critical Kernel Failure</h2>
                <div className="text-[10px] text-red-500/70 font-bold tracking-[0.3em] uppercase">// SYSTEM_HALT_RECOVERY_REQUIRED</div>
              </div>
            </div>

            <div className="glass-panel p-6 border-red-500/20 text-left space-y-4">
              <div className="flex items-center gap-2 border-b border-red-500/10 pb-3">
                <Terminal className="w-4 h-4 text-red-500" />
                <span className="text-xs font-bold text-slate-400">Diagnostic Trace:</span>
              </div>
              <div className="max-h-60 overflow-y-auto custom-scrollbar space-y-2">
                <pre className="text-[11px] text-red-400/80 font-mono whitespace-pre-wrap leading-relaxed">
                  {this.state.error?.toString()}
                </pre>
                <div className="h-px bg-white/5 w-full my-2" />
                <pre className="text-[9px] text-slate-500 font-mono whitespace-pre-wrap leading-tight">
                  {this.state.error?.stack}
                </pre>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => window.location.reload()}
                className="flex items-center gap-2 px-6 py-2.5 bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-all rounded-lg font-bold text-xs uppercase tracking-widest group"
              >
                <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
                Reboot System
              </button>
              <button
                onClick={() => {
                   try {
                     Object.keys(safeStorage).forEach(key => {
                       try { safeStorage.removeItem(key); } catch(e) {}
                     });
                   } catch(e) {}
                  window.location.reload();
                }}
                className="text-[10px] text-slate-500 hover:text-white transition-colors uppercase tracking-widest underline underline-offset-4"
              >
                [ Wipe Local Cache & Restart ]
              </button>
            </div>
          </div>

          <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-8 opacity-20">
            <div className="flex items-center gap-2 text-[8px] tracking-[0.4em] text-slate-500 font-bold">
              <Activity className="w-3 h-3" />
              TRACE_ID: {Math.random().toString(36).substring(7).toUpperCase()}
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Event-based RSS activation — avoids polling that causes remount cascade
const RSS_ENABLE_EVENT = 'ti-rss-enable';
export const setRSSEnabled = (v: boolean) => {
  if (v) window.dispatchEvent(new CustomEvent(RSS_ENABLE_EVENT));
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <ObservabilityProvider>
        <AIProvider_>
          <AuditProvider>
            <PipelineProvider>
              <RSSProviderWrapper>
                <NotificationProviderWrapper>
                  <AIAnalysisProvider>
                    <AgriIntelProvider>
                      <AlertProvider>
                        <AppContent />
                      </AlertProvider>
                    </AgriIntelProvider>
                  </AIAnalysisProvider>
                </NotificationProviderWrapper>
              </RSSProviderWrapper>
            </PipelineProvider>
          </AuditProvider>
        </AIProvider_>
      </ObservabilityProvider>
    </ErrorBoundary>
  );
};

const NotificationProviderWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <NotificationProvider>
      {children}
    </NotificationProvider>
  );
};

const RSSProviderWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { rriState } = usePipeline();
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const handler = () => setEnabled(true);
    window.addEventListener(RSS_ENABLE_EVENT, handler);
    return () => window.removeEventListener(RSS_ENABLE_EVENT, handler);
  }, []);

  return (
    <RSSProvider rriState={rriState} enabled={enabled}>
      <ArticleCacheConnector />
      {children}
    </RSSProvider>
  );
};

const ArticleCacheConnector: React.FC = () => {
  const { articles } = useRSS();
  const { updateArticleCache } = usePipeline();

  useEffect(() => {
    if (articles.length > 0) {
      updateArticleCache(articles);
    }
  }, [articles, updateArticleCache]);

  return null;
};

export default App;
