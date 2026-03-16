import React from 'react';
import { motion } from 'motion/react';
import { Briefcase, Clock, AlertCircle, Link2, CheckCircle2 } from 'lucide-react';

const cases = [
  { id: 'C004', title: 'Gafsa Phosphate Basin Unrest', status: 'ACTIVE', priority: 'HIGH', opened: '2025-06-01', classification: 'RESTRICTED' },
  { id: 'C005', title: 'Decree 54 Prosecutions', status: 'ACTIVE', priority: 'HIGH', opened: '2025-09-15', classification: 'CONFIDENTIAL' },
  { id: 'C006', title: 'Sfax Migration Crisis', status: 'MONITORED', priority: 'MEDIUM', opened: '2026-01-10', classification: 'RESTRICTED' },
  { id: 'C007', title: 'IMF Negotiation Deadlock', status: 'ACTIVE', priority: 'HIGH', opened: '2026-02-01', classification: 'CONFIDENTIAL' },
];

export const Cases: React.FC = () => {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl tracking-tight">Intelligence Cases</h2>
          <p className="text-slate-500 text-sm mt-1">Structured investigation files for high-impact political and security incidents</p>
        </div>
        <div className="flex items-center space-x-2 bg-intel-purple/10 text-intel-purple border border-intel-purple/20 px-4 py-2 rounded-lg">
          <Briefcase className="w-4 h-4" />
          <span className="text-xs font-mono uppercase font-bold">13 Case Files</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {cases.map((c, i) => (
          <motion.div 
            key={c.id}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            className="glass p-6 rounded-2xl border border-intel-border hover:border-intel-purple/30 transition-all group cursor-pointer"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-intel-purple/10 flex items-center justify-center border border-intel-purple/20">
                  <Briefcase className="w-5 h-5 text-intel-purple" />
                </div>
                <div>
                  <div className="text-[8px] font-mono text-slate-500 uppercase">{c.id} · {c.classification}</div>
                  <h4 className="text-white font-bold uppercase tracking-tight group-hover:text-intel-purple transition-colors">{c.title}</h4>
                </div>
              </div>
              <div className={`px-2 py-1 rounded text-[8px] font-mono font-bold border ${
                c.status === 'ACTIVE' ? 'bg-intel-red/10 text-intel-red border-intel-red/20' : 'bg-intel-orange/10 text-intel-orange border-intel-orange/20'
              }`}>
                {c.status}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 py-4 border-y border-intel-border/50">
              <div>
                <div className="text-[8px] font-mono text-slate-500 uppercase mb-1">Priority</div>
                <div className={`text-xs font-bold ${c.priority === 'HIGH' ? 'text-intel-red' : 'text-intel-orange'}`}>{c.priority}</div>
              </div>
              <div>
                <div className="text-[8px] font-mono text-slate-500 uppercase mb-1">Opened</div>
                <div className="text-xs font-bold text-white font-mono">{c.opened}</div>
              </div>
              <div>
                <div className="text-[8px] font-mono text-slate-500 uppercase mb-1">Linked Actors</div>
                <div className="text-xs font-bold text-intel-cyan font-mono">12</div>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                 <Clock className="w-3 h-3 text-slate-500" />
                 <span className="text-[10px] text-slate-500 uppercase">Last Update: 2h ago</span>
              </div>
              <Link2 className="w-4 h-4 text-slate-600 group-hover:text-intel-purple transition-colors" />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
