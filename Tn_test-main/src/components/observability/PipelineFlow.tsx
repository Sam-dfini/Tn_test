import React from 'react';
import { motion } from 'motion/react';
import { Globe, FileText, Activity, CheckCircle2, ArrowRight } from 'lucide-react';

interface PipelineNodeProps {
  label: string;
  icon: any;
  count: number;
  status: 'OK' | 'WARNING' | 'FAIL';
  subLabel?: string;
}

const PipelineNode: React.FC<PipelineNodeProps> = ({ label, icon: Icon, count, status, subLabel }) => {
  const statusColors = {
    OK: 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400',
    WARNING: 'border-amber-500/50 bg-amber-500/10 text-amber-400',
    FAIL: 'border-red-500/50 bg-red-500/10 text-red-400',
  };

  const statusIcons = {
    OK: '✅',
    WARNING: '⚠️',
    FAIL: '❌',
  };

  return (
    <div className={`flex flex-col items-center p-4 rounded-xl border ${statusColors[status]} min-w-[140px] transition-all hover:scale-105`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-5 h-5 opacity-80" />
        <span className="text-[10px] uppercase font-bold tracking-widest opacity-60">{label}</span>
      </div>
      <div className="text-2xl font-mono font-bold mb-1">{count === 0 && status === 'OK' ? '--' : count.toLocaleString()}</div>
      <div className="flex items-center gap-1 text-[10px] font-mono">
        <span>{statusIcons[status]}</span>
        <span className="uppercase">{subLabel || status}</span>
      </div>
    </div>
  );
};

export const PipelineFlow: React.FC<{ metrics: any }> = ({ metrics }) => {
  const getStatus = (count: number, prevCount: number, type: string) => {
    if (type === 'NEWS' && metrics.feedCount > 0 && count === 0) return 'FAIL';
    if (type === 'EVENT' && metrics.signalCount > 0 && count === 0) return 'FAIL';
    if (metrics.errorRate > 0.3) return 'WARNING';
    return 'OK';
  };

  return (
    <div className="bg-[#0a0a0a] border border-white/5 rounded-xl p-6 flex flex-col">
      <h3 className="text-sm font-bold uppercase tracking-widest text-white/40 mb-6 flex items-center gap-2">
        <Activity className="w-4 h-4" />
        Intelligence Flow Logic
      </h3>
      
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-2 no-scrollbar">
        <PipelineNode 
          label="Feeds" 
          icon={Globe} 
          count={metrics.feedCount} 
          status="OK"
          subLabel={`${Math.round(metrics.ingestionRate)}/cycle`}
        />
        
        <ArrowRight className="w-6 h-6 text-white/10 shrink-0" />
        
        <PipelineNode 
          label="News" 
          icon={FileText} 
          count={metrics.newsCount} 
          status={getStatus(metrics.newsCount, metrics.feedCount, 'NEWS')}
        />
        
        <ArrowRight className="w-6 h-6 text-white/10 shrink-0" />
        
        <PipelineNode 
          label="Signals" 
          icon={Activity} 
          count={metrics.signalCount} 
          status="OK"
        />
        
        <ArrowRight className="w-6 h-6 text-white/10 shrink-0" />
        
        <PipelineNode 
          label="Events" 
          icon={CheckCircle2} 
          count={metrics.eventCount} 
          status={getStatus(metrics.eventCount, metrics.signalCount, 'EVENT')}
        />
      </div>
    </div>
  );
};
