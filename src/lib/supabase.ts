import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.SUPABASE_ANON_KEY || '';

const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false
  }
});

// Observation System for DB Traffic
export const dbMetrics = {
  writes: 0,
  reads: 0,
  errors: 0,
  lastOp: null as { table: string, op: string, timestamp: number } | null
};

// Proxy to intercept calls for monitoring
export const supabase = new Proxy(supabaseClient, {
  get(target, prop, receiver) {
    const original = Reflect.get(target, prop, receiver);
    if (prop === 'from') {
      return (table: string) => {
        const queryBuilder = original.call(target, table);
        const originalInsert = queryBuilder.insert;
        const originalUpsert = queryBuilder.upsert;
        const originalSelect = queryBuilder.select;
        const originalUpdate = queryBuilder.update;
        const originalDelete = queryBuilder.delete;

        queryBuilder.insert = (...args: any[]) => {
          dbMetrics.writes++;
          dbMetrics.lastOp = { table, op: 'INSERT', timestamp: Date.now() };
          window.dispatchEvent(new CustomEvent('supabase_op', { detail: dbMetrics.lastOp }));
          return originalInsert.apply(queryBuilder, args);
        };
        queryBuilder.upsert = (...args: any[]) => {
          dbMetrics.writes++;
          dbMetrics.lastOp = { table, op: 'UPSERT', timestamp: Date.now() };
          window.dispatchEvent(new CustomEvent('supabase_op', { detail: dbMetrics.lastOp }));
          return originalUpsert.apply(queryBuilder, args);
        };
        queryBuilder.update = (...args: any[]) => {
          dbMetrics.writes++;
          dbMetrics.lastOp = { table, op: 'UPDATE', timestamp: Date.now() };
          window.dispatchEvent(new CustomEvent('supabase_op', { detail: dbMetrics.lastOp }));
          return originalUpdate.apply(queryBuilder, args);
        };
        queryBuilder.delete = (...args: any[]) => {
          dbMetrics.writes++;
          dbMetrics.lastOp = { table, op: 'DELETE', timestamp: Date.now() };
          window.dispatchEvent(new CustomEvent('supabase_op', { detail: dbMetrics.lastOp }));
          return originalDelete.apply(queryBuilder, args);
        };
        queryBuilder.select = (...args: any[]) => {
          dbMetrics.reads++;
          dbMetrics.lastOp = { table, op: 'SELECT', timestamp: Date.now() };
          window.dispatchEvent(new CustomEvent('supabase_op', { detail: dbMetrics.lastOp }));
          return originalSelect.apply(queryBuilder, args);
        };

        return queryBuilder;
      };
    }
    return original;
  }
});

// Types matching our schema
export interface Article {
  id: string;
  fingerprint: string;
  event_id?: string;
  source_id: string;
  source_name: string;
  title: string;
  title_ar?: string;
  url: string;
  published_at: string;
  fetched_at: string;
  content?: string;
  summary?: string;
  ai_summary?: string;
  language: string;
  category?: string;
  severity: number;
  governorate?: string;
  actors?: string[];
  keywords?: string[];
  bias_alignment: 'PRO_GOV' | 'NEUTRAL' | 'CRITICAL';
  bias_tone: 'ALARMIST' | 'NEUTRAL' | 'MINIMIZING';
  rri_nudge: number;
  rri_variable?: string;
  confirm_count: number;
  dispute_count: number;
  context_count: number;
  processed: boolean;
  pipeline_pushed: boolean;
  propaganda_score?: number;
  narrative_frame?: string;
  euphemism_count?: number;
  unnamed_source_count?: number;
  techniques_detected?: string[];
  narrative_explanation?: string;
}

export interface Event {
  id: string;
  event_key: string;
  title: string;
  description?: string;
  category: string;
  governorate?: string;
  severity: number;
  status: 'emerging' | 'active' | 'escalating' | 'cooling' | 'resolved' | 'ACTIVE' | 'RESOLVED' | 'ARCHIVED';
  article_count: number;
  priority_score: number;
  velocity_score: number;
  is_critical: boolean;
  trend: 'up' | 'down' | 'stable';
  pro_gov_count: number;
  neutral_count: number;
  critical_count: number;
  alarmist_count: number;
  minimizing_count: number;
  last_updated: string;
  created_at: string;
  reality_gap_score?: number;
  omission_keywords?: string[];
  coordination_signal?: boolean;
  coordinated_phrases?: string[];
  narrative_shift?: boolean;
}

export interface PriceReport {
  id: string;
  product: string;
  price_tnd: number;
  unit: string;
  market_type: 'formal' | 'informal' | 'online';
  governorate: string;
  reported_at: string;
  confirmed_by: number;
  disputed_by: number;
  notes?: string;
}

export interface Notification {
  id: string;
  type: 'ALERT' | 'PIPELINE' | 'RSS' | 'RRI' | 'SYSTEM';
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  message: string;
  action_label?: string;
  action_event?: string;
  action_detail?: any;
  read: boolean;
  created_at: string;
}

export interface NarrativeCache {
  article_id: string;
  propaganda_score: number;
  narrative_frame: string;
  euphemism_count: number;
  unnamed_source_count: number;
  techniques_detected: string[];
  narrative_explanation: string;
  analyzed_at: string;
}

export interface Prediction {
  id: string;
  predicted_at: string;
  horizon_days: number;
  evaluate_after: string;
  rri: number;
  p_rev: number;
  velocity: number;
  compound_stress: number;
  pattern_similarity: number;
  cascade_probability: number;
  elite_defection_prob: number;
  elite_cohesion: number;
  mii: number;
  mii_phase: string;
  rpi: number;
  escalation_level: number;
  etm_closure: number;
  etm_phase: string;
  sei_max: number;
  sei_dominant_phase: number;
  predictions: any[];
  actuals?: Record<string, boolean>;
  evaluated_at?: string;
  accuracy_score?: number;
  hit_count?: number;
  miss_count?: number;
  false_positives?: string[];
  false_negatives?: string[];
  analyst_note?: string;
  triggered_by: string;
  created_at: string;
}

export interface AnalystCorrection {
  id: string;
  prediction_id: string;
  corrected_at: string;
  analyst_note: string;
  missed_variable?: string;
  missed_signal?: string;
  what_actually_happened: string;
  suggested_weight_change?: {
    equation: string;
    parameter: string;
    direction: 'increase' | 'decrease';
    magnitude: 'minor' | 'moderate' | 'significant';
    reasoning: string;
  };
  applied: boolean;
  applied_at?: string;
  applied_by?: string;
}
