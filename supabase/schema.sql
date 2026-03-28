-- ============================================================
-- EVENTS TABLE
-- Groups related articles into a single intelligence event
-- ============================================================
create table if not exists events (
  id uuid default gen_random_uuid() primary key,
  event_key text not null unique, -- category + governorate + date
  title text not null,
  description text,
  category text not null,
  governorate text,
  severity integer default 1,
  status text default 'ACTIVE',   -- ACTIVE/RESOLVED/ARCHIVED
  article_count integer default 0,
  pro_gov_count integer default 0,
  neutral_count integer default 0,
  critical_count integer default 0,
  alarmist_count integer default 0,
  minimizing_count integer default 0,
  last_updated timestamptz default now(),
  created_at timestamptz default now()
);

create index events_key_idx on events(event_key);
create index events_category_idx on events(category);
create index events_governorate_idx on events(governorate);

-- ============================================================
-- ARTICLES TABLE
-- Stores all RSS articles ingested from monitored sources
-- ============================================================
create table if not exists articles (
  id uuid default gen_random_uuid() primary key,
  event_id uuid references events(id), -- link to event
  source_id text not null,        -- e.g. 'rss-nawaat'
  source_name text not null,      -- e.g. 'Nawaat'
  title text not null,
  title_ar text,                  -- Arabic title if detected
  url text not null unique,       -- deduplicate by URL
  published_at timestamptz,
  fetched_at timestamptz default now(),
  content text,                   -- full article text if available
  summary text,                   -- extracted summary
  ai_summary text,                -- AI generated summary
  language text default 'fr',    -- ar/fr/en
  -- Classification
  category text,                  -- protest/economic/arrest/political/water/migration
  severity integer default 1,    -- 1-5
  governorate text,               -- detected governorate
  actors text[],                  -- detected actors
  keywords text[],                -- matched keywords
  -- Bias & Narrative
  bias_alignment text default 'NEUTRAL', -- PRO_GOV/NEUTRAL/CRITICAL
  bias_tone text default 'NEUTRAL',      -- ALARMIST/NEUTRAL/MINIMIZING
  -- RRI impact
  rri_nudge float default 0,     -- calculated nudge to R(t)
  rri_variable text,              -- which RRI variable
  -- User engagement (citizen nodes)
  confirm_count integer default 0,
  dispute_count integer default 0,
  context_count integer default 0,
  -- Processing
  processed boolean default false,
  pipeline_pushed boolean default false,
  created_at timestamptz default now()
);

-- Index for performance
create index articles_published_at_idx on articles(published_at desc);
create index articles_source_id_idx on articles(source_id);
create index articles_category_idx on articles(category);
create index articles_processed_idx on articles(processed);

-- ============================================================
-- SOURCES TABLE
-- Persists source library with connection status
-- ============================================================
create table if not exists sources (
  id text primary key,            -- matches frontend source ID
  name text not null,
  url text not null,
  type text not null,             -- rss/api/file/social
  language text default 'fr',
  reliability text default 'B',
  active boolean default true,
  keywords text[],
  last_checked timestamptz,
  last_status text default 'untested',
  response_time_ms integer,
  article_count_24h integer default 0,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- CITIZEN PRICE REPORTS TABLE
-- For the Economic Reality Monitor
-- ============================================================
create table if not exists price_reports (
  id uuid default gen_random_uuid() primary key,
  product text not null,          -- banana/bread/tomato/oil/etc
  price_tnd numeric not null,
  unit text not null,             -- kg/litre/piece/etc
  market_type text not null,      -- formal/informal/online
  governorate text not null,
  reported_at timestamptz default now(),
  -- Anonymous but location-tagged
  reporter_hash text,             -- hash of session ID, not identity
  confirmed_by integer default 0, -- other nodes confirmed this price
  disputed_by integer default 0,
  notes text
);

create index price_reports_product_idx on price_reports(product);
create index price_reports_governorate_idx on price_reports(governorate);
create index price_reports_reported_at_idx on price_reports(reported_at desc);

-- ============================================================
-- NOTIFICATIONS TABLE
-- Persistent notification store
-- ============================================================
create table if not exists notifications (
  id uuid default gen_random_uuid() primary key,
  type text not null,             -- ALERT/PIPELINE/RSS/RRI/SYSTEM
  priority text not null,         -- CRITICAL/HIGH/MEDIUM/LOW
  title text not null,
  message text not null,
  action_label text,
  action_event text,
  action_detail jsonb,
  read boolean default false,
  created_at timestamptz default now()
);

create index notifications_read_idx on notifications(read);
create index notifications_created_at_idx on notifications(created_at desc);

-- ============================================================
-- RRI SNAPSHOTS TABLE
-- Historical R(t) for trend analysis
-- ============================================================
create table if not exists rri_snapshots (
  id uuid default gen_random_uuid() primary key,
  rri float not null,
  p_rev float not null,
  velocity float not null,
  compound_stress float not null,
  cascade_probability float not null,
  pattern_similarity float not null,
  threshold_breaches integer not null,
  snapshot_at timestamptz default now(),
  trigger text                    -- what triggered this snapshot
);

create index rri_snapshots_at_idx on rri_snapshots(snapshot_at desc);

-- ============================================================
-- Enable Row Level Security (open for now, restrict per user later)
-- ============================================================
alter table articles enable row level security;
alter table sources enable row level security;
alter table price_reports enable row level security;
alter table notifications enable row level security;
alter table rri_snapshots enable row level security;
alter table events enable row level security;

-- Allow all operations for now (tighten when auth is added)
create policy "Allow all" on articles for all using (true) with check (true);
create policy "Allow all" on sources for all using (true) with check (true);
create policy "Allow all" on price_reports for all using (true) with check (true);
create policy "Allow all" on notifications for all using (true) with check (true);
create policy "Allow all" on rri_snapshots for all using (true) with check (true);
create policy "Allow all" on events for all using (true) with check (true);
