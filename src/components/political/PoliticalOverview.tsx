import React, { useState } from 'react';
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
  ArrowRight
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
import { cn } from '../../utils/cn';
import { usePipeline } from '../../context/PipelineContext';

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

export const PoliticalOverview: React.FC = () => {
  const { data, rriState } = usePipeline();
  const [ideologyFilter, setIdeologyFilter] = useState<string>('All');
  const [stanceFilter, setStanceFilter] = useState<string>('All');

  const filteredCompassData = compassData.filter(party => {
    const matchesIdeology = ideologyFilter === 'All' || party.ideology === ideologyFilter;
    const matchesStance = stanceFilter === 'All' || party.stance === stanceFilter;
    return matchesIdeology && matchesStance;
  });

  const ideologies = ['All', ...new Set(compassData.map(p => p.ideology))];
  const stances = ['All', ...new Set(compassData.map(p => p.stance))];

  // Calculate days detained for Rached Ghannouchi (Arrested April 17, 2023)
  const arrestDate = new Date('2023-04-17');
  const today = new Date();
  const daysDetained = Math.floor((today.getTime() - arrestDate.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="p-3 md:p-4 space-y-6">
      {/* RRI Status Banner */}
      <div className="intel-card p-5 md:p-6 rounded-2xl border border-intel-red/30 bg-intel-red/5 relative overflow-hidden group">
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
  
          <div className="flex items-center space-x-8">
            <div className="text-center">
              <div className="text-[10px] font-mono text-slate-500 uppercase mb-1">Current R(t)</div>
              <div className={cn(
                "text-3xl font-bold font-mono",
                rriState.rri > 2.5 ? "text-intel-red" : "text-intel-orange"
              )}>
                {rriState.rri.toFixed(4)}
              </div>
            </div>
            <div className="h-12 w-px bg-white/10" />
            <div className="text-center">
              <div className="text-[10px] font-mono text-slate-500 uppercase mb-1">CI Bands</div>
              <div className="text-sm font-bold text-white font-mono">
                [{rriState.ci_low.toFixed(2)} - {rriState.ci_high.toFixed(2)}]
              </div>
            </div>
            <button 
              onClick={() => window.dispatchEvent(new CustomEvent('navigate-main', { detail: { tab: 'risk' }}))}
              className="px-6 py-3 bg-intel-red/20 hover:bg-intel-red/30 border border-intel-red/40 rounded-2xl text-xs font-bold text-intel-red transition-all flex items-center group"
            >
              Analyze Risk Vectors
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>

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
                {ideologies.map(id => <option key={id} value={id} className="bg-intel-bg">{id}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[8px] text-slate-500 uppercase font-mono">Stance</label>
              <select 
                value={stanceFilter}
                onChange={(e) => setStanceFilter(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-[10px] text-slate-300 outline-none focus:border-intel-cyan/50"
              >
                {stances.map(st => <option key={st} value={st} className="bg-intel-bg">{st}</option>)}
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
                <Scatter name="Parties" data={filteredCompassData}>
                  {filteredCompassData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          
          <div className="space-y-2 max-h-[100px] overflow-y-auto pr-2 custom-scrollbar">
            {filteredCompassData.map(party => (
              <div key={party.name} className="flex items-center justify-between text-[10px]">
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
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold text-white uppercase tracking-widest flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-intel-cyan" />
              Recent Political Events Timeline
            </h3>
            <div className="text-[10px] font-mono text-slate-500 uppercase">Last 8 Significant Events</div>
          </div>

          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-px bg-white/10" />
            <div className="space-y-8">
              {[
                { date: '2026-03-15', title: 'Opposition Leader Arrest', type: 'ARREST', impact: 'CRITICAL', desc: 'Arrest of key NSF member on charges of conspiracy against state security.' },
                { date: '2026-03-12', title: 'UGTT Strike Warning', type: 'PROTEST', impact: 'HIGH', desc: 'General strike announced in transport sector over wage negotiation deadlock.' },
                { date: '2026-03-08', title: 'New Electoral Law Decree', type: 'DECREE', impact: 'HIGH', desc: 'Presidential decree modifying local council election procedures.' },
                { date: '2026-03-02', title: 'EU Diplomatic Mission', type: 'DIPLOMACY', impact: 'MODERATE', desc: 'High-level EU delegation visits Tunis to discuss migration and human rights.' },
                { date: '2026-02-24', title: 'Media Outlet Closure', type: 'CENSORSHIP', impact: 'HIGH', desc: 'Suspension of independent radio station license for "regulatory violations".' },
                { date: '2026-02-18', title: 'Judicial Council Reshuffle', type: 'INSTITUTIONAL', impact: 'CRITICAL', desc: 'Replacement of 4 senior judges in the Temporary Supreme Judicial Council.' },
                { date: '2026-02-10', title: 'Bread Subsidy Protest', type: 'PROTEST', impact: 'MODERATE', desc: 'Localized demonstration in Kasserine over flour shortages and price hikes.' },
                { date: '2026-02-01', title: 'IMF Negotiation Update', type: 'ECONOMY', impact: 'HIGH', desc: 'Statement from Finance Ministry regarding "technical progress" on IMF loan.' }
              ].map((event, i) => (
                <div key={i} className="relative pl-12 group">
                  <div className={cn(
                    "absolute left-[11px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-intel-bg z-10",
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
                        "text-[8px] font-bold font-mono uppercase",
                        event.impact === 'CRITICAL' ? "text-intel-red" : "text-intel-orange"
                      )}>
                        Impact: {event.impact}
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
