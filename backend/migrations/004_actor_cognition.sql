-- 004_actor_cognition.sql
-- Actor Cognition Profiles — High Table Layer
-- Depends on: graph_entities (for entity_id FK)

CREATE TABLE IF NOT EXISTS actor_profiles (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Link to knowledge graph
  entity_id             TEXT NOT NULL UNIQUE,
  actor_name            TEXT NOT NULL,
  actor_class           TEXT NOT NULL,  -- 'national'|'security'|'economic'|'civil'|'foreign'

  -- Objectives
  objectives            JSONB NOT NULL DEFAULT '[]',

  -- Fear matrix
  fears                 JSONB NOT NULL DEFAULT '[]',

  -- Decision style
  decision_style        TEXT NOT NULL,  -- 'centralized'|'consensus'|'factional'|'reactive'|'technocratic'
  risk_tolerance        NUMERIC(4,3),
  time_horizon          TEXT,           -- 'short'|'medium'|'long'
  doctrine              TEXT,

  -- Action repertoire
  preferred_tools       JSONB NOT NULL DEFAULT '[]',

  -- Input sensitivity map
  input_sensitivity     JSONB NOT NULL DEFAULT '{}',

  -- Output probability matrix
  output_probability_matrix JSONB NOT NULL DEFAULT '{}',

  -- State update rules
  state_update_rules    JSONB NOT NULL DEFAULT '[]',

  -- Historical patterns
  historical_patterns   JSONB NOT NULL DEFAULT '[]',

  -- Authority weights (context-sensitive)
  authority_weights     JSONB NOT NULL DEFAULT '{}',

  -- Coalition affinities
  coalition_affinities  JSONB NOT NULL DEFAULT '[]',

  -- Veto conditions
  veto_conditions       JSONB NOT NULL DEFAULT '[]',

  -- Validation
  validation_score      NUMERIC(4,3),
  validated_events      JSONB DEFAULT '[]',
  last_validated_at     TIMESTAMPTZ,

  -- Current live state (updated from snapshots)
  current_stress        NUMERIC(4,3),
  current_posture       TEXT,
  posture_updated_at    TIMESTAMPTZ,

  -- Metadata
  version               INTEGER DEFAULT 1,
  status                TEXT DEFAULT 'draft',
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ap_entity ON actor_profiles(entity_id);
CREATE INDEX IF NOT EXISTS idx_ap_class ON actor_profiles(actor_class);
CREATE INDEX IF NOT EXISTS idx_ap_status ON actor_profiles(status);
