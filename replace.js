import fs from 'fs';

const replacement = fs.readFileSync('replacement.txt', 'utf8');
const data = fs.readFileSync('src/components/modes/ProfessionalIntel.tsx', 'utf8');

const regex = /(\s*\) : activeTab === 'overview' \? \()([\s\S]*?)(\n\s*\) : activeTab === 'command-center' \? \()/;
if(regex.test(data)) {
  const result = data.replace(regex, `$1\n${replacement}\n$3`);
  fs.writeFileSync('src/components/modes/ProfessionalIntel.tsx', result, 'utf8');
  console.log("Replaced successfully!");
} else {
  console.log("Could not find the target block.");
}
