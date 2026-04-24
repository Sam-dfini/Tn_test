import React from 'react';
import { FileText, AlertCircle, Copy } from 'lucide-react';

interface NewsPanelProps {
  articles: any[];
  invalidCount: number;
  duplicateCount: number;
}

export const NewsPanel: React.FC<NewsPanelProps> = ({ articles, invalidCount, duplicateCount }) => {
  return (
    <div className="h-full p-4 flex flex-col space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-widest text-white/60 flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-400" />
          Articles (News)
        </h3>
        <span className="text-lg font-mono font-bold text-white/90">{articles.length}</span>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[10px] text-white/30 uppercase font-bold tracking-tighter">
            <AlertCircle className="w-3 h-3" />
            Invalid (Dropped)
          </div>
          <span className={`text-xs font-mono font-bold ${invalidCount > 0 ? 'text-amber-400' : 'text-white/20'}`}>
            {invalidCount}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[10px] text-white/30 uppercase font-bold tracking-tighter">
            <Copy className="w-3 h-3" />
            Duplicates
          </div>
          <span className={`text-xs font-mono font-bold ${duplicateCount > 0 ? 'text-amber-500' : 'text-white/20'}`}>
            {duplicateCount}
          </span>
        </div>
      </div>

      <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden">
        <div 
          className="h-full bg-blue-500 transition-all duration-500" 
          style={{ width: `${Math.min(100, (articles.length / 500) * 100)}%` }} 
        />
      </div>
      <span className="text-[9px] text-white/20 font-mono italic">Buffer: {articles.length}/500 entries (sliding window)</span>
    </div>
  );
};
