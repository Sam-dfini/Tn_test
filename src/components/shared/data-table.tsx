import React from "react";

export const DataTable = ({ data, columns }: any) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs font-mono">
        <thead className="text-slate-500 uppercase border-b border-white/10">
          <tr>
            {columns.map((col: string) => (
              <th key={col} className="px-4 py-2 font-bold">{col}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {data.length > 0 ? (
            data.slice(0, 5).map((row: any, i: number) => (
              <tr key={i}>
                {columns.map((col: string) => (
                  <td key={col} className="px-4 py-2 text-slate-300">{String(row[col] || "N/A")}</td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-slate-600">NO DATA AVAILABLE</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};
