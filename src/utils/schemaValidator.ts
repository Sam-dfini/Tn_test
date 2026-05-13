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
    event_id: 'text',
    geo_relevance_score: 'int8'
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
  predictions: {
    id: 'text',
    created_at: 'timestamp',
    evaluate_after: 'timestamp',
    evaluated_at: 'timestamp',
    target_date: 'timestamp',
    governorate: 'text',
    event_type: 'text',
    probability: 'float8',
    confidence: 'float8',
    model_version: 'text',
    features: 'jsonb',
    outcome: 'text',
    accuracy: 'float8',
    status: 'text'
  },
  notifications: {
    id: 'text',
    type: 'text',
    priority: 'text',
    title: 'text',
    message: 'text',
    action_label: 'text',
    action_event: 'text',
    action_detail: 'jsonb',
    read: 'boolean',
    created_at: 'timestamp'
  },
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
    // 0. Ensure table exists first (safe when table already exists)
    const columnDefs = Object.entries(requiredFields)
      .map(([col, type]) => `${col} ${type.toUpperCase()}`)
      .join(', ');
    const createSql = `CREATE TABLE IF NOT EXISTS ${tableName} (${columnDefs});`;
    const { error: createError } = await supabase.rpc('exec_sql_admin', { sql_query: createSql });
    if (createError) {
      console.warn(`[SCHEMA] Could not create ${tableName}:`, createError.message);
    }

    // 1. Query existing columns
    const { data: cols, error: queryError } = await supabase
      .rpc('get_table_columns', { t_name: tableName });

    // Fallback if RPC doesn't exist yet but we can query information_schema directly
    // (Note: Supabase usually blocks direct information_schema queries from the JS SDK depending on policies)
    let existingCols: string[] = [];
    
    if (queryError) {
      // Second attempt using direct select if permitted
      const { data: infoData } = await supabase
        .from('information_schema.columns' as any)
        .select('column_name')
        .eq('table_name', tableName);
      
      if (infoData) {
        existingCols = infoData.map((c: any) => c.column_name);
      } else {
        console.warn(`[SCHEMA] Could not verify columns for ${tableName}, skipping auto-fix until RPC is available.`);
        return;
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
