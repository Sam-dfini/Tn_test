-- TunisiaIntel v2.0 Final Intelligence Upgrade Schema

-- 1. Signal Lifecycle & Priority
ALTER TABLE signals ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'MEDIUM'; -- LOW, MEDIUM, HIGH, CRITICAL
ALTER TABLE signals ADD COLUMN IF NOT EXISTS uncertainty_score FLOAT DEFAULT 0.0;
ALTER TABLE signals ADD COLUMN IF NOT EXISTS is_expired BOOLEAN DEFAULT FALSE;
ALTER TABLE signals ADD COLUMN IF NOT EXISTS decay_rate FLOAT DEFAULT 0.01; -- Decay per hour
ALTER TABLE signals ADD COLUMN IF NOT EXISTS last_validated_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE signals ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE events ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'MEDIUM';
ALTER TABLE events ADD COLUMN IF NOT EXISTS uncertainty_score FLOAT DEFAULT 0.0;
ALTER TABLE events ADD COLUMN IF NOT EXISTS is_resolved BOOLEAN DEFAULT FALSE;
ALTER TABLE events ADD COLUMN IF NOT EXISTS resolution_notes TEXT;

-- 2. Causality & Relationships
CREATE TABLE IF NOT EXISTS causal_relationships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cause_variable_code VARCHAR(100) NOT NULL,
    effect_variable_code VARCHAR(100) NOT NULL,
    strength FLOAT DEFAULT 0.5, -- 0 to 1
    lag_days INT DEFAULT 0,
    is_causal BOOLEAN DEFAULT TRUE, -- vs correlated
    evidence_count INT DEFAULT 1,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(cause_variable_code, effect_variable_code)
);

-- 3. Temporal Patterns
CREATE TABLE IF NOT EXISTS temporal_patterns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    variable_code VARCHAR(100) NOT NULL,
    pattern_type VARCHAR(50), -- WEEKLY, SEASONAL, CYCLICAL
    period_days FLOAT,
    amplitude FLOAT,
    phase_offset FLOAT,
    confidence FLOAT DEFAULT 0.5,
    last_detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Human-in-the-Loop (HITL)
CREATE TABLE IF NOT EXISTS human_validations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    target_type VARCHAR(50), -- SIGNAL, EVENT, PREDICTION
    target_id UUID NOT NULL,
    analyst_id UUID NOT NULL,
    is_valid BOOLEAN NOT NULL,
    adjusted_confidence FLOAT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Agent Performance & Feedback
ALTER TABLE agent_memory ADD COLUMN IF NOT EXISTS performance_score FLOAT;
ALTER TABLE agent_memory ADD COLUMN IF NOT EXISTS human_feedback_id UUID REFERENCES human_validations(id);

CREATE TABLE IF NOT EXISTS agent_performance (
    agent_id VARCHAR(100) PRIMARY KEY,
    total_tasks INT DEFAULT 0,
    avg_accuracy FLOAT DEFAULT 0.0,
    current_weight FLOAT DEFAULT 1.0,
    last_recalibrated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'ACTIVE' -- ACTIVE, FLAGGED, SUSPENDED
);

-- 6. Observability & Reliability
CREATE TABLE IF NOT EXISTS system_incidents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    component VARCHAR(100),
    incident_type VARCHAR(100),
    severity VARCHAR(20),
    payload JSONB,
    is_recovered BOOLEAN DEFAULT FALSE,
    recovery_action TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    recovered_at TIMESTAMP WITH TIME ZONE
);

-- 7. Simulated Scenarios
CREATE TABLE IF NOT EXISTS simulated_scenarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mission_id TEXT,
    name TEXT NOT NULL,
    description TEXT,
    probability FLOAT DEFAULT 0.5,
    severity FLOAT DEFAULT 0.5,
    projected_rri FLOAT,
    steps JSONB, -- Array of time-step results
    variable_contributions JSONB, -- Map of variable impact
    historical_analogs JSONB, -- List of matched past events
    causal_chains JSONB, -- List of causal links triggered
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
