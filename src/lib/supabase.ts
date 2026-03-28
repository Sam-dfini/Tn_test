import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types matching our schema
export interface Article {
  id: string;
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
}

export interface Event {
  id: string;
  event_key: string;
  title: string;
  description?: string;
  category: string;
  governorate?: string;
  severity: number;
  status: 'ACTIVE' | 'RESOLVED' | 'ARCHIVED';
  article_count: number;
  pro_gov_count: number;
  neutral_count: number;
  critical_count: number;
  alarmist_count: number;
  minimizing_count: number;
  last_updated: string;
  created_at: string;
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
