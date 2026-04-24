import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import clsx from 'clsx';

interface KpiCardProps {
  title: string;
  value: number;
  status: 'STABLE' | 'ELEVATED' | 'HIGH' | 'CRITICAL' | 'ACTIVE';
  trend: number;
  format?: 'decimal' | 'percentage';
  glow?: boolean;
}

function KpiCard({ title, value, status, trend, format = 'decimal', glow = false }: KpiCardProps) {
  const isCritical = status === 'CRITICAL';
  const isHigh = status === 'HIGH';
  const isElevated = status === 'ELEVATED';
  const isActive = status === 'ACTIVE';

  const dotColor = isCritical ? 'bg-[#ef4444]' : isHigh ? 'bg-[#f97316]' : isElevated ? 'bg-[#f59e0b]' : isActive ? 'bg-[#ef4444]' : 'bg-[#10b981]';
  const textColor = isCritical ? 'text-[#ef4444]' : isHigh ? 'text-[#f97316]' : isElevated ? 'text-[#f59e0b]' : isActive ? 'text-[#ef4444]' : 'text-[#10b981]';
  
  const formattedValue = format === 'percentage' ? `${(value * 100).toFixed(0)}%` : value.toFixed(2);
  const trendColor = trend > 0 ? (title.includes('STRESS') || title.includes('INDEX') ? 'text-[#ef4444]' : 'text-[#10b981]') : trend < 0 ? (title.includes('STRESS') || title.includes('INDEX') ? 'text-[#10b981]' : 'text-[#ef4444]') : 'text-[#94a3b8]';
  const TrendIcon = trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus;

  return (
    <div className={clsx(
      "relative flex flex-col justify-between overflow-hidden rounded-lg border border-[#1e3a5f] bg-[#111827] p-4 transition-all duration-300 hover:border-[#3b82f6]",
      glow && isHigh && "shadow-[0_0_15px_rgba(249,115,22,0.15)]",
      glow && isCritical && "shadow-[0_0_15px_rgba(239,68,68,0.2)]"
    )}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative flex h-3 w-3">
            {isCritical && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#ef4444] opacity-75"></span>}
            <span className={clsx("relative inline-flex h-3 w-3 rounded-full", dotColor)}></span>
          </div>
          <span className={clsx("text-xs font-bold tracking-wider", textColor)}>
            {status}
          </span>
        </div>
        <div className={clsx("flex items-center gap-1 text-xs font-medium", trendColor)}>
          <TrendIcon className="h-3 w-3" />
          <span>{Math.abs(trend)}%</span>
        </div>
      </div>
      
      <div className="my-2">
        <span className="font-mono text-4xl font-bold tracking-tight text-[#f1f5f9]">
          {formattedValue}
        </span>
      </div>
      
      <div>
        <span className="text-xs font-semibold uppercase tracking-wider text-[#94a3b8]">
          {title}
        </span>
      </div>
    </div>
  );
}

export default function KpiRow() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard 
        title="AGRO STRESS INDEX" 
        value={0.72} 
        status="CRITICAL" 
        trend={12} 
        glow={true}
      />
      <KpiCard 
        title="WATER INDEX" 
        value={0.41} 
        status="ELEVATED" 
        trend={-5} 
      />
      <KpiCard 
        title="PROTEIN STRESS" 
        value={0.65} 
        status="HIGH" 
        trend={8} 
        glow={true}
      />
      <KpiCard 
        title="BLACK MARKET INDEX" 
        value={0.58} 
        status="ACTIVE" 
        trend={15} 
        glow={true}
      />
    </div>
  );
}
