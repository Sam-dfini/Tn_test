import { safeStorage } from './utils/storage';
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './lib/supabase';
import { motion, AnimatePresence } from 'motion/react';
import { ModeSelection } from './components/modes/ModeSelection';
import { TunisiaTerminal } from './components/modes/TunisiaTerminal';
import { Authentication } from './components/shared/Authentication';
import { CitizenEdition } from './components/modes/CitizenEdition';
import { ProfessionalIntel } from './components/modes/ProfessionalIntel';
import { TacticalDashboard } from './components/tactical/TacticalDashboard';
import { PalantirDashboard } from './components/modes/PalantirDashboard';
import { BloombergTerminal } from './components/economy/BloombergTerminal';
import { BusinessInvestigator } from './components/economy/BusinessInvestigator';
import { DataPipeline } from './components/system/DataPipeline';
import { ObservabilityDashboard } from './pages/ObservabilityDashboard';
import { RRIMethodology } from './components/system/RRIMethodology';
import { IntelligenceDossierExporterModal } from './components/shared/IntelligenceDossierExporterModal';
import { CalendarOverlay } from './components/shared/CalendarOverlay';
import { Onboarding } from './components/shared/Onboarding';
import { NotificationProvider } from './context/NotificationContext';
import { AuditProvider } from './context/AuditContext';
import { PipelineProvider, usePipeline } from './context/PipelineContext';
import { AIAnalysisProvider, useAIAnalysis } from './context/AIAnalysisContext';
import { AgriIntelProvider, useAgriIntel } from './context/AgriIntelContext';
import { RSSProvider, useRSS } from './context/RSSContext';
import { AIProvider_ } from './context/AIContext';
import { ObservabilityProvider } from './context/ObservabilityContext';
import { NotificationToast } from './components/shared/NotificationToast';
import { NotificationPanel } from './components/shared/NotificationPanel';

import { TacticalLoading } from './components/shared/TacticalLoading';
import { AIAnalystPanel } from './components/system/AIAnalystPanel';

import { TestMode } from './components/modes/TestMode';

import TunisiaAgricultureDashboard from './components/agriculture_dashboard';

// Data imports
import govData from './data/governorates.json';
import eventData from './data/events.json';

import { initializeVariables } from './services/pipelineService';
import { useEventsStore } from './store/useEventsStore';
import { seedInitialEvents } from './lib/ingestionEngine';

import { SystemCommandCenter } from './components/system/SystemCommandCenter';

import { useNotificationTriggers } from './hooks/useNotificationTriggers';

const safeGetItem = (key: string) => {
  try { return safeStorage.getItem(key); } catch (e) { return null; }
};

const AppContent: React.FC = () => {
  // Activate automatic notification triggers
  useNotificationTriggers();

  const [mode, setMode] = useState<'selection' | 'simplified' | 'advanced' | 'professional' | 'palantir' | 'bloomberg' | 'business_investigator' | 'test' | 'terminal' | 'agriculture' | 'pyramid'>(() => {
    const saved = safeGetItem('ti_app_mode');
    return (saved as any) || 'selection';
  });

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [pendingMode, setPendingMode] = useState<'selection' | 'simplified' | 'advanced' | 'professional' | 'palantir' | 'bloomberg' | 'business_investigator' | 'test' | 'terminal' | 'agriculture' | 'pyramid' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showAIAnalyst, setShowAIAnalyst] = useState(false);
  const [showPipeline, setShowPipeline] = useState(false);
  const [showMethodology, setShowMethodology] = useState(false);
  const [methodologyEquation, setMethodologyEquation] = useState<string | undefined>();
  const [pipelineTab, setPipelineTab] = useState<'pipeline' | 'sources' | 'finance' | 'ai-api'>('pipeline');
  const [showReport, setShowReport] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(() => !safeGetItem('ti_onboarding_done'));
  const [showNotifications, setShowNotifications] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [showObservability, setShowObservability] = useState(false);

  const { rriState, data: pipelineData } = usePipeline();
  const { events: liveEvents } = useRSS();
  const { ingestData, events: storeEvents } = useEventsStore();
  const hasSeededRef = useRef(false);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    
    initializeVariables().catch(err => console.error("Variable initialization failed:", err));
    
    // Seed initial events once if store is empty and we have data
    if (rriState && pipelineData && !hasSeededRef.current) {
      import('./lib/ingestionEngine').then(({ fetchSystemEvents }) => {
        fetchSystemEvents(rriState, pipelineData, ingestData);
      });
      hasSeededRef.current = true;
    }

    initialized.current = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session || !!safeGetItem('ti_authenticated'));
      setIsLoadingAuth(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        try { safeStorage.removeItem('ti_authenticated'); } catch(e) {}
      }
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, [rriState, pipelineData, ingestData]);

  const handleAuthenticate = () => {
    setIsAuthenticated(true);
  };

  const handleModeSelect = (selected: 'selection' | 'simplified' | 'advanced' | 'professional' | 'palantir' | 'bloomberg' | 'business_investigator' | 'test' | 'terminal' | 'agriculture' | 'pyramid') => {
    if (selected === 'selection') {
      setMode('selection');
      setPendingMode(null);
      setIsLoading(false);
    } else {
      setPendingMode(selected);
      setIsLoading(true);
    }
  };

  const handleLoadingComplete = React.useCallback(() => {
    if (pendingMode) {
      setMode(pendingMode);
      setPendingMode(null);
    }
    setIsLoading(false);
  }, [pendingMode]);

  const handleOpenPipeline = (tab: 'pipeline' | 'sources' | 'finance' | 'ai-api' = 'pipeline') => {
    setPipelineTab(tab);
    setShowPipeline(true);
  };

  // Listen for navigation events from components
  useEffect(() => {
    const handleMethodology = (e: any) => {
      setMethodologyEquation(e.detail?.equation);
      setShowMethodology(true);
    };
    const handlePipeline = (e: any) => handleOpenPipeline(e.detail?.tab || 'pipeline');
    
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
    
    return () => {
      window.removeEventListener('navigate-to-methodology', handleMethodology);
      window.removeEventListener('navigate-to-pipeline', handlePipeline);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('navigate-to-observability', handleObservability);
    };
  }, []);

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
        {renderMode()}
      </AnimatePresence>

      {/* Global Overlays */}
      <AnimatePresence>
        {isLoading && (
          <TacticalLoading 
            key="tactical-loading"
            onComplete={handleLoadingComplete} 
            mode={pendingMode || mode as any} 
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
            initialTab={pipelineTab} 
            onClose={() => setShowPipeline(false)} 
          />
        )}
        <IntelligenceDossierExporterModal 
          isOpen={showReport}
          onClose={() => setShowReport(false)}
        />
        <CalendarOverlay
          isOpen={showCalendar}
          onClose={() => setShowCalendar(false)}
        />
        {showOnboarding && (
          <Onboarding onComplete={() => {
            setShowOnboarding(false);
            try { safeStorage.setItem('ti_onboarding_done', 'true'); } catch(e) {}
          }} />
        )}
        <NotificationPanel 
          isOpen={showNotifications}
          onClose={() => setShowNotifications(false)} 
        />
        <AIAnalystPanel 
          isOpen={showAIAnalyst}
          onClose={() => setShowAIAnalyst(false)}
        />
        {showObservability && (
          <div className="fixed inset-0 z-[10000]">
             <ObservabilityDashboard onBack={() => setShowObservability(false)} />
          </div>
        )}
      </AnimatePresence>

      {/* Global Toast */}
      <NotificationToast />
      
      {/* Visual Debugger */}
      <AnimatePresence>
        {showDebug && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
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
};

class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: any}> {
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
        <div style={{color: 'red', padding: '20px', backgroundColor: '#fff', height: '100vh'}}>
          <h2>Runtime Error</h2>
          <pre>{this.state.error?.toString()}</pre>
          <pre>{this.state.error?.stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

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
                      <AppContent />
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
  return (
    <RSSProvider rriState={rriState}>
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
