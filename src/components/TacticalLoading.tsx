import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Zap, Globe, Activity, Lock } from 'lucide-react';

export const TacticalLoading: React.FC<{ onComplete: () => void, mode?: 'simplified' | 'advanced' | null }> = ({ onComplete, mode }) => {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('INITIALIZING SYSTEM...');
  
  const simplifiedMessages = [
    'CONNECTING TO PUBLIC DATA FEEDS...',
    'SUMMARIZING REGIONAL INDICATORS...',
    'PREPARING DASHBOARD OVERVIEW...',
    'OPTIMIZING FOR LEGACY ACCESS...',
    'SYSTEM READY.'
  ];

  const advancedMessages = [
    'ESTABLISHING SECURE ENCRYPTED LINK...',
    'CONNECTING TO TUNISIA-INTEL CORE...',
    'DECRYPTING GEOSPATIAL DATA LAYERS...',
    'SYNCHRONIZING RRI MODEL VARIABLES...',
    'LOADING GOVERNORATE RISK MATRICES...',
    'INITIALIZING AI ANALYST ENGINE...',
    'SYSTEM READY. ACCESS GRANTED.'
  ];

  const statusMessages = mode === 'advanced' ? advancedMessages : simplifiedMessages;

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(onComplete, 800);
          return 100;
        }
        return prev + Math.random() * 15;
      });
    }, 200);

    return () => clearInterval(timer);
  }, [onComplete]);

  useEffect(() => {
    const messageIndex = Math.min(
      Math.floor((progress / 100) * statusMessages.length),
      statusMessages.length - 1
    );
    setStatus(statusMessages[messageIndex]);
  }, [progress]);

  return (
    <div className="fixed inset-0 bg-intel-bg z-[100] flex flex-col items-center justify-center p-8 overflow-hidden">
      {/* Background Grid */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #00f2ff 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
      
      {/* Scanning Line */}
      <motion.div 
        animate={{ top: ['0%', '100%'] }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        className="absolute left-0 right-0 h-[2px] bg-intel-cyan/20 z-10"
      />

      <div className="max-w-md w-full space-y-12 relative z-20">
        <div className="flex flex-col items-center space-y-6">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-24 h-24 rounded-2xl bg-intel-cyan/5 border border-intel-cyan/20 flex items-center justify-center relative"
          >
            <div className="absolute inset-0 bg-intel-cyan/10 animate-pulse rounded-2xl"></div>
            <Shield className="w-12 h-12 text-intel-cyan" />
          </motion.div>
          
          <div className="text-center">
            <h1 className="text-3xl tracking-[0.3em] font-bold text-white">
              TUNISIA<span className="text-intel-cyan">INTEL</span>
            </h1>
            <div className="text-[10px] font-mono text-slate-500 uppercase tracking-[0.5em] mt-2">
              {mode === 'advanced' ? 'Tactical OSINT Tunisia' : 'Tactical Risk Intelligence v2.0'}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-end">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <div className="w-1 h-1 bg-intel-cyan rounded-full animate-ping"></div>
                <span className="text-[10px] font-mono text-intel-cyan uppercase tracking-widest font-bold">
                  {status}
                </span>
              </div>
              <div className="text-[8px] font-mono text-slate-600 uppercase">
                SECURE ACCESS PORT: 3000 // ENCRYPTION: AES-256
              </div>
            </div>
            <div className="text-2xl font-bold font-mono text-white">
              {Math.min(100, Math.floor(progress))}%
            </div>
          </div>

          <div className="h-2 w-full bg-intel-card border border-intel-border rounded-full overflow-hidden p-[2px]">
            <motion.div 
              className="h-full bg-intel-cyan rounded-full shadow-[0_0_15px_rgba(0,242,255,0.5)]"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="grid grid-cols-4 gap-2">
            {[Zap, Globe, Activity, Lock].map((Icon, i) => (
              <div key={i} className={cn(
                "h-1 rounded-full transition-colors duration-500",
                progress > (i + 1) * 25 ? "bg-intel-cyan" : "bg-intel-border"
              )}></div>
            ))}
          </div>
        </div>

        <div className="pt-8 border-t border-intel-border/50">
          <div className="flex justify-between text-[8px] font-mono text-slate-600 uppercase tracking-widest">
            <span>Auth: Verified</span>
            <span>Location: Tunis, TN</span>
            <span>Latency: 14ms</span>
          </div>
        </div>
      </div>

      {/* Corner Accents */}
      <div className="absolute top-8 left-8 w-12 h-12 border-t-2 border-l-2 border-intel-cyan/30"></div>
      <div className="absolute top-8 right-8 w-12 h-12 border-t-2 border-r-2 border-intel-cyan/30"></div>
      <div className="absolute bottom-8 left-8 w-12 h-12 border-b-2 border-l-2 border-intel-cyan/30"></div>
      <div className="absolute bottom-8 right-8 w-12 h-12 border-b-2 border-r-2 border-intel-cyan/30"></div>
    </div>
  );
};

// Helper for cn if not available in this scope
function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
