import React from 'react';
import { motion } from 'motion/react';
import { BarChart3, Users, PieChart, Info, CheckCircle2, AlertTriangle, ShieldAlert, History, TrendingDown } from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  Cell as RechartsCell
} from 'recharts';
import { cn } from '../utils/cn';

const turnoutHistory = [
  { year: '2014', turnout: 64.6, type: 'Presidential' },
  { year: '2019', turnout: 48.9, type: 'Presidential' },
  { year: '2022', turnout: 11.4, type: 'Legislative' },
  { year: '2024', turnout: 11.2, type: 'Presidential' },
];

export const Elections: React.FC = () => {
  const results = [
    { name: 'Kais Saied', party: 'Independent', percentage: 89.1, status: 'ELECTED', lastSeen: 'Carthage Palace, March 18', trend: 'stable' },
    { name: 'Ayachi Zammel', party: 'Azimoun', percentage: 7.3, status: 'DETAINED', lastSeen: 'Mornaguia Prison', trend: 'down' },
    { name: 'Zouhair Maghzaoui', party: 'Echaab', percentage: 3.6, status: 'ACTIVE', lastSeen: 'Tunis, Party HQ', trend: 'stable' },
  ];

  const parties = [
    { name: 'Ennahda', stance: 'Opposition', strength: 15, orientation: 'Conservative' },
    { name: 'PDL', stance: 'Opposition', strength: 22, orientation: 'Destourian' },
    { name: 'Echaab', stance: 'Pro-Regime', strength: 12, orientation: 'Nationalist' },
    { name: 'Attayar', stance: 'Opposition', strength: 8, orientation: 'Social Democratic' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col items-center text-center space-y-2">
        <h2 className="text-2xl tracking-tight">Electoral Legitimacy & Historical Trends</h2>
        <p className="text-slate-500 text-sm">Comprehensive analysis of participation and results across multiple cycles</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Voter Turnout Trends */}
          <div className="glass p-8 rounded-2xl border border-intel-border/50 space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-sm tracking-widest flex items-center uppercase font-bold text-slate-400">
                  <History className="w-4 h-4 mr-2 text-intel-red" />
                  Voter Turnout Analysis
                </h3>
                <p className="text-[10px] text-slate-500 uppercase font-mono">Historical Participation Trends (2014-2024)</p>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-intel-red font-mono">11.2%</div>
                <div className="text-[8px] text-slate-500 uppercase font-mono">Current Cycle</div>
              </div>
            </div>

            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={turnoutHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis 
                    dataKey="year" 
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
                    unit="%"
                  />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                    itemStyle={{ color: '#ff4444', fontSize: '12px' }}
                  />
                  <Bar dataKey="turnout" radius={[4, 4, 0, 0]}>
                    {turnoutHistory.map((entry, index) => (
                      <RechartsCell 
                        key={`cell-${index}`} 
                        fill={entry.year === '2024' ? '#ff4444' : '#334155'} 
                        fillOpacity={entry.year === '2024' ? 1 : 0.5}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-intel-border">
              <div className="space-y-2">
                <div className="text-[10px] text-white font-bold uppercase tracking-wider">Key Insight</div>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  The precipitous drop from 64.6% in 2014 to 11.2% in 2024 indicates a systemic crisis of legitimacy and widespread political apathy or boycott.
                </p>
              </div>
              <div className="space-y-2">
                <div className="text-[10px] text-white font-bold uppercase tracking-wider">Demographic Shift</div>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  Youth participation (ages 18-35) is estimated at less than 5%, marking a complete generational detachment from the current electoral framework.
                </p>
              </div>
            </div>
          </div>

          {/* Presidential Results */}
          <div className="glass p-8 rounded-2xl border border-intel-border/50">
            <h3 className="text-sm tracking-widest mb-8 flex items-center uppercase font-bold text-slate-400">
              <BarChart3 className="w-4 h-4 mr-2 text-intel-cyan" />
              2024 Presidential Results & Tracking
            </h3>
            <div className="space-y-10">
              {results.map((r, i) => (
                <div key={r.name} className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-lg font-bold text-white uppercase tracking-tight flex items-center">
                        {r.name}
                        {r.status === 'ELECTED' && <CheckCircle2 className="w-4 h-4 ml-2 text-intel-cyan" />}
                      </div>
                      <div className="flex items-center space-x-3 mt-1">
                        <span className="text-[10px] font-mono text-slate-500 uppercase">{r.party}</span>
                        <span className="text-[10px] font-mono text-intel-cyan/60 uppercase">Last Seen: {r.lastSeen}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={cn(
                        "text-[8px] font-mono font-bold px-2 py-0.5 rounded border mb-1 inline-block uppercase",
                        r.status === 'ELECTED' ? "bg-intel-green/10 text-intel-green border-intel-green/20" :
                        r.status === 'DETAINED' ? "bg-intel-red/10 text-intel-red border-intel-red/20" :
                        "bg-intel-cyan/10 text-intel-cyan border-intel-cyan/20"
                      )}>
                        {r.status}
                      </div>
                      <div className="text-2xl font-bold font-mono text-white">{r.percentage}%</div>
                    </div>
                  </div>
                  <div className="h-2 w-full bg-intel-border rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${r.percentage}%` }}
                      transition={{ delay: i * 0.2, duration: 1 }}
                      className={cn(
                        "h-full",
                        r.status === 'ELECTED' ? "bg-intel-cyan shadow-[0_0_15px_rgba(0,255,255,0.3)]" : "bg-slate-700"
                      )}
                    ></motion.div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Political Compass / Parties */}
          <div className="glass p-8 rounded-2xl border border-intel-border/50">
            <h3 className="text-sm tracking-widest mb-6 flex items-center uppercase font-bold text-slate-400">
              <Users className="w-4 h-4 mr-2 text-intel-purple" />
              Party Landscape: Gov vs Opposition
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {parties.map(party => (
                <div key={party.name} className="p-4 rounded-xl bg-white/5 border border-intel-border hover:border-intel-purple/30 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-bold text-white">{party.name}</div>
                    <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded border ${
                      party.stance === 'Opposition' ? 'bg-intel-red/10 text-intel-red border-intel-red/20' : 'bg-intel-cyan/10 text-intel-cyan border-intel-cyan/20'
                    }`}>
                      {party.stance}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 mb-3">{party.orientation}</div>
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 h-1 bg-intel-border rounded-full overflow-hidden">
                      <div className="h-full bg-intel-purple" style={{ width: `${party.strength * 4}%` }}></div>
                    </div>
                    <span className="text-[8px] font-mono text-slate-400">Influence: {party.strength}/25</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Parliamentary Blocs */}
          <div className="glass p-6 rounded-2xl border border-intel-border/50">
            <h3 className="text-sm tracking-widest mb-6 flex items-center uppercase font-bold text-slate-400">
              <PieChart className="w-4 h-4 mr-2 text-intel-cyan" />
              Parliamentary Blocs
            </h3>
            <div className="space-y-6">
              {[
                { label: 'Pro-Regime', value: '87 Seats', color: 'bg-intel-cyan', desc: 'Direct support for presidential decrees' },
                { label: 'Independent', value: '54 Seats', color: 'bg-intel-purple', desc: 'Varying alignment, mostly passive' },
                { label: 'Opposition', value: '20 Seats', color: 'bg-intel-red', desc: 'Fragmented, limited legislative power' },
              ].map(item => (
                <div key={item.label} className="space-y-2">
                  <div className="flex justify-between items-end">
                    <div>
                      <div className="text-[10px] text-white uppercase font-bold">{item.label}</div>
                      <div className="text-[8px] text-slate-500">{item.desc}</div>
                    </div>
                    <span className="text-xs font-mono text-white">{item.value}</span>
                  </div>
                  <div className="h-1.5 w-full bg-intel-border rounded-full overflow-hidden">
                    <div className={`h-full ${item.color}`} style={{ width: item.label === 'Pro-Regime' ? '54%' : item.label === 'Independent' ? '33%' : '13%' }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Institutional Alert */}
          <div className="glass p-6 rounded-2xl bg-intel-red/5 border-intel-red/20">
            <h3 className="text-sm tracking-widest mb-4 flex items-center text-intel-red uppercase font-bold">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Systemic Risk
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              The concentration of electoral oversight within the presidency has neutralized the ISIE's independence. Opposition parties are currently operating under extreme legal pressure, with several key leaders in detention or under investigation.
            </p>
          </div>

          {/* NGO / Civil Society */}
          <div className="glass p-6 rounded-2xl border border-intel-border/50">
            <h3 className="text-sm tracking-widest mb-4 flex items-center uppercase font-bold text-slate-400">
              <ShieldAlert className="w-4 h-4 mr-2 text-intel-orange" />
              Civil Society (NGOs)
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-2 rounded bg-white/5 border border-intel-border">
                <span className="text-[10px] text-white">I-Watch</span>
                <span className="text-[8px] text-intel-red font-mono">CRITICAL</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-white/5 border border-intel-border">
                <span className="text-[10px] text-white">LTDH</span>
                <span className="text-[8px] text-intel-orange font-mono">MONITORED</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
