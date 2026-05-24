-- 002_ontology_causal_chains.sql
-- Causal Intelligence Layer — Phase 2
-- Depends on: national_state_snapshots (Phase 1), graph_entities/graph_relations

CREATE TABLE IF NOT EXISTS ontology_causal_chains (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chain_id            TEXT NOT NULL UNIQUE,
  chain_name          TEXT NOT NULL,
  domain              TEXT NOT NULL,
  trigger_category    TEXT NOT NULL,
  causal_nodes        JSONB NOT NULL DEFAULT '[]',
  activation_threshold NUMERIC(5,4),
  activation_variable  TEXT,
  validated_events    JSONB DEFAULT '[]',
  validation_score    NUMERIC(4,3),
  last_validated_at   TIMESTAMPTZ,
  doctrine_refs       JSONB DEFAULT '[]',
  local_amplifiers    JSONB DEFAULT '[]',
  local_suppressors   JSONB DEFAULT '[]',
  regional_sensitivity JSONB DEFAULT '{}',
  confidence          NUMERIC(4,3),
  status              TEXT DEFAULT 'draft',
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_occ_domain ON ontology_causal_chains(domain);
CREATE INDEX IF NOT EXISTS idx_occ_status ON ontology_causal_chains(status);
CREATE INDEX IF NOT EXISTS idx_occ_trigger ON ontology_causal_chains(activation_variable);

CREATE TABLE IF NOT EXISTS ontology_trigger_thresholds (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  variable_code     TEXT NOT NULL,
  threshold_name    TEXT NOT NULL,
  threshold_value   NUMERIC(6,4) NOT NULL,
  chain_ids         TEXT[] DEFAULT '{}',
  historical_basis  TEXT,
  notes             TEXT
);

CREATE INDEX IF NOT EXISTS idx_ott_variable ON ontology_trigger_thresholds(variable_code);
