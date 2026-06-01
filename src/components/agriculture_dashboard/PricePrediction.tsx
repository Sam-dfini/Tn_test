import React from 'react';

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

import { Eye, ShieldAlert } from 'lucide-react';



const forecastData = Array.from({ length: 8 }, (_, i) => ({

  week: i === 0 ? 'Now' : `${i}W`,

  predicted: 8.50 + Math.pow(i, 1.2) * 0.4,

  lower: (8.50 + Math.pow(i, 1.2) * 0.4) * 0.95,

  upper: (8.50 + Math.pow(i, 1.2) * 0.4) * 1.15,

}));



export default function PricePrediction() {

  return (

    <div className="flex h-full min-h-[350px] w-full flex-col overflow-hidden rounded-lg border border-[#1e3a5f] bg-[#111827]">

      <div className="flex items-center justify-between border-b border-[#1e3a5f] bg-[#1a2332] px-4 py-3">

        <h3 className="text-sm font-bold uppercase tracking-widest text-[#f1f5f9]">Food Price Forecast 🔮</h3>

      </div>



      <div className="flex-1 p-4 flex flex-col md:flex-row gap-6">

        {/* Left Side: Chart */}

        <div className="flex-1 flex flex-col">

          <div className="flex gap-2 mb-4">

            <select className="bg-[#0a0f1a] border border-[#1e3a5f] text-xs px-2 py-1 rounded text-[#f1f5f9] outline-none focus:ring-1 focus:ring-intel-cyan/30">

              <option>Chicken</option>

              <option>Bread</option>

              <option>Vegetables</option>

            </select>

            <span className="text-xs text-[#94a3b8] flex items-center ml-auto">

              CURRENT: <span className="font-mono text-on-surface text-lg font-bold ml-2">8.50 TND/kg</span>

            </span>

          </div>



          <div className="flex-1 min-h-[150px] border border-[#1e3a5f] bg-[#0a0f1a] rounded p-2 relative">

            <ResponsiveContainer width="100%" height="100%">

              <AreaChart data={forecastData}>

                <defs>

                  <linearGradient id="colorPredicted" x1="0" y1="0" x2="0" y2="1">

                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>

                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>

                  </linearGradient>

                </defs>

                <XAxis dataKey="week" stroke="#1e3a5f" tick={{ fill: '#94a3b8', fontSize: 10 }} />

                <YAxis domain={['auto', 'auto']} stroke="#1e3a5f" tick={{ fill: '#94a3b8', fontSize: 10 }} />

                <Tooltip 

                  contentStyle={{ backgroundColor: '#111827', borderColor: '#1e3a5f', fontSize: '12px' }}

                />

                {/* Confidence Band Mockup */}

                <Area type="monotone" dataKey="upper" stroke="none" fill="#8b5cf6" fillOpacity={0.2} />

                <Area type="monotone" dataKey="lower" stroke="none" fill="#0a0f1a" fillOpacity={1} />

                {/* Main prediction line */}

                <Area type="monotone" dataKey="predicted" stroke="#8b5cf6" strokeWidth={2} fill="url(#colorPredicted)" />

              </AreaChart>

            </ResponsiveContainer>

          </div>

        </div>



        {/* Right Side: Details */}

        <div className="w-full md:w-1/3 flex flex-col gap-4">

          <div className="space-y-2">

            <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#94a3b8]">Predictions</h4>

            <div className="rounded border border-[#1e3a5f] bg-[#0a0f1a] p-2 text-xs space-y-1 font-mono">

              <div className="flex justify-between">

                <span className="text-[#94a3b8]">2 weeks:</span>

                <span>10.20 <span className="text-[#ef4444]">▲20%</span></span>

              </div>

              <div className="flex justify-between">

                <span className="text-[#94a3b8]">4 weeks:</span>

                <span>11.80 <span className="text-[#ef4444]">▲39%</span></span>

              </div>

              <div className="flex justify-between font-bold">

                <span className="text-[#94a3b8]">8 weeks:</span>

                <span className="text-[#f1f5f9]">12.50 <span className="text-[#ef4444]">▲47%</span></span>

              </div>

            </div>

          </div>



          <div className="space-y-2">

            <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#94a3b8]">Drivers</h4>

            <ul className="text-xs text-[#f1f5f9] space-y-1 pl-4 list-disc list-outside marker:text-[#3b82f6]">

              <li>Feed stress <span className="text-[#ef4444]">↑ 0.72</span></li>

              <li>BMI active (0.68)</li>

              <li>Panic buying detected</li>

            </ul>

          </div>



          <div className="mt-auto space-y-2">

            <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-[#94a3b8]">

              <span>Confidence: 78%</span>

            </div>

            <div className="h-1.5 w-full rounded-full bg-[#0a0f1a] overflow-hidden">

               <div className="h-full bg-[#8b5cf6] w-[78%]" />

            </div>

            <div className="flex gap-2 pt-2">

              <button className="flex-1 rounded border border-[#1e3a5f] px-2 py-1 text-xs text-[#94a3b8] hover:bg-[#1a2332] hover:text-[#f1f5f9]">Export</button>

              <button className="flex-1 rounded bg-[#ef4444]/20 border border-[#ef4444]/50 px-2 py-1 text-xs font-bold text-[#ef4444] hover:bg-[#ef4444] hover:text-white transition-colors">Alert</button>

            </div>

          </div>

        </div>

      </div>

    </div>

  );

}

