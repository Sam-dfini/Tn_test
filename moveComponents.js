import fs from 'fs';
import path from 'path';

const srcDir = './src/components';

const moves = {
  shared: [
    'Authentication.tsx',
    'CalendarOverlay.tsx',
    'IntelIconSet.tsx',
    'IntelligenceDossierExporterModal.tsx',
    'Map.tsx',
    'NewsFeed.tsx',
    'NotificationPanel.tsx',
    'NotificationToast.tsx',
    'Onboarding.tsx',
    'PremiumReport.tsx',
    'ProfessionalHeader.tsx',
    'ProfessionalShared.tsx',
    'TacticalLoading.tsx',
    'Timeline.tsx'
  ],
  modes: [
    'CitizenEdition.tsx',
    'ModePageLayout.tsx',
    'ModeSelection.tsx',
    'PalantirDashboard.tsx',
    'ProfessionalIntel.tsx',
    'TestMode.tsx',
    'TunisiaTerminal.tsx'
  ],
  predictive: [
    'Predict.tsx',
    'RiskModel.tsx',
    'SimulationIntelligence.tsx',
    'StrategicModeling.tsx',
    'TemporalAnalysisTab.tsx'
  ],
  security: [
    'Cases.tsx',
    'GovernmentAgentPanel.tsx',
    'Suspects.tsx'
  ],
  tactical: [
    'ClusterIntelligence.tsx',
    'LiveSignalFeed.tsx',
    'RealTimeNewsFeed.tsx',
    'SignalIntelCard.tsx'
  ],
  social: [
    'CycleAnalysisTab.tsx'
  ],
  agriculture: [
    'EnvironmentalIntelligence.tsx'
  ],
  geopolitical: [
    'EventsIntelligence.tsx'
  ],
  economy: [
    'IndustrialIntelligencePanel.tsx'
  ],
  system: [
    'AIAnalystPanel.tsx',
    'IntelligenceBriefPanel.tsx',
    'RRIMethodology.tsx',
    'RTEE.tsx',
    'SourceLibrary.tsx'
  ],
  political: [
    'PyramidHierarchy.tsx'
  ]
};

const extractions = new Set();
for (const [domain, files] of Object.entries(moves)) {
  const targetDir = path.join(srcDir, domain);
  if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

  for (const file of files) {
    const oldPath = path.join(srcDir, file);
    const newPath = path.join(targetDir, file);
    if (fs.existsSync(oldPath)) {
      fs.renameSync(oldPath, newPath);
      extractions.add(file.replace('.tsx', ''));
    }
  }
}

// Now we need to update imports everywhere
function walk(dir, callback) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) walk(full, callback);
    else if (full.endsWith('.tsx') || full.endsWith('.ts')) callback(full);
  }
}

function getNewDomain(fileBaseName) {
  for (const [domain, files] of Object.entries(moves)) {
    if (files.some(f => f.startsWith(fileBaseName + '.tsx'))) return domain;
  }
  return null;
}

walk('./src', (filepath) => {
  let content = fs.readFileSync(filepath, 'utf8');
  let originalContent = content;

  for (const fileBase of extractions) {
      const domain = getNewDomain(fileBase);
      
      // Need to find imports of this file.
      // E.g., import { Economy } from './components/Economy';
      // or import Economy from '../Economy';
      
      // Replace import paths based on relative locations
      // Since it's too complex to do perfectly with regex for all relative depths, 
      // we'll look for `/Economy` or `../Economy` or `./Economy`
      
      const fileDir = path.dirname(filepath);
      
      const importRegex = new RegExp(`from\\s+['"]([^'"]+/${fileBase})['"]`, 'g');
      content = content.replace(importRegex, (match, importPath) => {
          // If it already contains the domain, skip
          if (importPath.includes(`/${domain}/`)) return match;
          
          let parts = importPath.split('/');
          let compBase = parts.pop();
          
          // If we're already in a domain folder moving to another domain folder
          const currentDirName = path.basename(fileDir);
          let newImportPath = importPath;
          
          if (importPath.startsWith('./' + fileBase)) {
             // imported from same dir (was root components)
             if (fileDir === path.join(process.cwd(), 'src', 'components')) {
                 newImportPath = `./${domain}/${fileBase}`;
             } else {
                 newImportPath = `../${domain}/${fileBase}`;
             }
          } else {
             // Replace last path part before filename:
             if (parts.length > 0 && parts[parts.length-1] === 'components') {
                 newImportPath = [...parts, domain, fileBase].join('/');
             } else if (parts.length > 0 && parts[parts.length-1] === '.') {
                 newImportPath = [...parts, domain, fileBase].join('/');
             } else {
                 // Try injecting before fileBase
                 newImportPath = [...parts, domain, fileBase].join('/');
             }
          }
          
          return `from '${newImportPath}'`;
      });
  }

  if (content !== originalContent) {
    fs.writeFileSync(filepath, content, 'utf8');
    console.log(`Updated imports in ${filepath}`);
  }
});
