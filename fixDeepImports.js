import fs from 'fs';
import path from 'path';

function walk(dir, callback) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) walk(full, callback);
    else if (full.endsWith('.tsx') || full.endsWith('.ts')) callback(full);
  }
}

const domains = ['economy', 'agriculture', 'social', 'political', 'security', 'energy', 'geopolitical', 'system'];

domains.forEach(domain => {
  const dir = `./src/components/${domain}`;
  if (!fs.existsSync(dir)) return;

  walk(dir, (filepath) => {
    let content = fs.readFileSync(filepath, 'utf8');
    let originalContent = content;

    // Check all import paths starting with '../'
    const regex = /from\s+['"]\.\.\/([^'"]+)['"]/g;
    content = content.replace(regex, (match, importedPath) => {
      // If the imported path is another domain from components, 
      // e.g. `from '../social/Something'`, keep it as `../social/Something`.
      const firstSegment = importedPath.split('/')[0];
      if (domains.includes(firstSegment)) {
         return match; // keep `../social/Something`
      }
      
      // If it's a file inside components directly (e.g. `../ProfessionalShared`), keep it
      if (fs.existsSync(`./src/components/${importedPath}`) || fs.existsSync(`./src/components/${importedPath}.tsx`) || fs.existsSync(`./src/components/${importedPath}.ts`) || fs.existsSync(`./src/components/${importedPath}/index.tsx`)) {
         return match; // keep `../ProfessionalShared`
      }

      // Otherwise, it was probably meant for the root folders like `lib/`, `types/`, `data/`, `context/`, `utils/`, `services/`
      // So change it to `../../${importedPath}`
      return `from '../../${importedPath}'`;
    });

    // Also look for imports starting with `./` that should have been `../`
    // Example: files trying to import `ProfessionalShared` as `./ProfessionalShared`
    // Wait, the earlier fix script might not have touched them if they were already `./`
    const regex2 = /from\s+['"]\.\/([^'"]+)['"]/g;
    content = content.replace(regex2, (match, importedPath) => {
       if (importedPath.startsWith(domain)) return match; // skip if it's itself

       // If it is a generic component file that is still in src/components, change `./` to `../`
       if (fs.existsSync(`./src/components/${importedPath}.tsx`)) {
           return `from '../${importedPath}'`;
       }
       return match;
    });

    if (content !== originalContent) {
      fs.writeFileSync(filepath, content, 'utf8');
      console.log(`Deep fixed imports in ${filepath}`);
    }
  });
});
