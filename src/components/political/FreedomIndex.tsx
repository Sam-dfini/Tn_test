import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Lock, 
  Users, 
  Activity, 
  TrendingUp, 
  AlertTriangle,
  FileText,
  Clock,
  Globe,
  Scale,
  Building2,
  ChevronRight,
  Info,
  Newspaper
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie,
  LineChart,
  Line,
  ReferenceLine
} from 'recharts';
import { motion } from 'motion/react';
import { cn } from '../../utils/cn';
import { BackgroundGrid, ModuleHeader, LiveTicker } from '../ProfessionalShared';

const freedomAlerts = [
  { code: 'DEC54-01', title: 'Decree 54: 67 Charged — 3 New This Week', impact: 'CRITICAL' },
  { code: 'PRESS-02', title: 'RSF Rank 118 — Down 27 Places Since 2021', impact: 'HIGH' },
  { code: 'JUD-03', title: 'Supreme Judicial Council Dissolved', impact: 'CRITICAL' },
  { code: 'NET-04', title: 'Internet Throttling: 14 Incidents Since 2023', impact: 'HIGH' },
  { code: 'NGO-05', title: 'Foreign Funding Decree — 3 NGOs Suspended', impact: 'HIGH' },
];

const decree54Timeline = [
  { quarter: 'Q3-22', charges: 2 }, { quarter: 'Q4-22', charges: 4 },
  { quarter: 'Q1-23', charges: 8 }, { quarter: 'Q2-23', charges: 11 },
  { quarter: 'Q3-23', charges: 9 }, { quarter: 'Q4-23', charges: 7 },
  { quarter: 'Q1-24', charges: 12 }, { quarter: 'Q2-24', charges: 8 },
  { quarter: 'Q3-24', charges: 6 }, { quarter: 'Q4-24', charges: 5 },
  { quarter: 'Q1-25', charges: 8 }, { quarter: 'Q2-25', charges: 9 },
  { quarter: 'Q3-25', charges: 7 }, { quarter: 'Q4-25', charges: 6 },
  { quarter: 'Q1-26', charges: 9 }
];

const categoryBreakdown = [
  { category: 'Journalists', percentage: 34, cases: 23 },
  { category: 'Political Opposition', percentage: 24, cases: 16 },
  { category: 'Civil Activists', percentage: 22, cases: 15 },
  { category: 'Business/Finance', percentage: 9, cases: 6 },
  { category: 'Other', percentage: 11, cases: 7 }
];

const recentCases = [
  { date: 'Mar 2026', name: 'Journalist (anon)', category: 'Press', charge: '"False news"', status: 'DETAINED' },
  { date: 'Feb 2026', name: 'Opposition leader', category: 'Political', charge: '"Conspiracy"', status: 'TRIAL' },
  { date: 'Feb 2026', name: 'Civil rights lawyer', category: 'Activist', charge: 'Decree 54', status: 'BAIL' },
  { date: 'Jan 2026', name: 'Blogger', category: 'Press', charge: '"Insult president"', status: 'DETAINED' },
  { date: 'Jan 2026', name: 'Ex-minister', category: 'Political', charge: '"Terror links"', status: 'TRIAL' },
  { date: 'Dec 2025', name: 'NGO director', category: 'Activist', charge: 'Foreign funding', status: 'BAIL' }
];

const throttlingLog = [
  { date: 'Mar 2026', title: 'Social media slowdown during protest (Sfax)', duration: 'Ongoing', platforms: 'Facebook, TikTok' },
  { date: 'Jan 2026', title: 'VPN blocking attempt', duration: '2 days', platforms: 'All VPN protocols' },
  { date: 'Nov 2025', title: 'Twitter throttling during opposition rally', duration: '4 hours', platforms: 'X (Twitter)' },
  { date: 'Oct 2025', title: 'Upload speed caps on video platforms', duration: 'Indefinite', platforms: 'YouTube, TikTok' },
  { date: 'Jun 2025', title: 'Telegram disruption', duration: '6 hours', platforms: 'Telegram' }
];

const detentionBreakdown = [
  { name: 'Political Leaders', value: 24, color: '#ef4444' },
  { name: 'Journalists', value: 12, color: '#f97316' },
  { name: 'Civil Servants', value: 15, color: '#fbbf24' },
  { name: 'Business Executives', value: 8, color: '#a855f7' }
];

const detentionTrend = [
  { month: 'Jan25', count: 28 }, { month: 'Feb', count: 31 }, { month: 'Mar', count: 35 },
  { month: 'Apr', count: 38 }, { month: 'May', count: 40 }, { month: 'Jun', count: 42 },
  { month: 'Jul', count: 44 }, { month: 'Aug', count: 41 }, { month: 'Sep', count: 43 },
  { month: 'Oct', count: 46 }, { month: 'Nov', count: 48 }, { month: 'Dec', count: 51 },
  { month: 'Jan26', count: 53 }, { month: 'Feb', count: 56 }, { month: 'Mar', count: 59 }
];

const notableDetainees = [
  { name: 'Rached Ghannouchi', role: 'Ennahda Leader', date: '2023-04-17', charge: 'Terrorism', status: 'DETAINED' },
  { name: 'Noureddine Bhiri', role: 'Ennahda VP', date: '2022-01-01', charge: 'State security', status: 'DETAINED' },
  { name: 'Issam Chebbi', role: 'Opposition', date: '2023-02-01', charge: 'Conspiracy', status: 'DETAINED' },
  { name: 'Jaouhar Ben Mbarek', role: 'Journalist/Activist', date: '2023-04-01', charge: 'Decree 54', status: 'RELEASED' },
  { name: 'Chaima Issa', role: 'Civil Activist', date: '2023-03-01', charge: 'Conspiracy', status: 'RELEASED' },
  { name: '[Journalist - name withheld]', role: 'Investigative Press', date: '2026-01-01', charge: 'Decree 54', status: 'DETAINED' }
];

const rsfRanking = [
  { year: '2015', rank: 126 }, { year: '2016', rank: 96 }, { year: '2017', rank: 97 },
  { year: '2018', rank: 97 }, { year: '2019', rank: 72 }, { year: '2020', rank: 73 },
  { year: '2021', rank: 73 }, { year: '2022', rank: 94 }, { year: '2023', rank: 111 },
  { year: '2024', rank: 118 }, { year: '2025', rank: 118 }, { year: '2026', rank: 121 }
];

const mediaLandscape = {
  state: [
    { name: 'TAP (national wire)', status: 'STATE' },
    { name: 'Watania TV', status: 'STATE' },
    { name: 'Radio Nationale', status: 'STATE' }
  ],
  independent: [
    { name: 'Mosaique FM', status: 'MONITORED' },
    { name: 'Express FM', status: 'MONITORED' },
    { name: 'Business News', status: 'MONITORED' }
  ],
  suspended: [
    { name: 'IFM (suspended 2023)', status: 'SUSPENDED' },
    { name: 'Radio Kalima', status: 'SUSPENDED' },
    { name: 'Inkyfada', status: 'PRESSURE' }
  ]
};

const institutionalErosion = [
  { date: 'Jul 25 2021', title: 'Presidential power grab', impact: 'CRITICAL', desc: 'Suspended parliament, dismissed government.' },
  { date: 'Sep 2021', title: 'Decree 117', impact: 'CRITICAL', desc: 'Rule by decree established.' },
  { date: 'Feb 2022', title: 'Supreme Judicial Council dissolved', impact: 'CRITICAL', desc: 'Executive oversight of judiciary.' },
  { date: 'Jul 2022', title: 'New constitution approved', impact: 'HIGH', desc: 'Presidential powers significantly expanded.' },
  { date: 'Sep 2022', title: 'Decree 54 enacted', impact: 'CRITICAL', desc: 'Cybercrime law used against dissent.' },
  { date: 'Jan 2023', title: 'New parliament sworn in', impact: 'HIGH', desc: 'Boycotted by major parties, 11% turnout.' },
  { date: 'Apr 2023', title: 'Ghannouchi arrested', impact: 'HIGH', desc: 'Leader of main opposition party detained.' },
  { date: 'Aug 2023', title: 'Independent Election Commission dissolved', impact: 'HIGH', desc: 'Restructured under presidential control.' },
  { date: 'Dec 2023', title: 'Municipal elections', impact: 'MEDIUM', desc: 'Record low turnout of 8.8%.' },
  { date: 'Jan 2025', title: 'Anti-NGO foreign funding decree', impact: 'HIGH', desc: 'Restrictions on civil society funding.' },
  { date: 'Mar 2026', title: 'Decree 54 charges reach 67', impact: 'HIGH', desc: 'Accelerated use of cybercrime law.' }
];

const institutionalHealth = [
  { institution: 'Parliament', pre: 'Functional', current: 'Rubber stamp', change: 'DEGRADED' },
  { institution: 'Judiciary', pre: 'Semi-independent', current: 'Executive-controlled', change: 'CRITICAL' },
  { institution: 'Electoral Commission', pre: 'Independent', current: 'Dissolved/reformed', change: 'CRITICAL' },
  { institution: 'Press', pre: 'Partially free', current: 'Heavily restricted', change: 'CRITICAL' },
  { institution: 'Civil Society', pre: 'Active', current: 'Under pressure', change: 'DEGRADED' },
  { institution: 'Military', pre: 'Apolitical', current: 'Still apolitical', change: 'STABLE' },
  { institution: 'Local Government', pre: 'Elected', current: 'Presidential appointees', change: 'DEGRADED' }
];

export const FreedomIndex: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'decree54' | 'detention' | 'press' | 'institutions'>('decree54');

  const calculateDays = (dateStr: string) => {
    const detentionDate = new Date(dateStr);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - detentionDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="p-3 md:p-4 space-y-8 animate-in fade-in duration-700 relative z-10">
      <BackgroundGrid />
      
      <ModuleHeader 
        title="Freedom & Institutional Index" 
        subtitle="Monitoring civil liberties and democratic erosion"
        icon={ShieldAlert}
        nodeId="POL-FREE-01"
      />

      <LiveTicker items={freedomAlerts} />

      {/* Sub-tabs */}
      <div className="flex items-center space-x-2 bg-white/5 p-1 rounded-xl border border-white/10 w-fit">
        {[
          { id: 'decree54', label: 'Decree 54', icon: Globe },
          { id: 'detention', label: 'Detention Tracker', icon: Lock },
          { id: 'press', label: 'Press Freedom', icon: Newspaper },
          { id: 'institutions', label: 'Institutions', icon: Building2 }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex items-center space-x-2 px-4 py-2 rounded-lg text-[10px] font-mono font-bold transition-all",
              activeTab === tab.id 
                ? "bg-intel-cyan text-intel-bg shadow-[0_0_15px_rgba(0,242,255,0.3)]" 
                : "text-slate-500 hover:text-white hover:bg-white/5"
            )}
          >
            <tab.icon className="w-3 h-3" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {activeTab === 'decree54' && (
        <div className="space-y-8">
          {/* Header Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Charged', value: '67', sub: 'Decree 54 Cases', color: 'text-intel-red', pulse: true },
              { label: 'Journalists', value: '23', sub: '34% of total', color: 'text-intel-cyan' },
              { label: 'Activists / Opposition', value: '38', sub: '57% of total', color: 'text-intel-cyan' },
              { label: 'Business Figures', value: '6', sub: '9% of total', color: 'text-intel-cyan' }
            ].map((stat, i) => (
              <div key={i} className="intel-card p-5 md:p-6 rounded-2xl border border-intel-border flex flex-col justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">{stat.label}</span>
                  <div className={cn("text-2xl font-bold font-mono", stat.color)}>
                    {stat.value}
                    {stat.pulse && <span className="ml-2 w-2 h-2 rounded-full bg-intel-red animate-pulse inline-block" />}
                  </div>
                </div>
                <div className="text-[9px] font-mono text-slate-600 uppercase mt-4">{stat.sub}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Timeline Chart */}
            <div className="lg:col-span-8 intel-card p-5 md:p-6 rounded-2xl border border-intel-border space-y-6">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white uppercase tracking-widest">Decree 54 Charges by Quarter (2022–2026)</h3>
                <p className="text-[10px] text-slate-500 font-mono uppercase">Tracking the acceleration of cybercrime law enforcement</p>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={decree54Timeline}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="quarter" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} fontFamily="JetBrains Mono" />
                    <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} fontFamily="JetBrains Mono" />
                    <Tooltip 
                      cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                      contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px', fontFamily: 'JetBrains Mono' }}
                    />
                    <Bar dataKey="charges">
                      {decree54Timeline.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.charges > 10 ? '#ef4444' : entry.charges > 6 ? '#f97316' : '#fbbf24'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center space-x-2 text-[10px] text-slate-500 italic">
                <Info className="w-4 h-4" />
                <span>"89% of charges target regime critics or journalists — Amnesty International, 2025"</span>
              </div>
            </div>

            {/* Category Breakdown */}
            <div className="lg:col-span-4 intel-card p-5 md:p-6 rounded-2xl border border-intel-border space-y-6">
              <h3 className="text-sm font-bold text-white uppercase tracking-widest">Category Breakdown</h3>
              <div className="space-y-6">
                {categoryBreakdown.map((item, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between text-[10px] font-mono">
                      <span className="text-slate-400 uppercase">{item.category}</span>
                      <span className="text-white font-bold">{item.cases} cases</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-intel-cyan" 
                        initial={{ width: 0 }}
                        animate={{ width: `${item.percentage}%` }}
                        transition={{ duration: 1, delay: i * 0.1 }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Recent Cases Table */}
            <div className="lg:col-span-7 intel-card p-5 md:p-6 rounded-2xl border border-intel-border space-y-6">
              <h3 className="text-sm font-bold text-white uppercase tracking-widest">Recent Decree 54 Cases</h3>
              <div className="overflow-x-auto scrollbar-hide">
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="border-b border-intel-border">
                      <th className="py-4 text-[10px] font-mono text-slate-500 uppercase tracking-widest">Date</th>
                      <th className="py-4 text-[10px] font-mono text-slate-500 uppercase tracking-widest">Name</th>
                      <th className="py-4 text-[10px] font-mono text-slate-500 uppercase tracking-widest">Category</th>
                      <th className="py-4 text-[10px] font-mono text-slate-500 uppercase tracking-widest">Charge</th>
                      <th className="py-4 text-[10px] font-mono text-slate-500 uppercase tracking-widest">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {recentCases.map((row, i) => (
                      <tr key={i} className="group hover:bg-white/5 transition-colors">
                        <td className="py-4 text-[10px] font-mono text-slate-400">{row.date}</td>
                        <td className="py-4 text-xs font-bold text-white">{row.name}</td>
                        <td className="py-4 text-[10px] font-mono text-slate-300">{row.category}</td>
                        <td className="py-4 text-[10px] font-mono text-slate-300 italic">{row.charge}</td>
                        <td className="py-4">
                          <span className={cn(
                            "text-[8px] font-mono px-2 py-1 rounded border uppercase",
                            row.status === 'DETAINED' ? "bg-intel-red/10 text-intel-red border-intel-red/20" :
                            row.status === 'TRIAL' ? "bg-intel-orange/10 text-intel-orange border-intel-orange/20" :
                            "bg-intel-yellow/10 text-intel-yellow border-intel-yellow/20"
                          )}>
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Throttling Log */}
            <div className="lg:col-span-5 intel-card p-5 md:p-6 rounded-2xl border border-intel-border space-y-6">
              <h3 className="text-sm font-bold text-white uppercase tracking-widest">Documented Internet Restriction Events</h3>
              <div className="space-y-4">
                {throttlingLog.map((incident, i) => (
                  <div key={i} className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-2">
                    <div className="flex justify-between items-start">
                      <span className="px-2 py-0.5 bg-intel-orange/10 text-intel-orange border border-intel-orange/20 rounded text-[8px] font-mono uppercase font-bold">{incident.date}</span>
                      <span className="text-[8px] font-mono text-slate-500 uppercase">{incident.duration}</span>
                    </div>
                    <p className="text-xs text-white font-bold leading-tight">{incident.title}</p>
                    <div className="flex items-center space-x-2 text-[9px] font-mono text-slate-500 uppercase">
                      <Globe className="w-3 h-3" />
                      <span>Platforms: {incident.platforms}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'detention' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Detention Overview */}
            <div className="lg:col-span-4 intel-card p-5 md:p-6 rounded-2xl border border-intel-border flex flex-col items-center justify-center space-y-8">
              <div className="text-center space-y-2">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Currently Detained</span>
                <div className="text-6xl font-bold font-mono text-intel-red">59</div>
                <p className="text-[10px] text-slate-500 font-mono uppercase">Political & Civil Figures</p>
              </div>

              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={detentionBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {detentionBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px', fontFamily: 'JetBrains Mono' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="w-full space-y-2">
                {detentionBreakdown.map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-[10px] font-mono">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-slate-400 uppercase">{item.name}</span>
                    </div>
                    <span className="text-white font-bold">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Trend Chart */}
            <div className="lg:col-span-8 intel-card p-5 md:p-6 rounded-2xl border border-intel-border space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-white uppercase tracking-widest">Detention Trend (18 Months)</h3>
                  <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">Monthly count of political detainees</p>
                </div>
                <div className="flex items-center space-x-2 text-intel-red animate-pulse">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase font-mono">Critical Upward Trend</span>
                </div>
              </div>
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={detentionTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="month" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} fontFamily="JetBrains Mono" />
                    <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} fontFamily="JetBrains Mono" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px', fontFamily: 'JetBrains Mono' }}
                    />
                    <Line type="monotone" dataKey="count" stroke="#ef4444" strokeWidth={3} dot={{ fill: '#ef4444', r: 4 }} activeDot={{ r: 6, stroke: '#ef4444', strokeWidth: 2, fill: '#0a0a0a' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Notable Detainees Panel */}
          <div className="space-y-6">
            <h3 className="text-sm font-bold text-white uppercase tracking-widest">Notable Detainees & Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {notableDetainees.map((detainee, i) => (
                <div key={i} className="intel-card p-5 md:p-6 rounded-2xl border border-intel-border space-y-4 relative overflow-hidden group hover:border-intel-cyan/50 transition-all">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="text-xs font-bold text-white">{detainee.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono uppercase">{detainee.role}</div>
                    </div>
                    <span className={cn(
                      "text-[8px] font-mono px-2 py-1 rounded border uppercase",
                      detainee.status === 'DETAINED' ? "bg-intel-red/10 text-intel-red border-intel-red/20" : "bg-intel-green/10 text-intel-green border-intel-green/20"
                    )}>
                      {detainee.status}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                    <div className="space-y-1">
                      <span className="text-[8px] font-mono text-slate-600 uppercase">Detained Since</span>
                      <div className="text-[10px] text-slate-300 font-mono">{detainee.date}</div>
                    </div>
                    <div className="space-y-1 text-right">
                      <span className="text-[8px] font-mono text-slate-600 uppercase">Days Detained</span>
                      <div className="text-[10px] text-intel-orange font-mono font-bold">{calculateDays(detainee.date)}</div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[8px] font-mono text-slate-600 uppercase">Primary Charge</span>
                    <div className="text-[10px] text-slate-400 italic">{detainee.charge}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'press' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* RSF Ranking Chart */}
            <div className="lg:col-span-8 intel-card p-5 md:p-6 rounded-2xl border border-intel-border space-y-6">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white uppercase tracking-widest">RSF Press Freedom Index — Tunisia Global Rank</h3>
                <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">Lower rank number = better freedom. Data: 2015-2026</p>
              </div>
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={rsfRanking}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="year" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} fontFamily="JetBrains Mono" />
                    <YAxis reversed stroke="#475569" fontSize={10} tickLine={false} axisLine={false} fontFamily="JetBrains Mono" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px', fontFamily: 'JetBrains Mono' }}
                    />
                    <ReferenceLine x="2021" stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'top', value: 'July 2021 coup', fill: '#ef4444', fontSize: 10, fontFamily: 'JetBrains Mono' }} />
                    <Line 
                      type="monotone" 
                      dataKey="rank" 
                      strokeWidth={3} 
                      dot={{ r: 4 }} 
                      activeDot={{ r: 6 }}
                      stroke="#ef4444"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Self-Censorship Gauge */}
            <div className="lg:col-span-4 intel-card p-5 md:p-6 rounded-2xl border border-intel-border flex flex-col items-center justify-center relative overflow-hidden">
              <div className="absolute top-6 left-6">
                <h3 className="text-[10px] font-bold text-white uppercase tracking-widest">Self-Censorship Rate</h3>
              </div>
              
              <div className="relative w-48 h-48 mt-4">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="96" cy="96" r="80" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="12" strokeDasharray="502.4" />
                  <motion.circle
                    cx="96" cy="96" r="80" fill="none" stroke="#ef4444" strokeWidth="12" strokeDasharray="502.4"
                    initial={{ strokeDashoffset: 502.4 }}
                    animate={{ strokeDashoffset: 502.4 - (74 / 100 * 502.4) }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <div className="text-4xl font-bold font-mono text-intel-red">74%</div>
                  <div className="text-[8px] font-mono text-slate-500 uppercase mt-1 tracking-widest">CRITICAL LEVEL</div>
                </div>
              </div>

              <div className="mt-8 text-center space-y-2">
                <p className="text-xs text-slate-400 leading-tight italic">
                  "74% of surveyed journalists report avoiding sensitive topics to prevent legal or professional retaliation."
                </p>
                <p className="text-[8px] font-mono text-slate-600 uppercase">Source: Reporters Without Borders 2025</p>
              </div>
            </div>
          </div>

          {/* Media Landscape Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: 'State-Controlled', items: mediaLandscape.state, color: 'text-intel-red' },
              { title: 'Independent (Under Pressure)', items: mediaLandscape.independent, color: 'text-intel-orange' },
              { title: 'Shut Down / Suspended', items: mediaLandscape.suspended, color: 'text-slate-500' }
            ].map((group, i) => (
              <div key={i} className="intel-card p-5 md:p-6 rounded-2xl border border-intel-border space-y-4">
                <h4 className={cn("text-xs font-bold uppercase tracking-widest", group.color)}>{group.title}</h4>
                <div className="space-y-3">
                  {group.items.map((media, j) => (
                    <div key={j} className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/10">
                      <span className="text-xs font-bold text-white">{media.name}</span>
                      <span className={cn(
                        "text-[8px] font-mono px-2 py-0.5 rounded border uppercase",
                        media.status === 'STATE' ? "bg-intel-red/10 text-intel-red border-intel-red/20" :
                        media.status === 'MONITORED' ? "bg-intel-orange/10 text-intel-orange border-intel-orange/20" :
                        "bg-slate-800 text-slate-400 border-slate-700"
                      )}>
                        {media.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'institutions' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Erosion Timeline */}
            <div className="lg:col-span-7 space-y-6">
              <h3 className="text-sm font-bold text-white uppercase tracking-widest">Institutional Erosion Timeline</h3>
              <div className="space-y-4 relative before:absolute before:left-[11px] before:top-0 before:bottom-0 before:w-px before:bg-intel-border">
                {institutionalErosion.map((event, i) => (
                  <div key={i} className="relative pl-8 group">
                    <div className={cn(
                      "absolute left-0 top-1.5 w-6 h-6 rounded-full border-4 border-intel-bg z-10",
                      event.impact === 'CRITICAL' ? "bg-intel-red" : event.impact === 'HIGH' ? "bg-intel-orange" : "bg-intel-yellow"
                    )} />
                    <div className="intel-card p-5 md:p-6 rounded-2xl border border-intel-border space-y-2 group-hover:border-intel-cyan/30 transition-all">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-mono text-intel-cyan font-bold">{event.date}</span>
                        <span className={cn(
                          "text-[8px] font-mono px-2 py-0.5 rounded border uppercase",
                          event.impact === 'CRITICAL' ? "bg-intel-red/10 text-intel-red border-intel-red/20" :
                          event.impact === 'HIGH' ? "bg-intel-orange/10 text-intel-orange border-intel-orange/20" :
                          "bg-intel-yellow/10 text-intel-yellow border-intel-yellow/20"
                        )}>
                          {event.impact}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-white">{event.title}</h4>
                      <p className="text-xs text-slate-500 leading-relaxed">{event.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Health Scorecard */}
            <div className="lg:col-span-5 space-y-6">
              <h3 className="text-sm font-bold text-white uppercase tracking-widest">Institutional Health Scorecard</h3>
              <div className="intel-card p-5 md:p-6 rounded-2xl border border-intel-border">
                <div className="overflow-x-auto scrollbar-hide">
                  <table className="w-full text-left border-collapse min-w-[500px]">
                    <thead>
                      <tr className="border-b border-intel-border">
                        <th className="py-4 text-[10px] font-mono text-slate-500 uppercase tracking-widest">Institution</th>
                        <th className="py-4 text-[10px] font-mono text-slate-500 uppercase tracking-widest">Current Status</th>
                        <th className="py-4 text-[10px] font-mono text-slate-500 uppercase tracking-widest">Change</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {institutionalHealth.map((row, i) => (
                        <tr key={i} className="group hover:bg-white/5 transition-colors">
                          <td className="py-4">
                            <div className="text-xs font-bold text-white">{row.institution}</div>
                            <div className="text-[8px] font-mono text-slate-600 uppercase">Pre-2021: {row.pre}</div>
                          </td>
                          <td className="py-4 text-xs text-slate-300">{row.current}</td>
                          <td className="py-4">
                            <span className={cn(
                              "text-[8px] font-mono px-2 py-1 rounded border uppercase",
                              row.change === 'CRITICAL' ? "bg-intel-red/10 text-intel-red border-intel-red/20" :
                              row.change === 'DEGRADED' ? "bg-intel-orange/10 text-intel-orange border-intel-orange/20" :
                              "bg-intel-green/10 text-intel-green border-intel-green/20"
                            )}>
                              {row.change}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Summary Note */}
              <div className="p-5 bg-intel-red/5 border border-intel-red/20 rounded-xl space-y-4">
                <div className="flex items-center space-x-2 text-intel-red">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Systemic Risk Assessment</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed font-mono italic">
                  "The systematic dismantling of horizontal accountability mechanisms since July 2021 has created a governance structure reliant solely on executive decree. This concentration of power increases systemic fragility and reduces institutional resilience to economic or social shocks."
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
