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

walk('./src/components', (filepath) => {
  // Only fix files in src/components directly (not subdirectories)
  if (path.dirname(filepath) !== 'src/components' && path.dirname(filepath) !== './src/components') return;

  let content = fs.readFileSync(filepath, 'utf8');
  let originalContent = content;

  for (const domain of domains) {
    // Replace `../domain/` with `./domain/`
    const regex = new RegExp(`from ['"]\\.\\.\\/${domain}\\/([^'"]+)['"]`, 'g');
    content = content.replace(regex, `from './${domain}/$1'`);
  }

  if (content !== originalContent) {
    fs.writeFileSync(filepath, content, 'utf8');
    console.log(`Fixed imports in ${filepath}`);
  }
});
