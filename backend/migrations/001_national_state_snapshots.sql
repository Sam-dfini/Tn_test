-- 001_national_state_snapshots.sql
-- NationalStateSnapshot — Canonical State Layer
-- Version 1.0 — 2026-05-21
-- One authoritative state per computation cycle. Everything reads from it.

CREATE TABLE IF NOT EXISTS national_state_snapshots (
  -- Identity
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state_version_id      TEXT NOT NULL UNIQUE,
  computed_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  computation_source    TEXT NOT NULL DEFAULT 'python_orchestrator',
  computation_duration_ms INTEGER,

  -- Core RRI
  rri                   NUMERIC(6,4) NOT NULL,
  rri_previous          NUMERIC(6,4),
  p_revolution          NUMERIC(5,4) NOT NULL,
  velocity              NUMERIC(6,4),
  acceleration          NUMERIC(6,4),
  compound_stress       NUMERIC(6,4),
  cascade_probability   NUMERIC(5,4),
  salience              NUMERIC(5,4),
  salience_effective    NUMERIC(5,4),
  war_intensity         NUMERIC(5,4),
  elite_cohesion        NUMERIC(5,4),
  elite_defection_prob  NUMERIC(5,4),
  info_amplification    NUMERIC(5,4),

  -- Derived indices
  mii                   NUMERIC(5,4),
  oci                   NUMERIC(5,4),
  cpi_index             NUMERIC(5,4),
  structural_econ       NUMERIC(5,4),
  pattern_similarity    NUMERIC(5,4),
  pattern_label         TEXT,
  velocity_label        TEXT,

  -- Monte Carlo confidence
  mc_p_revolution_mean  NUMERIC(5,4),
  mc_p_revolution_p10   NUMERIC(5,4),
  mc_p_revolution_p90   NUMERIC(5,4),
  mc_runs               INTEGER DEFAULT 10000,

  -- Category scores
  category_scores       JSONB NOT NULL DEFAULT '{}',

  -- SIR model
  sir_susceptible       NUMERIC(10,4),
  sir_infected          NUMERIC(10,4),
  sir_recovered         NUMERIC(10,4),

  -- Governorate vectors
  governorate_vectors   JSONB NOT NULL DEFAULT '[]',

  -- Active shocks
  active_shocks         JSONB NOT NULL DEFAULT '[]',

  -- Narrative state
  narrative_state       JSONB DEFAULT '{}',

  -- Actor postures
  actor_postures        JSONB DEFAULT '[]',

  -- National state machine
  state_phase           TEXT,
  state_phase_confidence NUMERIC(4,3),
  state_phase_dwell_days INTEGER,

  -- Signal credibility
  avg_sci_score         NUMERIC(4,3),
  high_confidence_signals INTEGER,
  psyop_detected        BOOLEAN DEFAULT FALSE,

  -- Economic snapshot
  fx_reserves_days      NUMERIC(6,1),
  inflation_rate        NUMERIC(5,2),
  parallel_fx_premium   NUMERIC(5,2),
  unemployment_rate     NUMERIC(5,2),

  -- Provenance
  variables_used        INTEGER,
  articles_processed    INTEGER,
  data_freshness_hours  NUMERIC(5,1),
  confidence_overall    NUMERIC(4,3),
  stochastic_shock      NUMERIC(6,4),

  -- Metadata
  is_simulation         BOOLEAN DEFAULT FALSE,
  parent_state_id       UUID REFERENCES national_state_snapshots(id),
  notes                 TEXT
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_nss_computed_at ON national_state_snapshots(computed_at DESC);
CREATE INDEX IF NOT EXISTS idx_nss_version ON national_state_snapshots(state_version_id);
CREATE INDEX IF NOT EXISTS idx_nss_rri ON national_state_snapshots(rri DESC);
CREATE INDEX IF NOT EXISTS idx_nss_live ON national_state_snapshots(is_simulation, computed_at DESC);

-- Supporting table: per-variable values per snapshot
CREATE TABLE IF NOT EXISTS state_variable_snapshots (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state_id        UUID NOT NULL REFERENCES national_state_snapshots(id) ON DELETE CASCADE,
  variable_code   TEXT NOT NULL,
  variable_value  NUMERIC(10,6),
  normalized_value NUMERIC(6,4),
  weight          NUMERIC(6,4),
  threshold_breach BOOLEAN DEFAULT FALSE,
  computed_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_svs_state ON state_variable_snapshots(state_id);
CREATE INDEX IF NOT EXISTS idx_svs_breach ON state_variable_snapshots(state_id, threshold_breach);
