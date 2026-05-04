import React from 'react';
import { Bell, User, Shield } from 'lucide-react';

interface ModePageLayoutProps {
  children: React.ReactNode;
  headerAction?: React.ReactNode;
}

export const ModePageLayout: React.FC<ModePageLayoutProps> = ({ children, headerAction }) => {
  return (
    <div className="min-h-screen bg-[#0a0c10] text-slate-300 font-mono flex flex-col">
      {/* Header */}
      <header className="h-16 border-b border-slate-800 flex items-center justify-between px-4 md:px-6">
        <div className="text-lg md:text-xl font-bold tracking-widest">
          <span className="text-white">TUNISIA</span>
          <span className="text-intel-cyan"> INTEL</span>
        </div>
        <div className="flex items-center space-x-4 md:space-x-6">
          <div className="hidden md:flex items-center space-x-4 text-xs text-slate-500">
            <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-slate-500 mr-2"></span>SECURE_NODE_TUNISIA</span>
            <span className="flex items-center text-intel-cyan"><span className="w-2 h-2 rounded-full bg-intel-cyan mr-2 animate-pulse"></span>ENCRYPTED_UPLINK</span>
          </div>
          <div className="flex items-center space-x-4">
            {headerAction}
            <Shield className="w-5 h-5 text-slate-500 hidden md:block" />
            <User className="w-5 h-5 text-slate-500 hidden md:block" />
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
        {/* Main Content */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          {children}
        </main>

        {/* Right Sidebar */}
        <aside className="hidden md:block w-80 border-l border-slate-800 p-6 space-y-8">
          <div>
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Operational Modes</h2>
            <div className="bg-[#0f141a] border border-intel-cyan/20 p-4 rounded-lg flex items-center space-x-3">
              <div className="w-8 h-8 rounded bg-intel-cyan/10 flex items-center justify-center">
                <div className="w-4 h-4 grid grid-cols-2 gap-0.5">
                  <div className="bg-intel-cyan"></div>
                  <div className="bg-intel-cyan"></div>
                  <div className="bg-intel-cyan"></div>
                  <div className="bg-intel-cyan"></div>
                </div>
              </div>
              <span className="text-sm font-bold text-intel-cyan">SIMPLIFIED VIEW</span>
            </div>
          </div>
          
          <div>
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Locked Modules</h2>
            <div className="space-y-3">
              {['PALANTIR CONNECT', 'BLOOMBERG SYNC', 'PREDICTIVE STRIKE'].map((module) => (
                <div key={module} className="bg-[#0f141a] border border-slate-800 p-4 rounded-lg flex items-center space-x-3">
                  <div className="text-slate-600">🔒</div>
                  <div>
                    <div className="text-xs font-bold text-slate-400">{module}</div>
                    <div className="text-[10px] text-[#ef4444]">REQUIRES LEVEL 5 AUTH</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-auto">
            <div className="aspect-square bg-[#0f141a] rounded-lg border border-slate-700 flex items-center justify-center overflow-hidden">
              <svg className="w-full h-full p-4" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
                <defs>
                  <filter id="outer-glow">
                    <feGaussianBlur stdDeviation="2" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                  <filter id="middle-glow">
                    <feGaussianBlur stdDeviation="1.5" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                  <filter id="inner-glow">
                    <feGaussianBlur stdDeviation="1" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>
                {/* Outer Triangle */}
                <path 
                  d="M50 15 L85 85 L15 85 Z" 
                  fill="none" 
                  stroke="#00f2ff" 
                  strokeWidth="3.5" 
                  strokeLinejoin="miter"
                  style={{ filter: 'drop-shadow(0 0 5px rgba(0, 242, 255, 0.8)) drop-shadow(0 0 15px rgba(0, 242, 255, 0.5))' }}
                />
                {/* Middle Triangle */}
                <path 
                  d="M50 25 L78 80 L22 80 Z" 
                  fill="none" 
                  stroke="#00f2ff" 
                  strokeWidth="2" 
                  strokeLinejoin="miter"
                  opacity="0.85"
                  style={{ filter: 'drop-shadow(0 0 3px rgba(0, 242, 255, 0.6)) drop-shadow(0 0 8px rgba(0, 242, 255, 0.3))' }}
                />
                {/* Inner Triangle */}
                <path 
                  d="M50 35 L71 75 L29 75 Z" 
                  fill="none" 
                  stroke="#00f2ff" 
                  strokeWidth="1" 
                  strokeLinejoin="miter"
                  opacity="0.6"
                  style={{ filter: 'drop-shadow(0 0 2px rgba(0, 242, 255, 0.4))' }}
                />
              </svg>
            </div>
          </div>
        </aside>
      </div>

      {/* Footer */}
      <footer className="h-12 border-t border-slate-800 flex items-center justify-between px-4 md:px-6 text-[8px] md:text-[10px] font-mono text-slate-500 overflow-x-auto whitespace-nowrap">
        <span>SYSTEM_ENCRYPTION_V4.2 // SOVEREIGN_KERNEL</span>
        <div className="flex space-x-4 md:space-x-6 ml-4">
          <span>MARKET_TICKER: BTC/USD +2.4%</span>
          <span className="text-[#eab308]">GEOPOLITICAL_RISK: ELEVATED</span>
          <span>LATENCY: 14MS</span>
        </div>
      </footer>
    </div>
  );
};
