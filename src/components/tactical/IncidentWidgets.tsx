import React from 'react';
import { Flame, Droplets, Car, UserX, ShieldAlert } from 'lucide-react';
import { usePipeline } from '../../context/PipelineContext';
import { cn } from '../../lib/utils';
import { prepareList, assertKey, getRenderKey } from '../../lib/keyUtils';

export const FireIncidentsWidget: React.FC = () => {
  const { data } = usePipeline();
  
  // Mock data for fire incidents if not in pipeline
  const fires = [
    { region: 'Jendouba', count: 12, severity: 'HIGH', trend: '+20%' },
    { region: 'Beja', count: 8, severity: 'MEDIUM', trend: '+5%' },
    { region: 'Bizerte', count: 5, severity: 'LOW', trend: '-10%' },
    { region: 'Kef', count: 4, severity: 'LOW', trend: '0%' },
  ];

  return (
    <div className="bg-black/40 border border-intel-border/30 rounded-xl p-3 space-y-3">
      <div className="flex items-center space-x-2 border-b border-intel-border/30 pb-2">
        <Flame className="w-4 h-4 text-intel-red" />
        <h3 className="text-[10px] font-mono font-bold text-white uppercase tracking-widest">Fire Incidents</h3>
      </div>
      <div className="space-y-2">
        {prepareList(fires).map((fire: any, idx) => (
          <div key={assertKey(getRenderKey(fire, idx, 'fire'))} className="flex items-center justify-between p-2 rounded bg-white/5 border border-white/5">
            <span className="text-[10px] font-mono text-slate-300">{fire.region}</span>
            <div className="flex items-center space-x-3">
              <span className="text-[10px] font-mono text-slate-500">{fire.trend}</span>
              <span className={cn(
                "text-[10px] font-mono font-bold px-1.5 py-0.5 rounded",
                fire.severity === 'HIGH' ? 'bg-intel-red/20 text-intel-red' :
                fire.severity === 'MEDIUM' ? 'bg-intel-orange/20 text-intel-orange' :
                'bg-intel-cyan/20 text-intel-cyan'
              )}>
                {fire.count}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const WaterCutsWidget: React.FC = () => {
  const { data } = usePipeline();
  
  const cuts = [
    { region: 'Gafsa', hours: 14, status: 'CRITICAL' },
    { region: 'Sfax', hours: 8, status: 'WARNING' },
    { region: 'Tataouine', hours: 6, status: 'WARNING' },
    { region: 'Gabes', hours: 4, status: 'MONITOR' },
  ];

  return (
    <div className="bg-black/40 border border-intel-border/30 rounded-xl p-3 space-y-3">
      <div className="flex items-center space-x-2 border-b border-intel-border/30 pb-2">
        <Droplets className="w-4 h-4 text-intel-cyan" />
        <h3 className="text-[10px] font-mono font-bold text-white uppercase tracking-widest">Water Cuts</h3>
      </div>
      <div className="space-y-2">
        {prepareList(cuts).map((cut: any, idx) => (
          <div key={assertKey(getRenderKey(cut, idx, 'cut'))} className="flex items-center justify-between p-2 rounded bg-white/5 border border-white/5">
            <span className="text-[10px] font-mono text-slate-300">{cut.region}</span>
            <div className="flex items-center space-x-3">
              <span className="text-[9px] font-mono text-slate-500">{cut.hours}h/day</span>
              <span className={cn(
                "w-2 h-2 rounded-full",
                cut.status === 'CRITICAL' ? 'bg-intel-red animate-pulse' :
                cut.status === 'WARNING' ? 'bg-intel-orange' :
                'bg-intel-cyan'
              )} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const RoadAccidentsWidget: React.FC = () => {
  const accidents = [
    { route: 'A1 (Tunis-Sousse)', count: 24, severity: 'HIGH' },
    { route: 'RN3 (Tunis-Gafsa)', count: 18, severity: 'HIGH' },
    { route: 'A3 (Tunis-Beja)', count: 12, severity: 'MEDIUM' },
    { route: 'RN1 (Sfax-Gabes)', count: 9, severity: 'LOW' },
  ];

  return (
    <div className="bg-black/40 border border-intel-border/30 rounded-xl p-3 space-y-3">
      <div className="flex items-center space-x-2 border-b border-intel-border/30 pb-2">
        <Car className="w-4 h-4 text-intel-orange" />
        <h3 className="text-[10px] font-mono font-bold text-white uppercase tracking-widest">Road Accidents</h3>
      </div>
      <div className="space-y-2">
        {prepareList(accidents).map((acc: any, idx) => (
          <div key={assertKey(getRenderKey(acc, idx, 'acc'))} className="flex flex-col p-2 rounded bg-white/5 border border-white/5 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-mono text-slate-300 truncate">{acc.route}</span>
              <span className={cn(
                "text-[10px] font-mono font-bold",
                acc.severity === 'HIGH' ? 'text-intel-red' :
                acc.severity === 'MEDIUM' ? 'text-intel-orange' :
                'text-intel-cyan'
              )}>
                {acc.count}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const SuicidesWidget: React.FC = () => {
  const suicides = [
    { region: 'Kairouan', count: 15, trend: 'RISING' },
    { region: 'Sidi Bouzid', count: 11, trend: 'STABLE' },
    { region: 'Gafsa', count: 8, trend: 'RISING' },
    { region: 'Kasserine', count: 7, trend: 'STABLE' },
  ];

  return (
    <div className="bg-black/40 border border-intel-border/30 rounded-xl p-3 space-y-3">
      <div className="flex items-center space-x-2 border-b border-intel-border/30 pb-2">
        <UserX className="w-4 h-4 text-slate-400" />
        <h3 className="text-[10px] font-mono font-bold text-white uppercase tracking-widest">Suicide Intel</h3>
      </div>
      <div className="space-y-2">
        {prepareList(suicides).map((item: any, idx) => (
          <div key={assertKey(getRenderKey(item, idx, 'sui'))} className="flex items-center justify-between p-2 rounded bg-white/5 border border-white/5">
            <span className="text-[10px] font-mono text-slate-300">{item.region}</span>
            <div className="flex items-center space-x-3">
              <span className={cn(
                "text-[8px] font-mono px-1 rounded",
                item.trend === 'RISING' ? 'bg-intel-red/20 text-intel-red' : 'bg-slate-800 text-slate-400'
              )}>
                {item.trend}
              </span>
              <span className="text-[10px] font-mono font-bold text-white">
                {item.count}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const ViolenceWidget: React.FC = () => {
  const violence = [
    { type: 'Urban Clashes', regions: ['Tunis', 'Sfax'], level: 'HIGH' },
    { type: 'Stadium Violence', regions: ['Rades', 'Sousse'], level: 'CRITICAL' },
    { type: 'School Violence', regions: ['National'], level: 'MEDIUM' },
  ];

  return (
    <div className="bg-black/40 border border-intel-border/30 rounded-xl p-3 space-y-3">
      <div className="flex items-center space-x-2 border-b border-intel-border/30 pb-2">
        <ShieldAlert className="w-4 h-4 text-intel-red" />
        <h3 className="text-[10px] font-mono font-bold text-white uppercase tracking-widest">Violence / Crime</h3>
      </div>
      <div className="space-y-2">
        {prepareList(violence).map((item: any, idx) => (
          <div key={assertKey(getRenderKey(item, idx, 'vio'))} className="flex flex-col p-2 rounded bg-white/5 border border-white/5 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-slate-300">{item.type}</span>
              <span className={cn(
                "text-[8px] font-mono px-1.5 py-0.5 rounded",
                item.level === 'CRITICAL' ? 'bg-intel-red text-white' :
                item.level === 'HIGH' ? 'bg-intel-red/20 text-intel-red' :
                'bg-intel-orange/20 text-intel-orange'
              )}>
                {item.level}
              </span>
            </div>
            <div className="text-[8px] font-mono text-slate-500">
              {item.regions.join(', ')}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
