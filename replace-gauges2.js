import fs from 'fs';
const path = 'src/components/modes/ProfessionalIntel.tsx';
let data = fs.readFileSync(path, 'utf8');

const targetPathRegex = /<svg[\s\S]*?<\/svg>/;

data = data.replace(/<div\s+key=\{i\}\s+className="flex flex-col items-center justify-center relative mt-2"\s*>[\s\S]*?(?=<div\s+className="text-\[8px\] lg:text-\[9px\]\s+font-mono)/, `<div
                        key={i}
                        className="flex flex-col items-center justify-center mt-2 group"
                      >
                        <svg
                          viewBox="0 0 100 60"
                          className="w-[80px] lg:w-[110px] drop-shadow-md lg:mb-1 overflow-visible"
                        >
                          <path
                            d="M 10 50 A 40 40 0 0 1 90 50"
                            fill="none"
                            stroke="rgba(255,255,255,0.05)"
                            strokeWidth="10"
                            strokeLinecap="round"
                          />
                          <path
                            d="M 10 50 A 40 40 0 0 1 90 50"
                            fill="none"
                            stroke={g.color}
                            strokeWidth="10"
                            strokeLinecap="round"
                            strokeDasharray="125.66"
                            strokeDashoffset={
                              125.66 - (g.percent / 100) * 125.66
                            }
                            className="transition-all duration-1000 ease-out"
                          />
                          <text
                            x="50"
                            y="45"
                            textAnchor="middle"
                            fill={g.color}
                            className="font-mono font-bold"
                            style={{ fontSize: '24px', letterSpacing: '-0.05em' }}
                          >
                            {g.value}
                          </text>
                        </svg>
                        `);

fs.writeFileSync(path, data, 'utf8');
console.log("Fixed gauges");
