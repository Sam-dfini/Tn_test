import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Clock, Filter, Download, Calendar, Search, AlertCircle } from 'lucide-react';
import eventsData from '../data/events.json';
import { IntelEvent } from '../types/intel';

export const Timeline: React.FC = () => {
  const [filter, setFilter] = useState('all');
  const events = eventsData.events as IntelEvent[];

  const filteredEvents = filter === 'all' ? events : events.filter(e => e.type === filter);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl tracking-tight">Intelligence Timeline</h2>
          <p className="text-slate-500 text-sm mt-1">Chronological event database with type and severity classification</p>
        </div>
        <div className="flex items-center space-x-4">
          <button className="flex items-center space-x-2 bg-intel-card text-slate-400 border border-intel-border px-4 py-2 rounded-lg hover:text-white transition-all">
            <Download className="w-4 h-4" />
            <span className="text-xs font-mono uppercase font-bold">Export CSV</span>
          </button>
        </div>
      </div>

      <div className="flex items-center space-x-4 bg-intel-card p-2 rounded-xl border border-intel-border overflow-x-auto scrollbar-hide">
        {['all', 'protest', 'arrest', 'economic', 'political', 'detention'].map(t => (
          <button 
            key={t}
            onClick={() => setFilter(t)}
            className={`px-4 py-2 rounded-lg text-[10px] font-mono uppercase font-bold transition-all whitespace-nowrap ${
              filter === t ? 'bg-intel-cyan/10 text-intel-cyan border border-intel-cyan/20' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-intel-cyan/50 before:via-intel-border before:to-transparent">
        {filteredEvents.map((event, i) => (
          <motion.div 
            key={event.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group"
          >
            {/* Dot */}
            <div className="flex items-center justify-center w-10 h-10 rounded-full border border-intel-border bg-intel-bg text-intel-cyan shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
              <Clock className="w-5 h-5" />
            </div>
            
            {/* Content */}
            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] glass p-6 rounded-2xl border border-intel-border hover:border-intel-cyan/30 transition-all">
              <div className="flex items-center justify-between mb-2">
                <time className="text-[10px] font-mono text-intel-cyan font-bold uppercase tracking-widest">{event.date}</time>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-0.5 rounded text-[8px] font-mono font-bold border ${
                    event.severity === 3 ? 'bg-intel-red/10 text-intel-red border-intel-red/20' :
                    event.severity === 2 ? 'bg-intel-orange/10 text-intel-orange border-intel-orange/20' :
                    'bg-intel-green/10 text-intel-green border-intel-green/20'
                  }`}>
                    LVL {event.severity}
                  </span>
                  {event.urgent && <AlertCircle className="w-3 h-3 text-intel-red animate-pulse" />}
                </div>
              </div>
              <div className="text-sm font-bold text-white uppercase tracking-tight mb-2">{event.title}</div>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">{event.summary}</p>
              
              <div className="flex items-center justify-between pt-4 border-t border-intel-border/50">
                <div className="flex items-center space-x-2">
                  <span className="text-[8px] font-mono text-slate-500 uppercase">Governorate:</span>
                  <span className="text-[8px] font-mono text-white uppercase font-bold">{event.gov}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-[8px] font-mono text-slate-500 uppercase">Source:</span>
                  <span className="text-[8px] font-mono text-intel-cyan uppercase font-bold">{event.source}</span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
