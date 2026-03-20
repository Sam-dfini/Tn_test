import React, { useState } from 'react';
import { 
  Eye, 
  Compass, 
  TrendingUp,
  Info
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
  const [ideologyFilter, setIdeologyFilter] = useState<string>('All');
  const [stanceFilter, setStanceFilter] = useState<string>('All');

  const filteredCompassData = compassData.filter(party => {
    const matchesIdeology = ideologyFilter === 'All' || party.ideology === ideologyFilter;
    const matchesStance = stanceFilter === 'All' || party.stance === stanceFilter;
    return matchesIdeology && matchesStance;
  });

  const ideologies = ['All', ...new Set(compassData.map(p => p.ideology))];
  const stances = ['All', ...new Set(compassData.map(p => p.stance))];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Presidential Appearance Frequency */}
      <div className="lg:col-span-8 glass p-8 rounded-3xl border border-intel-border/50 space-y-6">
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
      <div className="lg:col-span-4 glass p-8 rounded-3xl border border-intel-border/50 space-y-6">
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
          <div key={metric.label} className="glass p-5 rounded-2xl border border-intel-border/50 space-y-3">
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
        <div className="glass p-6 rounded-2xl border border-intel-border/50 space-y-4">
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

      {/* Key Events Timeline */}
      <div className="lg:col-span-12 glass p-8 rounded-3xl border border-intel-border/50 space-y-6">
        <h3 className="text-lg font-bold text-white uppercase tracking-widest">Strategic Timeline: Key Political Milestones</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {keyEvents.map((item, idx) => (
            <div key={idx} className="relative pl-6 border-l border-intel-cyan/30 space-y-2 group">
              <div className="absolute -left-[5px] top-0 w-2.5 h-2.5 rounded-full bg-intel-cyan shadow-[0_0_10px_rgba(0,255,255,0.5)] group-hover:scale-125 transition-transform" />
              <div className="text-[10px] text-intel-cyan font-mono">{item.date}</div>
              <div className="text-sm font-bold text-white leading-tight">{item.event}</div>
              <div className="flex items-center gap-2">
                <span className={cn(
                  "text-[8px] font-mono px-1.5 py-0.5 rounded border uppercase",
                  item.impact === 'Critical' ? "bg-intel-red/10 text-intel-red border-intel-red/20" : "bg-intel-cyan/10 text-intel-cyan border-intel-cyan/20"
                )}>Impact: {item.impact}</span>
                <span className="text-[8px] text-slate-500 uppercase font-mono">{item.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
