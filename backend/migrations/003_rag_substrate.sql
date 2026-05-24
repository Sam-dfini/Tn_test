-- 003_rag_substrate.sql
-- RAG Substrate — Embeddings, Search, and Query Log Tables
-- Depends on: articles, telegram_messages (existing)

CREATE EXTENSION IF NOT EXISTS vector;

-- ── Article Chunks ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS article_embeddings (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id    UUID REFERENCES articles(id) ON DELETE CASCADE,
  chunk_index   INT NOT NULL,
  chunk_text    TEXT NOT NULL,
  embedding     VECTOR(1536),
  metadata      JSONB DEFAULT '{}',
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ae_vector ON article_embeddings
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- ── Telegram Chunks (one per message, no chunking) ──────────────────

CREATE TABLE IF NOT EXISTS telegram_embeddings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id      TEXT NOT NULL UNIQUE,
  chunk_text      TEXT NOT NULL,
  embedding       VECTOR(1536),
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_te_vector ON telegram_embeddings
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- ── Query Log (every retrieval + synthesis stored for audit) ────────

CREATE TABLE IF NOT EXISTS rag_query_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query_text      TEXT NOT NULL,
  trigger_source  TEXT NOT NULL,  -- 'brief_engine'|'ontology_chain'|'analyst_terminal'|'manual'
  chain_id        TEXT,           -- if triggered by ontology chain
  chunks_retrieved JSONB DEFAULT '[]',
  synthesis_output TEXT,
  citations       JSONB DEFAULT '[]',
  confidence      NUMERIC(4,3),
  model_used      TEXT,
  latency_ms      INTEGER,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
