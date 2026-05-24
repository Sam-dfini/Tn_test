# NationalStateSnapshot — Schema Design
## TunisiaIntel Canonical State Layer

**Version:** 1.0  
**Date:** 2026-05-21  
**Phase:** 1 — Canonical State

---

## The Problem This Solves

Currently RRI is computed in three places:
- `PipelineContext.tsx` — frontend recalculation
- Python backend — independent computation
- Various component-level derivations

Result: Professional mode, Tactical ticker, and the API can show different RRI values at the same moment. Agents built on top of this will reason against diverging realities.

**The fix:** One authoritative snapshot per computation cycle. Everything reads from it.

---

## Design Principles

1. **One writer** — Python orchestrator only. Frontend is read-only.
2. **Versioned** — every snapshot has a unique `state_version_id`. Modes display which version they're showing.
3. **Immutable** — snapshots are never updated in place. New cycle = new row.
4. **Provenance** — every field records what computed it and when.
5. **Projection-ready** — each mode reads the same snapshot and projects its own view from it.

---

## Supabase Table: `national_state_snapshots`

```sql
CREATE TABLE national_state_snapshots (
  -- Identity
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state_version_id      TEXT NOT NULL UNIQUE,  -- e.g. "v_20260521_143022"
  computed_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  computation_source    TEXT NOT NULL,          -- "python_orchestrator" | "manual_trigger"
  computation_duration_ms INTEGER,

  -- ── CORE RRI ──────────────────────────────────────────────────────────
  rri                   NUMERIC(6,4) NOT NULL,  -- 0.0 – 5.0
  rri_previous          NUMERIC(6,4),           -- last snapshot value (delta tracking)
  p_revolution          NUMERIC(5,4) NOT NULL,  -- 0.0 – 1.0  (EQ.12)
  velocity              NUMERIC(6,4),           -- V(t) EQ.16, tanh output
  acceleration          NUMERIC(6,4),           -- A(t) EQ.23, dV/dt
  compound_stress       NUMERIC(6,4),           -- CS(t) EQ.15
  cascade_probability   NUMERIC(5,4),           -- P_cascade(t) EQ.17
  salience              NUMERIC(5,4),           -- S(t) EQ.2/3
  war_intensity         NUMERIC(5,4),           -- W(t) EQ.8
  elite_cohesion        NUMERIC(5,4),           -- EC(t) EQ.18

  -- ── DERIVED INDICES ───────────────────────────────────────────────────
  mii                   NUMERIC(5,4),           -- Ministerial Instability Index EQ.21
  sei                   NUMERIC(5,4),           -- Systemic Exhaustion Index
  nbs                   NUMERIC(5,4),           -- National Broadcast Sentiment
  bmi                   NUMERIC(5,4),           -- Black Market Index EQ.A2
  fsi                   NUMERIC(5,4),           -- Food Security Index
  rsi                   NUMERIC(5,4),           -- Resilience/Stability Index
  oci                   NUMERIC(5,4),           -- Opposition Cohesion Index EQ.C3

  -- ── MONTE CARLO CONFIDENCE ────────────────────────────────────────────
  mc_p_revolution_mean  NUMERIC(5,4),           -- Mean P_rev across 10K runs EQ.14
  mc_p_revolution_p10   NUMERIC(5,4),           -- 10th percentile
  mc_p_revolution_p90   NUMERIC(5,4),           -- 90th percentile
  mc_runs               INTEGER DEFAULT 10000,

  -- ── CATEGORY SCORES (24 RRI categories) ───────────────────────────────
  -- Stored as JSONB: { "A": 0.72, "B": 0.31, ... "X": 0.55 }
  category_scores       JSONB NOT NULL DEFAULT '{}',

  -- ── SIR MODEL STATE ───────────────────────────────────────────────────
  sir_susceptible       NUMERIC(10,4),          -- S pool EQ.4
  sir_infected          NUMERIC(10,4),          -- I pool (active protesters)
  sir_recovered         NUMERIC(10,4),          -- R pool

  -- ── GOVERNORATE VECTORS (24 governorates) ─────────────────────────────
  -- Stored as JSONB array:
  -- [{ "gov_id": "tunis", "stress": 0.72, "cascade_p": 0.45,
  --    "dominant_emotion": "anger", "protest_active": true,
  --    "sir_infected": 1240, "rri_contribution": 0.08 }, ...]
  governorate_vectors   JSONB NOT NULL DEFAULT '[]',

  -- ── ACTIVE SHOCKS ─────────────────────────────────────────────────────
  -- [{ "shock_id": "uuid", "type": "food_price_spike",
  --    "intensity": 0.78, "governorates": ["gafsa","kasserine"],
  --    "detected_at": "ISO", "omega_weight": 0.65 }]
  active_shocks         JSONB NOT NULL DEFAULT '[]',

  -- ── NARRATIVE STATE ───────────────────────────────────────────────────
  -- { "dominant_frame": "anti_imf", "frame_scores": {...},
  --   "dominant_emotion": "anger", "emotion_scores": {...},
  --   "convergence_score": 0.71, "active_slogans": [...] }
  narrative_state       JSONB DEFAULT '{}',

  -- ── ACTOR POSTURES ────────────────────────────────────────────────────
  -- Lightweight summary — full profiles live in actor_profiles table
  -- [{ "actor_id": "presidency", "stress_level": 0.74,
  --    "posture": "defensive", "last_updated": "ISO" }]
  actor_postures        JSONB DEFAULT '[]',

  -- ── NATIONAL STATE MACHINE ────────────────────────────────────────────
  state_phase           TEXT,    -- "stable"|"elevated"|"mobilizing"|"crisis"|
                                 -- "acute_crisis"|"transition"|"collapse"
  state_phase_confidence NUMERIC(4,3),
  state_phase_dwell_days INTEGER,

  -- ── SIGNAL CREDIBILITY ────────────────────────────────────────────────
  avg_sci_score         NUMERIC(4,3),           -- mean SCI across active signals
  high_confidence_signals INTEGER,              -- count SCI >= 0.85
  psyop_detected        BOOLEAN DEFAULT FALSE,

  -- ── ECONOMIC SNAPSHOT ─────────────────────────────────────────────────
  fx_reserves_days      NUMERIC(6,1),           -- import cover days
  inflation_rate        NUMERIC(5,2),           -- CPI %
  parallel_fx_premium   NUMERIC(5,2),           -- % above official rate
  unemployment_rate     NUMERIC(5,2),

  -- ── PROVENANCE ────────────────────────────────────────────────────────
  variables_used        INTEGER,                -- count of variables that fed this snapshot
  articles_processed    INTEGER,                -- articles ingested since last snapshot
  data_freshness_hours  NUMERIC(5,1),           -- age of oldest input signal
  confidence_overall    NUMERIC(4,3),           -- aggregate confidence 0–1

  -- ── METADATA ──────────────────────────────────────────────────────────
  is_simulation         BOOLEAN DEFAULT FALSE,  -- TRUE = scenario fork, not live
  parent_state_id       UUID REFERENCES national_state_snapshots(id),  -- for forks
  notes                 TEXT
);

-- Indexes
CREATE INDEX idx_nss_computed_at ON national_state_snapshots(computed_at DESC);
CREATE INDEX idx_nss_version ON national_state_snapshots(state_version_id);
CREATE INDEX idx_nss_rri ON national_state_snapshots(rri DESC);
CREATE INDEX idx_nss_live ON national_state_snapshots(is_simulation, computed_at DESC);
```

---

## Supporting Table: `state_variable_snapshots`

Stores the full 251-variable values that produced each snapshot.
Kept separate to avoid bloating the main table.

```sql
CREATE TABLE state_variable_snapshots (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state_id        UUID NOT NULL REFERENCES national_state_snapshots(id) ON DELETE CASCADE,
  variable_code   TEXT NOT NULL,    -- e.g. "E1_inflation"
  variable_value  NUMERIC(10,6),
  normalized_value NUMERIC(6,4),   -- 0–1
  weight          NUMERIC(6,4),
  threshold_breach BOOLEAN DEFAULT FALSE,
  computed_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_svs_state ON state_variable_snapshots(state_id);
CREATE INDEX idx_svs_breach ON state_variable_snapshots(state_id, threshold_breach);
```

---

## API Endpoints

Three endpoints. That's all the frontend needs.

### `GET /api/state/latest`
Returns the most recent live snapshot (is_simulation = false).

```json
{
  "state_version_id": "v_20260521_143022",
  "computed_at": "2026-05-21T14:30:22Z",
  "rri": 2.14,
  "rri_previous": 2.08,
  "p_revolution": 0.312,
  "velocity": 0.18,
  "compound_stress": 0.44,
  "cascade_probability": 0.29,
  "state_phase": "elevated",
  "state_phase_confidence": 0.81,
  "mc_p_revolution_mean": 0.318,
  "mc_p_revolution_p10": 0.21,
  "mc_p_revolution_p90": 0.43,
  "mii": 0.61,
  "sei": 0.48,
  "category_scores": { "A": 0.72, "B": 0.31, "D": 0.58, ... },
  "governorate_vectors": [...],
  "active_shocks": [...],
  "narrative_state": { ... },
  "actor_postures": [...],
  "confidence_overall": 0.79,
  "data_freshness_hours": 1.2,
  "articles_processed": 847,
  "variables_used": 251
}
```

### `GET /api/state/:version_id`
Returns a specific historical snapshot by version ID.
Used for: time-travel replay, simulation comparison, backtesting.

### `GET /api/rri`
Lightweight endpoint. Returns only what the Tactical ticker needs.

```json
{
  "state_version_id": "v_20260521_143022",
  "rri": 2.14,
  "p_revolution": 0.312,
  "state_phase": "elevated",
  "computed_at": "2026-05-21T14:30:22Z"
}
```

---

## Write Protocol (Python Orchestrator Only)

```python
# backend/app/services/state_snapshot.py

async def write_snapshot(rri_result: dict) -> str:
    """
    Called by the orchestrator after every RRI computation cycle.
    Returns the new state_version_id.
    """
    version_id = f"v_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"

    snapshot = {
        "state_version_id": version_id,
        "computation_source": "python_orchestrator",
        "rri": rri_result["rri"],
        "rri_previous": await get_previous_rri(),
        "p_revolution": rri_result["p_revolution"],
        "velocity": rri_result["velocity"],
        "compound_stress": rri_result["compound_stress"],
        "cascade_probability": rri_result["cascade_probability"],
        "category_scores": rri_result["category_scores"],
        "governorate_vectors": rri_result["governorate_vectors"],
        "active_shocks": rri_result["active_shocks"],
        "narrative_state": rri_result["narrative_state"],
        "actor_postures": rri_result["actor_postures"],
        "state_phase": rri_result["state_phase"],
        "variables_used": len(rri_result["variables"]),
        "confidence_overall": rri_result["confidence"],
        # ... all other fields
    }

    await supabase.table("national_state_snapshots").insert(snapshot)

    # Broadcast to frontend via WebSocket
    await broadcast("ti:STATE_UPDATE", {"state_version_id": version_id})

    return version_id
```

**Rule:** This function is the only place in the entire codebase that writes to `national_state_snapshots`. No exceptions.

---

## Frontend Migration (PipelineContext)

PipelineContext stops recomputing RRI. It becomes a consumer.

```typescript
// src/context/PipelineContext.tsx — after migration

// REMOVE: recalculateRRI(), all local computation logic
// ADD: consumeSnapshot()

const consumeSnapshot = async () => {
  const res = await fetch('/api/state/latest');
  const snapshot = await res.json();

  // Distribute to all existing state variables
  setRriValue(snapshot.rri);
  setPRevolution(snapshot.p_revolution);
  setCategoryScores(snapshot.category_scores);
  setGovernorateVectors(snapshot.governorate_vectors);
  setActiveShocks(snapshot.active_shocks);
  setNarrativeState(snapshot.narrative_state);
  setStatePhase(snapshot.state_phase);
  setCurrentVersionId(snapshot.state_version_id);
  // ... etc
};

// Listen for backend push
useEffect(() => {
  window.addEventListener('ti:STATE_UPDATE', consumeSnapshot);
  return () => window.removeEventListener('ti:STATE_UPDATE', consumeSnapshot);
}, []);
```

All components that previously called `usePipeline()` to get RRI data continue working unchanged — they still get the same shape of data from context. The change is invisible to them.

---

## Consistency Test

The acceptance test for Phase 1 completion:

```bash
# Hit all three simultaneously
curl /api/state/latest | jq .rri           # Python snapshot
curl /api/rri | jq .rri                    # Lightweight endpoint
# Open Professional mode → check RRI display
# Open Tactical mode → check ticker

# All four must show identical value for same state_version_id
```

If they match: Phase 1 done.

---

## Snapshot Retention Policy

```sql
-- Keep last 30 days of live snapshots (runs every ~5 min = ~8,640 rows/month)
-- Keep all simulation forks indefinitely (they're sparse)
-- Archive older live snapshots to cold storage after 90 days

-- Automated cleanup (run daily via pg_cron or Supabase Edge Function)
DELETE FROM national_state_snapshots
WHERE is_simulation = FALSE
  AND computed_at < NOW() - INTERVAL '30 days';
```

---

## Implementation Order

```
1. Create tables in Supabase (SQL above)                  → 30 min
2. Write state_snapshot.py service in Python backend      → 2 hrs
3. Wire write_snapshot() into existing RRI computation    → 1 hr
4. Implement GET /api/state/latest + /api/rri endpoints   → 1 hr
5. Migrate PipelineContext to consumeSnapshot()           → 3 hrs
6. Remove frontend RRI recomputation logic                → 1 hr
7. Run consistency test across all modes                  → 30 min
```

Total: ~1 focused day of backend work, ~1 day of frontend migration.

---

*Schema v1.0 — 2026-05-21*
