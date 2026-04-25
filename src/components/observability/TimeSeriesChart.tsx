import React from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

interface TimeSeriesChartProps {
  data: any[];
  dataKey: string;
  label: string;
  color: string;
  unit?: string;
}

export const TimeSeriesChart: React.FC<TimeSeriesChartProps> = ({ data, dataKey, label, color, unit }) => {
  if (!data || data.length === 0) return null;

  return (
    <div className="bg-[#0a0a0a] border border-white/5 rounded-xl p-4 flex flex-col h-[200px]">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-white/40">{label}</h3>
        {data.length > 0 && (
          <span className="text-xs font-mono font-bold" style={{ color }}>
            {data[data.length - 1][dataKey]}{unit}
          </span>
        )}
      </div>
      
      <div className="flex-1 w-full opacity-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id={`gradient-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={color} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
            <XAxis 
              dataKey="timestamp" 
              hide 
              type="number"
              domain={['dataMin', 'dataMax']}
            />
            <YAxis hide domain={[0, 'auto']} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#111', borderColor: 'rgba(255,255,255,0.1)', color: '#fff', fontSize: '10px' }}
              labelStyle={{ display: 'none' }}
              formatter={(value: any) => [`${value}${unit || ''}`, label]}
            />
            <Area 
              type="monotone" 
              dataKey={dataKey} 
              stroke={color} 
              strokeWidth={2}
              fillOpacity={1} 
              fill={`url(#gradient-${dataKey})`} 
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
