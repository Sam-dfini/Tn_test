-- ============================================================
-- NATIONAL STATE SNAPSHOTS TABLE
-- ============================================================
-- This table stores the canonical national state for TunisiaIntel.
-- All strategic outputs must derive from one canonical national state.
--
-- Rules:
-- - Snapshots are immutable after publication.
-- - New information creates a new version.
-- - All outputs link to snapshot_id.
-- - UI always displays the source snapshot_id and freshness.

-- Truth classification enum (PostgreSQL 14+ uses CHECK constraint)
-- REAL: Actual observed data
-- HYBRID: AI + Human collaboration
-- SIMULATION: Scenario fork with injected shocks
-- PLACEHOLDER: Temporary placeholder (blocked in production)
-- MOCK: Mock data (blocked in production)

CREATE TABLE national_state_snapshots (
  -- Core identifiers
  snapshot_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Time window this snapshot represents
  window_from TIMESTAMPTZ NOT NULL,
  window_to TIMESTAMPTZ NOT NULL,
  
  -- Truth classification
  truth_class TEXT NOT NULL CHECK (truth_class IN ('REAL', 'HYBRID', 'SIMULATION', 'PLACEHOLDER', 'MOCK')),
  is_simulation BOOLEAN NOT NULL DEFAULT FALSE,
  simulation_base_snapshot_id UUID REFERENCES national_state_snapshots(snapshot_id),
  
  -- Provenance (JSONB)
  provenance JSONB NOT NULL,
  
  -- Confidence breakdown (JSONB)
  confidence JSONB NOT NULL,
  
  -- Core state (JSONB)
  risk_vector JSONB NOT NULL,
  derived_metrics JSONB NOT NULL,
  governorates JSONB NOT NULL,
  active_shocks JSONB NOT NULL,
  
  -- Graph references (JSONB)
  actor_graph_ref JSONB,
  event_graph_ref JSONB,
  
  -- Version history
  parent_snapshot_id UUID REFERENCES national_state_snapshots(snapshot_id),
  children_snapshot_ids UUID[],
  
  -- Metadata for UI
  freshness JSONB NOT NULL,
  
  -- Timestamps
  ingested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Pipeline run tracking
  pipeline_run_id TEXT NOT NULL,
  
  -- Indexes for common queries
  CREATE INDEX idx_nss_created_at ON national_state_snapshots(created_at DESC);
  CREATE INDEX idx_nss_truth_class ON national_state_snapshots(truth_class);
  CREATE INDEX idx_nss_is_simulation ON national_state_snapshots(is_simulation);
  CREATE INDEX idx_nss_parent_snapshot_id ON national_state_snapshots(parent_snapshot_id);
  CREATE INDEX idx_nss_window_to ON national_state_snapshots(window_to DESC);
);

-- ============================================================
-- TRIGGER: Prevent updates to existing snapshots
-- ============================================================

CREATE OR REPLACE FUNCTION prevent_snapshot_update()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Cannot update national_state_snapshots: snapshots are immutable';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_snapshot_update
  BEFORE UPDATE ON national_state_snapshots
  FOR EACH ROW
  EXECUTE FUNCTION prevent_snapshot_update();

-- ============================================================
-- TRIGGER: Set parent_snapshot_id on new snapshots
-- ============================================================

CREATE OR REPLACE FUNCTION set_parent_snapshot_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Get the most recent snapshot
  SELECT snapshot_id INTO NEW.parent_snapshot_id
  FROM national_state_snapshots
  WHERE truth_class != 'PLACEHOLDER' AND truth_class != 'MOCK'
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- Update the parent's children_snapshot_ids
  IF NEW.parent_snapshot_id IS NOT NULL THEN
    UPDATE national_state_snapshots
    SET children_snapshot_ids = array_append(
      COALESCE(children_snapshot_ids, ARRAY[]::UUID[]),
      NEW.snapshot_id
    )
    WHERE snapshot_id = NEW.parent_snapshot_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_set_parent_snapshot_id
  BEFORE INSERT ON national_state_snapshots
  FOR EACH ROW
  EXECUTE FUNCTION set_parent_snapshot_id();

-- ============================================================
-- VIEWS
-- ============================================================

-- Latest non-placeholder, non-mock snapshot
CREATE VIEW latest_national_state AS
SELECT *
FROM national_state_snapshots
WHERE truth_class NOT IN ('PLACEHOLDER', 'MOCK')
ORDER BY created_at DESC
LIMIT 1;

-- Snapshot history for a given time period
CREATE VIEW snapshot_history AS
SELECT 
  snapshot_id,
  version,
  created_at,
  truth_class,
  is_simulation,
  parent_snapshot_id,
  provenance->>'pipeline_run_id' as pipeline_run_id,
  confidence->>'overall' as overall_confidence
FROM national_state_snapshots
WHERE truth_class NOT IN ('PLACEHOLDER', 'MOCK')
ORDER BY created_at DESC;

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS
ALTER TABLE national_state_snapshots ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can read snapshots
CREATE POLICY "Anyone can read snapshots"
  ON national_state_snapshots
  FOR SELECT
  USING (true);

-- Policy: Only service role can insert snapshots
CREATE POLICY "Service role can insert snapshots"
  ON national_state_snapshots
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- Policy: No one can update snapshots (enforced by trigger too)
CREATE POLICY "No one can update snapshots"
  ON national_state_snapshots
  FOR UPDATE
  USING (false);

-- Policy: No one can delete snapshots (optional - keep for audit trail)
CREATE POLICY "No one can delete snapshots"
  ON national_state_snapshots
  FOR DELETE
  USING (false);

-- ============================================================
-- SAMPLE DATA (for testing)
-- ============================================================

-- INSERT INTO national_state_snapshots (
--   version,
--   window_from,
--   window_to,
--   truth_class,
--   is_simulation,
--   provenance,
--   confidence,
--   risk_vector,
--   derived_metrics,
--   governorates,
--   active_shocks,
--   freshness,
--   pipeline_run_id
-- ) VALUES (
--   'v1.0.0',
--   NOW() - INTERVAL '24 hours',
--   NOW(),
--   'REAL',
--   false,
--   '{"sources": ["supabase", "rss", "bct"], "pipeline_run_id": "test-run-1", "model_versions": {"classification": "v2.1", "brief_model": "gpt-4-turbo", "rri_engine": "rri-engine-v2"}, "ingested_at": NOW(), "processed_at": NOW()}'::JSONB,
--   '{"overall": 0.82, "by_domain": {"economic": 0.85, "political": 0.80, "social": 0.83, "security": 0.75, "narrative": 0.78}, "by_source": {"supabase": 0.85, "rss": 0.70, "bct": 0.82}, "model_versions": {"classification": "v2.1", "brief_model": "gpt-4-turbo", "rri_engine": "rri-engine-v2"}}'::JSONB,
--   '{"rri": 2.31, "p_rev": 0.643, "velocity": 0.05, "cascade_probability": 0.35}'::JSONB,
--   '{"rri": 2.31, "p_rev": 0.643, "cascade_probability": 0.35, "velocity": 0.05}'::JSONB,
--   '[{"id": "1", "name": {"en": "Tunis", "ar": "تونس"}, "risk_level": "MEDIUM"}]'::JSONB,
--   '[]'::JSONB,
--   '{"age_seconds": 0, "is_stale": false, "last_updated": NOW()}'::JSONB,
--   'test-run-1'
-- );
