-- Phase 10: Intervention Engine
-- Migration: 008_interventions.sql

CREATE TABLE IF NOT EXISTS intervention_library (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    intervention_id         TEXT NOT NULL UNIQUE,
    intervention_name       TEXT NOT NULL,
    category                TEXT NOT NULL,
    description             TEXT NOT NULL,
    state_vector            JSONB NOT NULL DEFAULT '{}',
    political_cost          NUMERIC(4,3),
    economic_cost           NUMERIC(4,3),
    social_cost             NUMERIC(4,3),
    time_to_effect_days     INTEGER,
    duration_days           INTEGER,
    reversibility           NUMERIC(4,3),
    actor_stances           JSONB DEFAULT '[]',
    historical_basis        TEXT,
    success_rate            NUMERIC(4,3),
    requires_imf_approval   BOOLEAN DEFAULT FALSE,
    requires_parliament     BOOLEAN DEFAULT FALSE,
    requires_ugtt_consent   BOOLEAN DEFAULT FALSE,
    warning                 TEXT,
    tags                    TEXT[] DEFAULT '{}',
    status                  TEXT DEFAULT 'active',
    created_at              TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS intervention_runs (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id                      TEXT NOT NULL UNIQUE,
    investigation_id            UUID,
    target_outcome              TEXT NOT NULL,
    base_state_version_id       TEXT NOT NULL,
    base_rri                    NUMERIC(6,4),
    base_p_revolution           NUMERIC(5,4),
    time_horizon_days           INTEGER DEFAULT 30,
    interventions_tested        TEXT[] NOT NULL DEFAULT '{}',
    ranked_results              JSONB DEFAULT '[]',
    top_recommendation          TEXT,
    recommendation_confidence   NUMERIC(4,3),
    recommendation_narrative    TEXT,
    baseline_p_revolution       NUMERIC(5,4),
    baseline_rri                NUMERIC(6,4),
    status                      TEXT DEFAULT 'pending',
    created_at                  TIMESTAMPTZ DEFAULT NOW(),
    completed_at                TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_il_category    ON intervention_library(category);
CREATE INDEX IF NOT EXISTS idx_il_status      ON intervention_library(status);
CREATE INDEX IF NOT EXISTS idx_ir_target      ON intervention_runs(target_outcome);
CREATE INDEX IF NOT EXISTS idx_ir_status      ON intervention_runs(status);
CREATE INDEX IF NOT EXISTS idx_ir_created     ON intervention_runs(created_at DESC);
