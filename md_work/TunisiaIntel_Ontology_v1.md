# Tunisia Strategic Ontology v1
## Causal Intelligence Layer — TunisiaIntel Phase 2

**Version:** 1.0  
**Date:** 2026-05-21  
**Depends on:** NationalStateSnapshot (Phase 1), existing knowledge graph (67 entities, 84 relations)

---

## What This Is

The knowledge graph already answers: **who** are the actors, **what** infrastructure exists, **how** they relate.

The ontology answers: **why** things escalate, **at what threshold**, **in which direction**, **at what speed**.

It is a directed causal graph with weights — encoding how a signal in one domain propagates through Tunisia's specific institutional and social fabric into a crisis in another domain.

This is not generic political science. Every chain and every weight must be validated against documented Tunisian historical events.

---

## Architecture

### New Supabase Table: `ontology_causal_chains`

```sql
CREATE TABLE ontology_causal_chains (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Chain identity
  chain_id            TEXT NOT NULL UNIQUE,   -- e.g. "wheat_to_protest_cascade"
  chain_name          TEXT NOT NULL,
  domain              TEXT NOT NULL,          -- economic|social|political|security|
                                              -- narrative|environmental|external
  trigger_category    TEXT NOT NULL,          -- which RRI variable category activates this
  
  -- Causal structure (ordered JSON array of nodes)
  -- Each node: { "step": 1, "concept": "wheat_price_spike",
  --              "rri_variable": "E2_wheat_stress",
  --              "entity_ids": ["CPG","STEG"],
  --              "propagation_weight": 0.85,
  --              "time_lag_days": 3,
  --              "amplifiers": ["UGTT mobilization", "Ramadan timing"],
  --              "suppressors": ["subsidy buffer", "W(t) war distraction"] }
  causal_nodes        JSONB NOT NULL DEFAULT '[]',

  -- Threshold that activates this chain
  activation_threshold NUMERIC(5,4),         -- RRI variable value that triggers chain
  activation_variable  TEXT,                 -- which variable crosses the threshold

  -- Historical validation
  validated_events    JSONB DEFAULT '[]',     -- [{"year": 2011, "event": "...", "match": 0.87}]
  validation_score    NUMERIC(4,3),          -- 0–1, how well chain matched history
  last_validated_at   TIMESTAMPTZ,

  -- Doctrine grounding
  doctrine_refs       JSONB DEFAULT '[]',    -- [{"source": "Sherman Kent", "concept": "..."}]

  -- Tunisia-specific calibration
  local_amplifiers    JSONB DEFAULT '[]',    -- factors that make this chain stronger in TUN
  local_suppressors   JSONB DEFAULT '[]',    -- factors that dampen this chain in TUN
  regional_sensitivity JSONB DEFAULT '{}',  -- which governorates are most affected
                                            -- {"gafsa": 0.9, "kasserine": 0.85, ...}

  -- Status
  confidence          NUMERIC(4,3),
  status              TEXT DEFAULT 'draft', -- draft|validated|active|deprecated
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_occ_domain ON ontology_causal_chains(domain);
CREATE INDEX idx_occ_status ON ontology_causal_chains(status);
CREATE INDEX idx_occ_trigger ON ontology_causal_chains(activation_variable);
```

### New Supabase Table: `ontology_trigger_thresholds`

```sql
-- Maps RRI variable values to named risk states
-- Encodes when a chain becomes active vs dormant

CREATE TABLE ontology_trigger_thresholds (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  variable_code     TEXT NOT NULL,          -- e.g. "E2_wheat_stress"
  threshold_name    TEXT NOT NULL,          -- "latent"|"active"|"critical"|"cascade"
  threshold_value   NUMERIC(6,4) NOT NULL,  -- normalized 0–1
  chain_ids         TEXT[] DEFAULT '{}',    -- which causal chains activate at this level
  historical_basis  TEXT,                  -- which event set this threshold
  notes             TEXT
);
```

---

## The 12 Core Causal Chains

Derived from RRI equations, validated against Tunisian history (2008–2026).

---

### CHAIN-01: Bread Price Cascade
**Domain:** Economic → Social  
**Activation variable:** `E2_wheat_stress` > 0.65  
**Historical basis:** 2011 pre-revolution, 2023 flour shortage episodes

```
Wheat import cost spike (+global price or FX weakness)
  → [weight: 0.85, lag: 2d] Bread subsidy fiscal pressure
  → [weight: 0.80, lag: 5d] Bakery shortage signals (informal keywords)
  → [weight: 0.75, lag: 3d] Public anger activation (EQ.2 salience rises)
  → [weight: 0.70, lag: 7d] Queue protests at distribution points
  → [weight: 0.65, lag: 4d] UGTT narrative amplification
  → [weight: 0.60, lag: 10d] Governorate spread: interior first (Kasserine, Gafsa, Sidi Bouzid)
  → [weight: 0.55, lag: 5d] Elite anxiety: BCT reserves pressure
  → [weight: 0.50, lag: 14d] IMF conditionality acceleration demand

Local amplifiers: Ramadan timing (+0.35), summer heat (+0.20), election proximity (+0.25)
Local suppressors: W(t) war distraction (–0.22), UGTT neutrality (–0.30)
Regional sensitivity: Kasserine 0.92, Gafsa 0.88, Sidi Bouzid 0.85, Tunis 0.45
```

---

### CHAIN-02: Phosphate Disruption Cascade
**Domain:** Economic → Political → Security  
**Activation variable:** `S4_phosphate_strike` > 0.60  
**Historical basis:** 2008 Gafsa mining basin uprising, recurring 2012–2016 strikes

```
CPG production disruption (strike or protest blockade)
  → [weight: 0.90, lag: 1d] Export revenue drop (phosphate = 8% GDP)
  → [weight: 0.75, lag: 7d] FX reserve pressure (BCT)
  → [weight: 0.70, lag: 3d] Gafsa regional grievance amplification
  → [weight: 0.85, lag: 2d] Interior Ministry deployment signal
  → [weight: 0.80, lag: 5d] Security confrontation probability rises
  → [weight: 0.65, lag: 10d] National UGTT solidarity signal
  → [weight: 0.60, lag: 14d] International media coverage (EU + rights orgs)
  → [weight: 0.55, lag: 7d] Investment chill: foreign mining partners

Local amplifiers: Gafsa historical grievance memory (+0.45), unemployment >30% local (+0.40)
Local suppressors: CPG employment dependency (paradox: workers fear job loss, –0.25)
Regional sensitivity: Gafsa 0.98, Metlaoui 0.95, Redeyef 0.93
```

---

### CHAIN-03: Elite Defection Cascade
**Domain:** Political  
**Activation variable:** `P1_mii` > 0.70 AND `rri` > 2.0  
**Historical basis:** 2011 Ben Ali defection sequence, 2013 Ennahda negotiated exit

```
Cabinet reshuffle signal (MII spike, EQ.21)
  → [weight: 0.90, lag: 1d] Elite loyalty recalculation (EQ.7 utility function)
  → [weight: 0.75, lag: 3d] Business elite hedging (capital positioning)
  → [weight: 0.70, lag: 5d] Military posture signal (neutrality vs support)
  → [weight: 0.85, lag: 2d] Opposition coalition formation attempt
  → [weight: 0.65, lag: 7d] Foreign power repositioning (EU, Algeria)
  → [weight: 0.80, lag: 4d] Cascade defection: each defection raises others' utility (λ term EQ.7)
  → [weight: 0.90, lag: 1d] Legitimacy collapse probability spike

Cascade term: each confirmed elite defection adds +0.15 to next defection probability
Suppressor: concentrated presidential power reduces defection surface (2021 structure)
Regional sensitivity: Tunis 0.95 (elite concentration), Sfax 0.75 (business elite node)
```

---

### CHAIN-04: FX Reserve Depletion → Social Contract Breach
**Domain:** Economic → Social  
**Activation variable:** `E4_fx_reserves_days` < 45  
**Historical basis:** 2023–2024 BCT reserve stress, IMF negotiation cycles

```
FX reserves drop below 45 days import cover
  → [weight: 0.85, lag: 3d] BCT rate defense → currency depreciation signal
  → [weight: 0.80, lag: 5d] Import cost transmission: fuel, food, medicine
  → [weight: 0.90, lag: 7d] Parallel market premium spike (BMI activation)
  → [weight: 0.75, lag: 10d] Subsidy fiscal unsustainability signal
  → [weight: 0.70, lag: 14d] IMF conditionality pressure (public austerity demand)
  → [weight: 0.65, lag: 7d] Public sector wage arrears risk
  → [weight: 0.85, lag: 5d] Social contract breach probability (EQ.E4)
  → [weight: 0.75, lag: 10d] Protest activation: interior governorates first

Critical threshold: < 30 days = acute crisis, BCT loses room to maneuver
Local amplifiers: Diaspora remittance drop (–inflow), tourism seasonality
```

---

### CHAIN-05: Narrative Warfare → Protest Mobilization
**Domain:** Narrative → Social  
**Activation variable:** `narrative_convergence` > 0.70  
**Historical basis:** 2010–2011 social media role, 2021 constitutional crisis framing

```
Single dominant narrative frame emerges (anti-IMF or anti-elite convergence score > 0.70)
  → [weight: 0.80, lag: 1d] Cross-platform amplification (Facebook dominant in TUN)
  → [weight: 0.75, lag: 2d] UGTT narrative adoption (+0.35 amplifier if adopted)
  → [weight: 0.85, lag: 1d] A(t) information amplification factor spikes (EQ.19)
  → [weight: 0.70, lag: 3d] SIR transmission rate β increases (+0.20)
  → [weight: 0.65, lag: 5d] Street-level protest coordination signal
  → [weight: 0.60, lag: 3d] Interior Ministry surveillance escalation
  → [weight: 0.55, lag: 7d] International media pickup (salience shift)

Suppressors: W(t) war distraction active (Gaza/Libya), presidential speech narrative reset
Local amplifiers: Friday prayer amplification (+0.30), diaspora signal boost (+0.20)
```

---

### CHAIN-06: UGTT General Strike → Systemic Paralysis
**Domain:** Social → Economic → Political  
**Activation variable:** `S4_ugtt_strike_index` > 0.75  
**Historical basis:** 2012, 2013 general strikes; UGTT as perennial veto player

```
UGTT strike escalation threshold crossed
  → [weight: 0.95, lag: 1d] Transport paralysis (STEG + logistics nodes)
  → [weight: 0.85, lag: 1d] Public sector shutdown cascade
  → [weight: 0.80, lag: 2d] Economic output contraction signal
  → [weight: 0.70, lag: 3d] Business elite pressure on presidency (UTICA channel)
  → [weight: 0.75, lag: 2d] Presidency negotiation signal OR repression signal
  → [weight: 0.65, lag: 5d] International creditor concern (IMF program risk)
  → [weight: 0.60, lag: 7d] Opposition coordination with strike narrative

UGTT veto power: above 0.75, UGTT effectively blocks subsidy removal decisions
Historical pattern: UGTT prefers negotiation over rupture — concession probability 0.70
```

---

### CHAIN-07: Security Repression → Radicalization Feedback
**Domain:** Security → Social → Long-term  
**Activation variable:** `S3_repression_index` > 0.65  
**Historical basis:** Post-2021 arrests, 2013 Ansar al-Sharia suppression cycle

```
Security crackdown intensity crosses threshold
  → [weight: 0.75, lag: 5d] Civil society narrative: legitimacy erosion
  → [weight: 0.70, lag: 7d] EU/international rights org condemnation
  → [weight: 0.65, lag: 14d] Underground network formation (removed from visible signal)
  → [weight: 0.80, lag: 10d] Youth radicalization flux increase
  → [weight: 0.60, lag: 30d] Prison radicalization vector (overcrowding amplifier)
  → [weight: 0.55, lag: 60d] Sleeper network activation probability rises

Critical warning: repression creates invisible risk — signals DROP but actual risk RISES
This chain produces the "suppression illusion" — RRI appears to stabilize while long-term risk grows
```

---

### CHAIN-08: Water Scarcity → Regional Conflict
**Domain:** Environmental → Social → Security  
**Activation variable:** `B1_water_stress` > 0.70  
**Historical basis:** Recurring Sfax, Sidi Bouzid, Kairouan water crises

```
Aquifer depletion / drought signal crosses threshold
  → [weight: 0.85, lag: 7d] Agricultural yield collapse (ASIL cascade)
  → [weight: 0.80, lag: 14d] Rural livelihood stress → urban migration signal
  → [weight: 0.75, lag: 10d] Regional inter-community water conflict
  → [weight: 0.70, lag: 5d] Infrastructure failure: STEG cooling water shortage
  → [weight: 0.65, lag: 20d] Food price pressure (local production drop)
  → [weight: 0.60, lag: 30d] Interior governorate grievance amplification
  → [weight: 0.55, lag: 14d] Security deployment to water infrastructure nodes

Regional sensitivity: Sidi Bouzid 0.93, Kairouan 0.90, Kasserine 0.87, Sfax 0.75
Compounding: water + heat + Ramadan = maximum amplification window (July–August)
```

---

### CHAIN-09: IMF Conditionality → Subsidy Removal → Crisis
**Domain:** External → Economic → Social  
**Activation variable:** `P3_imf_pressure` > 0.70  
**Historical basis:** 2023 IMF negotiations, 2024 subsidy adjustment signals

```
IMF program conditionality: subsidy removal demanded
  → [weight: 0.80, lag: 14d] Fiscal modeling: subsidy cut announcement risk
  → [weight: 0.85, lag: 1d] Narrative frame shift: anti-IMF frame activation
  → [weight: 0.75, lag: 7d] UGTT opposition signal (veto player activates)
  → [weight: 0.70, lag: 3d] Interior Ministry: unrest probability assessment
  → [weight: 0.65, lag: 5d] Military: escalation risk assessment
  → [weight: 0.90, lag: 2d] Presidency decision: delay + distraction (historical pattern)
  → [weight: 0.60, lag: 30d] IMF program suspension risk (reform credibility)
  → [weight: 0.75, lag: 60d] Sovereign credit downgrade signal

Historical pattern: Tunisia delays rather than implements (2019, 2021, 2023 cycles)
This creates: compounding fiscal stress + declining IMF credibility + rising subsidy burden
```

---

### CHAIN-10: Regional External Shock → Tunisia Contagion
**Domain:** External → Economic + Narrative  
**Activation variable:** `W(t)` > 0.65 OR external shock event  
**Historical basis:** Libya 2011 spillover, Gaza 2023–2024 salience effect, Sahel instability

```
Regional conflict or shock intensifies
  → [weight: 0.80, lag: 1d] W(t) war distraction effect: domestic salience suppressed (EQ.8)
  → [weight: 0.75, lag: 3d] Migration pressure: Libya/sub-Saharan flows intensify
  → [weight: 0.70, lag: 7d] Security deployment: southern border + coast
  → [weight: 0.65, lag: 5d] Tourism revenue risk (perception effect)
  → [weight: 0.60, lag: 14d] EU leverage increase: migration card activated
  → [weight: 0.55, lag: 10d] Energy supply risk: Libya gas dependency (STEG node)
  → [weight: 0.50, lag: 30d] Diaspora narrative amplification from conflict zone

Paradox: high W(t) suppresses visible protest BUT increases security burden and fiscal stress
Net effect on RRI depends on duration — short shocks suppress, prolonged shocks destabilize
```

---

### CHAIN-11: Legitimacy Collapse → Regime Transition Threshold
**Domain:** Political — Terminal Chain  
**Activation variable:** `rri` > 2.8 AND `p_revolution` > 0.45 AND `elite_cohesion` < 0.35  
**Historical basis:** 2011 Ben Ali exit sequence

```
Triple threshold breach: RRI critical + P_rev elevated + Elite cohesion collapsed
  → [weight: 0.95, lag: 1d] Military posture shift: neutrality declaration probability
  → [weight: 0.90, lag: 1d] Business elite capital flight acceleration
  → [weight: 0.85, lag: 2d] Foreign powers: repositioning toward successor signals
  → [weight: 0.80, lag: 3d] Opposition: unified front formation attempt
  → [weight: 0.75, lag: 1d] Security forces: loyalty fragmentation signal
  → [weight: 0.95, lag: 0d] Cascade defection: irreversible once military neutral

This is the terminal chain. Once activated, suppression probability drops below 0.30.
Historical analogue: Ben Ali exit took 28 days from first mass protest to departure.
Early warning window: 14–21 days before terminal threshold if chains 01+03+05 all active.
```

---

### CHAIN-12: Brain Drain → Long-term State Fragility
**Domain:** Social → Economic — Slow Chain  
**Activation variable:** `A16_brain_drain_rate` > 0.60  
**Historical basis:** 2015–2026 continuous emigration acceleration

```
Professional emigration rate sustained above threshold
  → [weight: 0.70, lag: 90d] Medical sector capacity erosion
  → [weight: 0.65, lag: 180d] Engineering/technical sector hollowing
  → [weight: 0.75, lag: 60d] SME management capacity decline
  → [weight: 0.60, lag: 365d] Tax base erosion (formal sector shrinks)
  → [weight: 0.55, lag: 180d] Innovation capacity collapse (startup death rate rises)
  → [weight: 0.50, lag: 365d] Institutional memory loss: bureaucratic capacity decline
  → [weight: 0.65, lag: 90d] Diaspora remittance increase (partial offset, finite)

This is a slow chain — invisible in short-term RRI but structurally critical.
Must be tracked via A16 variable with 6–24 month lag indicators.
```

---

## Ontology Construction Protocol

### Step 1 — Auto-seed from RRI equations (done above)
All 12 chains derived directly from EQ.1–EQ.24 variable dependencies.

### Step 2 — Historical validation (required before status: active)

Each chain must be backtested against minimum 2 historical events:

| Event | Date | Chains to validate |
|-------|------|-------------------|
| Gafsa mining basin uprising | 2008 | CHAIN-02, CHAIN-08 |
| Revolution | 2010–2011 | CHAIN-01, CHAIN-03, CHAIN-05, CHAIN-11 |
| Political crisis (Bardo assassinations) | 2013 | CHAIN-06, CHAIN-07 |
| Presidential self-coup | 2021 | CHAIN-03, CHAIN-05, CHAIN-09 |
| IMF negotiation + subsidy pressure | 2023–2024 | CHAIN-04, CHAIN-09, CHAIN-10 |

Validation score = cosine similarity between predicted propagation sequence and documented event sequence. Threshold for `status: active` = 0.70.

### Step 3 — Local sociology layer (must not be skipped)

For each chain, document:
- **Which informal power networks amplify or suppress it** (documented in chain's `local_amplifiers`)
- **Which regional sociology affects propagation speed** (in `regional_sensitivity`)
- **Which bureaucratic behaviors create lag or damping** (in `local_suppressors`)

Example — CHAIN-01 local sociology:
> Bread distribution in Tunisia runs through a network of licensed bakeries with regional monopolies. Shortage signals emerge first in informal social media (Facebook groups, WhatsApp) 2–3 days before official acknowledgment. The Interior Ministry tracks these 48 hours after the public does. This creates a systematic 5-day response lag that must be in the chain's timing.

### Step 4 — Doctrine grounding

Each chain references at least one doctrine source:
- Escalation theory (Herman Kahn, Schelling)
- Crowd behavior (Le Bon, Olson collective action)
- Regime survival theory (Bueno de Mesquita selectorate model)
- Economic crisis contagion theory
- Information environment amplification (Arquilla, Ronfeldt)

Doctrine refs stored in `doctrine_refs` JSONB field.

### Step 5 — Continuous calibration

When the Prediction Ledger records a miss:
1. Identify which chain was active during the missed prediction
2. Analyst reviews: was the chain weight wrong, the threshold wrong, or the lag wrong?
3. Proposed adjustment logged as a draft edit
4. Human approval required before weight update applied to `status: active` chain

---

## Integration with Existing Systems

### With Knowledge Graph
Causal chain nodes reference existing entity IDs:
- `CHAIN-02` nodes reference `CPG`, `STEG`, `UGTT`, `INT`, `BCT` entity IDs
- This links ontology traversal to actor network visualization

### With RRI Engine
- `activation_variable` maps to existing RRI variable codes
- `activation_threshold` maps to existing threshold values in `variables` table
- When a threshold is crossed during snapshot computation, linked chains are flagged as `active` in `national_state_snapshots.active_shocks`

### With Actor Cognition (Phase 4)
- Each actor schema's `input_sensitivity` map references chain concepts
- When CHAIN-01 activates, Presidency actor's `unrest` sensitivity fires
- UGTT actor's `labor_pressure` sensitivity fires from CHAIN-06

### With RAG Layer (Phase 3)
- Each chain stored as a retrievable chunk with full metadata
- Query: "why is Kasserine risk rising?" retrieves CHAIN-01 + CHAIN-08 nodes filtered to `regional_sensitivity.kasserine > 0.80`

---

## API Endpoints

```
GET  /api/ontology/chains              → all active chains
GET  /api/ontology/chains/:chain_id    → single chain with full nodes
GET  /api/ontology/active              → chains currently triggered by live state
POST /api/ontology/validate/:chain_id  → run historical validation
GET  /api/ontology/trace?variable=X    → which chains does variable X participate in?
```

---

## Implementation Order

```
1. Create ontology tables in Supabase                          → 30 min
2. Seed 12 core chains (Python seed file)                      → 3 hrs
3. Wire activation check into snapshot computation:            → 2 hrs
   after RRI computed → check thresholds → flag active chains
4. GET /api/ontology/active endpoint                          → 1 hr
5. Historical validation: run 5 events × relevant chains      → 1 day (analyst work)
6. Promote validated chains to status: active                  → 30 min
7. Wire active chains into Intelligence Brief generation       → 2 hrs
```

Total build time: ~2 days engineering + 1 day analyst validation.

---

## What This Enables (Immediately)

Once active chains are wired into the snapshot:

- **Intelligence Briefs** can explain *why* risk is rising, not just *that* it is rising
- **Governorate alerts** reference which chain is propagating and how fast
- **Actor postures** update based on which chains are active (feeds Phase 4)
- **Simulation Chamber** (Phase 7) injects shocks and traces chains forward
- **The system can answer:** "Wheat price spiked 3 days ago. Based on CHAIN-01, expect queue protests in Kasserine within 7 days with 0.72 confidence."

That is the difference between a dashboard and an intelligence system.

---

*Ontology v1.0 — 2026-05-21*  
*12 core chains. All derived from RRI equations. All require historical validation before activation.*

## Status: ✅ DONE
- SQL schema created (`002_ontology_causal_chains.sql`)
- 12 chains seeded in `backend/app/ontology/seed_chains.py`
- Backend service: activation check, chain CRUD, validation, variable trace
- API endpoints: `/api/ontology/chains`, `/active`, `/trace`, `/validate`
- Frontend: OntologyView in Brain Mode with 2-panel layout, causal flow diagram, regional sensitivity, amplifiers/suppressors
- Integrated into snapshot computation and brief engine
