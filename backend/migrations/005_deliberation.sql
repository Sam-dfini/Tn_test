-- Deliberation sessions
CREATE TABLE deliberation_sessions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id            TEXT NOT NULL UNIQUE,
  trigger_type          TEXT NOT NULL,
  trigger_source        TEXT,
  scenario_description  TEXT NOT NULL,
  state_version_id      TEXT NOT NULL,
  is_simulation         BOOLEAN DEFAULT FALSE,

  actor_ids             TEXT[] NOT NULL,

  resolution_type       TEXT,
  decision_output       JSONB,
  confidence            NUMERIC(4,3),
  dominant_coalition    TEXT[],
  dissenting_actors     TEXT[],

  deliberation_trace    JSONB NOT NULL DEFAULT '[]',
  conflict_map          JSONB DEFAULT '{}',
  coalition_map         JSONB DEFAULT '{}',

  started_at            TIMESTAMPTZ DEFAULT NOW(),
  completed_at          TIMESTAMPTZ,
  duration_ms           INTEGER,

  historical_analogue   TEXT,
  analogue_similarity   NUMERIC(4,3)
);

CREATE TABLE deliberation_positions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id        UUID NOT NULL REFERENCES deliberation_sessions(id) ON DELETE CASCADE,
  entity_id         TEXT NOT NULL,
  actor_name        TEXT NOT NULL,

  recommendation    TEXT NOT NULL,
  recommendation_confidence NUMERIC(4,3),
  reasoning_chain   TEXT NOT NULL,
  supporting_actions JSONB DEFAULT '[]',

  live_citations    JSONB DEFAULT '[]',
  doctrine_citations JSONB DEFAULT '[]',

  adjusted_probabilities JSONB DEFAULT '{}',

  conflicts_with    TEXT[] DEFAULT '{}',
  aligns_with       TEXT[] DEFAULT '{}',

  submitted_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ds_trigger ON deliberation_sessions(trigger_type);
CREATE INDEX idx_ds_state ON deliberation_sessions(state_version_id);
CREATE INDEX idx_ds_simulation ON deliberation_sessions(is_simulation);
CREATE INDEX idx_dp_session ON deliberation_positions(session_id);
CREATE INDEX idx_dp_entity ON deliberation_positions(entity_id);
