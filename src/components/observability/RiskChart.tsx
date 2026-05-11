import React from "react";

export const RiskChart = ({ data, category }: any) => {
  return (
    <div className="h-64 w-full flex items-center justify-center bg-white/5 rounded-xl border border-dashed border-white/20">
      <div className="text-center space-y-2">
        <div className="text-xs font-mono text-slate-500 uppercase">Risk Chart Placeholder</div>
        <div className="text-[10px] text-slate-600 uppercase">Category: {category}</div>
      </div>
    </div>
  );
};
