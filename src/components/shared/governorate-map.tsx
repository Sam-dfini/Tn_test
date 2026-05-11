import React from "react";

export const GovernorateMap = ({ data }: any) => {
  return (
    <div className="h-80 w-full flex items-center justify-center bg-white/5 rounded-xl border border-dashed border-white/20">
      <div className="text-center space-y-2">
        <div className="text-xs font-mono text-slate-500 uppercase">Governorate Map Placeholder</div>
        <div className="text-[10px] text-slate-600 uppercase">Visualizing {data?.length || 0} data points</div>
      </div>
    </div>
  );
};
