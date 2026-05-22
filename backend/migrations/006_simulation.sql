-- Phase 7: Simulation Chamber
-- Strategic Scenario Engine — Monte Carlo simulation with deliberation integration.

-- 1. Simulation Runs
CREATE TABLE IF NOT EXISTS simulation_runs (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id                TEXT NOT NULL UNIQUE,

  -- Scenario definition
  scenario_name         TEXT NOT NULL,
  scenario_description  TEXT NOT NULL,
  scenario_type         TEXT NOT NULL,
  -- "shock_injection" | "policy_decision" | "black_swan" | "compound"

  -- Fork base
  base_state_version_id TEXT NOT NULL,
  base_rri              NUMERIC(6,4),
  base_p_revolution     NUMERIC(5,4),
  base_state_phase      TEXT,
  is_historical_fork    BOOLEAN DEFAULT FALSE,

  -- Shock parameters
  shock_vector          JSONB NOT NULL DEFAULT '{}',

  -- Time parameters
  time_horizon_days     INTEGER NOT NULL DEFAULT 30,
  time_step_days        INTEGER NOT NULL DEFAULT 7,

  -- Monte Carlo parameters
  mc_iterations         INTEGER NOT NULL DEFAULT 1000,
  noise_sigma           NUMERIC(5,4) DEFAULT 0.05,

  -- Chains activated by shock
  activated_chain_ids   TEXT[] DEFAULT '{}',

  -- Aggregated outputs
  outcome_distribution  JSONB DEFAULT '{}',
  p_revolution_range    JSONB DEFAULT '{}',
  rri_trajectory        JSONB DEFAULT '[]',
  governorate_risk_delta JSONB DEFAULT '{}',

  elite_fracture_probability NUMERIC(5,4),
  military_posture_shift     NUMERIC(5,4),
  ugtt_strike_probability    NUMERIC(5,4),
  migration_pressure_delta   NUMERIC(5,4),

  -- Sensitivity analysis
  sensitivity_ranking   JSONB DEFAULT '[]',

  -- Counterfactual
  counterfactual_run_id TEXT,

  -- Historical match
  historical_analogue   TEXT,
  analogue_similarity   NUMERIC(4,3),

  -- Deliberation output per time step
  deliberation_session_ids TEXT[] DEFAULT '{}',

  -- Status
  status                TEXT DEFAULT 'pending',
  started_at            TIMESTAMPTZ DEFAULT NOW(),
  completed_at          TIMESTAMPTZ,
  duration_ms           INTEGER,
  error_message         TEXT
);

-- 2. MC Iteration Samples (every 10th iteration)
CREATE TABLE IF NOT EXISTS simulation_iterations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id          UUID NOT NULL REFERENCES simulation_runs(id) ON DELETE CASCADE,
  iteration_index INTEGER NOT NULL,
  final_rri       NUMERIC(6,4),
  final_p_rev     NUMERIC(5,4),
  final_phase     TEXT,
  trajectory      JSONB DEFAULT '[]',
  chain_sequence  TEXT[],
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Pre-built Scenario Library
CREATE TABLE IF NOT EXISTS scenario_library (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id     TEXT NOT NULL UNIQUE,
  scenario_name   TEXT NOT NULL,
  scenario_type   TEXT NOT NULL,
  description     TEXT NOT NULL,
  shock_vector    JSONB NOT NULL DEFAULT '{}',
  tags            TEXT[] DEFAULT '{}',
  historical_basis TEXT,
  created_by      TEXT DEFAULT 'system',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sr_type ON simulation_runs(scenario_type);
CREATE INDEX IF NOT EXISTS idx_sr_status ON simulation_runs(status);
CREATE INDEX IF NOT EXISTS idx_sr_base ON simulation_runs(base_state_version_id);
CREATE INDEX IF NOT EXISTS idx_si_run ON simulation_iterations(run_id);
CREATE INDEX IF NOT EXISTS idx_sl_type ON scenario_library(scenario_type);
CREATE INDEX IF NOT EXISTS idx_sl_tags ON scenario_library USING GIN(tags);
