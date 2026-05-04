import fs from 'fs';
import path from 'path';

const AUDIT_FIELDS = ['auditLog', 'addAuditEntry'];
const AI_FIELDS = ['aiAnalysis', 'forecast', 'miiProfile', 'actorNetwork', 'temporalAnalysis', 'isAIAnalysisLoading', 'runAIAnalysis'];

function walk(dir: string, callback: (filepath: string) => void) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) {
      walk(full, callback);
    } else if (full.endsWith('.tsx') || full.endsWith('.ts')) {
      callback(full);
    }
  }
}

walk('./src', (filepath) => {
  let content = fs.readFileSync(filepath, 'utf8');
  let originalContent = content;

  // Check if file uses usePipeline
  if (!content.includes('usePipeline')) return;

  // We need to find `const { ... } = usePipeline();`
  // It could be multiline.
  const pipelineRegex = /const\s+\{([^}]+)\}\s*=\s*usePipeline\(\)\s*(as\s+any)?\s*;/g;

  content = content.replace(pipelineRegex, (match, inner) => {
    // inner is the destructured parts, e.g. `data, rriState, aiAnalysis`
    const parts = inner.split(',').map((s: string) => s.trim()).filter(Boolean);
    
    const pipelineVars: string[] = [];
    const auditVars: string[] = [];
    const aiVars: string[] = [];
    
    parts.forEach((p: string) => {
      // It might be aliased, like `data: pipelineData`
      const baseVar = p.split(':')[0].trim();
      if (AUDIT_FIELDS.includes(baseVar)) auditVars.push(p);
      else if (AI_FIELDS.includes(baseVar)) aiVars.push(p);
      else pipelineVars.push(p);
    });

    let replacement = '';
    if (pipelineVars.length > 0) {
      replacement += `const { ${pipelineVars.join(', ')} } = usePipeline();\n`;
    }
    if (auditVars.length > 0) {
      replacement += `  const { ${auditVars.join(', ')} } = useAuditLog();\n`;
    }
    if (aiVars.length > 0) {
      replacement += `  const { ${aiVars.join(', ')} } = useAIAnalysis();\n`;
    }

    return replacement.trim();
  });

  // Now handle imports. If we added useAuditLog or useAIAnalysis, we need to import them.
  if (content !== originalContent) {
    const usesAudit = content.includes('useAuditLog()');
    const usesAI = content.includes('useAIAnalysis()');
    
    if (usesAudit || usesAI) {
      // Find usePipeline import and add adjacent imports
      const importRegex = /import\s+\{\s*usePipeline\s*\}\s+from\s+['"]([^'"]+)['"];/;
      const match = content.match(importRegex);
      if (match) {
        const pipelinePath = match[1]; // e.g. '../../context/PipelineContext' or '../context/PipelineContext'
        const baseDir = path.dirname(pipelinePath); // e.g. '../../context'
        
        let newImports = match[0];
        if (usesAudit) {
          const auditPath = baseDir + '/AuditContext';
          newImports += `\nimport { useAuditLog } from '${auditPath}';`;
        }
        if (usesAI) {
          const aiPath = baseDir + '/AIAnalysisContext';
          newImports += `\nimport { useAIAnalysis } from '${aiPath}';`;
        }
        
        content = content.replace(match[0], newImports);
      }
    }
    
    fs.writeFileSync(filepath, content, 'utf8');
    console.log(`Refactored ${filepath}`);
  }
});
