import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, 
  TrendingUp, 
  ShieldCheck, 
  Globe, 
  ChevronRight, 
  Download, 
  Lock,
  ArrowUpRight,
  Users,
  X,
  Search,
  LayoutDashboard,
  Zap,
  Sprout,
  BrainCircuit,
  Clock,
  ChevronDown,
  ChevronUp,
  Cpu
} from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, YAxis, XAxis, Tooltip } from 'recharts';
import { EconomyIntelligence } from './EconomyIntelligence';
import { EnergyIntelligence } from './EnergyIntelligence';
import { EnvironmentalIntelligence } from './EnvironmentalIntelligence';
import { SocialIntelligence } from './SocialIntelligence';
import { SecurityIntelligence } from './SecurityIntelligence';
import { StrategicModeling } from './StrategicModeling';
import { GeopoliticalIntelligence } from './GeopoliticalIntelligence';
import { PoliticalIntelligence } from './PoliticalIntelligence';
import SimulationIntelligence from './SimulationIntelligence';
import { NewsFeed } from './NewsFeed';

const reports = [
  {
    id: 'REP-001',
    title: 'Strategic Stability Outlook: Q2 2026',
    category: 'Geopolitical',
    date: 'MAR 15, 2026',
    author: 'Dr. Elias Vance',
    readTime: '12 min',
    image: 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'REP-002',
    title: 'Tunisian Energy Transition: Risks & Opportunities',
    category: 'Economic',
    date: 'MAR 12, 2026',
    author: 'Sarah Al-Fassi',
    readTime: '8 min',
    image: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'REP-003',
    title: 'Maritime Security in the Gulf of Gabes',
    category: 'Security',
    date: 'MAR 10, 2026',
    author: 'Cmdr. Marc Rossi',
    readTime: '15 min',
    image: 'https://images.unsplash.com/photo-1520437358207-323b43b50729?auto=format&fit=crop&q=80&w=800'
  }
];

export const ProfessionalIntel: React.FC<{ context?: any }> = ({ context }) => {
  const [selectedReport, setSelectedReport] = useState<typeof reports[0] | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'economy' | 'energy' | 'environment' | 'social' | 'security' | 'strategic' | 'geopolitical' | 'political' | 'simulation'>('overview');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (item: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(item)) newExpanded.delete(item);
    else newExpanded.add(item);
    setExpandedRows(newExpanded);
  };

  const stabilityRisk = useMemo(() => {
    if (!context?.pRev) return 65;
    const avg = Object.values(context.pRev).reduce((a: any, b: any) => a + b, 0) as number / Object.keys(context.pRev).length;
    return Math.min(100, Math.max(0, 100 - avg));
  }, [context]);

  const economicResilience = useMemo(() => {
    if (!context?.governorates) return 45;
    const avgUnemployment = context.governorates.reduce((a: any, b: any) => a + b.unemployment, 0) / context.governorates.length;
    return Math.min(100, Math.max(0, 100 - (avgUnemployment * 2))); // Scale for visualization
  }, [context]);

  const socialCohesion = useMemo(() => {
    if (!context?.events) return 85;
    const tensionEvents = context.events.filter((e: any) => e.type === 'protest' || e.type === 'strike').length;
    return Math.min(100, Math.max(0, 100 - (tensionEvents * 5)));
  }, [context]);

  const handleDownloadDossier = () => {
    if (!selectedReport) return;
    const content = `TUNISIAINTEL STRATEGIC DOSSIER\nReference: ${selectedReport.id}\nTitle: ${selectedReport.title}\nCategory: ${selectedReport.category}\nDate: ${selectedReport.date}\nAuthor: ${selectedReport.author}\n\n[CLASSIFIED INFORMATION SUMMARY]\nThis report provides a deep-dive analysis into ${selectedReport.category.toLowerCase()} dynamics affecting Tunisian national security and economic stability. Full data sets are available via the secure terminal.`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedReport.id}_Dossier.txt`;
    a.click();
  };

  const handleDownloadOutlook = () => {
    const content = `TUNISIAINTEL STRATEGIC OUTLOOK\nGenerated: ${new Date().toLocaleString()}\n\nRegional Stability: ${stabilityRisk.toFixed(1)}% (Risk Level: ${stabilityRisk > 70 ? 'CRITICAL' : stabilityRisk > 40 ? 'MODERATE' : 'LOW'})\nEconomic Resilience: ${economicResilience.toFixed(1)}%\nSocial Cohesion: ${socialCohesion.toFixed(1)}%\n\nAnalysis: Current indicators suggest a period of heightened volatility in the southern sectors, primarily driven by resource scarcity and localized economic grievances.`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Strategic_Outlook_${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
  };

  return (
    <div className="space-y-12 pb-20">
      {/* Sub-navigation */}
      <div className="flex items-center border-b border-intel-border overflow-x-auto scrollbar-hide gap-0 pb-0">
        <button 
          onClick={() => setActiveTab('overview')}
          className={`flex-shrink-0 px-4 pb-4 text-[10px] md:text-xs font-mono uppercase tracking-widest transition-all relative ${activeTab === 'overview' ? 'text-intel-cyan' : 'text-slate-500 hover:text-slate-300'}`}
        >
          <div className="flex items-center space-x-2">
            <LayoutDashboard className="w-4 h-4" />
            <span>Overview</span>
          </div>
          {activeTab === 'overview' && (
            <motion.div layoutId="intel-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-intel-cyan" />
          )}
        </button>
        <button 
          onClick={() => setActiveTab('economy')}
          className={`flex-shrink-0 px-4 pb-4 text-[10px] md:text-xs font-mono uppercase tracking-widest transition-all relative ${activeTab === 'economy' ? 'text-intel-cyan' : 'text-slate-500 hover:text-slate-300'}`}
        >
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-4 h-4" />
            <span>Economy</span>
          </div>
          {activeTab === 'economy' && (
            <motion.div layoutId="intel-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-intel-cyan" />
          )}
        </button>
        <button 
          onClick={() => setActiveTab('geopolitical')}
          className={`flex-shrink-0 px-4 pb-4 text-[10px] md:text-xs font-mono uppercase tracking-widest transition-all relative ${activeTab === 'geopolitical' ? 'text-intel-cyan' : 'text-slate-500 hover:text-slate-300'}`}
        >
          <div className="flex items-center space-x-2">
            <Globe className="w-4 h-4" />
            <span>Geopolitical</span>
          </div>
          {activeTab === 'geopolitical' && (
            <motion.div layoutId="intel-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-intel-cyan" />
          )}
        </button>
        <button 
          onClick={() => setActiveTab('political')}
          className={`flex-shrink-0 px-4 pb-4 text-[10px] md:text-xs font-mono uppercase tracking-widest transition-all relative ${activeTab === 'political' ? 'text-intel-cyan' : 'text-slate-500 hover:text-slate-300'}`}
        >
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4" />
            <span>Political</span>
          </div>
          {activeTab === 'political' && (
            <motion.div layoutId="intel-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-intel-cyan" />
          )}
        </button>
        <button 
          onClick={() => setActiveTab('security')}
          className={`flex-shrink-0 px-4 pb-4 text-[10px] md:text-xs font-mono uppercase tracking-widest transition-all relative ${activeTab === 'security' ? 'text-intel-cyan' : 'text-slate-500 hover:text-slate-300'}`}
        >
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4" />
            <span>Security</span>
          </div>
          {activeTab === 'security' && (
            <motion.div layoutId="intel-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-intel-cyan" />
          )}
        </button>
        <button 
          onClick={() => setActiveTab('energy')}
          className={`flex-shrink-0 px-4 pb-4 text-[10px] md:text-xs font-mono uppercase tracking-widest transition-all relative ${activeTab === 'energy' ? 'text-intel-cyan' : 'text-slate-500 hover:text-slate-300'}`}
        >
          <div className="flex items-center space-x-2">
            <Zap className="w-4 h-4" />
            <span>Energy</span>
          </div>
          {activeTab === 'energy' && (
            <motion.div layoutId="intel-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-intel-cyan" />
          )}
        </button>
        <button 
          onClick={() => setActiveTab('environment')}
          className={`flex-shrink-0 px-4 pb-4 text-[10px] md:text-xs font-mono uppercase tracking-widest transition-all relative ${activeTab === 'environment' ? 'text-intel-cyan' : 'text-slate-500 hover:text-slate-300'}`}
        >
          <div className="flex items-center space-x-2">
            <Sprout className="w-4 h-4" />
            <span>Environment</span>
          </div>
          {activeTab === 'environment' && (
            <motion.div layoutId="intel-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-intel-cyan" />
          )}
        </button>
        <button 
          onClick={() => setActiveTab('social')}
          className={`flex-shrink-0 px-4 pb-4 text-[10px] md:text-xs font-mono uppercase tracking-widest transition-all relative ${activeTab === 'social' ? 'text-intel-cyan' : 'text-slate-500 hover:text-slate-300'}`}
        >
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4" />
            <span>Social</span>
          </div>
          {activeTab === 'social' && (
            <motion.div layoutId="intel-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-intel-cyan" />
          )}
        </button>
        <button 
          onClick={() => setActiveTab('strategic')}
          className={`flex-shrink-0 px-4 pb-4 text-[10px] md:text-xs font-mono uppercase tracking-widest transition-all relative ${activeTab === 'strategic' ? 'text-intel-cyan' : 'text-slate-500 hover:text-slate-300'}`}
        >
          <div className="flex items-center space-x-2">
            <BrainCircuit className="w-4 h-4" />
            <span>Strategic</span>
          </div>
          {activeTab === 'strategic' && (
            <motion.div layoutId="intel-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-intel-cyan" />
          )}
        </button>
        <button 
          onClick={() => setActiveTab('simulation')}
          className={`flex-shrink-0 px-4 pb-4 text-[10px] md:text-xs font-mono uppercase tracking-widest transition-all relative ${activeTab === 'simulation' ? 'text-intel-cyan' : 'text-slate-500 hover:text-slate-300'}`}
        >
          <div className="flex items-center space-x-2">
            <Cpu className="w-4 h-4" />
            <span>Simulation</span>
          </div>
          {activeTab === 'simulation' && (
            <motion.div layoutId="intel-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-intel-cyan" />
          )}
        </button>
      </div>

      {activeTab === 'overview' ? (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {/* Hero Section */}
      <section className="relative h-[500px] rounded-3xl overflow-hidden group">
        <img 
          src="https://images.unsplash.com/photo-1541746972996-4e0b0f43e02a?auto=format&fit=crop&q=80&w=1920" 
          alt="Tunis Skyline" 
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-intel-bg via-intel-bg/40 to-transparent"></div>
        
        <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12 space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center space-x-3"
          >
            <span className="px-3 py-1 bg-intel-cyan text-intel-bg text-[10px] font-mono font-bold uppercase tracking-widest rounded">Featured Analysis</span>
            <span className="text-white/60 text-[10px] font-mono uppercase">15 MAR 2026</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-bold text-white max-w-4xl leading-tight tracking-tight"
          >
            The Gafsa Corridor: Navigating the Intersection of Mining and Social Stability
          </motion.h1>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center space-x-6 pt-4"
          >
            <button className="bg-white text-intel-bg px-8 py-3 rounded-full font-bold text-sm hover:bg-intel-cyan transition-colors flex items-center space-x-2">
              <span>Read Full Report</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
            <div className="flex items-center space-x-2 text-white/60 text-sm">
              <Users className="w-4 h-4" />
              <span>By Strategic Research Team</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left: Latest Reports */}
        <div className="lg:col-span-8 space-y-8">
          <div className="flex items-center justify-between border-b border-intel-border pb-4">
            <h2 className="text-2xl font-bold text-white tracking-tight">Intelligence Dossiers</h2>
            <button className="text-intel-cyan text-sm font-mono uppercase flex items-center space-x-2 hover:underline">
              <span>View All Reports</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reports.map((report, i) => (
              <motion.div 
                key={report.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                onClick={() => setSelectedReport(report)}
                className="group bg-intel-card border border-intel-border rounded-2xl overflow-hidden cursor-pointer hover:border-intel-cyan/40 transition-all flex flex-col"
              >
                <div className="h-48 overflow-hidden relative">
                  <img 
                    src={report.image} 
                    alt={report.title} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-3 left-3 px-2 py-1 bg-black/60 backdrop-blur-md rounded text-[8px] font-mono text-white uppercase">
                    {report.category}
                  </div>
                </div>
                <div className="p-5 flex-1 flex flex-col space-y-3">
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 uppercase">
                    <span>{report.id}</span>
                    <span>{report.date}</span>
                  </div>
                  <h3 className="text-lg font-bold text-white group-hover:text-intel-cyan transition-colors leading-tight line-clamp-2">
                    {report.title}
                  </h3>
                  <div className="pt-2 mt-auto flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 rounded-full bg-intel-cyan/10 flex items-center justify-center border border-intel-cyan/20">
                        <Users className="w-3 h-3 text-intel-cyan" />
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium">{report.author}</span>
                    </div>
                    <div className="flex items-center space-x-1 text-[9px] font-mono text-slate-600 uppercase">
                      <Clock className="w-3 h-3" />
                      <span>{report.readTime}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Real-time News Feed */}
          <NewsFeed />
        </div>

        {/* Report Detail Modal */}
        <AnimatePresence>
          {selectedReport && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-intel-card border border-intel-border rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl relative"
              >
                <button 
                  onClick={() => setSelectedReport(null)}
                  className="absolute top-6 right-6 z-20 p-2 bg-black/40 hover:bg-black/60 rounded-full transition-colors text-white"
                >
                  <X className="w-6 h-6" />
                </button>

                <div className="overflow-y-auto h-full scrollbar-hide">
                  <div className="h-64 md:h-80 relative">
                    <img 
                      src={selectedReport.image} 
                      alt={selectedReport.title} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-intel-card via-transparent to-transparent"></div>
                  </div>

                  <div className="p-8 md:p-12 space-y-8">
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <span className="px-3 py-1 bg-intel-cyan/20 text-intel-cyan text-[10px] font-mono font-bold uppercase tracking-widest rounded border border-intel-cyan/30">
                          {selectedReport.category}
                        </span>
                        <span className="text-slate-500 text-[10px] font-mono uppercase">{selectedReport.date}</span>
                      </div>
                      <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight leading-tight">
                        {selectedReport.title}
                      </h2>
                      <div className="flex items-center space-x-6 py-4 border-y border-intel-border">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-intel-cyan to-intel-purple p-[1px]">
                            <div className="w-full h-full rounded-full bg-intel-bg flex items-center justify-center">
                              <Users className="w-5 h-5 text-slate-400" />
                            </div>
                          </div>
                          <div>
                            <div className="text-xs font-bold text-white">{selectedReport.author}</div>
                            <div className="text-[10px] text-slate-500 uppercase">Senior Intelligence Analyst</div>
                          </div>
                        </div>
                        <div className="h-8 w-[1px] bg-intel-border"></div>
                        <div className="flex items-center space-x-2 text-[10px] font-mono text-slate-500 uppercase">
                          <Clock className="w-4 h-4" />
                          <span>{selectedReport.readTime} Read Time</span>
                        </div>
                        <div className="flex items-center space-x-2 text-[10px] font-mono text-slate-500 uppercase">
                          <Lock className="w-4 h-4" />
                          <span>Classified: Level 4</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6 text-slate-400 leading-relaxed">
                      <p className="text-lg text-white/90 font-medium">
                        Executive Summary: This report provides a high-fidelity analysis of emerging trends within the {selectedReport.category.toLowerCase()} sector, focusing on the period of Q2 2026.
                      </p>
                      <p>
                        Our strategic research team has identified several key inflection points that are likely to define the regional landscape over the next six months. Through a combination of geospatial intelligence, economic modeling, and on-the-ground human intelligence, we have synthesized a comprehensive outlook for stakeholders.
                      </p>
                      <div className="p-6 bg-white/5 rounded-2xl border border-intel-border space-y-4">
                        <h4 className="text-sm font-bold text-white uppercase tracking-widest flex items-center space-x-2">
                          <ShieldCheck className="w-4 h-4 text-intel-cyan" />
                          <span>Key Findings</span>
                        </h4>
                        <ul className="space-y-2 text-xs">
                          <li className="flex items-start space-x-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-intel-cyan mt-1"></div>
                            <span>Increased volatility in regional trade corridors due to shifting maritime security protocols.</span>
                          </li>
                          <li className="flex items-start space-x-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-intel-cyan mt-1"></div>
                            <span>Emergence of new social narratives centered around resource equity and digital sovereignty.</span>
                          </li>
                          <li className="flex items-start space-x-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-intel-cyan mt-1"></div>
                            <span>Acceleration of energy transition initiatives in the southern governorates.</span>
                          </li>
                        </ul>
                      </div>
                    </div>

                    <div className="pt-8 flex items-center justify-between">
                      <button 
                        onClick={handleDownloadDossier}
                        className="px-8 py-3 bg-intel-cyan text-intel-bg rounded-full font-bold text-sm hover:bg-white transition-colors flex items-center space-x-2"
                      >
                        <Download className="w-4 h-4" />
                        <span>Download Full Dossier</span>
                      </button>
                      <div className="text-[10px] font-mono text-slate-600 uppercase">
                        Reference ID: {selectedReport.id}-SEC-2026
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Right: Sidebar Info */}
        <div className="lg:col-span-4 space-y-8">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search Intelligence Database..." 
              className="w-full bg-intel-card border border-intel-border rounded-full pl-12 pr-4 py-3 text-sm text-white focus:outline-none focus:border-intel-cyan transition-all"
            />
          </div>

          {/* Strategic Outlook */}
          <div className="glass p-8 rounded-3xl border border-intel-border space-y-6">
            <div className="flex items-center space-x-3 border-b border-intel-border pb-4">
              <ShieldCheck className="w-5 h-5 text-intel-cyan" />
              <h3 className="text-lg font-bold text-white uppercase tracking-tight">Strategic Outlook</h3>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-mono uppercase">
                  <span className="text-slate-500">Regional Stability</span>
                  <span className={stabilityRisk > 70 ? 'text-intel-red' : stabilityRisk > 40 ? 'text-intel-orange' : 'text-intel-green'}>
                    {stabilityRisk > 70 ? 'Critical Risk' : stabilityRisk > 40 ? 'Moderate Risk' : 'Low Risk'}
                  </span>
                </div>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${stabilityRisk}%` }}
                    className={`h-full ${stabilityRisk > 70 ? 'bg-intel-red' : stabilityRisk > 40 ? 'bg-intel-orange' : 'bg-intel-green'}`}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-mono uppercase">
                  <span className="text-slate-500">Economic Resilience</span>
                  <span className={economicResilience < 40 ? 'text-intel-red' : economicResilience < 70 ? 'text-intel-orange' : 'text-intel-cyan'}>
                    {economicResilience < 40 ? 'Fragile' : economicResilience < 70 ? 'Stable' : 'Robust'}
                  </span>
                </div>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${economicResilience}%` }}
                    className={`h-full ${economicResilience < 40 ? 'bg-intel-red' : economicResilience < 70 ? 'bg-intel-orange' : 'bg-intel-cyan'}`}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-mono uppercase">
                  <span className="text-slate-500">Social Cohesion</span>
                  <span className={socialCohesion < 40 ? 'text-intel-red' : socialCohesion < 70 ? 'text-intel-orange' : 'text-intel-green'}>
                    {socialCohesion < 40 ? 'High Tension' : socialCohesion < 70 ? 'Strained' : 'Stable'}
                  </span>
                </div>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${socialCohesion}%` }}
                    className={`h-full ${socialCohesion < 40 ? 'bg-intel-red' : socialCohesion < 70 ? 'bg-intel-orange' : 'bg-intel-green'}`}
                  />
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed italic">
              "Current indicators suggest a period of heightened volatility in the southern sectors, primarily driven by resource scarcity and localized economic grievances."
            </p>

            <button 
              onClick={handleDownloadOutlook}
              className="w-full py-3 border border-intel-cyan/30 text-intel-cyan text-xs font-mono uppercase font-bold hover:bg-intel-cyan/10 transition-all rounded-xl"
            >
              Download Full Outlook (PDF)
            </button>
          </div>

          {/* Global Signals */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-mono text-slate-500 uppercase tracking-[0.2em] px-2">Global Signals</h4>
            <div className="space-y-2">
              {[
                'EU-Tunisia Migration Pact Review',
                'IMF Mission to Tunis: Update',
                'Maghreb Regional Security Summit',
                'Mediterranean Energy Corridor Talks'
              ].map((signal, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-white/5 border border-intel-border rounded-xl hover:border-intel-cyan/30 transition-all group cursor-pointer">
                  <span className="text-xs text-slate-300 group-hover:text-white transition-colors">{signal}</span>
                  <Globe className="w-3 h-3 text-slate-600 group-hover:text-intel-cyan" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      </div>
      ) : activeTab === 'economy' ? (
        <EconomyIntelligence />
      ) : activeTab === 'geopolitical' ? (
        <GeopoliticalIntelligence />
      ) : activeTab === 'political' ? (
        <PoliticalIntelligence context={context} />
      ) : activeTab === 'security' ? (
        <SecurityIntelligence />
      ) : activeTab === 'energy' ? (
        <EnergyIntelligence />
      ) : activeTab === 'environment' ? (
        <EnvironmentalIntelligence />
      ) : activeTab === 'social' ? (
        <SocialIntelligence />
      ) : activeTab === 'strategic' ? (
        <StrategicModeling />
      ) : (
        <SimulationIntelligence context={context} variables={context?.variables || []} />
      )}
    </div>
  );
};
