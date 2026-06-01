import React from 'react';

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
          <span className="text-on-surface">TUNISIA</span>
          <span className="text-intel-cyan"> INTEL</span>
        </div>
        <div className="flex items-center space-x-4 md:space-x-6">
          <div className="hidden md:flex items-center space-x-4 text-xs text-slate-500">
            <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-slate-500 mr-2"></span>SECURE_NODE_TUNISIA</span>
            <span className="flex items-center text-intel-cyan"><span className="w-2 h-2 rounded-full bg-intel-cyan mr-2 animate-pulse"></span>ENCRYPTED_UPLINK</span>
          </div>
          <div className="flex items-center space-x-4">
            {headerAction}
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
        {/* Main Content */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          {children}
        </main>


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
