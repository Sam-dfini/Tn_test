import { SupabaseClient } from '@supabase/supabase-js';
import { checkAndFixSchema } from './schemaValidator.ts';

/**
 * sanitizeData
 * Ensures payload matches expected types and provides sensible defaults.
 */
export function sanitizeData(tableName: string, data: any): any {
  if (tableName === 'articles') {
    return {
      id: data.id || `art_${Math.random().toString(36).slice(2, 11)}`,
      fingerprint: data.fingerprint || `fp_${Date.now()}_${Math.random()}`,
      title: data.title || "NO_TITLE",
      source: data.source || "UNKNOWN",
      created_at: new Date().toISOString(),
      ...data
    };
  }

  if (tableName === 'agri_readings') {
    return {
      governorate: data.governorate || 'unknown',
      ndvi: typeof data.ndvi === 'number' ? data.ndvi : 0,
      wheat_stress: typeof data.wheat_stress === 'number' ? data.wheat_stress : 0,
      fetched_at: new Date().toISOString(),
      ...data
    };
  }

  return data;
}

/**
 * safeInsert
 * Retries once after auto-fixing schema if a mismatch is detected.
 */
export async function safeInsert(
  supabase: SupabaseClient,
  tableName: string,
  data: any,
  options: { retries?: number; delay?: number } = {}
) {
  const { retries = 2, delay = 500 } = options;
  const sanitized = sanitizeData(tableName, data);

  let attempt = 0;
  while (attempt <= retries) {
    try {
      const { error } = await supabase.from(tableName).insert(sanitized);

      if (!error) return { success: true };

      // Handle duplicate conflict (Postgres code 23505)
      if (error.code === '23505') {
        console.log(`[DUPLICATE DROPPED] in ${tableName}`);
        return { success: true, duplicate: true };
      }

      // Handle missing column error
      if (error.message.includes('column') || error.code === '42703') {
        console.warn(`[SCHEMA DRIFT] Detected in ${tableName}. Attempting self-healing…`);
        await checkAndFixSchema(supabase, tableName);
        // Retry logic follows
      } else {
        throw error;
      }
    } catch (err: any) {
      if (attempt === retries) {
        console.error(`[FINAL INSERT FAILED] in ${tableName}:`, err.message || err);
        return { success: false, error: err };
      }
      
      const backoff = delay * Math.pow(2, attempt);
      console.log(`[AUTO-RETRY] in ${tableName} Attempt ${attempt + 1}/${retries} in ${backoff}ms…`);
      await new Promise(r => setTimeout(r, backoff));
    }
    attempt++;
  }

  return { success: false };
}

/**
 * safeUpsert
 * Uses same logic for upserts
 */
export async function safeUpsert(
  supabase: SupabaseClient,
  tableName: string,
  rows: any[],
  onConflict: string
) {
  try {
    const { error } = await supabase
      .from(tableName)
      .upsert(rows, { onConflict });

    if (!error) {
      console.log(`[UPSERT SUCCESS] in ${tableName} (${rows.length} rows)`);
      return { success: true };
    }

    if (error.message.includes('column') || error.code === '42703') {
      await checkAndFixSchema(supabase, tableName);
      // Retry once
      const { error: retryErr } = await supabase
        .from(tableName)
        .upsert(rows, { onConflict });
      
      if (!retryErr)  {
        console.log(`[AUTO-RETRY SUCCESS] in ${tableName}`);
        return { success: true };
      }
    }
    
    console.error(`[UPSERT FAILED] in ${tableName}:`, error.message);
    return { success: false, error };
  } catch (err) {
    console.error(`[UPSERT CRITICAL ERROR] in ${tableName}:`, err);
    return { success: false, error: err };
  }
}
