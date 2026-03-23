import React from 'react';
import { 
  Activity, 
  MapPin, 
  Flame
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';
import { cn } from '../../utils/cn';

const protestData = [
  { month: 'Jan', count: 45, intensity: 60 },
  { month: 'Feb', count: 52, intensity: 65 },
  { month: 'Mar', count: 88, intensity: 80 },
  { month: 'Apr', count: 75, intensity: 70 },
  { month: 'May', count: 120, intensity: 90 },
  { month: 'Jun', count: 95, intensity: 75 },
  { month: 'Jul', count: 110, intensity: 85 },
  { month: 'Aug', count: 140, intensity: 95 },
  { month: 'Sep', count: 125, intensity: 88 },
  { month: 'Oct', count: 160, intensity: 98 },
  { month: 'Nov', count: 145, intensity: 92 },
  { month: 'Dec', count: 180, intensity: 100 },
];

const civilMovements = [
  { 
    name: 'UGTT (Labor Union)', 
    status: 'Tense Neutrality', 
    strength: 'Very High',
    focus: 'Economic Rights / Social Dialogue',
    risk: 'Moderate',
    desc: 'The most powerful social actor. Currently navigating a delicate path between regime support and defending workers\' rights amid IMF pressure.'
  },
  { 
    name: 'Resistance Coordination', 
    status: 'Active Opposition', 
    strength: 'Moderate',
    focus: 'Restoration of Democracy',
    risk: 'High',
    desc: 'A coalition of political parties and activists focused on reversing the July 25 measures and releasing political detainees.'
  },
  { 
    name: 'Student Unions (UGET)', 
    status: 'Fragmented', 
    strength: 'Low-Moderate',
    focus: 'Academic Freedom / Youth Rights',
    risk: 'Monitored',
    desc: 'Historically a breeding ground for dissent. Currently facing internal divisions and increased campus surveillance.'
  }
];

const protestDrivers = [
  { label: 'Economic Inflation', value: 45, color: 'bg-intel-orange' },
  { label: 'Political Detentions', value: 30, color: 'bg-intel-red' },
  { label: 'Public Service Decay', value: 15, color: 'bg-intel-cyan' },
  { label: 'Environmental Crisis', value: 10, color: 'bg-emerald-500' },
];

export const CivilMovements: React.FC = () => {
  return (
    <div className="p-3 md:p-4 space-y-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Protest Frequency Graph */}
        <div className="lg:col-span-8 glass p-5 md:p-6 rounded-2xl border border-intel-border/50 space-y-8">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <Activity className="w-5 h-5 text-intel-red" />
                <span>Civil Unrest & Protest Frequency</span>
              </h3>
              <p className="text-xs text-slate-500 uppercase font-mono">Monthly tracking of social movements & public demonstrations</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-intel-red font-mono">+120%</div>
              <div className="text-[8px] text-slate-500 uppercase font-mono">Quarterly Surge</div>
            </div>
          </div>

          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={protestData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis 
                  dataKey="month" 
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
                  itemStyle={{ color: '#ff4444', fontSize: '12px' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#ff4444" 
                  strokeWidth={3} 
                  dot={{ fill: '#ff4444', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                  name="Protest Count"
                />
                <Line 
                  type="monotone" 
                  dataKey="intensity" 
                  stroke="#f97316" 
                  strokeWidth={2} 
                  strokeDasharray="5 5"
                  dot={false}
                  name="Intensity Index"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-6 border-t border-intel-border">
            {[
              { label: 'Economic', value: '65%', color: 'text-intel-orange' },
              { label: 'Political', value: '25%', color: 'text-intel-red' },
              { label: 'Environmental', value: '10%', color: 'text-intel-cyan' }
            ].map(stat => (
              <div key={stat.label} className="text-center">
                <div className={cn("text-xl font-bold font-mono", stat.color)}>{stat.value}</div>
                <div className="text-[8px] text-slate-500 uppercase font-mono">{stat.label} Drivers</div>
              </div>
            ))}
          </div>
        </div>

        {/* Protest Hotspots */}
        <div className="lg:col-span-4 space-y-6">
          <div className="glass p-5 md:p-6 rounded-2xl border border-intel-border/50 space-y-6">
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <MapPin className="w-5 h-5 text-intel-cyan" />
                <span>Geographic Hotspots</span>
              </h3>
              <p className="text-xs text-slate-500 uppercase font-mono">Active areas of civil mobilization</p>
            </div>

            <div className="space-y-4">
              {[
                { region: 'Tunis (Capital)', intensity: 'High', focus: 'Political / Institutional' },
                { region: 'Sfax', intensity: 'Moderate', focus: 'Environmental / Economic' },
                { region: 'Gafsa (Mining Basin)', intensity: 'High', focus: 'Labor / Unemployment' },
                { region: 'Tataouine', intensity: 'Moderate', focus: 'Resource Allocation' },
                { region: 'Kasserine', intensity: 'High', focus: 'Social Marginalization' }
              ].map(spot => (
                <div key={spot.region} className="p-3 bg-black/20 rounded-lg border border-intel-border space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="text-sm font-bold text-white">{spot.region}</div>
                    <span className={cn(
                      "text-[8px] font-mono px-1.5 py-0.5 rounded border uppercase",
                      spot.intensity === 'High' ? "bg-intel-red/10 text-intel-red border-intel-red/20" : "bg-intel-orange/10 text-intel-orange border-intel-orange/20"
                    )}>
                      {spot.intensity}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono uppercase tracking-tight">Primary Focus: {spot.focus}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Protest Drivers Breakdown */}
          <div className="glass p-5 md:p-6 rounded-2xl border border-intel-border/50 space-y-4">
            <h4 className="text-xs font-bold text-white uppercase tracking-widest">Primary Protest Drivers</h4>
            <div className="space-y-4">
              {protestDrivers.map(driver => (
                <div key={driver.label} className="space-y-1">
                  <div className="flex justify-between text-[10px] font-mono">
                    <span className="text-slate-400">{driver.label}</span>
                    <span className="text-white">{driver.value}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div className={cn("h-full", driver.color)} style={{ width: `${driver.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Civil Movements Grid */}
      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <Flame className="w-6 h-6 text-intel-orange" />
          <h3 className="text-2xl font-bold text-white tracking-tight">Key Civil Actors & Movements</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {civilMovements.map(movement => (
            <div key={movement.name} className="glass p-5 md:p-6 rounded-2xl border border-intel-border/50 space-y-6 group hover:border-intel-orange/30 transition-all">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h4 className="text-xl font-bold text-white group-hover:text-intel-orange transition-colors">{movement.name}</h4>
                  <div className="text-[10px] text-intel-orange font-mono uppercase">{movement.focus}</div>
                </div>
                <div className={cn(
                  "text-[8px] font-mono px-2 py-1 rounded border uppercase",
                  movement.risk === 'High' ? "bg-intel-red/10 text-intel-red border-intel-red/20" : 
                  movement.risk === 'Moderate' ? "bg-intel-orange/10 text-intel-orange border-intel-orange/20" :
                  "bg-intel-cyan/10 text-intel-cyan border-intel-cyan/20"
                )}>
                  Risk: {movement.risk}
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-slate-500 uppercase font-mono">Current Status</span>
                  <span className="text-slate-300">{movement.status}</span>
                </div>
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-slate-500 uppercase font-mono">Mobilization Strength</span>
                  <span className="text-intel-cyan font-bold">{movement.strength}</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed pt-4 border-t border-intel-border">
                  {movement.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
