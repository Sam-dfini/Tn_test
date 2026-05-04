import React from 'react';
import { motion } from 'motion/react';
import { UserX, ShieldAlert, Eye, Search, AlertCircle } from 'lucide-react';

const suspects = [
  { id: 'S011', name: 'Amel Aloui', role: 'Journalist', status: 'DETAINED', days: 142, risk: 'HIGH' },
  { id: 'S012', name: 'Ghazi Chaouachi', role: 'Politician', status: 'DETAINED', days: 385, risk: 'CRITICAL' },
  { id: 'S013', name: 'Noureddine Bhiri', role: 'Lawyer', status: 'DETAINED', days: 412, risk: 'CRITICAL' },
  { id: 'S014', name: 'Jaouhar Ben Mbarek', role: 'Activist', status: 'DETAINED', days: 385, risk: 'CRITICAL' },
];

export const Suspects: React.FC = () => {
  return (
    <div className="space-y-8">
      <div className="flex flex-col items-center text-center space-y-2">
        <h2 className="text-2xl tracking-tight">Surveillance & Suspects</h2>
        <p className="text-slate-500 text-sm">Monitoring of individuals under judicial or political surveillance</p>
        <div className="pt-4">
          <div className="flex items-center space-x-2 bg-intel-red/10 text-intel-red border border-intel-red/20 px-4 py-2 rounded-lg">
            <UserX className="w-4 h-4" />
            <span className="text-xs font-mono uppercase font-bold">23 Tracked Individuals</span>
          </div>
        </div>
      </div>

      <div className="glass overflow-x-auto rounded-2xl border border-intel-border">
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead>
            <tr className="bg-white/5 border-b border-intel-border">
              <th className="px-6 py-4 text-[10px] font-mono text-slate-500 uppercase tracking-widest">Individual</th>
              <th className="px-6 py-4 text-[10px] font-mono text-slate-500 uppercase tracking-widest">Status</th>
              <th className="px-6 py-4 text-[10px] font-mono text-slate-500 uppercase tracking-widest">Detention Clock</th>
              <th className="px-6 py-4 text-[10px] font-mono text-slate-500 uppercase tracking-widest">Risk Level</th>
              <th className="px-6 py-4 text-[10px] font-mono text-slate-500 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-intel-border">
            {suspects.map((s, i) => (
              <motion.tr 
                key={s.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="hover:bg-white/5 transition-colors group"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-intel-border flex items-center justify-center">
                      <UserX className="w-4 h-4 text-slate-500" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white uppercase">{s.name}</div>
                      <div className="text-[10px] font-mono text-slate-500 uppercase">{s.role}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="px-2 py-0.5 rounded bg-intel-red/10 text-intel-red border border-intel-red/20 text-[8px] font-mono font-bold uppercase">
                    {s.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-2">
                    <div className="text-xs font-bold font-mono text-white">{s.days}</div>
                    <span className="text-[10px] text-slate-500 uppercase">Days</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${s.risk === 'CRITICAL' ? 'bg-intel-red' : 'bg-intel-orange'}`}></div>
                    <span className={`text-[10px] font-mono font-bold ${s.risk === 'CRITICAL' ? 'text-intel-red' : 'text-intel-orange'}`}>
                      {s.risk}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end space-x-3">
                    <button className="p-1.5 text-slate-500 hover:text-intel-cyan transition-colors">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="p-1.5 text-slate-500 hover:text-intel-cyan transition-colors">
                      <Search className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
