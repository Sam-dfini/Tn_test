import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

type MetricColor = 'cyan' | 'red' | 'orange' | 'green' | 'white' | 'purple';

const colorMap: Record<MetricColor, { text: string; glow: string; ring: string }> = {
  cyan:   { text: 'text-intel-cyan',   glow: 'shadow-[0_0_16px_rgba(0,242,255,0.3)]',   ring: 'ring-intel-cyan/40' },
  red:    { text: 'text-intel-red',    glow: 'shadow-[0_0_16px_rgba(255,69,58,0.3)]',    ring: 'ring-intel-red/40' },
  orange: { text: 'text-intel-orange', glow: 'shadow-[0_0_16px_rgba(255,159,10,0.3)]',   ring: 'ring-intel-orange/40' },
  green:  { text: 'text-intel-green',  glow: 'shadow-[0_0_16px_rgba(50,215,75,0.3)]',    ring: 'ring-intel-green/40' },
  white:  { text: 'text-on-surface',        glow: 'shadow-[0_0_16px_rgba(255,255,255,0.1)]',  ring: 'ring-white/20' },
  purple: { text: 'text-intel-purple', glow: 'shadow-[0_0_16px_rgba(167,139,250,0.3)]',  ring: 'ring-intel-purple/40' },
};

export const MetricCard: React.FC<{
  label: string;
  value: string | number;
  sub?: string;
  color?: MetricColor;
  pulse?: boolean;
  trend?: 'up' | 'down' | 'flat';
  onClick?: () => void;
}> = ({ label, value, sub, color = 'white', pulse, trend, onClick }) => {
  const [flashing, setFlashing] = useState(false);
  const prevValue = useRef(value);
  const c = colorMap[color];

  useEffect(() => {
    if (prevValue.current !== value) {
      setFlashing(true);
      const timer = setTimeout(() => setFlashing(false), 1200);
      prevValue.current = value;
      return () => clearTimeout(timer);
    }
  }, [value]);

  return (
    <motion.div
      layout
      onClick={onClick}
      whileHover={onClick ? { scale: 1.01 } : {}}
      className={`glass-card p-4 space-y-1 transition-all duration-300 relative overflow-hidden ${
        onClick ? 'cursor-pointer' : ''
      } ${flashing ? `ring-1 ${c.ring} ${c.glow}` : ''}`}
    >
      {/* Flash overlay */}
      {flashing && (
        <motion.div
          initial={{ opacity: 0.2 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 1.2 }}
          className="absolute inset-0 pointer-events-none"
          style={{ background: `radial-gradient(circle at center, ${c.text.replace('text-', '')} 0%, transparent 70%)`, opacity: 0.06 }}
        />
      )}

      <div className="flex items-start justify-between gap-2">
        <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest leading-none">{label}</div>
        {trend && trend !== 'flat' && (
          <div className={`shrink-0 ${trend === 'up' ? 'text-intel-red' : 'text-intel-green'}`}>
            {trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          </div>
        )}
        {trend === 'flat' && <Minus className="w-3 h-3 text-slate-600 shrink-0" />}
      </div>

      <div className={`text-xl font-bold font-mono ${c.text} ${pulse ? 'animate-pulse' : ''}`}>
        {value}
      </div>

      {sub && (
        <div className="text-[9px] text-slate-600 leading-tight">{sub}</div>
      )}
    </motion.div>
  );
};
