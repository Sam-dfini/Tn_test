import React from 'react';

export const EmptyState: React.FC<{
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}> = ({ icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-16 space-y-4 text-center">
    {icon && (
      <div className="w-12 h-12 rounded-full bg-intel-border/30 flex items-center justify-center text-slate-500">
        {icon}
      </div>
    )}
    <div className="text-sm font-bold text-slate-400 uppercase tracking-widest">{title}</div>
    {description && (
      <p className="text-xs text-slate-600 max-w-xs leading-relaxed">
        {description}
      </p>
    )}
    {action && (
      <button
        onClick={action.onClick}
        className="text-[10px] font-mono text-intel-cyan border border-intel-cyan/30 px-3 py-1.5 rounded-lg hover:bg-intel-cyan/10 transition-all"
      >
        {action.label}
      </button>
    )}
  </div>
);
