import fs from 'fs';
const path = 'src/components/modes/ProfessionalIntel.tsx';
let data = fs.readFileSync(path, 'utf8');

const targetRegex = /<div className="w-2 h-2 rounded-full bg-intel-cyan animate-ping hidden lg:block ml-1" \/>\s*<\/div>\s*<\/div>\s*\{\/\* LAYER 2 — ACTIVE INTELLIGENCE \*\/\}/

data = data.replace(targetRegex, `
                    <div className="w-2 h-2 rounded-full bg-intel-cyan animate-ping hidden lg:block ml-1" />
                  </div>
                </div>
              </div>

              {/* LAYER 2 — ACTIVE INTELLIGENCE */}`);

fs.writeFileSync(path, data, 'utf8');
console.log("Fixed missing div");
