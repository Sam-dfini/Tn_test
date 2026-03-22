import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Radio, Shield, Zap, Eye,
  Play, Pause, Volume2,
  Tv, Music, Globe, ArrowUpRight
} from 'lucide-react';

type StreamCategory = 'INTERNATIONAL' | 'LOCAL_TV' | 'RADIO';

interface Stream {
  id: string;
  name: string;
  type: 'TV' | 'RADIO';
  embedId?: string | null;
  streamUrl?: string;
  category: StreamCategory;
  location: string;
  lang: string;
  freq?: string;
}

const STREAMS: Stream[] = [
  // International TV — real YouTube live stream embed IDs
  {
    id: 'int-1',
    name: 'AL JAZEERA ARABIC',
    type: 'TV',
    embedId: 'B1_uRCgFISs',
    category: 'INTERNATIONAL',
    location: 'Doha, Qatar',
    lang: 'AR'
  },
  {
    id: 'int-2', 
    name: 'FRANCE 24 ARABIC',
    type: 'TV',
    embedId: 'l7NeZoANnTc',
    category: 'INTERNATIONAL',
    location: 'Paris, France',
    lang: 'AR/FR'
  },
  {
    id: 'int-3',
    name: 'AL ARABIYA',
    type: 'TV',
    embedId: 'YHHoJyTEzM4',
    category: 'INTERNATIONAL',
    location: 'Dubai, UAE',
    lang: 'AR'
  },
  {
    id: 'int-4',
    name: 'EURONEWS ARABIC',
    type: 'TV',
    embedId: 'kPlPy9yHR_Y',
    category: 'INTERNATIONAL',
    location: 'Lyon, France',
    lang: 'AR'
  },
  // Local Tunisian TV — no verified YouTube IDs available
  // Show as "Signal Acquisition" placeholder
  {
    id: 'loc-1',
    name: 'AL WATANIYA 1',
    type: 'TV',
    embedId: null,
    category: 'LOCAL_TV',
    location: 'Tunis, Tunisia',
    lang: 'AR'
  },
  {
    id: 'loc-2',
    name: 'ATTESSIA TV',
    type: 'TV', 
    embedId: null,
    category: 'LOCAL_TV',
    location: 'Tunis, Tunisia',
    lang: 'AR'
  },
  {
    id: 'loc-3',
    name: 'HANNIBAL TV',
    type: 'TV',
    embedId: null,
    category: 'LOCAL_TV',
    location: 'Tunis, Tunisia',
    lang: 'AR'
  },
  // Radio streams — native audio
  {
    id: 'rad-1',
    name: 'MOSAIQUE FM',
    type: 'RADIO',
    streamUrl: 'https://radio.mosaiquefm.net/mosalive',
    category: 'RADIO',
    location: 'Tunis, Tunisia',
    lang: 'AR/FR',
    freq: '96.3 FM'
  },
  {
    id: 'rad-2',
    name: 'SHEMS FM',
    type: 'RADIO',
    streamUrl: 'https://shoutcast.shemsfm.net:8000/shems128',
    category: 'RADIO',
    location: 'Tunis, Tunisia',
    lang: 'AR',
    freq: '99.0 FM'
  },
  {
    id: 'rad-3',
    name: 'EXPRESS FM',
    type: 'RADIO',
    streamUrl: 'https://stream.expressfm.net:8000/expresslive',
    category: 'RADIO',
    location: 'Tunis, Tunisia',
    lang: 'AR/FR',
    freq: '101.0 FM'
  },
  {
    id: 'rad-4',
    name: 'IFM RADIO',
    type: 'RADIO',
    streamUrl: 'https://stream.ifm.tn:8443/ifm',
    category: 'RADIO',
    location: 'Tunis, Tunisia',
    lang: 'FR',
    freq: '93.5 FM'
  }
];

export const LiveMediaStreams: React.FC = () => {
  const [activeStream, setActiveStream] = useState<Stream>(STREAMS[0]);
  const [activeCategory, setActiveCategory] = useState<StreamCategory>('INTERNATIONAL');
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [iframeError, setIframeError] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(() => setIframeError(true));
    }
    setIsPlaying(!isPlaying);
  };

  const handleStreamSelect = (stream: Stream) => {
    setIframeError(false);
    if (activeStream.type === 'RADIO' && isPlaying && audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlaying(false);
    setActiveStream(stream);
  };

  const filteredStreams = STREAMS.filter(s => s.category === activeCategory);

  return (
    <div className="glass rounded-lg border border-intel-border overflow-hidden flex flex-col h-[650px] relative">
      {/* Header */}
      <div className="bg-black/40 border-b border-intel-border p-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Radio className="w-4 h-4 text-intel-red" />
            <motion.div 
              animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 bg-intel-red rounded-full"
            />
          </div>
          <h3 className="text-xs font-mono text-intel-cyan uppercase font-bold tracking-widest">Tactical Media Monitor</h3>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1">
            <div className="w-1.5 h-1.5 rounded-full bg-intel-green animate-pulse" />
            <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest">Signal: Locked</span>
          </div>
        </div>
      </div>

      {/* Main Player Area */}
      <div className="p-4 flex-1 overflow-y-auto space-y-4">
        {/* TOP SECTION — Active stream viewer */}
        <div className="w-full">
          {activeStream.type === 'TV' ? (
            activeStream.embedId ? (
              <div className="relative bg-black aspect-video w-full overflow-hidden rounded-lg border border-intel-cyan/20 shadow-[0_0_20px_rgba(0,242,255,0.05)]">
                <iframe
                  key={activeStream.id}
                  src={`https://www.youtube.com/embed/${activeStream.embedId}?autoplay=1&mute=1&controls=1&rel=0`}
                  className="absolute inset-0 w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  onError={() => setIframeError(true)}
                />
                {iframeError && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 space-y-2 z-10">
                    <Zap className="w-6 h-6 text-intel-red mb-2" />
                    <div className="text-[10px] font-mono text-slate-500 uppercase">Stream Unavailable</div>
                    <div className="text-[8px] font-mono text-slate-600">{activeStream.name}</div>
                  </div>
                )}
              </div>
            ) : (
              <div className="aspect-video w-full bg-black/80 border border-intel-border rounded-lg flex flex-col items-center justify-center space-y-3">
                <div className="w-3 h-3 border-2 border-intel-cyan/40 border-t-intel-cyan rounded-full animate-spin"/>
                <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Signal Acquisition</div>
                <div className="text-[9px] font-mono text-intel-cyan">{activeStream.name}</div>
                <div className="text-[8px] font-mono text-slate-600">{activeStream.location}</div>
              </div>
            )
          ) : (
            <div className="w-full bg-black/80 border border-intel-border rounded-lg p-6 flex flex-col items-center space-y-4">
              {/* Animated radio wave visualization */}
              <div className="flex items-end space-x-1 h-12">
                {[...Array(20)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-1.5 bg-intel-cyan rounded-full transition-all ${isPlaying ? 'animate-pulse' : ''}`}
                    style={{
                      height: isPlaying 
                        ? `${20 + Math.sin(i * 0.8) * 15 + Math.random() * 10}px` 
                        : '4px',
                      animationDelay: `${i * 50}ms`
                    }}
                  />
                ))}
              </div>
              
              <div className="text-center">
                <div className="text-sm font-bold font-mono text-white uppercase tracking-tighter">
                  {activeStream.name}
                </div>
                <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mt-1">
                  {activeStream.freq} · {activeStream.location}
                </div>
              </div>
              
              {/* Hidden audio element */}
              <audio
                ref={audioRef}
                src={activeStream.streamUrl}
                onError={() => setIframeError(true)}
              />
              
              {/* Controls row */}
              <div className="flex items-center space-x-6">
                <button 
                  onClick={togglePlay} 
                  className="w-10 h-10 rounded-full bg-intel-cyan/10 border border-intel-cyan/30 flex items-center justify-center text-intel-cyan hover:bg-intel-cyan/20 transition-all"
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                </button>
                <div className="flex items-center space-x-3">
                  <Volume2 className="w-4 h-4 text-slate-500" />
                  <input 
                    type="range" 
                    min="0" 
                    max="1" 
                    step="0.05"
                    value={volume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    className="w-24 h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-intel-cyan"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Stream info bar below viewer */}
        <div className="flex items-center justify-between bg-white/5 border border-white/10 p-3 rounded-xl">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-intel-red animate-pulse" />
              <span className="text-[10px] font-mono text-white font-bold uppercase tracking-widest">Live</span>
            </div>
            <div className="w-px h-4 bg-white/10" />
            <div>
              <div className="text-[10px] font-bold text-white uppercase tracking-tighter">{activeStream.name}</div>
              <div className="text-[8px] font-mono text-slate-500 uppercase tracking-widest">{activeStream.location} · {activeStream.lang}</div>
            </div>
          </div>
          <div className="px-2 py-1 bg-intel-cyan/10 border border-intel-cyan/20 rounded text-[8px] font-mono text-intel-cyan uppercase font-bold tracking-widest">
            {activeStream.category.replace('_', ' ')}
          </div>
        </div>

        {/* BOTTOM SECTION — Category tabs + stream selector */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2 bg-white/5 p-1 rounded-xl border border-white/10">
            {[
              { id: 'INTERNATIONAL', label: 'International', icon: Globe },
              { id: 'LOCAL_TV', label: 'Local TV', icon: Tv },
              { id: 'RADIO', label: 'Radio', icon: Music },
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id as StreamCategory)}
                className={`flex-1 flex items-center justify-center space-x-2 py-2 rounded-lg text-[9px] font-mono uppercase tracking-widest transition-all ${
                  activeCategory === cat.id 
                    ? 'text-intel-cyan bg-intel-cyan/10 border border-intel-cyan/30 font-bold' 
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <cat.icon className="w-3 h-3" />
                <span>{cat.label}</span>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {filteredStreams.map(stream => (
              <button
                key={stream.id}
                onClick={() => handleStreamSelect(stream)}
                className={`p-3 rounded-xl border transition-all flex flex-col items-start text-left relative group ${
                  activeStream.id === stream.id 
                    ? 'bg-intel-cyan/10 border-intel-cyan/50 shadow-[0_0_15px_rgba(0,242,255,0.1)]' 
                    : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className={`text-[10px] font-bold font-mono tracking-tighter uppercase ${activeStream.id === stream.id ? 'text-intel-cyan' : 'text-slate-300'}`}>
                    {stream.name}
                  </span>
                  {activeStream.id === stream.id && (
                    <div className="w-1.5 h-1.5 rounded-full bg-intel-cyan animate-pulse" />
                  )}
                </div>
                <div className="text-[8px] font-mono text-slate-500 uppercase tracking-widest truncate w-full">
                  {stream.location}
                </div>
                <div className="flex items-center justify-between w-full mt-2">
                  <span className="text-[7px] font-mono text-slate-600 uppercase tracking-widest">{stream.lang}</span>
                  {stream.type === 'RADIO' && (
                    <span className="text-[7px] font-mono text-intel-cyan/60 uppercase">{stream.freq}</span>
                  )}
                </div>
                {activeStream.id === stream.id && (
                  <div className="absolute top-0 right-0 w-1 h-full bg-intel-cyan rounded-r-xl" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="bg-black/80 p-3 flex items-center justify-between border-t border-intel-border">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1.5">
            <Shield className="w-3 h-3 text-intel-cyan" />
            <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest">Secure Uplink</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <Eye className="w-3 h-3 text-slate-500" />
            <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest">Active Monitoring</span>
          </div>
        </div>
        <div className="flex items-center space-x-1 text-[8px] font-mono text-intel-cyan uppercase font-bold tracking-widest">
          <span>Source: Tactical OSINT Network</span>
          <ArrowUpRight className="w-2.5 h-2.5" />
        </div>
      </div>
    </div>
  );
};
