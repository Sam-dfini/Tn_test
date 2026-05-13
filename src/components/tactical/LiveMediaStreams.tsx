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
  iframeUrl?: string;
  streamUrl?: string;
  category: StreamCategory;
  location: string;
  lang: string;
  freq?: string;
}

const STREAMS: Stream[] = [
  // International TV
  {
    id: 'int-1',
    name: 'AL JAZEERA ARABIC',
    type: 'TV',
    embedId: 'bNyUyrR0PHo',
    category: 'INTERNATIONAL',
    location: 'Doha, Qatar',
    lang: 'AR'
  },
  {
    id: 'int-2', 
    name: 'AL ARABIYA',
    type: 'TV',
    embedId: 'n7eQejkXbnM',
    category: 'INTERNATIONAL',
    location: 'Dubai, UAE',
    lang: 'AR'
  },
  {
    id: 'int-3',
    name: 'FRANCE 24 ARABIC',
    type: 'TV',
    embedId: '3ursYA8HMeo',
    category: 'INTERNATIONAL',
    location: 'Paris, France',
    lang: 'AR/FR'
  },
  {
    id: 'int-4',
    name: 'EURONEWS ARABIC',
    type: 'TV',
    embedId: 'LD24ljIuOmI',
    category: 'INTERNATIONAL',
    location: 'Lyon, France',
    lang: 'AR'
  },
  {
    id: 'int-5',
    name: 'BBC NEWS ARABIC',
    type: 'TV',
    embedId: 'O1pGmVtj2Y8',
    category: 'INTERNATIONAL',
    location: 'London, UK',
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
  // Private Radio Stations
  { id: 'rad-1', name: 'MOSAIQUE FM', type: 'RADIO', streamUrl: 'https://radio.mosaiquefm.net/mosalive', category: 'RADIO', location: 'Tunis', lang: 'AR/FR' },
  { id: 'rad-2', name: 'SHEMS FM', type: 'RADIO', streamUrl: 'http://shmsfm.ice.infomaniak.ch/shmsfm-192.mp3', category: 'RADIO', location: 'Tunis', lang: 'AR' },
  { id: 'rad-3', name: 'JAWHARA FM', type: 'RADIO', streamUrl: 'http://streaming2.toute-la-tunisie.com:8000/jawhara', category: 'RADIO', location: 'Sousse', lang: 'AR' },
  { id: 'rad-4', name: 'IFM', type: 'RADIO', streamUrl: 'http://streaming.ifm.tn/direct', category: 'RADIO', location: 'Tunis', lang: 'AR/FR' },
  { id: 'rad-5', name: 'EXPRESS FM', type: 'RADIO', streamUrl: 'http://expressfm.ice.infomaniak.ch/expressfm-64.mp3', category: 'RADIO', location: 'Tunis', lang: 'AR/FR' },
  { id: 'rad-6', name: 'DIWAN FM', type: 'RADIO', streamUrl: 'http://streaming.diwanfm.net/stream', category: 'RADIO', location: 'Sfax', lang: 'AR' },
  { id: 'rad-7', name: 'CAP FM', type: 'RADIO', streamUrl: 'http://stream6.tanitweb.com/capfm', category: 'RADIO', location: 'Hammamet', lang: 'AR' },
  { id: 'rad-8', name: 'KNOOZ FM', type: 'RADIO', streamUrl: 'https://streaming.knoozfm.net/knoozfm', category: 'RADIO', location: 'Sousse', lang: 'AR' },

  // Public / State Radio Stations
  { id: 'rad-9', name: 'RADIO NATIONALE', type: 'RADIO', streamUrl: 'http://rtstream.tanitweb.com/nationale', category: 'RADIO', location: 'Tunis', lang: 'AR' },
  { id: 'rad-10', name: 'RTCI', type: 'RADIO', streamUrl: 'http://rtstream.tanitweb.com/rtci', category: 'RADIO', location: 'Tunis', lang: 'FR/EN/IT' },
  { id: 'rad-11', name: 'RADIO JEUNES', type: 'RADIO', streamUrl: 'http://rtstream.tanitweb.com/jeunes', category: 'RADIO', location: 'Tunis', lang: 'AR' },
  { id: 'rad-12', name: 'RADIO CULTURELLE', type: 'RADIO', streamUrl: 'http://rtstream.tanitweb.com/culturelle', category: 'RADIO', location: 'Tunis', lang: 'AR' },
  { id: 'rad-13', name: 'RADIO PANORAMA', type: 'RADIO', streamUrl: 'http://rtstream.tanitweb.com/panorama', category: 'RADIO', location: 'Tunis', lang: 'AR' },
  { id: 'rad-14', name: 'ZITOUNA FM', type: 'RADIO', streamUrl: 'https://stream.zitounafm.net/radio/8000/radio.mp3', category: 'RADIO', location: 'Tunis', lang: 'AR' },

  // Regional Stations
  { id: 'rad-15', name: 'RADIO SFAX', type: 'RADIO', streamUrl: 'http://rtstream.tanitweb.com/sfax', category: 'RADIO', location: 'Sfax', lang: 'AR' },
  { id: 'rad-16', name: 'RADIO MONASTIR', type: 'RADIO', streamUrl: 'http://rtstream.tanitweb.com/monastir', category: 'RADIO', location: 'Monastir', lang: 'AR' },
  { id: 'rad-17', name: 'RADIO GAFSA', type: 'RADIO', streamUrl: 'http://rtstream.tanitweb.com/gafsa', category: 'RADIO', location: 'Gafsa', lang: 'AR' },
  { id: 'rad-18', name: 'RADIO LE KEF', type: 'RADIO', streamUrl: 'http://rtstream.tanitweb.com/kef', category: 'RADIO', location: 'Le Kef', lang: 'AR' },
  { id: 'rad-19', name: 'RADIO TATAOUINE', type: 'RADIO', streamUrl: 'http://rtstream.tanitweb.com/tataouine', category: 'RADIO', location: 'Tataouine', lang: 'AR' },

  // Specialty Streams (Mosaique)
  { id: 'rad-20', name: 'MOSAIQUE TOUNSI', type: 'RADIO', streamUrl: 'https://radio.mosaiquefm.net/tounsi', category: 'RADIO', location: 'Tunis', lang: 'AR' },
  { id: 'rad-21', name: 'MOSAIQUE GOLD', type: 'RADIO', streamUrl: 'https://radio.mosaiquefm.net/gold', category: 'RADIO', location: 'Tunis', lang: 'AR' },
  { id: 'rad-22', name: 'MOSAIQUE TARAB', type: 'RADIO', streamUrl: 'https://radio.mosaiquefm.net/tarab', category: 'RADIO', location: 'Tunis', lang: 'AR' }
];

export const LiveMediaStreams: React.FC = () => {
  const initialStream = STREAMS.find(s => s.id === 'rad-1') || STREAMS[0];
  const [activeStream, setActiveStream] = useState<Stream>(initialStream);
  const [activeCategory, setActiveCategory] = useState<StreamCategory>('RADIO');
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [iframeError, setIframeError] = useState(false);
  const [brokenStreams, setBrokenStreams] = useState<string[]>([]);
  
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    // Attempt autoplay on mount for Mosaique FM
    if (audioRef.current && activeStream.id === 'rad-1') {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((err) => {
        console.log("Autoplay prevented by browser:", err);
      });
    }
  }, []);

  const handleStreamError = () => {
    setIframeError(true);
    if (!brokenStreams.includes(activeStream.id)) {
      setBrokenStreams(prev => [...prev, activeStream.id]);
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(() => handleStreamError());
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
    <div className="glass rounded-lg border border-intel-border overflow-hidden flex flex-col h-full relative">
      {/* Main Player Area */}
      <div className="p-4 flex-1 overflow-y-auto space-y-4">
        {/* TOP SECTION — Active stream viewer */}
        <div className="w-full">
          {activeStream.type === 'TV' ? (
            activeStream.embedId || activeStream.iframeUrl ? (
              <div className="relative bg-black aspect-video w-full overflow-hidden rounded-lg border border-intel-cyan/20 shadow-[0_0_20px_rgba(0,242,255,0.05)]">
                <iframe
                  key={activeStream.id}
                  src={activeStream.embedId ? `https://www.youtube.com/embed/${activeStream.embedId}?autoplay=1&mute=1&controls=1&rel=0` : activeStream.iframeUrl}
                  className="absolute inset-0 w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  onError={handleStreamError}
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
                    key={`wave-${i}`}
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
                onError={handleStreamError}
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
          <div className="grid grid-cols-2 gap-2 pb-2">
            {[
              { id: 'INTERNATIONAL', label: 'International', icon: Globe },
              { id: 'LOCAL_TV', label: 'Local TV', icon: Tv },
              { id: 'RADIO', label: 'Radio', icon: Radio },
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id as StreamCategory)}
                className={`flex items-center justify-center space-x-2 px-3 py-1.5 rounded-xl transition-all duration-300 border ${
                  activeCategory === cat.id 
                    ? 'bg-intel-cyan/10 border-intel-cyan text-intel-cyan shadow-[0_0_15px_rgba(0,242,255,0.1)]' 
                    : 'bg-white/5 border-intel-border text-slate-500 hover:border-white/20 hover:text-white'
                } ${cat.id === 'RADIO' ? 'col-span-2' : ''}`}
              >
                <cat.icon className={`w-3 h-3 ${activeCategory === cat.id ? 'text-intel-cyan' : 'text-slate-500'}`} />
                <span className="text-[9px] font-mono font-bold uppercase tracking-widest">{cat.label}</span>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {filteredStreams.map((stream, index) => (
              <button
                key={`${stream.id}-${index}`}
                onClick={() => handleStreamSelect(stream)}
                className={`p-3 rounded-xl border transition-all flex flex-col items-start text-left relative group ${
                  activeStream.id === stream.id 
                    ? 'bg-intel-cyan/10 border-intel-cyan/50 shadow-[0_0_15px_rgba(0,242,255,0.1)]' 
                    : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <div className="flex items-center space-x-1.5">
                    {brokenStreams.includes(stream.id) && (
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.8)]" title="Stream offline" />
                    )}
                    <span className={`text-[10px] font-bold font-mono tracking-tighter uppercase ${activeStream.id === stream.id ? 'text-intel-cyan' : 'text-slate-300'}`}>
                      {stream.name}
                    </span>
                  </div>
                  {activeStream.id === stream.id && !brokenStreams.includes(stream.id) && (
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
    </div>
  );
};
