import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Error: SUPABASE_URL or SUPABASE_KEY not found in environment.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function parsePipelineService() {
  const filePath = path.join(process.cwd(), 'src/services/pipelineService.ts');
  if (!fs.existsSync(filePath)) {
    console.error(`Error: ${filePath} not found.`);
    return [];
  }

  const content = fs.readFileSync(filePath, 'utf-8');

  // Find the FIELD_MAP block
  const match = content.match(/export const FIELD_MAP = (\{.*?\});/s);
  if (!match) {
    console.error("Error: FIELD_MAP not found in pipelineService.ts");
    return [];
  }

  const jsContent = match[1];
  
  // Regex to capture individual entries
  const entries = Array.from(jsContent.matchAll(/'([\w\.]+)':\s*\{(.*?)\}/gs));
  
  const records = entries.map(entry => {
    const [_, id, body] = entry;
    const record: any = { id };
    
    const labelM = body.match(/label:\s*'(.*?)'/);
    const unitM = body.match(/unit:\s*'(.*?)'/);
    const descM = body.match(/description:\s*'(.*?)'/);
    const moduleM = body.match(/module:\s*'(.*?)'/);
    
    const keywordsM = body.match(/keywords:\s*\[(.*?)\]/s);
    const sourcesM = body.match(/sources:\s*\[(.*?)\]/s);
    
    if (labelM) record.label = labelM[1];
    if (unitM) record.unit = unitM[1];
    if (descM) record.description = descM[1];
    if (moduleM) record.module = moduleM[1];
    
    if (keywordsM) {
      record.keywords = keywordsM[1].split(',')
        .map(k => k.trim().replace(/^['"]|['"]$/g, ''))
        .filter(k => k);
    }
    if (sourcesM) {
      record.sources = sourcesM[1].split(',')
        .map(s => s.trim().replace(/^['"]|['"]$/g, ''))
        .filter(s => s);
    }
    
    return record;
  });
  
  return records;
}

async function seedDatabase(records: any[]) {
  console.log(`Seeding ${records.length} variables to Supabase...`);
  
  const chunkSize = 50;
  for (let i = 0; i < records.length; i += chunkSize) {
    const chunk = records.slice(i, i + chunkSize);
    const { error } = await supabase.from('variables').upsert(chunk);
    if (error) {
      console.error(`Error upserting chunk ${i / chunkSize + 1}:`, error);
    } else {
      console.log(`Upserted chunk ${i / chunkSize + 1}`);
    }
  }
}

async function main() {
  const variables = parsePipelineService();
  if (variables.length > 0) {
    await seedDatabase(variables);
  } else {
    console.log("No variables found to seed.");
  }
}

main().catch(console.error);
