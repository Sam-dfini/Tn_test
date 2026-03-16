import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Play, Video, Twitter, Radio, Search, Filter, ExternalLink, Clock, Eye } from 'lucide-react';

interface MediaItem {
  id: string;
  type: 'video' | 'social' | 'news';
  source: string;
  title: string;
  timestamp: string;
  thumbnail: string;
  views?: string;
  urgent?: boolean;
}

const mediaData: MediaItem[] = [
  {
    id: '1',
    type: 'video',
    source: 'INTEL-DRONE-04',
    title: 'Sfax Port Perimeter Monitoring - Zone B',
    timestamp: '10 MIN AGO',
    thumbnail: 'https://picsum.photos/seed/drone1/800/450?grayscale',
    views: 'LIVE',
    urgent: true
  },
  {
    id: '2',
    type: 'social',
    source: 'Twitter/X',
    title: 'Reports of localized protests in Gafsa mining district.',
    timestamp: '22 MIN AGO',
    thumbnail: 'https://picsum.photos/seed/social1/800/450',
  },
  {
    id: '3',
    type: 'news',
    source: 'Tunisia National News',
    title: 'Central Bank announces new monetary policy adjustments.',
    timestamp: '1 HOUR AGO',
    thumbnail: 'https://picsum.photos/seed/news1/800/450?blur=2',
  },
  {
    id: '4',
    type: 'video',
    source: 'CCTV-TUNIS-09',
    title: 'Habib Bourguiba Avenue Traffic Flow',
    timestamp: 'LIVE',
    thumbnail: 'https://picsum.photos/seed/cctv1/800/450?grayscale',
    views: 'LIVE'
  },
  {
    id: '5',
    type: 'social',
    source: 'Facebook Intelligence',
    title: 'Viral narrative regarding water shortages gaining traction in Sousse.',
    timestamp: '2 HOURS AGO',
    thumbnail: 'https://picsum.photos/seed/social2/800/450',
  },
  {
    id: '6',
    type: 'news',
    source: 'Reuters Africa',
    title: 'Mediterranean migration patterns show 15% increase in coastal activity.',
    timestamp: '4 HOURS AGO',
    thumbnail: 'https://picsum.photos/seed/news2/800/450',
  }
];

export const Media: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'video' | 'social' | 'news'>('all');

  const filteredMedia = filter === 'all' ? mediaData : mediaData.filter(m => m.type === filter);

  return (
    <div className="space-y-8">
      <div className="flex flex-col items-center text-center space-y-4">
        <div>
          <h2 className="text-2xl tracking-tight">Media & OSINT Monitoring</h2>
          <p className="text-slate-500 text-sm mt-1">Real-time multimedia intelligence and social sentiment feeds</p>
        </div>
        
        <div className="flex items-center space-x-2 bg-intel-card p-1 rounded-xl border border-intel-border">
          {[
            { id: 'all', label: 'All', icon: Radio },
            { id: 'video', label: 'Video', icon: Video },
            { id: 'social', label: 'Social', icon: Twitter },
            { id: 'news', label: 'News', icon: Radio }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id as any)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-[10px] font-mono uppercase tracking-widest transition-all ${
                filter === f.id 
                  ? 'bg-intel-cyan/10 text-intel-cyan border border-intel-cyan/20' 
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <f.icon className="w-3 h-3" />
              <span>{f.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMedia.map((item) => (
          <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            key={item.id}
            className="group glass rounded-2xl border border-intel-border overflow-hidden hover:border-intel-cyan/40 transition-all"
          >
            <div className="relative aspect-video overflow-hidden">
              <img 
                src={item.thumbnail} 
                alt={item.title} 
                className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-intel-bg via-transparent to-transparent opacity-60"></div>
              
              {item.type === 'video' && (
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-12 h-12 rounded-full bg-intel-cyan/20 backdrop-blur-md flex items-center justify-center border border-intel-cyan/40">
                    <Play className="w-6 h-6 text-intel-cyan fill-intel-cyan" />
                  </div>
                </div>
              )}

              <div className="absolute top-4 left-4 flex items-center space-x-2">
                <div className={`px-2 py-1 rounded text-[8px] font-mono font-bold uppercase border ${
                  item.type === 'video' ? 'bg-intel-red/10 text-intel-red border-intel-red/20' :
                  item.type === 'social' ? 'bg-intel-cyan/10 text-intel-cyan border-intel-cyan/20' :
                  'bg-intel-purple/10 text-intel-purple border-intel-purple/20'
                }`}>
                  {item.type}
                </div>
                {item.urgent && (
                  <div className="px-2 py-1 bg-intel-red rounded text-[8px] font-mono font-bold text-white animate-pulse">
                    LIVE FEED
                  </div>
                )}
              </div>

              {item.views && (
                <div className="absolute bottom-4 right-4 flex items-center space-x-1 text-[8px] font-mono text-white/70">
                  <Eye className="w-3 h-3" />
                  <span>{item.views}</span>
                </div>
              )}
            </div>

            <div className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {item.type === 'social' ? <Twitter className="w-3 h-3 text-intel-cyan" /> : 
                   item.type === 'video' ? <Video className="w-3 h-3 text-intel-red" /> : 
                   <Radio className="w-3 h-3 text-intel-purple" />}
                  <span className="text-[10px] font-mono text-slate-500 uppercase">{item.source}</span>
                </div>
                <div className="flex items-center space-x-1 text-[8px] font-mono text-slate-600">
                  <Clock className="w-3 h-3" />
                  <span>{item.timestamp}</span>
                </div>
              </div>

              <h3 className="text-sm font-bold text-white leading-snug group-hover:text-intel-cyan transition-colors">
                {item.title}
              </h3>

              <div className="pt-4 border-t border-intel-border flex items-center justify-between">
                <button className="text-[10px] font-mono text-intel-cyan uppercase hover:underline flex items-center">
                  Analyze Content <ExternalLink className="w-3 h-3 ml-1" />
                </button>
                <div className="flex space-x-1">
                  <div className="w-1 h-1 bg-intel-cyan rounded-full"></div>
                  <div className="w-1 h-1 bg-intel-cyan rounded-full opacity-50"></div>
                  <div className="w-1 h-1 bg-intel-cyan rounded-full opacity-20"></div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* OSINT Ticker */}
      <div className="glass p-4 rounded-xl border border-intel-border overflow-hidden relative">
        <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-intel-card to-transparent z-10 flex items-center pl-4">
          <span className="text-[10px] font-mono text-intel-cyan font-bold uppercase">LIVE OSINT</span>
        </div>
        <div className="flex animate-marquee whitespace-nowrap space-x-12 pl-24">
          {[
            "SFAX: UNCONFIRMED REPORTS OF PORT BLOCKADE...",
            "GAFSA: MINING ACTIVITY AT 85% CAPACITY...",
            "TUNIS: DIPLOMATIC CONVOY OBSERVED AT MINISTRY...",
            "SOUSSE: TOURISM SENTIMENT INDEX UP 4%...",
            "KASSERINE: SECURITY SWEEP IN MOUNTAINOUS ZONES..."
          ].map((text, i) => (
            <span key={i} className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
              {text}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
