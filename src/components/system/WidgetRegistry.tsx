import React from 'react';
import { motion } from 'motion/react';
import { 
  Activity, 
  BarChart3, 
  Droplets, 
  Flame, 
  Globe, 
  ShieldAlert, 
  TrendingUp, 
  Users 
} from 'lucide-react';

// --- Placeholder Widget Components ---

const PlaceholderWidget: React.FC<{ title: string; icon: any; color: string }> = ({ title, icon: Icon, color }) => (
  <div className="bg-black/40 border border-intel-border/50 rounded-xl p-4 flex flex-col h-40">
    <div className="flex items-center space-x-2 mb-4">
      <div className={`p-1.5 rounded bg-${color}/10 border border-${color}/20`}>
        <Icon className={`w-4 h-4 text-${color}`} />
      </div>
      <h4 className="text-[10px] font-bold text-white uppercase tracking-widest">{title}</h4>
    </div>
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center">
        <Activity className="w-8 h-8 text-slate-700 mx-auto mb-2 opacity-20" />
        <span className="text-[8px] font-mono text-slate-500 uppercase">Live Telemetry Feed</span>
      </div>
    </div>
    <div className="mt-2 h-1 w-full bg-white/5 rounded-full overflow-hidden">
      <motion.div 
        className={`h-full bg-${color}`}
        animate={{ width: ['20%', '60%', '40%', '80%'] }}
        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
      />
    </div>
  </div>
);

// --- Widget Registry Mapping ---

export const WIDGET_REGISTRY: Record<string, React.FC> = {
  // Food Security
  'bci-gauge': () => <PlaceholderWidget title="Bread Crisis Index (BCI)" icon={TrendingUp} color="intel-orange" />,
  'wheat-dependency': () => <PlaceholderWidget title="Wheat Import Dependency" icon={Globe} color="intel-cyan" />,
  'subsidy-burden': () => <PlaceholderWidget title="Subsidy Fiscal Burden" icon={BarChart3} color="intel-red" />,
  'flour-prices': () => <PlaceholderWidget title="Parallel Market Flour Prices" icon={Activity} color="intel-cyan" />,
  
  // Water Collapse
  'dam-capacity': () => <PlaceholderWidget title="National Dam Capacity" icon={Droplets} color="intel-cyan" />,
  'aquifer-status': () => <PlaceholderWidget title="Aquifer Depletion Rate" icon={Activity} color="intel-red" />,
  'water-grievance': () => <PlaceholderWidget title="Water Access Grievances" icon={Users} color="intel-orange" />,
  
  // Security / Elite
  'mii-index': () => <PlaceholderWidget title="Ministerial Instability Index (MII)" icon={ShieldAlert} color="intel-red" />,
  'elite-network': () => <PlaceholderWidget title="Elite Power Dynamics" icon={Users} color="intel-cyan" />,
  'coalition-health': () => <PlaceholderWidget title="Coalition Fragmentation" icon={Flame} color="intel-orange" />,
};

// --- Auto-Assembler Component ---

export const AutoAssembler: React.FC<{ widgetIds: string[] }> = ({ widgetIds }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {widgetIds.map(id => {
        const Widget = WIDGET_REGISTRY[id];
        if (!Widget) return (
          <div key={id} className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 h-40 flex items-center justify-center">
            <span className="text-[10px] font-mono text-red-400 uppercase">Widget Missing: {id}</span>
          </div>
        );
        return <Widget key={id} />;
      })}
    </div>
  );
};
