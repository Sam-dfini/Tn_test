import fs from 'fs';
const path = 'src/components/modes/ProfessionalIntel.tsx';
let data = fs.readFileSync(path, 'utf8');

const gaugeReplacement = `
                  {/* 3 Gauges row */}
                  <div className="flex-1 grid grid-cols-3 gap-2 lg:gap-4 lg:border-l lg:border-white/10 lg:pl-6 lg:border-r lg:pr-6">
                    {[
                      {
                        label: "P(REVOLUTION)",
                        value: (rriState.p_rev * 100).toFixed(1) + "%",
                        sub: \`CI [\${(rriState.ci_low * 100).toFixed(1)}–\${(rriState.ci_high * 100).toFixed(1)}%]\`,
                        color: rriState.p_rev > 0.7 ? "#ef4444" : "#f59e0b",
                        percent: rriState.p_rev * 100
                      },
                      {
                        label: "CASCADE RISK",
                        value: (rriState.cascade_probability * 100).toFixed(0) + "%",
                        sub: "P_cascade EQ.17",
                        color: rriState.cascade_probability > 0.6 ? "#ef4444" : "#f59e0b",
                        percent: rriState.cascade_probability * 100
                      },
                      {
                        label: "PATTERN MATCH",
                        value: (rriState.pattern_similarity * 100).toFixed(0) + "%",
                        sub: "MODERATE-PARTIAL",
                        color: rriState.pattern_similarity > 0.65 ? "#ef4444" : rriState.pattern_similarity > 0.5 ? "#f59e0b" : "#38bdf8",
                        percent: rriState.pattern_similarity * 100
                      },
                    ].map((g, i) => (
                      <div key={i} className="flex flex-col items-center justify-center relative mt-2">
                        <svg viewBox="0 0 100 55" className="w-[80px] lg:w-[130px] drop-shadow-md lg:mb-1">
                           <path d="M 10 40 A 40 40 0 0 1 90 40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" strokeLinecap="round" />
                           <path d="M 10 40 A 40 40 0 0 1 90 40" fill="none" stroke={g.color} strokeWidth="10" strokeLinecap="round" strokeDasharray="125.66" strokeDashoffset={125.66 - (g.percent / 100) * 125.66} className="transition-all duration-1000 ease-out" />
                        </svg>
                        <div className="absolute top-4 lg:top-6 text-center w-full">
                           <div className="text-sm lg:text-2xl font-bold font-mono tracking-tight" style={{ color: g.color }}>
                             {g.value}
                           </div>
                        </div>
                        <div className="text-[8px] lg:text-[9px] font-mono text-slate-500 uppercase mt-1 text-center">
                          {g.label}
                        </div>
                        <div className="text-[7px] lg:text-[8px] font-mono text-slate-600 truncate text-center">
                          {g.sub}
                        </div>
                      </div>
                    ))}
                  </div>

`;

data = data.replace(/\{\/\* 3 Gauges row \*\/\}[\s\S]*?(?=\{\/\* 6 Ticker Metrics Grid \*\/)/, gaugeReplacement);

const aiReplacement = `
                {/* AI Summary Sub-header */}
                <div className="bg-intel-cyan/5 border border-intel-cyan/10 p-2 lg:p-3 rounded flex flex-col lg:flex-row items-start lg:items-center space-y-3 lg:space-y-0 lg:space-x-4">
                  <Sparkles className="w-4 h-4 text-intel-cyan shrink-0 hidden lg:block" />
                  <div className="text-[9px] lg:text-[10px] text-slate-300 font-sans leading-relaxed flex-1 w-full truncate whitespace-normal overflow-hidden max-h-16 lg:max-h-12 border-l-2 border-intel-cyan/30 pl-3">
                    {aiAnalysis?.summary ||
                      "The current analysis of Tunisia's revolutionary risk indicates a moderate level of systemic pressure. Structural indicators remain elevated while catalytic events show partial consolidation. Intervention pathways are open."}
                  </div>
                  <div className="flex w-full lg:w-auto items-center justify-between lg:justify-end gap-4 shrink-0">
                    <div className="flex items-center space-x-3 text-[9px] font-mono text-slate-500">
                      <span className="flex flex-col text-right">
                        <span>AI R(T)</span>
                        <span className="text-white font-bold text-[10px]">
                          {(aiAnalysis?.rt ?? 2.8).toFixed(3)}
                        </span>
                      </span>
                      <span className="flex flex-col text-right">
                        <span>AI P_REV</span>
                        <span className="text-white font-bold text-[10px]">
                          {((aiAnalysis?.pRev ?? 0.909) * 100).toFixed(1)}%
                        </span>
                      </span>
                    </div>
                    <button 
                       onClick={runCoreLogicAnalysis} 
                       disabled={isAIAnalysisLoading}
                       className="bg-intel-cyan/20 hover:bg-intel-cyan/30 text-intel-cyan hover:text-white border border-intel-cyan/40 rounded px-5 py-2 flex items-center h-[34px] text-[10px] font-mono font-bold uppercase tracking-widest transition-all whitespace-nowrap shadow-[0_0_15px_rgba(34,211,238,0.1)] hover:shadow-[0_0_20px_rgba(34,211,238,0.2)]"
                    >
                       {isAIAnalysisLoading ? 'ANALYZING...' : 'RUN AI ANALYSIS'}
                    </button>
                    <div className="w-2 h-2 rounded-full bg-intel-cyan animate-ping hidden lg:block ml-1" />
                  </div>
                </div>
`;

data = data.replace(/\{\/\* AI Summary Sub-header \*\/\}[\s\S]*?(?=\{\/\* LAYER 2 — ACTIVE INTELLIGENCE \*\/)/, aiReplacement);

fs.writeFileSync(path, data, 'utf8');
console.log("Replaced");
