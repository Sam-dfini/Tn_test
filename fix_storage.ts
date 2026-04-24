import fs from "fs";
import path from "path";

function walk(dir: string, callback: (filepath: string) => void) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const p = path.join(dir, file);
    if (fs.statSync(p).isDirectory()) {
      walk(p, callback);
    } else if (p.endsWith('.tsx') || p.endsWith('.ts')) {
      callback(p);
    }
  }
}

walk('./src', (p) => {
  let content = fs.readFileSync(p, 'utf8');
  if (content.includes('localStorage') && !p.includes('storage.ts') && !p.includes('supabase.ts')) {
    let newContent = content.replace(/localStorage\.getItem/g, 'safeStorage.getItem');
    newContent = newContent.replace(/localStorage\.setItem/g, 'safeStorage.setItem');
    newContent = newContent.replace(/localStorage\.removeItem/g, 'safeStorage.removeItem');
    
    if (newContent !== content) {
      // Add import
      const importStmt = "import { safeStorage } from '@/utils/storage';\n";
      // We will use relative paths or just use quick hack: we inject the import at the top
      let levels = p.split('/').length - 2;
      let relPath = levels === 0 ? './utils/storage' : '../'.repeat(levels) + 'utils/storage';
      newContent = `import { safeStorage } from '${relPath}';\n` + newContent;
      fs.writeFileSync(p, newContent, 'utf8');
      console.log('Fixed', p);
    }
  }
});
