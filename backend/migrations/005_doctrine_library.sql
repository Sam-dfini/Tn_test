-- 005_doctrine_library.sql
-- Doctrine Library — AnythingLLM ingestion log
-- Tracks what's been ingested, when, and status for system health monitoring.

CREATE TABLE IF NOT EXISTS doctrine_ingestion_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_title  TEXT NOT NULL,
  workspace       TEXT NOT NULL,
  anythingllm_doc_id TEXT,
  ingested_at     TIMESTAMPTZ DEFAULT NOW(),
  chunk_count     INTEGER,
  status          TEXT DEFAULT 'pending',  -- 'pending'|'active'|'failed'
  tier            INTEGER,                 -- 1|2|3
  metadata        JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_dil_workspace ON doctrine_ingestion_log(workspace);
CREATE INDEX IF NOT EXISTS idx_dil_status ON doctrine_ingestion_log(status);
CREATE INDEX IF NOT EXISTS idx_dil_tier ON doctrine_ingestion_log(tier);
