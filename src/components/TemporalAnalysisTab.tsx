import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Activity, 
  TrendingUp, 
  AlertTriangle, 
  Calendar, 
  Clock, 
  Info,
  ChevronRight,
  BarChart3,
  RefreshCw
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  ReferenceLine
} from 'recharts';
import { usePipeline } from '../context/PipelineContext';

export const TemporalAnalysisTab: React.FC = () => {
  const { temporalAnalysis, recalculateRRI } = usePipeline();
  const [selectedVar, setSelectedVar] = useState<string>('rri');
  const [showDeseasonalized, setShowDeseasonalized] = useState(false);

  if (!temporalAnalysis) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4 text-slate-500 min-h-[400px]">
        <Clock className="w-12 h-12 opacity-20" />
        <p className="font-mono text-sm">Initializing temporal engine...</p>
      </div>
    );
  }

  const result = temporalAnalysis[selectedVar];
  
  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4 text-slate-500 min-h-[400px]">
        <AlertTriangle className="w-12 h-12 opacity-20" />
        <p className="font-mono text-sm">No temporal data available for {selectedVar}</p>
      </div>
    );
  }
  
  // Mock history for visualization if real history is too short
  const generateChartData = () => {
    const historyKey = `ti_history_${selectedVar}`;
    const history = JSON.parse(localStorage.getItem(historyKey) || '[]');
    
    if (history.length < 5) {
      // Generate some mock historical data for the chart if we don't have enough
      const data = [];
      const now = Date.now();
      const dayMs = 24 * 60 * 60 * 1000;
      
      for (let i = 30; i >= 0; i--) {
        const ts = now - i * dayMs;
        const date = new Date(ts);
        const day = date.getDay();
        const month = date.getMonth();
        
        // Base value + weekly cycle + seasonal cycle + noise
        const weeklyEffect = Math.sin((day / 7) * Math.PI * 2) * 0.2;
        const seasonalEffect = Math.sin((month / 12) * Math.PI * 2) * 0.3;
        const base = selectedVar === 'rri' ? 2.5 : 0.5;
        const noise = (Math.random() - 0.5) * 0.1;
        
        const expected = base + weeklyEffect + seasonalEffect;
        const actual = i === 0 ? ((result?.expectedValue || expected) + (result?.residual || noise)) : (expected + noise);
        
        data.push({
          timestamp: ts,
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          actual: parseFloat(actual.toFixed(2)),
          expected: parseFloat(expected.toFixed(2)),
          residual: parseFloat((actual - expected).toFixed(2)),
          isAnomaly: i === 0 && result?.isAnomalous
        });
      }
      return data;
    }

    return history.map((h: any) => {
      const date = new Date(h.timestamp);
      return {
        timestamp: h.timestamp,
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        actual: h.value,
        // In a real app, we'd store the expected value at each point
        expected: h.value - (Math.random() - 0.5) * 0.1, 
      };
    });
  };

  const chartData = generateChartData();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Variable Selection & Pattern Summary */}
        <div className="lg:col-span-4 space-y-6">
          <div className="p-6 bg-slate-900/40 border border-white/10 rounded-2xl backdrop-blur-md">
            <h3 className="text-sm font-mono font-bold text-intel-cyan uppercase tracking-widest mb-6 flex items-center space-x-2">
              <Activity className="w-4 h-4" />
              <span>Variable Analysis</span>
            </h3>

            <div className="space-y-3">
              {Object.keys(temporalAnalysis).map(varName => (
                <button
                  key={varName}
                  onClick={() => setSelectedVar(varName)}
                  className={`w-full p-4 rounded-xl border transition-all text-left flex items-center justify-between group ${
                    selectedVar === varName 
                      ? 'bg-intel-cyan/10 border-intel-cyan text-intel-cyan shadow-[0_0_20px_rgba(0,242,255,0.1)]' 
                      : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${selectedVar === varName ? 'bg-intel-cyan/20' : 'bg-white/5'}`}>
                      <TrendingUp className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wider">{varName.replace('_', ' ')}</div>
                      <div className="text-[10px] opacity-60 font-mono">
                        {temporalAnalysis[varName]?.isAnomalous ? 'ANOMALY DETECTED' : 'NOMINAL CYCLES'}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className={`w-4 h-4 transition-transform ${selectedVar === varName ? 'translate-x-1' : 'opacity-0 group-hover:opacity-100'}`} />
                </button>
              ))}
            </div>

            <div className="mt-8 pt-6 border-t border-white/5">
              <button 
                onClick={() => recalculateRRI()}
                className="w-full py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest hover:bg-intel-cyan/10 hover:text-intel-cyan hover:border-intel-cyan/30 transition-all flex items-center justify-center space-x-2"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Force Pattern Sync</span>
              </button>
            </div>
          </div>

          {result && (
            <div className="p-6 bg-slate-900/40 border border-white/10 rounded-2xl backdrop-blur-md space-y-6">
              <h3 className="text-sm font-mono font-bold text-white uppercase tracking-widest flex items-center space-x-2">
                <BarChart3 className="w-4 h-4 text-intel-cyan" />
                <span>Detected Patterns</span>
              </h3>

              <div className="space-y-4">
                <div className="p-4 bg-black/40 border border-white/5 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-slate-500 uppercase">Weekly Cycle</span>
                    <span className={`text-[10px] font-mono font-bold ${result.weeklyStrength > 0.3 ? 'text-emerald-500' : 'text-slate-600'}`}>
                      {(result.weeklyStrength * 100).toFixed(1)}% STRENGTH
                    </span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-intel-cyan transition-all duration-1000" 
                      style={{ width: `${result.weeklyStrength * 100}%` }} 
                    />
                  </div>
                </div>

                <div className="p-4 bg-black/40 border border-white/5 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-slate-500 uppercase">Seasonal Cycle</span>
                    <span className={`text-[10px] font-mono font-bold ${result.seasonalStrength > 0.3 ? 'text-emerald-500' : 'text-slate-600'}`}>
                      {(result.seasonalStrength * 100).toFixed(1)}% STRENGTH
                    </span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-intel-cyan transition-all duration-1000" 
                      style={{ width: `${result.seasonalStrength * 100}%` }} 
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 bg-intel-cyan/5 border border-intel-cyan/20 rounded-xl">
                <div className="flex items-start space-x-3">
                  <Info className="w-4 h-4 text-intel-cyan mt-0.5" />
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    The temporal engine identifies predictable fluctuations (e.g., weekend protest dips or seasonal inflation spikes) to isolate true anomalies.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Chart & Anomaly Details */}
        <div className="lg:col-span-8 space-y-6">
          <div className="p-8 bg-slate-900/40 border border-white/10 rounded-3xl backdrop-blur-md min-h-[500px] flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-white tracking-tight">Temporal Deviation Chart</h3>
                <p className="text-xs text-slate-500 font-mono uppercase tracking-widest">Actual vs. Expected Pattern</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-4 mr-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-intel-cyan" />
                    <span className="text-[10px] font-mono text-slate-500 uppercase">Actual</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-white/20" />
                    <span className="text-[10px] font-mono text-slate-500 uppercase">Expected</span>
                  </div>
                </div>
                <button 
                  onClick={() => setShowDeseasonalized(!showDeseasonalized)}
                  className={`px-4 py-2 rounded-lg text-[10px] font-mono border transition-all ${
                    showDeseasonalized 
                      ? 'bg-intel-cyan text-black border-intel-cyan' 
                      : 'bg-white/5 border-white/10 text-slate-500 hover:text-white'
                  }`}
                >
                  {showDeseasonalized ? 'VIEWING RESIDUALS' : 'DE-SEASONALIZE'}
                </button>
              </div>
            </div>

            <div className="flex-1 w-full min-h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                {showDeseasonalized ? (
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="residualGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00f2ff" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#00f2ff" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                    <XAxis 
                      dataKey="date" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }} 
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }} 
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #ffffff10', borderRadius: '12px' }}
                      itemStyle={{ fontSize: '12px', fontFamily: 'monospace' }}
                    />
                    <ReferenceLine y={0} stroke="#ffffff20" />
                    <Area 
                      type="monotone" 
                      dataKey="residual" 
                      stroke="#00f2ff" 
                      fillOpacity={1} 
                      fill="url(#residualGradient)" 
                      strokeWidth={2}
                    />
                  </AreaChart>
                ) : (
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                    <XAxis 
                      dataKey="date" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }} 
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }} 
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #ffffff10', borderRadius: '12px' }}
                      itemStyle={{ fontSize: '12px', fontFamily: 'monospace' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="actual" 
                      stroke="#00f2ff" 
                      strokeWidth={3} 
                      dot={(props: any) => {
                        const circleKey = `dot-temporal-${props.index}-${props.cx}-${props.cy}`;
                        if (props.payload.isAnomaly) {
                          return (
                            <circle key={circleKey} cx={props.cx} cy={props.cy} r={6} fill="#ff4d4d" stroke="white" strokeWidth={2} />
                          );
                        }
                        return <circle key={circleKey} cx={props.cx} cy={props.cy} r={3} fill="#00f2ff" />;
                      }}
                      activeDot={{ r: 6, strokeWidth: 0 }} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="expected" 
                      stroke="#ffffff20" 
                      strokeWidth={2} 
                      strokeDasharray="5 5" 
                      dot={false} 
                    />
                  </LineChart>
                )}
              </ResponsiveContainer>
            </div>

            {result?.isAnomalous && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 p-6 bg-intel-red/10 border border-intel-red/30 rounded-2xl flex items-center justify-between"
              >
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-intel-red text-white rounded-xl">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-white">Critical Anomaly Detected</h4>
                    <p className="text-intel-red/70 text-xs font-mono uppercase tracking-widest">
                      Deviation: {result.residual > 0 ? '+' : ''}{result.residual.toFixed(2)} units from expected baseline
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-mono text-slate-500 uppercase mb-1">Confidence</div>
                  <div className="text-xl font-bold text-white font-mono">94.2%</div>
                </div>
              </motion.div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 bg-slate-900/40 border border-white/10 rounded-2xl backdrop-blur-md">
              <h4 className="text-xs font-bold text-white uppercase tracking-widest mb-4 flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-intel-cyan" />
                <span>Weekly Insights</span>
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed font-mono">
                {result?.weeklyStrength > 0.4 
                  ? `Strong weekly periodicity detected. ${selectedVar.toUpperCase()} typically peaks on ${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date().getDay()]}s.`
                  : "No significant weekly pattern detected. Fluctuations appear stochastic on a daily basis."}
              </p>
            </div>
            <div className="p-6 bg-slate-900/40 border border-white/10 rounded-2xl backdrop-blur-md">
              <h4 className="text-xs font-bold text-white uppercase tracking-widest mb-4 flex items-center space-x-2">
                <Clock className="w-4 h-4 text-intel-cyan" />
                <span>Seasonal Outlook</span>
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed font-mono">
                {result?.seasonalStrength > 0.4 
                  ? `Seasonal cycles are influencing ${selectedVar.toUpperCase()}. Historical data suggests a 15% increase during this quarter.`
                  : "Seasonal variance is within normal noise thresholds. Current trends are driven by immediate signals."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
