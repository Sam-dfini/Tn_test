import React from 'react';
import { cn } from '../../utils/cn';

const parties = [
  { 
    name: 'Ennahda', 
    leader: 'Rached Ghannouchi (Detained)', 
    status: 'Opposition / Under Investigation',
    ideology: 'Conservative / Islamist',
    base: 'Urban working class, rural south',
    risk: 'High',
    strength: 45,
    coalition: 'National Salvation Front',
    desc: 'Historically the most organized party, now facing systematic dismantling of its leadership structure.'
  },
  { 
    name: 'PDL (Free Destourian Party)', 
    leader: 'Abir Moussi (Detained)', 
    status: 'Opposition / Pro-Ben Ali Legacy',
    ideology: 'Secular / Destourian Nationalist',
    base: 'Coastal regions, former RCD base',
    risk: 'High',
    strength: 38,
    coalition: 'Independent',
    desc: 'Strongly opposed to both the current regime and Ennahda, representing the old guard of Tunisian politics.'
  },
  { 
    name: 'Echaab Movement', 
    leader: 'Zouhair Maghzaoui', 
    status: 'Critical Support / Pro-Regime',
    ideology: 'Arab Nationalist / Leftist',
    base: 'Unionists, student movements',
    risk: 'Low',
    strength: 15,
    coalition: 'Pro-July 25 Bloc',
    desc: 'One of the few parties that supported the July 25 measures, though now expressing nuanced criticism.'
  }
];

export const PartyDossier: React.FC = () => {
  return (
    <div className="p-3 md:p-4 space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {parties.map(party => (
          <div key={party.name} className="glass p-5 md:p-6 rounded-2xl border border-intel-border/50 space-y-6 group hover:border-intel-cyan/30 transition-all">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-white group-hover:text-intel-cyan transition-colors">{party.name}</h3>
                <div className="text-[10px] text-intel-cyan font-mono uppercase">{party.ideology}</div>
              </div>
              <div className={cn(
                "text-[8px] font-mono px-2 py-1 rounded border uppercase",
                party.risk === 'High' ? "bg-intel-red/10 text-intel-red border-intel-red/20" : "bg-intel-cyan/10 text-intel-cyan border-intel-cyan/20"
              )}>
                Risk: {party.risk}
              </div>
            </div>
            
              <div className="space-y-4">
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <div className="text-[8px] text-slate-500 uppercase font-mono">Electoral Strength</div>
                    <div className="text-[10px] text-white font-mono font-bold">{party.strength}%</div>
                  </div>
                  <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-intel-cyan" style={{ width: `${party.strength}%` }} />
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-[8px] text-slate-500 uppercase font-mono">Coalition Status</div>
                  <div className="text-xs text-intel-cyan font-bold">{party.coalition}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-[8px] text-slate-500 uppercase font-mono">Current Leader</div>
                  <div className="text-xs text-slate-300">{party.leader}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-[8px] text-slate-500 uppercase font-mono">Status</div>
                  <div className="text-xs text-slate-300">{party.status}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-[8px] text-slate-500 uppercase font-mono">Constituency</div>
                  <div className="text-xs text-slate-300">{party.base}</div>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed pt-4 border-t border-intel-border">
                  {party.desc}
                </p>
              </div>
          </div>
        ))}
      </div>
    </div>
  );
};
