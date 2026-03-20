import React from 'react';
import { 
  Lock, 
  Users, 
  Info
} from 'lucide-react';
import { cn } from '../../utils/cn';

const censorshipMetrics = [
  { label: 'Self-Censorship', value: 85, color: 'bg-intel-red' },
  { label: 'Direct Interference', value: 60, color: 'bg-intel-orange' },
  { label: 'Legal Harassment', value: 75, color: 'bg-intel-red' },
];

export const FreedomIndex: React.FC = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
      <div className="space-y-8">
        <div className="space-y-4">
          <h3 className="text-2xl font-bold text-white tracking-tight">Institutional Erosion Report</h3>
          <p className="text-slate-400 leading-relaxed">
            The period following July 25, 2021, has seen a significant shift in the Tunisian institutional landscape. The concentration of power within the executive branch has led to a series of structural changes affecting political freedom.
          </p>
        </div>

        <div className="space-y-6">
          {[
            { title: 'Decree 54 Impact', desc: 'Used extensively to target digital dissent and investigative journalism under the guise of fighting "fake news".', risk: 'CRITICAL' },
            { title: 'Judicial Council Restructuring', desc: 'The dissolution of the Supreme Judicial Council has effectively placed the judiciary under executive oversight.', risk: 'HIGH' },
            { title: 'NGO Funding Restrictions', desc: 'New regulations targeting foreign funding for civil society organizations are being used to limit the scope of independent monitoring.', risk: 'MONITORED' }
          ].map(item => (
            <div key={item.title} className="p-6 rounded-2xl bg-white/5 border border-intel-border space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-white">{item.title}</h4>
                <span className="text-[8px] font-mono text-intel-red bg-intel-red/10 px-2 py-0.5 rounded border border-intel-red/20">{item.risk}</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-8">
        <div className="glass p-8 rounded-3xl border border-intel-border/50 space-y-6">
          <h3 className="text-lg font-bold text-white flex items-center space-x-2">
            <Lock className="w-5 h-5 text-intel-red" />
            <span>Detention Tracking</span>
          </h3>
          <div className="space-y-4">
            {[
              { name: 'Political Leaders', count: 24, status: 'Increasing' },
              { name: 'Journalists', count: 12, status: 'Stable' },
              { name: 'Business Executives', count: 8, status: 'Increasing' },
              { name: 'Civil Servants', count: 15, status: 'Stable' }
            ].map(item => (
              <div key={item.name} className="flex items-center justify-between p-4 bg-black/20 rounded-xl border border-intel-border">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-full bg-intel-red/10 flex items-center justify-center">
                    <Users className="w-5 h-5 text-intel-red" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">{item.name}</div>
                    <div className="text-[10px] text-slate-500 uppercase font-mono">{item.status} Trend</div>
                  </div>
                </div>
                <div className="text-2xl font-bold text-white font-mono">{item.count}</div>
              </div>
            ))}
          </div>
          <div className="pt-4 flex items-center space-x-2 text-[10px] text-slate-500 italic">
            <Info className="w-4 h-4" />
            <span>Data synthesized from OHCHR and local human rights monitoring groups.</span>
          </div>
        </div>

        {/* Media Censorship Index */}
        <div className="glass p-8 rounded-3xl border border-intel-border/50 space-y-6">
          <h3 className="text-lg font-bold text-white flex items-center space-x-2">
            <Lock className="w-5 h-5 text-intel-orange" />
            <span>Media Censorship Index</span>
          </h3>
          <div className="space-y-4">
            {censorshipMetrics.map(metric => (
              <div key={metric.label} className="space-y-1">
                <div className="flex justify-between text-[10px] font-mono">
                  <span className="text-slate-400">{metric.label}</span>
                  <span className="text-white">{metric.value}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div className={cn("h-full", metric.color)} style={{ width: `${metric.value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
