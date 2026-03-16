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
  Vote
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
import { Cases } from './components/Cases';
import { Suspects } from './components/Suspects';
import { Predict } from './components/Predict';
import { Timeline } from './components/Timeline';
import { generateAnalystResponse } from './services/geminiService';

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
          className="fixed top-0 right-0 bottom-16 w-[400px] bg-intel-card border-l border-intel-border z-[60] flex flex-col shadow-2xl"
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
    <div className="glass p-5 rounded-2xl border border-intel-border hover:border-intel-cyan/40 transition-all group cursor-pointer">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="text-[8px] font-mono text-slate-500 uppercase mb-0.5">{gov.id}</div>
          <h4 className="text-lg font-bold text-white tracking-tight">{gov.name.en}</h4>
          <div className="text-[10px] font-mono text-slate-400">{gov.name.ar}</div>
        </div>
        <div className={`px-2 py-1 rounded text-[8px] font-mono font-bold border ${
          gov.risk_level === 'ALERT' ? 'bg-intel-red/10 text-intel-red border-intel-red/20' :
          gov.risk_level === 'HIGH' ? 'bg-intel-orange/10 text-intel-orange border-intel-orange/20' :
          'bg-intel-green/10 text-intel-green border-intel-green/20'
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
const WatchmanStrip = ({ rri, pRev, eventsCount, waterCrisisGovs }: { rri: number, pRev: number, eventsCount: number, waterCrisisGovs: number }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 h-16 bg-intel-card border-t border-intel-border flex items-center px-6 z-50 overflow-x-auto whitespace-nowrap scrollbar-hide">
      <div className="flex items-center space-x-8">
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">RRI Score</span>
          <div className="flex items-center space-x-2">
            <span className={`text-lg font-bold font-mono ${getRiskTier(rri).color}`}>{rri.toFixed(2)}</span>
            <span className="text-[10px] bg-intel-red/10 text-intel-red px-1 rounded border border-intel-red/20">ALERT</span>
          </div>
        </div>
        
        <div className="h-8 w-[1px] bg-intel-border"></div>
        
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">P(Revolution)</span>
          <span className="text-lg font-bold font-mono text-white">{(pRev * 100).toFixed(1)}%</span>
        </div>

        <div className="h-8 w-[1px] bg-intel-border"></div>

        <div className="flex flex-col">
          <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">Live Events</span>
          <span className="text-lg font-bold font-mono text-intel-cyan">{eventsCount}</span>
        </div>

        <div className="h-8 w-[1px] bg-intel-border"></div>

        <div className="flex flex-col">
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
    { id: 'govs', icon: Globe, label: 'Gov. Risk' },
    { id: 'economy', icon: BarChart3, label: 'Economy' },
    { id: 'risk', icon: ShieldAlert, label: 'Risk Model' },
    { id: 'actors', icon: Users, label: 'Actors' },
    { id: 'narratives', icon: MessageSquare, label: 'Narratives' },
    { id: 'energy', icon: Zap, label: 'Energy' },
    { id: 'elections', icon: Vote, label: 'Elections' },
    { id: 'cases', icon: Briefcase, label: 'Cases' },
    { id: 'suspects', icon: UserX, label: 'Suspects' },
    { id: 'predict', icon: TrendingUp, label: 'Predict' },
    { id: 'timeline', icon: Clock, label: 'Timeline' },
  ];

  return (
    <nav className="fixed top-0 left-0 bottom-16 w-20 bg-intel-card border-r border-intel-border flex flex-col items-center py-8 space-y-8 z-40">
      <div className="w-12 h-12 bg-intel-cyan/10 rounded-lg flex items-center justify-center border border-intel-cyan/20 mb-4 cursor-pointer hover:glow-cyan transition-all" onClick={onOpenAI}>
        <Zap className="text-intel-cyan w-6 h-6" />
      </div>
      
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`group relative p-3 rounded-xl transition-all duration-300 ${
            activeTab === tab.id 
              ? 'bg-intel-cyan/10 text-intel-cyan border border-intel-cyan/20' 
              : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
          }`}
        >
          <tab.icon className="w-6 h-6" />
          <span className="absolute left-full ml-4 px-2 py-1 bg-intel-card border border-intel-border text-white text-[10px] uppercase tracking-widest rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
            {tab.label}
          </span>
        </button>
      ))}

      <div className="mt-auto space-y-6">
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

const Header = () => {
  return (
    <header className="fixed top-0 left-20 right-0 h-16 bg-intel-bg/80 backdrop-blur-md border-b border-intel-border flex items-center justify-between px-8 z-30">
      <div className="flex items-center space-x-4">
        <h1 className="text-xl tracking-[0.2em] font-bold">
          TUNISIA<span className="text-intel-cyan">INTEL</span>
        </h1>
        <div className="h-4 w-[1px] bg-intel-border"></div>
        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
          Political Risk Intelligence Platform
        </span>
      </div>

      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-2 bg-intel-card px-3 py-1.5 rounded-full border border-intel-border">
          <div className="w-1.5 h-1.5 rounded-full bg-intel-green"></div>
          <span className="text-[10px] font-mono text-intel-green uppercase tracking-tighter">System Nominal</span>
        </div>
        <div className="flex items-center space-x-3">
          <div className="text-right">
            <div className="text-[10px] font-mono text-white leading-none">SAMIR DNI</div>
            <div className="text-[8px] font-mono text-slate-500 leading-none mt-1 uppercase">Senior Analyst</div>
          </div>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-intel-cyan to-intel-purple p-[1px]">
            <div className="w-full h-full rounded-full bg-intel-bg flex items-center justify-center overflow-hidden">
              <Users className="w-4 h-4 text-slate-400" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default function App() {
  const [activeTab, setActiveTab] = useState('map');
  const [rri, setRri] = useState(2.31);
  const [pRev, setPRev] = useState(0.643);
  const [isAIAnalystOpen, setIsAIAnalystOpen] = useState(false);
  const [rriVariables, setRRIVariables] = useState<RRIVariable[]>(rriData.variables as RRIVariable[]);

  useEffect(() => {
    const calculatedRri = calculateRRI(rriVariables);
    setRri(calculatedRri);
    setPRev(calculatePRev(calculatedRri));
  }, [rriVariables]);

  const governorates = governoratesData.governorates as Governorate[];
  const events = eventsData.events as IntelEvent[];
  const waterCrisisGovs = governorates.filter(g => g.water_cut_hours > 10).length;

  const renderContent = () => {
    switch (activeTab) {
      case 'map':
        return (
          <div className="h-[calc(100vh-12rem)] flex flex-col space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl tracking-tight">Intelligence Map</h2>
                <p className="text-slate-500 text-sm mt-1">Real-time geospatial visualization of political and security incidents</p>
              </div>
              <div className="flex items-center space-x-4">
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
      case 'govs':
        return (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl tracking-tight">Governorate Risk Matrix</h2>
                <p className="text-slate-500 text-sm mt-1">Sub-national stability indicators and tension monitoring</p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input 
                    type="text" 
                    placeholder="Search governorate..." 
                    className="bg-intel-card border border-intel-border rounded-xl pl-10 pr-4 py-2 text-xs text-white focus:outline-none focus:border-intel-cyan/50 transition-colors"
                  />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {governorates.map(gov => (
                <GovernorateCard key={gov.id} gov={gov} />
              ))}
            </div>
          </div>
        );
      case 'risk':
        return <RiskModel variables={rriVariables} onUpdate={setRRIVariables} />;
      case 'economy':
        return <Economy />;
      case 'actors':
        return <Actors />;
      case 'narratives':
        return <Narratives />;
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
      default:
        return <div className="text-white">Module Under Construction</div>;
    }
  };

  return (
    <div className="min-h-screen bg-intel-bg text-slate-300 selection:bg-intel-cyan/30">
      <Header />
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} onOpenAI={() => setIsAIAnalystOpen(true)} />
      
      <AIAnalyst 
        isOpen={isAIAnalystOpen} 
        onClose={() => setIsAIAnalystOpen(false)} 
        context={{
          rri,
          pRev,
          events,
          governorates
        }}
      />
      <main className="pl-20 pt-16 pb-16 min-h-screen">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="p-8"
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>

      <WatchmanStrip 
        rri={rri} 
        pRev={pRev} 
        eventsCount={events.length} 
        waterCrisisGovs={waterCrisisGovs} 
      />
    </div>
  );
}
