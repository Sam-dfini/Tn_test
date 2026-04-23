import React from 'react';
import { Shield, Bell, User, Clock } from 'lucide-react';

export default function HeaderBar() {
  return (
    <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-[#1e3a5f] bg-[#0a0f1a]/90 px-4 lg:px-6 backdrop-blur-md">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <Shield className="h-6 w-6 text-[#3b82f6]" />
          <h1 className="text-xl font-bold tracking-tight text-[#f1f5f9]">
            TunisiaIntel
          </h1>
        </div>
        <div className="hidden h-6 w-px bg-[#1e3a5f] md:block"></div>
        <div className="hidden items-center gap-2 text-sm font-semibold uppercase tracking-wider text-[#94a3b8] md:flex">
          <span className="text-[#3b82f6]">AGRI-INTEL</span>
          <span>/</span>
          <span>DASHBOARD</span>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="hidden items-center gap-2 text-xs font-medium text-[#94a3b8] sm:flex">
          <Clock className="h-4 w-4" />
          <span>{new Date().toISOString().split('T')[0]}</span>
        </div>
        <button className="relative rounded-full p-2 text-[#94a3b8] transition-colors hover:bg-[#1a2332] hover:text-[#f1f5f9]">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1 top-1 flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#ef4444] opacity-75"></span>
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#ef4444]"></span>
          </span>
        </button>
        <button className="rounded-full bg-[#1a2332] p-2 text-[#94a3b8] transition-colors hover:bg-[#1e3a5f] hover:text-[#f1f5f9]">
          <User className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}
