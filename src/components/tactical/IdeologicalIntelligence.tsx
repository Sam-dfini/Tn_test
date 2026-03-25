import React from 'react';
import { motion } from 'motion/react';
import { 
  History, Users, Zap, AlertTriangle, 
  TrendingUp, Activity, BarChart3, 
  Layers, GitMerge, GitPullRequest, 
  Shield, Eye, Clock, ChevronRight
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend
} from 'recharts';
import { cn } from '../../utils/cn';

const IDEOLOGICAL_DATA = [
  { year: 1956, destourian: 85, left: 10, islamist: 0, secular: 5, saiedist: 0 },
  { year: 1970, destourian: 75, left: 15, islamist: 5, secular: 5, saiedist: 0 },
  { year: 1987, destourian: 80, left: 5, islamist: 10, secular: 5, saiedist: 0 },
  { year: 2005, destourian: 60, left: 15, islamist: 20, secular: 5, saiedist: 0 },
  { year: 2011, destourian: 10, left: 20, islamist: 45, secular: 25, saiedist: 0 },
  { year: 2014, destourian: 5, left: 10, islamist: 35, secular: 50, saiedist: 0 },
  { year: 2019, destourian: 5, left: 5, islamist: 25, secular: 15, saiedist: 50 },
  { year: 2021, destourian: 2, left: 5, islamist: 15, secular: 8, saiedist: 70 },
  { year: 2024, destourian: 2, left: 10, islamist: 12, secular: 6, saiedist: 70 },
  { year: 2026, destourian: 3, left: 15, islamist: 15, secular: 7, saiedist: 60 },
];

const RRI_DISTURBANCE_DATA = [
  { year: 1956, rri: 1.2, label: 'Independence' },
  { year: 1978, rri: 2.1, label: 'Black Thursday' },
  { year: 1984, rri: 2.4, label: 'Bread Riots' },
  { year: 2005, rri: 1.8, label: '18 Oct Front' },
  { year: 2011, rri: 4.2, label: 'Revolution' },
  { year: 2013, rri: 3.5, label: 'Crisis' },
  { year: 2019, rri: 2.8, label: 'Cartel Fatigue' },
  { year: 2021, rri: 3.2, label: 'Self-Coup' },
  { year: 2024, rri: 3.6, label: 'Repression' },
  { year: 2026, rri: 3.9, label: 'Compound Crisis' },
];

const ALLIANCES = [
  {
    year: '1956',
    title: 'Neo-Destour + UGTT',
    desc: 'Strategic independence alliance. Bourguiba used labor mobilization to force French withdrawal.',
    impact: 'STABILIZATION',
    rri: -0.8
  },
  {
    year: '2005',
    title: '18 October Front',
    desc: 'Fragmented opposition (Islamists, Marxists, Liberals) united against Ben Ali repression.',
    impact: 'INCUBATION',
    rri: +0.2
  },
  {
    year: '2011',
    title: 'Jasmine Convergence',
    desc: 'Marxists triggered street protests; Islamists capitalized on the political opening.',
    impact: 'PEAK VOLATILITY',
    rri: +1.5
  },
  {
    year: '2013',
    title: 'National Dialogue Quartet',
    desc: 'Civil society intervention (UGTT, UTICA, LTDH, Lawyers) to break secular/religious deadlock.',
    impact: 'DE-ESCALATION',
    rri: -0.6
  },
  {
    year: '2019',
    title: 'Pact of the Two Zaim',
    desc: 'Essebsi-Ghannouchi consensus. Led to "cartel dynamics" and public fatigue.',
    impact: 'DECAY',
    rri: +0.4
  },
  {
    year: '2021',
    title: 'July 25 Self-Coup',
    desc: 'Saied consolidated power via "hyperpolitics", negating institutional framework.',
    impact: 'CONSOLIDATION',
    rri: +0.7
  },
  {
    year: '2024-26',
    title: 'Marxist-Islamist Rapprochement',
    desc: 'Shared repression and Gaza conflict driving unlikely tactical unity against Saied.',
    impact: 'COMPOUND PRESSURE',
    rri: +0.9
  }
];

export const IdeologicalIntelligence: React.FC = () => {
  return (
    <div className="flex flex-col h-full bg-[#05070a] overflow-y-auto custom-scrollbar p-6 space-y-8">
      {/* Header Section */}
      <div className="flex items-center justify-between border-b border-intel-cyan/20 pb-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <History className="w-5 h-5 text-intel-cyan" />
            <h2 className="text-xl font-bold text-white uppercase tracking-tighter">Political & Ideological Intelligence</h2>
          </div>
          <p className="text-xs font-mono text-slate-500 uppercase tracking-widest">Evolutionary Analysis: 1956 — 2026 // Sector: Tunisia</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <div className="text-[10px] font-mono text-slate-500 uppercase">Analysis Confidence</div>
            <div className="text-sm font-bold text-intel-green font-mono">HIGH (88%)</div>
          </div>
          <div className="w-px h-8 bg-intel-cyan/20" />
          <div className="text-right">
            <div className="text-[10px] font-mono text-slate-500 uppercase">Last Sync</div>
            <div className="text-sm font-bold text-intel-cyan font-mono">07:05:22Z</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Left Column: Analysis & Narrative */}
        <div className="col-span-12 lg:col-span-7 space-y-8">
          
          {/* Section 1: Ideological Blocks */}
          <section className="space-y-4">
            <div className="flex items-center space-x-2 border-l-2 border-intel-cyan pl-3">
              <Users className="w-4 h-4 text-intel-cyan" />
              <h3 className="text-sm font-bold text-white uppercase tracking-widest">Primary Ideological Blocks</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { name: 'Destourian Nationalists', desc: 'State-led modernization, paternalism, Bourguibist legacy.', color: 'border-blue-500/30 bg-blue-500/5' },
                { name: 'Marxists / The Left', desc: 'Radical labor agency, student activism, anti-imperialism.', color: 'border-red-500/30 bg-red-500/5' },
                { name: 'Islamists (Ennahda)', desc: 'Religious identity, social conservatism, coalitional pragmatism.', color: 'border-green-500/30 bg-green-500/5' },
                { name: 'Secular / Modernists', desc: 'Civil state, individual liberties, urban middle-class base.', color: 'border-purple-500/30 bg-purple-500/5' },
                { name: 'Saiedist Populists', desc: 'Anti-elite sovereignism, hyperpolitics, institutional negation.', color: 'border-intel-cyan/30 bg-intel-cyan/5' },
              ].map((block, i) => (
                <div key={i} className={cn("p-4 rounded-lg border transition-all hover:border-white/20", block.color)}>
                  <div className="text-xs font-bold text-white uppercase mb-1">{block.name}</div>
                  <p className="text-[10px] text-slate-400 uppercase leading-relaxed font-mono">{block.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Section 2: Historic Alliances Timeline */}
          <section className="space-y-4">
            <div className="flex items-center space-x-2 border-l-2 border-intel-orange pl-3">
              <GitMerge className="w-4 h-4 text-intel-orange" />
              <h3 className="text-sm font-bold text-white uppercase tracking-widest">Tactical Alliances & Intersections</h3>
            </div>
            <div className="space-y-4 relative before:absolute before:left-[15px] before:top-0 before:bottom-0 before:w-px before:bg-white/10">
              {ALLIANCES.map((alliance, i) => (
                <div key={i} className="relative pl-10 group">
                  <div className="absolute left-0 top-1 w-8 h-8 rounded-full bg-black border border-white/20 flex items-center justify-center z-10 group-hover:border-intel-cyan transition-colors">
                    <span className="text-[8px] font-bold font-mono text-intel-cyan">{alliance.year}</span>
                  </div>
                  <div className="p-4 rounded-lg bg-white/5 border border-white/10 group-hover:bg-white/10 transition-all">
                    <div className="flex justify-between items-start mb-2">
                      <div className="text-xs font-bold text-white uppercase">{alliance.title}</div>
                      <div className={cn(
                        "text-[8px] font-mono px-1.5 py-0.5 rounded border uppercase font-bold",
                        alliance.rri < 0 ? "bg-intel-green/10 text-intel-green border-intel-green/20" : "bg-intel-red/10 text-intel-red border-intel-red/20"
                      )}>
                        RRI: {alliance.rri > 0 ? '+' : ''}{alliance.rri}
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-400 uppercase leading-relaxed mb-2">{alliance.desc}</p>
                    <div className="text-[8px] font-mono text-intel-cyan uppercase tracking-widest">Impact: {alliance.impact}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Section 3: Deep Analysis */}
          <section className="space-y-4">
            <div className="flex items-center space-x-2 border-l-2 border-intel-purple pl-3">
              <Eye className="w-4 h-4 text-intel-purple" />
              <h3 className="text-sm font-bold text-white uppercase tracking-widest">Intelligence Synthesis</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="text-[10px] font-bold text-intel-cyan uppercase tracking-widest border-b border-intel-cyan/20 pb-1">The 2019 Division</div>
                <p className="text-[10px] text-slate-400 uppercase leading-relaxed font-mono">
                  The 'pact of the two zaim' (Essebsi and Ghannouchi) led to 'cartel dynamics,' political fatigue, and a public perception of representative institutions as inherently corrupt. Political parties became 'socially adrift' without clear ideological moorings by 2019.
                </p>
              </div>
              <div className="space-y-3">
                <div className="text-[10px] font-bold text-intel-red uppercase tracking-widest border-b border-intel-red/20 pb-1">The 2021 Self-Coup</div>
                <p className="text-[10px] text-slate-400 uppercase leading-relaxed font-mono">
                  'Hyperpolitics' created the vacuum for Kais Saied to consolidate power on July 25, 2021. Saied used 'anti-corruption' and 'anti-elite sovereignism' to negate the existing institutional framework, relying on repression and governed-by-decree legalism.
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Graphs & Metrics */}
        <div className="col-span-12 lg:col-span-5 space-y-8">
          
          {/* Graph 1: Ideological Strength Over Time */}
          <div className="glass p-6 rounded-xl border border-white/10 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-intel-cyan" />
                <h3 className="text-xs font-bold text-white uppercase tracking-widest">Ideological Strength Index</h3>
              </div>
              <span className="text-[8px] font-mono text-slate-500 uppercase">1956 — 2026 Projection</span>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={IDEOLOGICAL_DATA}>
                  <defs>
                    <linearGradient id="colorDest" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorIslam" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorSaied" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00f2ff" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#00f2ff" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis 
                    dataKey="year" 
                    stroke="#475569" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false} 
                  />
                  <YAxis 
                    stroke="#475569" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(val) => `${val}%`}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', fontSize: '10px' }}
                    itemStyle={{ textTransform: 'uppercase' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', textTransform: 'uppercase', paddingTop: '20px' }} />
                  <Area type="monotone" dataKey="destourian" name="Destourian" stroke="#3b82f6" fillOpacity={1} fill="url(#colorDest)" />
                  <Area type="monotone" dataKey="islamist" name="Islamist" stroke="#22c55e" fillOpacity={1} fill="url(#colorIslam)" />
                  <Area type="monotone" dataKey="saiedist" name="Saiedist" stroke="#00f2ff" fillOpacity={1} fill="url(#colorSaied)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="p-3 bg-white/5 rounded-lg border border-white/10">
              <div className="text-[8px] font-mono text-slate-500 uppercase mb-1">Analyst Note</div>
              <p className="text-[9px] text-slate-400 leading-tight uppercase italic">
                Observe the complete collapse of traditional party structures post-2019, replaced by a "Saiedist" populist dominance that operates without formal party mediation.
              </p>
            </div>
          </div>

          {/* Graph 2: RRI Disturbance Intersection */}
          <div className="glass p-6 rounded-xl border border-white/10 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4 text-intel-red" />
                <h3 className="text-xs font-bold text-white uppercase tracking-widest">RRI Disturbance Intersection</h3>
              </div>
              <span className="text-[8px] font-mono text-slate-500 uppercase">Event Correlation</span>
            </div>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={RRI_DISTURBANCE_DATA}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis 
                    dataKey="year" 
                    stroke="#475569" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false} 
                  />
                  <YAxis 
                    stroke="#475569" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false} 
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', fontSize: '10px' }}
                    formatter={(value: any, name: string, props: any) => [value, props.payload.label]}
                  />
                  <Line 
                    type="stepAfter" 
                    dataKey="rri" 
                    stroke="#ff3b3b" 
                    strokeWidth={2} 
                    dot={{ r: 4, fill: '#ff3b3b', strokeWidth: 0 }} 
                    activeDot={{ r: 6, fill: '#fff', stroke: '#ff3b3b', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-intel-red/5 border border-intel-red/20 rounded-lg">
                <div className="text-[8px] font-mono text-intel-red uppercase font-bold mb-1">Peak Risk</div>
                <div className="text-lg font-bold text-white font-mono">4.2</div>
                <div className="text-[7px] font-mono text-slate-500 uppercase">2011 Revolution</div>
              </div>
              <div className="p-3 bg-intel-orange/5 border border-intel-orange/20 rounded-lg">
                <div className="text-[8px] font-mono text-intel-orange uppercase font-bold mb-1">Current Risk</div>
                <div className="text-lg font-bold text-white font-mono">3.9</div>
                <div className="text-[7px] font-mono text-slate-500 uppercase">2026 Projection</div>
              </div>
            </div>
          </div>

          {/* Key Insights List */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 border-l-2 border-intel-cyan pl-3">
              <Shield className="w-4 h-4 text-intel-cyan" />
              <h3 className="text-sm font-bold text-white uppercase tracking-widest">Contextual Insights</h3>
            </div>
            <div className="space-y-3">
              {[
                { title: 'The Power of the UGTT', desc: 'Functioned as a "counter-power" since 1946. Decisive mediator in 2013.' },
                { title: 'The Student Question', desc: 'Genealogy of radicalism from 1960s Perspectives Tunisiennes movement.' },
                { title: 'Hyperpolitics vs. Institutions', desc: 'Parties failed to build everyday presence; outsourced policy to consultants.' },
                { title: 'Unconventional Autocracy', desc: 'Saied operates in an institutional vacuum, resisting formal party creation.' },
              ].map((insight, i) => (
                <div key={i} className="flex items-start space-x-3 group">
                  <div className="mt-1 w-1 h-1 rounded-full bg-intel-cyan group-hover:scale-150 transition-transform" />
                  <div>
                    <div className="text-[9px] font-bold text-white uppercase tracking-tight">{insight.title}</div>
                    <p className="text-[8px] text-slate-500 uppercase leading-tight font-mono">{insight.desc}</p>
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
