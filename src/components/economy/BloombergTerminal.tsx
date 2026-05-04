import React from 'react';
import { motion } from 'motion/react';
import { TrendingUp, TrendingDown, Activity, DollarSign, BarChart2, Globe, Zap, FileText } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, YAxis, XAxis, Tooltip, CartesianGrid } from 'recharts';

interface BloombergTerminalProps {
  onOpenAI: () => void;
  onOpenPipeline: () => void;
  onGoHome: () => void;
  onOpenReport: () => void;
  context?: any;
}

const mockMarketData = [
  { time: '09:00', value: 3.12 },
  { time: '10:00', value: 3.14 },
  { time: '11:00', value: 3.11 },
  { time: '12:00', value: 3.15 },
  { time: '13:00', value: 3.18 },
  { time: '14:00', value: 3.16 },
  { time: '15:00', value: 3.20 },
];

export const BloombergTerminal: React.FC<BloombergTerminalProps> = ({
  onOpenAI,
  onOpenPipeline,
  onGoHome,
  onOpenReport,
  context
}) => {
  return (
    <div className="min-h-screen bg-black text-emerald-500 font-mono">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-black border-b border-emerald-900 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button onClick={onGoHome} className="text-emerald-500 hover:text-emerald-400 transition-colors">
            <Activity className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-emerald-400 tracking-widest uppercase">TERMINAL <span className="text-emerald-600">PRO</span></h1>
          </div>
        </div>
        <div className="flex items-center space-x-4 text-xs">
          <div className="flex items-center space-x-2">
            <span className="text-emerald-700">TND/USD</span>
            <span className="text-emerald-400">3.18</span>
            <TrendingUp className="w-3 h-3 text-emerald-400" />
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-emerald-700">TND/EUR</span>
            <span className="text-emerald-400">3.42</span>
            <TrendingDown className="w-3 h-3 text-red-500" />
          </div>
          <button onClick={onOpenPipeline} className="p-1.5 rounded bg-emerald-900/30 text-emerald-500 hover:bg-emerald-900/50 transition-colors">
            <Database className="w-4 h-4" />
          </button>
          <button onClick={onOpenAI} className="p-1.5 rounded bg-emerald-900/30 text-emerald-500 hover:bg-emerald-900/50 transition-colors">
            <Zap className="w-4 h-4" />
          </button>
          <button onClick={onOpenReport} className="p-1.5 rounded bg-emerald-900/30 text-emerald-500 hover:bg-emerald-900/50 transition-colors">
            <FileText className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Left Column - Market Overview */}
        <div className="lg:col-span-1 space-y-4">
          <div className="border border-emerald-900 bg-black p-4">
            <h2 className="text-xs font-bold text-emerald-600 uppercase mb-3 flex items-center">
              <Globe className="w-3 h-3 mr-2" />
              Macro Indicators
            </h2>
            <div className="space-y-2">
              {[
                { label: 'Inflation Rate', value: '7.8%', trend: 'up' },
                { label: 'Policy Rate', value: '8.0%', trend: 'flat' },
                { label: 'FX Reserves', value: '112 Days', trend: 'down' },
                { label: 'GDP Growth (Est)', value: '1.2%', trend: 'flat' }
              ].map((ind, i) => (
                <div key={i} className="flex justify-between items-center text-sm border-b border-emerald-900/50 pb-1">
                  <span className="text-emerald-700">{ind.label}</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-emerald-400">{ind.value}</span>
                    {ind.trend === 'up' && <TrendingUp className="w-3 h-3 text-red-500" />}
                    {ind.trend === 'down' && <TrendingDown className="w-3 h-3 text-emerald-500" />}
                    {ind.trend === 'flat' && <span className="text-emerald-600">-</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border border-emerald-900 bg-black p-4">
            <h2 className="text-xs font-bold text-emerald-600 uppercase mb-3 flex items-center">
              <DollarSign className="w-3 h-3 mr-2" />
              Sovereign Debt
            </h2>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-emerald-700">10Y Yield</span>
                <span className="text-emerald-400">12.4%</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-emerald-700">Spread vs US</span>
                <span className="text-emerald-400">+820 bps</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-emerald-700">CDS 5Y</span>
                <span className="text-emerald-400">950 bps</span>
              </div>
            </div>
          </div>
        </div>

        {/* Middle Column - Charts & News */}
        <div className="lg:col-span-2 space-y-4">
          <div className="border border-emerald-900 bg-black p-4 h-[300px] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xs font-bold text-emerald-600 uppercase flex items-center">
                <BarChart2 className="w-3 h-3 mr-2" />
                TND/USD Exchange Rate (Intraday)
              </h2>
              <div className="text-xs text-emerald-700">LIVE</div>
            </div>
            <div className="flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mockMarketData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#064e3b" vertical={false} />
                  <XAxis dataKey="time" stroke="#064e3b" tick={{ fill: '#047857', fontSize: 10 }} />
                  <YAxis domain={['dataMin - 0.05', 'dataMax + 0.05']} stroke="#064e3b" tick={{ fill: '#047857', fontSize: 10 }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#000', borderColor: '#064e3b', color: '#10b981' }}
                    itemStyle={{ color: '#10b981' }}
                  />
                  <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="border border-emerald-900 bg-black p-4">
            <h2 className="text-xs font-bold text-emerald-600 uppercase mb-3">Market News Wire</h2>
            <div className="space-y-3">
              {[
                { time: '15:42', headline: 'CENTRAL BANK MAINTAINS KEY RATE AT 8.0%', impact: 'HIGH' },
                { time: '14:15', headline: 'PHOSPHATE PRODUCTION UP 12% YOY IN Q1', impact: 'MEDIUM' },
                { time: '11:30', headline: 'IMF DISCUSSIONS RESUME IN WASHINGTON', impact: 'HIGH' },
                { time: '09:05', headline: 'TRADE DEFICIT NARROWS BY 4% IN MARCH', impact: 'LOW' }
              ].map((news, i) => (
                <div key={i} className="flex items-start space-x-3 text-sm border-b border-emerald-900/30 pb-2">
                  <span className="text-emerald-700 w-12">{news.time}</span>
                  <span className="text-emerald-400 flex-1">{news.headline}</span>
                  <span className={`text-[10px] px-1 ${news.impact === 'HIGH' ? 'bg-red-900/50 text-red-400' : 'text-emerald-600'}`}>
                    {news.impact}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Supply Chain & Sector Data */}
        <div className="lg:col-span-1 space-y-4">
          <div className="border border-emerald-900 bg-black p-4">
            <h2 className="text-xs font-bold text-emerald-600 uppercase mb-3">Commodity Prices</h2>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-emerald-700">Brent Crude</span>
                <span className="text-emerald-400">$84.50</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-emerald-700">Wheat (CBOT)</span>
                <span className="text-emerald-400">$620.25</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-emerald-700">Phosphate (FOB)</span>
                <span className="text-emerald-400">$152.00</span>
              </div>
            </div>
          </div>

          <div className="border border-emerald-900 bg-black p-4">
            <h2 className="text-xs font-bold text-emerald-600 uppercase mb-3">Supply Chain Alerts</h2>
            <div className="space-y-3">
              <div className="text-sm">
                <div className="text-red-500 font-bold">PORT OF RADES</div>
                <div className="text-emerald-600 text-xs">Congestion Level: HIGH</div>
                <div className="text-emerald-700 text-[10px] mt-1">Avg Wait Time: 14 Days</div>
              </div>
              <div className="text-sm border-t border-emerald-900/50 pt-2">
                <div className="text-yellow-500 font-bold">SFAX INDUSTRIAL</div>
                <div className="text-emerald-600 text-xs">Energy Supply: MODERATE RISK</div>
                <div className="text-emerald-700 text-[10px] mt-1">Scheduled Outages Possible</div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

// Add Database icon since it's used but not imported
function Database(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M3 5V19A9 3 0 0 0 21 19V5" />
      <path d="M3 12A9 3 0 0 0 21 12" />
    </svg>
  )
}
