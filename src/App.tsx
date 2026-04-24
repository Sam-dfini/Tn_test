import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './lib/supabase';
import { motion, AnimatePresence } from 'motion/react';
import { ModeSelection } from './components/ModeSelection';
import { TunisiaTerminal } from './components/TunisiaTerminal';
import { Authentication } from './components/Authentication';
import { CitizenEdition } from './components/CitizenEdition';
import { ProfessionalIntel } from './components/ProfessionalIntel';
import { TacticalDashboard } from './components/tactical/TacticalDashboard';
import { PalantirDashboard } from './components/PalantirDashboard';
import { BloombergTerminal } from './components/BloombergTerminal';
import { BusinessInvestigator } from './components/BusinessInvestigator';
import { DataPipeline } from './components/DataPipeline';
import { ObservabilityDashboard } from './pages/ObservabilityDashboard';
import { RRIMethodology } from './components/RRIMethodology';
import { IntelligenceDossierExporterModal } from './components/IntelligenceDossierExporterModal';
import { Onboarding } from './components/Onboarding';
import { NotificationProvider } from './context/NotificationContext';
import { PipelineProvider, usePipeline } from './context/PipelineContext';
import { RSSProvider, useRSS } from './context/RSSContext';
import { AIProvider_ } from './context/AIContext';
import { ObservabilityProvider } from './context/ObservabilityContext';
import { NotificationToast } from './components/NotificationToast';
import { NotificationPanel } from './components/NotificationPanel';

import { TacticalLoading } from './components/TacticalLoading';
import { AIAnalystPanel } from './components/AIAnalystPanel';

import { TestMode } from './components/TestMode';

import TunisiaAgricultureDashboard from './components/agriculture_dashboard';

import TunisiaAgricultureDashboard from './components/agriculture_dashboard';

// Data imports
import govData from './data/governorates.json';
import eventData from './data/events.json';

import { initializeVariables } from './services/pipelineService';
import { useEventsStore } from './store/useEventsStore';
import { seedInitialEvents } from './lib/ingestionEngine';

import PipelineDebugger from './components/PipelineDebugger';

const AppContent: React.FC = () => {
  const [mode, setMode] = useState<'selection' | 'simplified' | 'advanced' | 'professional' | 'palantir' | 'bloomberg' | 'business_investigator' | 'test' | 'terminal' | 'agriculture'>(() => {
    const saved = localStorage.getItem('ti_app_mode');
    return (saved as any) || 'selection';
  });

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [pendingMode, setPendingMode] = useState<'selection' | 'simplified' | 'advanced' | 'professional' | 'palantir' | 'bloomberg' | 'business_investigator' | 'test' | 'terminal' | 'agriculture' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showAIAnalyst, setShowAIAnalyst] = useState(false);
  const [showPipeline, setShowPipeline] = useState(false);
  const [showMethodology, setShowMethodology] = useState(false);
  const [methodologyEquation, setMethodologyEquation] = useState<string | undefined>();
  const [pipelineTab, setPipelineTab] = useState<'pipeline' | 'sources' | 'finance' | 'ai-api'>('pipeline');
  const [showReport, setShowReport] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(() => !localStorage.getItem('ti_onboarding_done'));
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
      setIsAuthenticated(!!session || !!localStorage.getItem('ti_authenticated'));
      setIsLoadingAuth(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        localStorage.removeItem('ti_authenticated');
      }
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, [rriState, pipelineData, ingestData]);

  const handleAuthenticate = () => {
    setIsAuthenticated(true);
  };

  const handleModeSelect = (selected: 'selection' | 'simplified' | 'advanced' | 'professional' | 'palantir' | 'bloomberg' | 'business_investigator' | 'test' | 'terminal' | 'agriculture') => {
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
        );
      case 'professional':
        return (
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
        );
      case 'advanced':
        return (
          <TacticalDashboard 
            governorates={govData.governorates as any}
            events={liveEvents.length > 0 ? liveEvents : (eventData.events as any)}
            onOpenAI={() => setShowAIAnalyst(true)} 
            onOpenPipeline={handleOpenPipeline}
            onGoHome={() => handleModeSelect('selection')}
            onOpenReport={() => setShowReport(true)}
            data={pipelineData}
          />
        );
      case 'palantir':
        return (
          <PalantirDashboard 
            onOpenAI={() => setShowAIAnalyst(true)} 
            onOpenPipeline={handleOpenPipeline}
            onGoHome={() => handleModeSelect('selection')}
            onOpenReport={() => setShowReport(true)}
            context={{
              governorates: govData.governorates,
              events: eventData.events
            }}
          />
        );
      case 'bloomberg':
        return (
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
        );
      case 'business_investigator':
        return (
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
        );
      case 'test':
        return (
          <TestMode 
            onGoHome={() => handleModeSelect('selection')}
          />
        );
      case 'terminal':
        return (
          <motion.div
            key="terminal-app"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="h-full w-full"
          >
            <TunisiaTerminal
              onGoHome={() => handleModeSelect('selection')}
              governorates={govData.governorates as any}
            />
          </motion.div>
        );
      case 'agriculture':
        return (
          <TunisiaAgricultureDashboard />
        );
      case 'agriculture':
        return (
          <TunisiaAgricultureDashboard />
        );
      default:
        return <ModeSelection onSelect={handleModeSelect} onLogoff={() => { supabase.auth.signOut(); setIsAuthenticated(false); localStorage.removeItem('ti_authenticated'); setMode('selection'); }} />;
    }
  };

  return (
    <div className="min-h-screen bg-intel-bg text-slate-300 selection:bg-intel-cyan/30 selection:text-white">
      {renderMode()}

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
        {showOnboarding && (
          <Onboarding onComplete={() => {
            setShowOnboarding(false);
            localStorage.setItem('ti_onboarding_done', 'true');
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
              className="relative z-10 w-full max-w-[1400px] h-full max-h-[85vh]"
            >
              <PipelineDebugger onClose={() => setShowDebug(false)} />
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
          <PipelineProvider>
            <NotificationProviderWrapper>
              <RSSProviderWrapper>
                <AppContent />
              </RSSProviderWrapper>
            </NotificationProviderWrapper>
          </PipelineProvider>
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
