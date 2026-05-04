import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from '../../lib/utils';
import { generateStableKey } from '../../lib/keyUtils';
import { 
  Activity, 
  Shield, 
  Zap, 
  Globe, 
  Cpu, 
  Database, 
  Network, 
  AlertTriangle,
  ChevronRight,
  Maximize2,
  Terminal,
  Layers,
  Users
} from "lucide-react";

export const PyramidHierarchy: React.FC = () => {
  const [tickerIndex, setTickerIndex] = useState(0);
  const alerts = [
    "NEW ACTOR IDENTIFIED - 'REDHAWK'",
    "TRACKING NARRATIVE SHAFT 'DISINFORMATION B'",
    "NEURAL DENSITY INCREASING IN 'FINANCIAL' CLUSTER",
    "SUBSURFACE SIGNAL DETECTED IN SECTOR 7G",
    "LATENCY SPIKE IN DARKNET GATEWAY 0.4",
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setTickerIndex((prev) => (prev + 1) % alerts.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[#050b10] text-[#71b1c6] font-mono selection:bg-[#71b1c6]/30 overflow-hidden flex flex-col p-4 relative">
      {/* Background Grid */}
      <div className="absolute inset-0 z-0 opacity-10 pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #71b1c6 1px, transparent 0)', backgroundSize: '40px 40px' }} />
      
      {/* Top Header */}
      <header className="relative z-10 flex items-center justify-between border-b border-[#71b1c6]/20 pb-2 mb-4">
        <div className="flex items-center gap-4">
          <Terminal className="w-6 h-6 text-[#71b1c6]" />
          <h1 className="text-xl font-bold tracking-widest uppercase">OSINT Network Hierarchy</h1>
        </div>
        <div className="flex items-center gap-8 text-[10px] uppercase tracking-tighter opacity-70">
          <div className="flex items-center gap-2 bg-[#71b1c6]/5 px-3 py-1 border border-[#71b1c6]/20">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            System Live
          </div>
          <div className="flex items-center gap-2">
            <span>All Navigator</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-white bg-[#71b1c6]/20 px-2">Opening</span>
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <main className="relative z-10 grid grid-cols-12 gap-4 flex-grow overflow-hidden">
        
        {/* Left Sidebar - Data Streams */}
        <section className="col-span-3 flex flex-col gap-4 overflow-hidden">
          <div className="border border-[#71b1c6]/30 bg-[#0a141d]/80 p-4 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1 h-full bg-[#71b1c6]/50" />
            <h2 className="text-xs font-bold mb-4 flex items-center gap-2">
              <Database className="w-3 h-3" /> OSINT DATA STREAMS
            </h2>
            
            <div className="space-y-3">
              <DataRow label="Active Investigations" value="14" color="text-red-400" />
              <DataRow label="Nodes Traced" value="1,283" />
              <DataRow label="Active Entities" value="10" color="text-[#71b1c6]" />
              <DataRow label="Nodes Traces" value="373" />
              <DataRow label="Threat Level" value="Elevated" color="text-orange-400" />
              <DataRow label="Signal Integrity" value="Nominal" color="text-green-400" />
            </div>

            <div className="mt-6">
              <h3 className="text-[10px] opacity-50 mb-2 flex items-center gap-1">
                <Activity className="w-2 h-2" /> LIVE RAY FEEDS
              </h3>
              <div className="text-[8px] space-y-1 opacity-80 leading-relaxed font-mono">
                <p>ACTIVE INVESTIGATIONS: 14</p>
                <p>ACTIVE TRAYSSTIRIGTHNIG: 190</p>
                <p className="text-orange-400">ALERT: WRAITI SHAFT 'REREDHAWK'</p>
                <p>NODES WESTIGATIONS: 50</p>
                <p>AGOBR ASSAHT FAIR DATK: OONSETL</p>
              </div>
            </div>
          </div>

          <div className="flex-grow border border-[#71b1c6]/30 bg-[#0a141d]/80 p-4 flex flex-col relative">
            <div className="absolute top-0 right-0 p-1 opacity-20"><Maximize2 className="w-3 h-3" /></div>
            <div className="flex-grow relative overflow-hidden bg-black/40 rounded flex items-center justify-center">
              {/* Hex World Map Placeholder */}
              <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#71b1c6 0.5px, transparent 0)', backgroundSize: '10px 10px' }} />
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
                className="w-48 h-48 rounded-full border border-[#71b1c6]/10 flex items-center justify-center"
              >
                <Globe className="w-32 h-32 opacity-15" />
                <div className="absolute w-2 h-2 bg-red-400 rounded-full blur-[2px] animate-pulse left-1/4 top-1/4" />
                <div className="absolute w-2 h-2 bg-cyan-400 rounded-full blur-[2px] animate-pulse right-1/3 bottom-1/2" />
              </motion.div>
              <div className="absolute bottom-2 left-2 text-[8px] opacity-40">GEO-LOCATION MATRIX v4.2</div>
            </div>
          </div>
        </section>

        {/* Center - Hierarchy & High Echelon */}
        <section className="col-span-6 flex flex-col gap-4">
          {/* Top Network */}
          <div className="h-40 border border-[#71b1c6]/30 bg-[#0a141d]/80 p-4 relative overflow-hidden">
            <h2 className="text-xs font-bold mb-2 tracking-widest uppercase">High Echelon Connections</h2>
            <svg viewBox="0 0 1000 200" className="w-full h-full">
              <defs>
                <filter id="nodeGlow">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              {/* Connection Lines */}
              <path d="M100,100 L300,100 L500,50 L700,100 L900,100" stroke="#71b1c6" strokeWidth="1" fill="none" opacity="0.3" strokeDasharray="5,5" />
              <path d="M300,100 L500,150 L700,100" stroke="#71b1c6" strokeWidth="1" fill="none" opacity="0.3" />
              
              {/* Nodes */}
              <LargeNode x={100} y={100} label="ENTITY Alpha-7" color="#4a90e2" />
              <LargeNode x={300} y={100} label="OPERATOR Kilo" color="#4fbdbc" />
              <LargeNode x={500} y={50} label="ENTITY Tenne" color="#4a90e2" isLarge />
              <LargeNode x={700} y={100} label="NODE Delta" color="#4fbdbc" />
              <LargeNode x={900} y={100} label="ENTITY Alpha" color="#4a90e2" />
              
              <LargeNode x={200} y={50} label="ENTITY Alpha-7" color="#4fbdbc" />
              <LargeNode x={400} y={150} label="NODE Delta" color="#4fbdbc" />
              <LargeNode x={600} y={150} label="NODE Delta" color="#4fbdbc" />
              <LargeNode x={800} y={150} label="NODE Flame" color="#4fbdbc" />
            </svg>
          </div>

          {/* Central Pyramid */}
          <div className="flex-grow border border-[#71b1c6]/30 bg-[#0a141d]/80 p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
               <motion.div 
                 animate={{ y: [0, 600] }}
                 transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                 className="w-full h-[1px] bg-gradient-to-r from-transparent via-[#71b1c6]/30 to-transparent shadow-[0_0_10px_#71b1c6]"
               />
            </div>
            
            <div className="flex justify-between items-start mb-8">
              <h2 className="text-xs font-bold tracking-widest text-[#71b1c6]">TRIANGLES HIERARCHY</h2>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={generateStableKey('hierarchy-indicator', i, 'pyramid')} className={cn("w-2 h-1", i < 4 ? "bg-[#71b1c6]" : "bg-[#71b1c6]/20")} />
                ))}
              </div>
            </div>

            <div className="relative aspect-[4/3] flex items-center justify-center p-8">
              <svg viewBox="0 0 800 600" className="w-full h-full drop-shadow-[0_0_20px_rgba(113,177,198,0.2)]">
                {/* Connections between tiers */}
                <g opacity="0.1">
                   <path d="M400,100 L400,220" stroke="#71b1c6" strokeWidth="2" fill="none" />
                   <path d="M400,220 L250,380" stroke="#71b1c6" strokeWidth="2" fill="none" />
                   <path d="M400,220 L550,380" stroke="#71b1c6" strokeWidth="2" fill="none" />
                   <path d="M250,380 L150,520" stroke="#71b1c6" strokeWidth="2" fill="none" />
                   <path d="M250,380 L350,520" stroke="#71b1c6" strokeWidth="2" fill="none" />
                   <path d="M550,380 L450,520" stroke="#71b1c6" strokeWidth="2" fill="none" />
                   <path d="M550,380 L650,520" stroke="#71b1c6" strokeWidth="2" fill="none" />
                </g>

                {/* Strategic Echelon (Tier 1) */}
                <TierTriangle x={400} y={100} size={120} label="STRATEGIC" sublabel="HIGH ECHELON" color="#71b1c6" main />
                
                {/* Operational Branches (Tier 2) */}
                <TierTriangle x={300} y={280} size={100} label="OPERATIONAL" sublabel="BRANCHES" color="#4fbdbc" />
                <TierTriangle x={500} y={280} size={100} label="OPERATIONAL" sublabel="BRANCHES" color="#4fbdbc" />

                {/* Tactical Actors (Tier 3) */}
                <TierTriangle x={200} y={440} size={60} label="TACTICAL" color="#4a90e2" />
                <TierTriangle x={300} y={440} size={60} label="TACTICAL" color="#4fbdbc" />
                <TierTriangle x={400} y={440} size={60} label="TACTICAL" color="#4a90e2" />
                <TierTriangle x={500} y={440} size={60} label="TACTICAL" color="#4fbdbc" />
                <TierTriangle x={600} y={440} size={60} label="TACTICAL" color="#4a90e2" />

                {/* Data Clusters (Tier 4) - Tiny Triangles */}
                {Array.from({ length: 14 }).map((_, i) => (
                  <TierTriangle 
                    key={i}
                    x={100 + (i * 45) + (i > 6 ? 10 : 0)} 
                    y={540} 
                    size={30} 
                    color="#4fbdbc" 
                    opacity={0.6}
                  />
                ))}

                {/* Side Labels */}
                <g fontSize="12" fill="#71b1c6" opacity="0.6" textAnchor="end">
                  <text x="180" y="105">STRATEGIC HIGHEST ECHELON</text>
                  <text x="180" y="285">OPERATIONAL BRANCHES</text>
                  <text x="140" y="445">TACTICAL ACTORS</text>
                  <text x="80" y="545">DATA CLUSTERS</text>
                </g>
              </svg>

              {/* Labels with lines */}
              <div className="absolute left-0 top-[17%] flex items-center gap-2 group cursor-help">
                <div className="w-32 h-[1px] bg-[#71b1c6]/30 relative">
                  <div className="absolute -left-1 -top-1 w-2 h-2 border-l border-t border-[#71b1c6]" />
                </div>
                <span className="text-[10px] whitespace-nowrap">ENTITY_VERIFIED_7</span>
              </div>
            </div>

            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center">
               <div className="text-[10px] mb-2 font-mono text-center tracking-widest opacity-60">INITIATE ANALYSIS [ARMED]</div>
               <motion.button 
                 whileHover={{ scale: 1.05 }}
                 whileTap={{ scale: 0.95 }}
                 className="relative group px-12 py-3 bg-[#71b1c6]/10 border border-[#71b1c6]/40 text-sm font-bold tracking-[0.2em] uppercase hover:bg-[#71b1c6]/20 transition-all overflow-hidden"
               >
                 <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#71b1c6]/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                 INITIATE ANALYSIS
                 <ChevronRight className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4" />
               </motion.button>
            </div>
          </div>
        </section>

        {/* Right Sidebar - Analytics */}
        <section className="col-span-3 flex flex-col gap-4 overflow-hidden">
          {/* Activity Chart */}
          <div className="h-1/3 border border-[#71b1c6]/30 bg-[#0a141d]/80 p-4 flex flex-col">
            <h2 className="text-xs font-bold mb-4 uppercase flex items-center justify-between">
              Actors & Clusters Analysis
              <span className="text-[8px] opacity-40">24H CYCLE</span>
            </h2>
            <div className="flex-grow flex items-end gap-1 px-1">
              {Array.from({ length: 24 }).map((_, i) => (
                <motion.div 
                  key={i}
                  initial={{ height: 0 }}
                  animate={{ height: Math.random() * 80 + 20 + '%' }}
                  transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse', delay: i * 0.1 }}
                  className="flex-grow bg-[#71b1c6]/20 border-t border-[#71b1c6]/40"
                />
              ))}
            </div>
            <div className="flex justify-between mt-1 text-[6px] opacity-30">
               <span>00:00</span>
               <span>08:00</span>
               <span>16:00</span>
               <span>23:59</span>
            </div>
          </div>

          {/* Actor Profile / Network */}
          <div className="h-1/3 border border-[#71b1c6]/30 bg-[#0a141d]/80 p-4 flex flex-col relative overflow-hidden">
             <div className="absolute top-2 right-2 flex gap-1">
               <div className="w-1 h-1 bg-[#71b1c6]" />
               <div className="w-1 h-1 bg-[#71b1c6]/30" />
             </div>
             <h2 className="text-xs font-bold mb-2 uppercase">Actor Profiles</h2>
             <div className="flex-grow relative flex items-center justify-center">
                <svg viewBox="0 0 100 100" className="w-full h-full opacity-60">
                   <circle cx="50" cy="50" r="40" stroke="#71b1c6" strokeWidth="0.2" fill="none" strokeDasharray="1,2" />
                   <circle cx="50" cy="50" r="25" stroke="#71b1c6" strokeWidth="0.2" fill="none" />
                   <Users className="w-4 h-4 fill-[#71b1c6]/20" x="42" y="42" />
                   <g>
                      {[0, 45, 90, 135, 180, 225, 270, 315].map(angle => (
                         <line 
                           key={angle}
                           x1="50" y1="50"
                           x2={50 + 40 * Math.cos(angle * Math.PI / 180)}
                           y2={50 + 40 * Math.sin(angle * Math.PI / 180)}
                           stroke="#71b1c6" strokeWidth="0.3"
                           opacity="0.3"
                         />
                      ))}
                      {[0, 45, 90, 135, 180, 225, 270, 315].map(angle => (
                         <circle 
                           key={angle}
                           cx={50 + 40 * Math.cos(angle * Math.PI / 180)}
                           cy={50 + 40 * Math.sin(angle * Math.PI / 180)}
                           r="2"
                           fill="#71b1c6"
                         />
                      ))}
                   </g>
                </svg>
                <div className="absolute top-0 right-0 text-[6px] opacity-40 leading-tight">
                  ENTITY: RRR_49<br/>
                  RISK: ELEVATED<br/>
                  LOC: UNKNOWN
                </div>
             </div>
          </div>

          {/* Cluster Map */}
          <div className="flex-grow border border-[#71b1c6]/30 bg-[#0a141d]/80 p-4 flex flex-col relative overflow-hidden">
             <div className="absolute -right-8 -bottom-8 w-24 h-24 border border-[#71b1c6]/10 rounded-full" />
             <h2 className="text-xs font-bold mb-4 uppercase">Cluster Map: Narrative Influence</h2>
             <div className="flex-grow grid grid-cols-2 gap-2">
                <MiniCluster color="#4fbdbc" label="Cluster 3" />
                <MiniCluster color="#e53e3e" label="Cluster 4" active />
                <MiniCluster color="#d69e2e" label="Cluster 4" />
                <MiniCluster color="#4a90e2" label="Cluster 1" />
             </div>
             
             <div className="mt-4 pt-4 border-t border-[#71b1c6]/10">
                <h3 className="text-[10px] font-bold mb-2 flex items-center gap-2">
                   <Shield className="w-2 h-2" /> SYNAPTIC BRANCHES
                </h3>
                <div className="space-y-1">
                   <div className="h-1 bg-[#4fbdbc]/10 rounded overflow-hidden">
                      <motion.div animate={{ width: '80%' }} className="h-full bg-[#4fbdbc]" />
                   </div>
                   <div className="h-1 bg-[#e53e3e]/10 rounded overflow-hidden">
                      <motion.div animate={{ width: '40%' }} className="h-full bg-[#e53e3e]" />
                   </div>
                </div>
             </div>
          </div>
        </section>
      </main>

      {/* Footer Alert */}
      <footer className="mt-4 bg-[#71b1c6]/5 border border-[#71b1c6]/20 px-4 py-1 flex items-center gap-4 overflow-hidden mask-fade-edges">
        <div className="flex items-center gap-2 text-red-500 text-[10px] font-bold">
           <AlertTriangle className="w-3 h-3" />
           ALERT:
        </div>
        <div className="flex-grow">
          <AnimatePresence mode="wait">
            <motion.div
              key={tickerIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="text-[9px] uppercase tracking-wider font-bold"
            >
              {alerts[tickerIndex]}
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="text-[8px] opacity-40">NODE_STATUS: ACTIVE | UPTIME: 104:12:44</div>
      </footer>
    </div>
  );
};

const DataRow: React.FC<{ label: string; value: string; color?: string }> = ({ label, value, color }) => (
  <div className="flex justify-between items-center text-[10px] group cursor-default">
    <span className="opacity-60 group-hover:opacity-100 transition-opacity">{label}:</span>
    <span className={cn("font-bold tracking-wider", color || "text-white")}>{value}</span>
  </div>
);

const LargeNode: React.FC<{ x: number; y: number; label: string; color: string; isLarge?: boolean }> = ({ x, y, label, color, isLarge }) => (
  <g className="cursor-pointer group">
    <circle cx={x} cy={y} r={isLarge ? 8 : 5} fill="none" stroke={color} strokeWidth="2" filter="url(#nodeGlow)" />
    <circle cx={x} cy={y} r={isLarge ? 4 : 2} fill={color} />
    <text x={x} y={y + (isLarge ? 25 : 18)} textAnchor="middle" fontSize="10" fill={color} className="font-bold opacity-80 uppercase tracking-tighter">{label}</text>
  </g>
);

const TierTriangle: React.FC<{ x: number; y: number; size: number; label?: string; sublabel?: string; color: string; opacity?: number; main?: boolean }> = ({ x, y, size, label, sublabel, color, opacity = 1, main = false }) => {
  const h = (Math.sqrt(3) / 2) * size;
  return (
    <g opacity={opacity} className="group cursor-help">
      {/* Outer Shell */}
      <path 
        d={`M ${x} ${y - h/2} L ${x - size/2} ${y + h/2} L ${x + size/2} ${y + h/2} Z`}
        fill="none"
        stroke={color}
        strokeWidth={main ? 2 : 1}
        className={cn("transition-all duration-500", main ? "group-hover:stroke-[3px]" : "group-hover:stroke-2")}
      />
      {/* Internal detail */}
      <path 
        d={`M ${x} ${y - h/10} L ${x - size/4} ${y + h/3} L ${x + size/4} ${y + h/3} Z`}
        fill={color}
        fillOpacity={0.1}
        stroke={color}
        strokeWidth="0.5"
        strokeDasharray="2,2"
      />
      {/* Center dot/zap */}
      <circle cx={x} cy={y} r={size/20} fill={color} className="animate-pulse" />
      
      {label && (
        <text 
          x={x} 
          y={y + h/1.2} 
          textAnchor="middle" 
          fontSize={size/4} 
          fill={color} 
          className="font-bold tracking-widest pointer-events-none"
        >
          {label}
        </text>
      )}
      {sublabel && (
        <text 
          x={x} 
          y={y + h/1.05} 
          textAnchor="middle" 
          fontSize={size/6} 
          fill={color} 
          className="opacity-50 pointer-events-none uppercase"
        >
          {sublabel}
        </text>
      )}
    </g>
  );
};

const MiniCluster: React.FC<{ color: string; label: string; active?: boolean }> = ({ color, label, active }) => (
  <div className={cn(
    "border p-2 flex flex-col items-center justify-center gap-1 group transition-all",
    active ? `bg-${color}/10 border-${color}` : "border-[#71b1c6]/10 bg-black/20"
  )} style={{ borderColor: active ? color : undefined }}>
    <Zap className={cn("w-4 h-4", active ? "animate-bounce" : "opacity-30")} style={{ color: active ? color : undefined }} />
    <span className="text-[6px] opacity-60 uppercase">{label}</span>
  </div>
);
