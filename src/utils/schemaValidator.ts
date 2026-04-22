import { SupabaseClient } from '@supabase/supabase-js';

export type FieldType = 'text' | 'boolean' | 'float8' | 'int8' | 'timestamp' | 'jsonb';

export interface TableSchema {
  [columnName: string]: FieldType;
}

export const SCHEMA_MAP: Record<string, TableSchema> = {
  agri_readings: {
    id: 'int8',
    governorate: 'text',
    ndvi: 'float8',
    rainfall_anomaly: 'float8',
    soil_moisture: 'float8',
    wheat_stress: 'float8',
    olive_health: 'float8',
    rural_stability: 'float8',
    risk_flag: 'text',
    rri_shock: 'float8',
    data_quality: 'text',
    source: 'text',
    fetched_at: 'timestamp',
  },
  articles: {
    id: 'text',
    fingerprint: 'text',
    title: 'text',
    source_name: 'text',
    url: 'text',
    published_at: 'timestamp',
    fetched_at: 'timestamp',
    content: 'text',
    summary: 'text',
    ai_summary: 'text',
    language: 'text',
    category: 'text',
    severity: 'int8',
    governorate: 'text',
    actors: 'jsonb',
    keywords: 'jsonb',
    bias_alignment: 'text',
    bias_tone: 'text',
    rri_nudge: 'float8',
    rri_variable: 'text',
    confirm_count: 'int8',
    dispute_count: 'int8',
    context_count: 'int8',
    processed: 'boolean',
    pipeline_pushed: 'boolean',
    propaganda_score: 'float8',
    narrative_frame: 'text',
    euphemism_count: 'int8',
    unnamed_source_count: 'int8',
    techniques_detected: 'jsonb',
    narrative_explanation: 'text',
    event_id: 'text'
  },
  events: {
    id: 'text',
    event_key: 'text',
    title: 'text',
    description: 'text',
    category: 'text',
    governorate: 'text',
    severity: 'int8',
    status: 'text',
    article_count: 'int8',
    priority_score: 'float8',
    velocity_score: 'float8',
    is_critical: 'boolean',
    trend: 'text',
    pro_gov_count: 'int8',
    neutral_count: 'int8',
    critical_count: 'int8',
    alarmist_count: 'int8',
    minimizing_count: 'int8',
    last_updated: 'timestamp',
    created_at: 'timestamp',
    reality_gap_score: 'float8',
    omission_keywords: 'jsonb',
    coordination_signal: 'boolean',
    coordinated_phrases: 'jsonb',
    narrative_shift: 'boolean'
  },
  agent_memory: {
    agent_id: 'text',
    context_key: 'text',
    context_value: 'jsonb',
    created_at: 'timestamp',
  },
  signals: {
    id: 'text',
    type: 'text',
    location: 'text',
    timestamp: 'timestamp',
    intensity: 'float8',
    source_id: 'text',
    confidence_score: 'float8',
    metadata: 'jsonb',
    raw_text: 'text'
  },
  rri_history: {
    rri_score: 'float8',
    narrative: 'text',
    timestamp: 'timestamp'
  },
  sources: {
    id: 'text',
    name: 'text',
    url: 'text',
    reliability_score: 'float8',
    historical_accuracy: 'float8',
    bias_level: 'float8',
    update_frequency_minutes: 'int8',
    last_updated: 'timestamp'
  },
  variables: {
    id: 'text',
    code: 'text',
    name: 'text',
    value_2010: 'float8',
    value_2026: 'float8',
    unit: 'text',
    description: 'text',
    category: 'text'
  },
  human_validations: {
    id: 'text',
    target_id: 'text',
    target_type: 'text',
    adjusted_confidence: 'float8',
    analyst_id: 'text',
    created_at: 'timestamp'
  }
};

export const UNIQUE_CONSTRAINTS: Record<string, string[][]> = {
  agri_readings: [['governorate', 'fetched_at']],
  articles: [['id'], ['fingerprint']],
  events: [['id'], ['event_key']],
  signals: [['id']],
  variables: [['code']],
};

/**
 * checkAndFixSchema
 * 
 * Compares current Supabase schema with SCHEMA_MAP and adds missing columns.
 * Requires an RPC function 'exec_sql_admin' to be present in Supabase for DDL changes.
 */
export async function checkAndFixSchema(supabase: SupabaseClient, tableName: string) {
  const requiredFields = SCHEMA_MAP[tableName];
  if (!requiredFields) return;

  try {
    // 1. Query existing columns
    const { data: cols, error: queryError } = await supabase
      .rpc('get_table_columns', { t_name: tableName });

    // Fallback if RPC doesn't exist yet but we can query information_schema directly
    // (Note: Supabase usually blocks direct information_schema queries from the JS SDK depending on policies)
    let existingCols: string[] = [];
    
    if (queryError) {
      // Table might be missing completely. Attempt to create it.
      const colDefinitions = Object.entries(requiredFields)
        .map(([col, type]) => `${col} ${type.toUpperCase()}${type === 'boolean' ? ' DEFAULT false' : ''}`)
        .join(', ');
      
      const createSql = `CREATE TABLE IF NOT EXISTS ${tableName} (${colDefinitions}); NOTIFY pgrst, 'reload schema';`;
      const { error: createError } = await supabase.rpc('exec_sql_admin', { sql_query: createSql });
      
      if (createError) {
        // Second attempt using direct select if permitted (fallback for existing tables with missing RPC permissions)
        const { data: infoData } = await supabase
          .from('information_schema.columns' as any)
          .select('column_name')
          .eq('table_name', tableName);
        
        if (infoData) {
          existingCols = infoData.map((c: any) => c.column_name);
        } else {
          console.warn(`[SCHEMA] Table ${tableName} missing and could not be created/verified. Skipping.`);
          return;
        }
      } else {
        console.log(`[SCHEMA] Created missing table: ${tableName}`);
        return; // All columns created during table creation
      }
    } else {
      existingCols = cols as string[];
    }

    // 2. Detect missing columns
    const missing = Object.keys(requiredFields).filter(f => !existingCols.includes(f));

    if (missing.length === 0) {
      console.log(`[SCHEMA] ${tableName} is healthy.`);
      return;
    }

    console.log(`[SCHEMA] ${tableName} missing columns: ${missing.join(', ')}. Applying fix…`);

    // 3. Apply fixes via RPC
    for (const col of missing) {
      const type = requiredFields[col];
      const sql = `
        ALTER TABLE ${tableName} ADD COLUMN IF NOT EXISTS ${col} ${type.toUpperCase()}${type === 'boolean' ? ' DEFAULT false' : ''};
        NOTIFY pgrst, 'reload schema';
      `;
      
      const { error: fixError } = await supabase.rpc('exec_sql_admin', { sql_query: sql });
      
      if (fixError) {
        console.error(`[SCHEMA FIX FAILED] for ${tableName}.${col}:`, fixError.message);
      } else {
        console.log(`[SCHEMA FIX APPLIED] Added ${tableName}.${col} (${type})`);
      }
    }

    // 4. Handle Unique Constraints
    const constraints = UNIQUE_CONSTRAINTS[tableName];
    if (constraints) {
      for (const cols of constraints) {
        const constraintName = `uq_${tableName}_${cols.join('_')}`;
        const colsSql = cols.join(', ');
        
        // Postgres check if constraint exists
        const checkSql = `
          SELECT 1 FROM information_schema.table_constraints 
          WHERE table_name='${tableName}' AND constraint_name='${constraintName}';
        `;
        
        const { data: exists } = await supabase.rpc('exec_sql_admin', { sql_query: checkSql });
        
        if (!exists || (Array.isArray(exists) && exists.length === 0)) {
          console.log(`[SCHEMA] Adding unique constraint ${constraintName} to ${tableName}…`);
          const addSql = `
            ALTER TABLE ${tableName} ADD CONSTRAINT ${constraintName} UNIQUE (${colsSql});
            NOTIFY pgrst, 'reload schema';
          `;
          const { error: constraintError } = await supabase.rpc('exec_sql_admin', { sql_query: addSql });
          if (constraintError) {
            console.error(`[SCHEMA CONSTRAINT FAILED] ${constraintName}:`, constraintError.message);
          } else {
            console.log(`[SCHEMA CONSTRAINT APPLIED] ${constraintName}`);
          }
        }
      }
    }

  } catch (err) {
    console.error(`[SCHEMA ERROR] Critical failure checking ${tableName}:`, err);
  }
}

/**
 * initializeAllSchemas
 */
export async function initializeAllSchemas(supabase: SupabaseClient) {
  for (const tableName of Object.keys(SCHEMA_MAP)) {
    await checkAndFixSchema(supabase, tableName);
  }
}
