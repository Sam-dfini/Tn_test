import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, Pause, SkipForward, SkipBack, 
  Volume2, Settings, Download, Globe,
  Activity, Radio, Zap, Sparkles,
  RefreshCw, Headphones, Mic2
} from 'lucide-react';

interface Voice {
  id: string;
  name: string;
  lang: string;
  dialect: string;
  gender: 'M' | 'F';
}

const VOICES: Voice[] = [
  { id: 'tn-01', name: 'Zied', lang: 'Arabic', dialect: 'Tunisian', gender: 'M' },
  { id: 'tn-02', name: 'Leila', lang: 'Arabic', dialect: 'Tunisian', gender: 'F' },
  { id: 'fr-01', name: 'Julien', lang: 'French', dialect: 'Standard', gender: 'M' },
  { id: 'en-01', name: 'Sarah', lang: 'English', dialect: 'Neutral', gender: 'F' },
];

export const AIVoiceBriefing: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState(VOICES[0]);
  const [progress, setProgress] = useState(0);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [status, setStatus] = useState<'READY' | 'SYNTHESIZING' | 'PLAYING'>('READY');

  useEffect(() => {
    let interval: any;
    if (isPlaying && progress < 100) {
      interval = setInterval(() => {
        setProgress(p => Math.min(p + 0.5, 100));
      }, 500);
    } else if (progress >= 100) {
      setIsPlaying(false);
      setStatus('READY');
    }
    return () => clearInterval(interval);
  }, [isPlaying, progress]);

  const handleTogglePlay = () => {
    if (status === 'READY') {
      setIsSynthesizing(true);
      setStatus('SYNTHESIZING');
      setTimeout(() => {
        setIsSynthesizing(false);
        setIsPlaying(true);
        setStatus('PLAYING');
      }, 2000);
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const handleReset = () => {
    setIsPlaying(false);
    setProgress(0);
    setStatus('READY');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* ── MAIN PLAYER CARD ── */}
      <div className="glass p-8 md:p-12 rounded-[2.5rem] border border-intel-border/30 relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-intel-cyan/5 via-transparent to-purple-500/5 pointer-events-none" />
        
        {/* Neural Visualizer Background */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-intel-cyan/5 blur-[100px] rounded-full -mr-48 -mt-48" />
        
        <div className="relative z-10 flex flex-col items-center space-y-12">
          {/* Header Info */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-intel-cyan font-mono uppercase tracking-[0.3em]">
              <div className="w-1.5 h-1.5 bg-intel-cyan rounded-full animate-pulse" />
              Neural Intelligence Synthesis
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">Daily Strategic Narrative</h2>
            <p className="text-slate-400 text-sm max-w-md mx-auto">
              Generating an AI-powered audio briefing for {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })}.
            </p>
          </div>

          {/* Visualizer / Waveform */}
          <div className="w-full h-32 flex items-center justify-center gap-1">
            {Array.from({ length: 40 }).map((_, i) => (
              <motion.div
                key={i}
                animate={{
                  height: isPlaying ? [20, Math.random() * 80 + 20, 20] : 4,
                  opacity: isPlaying ? [0.3, 1, 0.3] : 0.2,
                }}
                transition={{
                  duration: 0.8,
                  repeat: Infinity,
                  delay: i * 0.05,
                  ease: "easeInOut"
                }}
                className={`w-1 rounded-full ${i % 2 === 0 ? 'bg-intel-cyan' : 'bg-purple-500'}`}
              />
            ))}
          </div>

          {/* Player Controls */}
          <div className="flex flex-col items-center space-y-8 w-full max-w-xl">
            {/* Progress Bar */}
            <div className="w-full space-y-2">
              <div className="flex justify-between text-[10px] font-mono text-slate-500 uppercase">
                <span>{Math.floor(progress * 0.42)}s</span>
                <span>07:42m</span>
              </div>
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                <motion.div 
                  className="h-full bg-gradient-to-r from-intel-cyan to-purple-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <div className="flex items-center gap-8">
              <button className="p-3 text-slate-500 hover:text-white transition-colors">
                <SkipBack className="w-6 h-6" />
              </button>
              
              <button 
                onClick={handleTogglePlay}
                disabled={isSynthesizing}
                className={`w-20 h-20 rounded-full flex items-center justify-center transition-all transform hover:scale-110 shadow-2xl ${
                  status === 'SYNTHESIZING' 
                    ? 'bg-slate-800 animate-pulse cursor-wait' 
                    : 'bg-white text-black'
                }`}
              >
                {isSynthesizing ? (
                  <RefreshCw className="w-8 h-8 animate-spin" />
                ) : isPlaying ? (
                  <Pause className="w-8 h-8" fill="currentColor" />
                ) : (
                  <Play className="w-8 h-8 ml-1" fill="currentColor" />
                )}
              </button>

              <button className="p-3 text-slate-500 hover:text-white transition-colors">
                <SkipForward className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── SETTINGS & VOICES ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Voice Selection */}
        <div className="md:col-span-2 glass p-6 rounded-3xl border border-white/5 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-intel-cyan/10 rounded-xl">
                <Mic2 className="w-4 h-4 text-intel-cyan" />
              </div>
              <h3 className="text-xs font-bold text-white uppercase tracking-widest">Neural Voice Engine</h3>
            </div>
            <div className="text-[10px] font-mono text-slate-500 uppercase bg-white/5 px-2 py-0.5 rounded border border-white/5">
              44.1kHz High-Fidelity
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {VOICES.map((v) => (
              <button
                key={v.id}
                onClick={() => setSelectedVoice(v)}
                className={`p-4 rounded-2xl border text-left transition-all space-y-1 relative group overflow-hidden ${
                  selectedVoice.id === v.id
                    ? 'bg-intel-cyan/10 border-intel-cyan/50'
                    : 'bg-white/5 border-white/5 hover:border-white/20'
                }`}
              >
                {selectedVoice.id === v.id && (
                  <div className="absolute top-0 right-0 p-1.5">
                    <Check className="w-3 h-3 text-intel-cyan" />
                  </div>
                )}
                <div className="text-[10px] font-bold text-white">{v.name}</div>
                <div className="text-[8px] text-slate-500 uppercase tracking-tighter">{v.lang}</div>
                <div className="text-[8px] font-mono text-intel-cyan opacity-60">{v.dialect}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Action Panel */}
        <div className="glass p-6 rounded-3xl border border-white/5 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-widest">System Actions</h3>
            <div className="space-y-2">
              <button className="w-full flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 transition-all group">
                <div className="flex items-center gap-2 text-[10px] font-mono text-slate-300">
                  <Download className="w-3 h-3 group-hover:text-intel-cyan" />
                  <span>Download MP3 Brief</span>
                </div>
                <div className="text-[8px] font-mono text-slate-500">4.2MB</div>
              </button>
              <button 
                onClick={handleReset}
                className="w-full flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 transition-all group"
              >
                <div className="flex items-center gap-2 text-[10px] font-mono text-slate-300">
                  <RefreshCw className="w-3 h-3 group-hover:text-intel-cyan" />
                  <span>Regenerate Audio</span>
                </div>
                <Activity className="w-3 h-3 text-slate-600" />
              </button>
            </div>
          </div>

          <div className="p-3 bg-intel-cyan/5 border border-intel-cyan/20 rounded-xl mt-4">
            <div className="flex items-center gap-2 text-[8px] font-bold text-intel-cyan uppercase tracking-widest mb-1">
              <Radio className="w-2.5 h-2.5 animate-pulse" />
              Broadcasting Channel 1
            </div>
            <p className="text-[9px] text-slate-500 leading-tight">
              Real-time synchronization with latest Supabase signals and RRI threshold updates.
            </p>
          </div>
        </div>
      </div>

      {/* ── STATUS MONITOR ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Ingestion Sync', value: 'SYMMETRIC', icon: Zap, status: 'OK' },
          { label: 'Transcription', value: 'NEURAL-V3', icon: Activity, status: 'OK' },
          { label: 'Translation', value: 'LIVE-PARALLEL', icon: Globe, status: 'OK' },
          { label: 'Encryption', value: 'AES-256-GCM', icon: Headphones, status: 'OK' },
        ].map((s, i) => (
          <div key={i} className="glass p-4 rounded-2xl border border-white/5 flex items-center gap-4">
            <div className="p-2 bg-white/5 rounded-lg">
              <s.icon className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="space-y-0.5">
              <div className="text-[8px] font-mono text-slate-500 uppercase tracking-widest">{s.label}</div>
              <div className="text-[10px] font-bold text-white font-mono">{s.value}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const Check: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
  </svg>
);

export default AIVoiceBriefing;
