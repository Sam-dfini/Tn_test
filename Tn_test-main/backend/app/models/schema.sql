-- ===============================================================
-- TUNISIAINTEL v2.0 - SUPABASE SCHEMA DESIGN
-- ===============================================================

-- 1. Sources Registry
CREATE TABLE IF NOT EXISTS sources (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    url TEXT,
    reliability_score FLOAT DEFAULT 0.5,
    historical_accuracy FLOAT DEFAULT 0.5,
    bias_level FLOAT,
    update_frequency_minutes INTEGER DEFAULT 60,
    last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Variables (Core Data)
CREATE TABLE IF NOT EXISTS variables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL, -- e.g., 'ECON_INF_01'
    category VARCHAR(50) NOT NULL, -- 'Economy', 'Social', 'Geopolitical', 'Energy'
    label VARCHAR(255) NOT NULL,
    current_value FLOAT DEFAULT 0.0,
    unit VARCHAR(20),
    source VARCHAR(255),
    confidence FLOAT DEFAULT 1.0,
    last_updated TIMESTAMPTZ DEFAULT now(),
    metadata JSONB DEFAULT '{}'
);

-- 3. Signals (Structured Ingested Data)
CREATE TABLE IF NOT EXISTS signals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL,
    subtype TEXT,
    location TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    intensity FLOAT NOT NULL CHECK (intensity >= 0 AND intensity <= 1),
    source_id TEXT REFERENCES sources(id),
    source_reliability_score FLOAT NOT NULL,
    confidence_score FLOAT NOT NULL,
    raw_text TEXT NOT NULL,
    extracted_entities JSONB DEFAULT '[]',
    tags TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Geopolitical & Economic Events
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL,
    subtype TEXT,
    location TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    actors TEXT[] DEFAULT '{}',
    cause TEXT,
    severity TEXT NOT NULL, -- LOW, MEDIUM, HIGH, CRITICAL
    description TEXT NOT NULL,
    signals_count INTEGER DEFAULT 1,
    related_signal_ids UUID[] DEFAULT '{}',
    confidence FLOAT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Merged & Enriched Signals (Output of Deduplication)
CREATE TABLE IF NOT EXISTS merged_signals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL,
    subtype TEXT,
    location TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    intensity FLOAT NOT NULL,
    confidence_score FLOAT NOT NULL,
    source_ids TEXT[] DEFAULT '{}',
    original_signal_ids UUID[] DEFAULT '{}',
    extracted_entities JSONB DEFAULT '[]',
    tags TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Social Media Signal Aggregates
CREATE TABLE IF NOT EXISTS social_signals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    topic TEXT NOT NULL,
    location TEXT NOT NULL,
    mention_count INTEGER NOT NULL,
    intensity FLOAT NOT NULL,
    sentiment FLOAT,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

-- 7. Agent Memory (Contextual Storage)
CREATE TABLE IF NOT EXISTS agent_memory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id VARCHAR(50) NOT NULL,
    context_key VARCHAR(255) NOT NULL,
    context_value JSONB NOT NULL,
    embedding VECTOR(1536), -- For semantic search
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Correlations (Relationship Matrix)
CREATE TABLE IF NOT EXISTS correlations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    variable_a_code VARCHAR(50) REFERENCES variables(code),
    variable_b_code VARCHAR(50) REFERENCES variables(code),
    coefficient FLOAT NOT NULL, -- -1.0 to 1.0
    lag_days INTEGER DEFAULT 0,
    is_causal BOOLEAN DEFAULT FALSE,
    last_computed TIMESTAMPTZ DEFAULT now(),
    UNIQUE(variable_a_code, variable_b_code)
);

-- 6. Anomalies (Early Warning Signals)
CREATE TABLE IF NOT EXISTS anomalies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    variable_code VARCHAR(50) REFERENCES variables(code),
    detected_value FLOAT NOT NULL,
    expected_value FLOAT NOT NULL,
    deviation_percent FLOAT NOT NULL,
    severity VARCHAR(20) DEFAULT 'LOW', -- 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
    detected_at TIMESTAMPTZ DEFAULT now(),
    is_resolved BOOLEAN DEFAULT FALSE
);

-- 7. Scenarios (What-If Simulations)
CREATE TABLE IF NOT EXISTS scenarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    inputs JSONB NOT NULL, -- e.g., {"ECON_INF_01": 0.15, "SOC_PROT_01": 0.8}
    predicted_rri FLOAT,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. Relationships (Graph Model)
CREATE TABLE IF NOT EXISTS relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id UUID NOT NULL,
    source_type VARCHAR(50) NOT NULL, -- 'VARIABLE', 'REGION', 'EVENT'
    target_id UUID NOT NULL,
    target_type VARCHAR(50) NOT NULL,
    influence_weight FLOAT DEFAULT 0.0, -- -1.0 to 1.0
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. Strategy Recommendations
CREATE TABLE IF NOT EXISTS recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trigger_type VARCHAR(50) NOT NULL, -- 'RRI_THRESHOLD', 'ANOMALY'
    trigger_id UUID,
    action_title VARCHAR(255) NOT NULL,
    action_description TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'MEDIUM',
    created_at TIMESTAMPTZ DEFAULT now()
);
