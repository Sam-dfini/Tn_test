import React from 'react';
import { motion } from 'motion/react';
import { Users, Network, Shield, Link2, ExternalLink } from 'lucide-react';

const actors = [
  { id: 'saied', name: 'Kais Saied', role: 'President', faction: 'REGIME', influence: 0.95, defection: 0.05, threat: 'ACTIVE' },
  { id: 'taboubi', name: 'Noureddine Taboubi', role: 'UGTT Sec Gen', faction: 'LABOUR', influence: 0.82, defection: 0.45, threat: 'ACTIVE' },
  { id: 'ghannouchi', name: 'Rached Ghannouchi', role: 'Ennahdha Leader', faction: 'OPPOSITION', influence: 0.45, defection: 0.15, threat: 'DETAINED' },
  { id: 'moussi', name: 'Abir Moussi', role: 'PDL Leader', faction: 'OPPOSITION', influence: 0.38, defection: 0.10, threat: 'DETAINED' },
];

export const Actors: React.FC = () => {
  return (
    <div className="space-y-8">
      <div className="flex flex-col items-center text-center space-y-2">
        <h2 className="text-2xl tracking-tight">Actor Network</h2>
        <p className="text-slate-500 text-sm">Influence mapping and defection risk monitoring of key political figures</p>
        <div className="pt-4">
          <button className="flex items-center space-x-2 bg-intel-cyan/10 text-intel-cyan border border-intel-cyan/30 px-4 py-2 rounded-lg hover:bg-intel-cyan/20 transition-all">
            <Network className="w-4 h-4" />
            <span className="text-xs font-mono uppercase font-bold">View Influence Graph</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {actors.map((actor, i) => (
          <motion.div 
            key={actor.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass p-6 rounded-2xl border border-intel-border hover:border-intel-cyan/30 transition-all group"
          >
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-intel-border flex items-center justify-center overflow-hidden border border-intel-border group-hover:border-intel-cyan/50 transition-colors">
                <Users className="w-6 h-6 text-slate-500" />
              </div>
              <div>
                <h4 className="text-white font-bold uppercase tracking-tight">{actor.name}</h4>
                <div className="text-[10px] font-mono text-slate-500 uppercase">{actor.role}</div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-[8px] mb-1">
                  <span className="text-slate-500 uppercase">Influence Score</span>
                  <span className="text-intel-cyan font-mono">{(actor.influence * 100).toFixed(0)}%</span>
                </div>
                <div className="h-1 w-full bg-intel-border rounded-full overflow-hidden">
                  <div className="h-full bg-intel-cyan" style={{ width: `${actor.influence * 100}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[8px] mb-1">
                  <span className="text-slate-500 uppercase">Defection Risk</span>
                  <span className="text-intel-orange font-mono">{(actor.defection * 100).toFixed(0)}%</span>
                </div>
                <div className="h-1 w-full bg-intel-border rounded-full overflow-hidden">
                  <div className="h-full bg-intel-orange" style={{ width: `${actor.defection * 100}%` }}></div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-intel-border flex items-center justify-between">
              <div className={`px-2 py-0.5 rounded text-[8px] font-mono font-bold border ${
                actor.threat === 'ACTIVE' ? 'bg-intel-red/10 text-intel-red border-intel-red/20' : 'bg-intel-orange/10 text-intel-orange border-intel-orange/20'
              }`}>
                {actor.threat}
              </div>
              <button className="text-slate-500 hover:text-intel-cyan transition-colors">
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="glass p-8 rounded-2xl">
        <h3 className="text-sm tracking-widest mb-6 flex items-center">
          <Link2 className="w-4 h-4 mr-2 text-intel-cyan" />
          Recent Actor Activity
        </h3>
        <div className="space-y-4">
          {[
            { date: '2026-03-15', actor: 'Kais Saied', text: 'Issued decree expanding security sector oversight.' },
            { date: '2026-03-14', actor: 'Noureddine Taboubi', text: 'Publicly criticized IMF subsidy reform proposals.' },
            { date: '2026-03-12', actor: 'Abir Moussi', text: 'Legal team filed appeal against detention extension.' },
          ].map((item, i) => (
            <div key={i} className="flex items-start space-x-4 p-4 bg-white/5 rounded-xl border border-intel-border">
              <div className="text-[10px] font-mono text-slate-500 w-24 shrink-0">{item.date}</div>
              <div className="text-xs">
                <span className="text-intel-cyan font-bold uppercase mr-2">{item.actor}:</span>
                <span className="text-slate-300">{item.text}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
