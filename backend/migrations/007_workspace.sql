-- Phase 9: Cognitive Intelligence Workspace
-- Conversational Operating System — investigation dossiers, block registry.

-- 1. Investigation dossiers
CREATE TABLE IF NOT EXISTS investigations (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  investigation_id  TEXT NOT NULL UNIQUE,
  user_id           UUID,
  title             TEXT NOT NULL,
  status            TEXT DEFAULT 'active',
  -- "active"|"archived"|"exported"

  -- Investigation context (persists across messages)
  pinned_actors     TEXT[] DEFAULT '{}',
  active_hypotheses JSONB DEFAULT '[]',
  time_range        JSONB DEFAULT '{}',
  watchlist         JSONB DEFAULT '[]',

  -- Metadata
  message_count     INTEGER DEFAULT 0,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Messages within investigations
CREATE TABLE IF NOT EXISTS investigation_messages (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  investigation_id  UUID NOT NULL REFERENCES investigations(id) ON DELETE CASCADE,
  message_index     INTEGER NOT NULL,
  role              TEXT NOT NULL,
  -- "user"|"assistant"|"system"

  -- User message
  query_text        TEXT,
  intent            TEXT,
  -- "analytical"|"predictive"|"comparative"|"monitoring"|"simulation"

  -- Assistant response
  narrative         TEXT,
  confidence        NUMERIC(4,3),
  citations         JSONB DEFAULT '[]',

  -- Blocks rendered in this response
  blocks_rendered   JSONB DEFAULT '[]',

  -- Engine calls made
  engines_called    TEXT[] DEFAULT '{}',
  deliberation_session_id UUID,
  simulation_run_id TEXT,

  -- State reference
  state_version_id  TEXT,

  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Block registry (12 intelligence blocks)
CREATE TABLE IF NOT EXISTS block_registry (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  block_id          TEXT NOT NULL UNIQUE,
  version           TEXT NOT NULL,
  category          TEXT NOT NULL,
  display_name      TEXT NOT NULL,
  description       TEXT,
  parameters_schema JSONB NOT NULL DEFAULT '{}',
  required_engines  TEXT[] DEFAULT '{}',
  confidence_metric BOOLEAN DEFAULT FALSE,
  exportable        BOOLEAN DEFAULT TRUE,
  drill_down        BOOLEAN DEFAULT FALSE,
  status            TEXT DEFAULT 'active'
);

-- 4. Block instances (rendered in a message)
CREATE TABLE IF NOT EXISTS block_instances (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id      UUID NOT NULL REFERENCES investigation_messages(id) ON DELETE CASCADE,
  block_id        TEXT NOT NULL,
  parameters      JSONB DEFAULT '{}',
  data_snapshot   JSONB DEFAULT '{}',
  confidence      NUMERIC(4,3),
  exported        BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_inv_user ON investigations(user_id);
CREATE INDEX IF NOT EXISTS idx_inv_status ON investigations(status);
CREATE INDEX IF NOT EXISTS idx_im_investigation ON investigation_messages(investigation_id);
CREATE INDEX IF NOT EXISTS idx_im_intent ON investigation_messages(intent);
CREATE INDEX IF NOT EXISTS idx_bi_message ON block_instances(message_id);
