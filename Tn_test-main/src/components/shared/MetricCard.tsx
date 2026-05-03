import React, { useState, useEffect, useRef } from 'react';

export const MetricCard: React.FC<{
  label: string;
  value: string | number;
  sub?: string;
  color?: 'cyan' | 'red' | 'orange' | 'green' | 'white';
  pulse?: boolean;
  onClick?: () => void;
}> = ({ label, value, sub, color = 'white', pulse, onClick }) => {
  const [flashing, setFlashing] = useState(false);
  const prevValue = useRef(value);

  useEffect(() => {
    if (prevValue.current !== value) {
      setFlashing(true);
      const timer = setTimeout(() => setFlashing(false), 1000);
      prevValue.current = value;
      return () => clearTimeout(timer);
    }
  }, [value]);

  const colorMap = {
    cyan: 'text-intel-cyan',
    red: 'text-intel-red',
    orange: 'text-intel-orange',
    green: 'text-intel-green',
    white: 'text-white',
  };

  return (
    <div
      onClick={onClick}
      className={`glass p-4 rounded-2xl border border-intel-border space-y-1 transition-all duration-300 ${
        onClick ? 'cursor-pointer hover:border-intel-cyan/30' : ''
      } ${flashing ? 'ring-1 ring-yellow-400/50 bg-yellow-400/5' : ''}`}
    >
      <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">{label}</div>
      <div className={`text-xl font-bold font-mono ${colorMap[color]} ${pulse ? 'animate-pulse' : ''}`}>
        {value}
      </div>
      {sub && (
        <div className="text-[9px] text-slate-600">{sub}</div>
      )}
    </div>
  );
};
