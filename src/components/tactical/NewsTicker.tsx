import React from 'react';
import { usePipeline } from '../../context/PipelineContext';
import eventsData from '../../data/events.json';

export const NewsTicker: React.FC = () => {
  const { data } = usePipeline();

  const events = (eventsData?.events || [])
    .sort((a: any, b: any) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )
    .slice(0, 8);

  const getTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return 'Today';
    if (days === 1) return '1d ago';
    return `${days}d ago`;
  };

  return (
    <div className="glass p-4 rounded-lg border border-intel-border h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Live News Ticker</h3>
        <span className="text-[8px] font-mono text-intel-cyan uppercase font-bold">{events.length} Events</span>
      </div>

      <div className="space-y-4">
        {events.map((event: any, i: number) => (
          <div key={event.id}
            className="space-y-1 border-b border-intel-border/30
            pb-3 last:border-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className={`text-[7px] font-mono font-bold px-1
                  rounded border uppercase ${
                  event.type === 'arrest' || event.urgent
                    ? 'text-intel-red border-intel-red/30 bg-intel-red/10'
                    : event.type === 'economic'
                    ? 'text-intel-orange border-intel-orange/30 bg-intel-orange/10'
                    : 'text-intel-cyan border-intel-cyan/30 bg-intel-cyan/10'
                }`}>
                  {event.type}
                </span>
                <span className="text-[9px] font-bold text-slate-400 font-mono">{event.source}</span>
              </div>
              <span className="text-[8px] font-mono text-slate-600">
                {getTimeAgo(event.date)}
              </span>
            </div>
            <div className="text-[10px] text-slate-300 leading-snug
              uppercase line-clamp-2">{event.title}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
