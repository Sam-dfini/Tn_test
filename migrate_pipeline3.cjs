const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('./src');

files.forEach(file => {
  // Do not modify the hooks or context itself
  if (file.includes('usePipelineDomains.ts') || file.includes('PipelineContext.tsx')) return;

  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('import { usePipeline } from')) {
    
    const depth = (file.match(/\//g) || []).length;
    let importPath = depth === 2 ? '../hooks/usePipelineDomains' : '../../hooks/usePipelineDomains';
    if (depth === 1) importPath = './hooks/usePipelineDomains';
    if (depth > 3) importPath = '../../../hooks/usePipelineDomains'; 

    let newContent = content.replace(/import\s+\{\s*usePipeline\s*\}\s+from\s+['"][^'"]+PipelineContext['"];?/g, `import { useRiskMetrics } from '${importPath}';`);
    
    newContent = newContent.replace(/(const|let|var)\s+\{([^}]+)\}\s*=\s*usePipeline\(\);/g, (match, keyword, vars) => {
      let newVars = vars.replace(/\bdata\b(?!\s*:)/g, 'fullData: data');
      return `${keyword} {${newVars}} = useRiskMetrics();`;
    });
    
    newContent = newContent.replace(/const (\w+) = usePipeline\(\);/g, "const $1 = useRiskMetrics();");

    // Fix context dot access
    newContent = newContent.replace(/\b([a-zA-Z0-9_]+)\.data\b/g, (match, varName) => {
       if (varName === 'data' || varName === 'item' || varName === 'r') return match;
       return `${varName}.fullData`;
    });

    if (content !== newContent) {
      fs.writeFileSync(file, newContent, 'utf8');
    }
  }
});
