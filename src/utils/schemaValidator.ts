import { SupabaseClient } from '@supabase/supabase-js';

export type FieldType = 'text' | 'boolean' | 'float8' | 'int8' | 'timestamp' | 'jsonb' | 'bool';

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
  variables: {
    id: 'text',
    code: 'text',
    number: 'int8',
    value_2026: 'float8',
    value: 'float8',
    min_value: 'float8',
    max_value: 'float8',
    invert: 'boolean',
    weight: 'float8',
    threshold: 'float8',
    threshold_weight: 'float8',
    volatility: 'float8',
    pipeline_field: 'text',
    label: 'text',
    source: 'text',
    category: 'text',
    last_updated: 'text',
    nlp_keywords: 'jsonb',
    nlp_nudge: 'float8'
  },
  graph_entities: {
    id: 'text',
    type: 'text',
    label: 'text',
    aliases: 'jsonb',
    first_seen: 'text',
    last_seen: 'text',
    confidence: 'float8',
    metadata: 'jsonb',
    tier: 'int8',
    domain: 'jsonb',
    power_type: 'text',
    color: 'text',
    size: 'int8',
    resources: 'jsonb',
    goals: 'jsonb',
    constraints: 'jsonb',
    risk_tolerance: 'text',
    time_horizon: 'text',
    fixed_x: 'float8',
    fixed_y: 'float8'
  },
  telegram_messages: {
    id: 'int8',
    message_id: 'int8',
    channel_username: 'text',
    channel_name: 'text',
    channel_category: 'text',
    sender_id: 'text',
    text: 'text',
    date: 'text',
    views: 'int8',
    forwards: 'int8',
    reply_to: 'int8',
    has_media: 'bool',
    alerts: 'jsonb',
    alert_count: 'int8',
    fetched_at: 'text'
  },
  graph_relations: {
    id: 'text',
    source_id: 'text',
    target_id: 'text',
    type: 'text',
    weight: 'float8',
    domain: 'text',
    description: 'text',
    conditionality: 'text',
    trend: 'text',
    valid_from: 'text',
    valid_to: 'text',
    confidence: 'float8'
  },
};

/**
 * checkAndFixSchema
 * 
 * Compares current Supabase schema with SCHEMA_MAP and adds missing columns.
 * Uses direct SQL via Supabase client (no RPC required).
 */
export async function checkAndFixSchema(supabase: SupabaseClient, tableName: string) {
  const requiredFields = SCHEMA_MAP[tableName];
  if (!requiredFields) return;

  try {
    // 1. Query existing columns using information_schema
    const { data: cols, error: queryError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', tableName);

    if (queryError) {
      console.warn(`[SCHEMA] Could not query columns for ${tableName}:`, queryError.message);
      return;
    }

    const existingCols = cols ? cols.map((c: any) => c.column_name) : [];

    // 2. Detect missing columns
    const missing = Object.keys(requiredFields).filter(f => !existingCols.includes(f));

    if (missing.length === 0) {
      console.log(`[SCHEMA] ${tableName} is healthy.`);
      return;
    }

    console.log(`[SCHEMA] ${tableName} missing columns: ${missing.join(', ')}. Applying fix…`);

    // 3. Apply fixes using Supabase RPC with raw SQL
    for (const col of missing) {
      const type = requiredFields[col];
      const sql = `
        ALTER TABLE ${tableName} 
        ADD COLUMN IF NOT EXISTS ${col} ${type.toUpperCase()}${type === 'boolean' ? ' DEFAULT false' : ''};
      `;
      
      const { error: fixError } = await supabase.rpc('exec_sql_admin', { 
        sql_query: sql 
      });
      
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
 * initializeAllSchemas — runs all table checks in parallel.
 */
export async function initializeAllSchemas(supabase: SupabaseClient) {
  const tables = Object.keys(SCHEMA_MAP);
  await Promise.allSettled(tables.map(tableName => checkAndFixSchema(supabase, tableName)));
}
