import React, { useState, useEffect } from 'react';
import { 
  Map as MapIcon, 
  BarChart3, 
  Users, 
  FileText, 
  ShieldAlert, 
  Activity, 
  Globe, 
  Zap, 
  Video,
  Search, 
  Bell,
  Menu,
  X,
  ChevronUp,
  ChevronDown,
  AlertTriangle,
  Info,
  MessageSquare,
  Briefcase,
  UserX,
  TrendingUp,
  Clock,
  Vote,
  Database,
  Download,
  Home
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import governoratesData from './data/governorates.json';
import eventsData from './data/events.json';
import rriData from './data/rri_variables.json';
import { calculateRRI, getRiskTier, calculatePRev } from './utils/rriEngine';
import { Governorate, IntelEvent, RRIVariable } from './types/intel';
import { Map } from './components/Map';
import { RiskModel } from './components/RiskModel';
import { Economy } from './components/Economy';
import { Actors } from './components/Actors';
import { Narratives } from './components/Narratives';
import { Energy } from './components/Energy';
import { Elections } from './components/Elections';
import { Media } from './components/Media';
import { Cases } from './components/Cases';
import { Suspects } from './components/Suspects';
import { Predict } from './components/Predict';
import { Timeline } from './components/Timeline';
import { TacticalLoading } from './components/TacticalLoading';
import { ModeSelection } from './components/ModeSelection';
import { TacticalDashboard } from './components/tactical/TacticalDashboard';
import { ProfessionalIntel } from './components/ProfessionalIntel';
import { SourceLibrary } from './components/SourceLibrary';
import { CitizenEdition } from './components/CitizenEdition';
import { generateAnalystResponse } from './services/geminiService';

import actorData from './data/actors.json';

import { Onboarding } from './components/Onboarding';

// Components
const AIAnalyst = ({ isOpen, onClose, context }: { isOpen: boolean, onClose: () => void, context: any }) => {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'ai', text: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!query.trim() || isLoading) return;
    
    const userMsg = query;
    setQuery('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
      const response = await generateAnalystResponse(userMsg, context);
      setMessages(prev => [...prev, { role: 'ai', text: response || 'No response generated.' }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'ai', text: 'Error connecting to intelligence engine.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0, x: 400 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 400 }}
          className="fixed top-0 right-0 bottom-16 w-full sm:w-[400px] bg-intel-card border-l border-intel-border z-[60] flex flex-col shadow-2xl"
        >
          <div className="p-6 border-b border-intel-border flex items-center justify-between bg-intel-bg/50">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-intel-cyan/10 flex items-center justify-center border border-intel-cyan/20">
                <Zap className="text-intel-cyan w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-widest">AI Analyst</h3>
                <div className="text-[8px] font-mono text-intel-green uppercase">Grounded in Platform Data</div>
              </div>
            </div>
            <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
            {messages.length === 0 && (
              <div className="text-center py-12">
                <div className="w-12 h-12 bg-intel-border rounded-full flex items-center justify-center mx-auto mb-4 opacity-50">
                  <MessageSquare className="w-6 h-6 text-slate-500" />
                </div>
                <p className="text-xs text-slate-500 px-8">
                  Ask any intelligence question about the current RRI state, recent events, or governorate risk levels.
                </p>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[85%] p-3 rounded-xl text-xs leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-intel-cyan/10 text-intel-cyan border border-intel-cyan/20' 
                    : 'bg-white/5 text-slate-300 border border-intel-border'
                }`}>
                  {msg.text}
                </div>
                <span className="text-[8px] font-mono text-slate-600 mt-1 uppercase">
                  {msg.role === 'user' ? 'Analyst' : 'TUNISIAINTEL AI'}
                </span>
              </div>
            ))}
            {isLoading && (
              <div className="flex items-center space-x-2 text-intel-cyan animate-pulse">
                <div className="w-1 h-1 bg-intel-cyan rounded-full"></div>
                <div className="w-1 h-1 bg-intel-cyan rounded-full"></div>
                <div className="w-1 h-1 bg-intel-cyan rounded-full"></div>
                <span className="text-[8px] font-mono uppercase">Synthesizing...</span>
              </div>
            )}
          </div>

          <div className="p-6 border-t border-intel-border bg-intel-bg/50">
            <div className="relative">
              <input 
                type="text" 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask intelligence query..."
                className="w-full bg-intel-card border border-intel-border rounded-xl px-4 py-3 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-intel-cyan/50 transition-colors pr-12"
              />
              <button 
                onClick={handleSend}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-intel-cyan hover:bg-intel-cyan/10 rounded-lg transition-colors"
              >
                <ChevronUp className="w-4 h-4 rotate-90" />
              </button>
            </div>
            <div className="mt-3 flex items-center justify-center space-x-4">
               <button className="text-[8px] font-mono text-slate-500 hover:text-intel-cyan uppercase">Situation Brief</button>
               <button className="text-[8px] font-mono text-slate-500 hover:text-intel-cyan uppercase">Risk Assessment</button>
               <button className="text-[8px] font-mono text-slate-500 hover:text-intel-cyan uppercase">Actor Dossier</button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
interface GovernorateCardProps {
  gov: Governorate;
}

const GovernorateCard: React.FC<GovernorateCardProps> = ({ gov }) => {
  return (
    <div className="glass p-5 rounded-2xl border border-intel-border hover:border-intel-cyan/40 transition-all group cursor-pointer relative">
      {/* Hover Tooltip */}
      <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-intel-card border border-intel-border p-2 rounded-lg shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 whitespace-nowrap">
        <div className="text-[10px] font-bold text-white mb-1">{gov.name.ar}</div>
        <div className="flex items-center space-x-2">
          <span className="text-[8px] text-slate-500 uppercase">Tension:</span>
          <span className={`text-[8px] font-bold uppercase ${
            gov.tension === 'alert' ? 'text-intel-red' : 
            gov.tension === 'high' ? 'text-intel-orange' : 
            'text-intel-cyan'
          }`}>{gov.tension}</span>
        </div>
      </div>

      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="text-[8px] font-mono text-slate-500 uppercase mb-0.5">{gov.id}</div>
          <h4 className="text-lg font-bold text-white tracking-tight">{gov.name.en}</h4>
          <div className="text-[10px] font-mono text-slate-400">{gov.name.ar}</div>
        </div>
        <div className={`px-2 py-1 rounded text-[8px] font-mono font-bold border shadow-lg ${
          gov.risk_level === 'ALERT' ? 'bg-intel-red text-white border-intel-red shadow-intel-red/20' :
          gov.risk_level === 'HIGH' ? 'bg-gradient-to-br from-intel-orange to-intel-red text-white border-intel-orange shadow-intel-orange/20' :
          'bg-intel-green/20 text-intel-green border-intel-green/30'
        }`}>
          {gov.risk_level}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="space-y-1">
          <div className="text-[8px] font-mono text-slate-500 uppercase">RRI Score</div>
          <div className="text-sm font-bold font-mono text-white">{gov.rri_score.toFixed(2)}</div>
        </div>
        <div className="space-y-1">
          <div className="text-[8px] font-mono text-slate-500 uppercase">Unemployment</div>
          <div className="text-sm font-bold font-mono text-white">{gov.unemp}%</div>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-[8px] mb-1">
            <span className="text-slate-500 uppercase">Tension Level</span>
            <span className="text-intel-cyan uppercase font-mono">{gov.tension}</span>
          </div>
          <div className="h-1 w-full bg-intel-border rounded-full overflow-hidden">
            <div 
              className={`h-full ${gov.tension === 'alert' ? 'bg-intel-red' : gov.tension === 'high' ? 'bg-intel-orange' : 'bg-intel-cyan'}`} 
              style={{ width: `${(gov.rri_score / 3) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-intel-border flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Activity className="w-3 h-3 text-slate-500" />
          <span className="text-[10px] font-mono text-slate-500">{gov.event_count} Events</span>
        </div>
        <ChevronUp className="w-4 h-4 text-slate-600 group-hover:text-intel-cyan transition-colors" />
      </div>
    </div>
  );
};
const WatchmanStrip = ({ rri, pRev, eventsCount, waterCrisisGovs, mode }: { rri: number, pRev: number, eventsCount: number, waterCrisisGovs: number, mode: string | null }) => {
  if (mode === 'professional') return null;
  
  return (
    <div className={`fixed ${mode === 'simplified' ? 'bottom-32 md:bottom-32' : 'bottom-14 md:bottom-0'} left-0 right-0 h-16 bg-intel-card border-t border-intel-border flex items-center px-6 z-50 overflow-x-auto whitespace-nowrap scrollbar-hide`}>
      <div className="flex items-center space-x-4 md:space-x-8">
        <div className="flex flex-col">
          <span className="text-[8px] md:text-[10px] text-slate-500 uppercase tracking-widest font-mono">RRI Score</span>
          <div className="flex items-center space-x-2">
            <span className={`text-sm md:text-lg font-bold font-mono ${getRiskTier(rri).color}`}>{rri.toFixed(2)}</span>
            <span className="text-[8px] bg-intel-red/10 text-intel-red px-1 rounded border border-intel-red/20">ALERT</span>
          </div>
        </div>
        
        <div className="h-8 w-[1px] bg-intel-border"></div>
        
        <div className="flex flex-col">
          <span className="text-[8px] md:text-[10px] text-slate-500 uppercase tracking-widest font-mono">P(Revolution)</span>
          <span className="text-sm md:text-lg font-bold font-mono text-white">{(pRev * 100).toFixed(1)}%</span>
        </div>

        <div className="h-8 w-[1px] bg-intel-border hidden md:block"></div>

        <div className="hidden md:flex flex-col">
          <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">Live Events</span>
          <span className="text-lg font-bold font-mono text-intel-cyan">{eventsCount}</span>
        </div>

        <div className="h-8 w-[1px] bg-intel-border hidden md:block"></div>

        <div className="hidden md:flex flex-col">
          <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">Water Crisis</span>
          <span className="text-lg font-bold font-mono text-intel-orange">{waterCrisisGovs} Govs</span>
        </div>

        <div className="h-8 w-[1px] bg-intel-border"></div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 animate-pulse">
            <div className="w-2 h-2 rounded-full bg-intel-red"></div>
            <span className="text-xs font-mono text-intel-red uppercase tracking-tighter">SFAX: ALERT</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-intel-orange"></div>
            <span className="text-xs font-mono text-intel-orange uppercase tracking-tighter">GAFSA: HIGH</span>
          </div>
        </div>
      </div>
      
      <div className="ml-auto flex items-center space-x-4 text-[10px] font-mono text-slate-500">
        <span>v2.0 · MARCH 2026</span>
        <span className="text-intel-cyan">LIVE SYNC ACTIVE</span>
      </div>
    </div>
  );
};

const Navigation = ({ activeTab, setActiveTab, onOpenAI }: { activeTab: string, setActiveTab: (t: string) => void, onOpenAI: () => void }) => {
  const tabs = [
    { id: 'map', icon: MapIcon, label: 'Map' },
    { id: 'professional', icon: Zap, label: 'Professional Intel' },
    { id: 'govs', icon: Globe, label: 'Gov. Risk' },
    { id: 'economy', icon: BarChart3, label: 'Economy' },
    { id: 'risk', icon: ShieldAlert, label: 'Risk Model' },
    { id: 'actors', icon: Users, label: 'Actors' },
    { id: 'narratives', icon: MessageSquare, label: 'Narratives' },
    { id: 'media', icon: Video, label: 'Media' },
    { id: 'energy', icon: Zap, label: 'Energy' },
    { id: 'elections', icon: Vote, label: 'Elections' },
    { id: 'cases', icon: Briefcase, label: 'Cases' },
    { id: 'suspects', icon: UserX, label: 'Suspects' },
    { id: 'predict', icon: TrendingUp, label: 'Predict' },
    { id: 'timeline', icon: Clock, label: 'Timeline' },
  ];

  return (
    <nav className="fixed bottom-0 md:top-0 left-0 right-0 md:right-auto md:bottom-16 w-full md:w-20 bg-intel-card border-t md:border-t-0 md:border-r border-intel-border flex md:flex-col items-center justify-around md:justify-start py-2 md:py-8 md:space-y-8 z-[60] md:z-40">
      <div className="hidden md:flex w-12 h-12 bg-intel-cyan/10 rounded-lg items-center justify-center border border-intel-cyan/20 mb-4 cursor-pointer hover:glow-cyan transition-all" onClick={onOpenAI}>
        <Zap className="text-intel-cyan w-6 h-6" />
      </div>
      
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`group relative p-2 md:p-3 rounded-xl transition-all duration-300 ${
            activeTab === tab.id 
              ? 'bg-intel-cyan/10 text-intel-cyan border border-intel-cyan/20' 
              : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
          }`}
        >
          <tab.icon className="w-5 h-5 md:w-6 md:h-6" />
          <span className="hidden md:block absolute left-full ml-4 px-2 py-1 bg-intel-card border border-intel-border text-white text-[10px] uppercase tracking-widest rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
            {tab.label}
          </span>
        </button>
      ))}

      <div className="hidden md:flex mt-auto space-y-6 flex-col items-center">
        <button className="text-slate-500 hover:text-intel-cyan transition-colors">
          <Search className="w-5 h-5" />
        </button>
        <button className="text-slate-500 hover:text-intel-red transition-colors relative">
          <Bell className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-intel-red rounded-full border border-intel-bg"></span>
        </button>
      </div>
    </nav>
  );
};

const Header = ({ onOpenSourceLibrary, activeTab, onOpenAI, data, onGoHome }: { onOpenSourceLibrary: () => void, activeTab: string, onOpenAI: () => void, data: any, onGoHome: () => void }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const notifications = [
    { id: 1, title: 'RRI Alert: Sfax', message: 'Risk score increased by 0.45 in the last 24h.', time: '12m ago', type: 'alert' },
    { id: 2, title: 'New Report Available', message: 'Strategic Stability Outlook: Q2 2026 is now live.', time: '1h ago', type: 'info' },
    { id: 3, title: 'System Sync', message: 'Database synchronization completed successfully.', time: '3h ago', type: 'success' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-intel-bg/80 backdrop-blur-md border-b border-intel-border grid grid-cols-3 items-center px-4 md:px-8 z-30">
      {/* Left side secondary info */}
      <div className="hidden md:flex items-center space-x-4">
        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
          Political Risk Intelligence Platform
        </span>
      </div>
      <div className="md:hidden"></div> {/* Mobile spacer */}

      {/* Centered Title */}
      <div className="flex justify-center items-center space-x-4">
        <h1 className="text-sm md:text-xl tracking-[0.2em] font-bold whitespace-nowrap">
          TUNISIA<span className="text-intel-cyan">INTEL</span>
        </h1>
      </div>

      {/* Right side profile */}
      <div className="flex items-center justify-end space-x-3 md:space-x-6">
        <div className="flex items-center space-x-2">
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className={`p-2 rounded-lg border transition-all relative ${
                showNotifications 
                  ? 'bg-intel-red/10 border-intel-red/40 text-intel-red glow-red' 
                  : 'bg-intel-card border-intel-border text-slate-500 hover:text-white hover:border-slate-700'
              }`}
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-intel-red rounded-full border border-intel-bg"></span>
            </button>

            <AnimatePresence>
              {showNotifications && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowNotifications(false)}
                  ></div>
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-80 bg-intel-card border border-intel-border rounded-2xl shadow-2xl z-50 overflow-hidden"
                  >
                    <div className="p-4 border-b border-intel-border flex items-center justify-between bg-white/5">
                      <h3 className="text-xs font-bold text-white uppercase tracking-widest">Intelligence Alerts</h3>
                      <span className="text-[8px] font-mono text-intel-cyan uppercase">3 New</span>
                    </div>
                    <div className="max-h-96 overflow-y-auto scrollbar-hide">
                      {notifications.map((n) => (
                        <div key={n.id} className="p-4 border-b border-intel-border last:border-0 hover:bg-white/5 transition-colors cursor-pointer group">
                          <div className="flex items-start justify-between mb-1">
                            <span className={`text-[10px] font-bold uppercase tracking-tighter ${
                              n.type === 'alert' ? 'text-intel-red' : 
                              n.type === 'success' ? 'text-intel-green' : 'text-intel-cyan'
                            }`}>
                              {n.title}
                            </span>
                            <span className="text-[8px] font-mono text-slate-600 uppercase">{n.time}</span>
                          </div>
                          <p className="text-[10px] text-slate-400 leading-relaxed group-hover:text-slate-300 transition-colors">
                            {n.message}
                          </p>
                        </div>
                      ))}
                    </div>
                    <button className="w-full py-3 text-[9px] font-mono text-slate-500 hover:text-white uppercase tracking-widest bg-white/5 hover:bg-white/10 transition-all">
                      View All Notifications
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          <button 
            onClick={onGoHome}
            className="p-2 rounded-lg border bg-intel-card border-intel-border text-slate-500 hover:text-intel-cyan hover:border-intel-cyan/40 transition-all"
            title="Go to Home Screen"
          >
            <Home className="w-4 h-4" />
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
            className="p-2 rounded-lg border bg-intel-card border-intel-border text-slate-500 hover:text-intel-cyan hover:border-intel-cyan/40 transition-all"
            title="Export Intel Data"
          >
            <Download className="w-4 h-4" />
          </button>
          <button 
            onClick={onOpenAI}
            className="p-2 rounded-lg border bg-intel-card border-intel-border text-slate-500 hover:text-intel-cyan hover:border-intel-cyan/40 transition-all"
          >
            <Zap className="w-4 h-4" />
          </button>
          <button 
            onClick={onOpenSourceLibrary}
            className={`p-2 rounded-lg border transition-all ${
              activeTab === 'sources' 
                ? 'bg-intel-cyan/10 border-intel-cyan/40 text-intel-cyan glow-cyan' 
                : 'bg-intel-card border-intel-border text-slate-500 hover:text-white hover:border-slate-700'
            }`}
          >
            <Database className="w-4 h-4" />
          </button>
          <div className="hidden sm:flex items-center space-x-2 bg-intel-card px-3 py-1.5 rounded-full border border-intel-border">
            <div className="w-1.5 h-1.5 rounded-full bg-intel-green"></div>
            <span className="text-[10px] font-mono text-intel-green uppercase tracking-tighter">System Nominal</span>
          </div>
        </div>
        <div className="flex items-center space-x-2 md:space-x-3">
          <div className="text-right hidden xs:block">
            <div className="text-[9px] md:text-[10px] font-mono text-white leading-none">SAMIR DNI</div>
            <div className="text-[7px] md:text-[8px] font-mono text-slate-500 leading-none mt-1 uppercase">Senior Analyst</div>
          </div>
          <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-gradient-to-br from-intel-cyan to-intel-purple p-[1px]">
            <div className="w-full h-full rounded-full bg-intel-bg flex items-center justify-center overflow-hidden">
              <Users className="w-3 h-3 md:w-4 md:h-4 text-slate-400" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default function App() {
  const [appMode, setAppMode] = useState<'simplified' | 'advanced' | 'professional' | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [activeTab, setActiveTab] = useState('map');
  const [rri, setRri] = useState(2.31);
  const [pRev, setPRev] = useState(0.643);
  const [isAIAnalystOpen, setIsAIAnalystOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [rriVariables, setRRIVariables] = useState<RRIVariable[]>((rriData?.variables || []) as RRIVariable[]);

  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding');
    if (!hasSeenOnboarding) {
      setShowOnboarding(true);
    }
  }, []);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    localStorage.setItem('hasSeenOnboarding', 'true');
  };

  useEffect(() => {
    const calculatedRri = calculateRRI(rriVariables);
    setRri(calculatedRri);
    setPRev(calculatePRev(calculatedRri));
  }, [rriVariables]);

  const governorates = (governoratesData?.governorates || []) as Governorate[];
  const events = (eventsData?.events || []) as IntelEvent[];
  const waterCrisisGovs = governorates.filter(g => g.water_cut_hours > 10).length;

  const renderContent = () => {
    switch (activeTab) {
      case 'map':
        return (
          <div className="h-[calc(100vh-8rem)] flex flex-col space-y-6">
            <div className="flex flex-col items-center text-center space-y-2">
              <h2 className="text-2xl tracking-tight">Intelligence Map</h2>
              <p className="text-slate-500 text-sm">Real-time geospatial visualization of political and security incidents</p>
              <div className="pt-2">
                <div className="flex items-center space-x-2 bg-intel-cyan/10 text-intel-cyan border border-intel-cyan/20 px-4 py-2 rounded-lg">
                  <div className="w-2 h-2 rounded-full bg-intel-cyan animate-pulse"></div>
                  <span className="text-xs font-mono uppercase font-bold">Live Feed Active</span>
                </div>
              </div>
            </div>
            <div className="flex-1">
              <Map governorates={governorates} events={events} activeLayer="Political" />
            </div>
          </div>
        );
      case 'professional':
        return <ProfessionalIntel />;
      case 'govs':
        return (
          <div className="space-y-8">
            <div className="flex flex-col items-center text-center space-y-4">
              <div>
                <h2 className="text-2xl tracking-tight">Governorate Risk Matrix</h2>
                <p className="text-slate-500 text-sm mt-1">Sub-national stability indicators and tension monitoring</p>
              </div>
              <div className="relative w-full max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input 
                  type="text" 
                  placeholder="Search governorate..." 
                  className="w-full bg-intel-card border border-intel-border rounded-xl pl-10 pr-4 py-2 text-xs text-white focus:outline-none focus:border-intel-cyan/50 transition-colors"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {governorates.map(gov => (
                <GovernorateCard key={gov.id} gov={gov} />
              ))}
            </div>
          </div>
        );
      case 'risk':
        return <RiskModel variables={rriVariables} />;
      case 'economy':
        return <Economy />;
      case 'actors':
        return <Actors />;
      case 'narratives':
        return <Narratives />;
      case 'media':
        return <Media />;
      case 'energy':
        return <Energy />;
      case 'elections':
        return <Elections />;
      case 'cases':
        return <Cases />;
      case 'suspects':
        return <Suspects />;
      case 'predict':
        return <Predict />;
      case 'timeline':
        return <Timeline />;
      case 'sources':
        return <SourceLibrary onBack={() => setActiveTab('professional')} />;
      default:
        return <div className="text-white">Module Under Construction</div>;
    }
  };

  const handleModeSelect = (mode: 'simplified' | 'advanced' | 'professional') => {
    setAppMode(mode);
    if (mode === 'professional') {
      setActiveTab('professional');
    }
    setIsInitializing(true);
  };

  return (
    <div className="min-h-screen bg-intel-bg text-slate-300 selection:bg-intel-cyan/30">
      <AnimatePresence mode="wait">
        {showOnboarding && (
          <Onboarding onComplete={handleOnboardingComplete} />
        )}
        {!appMode ? (
          <motion.div key="mode-selection" exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
            <ModeSelection onSelect={handleModeSelect} />
          </motion.div>
        ) : isInitializing ? (
          <motion.div key="loader" exit={{ opacity: 0, scale: 1.1 }} transition={{ duration: 0.5 }}>
            <TacticalLoading mode={appMode} onComplete={() => setIsInitializing(false)} />
          </motion.div>
        ) : appMode === 'advanced' ? (
          <motion.div 
            key="tactical-app" 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            transition={{ duration: 0.8 }}
          >
            <TacticalDashboard 
              governorates={governorates} 
              events={events} 
              onOpenAI={() => setIsAIAnalystOpen(true)} 
              onGoHome={() => setAppMode(null)}
              data={{
                rri,
                pRev,
                events,
                governorates,
                actors: actorData.actors,
                movements: actorData.movements
              }}
            />
            <AIAnalyst 
              isOpen={isAIAnalystOpen} 
              onClose={() => setIsAIAnalystOpen(false)} 
              context={{
                rri,
                pRev,
                events,
                governorates,
                actors: actorData.actors,
                movements: actorData.movements,
                activeTab
              }}
            />
          </motion.div>
        ) : appMode === 'simplified' ? (
          <motion.div 
            key="citizen-app" 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            transition={{ duration: 0.8 }}
            className="min-h-screen bg-intel-bg"
          >
            <CitizenEdition 
              governorates={governorates} 
              events={events} 
              rri={rri} 
              pRev={pRev} 
              onOpenAI={() => setIsAIAnalystOpen(true)}
              onGoHome={() => setAppMode(null)}
              data={{
                rri,
                pRev,
                events,
                governorates,
                actors: actorData.actors,
                movements: actorData.movements
              }}
            />
            <AIAnalyst 
              isOpen={isAIAnalystOpen} 
              onClose={() => setIsAIAnalystOpen(false)} 
              context={{
                rri,
                pRev,
                events,
                governorates,
                actors: actorData.actors,
                movements: actorData.movements,
                activeTab
              }}
            />
          </motion.div>
        ) : (
          <motion.div 
            key="app" 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            transition={{ duration: 0.8 }}
            className="min-h-screen"
          >
            <Header 
              onOpenSourceLibrary={() => setActiveTab('sources')} 
              activeTab={activeTab}
              onOpenAI={() => setIsAIAnalystOpen(true)}
              onGoHome={() => setAppMode(null)}
              data={{
                rri,
                pRev,
                events,
                governorates,
                actors: actorData.actors,
                movements: actorData.movements
              }}
            />
            
            <AIAnalyst 
              isOpen={isAIAnalystOpen} 
              onClose={() => setIsAIAnalystOpen(false)} 
              context={{
                rri,
                pRev,
                events,
                governorates,
                actors: actorData.actors,
                movements: actorData.movements,
                activeTab
              }}
            />
            <main className="pt-16 pb-16 min-h-screen">
              <div className="w-full max-w-7xl px-4 md:px-8 mx-auto">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="py-8"
                  >
                    {renderContent()}
                  </motion.div>
                </AnimatePresence>
              </div>
            </main>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
