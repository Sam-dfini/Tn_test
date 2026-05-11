import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Eye, 
  Compass, 
  TrendingUp,
  Info,
  AlertTriangle,
  ShieldAlert,
  Users,
  Calendar,
  Activity,
  ArrowRight,
  Search,
  Sparkles,
  Loader2,
  Globe
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  ZAxis,
  Cell
} from 'recharts';
import { BackgroundGrid, ModuleHeader } from '../shared/ProfessionalShared';
import { cn } from '../../utils/cn';
import { useRiskMetrics } from '../../hooks/usePipelineDomains';
import { generateAnalystResponse } from '../../services/geminiService';
import Markdown from 'react-markdown';

const appearanceData = [
  { date: 'Jan', count: 12 },
  { date: 'Feb', count: 18 },
  { date: 'Mar', count: 25 },
  { date: 'Apr', count: 22 },
  { date: 'May', count: 30 },
  { date: 'Jun', count: 28 },
  { date: 'Jul', count: 35 },
  { date: 'Aug', count: 42 },
  { date: 'Sep', count: 38 },
  { date: 'Oct', count: 45 },
  { date: 'Nov', count: 48 },
  { date: 'Dec', count: 52 },
];

const compassData = [
  { name: 'Ennahda', x: -4, y: 6, color: '#4285F4', ideology: 'Conservative', stance: 'Opposition' },
  { name: 'PDL', x: 7, y: 8, color: '#EA4335', ideology: 'Nationalist', stance: 'Opposition' },
  { name: 'Echaab', x: -6, y: 7, color: '#FBBC05', ideology: 'Nationalist', stance: 'Pro-Regime' },
  { name: 'Attayar', x: -3, y: -2, color: '#34A853', ideology: 'Social Democratic', stance: 'Opposition' },
  { name: 'Carthage (Regime)', x: 0, y: 9, color: '#FFFFFF', ideology: 'Nationalist', stance: 'Pro-Regime' },
];

const freedomMetrics = [
  { label: 'Press Freedom', value: 34, status: 'Restricted', trend: 'down' },
  { label: 'Judicial Independence', value: 22, status: 'Critical', trend: 'down' },
  { label: 'Civil Society Space', value: 41, status: 'Shrinking', trend: 'down' },
  { label: 'Digital Rights', value: 55, status: 'Monitored', trend: 'stable' },
];

const keyEvents = [
  { date: '2025-07-25', event: 'Presidential Decree 117 Anniversary', impact: 'High', status: 'Consolidated' },
  { date: '2025-10-12', event: 'New Judicial Council Appointments', impact: 'Critical', status: 'Completed' },
  { date: '2026-01-15', event: 'Economic Reform Package Protest', impact: 'Moderate', status: 'Ongoing' },
  { date: '2026-03-01', event: 'Opposition Coalition Formation', impact: 'High', status: 'Active' },
];

const riskMatrix = [
  { category: 'Institutional', level: 'Critical', trend: 'Increasing', color: 'text-intel-red' },
  { category: 'Social Stability', level: 'High', trend: 'Volatile', color: 'text-intel-orange' },
  { category: 'Economic Legitimacy', level: 'Moderate', trend: 'Decreasing', color: 'text-intel-cyan' },
  { category: 'External Pressure', level: 'Low', trend: 'Stable', color: 'text-slate-500' },
];

const sentimentData = [
  { date: '2026-03-01', proGov: 65, critical: 25, neutral: 10 },
  { date: '2026-03-05', proGov: 62, critical: 28, neutral: 10 },
  { date: '2026-03-10', proGov: 58, critical: 32, neutral: 10 },
  { date: '2026-03-15', proGov: 55, critical: 35, neutral: 10 },
  { date: '2026-03-20', proGov: 52, critical: 38, neutral: 10 },
  { date: '2026-03-25', proGov: 50, critical: 40, neutral: 10 },
];

const officialStatements = [
  { date: '2026-03-24', source: 'Presidency', topic: 'Economic Sovereignty', sentiment: 'Defiant', impact: 'High' },
  { date: '2026-03-20', source: 'Ministry of Interior', topic: 'National Security', sentiment: 'Assertive', impact: 'Critical' },
  { date: '2026-03-15', source: 'Ministry of Finance', topic: 'IMF Negotiations', sentiment: 'Cautious', impact: 'Moderate' },
];

export const PoliticalOverview: React.FC = () => {
  const { fullData: data, rriState } = useRiskMetrics();
  const [ideologyFilter, setIdeologyFilter] = useState<string>('All');
  const [stanceFilter, setStanceFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiBriefing, setAiBriefing] = useState<string | null>(null);

  const handleGenerateBriefing = async () => {
    setIsAnalyzing(true);
    try {
      const prompt = `Generate a high-level strategic political briefing for Tunisia based on the current landscape.
      Current RRI Score: ${rriState.rri.toFixed(4)}.
      P(Revolution): ${(rriState.p_rev * 100).toFixed(1)}%.
      
      Key dimensions to cover:
      - Regime stability and executive consolidation.
      - Institutional health (Judiciary, Media, Civil Society).
      - Opposition dynamics and potential for mobilization.
      - Impact of economic stressors on political legitimacy.
      
      Provide actionable insights for strategic decision-makers.`;
      
      const response = await generateAnalystResponse(prompt, { rri: rriState.rri, pRev: rriState.p_rev });
      if (response) {
        setAiBriefing(response);
      }
    } catch (error) {
      console.error('AI Briefing failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const filteredCompassData = useMemo(() => {
    return compassData.filter(party => {
      const matchesIdeology = ideologyFilter === 'All' || party.ideology === ideologyFilter;
      const matchesStance = stanceFilter === 'All' || party.stance === stanceFilter;
      const matchesSearch = searchQuery === '' || 
        party.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        party.ideology.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesIdeology && matchesStance && matchesSearch;
    });
  }, [ideologyFilter, stanceFilter, searchQuery]);

  const filteredTimeline = useMemo(() => {
    const timelineEvents = [
      { date: '2026-03-25', title: 'UGTT Executive Bureau Elections', type: 'INSTITUTIONAL', impact: 'SYSTEMIC RISK', desc: 'Election of the new 15-member Executive Bureau. Regional representation shows strong Sfax-Tunis axis.' },
      { date: '2026-03-15', title: 'Opposition Leader Arrest', type: 'ARREST', impact: 'POTENTIAL CATALYST', desc: 'Arrest of key NSF member on charges of conspiracy against state security.' },
      { date: '2026-03-12', title: 'UGTT Strike Warning', type: 'PROTEST', impact: 'CRITICAL', desc: 'General strike announced in transport sector over wage negotiation deadlock.' },
      { date: '2026-03-08', title: 'New Electoral Law Decree', type: 'DECREE', impact: 'HIGH', desc: 'Presidential decree modifying local council election procedures.' },
      { date: '2026-03-02', title: 'EU Diplomatic Mission', type: 'DIPLOMACY', impact: 'LOCALIZED IMPACT', desc: 'High-level EU delegation visits Tunis to discuss migration and human rights.' },
      { date: '2026-02-24', title: 'Media Outlet Closure', type: 'CENSORSHIP', impact: 'CRITICAL', desc: 'Suspension of independent radio station license for "regulatory violations".' },
      { date: '2026-02-18', title: 'Judicial Council Reshuffle', type: 'INSTITUTIONAL', impact: 'SYSTEMIC RISK', desc: 'Replacement of 4 senior judges in the Temporary Supreme Judicial Council.' },
      { date: '2026-02-10', title: 'Bread Subsidy Protest', type: 'PROTEST', impact: 'LOCALIZED IMPACT', desc: 'Localized demonstration in Kasserine over flour shortages and price hikes.' },
      { date: '2026-02-01', title: 'IMF Negotiation Update', type: 'ECONOMY', impact: 'HIGH', desc: 'Statement from Finance Ministry regarding "technical progress" on IMF loan.' }
    ];

    if (searchQuery === '') return timelineEvents;

    return timelineEvents.filter(event => 
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.type.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const ideologies = ['All', ...new Set(compassData.map(p => p.ideology))];
  const stances = ['All', ...new Set(compassData.map(p => p.stance))];

  // Calculate days detained for Rached Ghannouchi (Arrested April 17, 2023)
  const arrestDate = new Date('2023-04-17');
  const today = new Date();
  const daysDetained = Math.floor((today.getTime() - arrestDate.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="p-3 md:p-4 space-y-12 relative">
      <BackgroundGrid />
      
      <ModuleHeader 
        title="Political Overview"
        subtitle="Strategic regime stability and institutional landscape analysis"
        icon={Globe}
        nodeId="POL-OVER-18"
      />

      {/* RRI Status Banner */}
      <div className="intel-card p-5 md:p-6 rounded-2xl border border-intel-red/30 bg-intel-red/5 relative overflow-hidden group z-20">
        <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-40 transition-opacity">
          <Activity className="w-24 h-24 text-intel-red" />
        </div>
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <div className="px-2 py-0.5 bg-intel-red text-black text-[10px] font-bold rounded uppercase tracking-widest animate-pulse">
                AT THRESHOLD
              </div>
              <h2 className="text-xl font-bold text-white uppercase tracking-tight">Rapid Risk Indicator (RRI) State</h2>
            </div>
            <p className="text-xs text-slate-400 font-mono uppercase tracking-widest">
              Live Pipeline Feed: R(t) = {rriState.rri.toFixed(4)} | P_rev = {(rriState.p_rev * 100).toFixed(1)}% | S(t) = {rriState.salience.toFixed(2)}
            </p>
          </div>
  
          <div className="flex items-center space-x-4 md:space-x-8">
            <button 
              onClick={handleGenerateBriefing}
              disabled={isAnalyzing}
              className="px-4 py-2 bg-intel-cyan/10 hover:bg-intel-cyan/20 border border-intel-cyan/30 rounded-xl text-[10px] font-bold text-intel-cyan transition-all flex items-center space-x-2 disabled:opacity-50"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Generating Briefing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3 h-3" />
                  <span>AI Strategic Briefing</span>
                </>
              )}
            </button>
            <div className="h-12 w-px bg-white/10 hidden md:block" />
            <div className="text-center">
              <div className="text-[10px] font-mono text-slate-500 uppercase mb-1">Current R(t)</div>
              <div className={cn(
                "text-3xl font-bold font-mono",
                rriState.rri > 2.5 ? "text-intel-red" : "text-intel-orange"
              )}>
                {rriState.rri.toFixed(4)}
              </div>
            </div>
            <div className="h-12 w-px bg-white/10 hidden md:block" />
            <div className="text-center hidden sm:block">
              <div className="text-[10px] font-mono text-slate-500 uppercase mb-1">CI Bands</div>
              <div className="text-sm font-bold text-white font-mono">
                [{rriState.ci_low.toFixed(2)} - {rriState.ci_high.toFixed(2)}]
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Briefing Display */}
      <AnimatePresence>
        {aiBriefing && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="intel-card p-6 rounded-2xl border border-intel-cyan/30 bg-intel-cyan/5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-intel-cyan">
                  <Sparkles className="w-4 h-4" />
                  <h3 className="text-sm font-bold uppercase tracking-widest">AI Strategic Political Briefing</h3>
                </div>
                <button 
                  onClick={() => setAiBriefing(null)}
                  className="text-[10px] font-mono text-slate-500 hover:text-white uppercase"
                >
                  Dismiss
                </button>
              </div>
              <div className="text-xs text-slate-300 leading-relaxed font-mono max-h-[400px] overflow-y-auto pr-4 custom-scrollbar">
                <div className="markdown-body">
                  <Markdown>{aiBriefing}</Markdown>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Regime Stability Scorecard */}
        <div className="lg:col-span-7 intel-card p-5 md:p-6 rounded-2xl border border-white/10">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center">
                <ShieldAlert className="w-5 h-5 mr-2 text-intel-cyan" />
                Regime Stability Scorecard
              </h3>
              <p className="text-xs text-slate-500 font-mono uppercase tracking-widest">Multi-dimensional institutional health audit</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-intel-orange font-mono">64.2</div>
              <div className="text-[8px] text-slate-500 uppercase font-mono tracking-widest">Stability Index</div>
            </div>
          </div>

          <div className="overflow-x-auto scrollbar-hide">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="py-3 px-4 text-[10px] font-mono text-slate-500 uppercase">Dimension</th>
                  <th className="py-3 px-4 text-[10px] font-mono text-slate-500 uppercase">Score</th>
                  <th className="py-3 px-4 text-[10px] font-mono text-slate-500 uppercase">Trend</th>
                  <th className="py-3 px-4 text-[10px] font-mono text-slate-500 uppercase">Strategic Note</th>
                </tr>
              </thead>
              <tbody className="text-xs font-mono">
                {[
                  { dim: 'Executive Consolidation', score: 92, trend: 'UP', note: 'Decree 117 normalization complete' },
                  { dim: 'Judicial Autonomy', score: 14, trend: 'DOWN', note: 'CSM restructuring finalized' },
                  { dim: 'Security Apparatus Loyalty', score: 88, trend: 'STABLE', note: 'Interior Ministry budget +15%' },
                  { dim: 'Economic Legitimacy', score: 32, trend: 'DOWN', note: 'Inflation/Shortages eroding trust' },
                  { dim: 'Opposition Cohesion', score: 24, trend: 'STABLE', note: 'Fragmented despite NSF efforts' },
                  { dim: 'External Recognition', score: 45, trend: 'DOWN', note: 'EU/US conditionality increasing' }
                ].map((row, i) => (
                  <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-3 px-4 font-bold text-white">{row.dim}</td>
                    <td className="py-3 px-4">
                      <span className={cn(
                        "font-bold",
                        row.score > 70 ? "text-intel-green" : row.score > 40 ? "text-intel-orange" : "text-intel-red"
                      )}>{row.score}/100</span>
                    </td>
                    <td className="py-3 px-4">
                      {row.trend === 'UP' ? <TrendingUp className="w-3 h-3 text-intel-green" /> : 
                       row.trend === 'DOWN' ? <TrendingUp className="w-3 h-3 text-intel-red rotate-180" /> : 
                       <Activity className="w-3 h-3 text-slate-500" />}
                    </td>
                    <td className="py-3 px-4 text-slate-400">{row.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Key Actor Status Summary */}
        <div className="lg:col-span-5 intel-card p-5 md:p-6 rounded-2xl border border-white/10">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center">
            <Users className="w-5 h-5 mr-2 text-intel-purple" />
            Key Actor Status Summary
          </h3>
          <div className="grid grid-cols-1 gap-4">
            {[
              { name: 'Kais Saied', status: 'ACTIVE', situation: 'Carthage Palace', threat: 'LOW', color: 'intel-green' },
              { name: 'Rached Ghannouchi', status: 'DETAINED', situation: `Mornaguia Prison (${daysDetained} days)`, threat: 'HIGH', color: 'intel-red' },
              { name: 'Abir Moussi', status: 'DETAINED', situation: 'Mornaguia Prison', threat: 'HIGH', color: 'intel-red' },
              { name: 'Noureddine Taboubi', status: 'PRESSURED', situation: 'UGTT HQ / Negotiations', threat: 'MODERATE', color: 'intel-orange' },
              { name: 'Ahmed Nejib Chebbi', status: 'ACTIVE', situation: 'NSF Coordination', threat: 'MODERATE', color: 'intel-orange' },
              { name: 'Kamel Feki', status: 'ACTIVE', situation: 'Ministry of Interior', threat: 'LOW', color: 'intel-green' }
            ].map((actor, i) => (
              <div 
                key={i} 
                onClick={() => window.dispatchEvent(new CustomEvent('navigate-subtab', { detail: { subTab: 'powermap' }}))}
                className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-intel-purple/30 transition-all cursor-pointer group"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="text-sm font-bold text-white group-hover:text-intel-purple transition-colors">{actor.name}</div>
                  <span className={cn(
                    "text-[8px] font-mono px-1.5 py-0.5 rounded border uppercase",
                    actor.status === 'DETAINED' ? "bg-intel-red/20 border-intel-red/30 text-intel-red" :
                    actor.status === 'PRESSURED' ? "bg-intel-orange/20 border-intel-orange/30 text-intel-orange" :
                    "bg-intel-green/20 border-intel-green/30 text-intel-green"
                  )}>
                    {actor.status}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[10px] font-mono">
                  <span className="text-slate-500">{actor.situation}</span>
                  <span className={cn(
                    "font-bold",
                    actor.threat === 'HIGH' ? "text-intel-red" : actor.threat === 'MODERATE' ? "text-intel-orange" : "text-intel-green"
                  )}>Threat: {actor.threat}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Government Sentiment Analysis */}
        <div className="lg:col-span-12 intel-card p-5 md:p-6 rounded-2xl border border-white/10 space-y-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-intel-cyan" />
                <span>Government Sentiment & Media Framing</span>
              </h3>
              <p className="text-xs text-slate-500 uppercase font-mono">Tracking official narratives vs. media critical discourse</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-intel-cyan rounded-full" />
                <span className="text-[10px] text-slate-400 font-mono uppercase">Pro-Gov</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-intel-red rounded-full" />
                <span className="text-[10px] text-slate-400 font-mono uppercase">Critical</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Sentiment Chart */}
            <div className="lg:col-span-2 h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sentimentData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    stroke="#64748b" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false}
                    tickFormatter={(val) => val.split('-').slice(1).join('/')}
                  />
                  <YAxis 
                    stroke="#64748b" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false}
                    domain={[0, 100]}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                    itemStyle={{ fontSize: '12px' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="proGov" 
                    name="Pro-Government"
                    stroke="#00ffff" 
                    strokeWidth={2} 
                    dot={{ fill: '#00ffff', r: 3 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="critical" 
                    name="Critical Discourse"
                    stroke="#ef4444" 
                    strokeWidth={2} 
                    dot={{ fill: '#ef4444', r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Analysis & Shifts */}
            <div className="space-y-6">
              <div className="space-y-4">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-white/10 pb-2">Sentiment Shift Analysis</h4>
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-intel-red/5 border border-intel-red/20">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold text-intel-red uppercase">Negative Shift</span>
                      <span className="text-[9px] text-slate-500 font-mono">2026-03-25</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed font-mono">
                      Critical discourse surged following the Dahmani sentence, marking a 12% increase in opposition media activity.
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-intel-cyan/5 border border-intel-cyan/20">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold text-intel-cyan uppercase">Regime Narrative</span>
                      <span className="text-[9px] text-slate-500 font-mono">2026-03-24</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed font-mono">
                      Carthage Palace doubling down on "Sovereignty" narrative to counter external pressure on judicial independence.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-white/10 pb-2">Recent Official Statements</h4>
                <div className="space-y-2">
                  {officialStatements.map((stmt, i) => (
                    <div key={i} className="flex items-center justify-between text-[10px] font-mono p-2 hover:bg-white/5 rounded-lg transition-colors">
                      <div className="flex flex-col">
                        <span className="text-white font-bold">{stmt.source}</span>
                        <span className="text-slate-500">{stmt.topic}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-intel-cyan">{stmt.sentiment}</div>
                        <div className="text-[8px] text-slate-600">{stmt.date}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Presidential Appearance Frequency */}
        <div className="lg:col-span-8 glass p-5 md:p-6 rounded-2xl border border-intel-border/50 space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <Eye className="w-5 h-5 text-intel-cyan" />
                <span>Presidential Presence Index</span>
              </h3>
              <p className="text-xs text-slate-500 uppercase font-mono">Tracking media & public appearance frequency (2025-2026)</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-intel-cyan font-mono">+42%</div>
              <div className="text-[8px] text-slate-500 uppercase font-mono">YoY Increase</div>
            </div>
          </div>

          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={appearanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="#64748b" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                />
                <YAxis 
                  stroke="#64748b" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                  itemStyle={{ color: '#00ffff', fontSize: '12px' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#00ffff" 
                  strokeWidth={3} 
                  dot={{ fill: '#00ffff', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[10px] text-slate-500 italic leading-relaxed">
            Analysis: The steady increase in presidential visibility correlates with the consolidation of executive power and the systematic reduction of intermediary institutional voices.
          </p>
        </div>

        {/* Political Compass */}
        <div className="lg:col-span-4 glass p-5 md:p-6 rounded-2xl border border-intel-border/50 space-y-6">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <Compass className="w-5 h-5 text-intel-purple" />
              <span>Political Compass</span>
            </h3>
            <p className="text-xs text-slate-500 uppercase font-mono">Ideological Mapping of Major Actors</p>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[8px] text-slate-500 uppercase font-mono">Ideology</label>
              <select 
                value={ideologyFilter}
                onChange={(e) => setIdeologyFilter(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-[10px] text-slate-300 outline-none focus:border-intel-cyan/50"
              >
                {ideologies.map((id, index) => <option key={`ideology-${id}-${index}`} value={id} className="bg-intel-bg">{id}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[8px] text-slate-500 uppercase font-mono">Stance</label>
              <select 
                value={stanceFilter}
                onChange={(e) => setStanceFilter(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-[10px] text-slate-300 outline-none focus:border-intel-cyan/50"
              >
                {stances.map((st, index) => <option key={`stance-${st}-${index}`} value={st} className="bg-intel-bg">{st}</option>)}
              </select>
            </div>
          </div>

          <div className="h-[250px] w-full relative border border-intel-border rounded-xl bg-black/20 overflow-hidden">
            {/* Axis Labels */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 text-[8px] text-slate-500 uppercase font-bold">Authoritarian</div>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[8px] text-slate-500 uppercase font-bold">Libertarian</div>
            <div className="absolute left-2 top-1/2 -translate-y-1/2 -rotate-90 text-[8px] text-slate-500 uppercase font-bold">Economic Left</div>
            <div className="absolute right-2 top-1/2 -translate-y-1/2 rotate-90 text-[8px] text-slate-500 uppercase font-bold">Economic Right</div>

            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid stroke="#1e293b" />
                <XAxis type="number" dataKey="x" name="Economic" domain={[-10, 10]} hide />
                <YAxis type="number" dataKey="y" name="Social" domain={[-10, 10]} hide />
                <ZAxis type="number" range={[100, 100]} />
                <Tooltip 
                  cursor={{ strokeDasharray: '3 3' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-intel-bg border border-intel-border p-2 rounded text-[10px]">
                          <div className="font-bold text-white">{payload[0].payload.name}</div>
                          <div className="text-intel-cyan">{payload[0].payload.ideology}</div>
                          <div className="text-slate-500">X: {payload[0].value}, Y: {payload[1].value}</div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Scatter isAnimationActive={false} name="Parties" data={filteredCompassData}>
                  {filteredCompassData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          
          <div className="space-y-2 max-h-[100px] overflow-y-auto pr-2 custom-scrollbar">
            {filteredCompassData.map((party, index) => (
              <div key={`${party.name}-${index}`} className="flex items-center justify-between text-[10px]">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: party.color }}></div>
                  <span className="text-slate-300">{party.name}</span>
                </div>
                <span className="text-slate-500 font-mono">({party.x}, {party.y})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Political Freedom Index Summary */}
        <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          {freedomMetrics.map((metric, i) => (
            <div key={metric.label} className="glass p-4 rounded-xl border border-intel-border/50 space-y-3">
              <div className="flex justify-between items-start">
                <div className="text-[9px] text-slate-500 uppercase font-mono tracking-wider">{metric.label}</div>
                {metric.trend === 'down' ? (
                  <TrendingUp className="w-3 h-3 text-intel-red rotate-180" />
                ) : (
                  <TrendingUp className="w-3 h-3 text-intel-cyan" />
                )}
              </div>
              <div className="flex items-end justify-between">
                <div className="text-2xl font-bold text-white font-mono">{metric.value}</div>
                <div className={cn(
                  "text-[7px] font-mono px-1.5 py-0.5 rounded border uppercase",
                  metric.status === 'Critical' || metric.status === 'Restricted' ? "bg-intel-red/10 text-intel-red border-intel-red/20" :
                  metric.status === 'Shrinking' ? "bg-intel-orange/10 text-intel-orange border-intel-orange/20" :
                  "bg-intel-cyan/10 text-intel-cyan border-intel-cyan/20"
                )}>
                  {metric.status}
                </div>
              </div>
              <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                <div className={cn(
                  "h-full transition-all duration-1000",
                  metric.value < 30 ? "bg-intel-red" : metric.value < 50 ? "bg-intel-orange" : "bg-intel-cyan"
                )} style={{ width: `${metric.value}%` }}></div>
              </div>
            </div>
          ))}
        </div>

        {/* Risk Assessment & Timeline */}
        <div className="lg:col-span-4 space-y-4">
          <div className="glass p-5 rounded-xl border border-intel-border/50 space-y-4">
            <h4 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
              <Info className="w-4 h-4 text-intel-cyan" />
              Risk Assessment Matrix
            </h4>
            <div className="space-y-3">
              {riskMatrix.map(risk => (
                <div key={risk.category} className="flex items-center justify-between p-2 bg-white/5 rounded-lg border border-white/5">
                  <span className="text-[10px] text-slate-400 font-mono">{risk.category}</span>
                  <div className="flex items-center gap-3">
                    <span className={cn("text-[10px] font-bold uppercase font-mono", risk.color)}>{risk.level}</span>
                    <div className="w-1 h-4 bg-white/10 rounded-full overflow-hidden">
                      <div className={cn("w-full h-1/2", risk.color.replace('text-', 'bg-'))} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Political Events Timeline */}
        <div className="lg:col-span-12 intel-card p-5 md:p-6 rounded-2xl border border-white/10">
          <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
            <h3 className="text-lg font-bold text-white uppercase tracking-widest flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-intel-cyan" />
              Recent Political Events Timeline
            </h3>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500" />
              <input 
                type="text" 
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg py-1.5 pl-8 pr-4 text-[10px] font-mono text-white focus:outline-none focus:border-intel-cyan/50 transition-all"
              />
            </div>
            <div className="text-[10px] font-mono text-slate-500 uppercase">Significant Events Tracked</div>
          </div>

          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-px bg-white/10" />
            <div className="space-y-8">
              {filteredTimeline.map((event, i) => (
                <div key={`timeline-event-${event.date}-${i}`} className="relative pl-12 group">
                  <div className={cn(
                    "absolute left-[11px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-intel-bg z-10",
                    event.impact === 'SYSTEMIC RISK' ? "bg-intel-red shadow-[0_0_15px_#ef4444] scale-125" :
                    event.impact === 'POTENTIAL CATALYST' ? "bg-intel-orange shadow-[0_0_12px_#f97316] animate-pulse" :
                    event.impact === 'CRITICAL' ? "bg-intel-red shadow-[0_0_10px_#ef4444]" :
                    event.impact === 'HIGH' ? "bg-intel-orange shadow-[0_0_10px_#f97316]" :
                    "bg-intel-cyan shadow-[0_0_10px_#22d3ee]"
                  )} />
                  <div className="intel-card p-3 rounded-xl border border-white/5 hover:border-white/10 transition-all">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center space-x-3">
                        <span className="text-[10px] font-mono text-slate-500">{event.date}</span>
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[8px] font-bold font-mono",
                          event.type === 'ARREST' ? "bg-intel-red/20 text-intel-red" :
                          event.type === 'PROTEST' ? "bg-intel-orange/20 text-intel-orange" :
                          event.type === 'DECREE' ? "bg-intel-purple/20 text-intel-purple" :
                          "bg-intel-cyan/20 text-intel-cyan"
                        )}>
                          {event.type}
                        </span>
                      </div>
                      <span className={cn(
                        "text-[8px] font-bold font-mono uppercase px-2 py-0.5 rounded border",
                        event.impact === 'SYSTEMIC RISK' ? "bg-intel-red text-black border-intel-red" :
                        event.impact === 'POTENTIAL CATALYST' ? "bg-intel-orange/20 text-intel-orange border-intel-orange/30" :
                        event.impact === 'CRITICAL' ? "text-intel-red border-intel-red/30" :
                        event.impact === 'LOCALIZED IMPACT' ? "text-intel-cyan border-intel-cyan/30" :
                        "text-intel-orange border-intel-orange/30"
                      )}>
                        {event.impact}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-white mb-1">{event.title}</h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed font-mono">{event.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
