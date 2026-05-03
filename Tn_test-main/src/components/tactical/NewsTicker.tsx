import React from 'react';
import { Radio, Clock } from 'lucide-react';
import { useRSS } from '../../context/RSSContext';
import { assertKey, getRenderKey, prepareList } from '../../lib/keyUtils';

export const NewsTicker: React.FC = () => {
  const { articles, isFetching } = useRSS();

  // Use live RSS articles, sorted by most recent
  // Fall back to empty array gracefully
  const items = articles
    .slice(0, 8)
    .map(a => ({
      id: a.id,
      title: a.title,
      source: a.source_name,
      category: a.category || 'general',
      severity: a.severity,
      governorate: a.governorate,
      time: new Date(a.published_at).toLocaleDateString('en-GB', {
        day: 'numeric', month: 'short'
      }),
      url: a.url,
    }));

  const getSeverityColor = (sev: number) => {
    if (sev >= 4) return 'text-intel-red border-intel-red/20 bg-intel-red/10';
    if (sev >= 3) return 'text-intel-orange border-intel-orange/20 bg-intel-orange/10';
    return 'text-slate-500 border-slate-700';
  };

  return (
    <div className="glass p-4 rounded-lg border border-intel-border
      h-full flex flex-col">
      <div className="flex items-center justify-between mb-3 shrink-0">
        <div className="flex items-center space-x-2">
          <Radio className="w-3 h-3 text-intel-cyan" />
          <h3 className="text-[10px] font-mono text-slate-500
            uppercase tracking-widest">
            Live Feed
          </h3>
        </div>
        <div className="flex items-center space-x-1.5">
          {isFetching && (
            <div className="w-1.5 h-1.5 rounded-full
              bg-intel-cyan animate-pulse" />
          )}
          <span className="text-[8px] font-mono text-slate-700">
            {items.length > 0 ? `${items.length} articles` : 'RSS pending'}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2
        scrollbar-thin scrollbar-thumb-intel-cyan/10">
        {items.length === 0 ? (
          <div className="flex items-center justify-center h-20
            text-[9px] font-mono text-slate-700 text-center">
            RSS feeds will populate<br/>after first fetch
          </div>
        ) : (
          prepareList(items).map((item, index) => (
            <a
              key={assertKey(getRenderKey(item, index, 'ntk'))}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-2.5 rounded-lg border
                border-intel-border/20 bg-black/20
                hover:bg-black/40 hover:border-intel-border/50
                transition-all group"
            >
              <div className="flex items-center
                justify-between mb-1">
                <span className={`text-[7px] font-mono px-1.5
                  py-0.5 rounded border uppercase
                  ${getSeverityColor(item.severity)}`}>
                  {item.category}
                </span>
                <div className="flex items-center space-x-1
                  text-[8px] font-mono text-slate-700">
                  <Clock className="w-2.5 h-2.5" />
                  <span>{item.time}</span>
                </div>
              </div>
              <div className="text-[10px] text-slate-300
                group-hover:text-white transition-colors
                leading-snug line-clamp-2 font-medium">
                {item.title}
              </div>
              <div className="text-[8px] font-mono text-slate-600
                mt-1">
                {item.source}
                {item.governorate && ` · ${item.governorate}`}
              </div>
            </a>
          ))
        )}
      </div>
    </div>
  );
};
