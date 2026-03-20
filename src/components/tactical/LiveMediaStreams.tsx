import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Radio, Activity, Maximize2, Settings, Shield, Zap, Eye,
  Play, Pause, Volume2, VolumeX, SkipBack, SkipForward,
  Tv, Music, Globe
} from 'lucide-react';
import ReactPlayer from 'react-player';

const Player = ReactPlayer as any;

type StreamCategory = 'INTERNATIONAL' | 'LOCAL_TV' | 'RADIO';

interface Stream {
  id: string;
  name: string;
  url: string;
  category: StreamCategory;
  location: string;
  bitrate: string;
}

const STREAMS: Stream[] = [
  // International
  {
    id: 'int-1',
    name: 'AL JAZEERA',
    url: 'https://www.youtube.com/watch?v=bNyUyrR0PHo',
    category: 'INTERNATIONAL',
    location: 'Doha, Qatar',
    bitrate: '4.8 Mbps'
  },
  {
    id: 'int-2',
    name: 'AL ARABIYA',
    url: 'https://www.youtube.com/watch?v=O3_m_S_zX_A',
    category: 'INTERNATIONAL',
    location: 'Dubai, UAE',
    bitrate: '4.5 Mbps'
  },
  {
    id: 'int-3',
    name: 'SKY NEWS ARABIA',
    url: 'https://www.youtube.com/watch?v=9AuqejYxE_8',
    category: 'INTERNATIONAL',
    location: 'Abu Dhabi, UAE',
    bitrate: '4.2 Mbps'
  },
  {
    id: 'int-4',
    name: 'FRANCE 24 AR',
    url: 'https://www.youtube.com/watch?v=wwM_vS_zX_A',
    category: 'INTERNATIONAL',
    location: 'Paris, France',
    bitrate: '4.2 Mbps'
  },
  // Local TV
  {
    id: 'loc-1',
    name: 'AL WATANIYA 1',
    url: 'https://www.youtube.com/watch?v=O_6_6_6_6_6', // Placeholder
    category: 'LOCAL_TV',
    location: 'Tunis, Tunisia',
    bitrate: '3.5 Mbps'
  },
  {
    id: 'loc-2',
    name: 'AL WATANIYA 2',
    url: 'https://www.youtube.com/watch?v=X_X_X_X_X_X', // Placeholder
    category: 'LOCAL_TV',
    location: 'Tunis, Tunisia',
    bitrate: '3.2 Mbps'
  },
  {
    id: 'loc-3',
    name: 'ATTESSIA TV',
    url: 'https://www.youtube.com/watch?v=Y_Y_Y_Y_Y_Y', // Placeholder
    category: 'LOCAL_TV',
    location: 'Tunis, Tunisia',
    bitrate: '4.0 Mbps'
  },
  // Radio
  {
    id: 'rad-1',
    name: 'MOSAIQUE FM',
    url: 'https://radio.mosaiquefm.net/mosalive',
    category: 'RADIO',
    location: 'Tunis, Tunisia',
    bitrate: '128 kbps'
  },
  {
    id: 'rad-2',
    name: 'SHEMS FM',
    url: 'http://shoutcast.shemsfm.net:8000/shems',
    category: 'RADIO',
    location: 'Tunis, Tunisia',
    bitrate: '128 kbps'
  },
  {
    id: 'rad-3',
    name: 'EXPRESS FM',
    url: 'http://expressfm.ice.infomaniak.ch/expressfm-128.mp3',
    category: 'RADIO',
    location: 'Tunis, Tunisia',
    bitrate: '128 kbps'
  }
];

export const LiveMediaStreams: React.FC = () => {
  const [activeStream, setActiveStream] = useState<Stream>(STREAMS[0]);
  const [customUrls, setCustomUrls] = useState<Record<string, string>>({});
  const [isPlaying, setIsPlaying] = useState(true);
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(true);
  const [played, setPlayed] = useState(0);
  const [duration, setDuration] = useState(0);
  const [activeCategory, setActiveCategory] = useState<StreamCategory>('INTERNATIONAL');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [tempUrl, setTempUrl] = useState('');
  const [errorStatus, setErrorStatus] = useState<{ hasError: boolean; message: string }>({ hasError: false, message: '' });
  
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [canPlay, setCanPlay] = useState(false);
  const playerInstanceRef = useRef<any>(null);
  const playerRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      setIsPlaying(false);
    };
  }, []);

  const validateYoutubeUrl = (url: string) => {
    if (!url) return false;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11);
  };

  const normalizeUrl = (url: string) => {
    if (!url) return '';
    
    // Check if it's a YouTube URL and validate it
    const isYoutube = url.includes('youtube.com') || url.includes('youtu.be');
    if (isYoutube && !validateYoutubeUrl(url)) {
      return 'INVALID_YOUTUBE_URL';
    }

    // Convert youtube.com/live/ID to youtube.com/watch?v=ID
    if (url.includes('youtube.com/live/')) {
      const parts = url.split('youtube.com/live/');
      const id = parts[1].split('?')[0];
      return `https://www.youtube.com/watch?v=${id}`;
    }
    return url;
  };

  const currentUrl = normalizeUrl(customUrls[activeStream.id] || activeStream.url);

  useEffect(() => {
    setCanPlay(false);
    setIsPlayerReady(false);
  }, [currentUrl]);

  const handlePlayPause = () => setIsPlaying(!isPlaying);
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    setIsMuted(val === 0);
  };
  const handleToggleMute = () => setIsMuted(!isMuted);
  const handleProgress = (state: any) => setPlayed(state.played);
  const handleDuration = (dur: number) => setDuration(dur);
  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setPlayed(val);
    if (isPlayerReady && playerInstanceRef.current && typeof playerInstanceRef.current.seekTo === 'function') {
      try {
        playerInstanceRef.current.seekTo(val);
      } catch (err) {
        console.error('Seek error:', err);
      }
    }
  };

  const handleOpenSettings = () => {
    setTempUrl(currentUrl === 'INVALID_YOUTUBE_URL' ? '' : currentUrl);
    setIsSettingsOpen(true);
  };

  const handleSaveUrl = () => {
    if (tempUrl && (tempUrl.includes('youtube.com') || tempUrl.includes('youtu.be')) && !validateYoutubeUrl(tempUrl)) {
      setErrorStatus({ hasError: true, message: 'CRITICAL: Invalid YouTube URL detected. Handshake failed.' });
      return;
    }
    setCustomUrls(prev => ({ ...prev, [activeStream.id]: tempUrl }));
    setErrorStatus({ hasError: false, message: '' });
    setIsSettingsOpen(false);
  };

  const handleRefresh = () => {
    const url = currentUrl;
    setCustomUrls(prev => ({ ...prev, [activeStream.id]: '' }));
    setTimeout(() => {
      setCustomUrls(prev => ({ ...prev, [activeStream.id]: url }));
      setErrorStatus({ hasError: false, message: '' });
    }, 10);
  };

  const handleError = (e: any) => {
    console.error('Player Error:', e);
    let msg = 'The stream source is unreachable or restricted.';
    if (currentUrl === 'INVALID_YOUTUBE_URL') {
      msg = 'CRITICAL: Invalid YouTube URL. Video ID extraction failed.';
    } else if (currentUrl.includes('youtube.com')) {
      msg = 'Uplink restricted by YouTube. Embedding may be disabled for this live content.';
    }
    setErrorStatus({ hasError: true, message: msg });
  };

  const filteredStreams = STREAMS.filter(s => s.category === activeCategory);

  return (
    <div className="glass rounded-lg border border-intel-border overflow-hidden flex flex-col h-[600px] relative">
      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-6">
          <div className="w-full max-w-md bg-[#0a0e14] border border-intel-cyan/30 p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-intel-cyan/20 pb-2">
              <h4 className="text-[10px] font-mono text-intel-cyan uppercase font-bold tracking-widest">Stream Configuration</h4>
              <button onClick={() => setIsSettingsOpen(false)} className="text-slate-500 hover:text-white">
                <Settings className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2">
              <label className="text-[8px] font-mono text-slate-400 uppercase">Active Stream: {activeStream.name}</label>
              <div className="flex flex-col space-y-1">
                <span className="text-[7px] font-mono text-intel-cyan uppercase">Source URL (YouTube/HLS/MP4)</span>
                <input 
                  type="text" 
                  value={tempUrl}
                  onChange={(e) => setTempUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="bg-black border border-intel-cyan/20 p-2 text-[10px] font-mono text-white focus:border-intel-cyan outline-none w-full"
                />
              </div>
              <p className="text-[7px] font-mono text-slate-500 italic">
                Note: Some YouTube live streams may restrict embedding. Use direct stream links if available.
              </p>
            </div>
            <div className="flex space-x-2 pt-2">
              <button 
                onClick={handleSaveUrl}
                className="flex-1 bg-intel-cyan/20 border border-intel-cyan/50 text-intel-cyan text-[9px] font-mono uppercase py-2 hover:bg-intel-cyan/30 transition-all"
              >
                Update Uplink
              </button>
              <button 
                onClick={handleRefresh}
                className="flex-1 bg-white/5 border border-white/10 text-slate-400 text-[9px] font-mono uppercase py-2 hover:bg-white/10 transition-all"
              >
                Reset & Refresh
              </button>
            </div>
          </div>
        </div>
      )}

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
          <h3 className="text-xs font-mono text-intel-cyan uppercase font-bold tracking-widest">Live Media Streams</h3>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1">
            <Activity className="w-3 h-3 text-intel-green" />
            <span className="text-[8px] font-mono text-slate-500 uppercase">Uplink: Stable</span>
          </div>
          <Settings 
            onClick={handleOpenSettings}
            className="w-3 h-3 text-slate-500 cursor-pointer hover:text-intel-cyan transition-colors" 
          />
        </div>
      </div>

      {/* Main Player Area */}
      <div className="relative flex-1 bg-black group overflow-hidden">
        {errorStatus.hasError && (
          <div className="absolute inset-0 z-20 bg-black/80 flex flex-col items-center justify-center p-6 text-center">
            <Zap className="w-8 h-8 text-intel-red mb-2" />
            <h4 className="text-xs font-mono text-white uppercase font-bold mb-1">Uplink Failure</h4>
            <p className="text-[9px] font-mono text-slate-400 uppercase mb-4 max-w-[250px] leading-relaxed">
              {errorStatus.message}
            </p>
            <div className="flex space-x-2">
              <button 
                onClick={handleRefresh}
                className="px-4 py-2 bg-intel-cyan/10 border border-intel-cyan/50 text-intel-cyan text-[9px] font-mono uppercase hover:bg-intel-cyan/20 transition-all"
              >
                Retry Connection
              </button>
              <button 
                onClick={handleOpenSettings}
                className="px-4 py-2 border border-white/20 text-white text-[9px] font-mono uppercase hover:bg-white/10 transition-all"
              >
                Configure Manual Uplink
              </button>
            </div>
          </div>
        )}

        <div className="absolute inset-0 z-0">
          <Player
            key={currentUrl}
            ref={playerRef}
            url={currentUrl === 'INVALID_YOUTUBE_URL' ? '' : currentUrl}
            playing={isPlaying && canPlay}
            volume={volume}
            muted={isMuted}
            onProgress={handleProgress}
            onReady={(player: any) => {
              playerInstanceRef.current = player;
              setIsPlayerReady(true);
              setCanPlay(true);
              setErrorStatus({ hasError: false, message: '' });
              if (player && typeof player.getDuration === 'function') {
                setDuration(player.getDuration());
              }
            }}
            onError={handleError}
            width="100%"
            height="100%"
            config={{
              youtube: {
                playerVars: { 
                  autoplay: 0, // Disable autoplay to avoid play() interruption
                  modestbranding: 1,
                  rel: 0,
                  origin: window.location.origin,
                  enablejsapi: 1
                }
              } as any
            }}
          />
        </div>

        {/* Tactical Overlay on Video */}
        <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between p-4">
          <div className="flex justify-between items-start">
            <div className="bg-black/60 backdrop-blur-sm border border-intel-cyan/30 p-2">
              <div className="flex items-center space-x-2 mb-1">
                <div className="w-1.5 h-1.5 rounded-full bg-intel-red animate-pulse"></div>
                <span className="text-[10px] font-mono text-white font-bold tracking-tighter uppercase">REC // {activeStream.name}</span>
              </div>
              <div className="text-[8px] font-mono text-intel-cyan uppercase">{activeStream.location}</div>
            </div>
            <div className="bg-black/60 backdrop-blur-sm border border-intel-cyan/30 p-2 text-right pointer-events-auto">
              <div className="text-[10px] font-mono text-white font-bold uppercase">{new Date().toLocaleTimeString()}</div>
              <div className="text-[8px] font-mono text-slate-400 uppercase">LAT: 34.74° N // LON: 10.76° E</div>
              <a 
                href={currentUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[7px] font-mono text-intel-cyan hover:underline block mt-1"
              >
                EXTERNAL_LINK_UPLINK
              </a>
            </div>
          </div>

          {/* Player Controls Overlay */}
          <div className="flex flex-col space-y-2 pointer-events-auto">
            {/* Progress Bar */}
            <div className="flex items-center space-x-2 group/progress">
              <span className="text-[8px] font-mono text-slate-400 min-w-[30px]">
                {Math.floor(played * duration / 60)}:{Math.floor(played * duration % 60).toString().padStart(2, '0')}
              </span>
              <input 
                type="range" 
                min={0} 
                max={0.999999} 
                step="any"
                value={played}
                onChange={handleSeekChange}
                className="flex-1 h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-intel-cyan"
              />
              <span className="text-[8px] font-mono text-slate-400 min-w-[30px]">
                {Math.floor(duration / 60)}:{Math.floor(duration % 60).toString().padStart(2, '0')}
              </span>
            </div>

            <div className="flex justify-between items-end">
              <div className="flex items-center space-x-3">
                <button 
                  onClick={handlePlayPause}
                  className="p-2 bg-black/60 border border-white/10 hover:border-intel-cyan/50 text-white transition-all rounded-sm"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
                
                <div className="flex items-center space-x-2 bg-black/60 border border-white/10 p-1 rounded-sm">
                  <button onClick={handleToggleMute} className="text-white hover:text-intel-cyan transition-colors">
                    {isMuted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                  </button>
                  <input 
                    type="range" 
                    min={0} 
                    max={1} 
                    step="any" 
                    value={volume}
                    onChange={handleVolumeChange}
                    className="w-16 h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-intel-cyan"
                  />
                </div>

                <div className="flex items-center space-x-1">
                  <Zap className="w-3 h-3 text-intel-orange" />
                  <span className="text-[8px] font-mono text-white uppercase">Signal: 94%</span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button className="p-2 bg-black/60 border border-white/10 hover:border-intel-cyan/50 text-white transition-all rounded-sm">
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Corner Brackets */}
          <div className="absolute top-2 left-2 w-4 h-4 border-t border-l border-white/20"></div>
          <div className="absolute top-2 right-2 w-4 h-4 border-t border-r border-white/20"></div>
          <div className="absolute bottom-2 left-2 w-4 h-4 border-b border-l border-white/20"></div>
          <div className="absolute bottom-2 right-2 w-4 h-4 border-b border-r border-white/20"></div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex border-b border-intel-border bg-black/20">
        {[
          { id: 'INTERNATIONAL', label: 'International', icon: Globe },
          { id: 'LOCAL_TV', label: 'Local TV', icon: Tv },
          { id: 'RADIO', label: 'Radio', icon: Music },
        ].map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id as StreamCategory)}
            className={`flex-1 flex items-center justify-center space-x-2 py-2 text-[9px] font-mono uppercase tracking-wider transition-all ${
              activeCategory === cat.id 
                ? 'text-intel-cyan bg-intel-cyan/10 border-b-2 border-intel-cyan' 
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <cat.icon className="w-3 h-3" />
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Stream Selector */}
      <div className="bg-black/60 p-2 overflow-y-auto max-h-[150px]">
        <div className="grid grid-cols-2 gap-2">
          {filteredStreams.map(stream => (
            <button
              key={stream.id}
              onClick={() => setActiveStream(stream)}
              className={`p-2 border transition-all flex flex-col items-start text-left ${
                activeStream.id === stream.id 
                  ? 'bg-intel-cyan/10 border-intel-cyan/50' 
                  : 'bg-white/5 border-white/10 hover:bg-white/10'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span className={`text-[9px] font-bold font-mono ${activeStream.id === stream.id ? 'text-intel-cyan' : 'text-slate-400'}`}>
                  {stream.name}
                </span>
                <div className={`w-1 h-1 rounded-full ${activeStream.id === stream.id ? 'bg-intel-cyan animate-pulse' : 'bg-slate-600'}`}></div>
              </div>
              <div className="text-[7px] font-mono text-slate-500 uppercase truncate w-full">
                {stream.location}
              </div>
              <div className="flex items-center justify-between w-full mt-1">
                <span className="text-[6px] font-mono text-slate-600">{stream.bitrate}</span>
                <span className="text-[6px] font-mono text-slate-600 uppercase">{stream.category}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Footer Info */}
      <div className="bg-black/80 p-2 flex items-center justify-between border-t border-intel-border">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <Shield className="w-2.5 h-2.5 text-intel-cyan" />
            <span className="text-[7px] font-mono text-slate-500 uppercase">Secure Stream</span>
          </div>
          <div className="flex items-center space-x-1">
            <Eye className="w-2.5 h-2.5 text-slate-500" />
            <span className="text-[7px] font-mono text-slate-500 uppercase">Active Monitoring</span>
          </div>
        </div>
        <div className="text-[7px] font-mono text-intel-cyan uppercase font-bold">
          Source: Tactical OSINT Network
        </div>
      </div>
    </div>
  );
};

