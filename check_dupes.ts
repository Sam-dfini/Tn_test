
import fs from 'fs';
const data = JSON.parse(fs.readFileSync('src/data/governorates.json', 'utf8'));
const ids = data.governorates.map((g: any) => g.id);
const duplicates = ids.filter((item: any, index: number) => ids.indexOf(item) !== index);
if (duplicates.length > 0) {
  console.log('DUPLICATE IDS FOUND:', duplicates);
} else {
  console.log('NO DUPLICATE IDS');
}
