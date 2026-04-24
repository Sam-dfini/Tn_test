import React from 'react';

interface SubTabNavProps {
  tabs: Array<{ id: string; label: string; icon?: React.ReactNode }>;
  activeTab: string;
  onChange: (id: string) => void;
}

export const SubTabNav: React.FC<SubTabNavProps> = ({ tabs, activeTab, onChange }) => (
  <div className="flex items-center space-x-1 border-b border-intel-border overflow-x-auto scrollbar-hide pb-0 mb-6">
    {tabs.map(tab => (
      <button
        key={tab.id}
        onClick={() => onChange(tab.id)}
        className={`flex items-center space-x-2 px-4 py-2.5 text-[10px] font-mono uppercase tracking-wider whitespace-nowrap border-b-2 transition-all flex-shrink-0 ${
          activeTab === tab.id
            ? 'text-intel-cyan border-intel-cyan'
            : 'text-slate-500 border-transparent hover:text-slate-300'
        }`}
      >
        {tab.icon && <span className="w-3 h-3">{tab.icon}</span>}
        <span>{tab.label}</span>
      </button>
    ))}
  </div>
);
