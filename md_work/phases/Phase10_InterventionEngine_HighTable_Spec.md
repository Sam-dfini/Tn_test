# Phase 10 — Intervention Engine + High Table Concentric Architecture
## Strategic Decision Layer — TunisiaIntel

**Version:** 1.0
**Date:** 2026-05-21
**Depends on:** Phases 1–9

---

## Part A — Intervention Engine

### What It Builds

The system already answers:
- What is happening? (Phase 1–3)
- Why is it happening? (Phase 2 ontology)
- Who will do what? (Phase 4–6)
- What happens next? (Phase 7)

The Intervention Engine answers the final question:

> "What action reduces collapse probability most efficiently,
>  at lowest political cost, with highest confidence?"

This transforms TunisiaIntel from an analytical system
into a genuine strategic decision simulator.

---

### Architecture

```
QUERY: "How do we reduce unrest probability in Gafsa?"
        │
        ▼
INTERVENTION ROUTER
Identifies: target outcome, affected variables, time horizon
        │
        ▼
INTERVENTION LIBRARY
Retrieves: all viable interventions for this scenario
        │
        ▼
PARALLEL SIMULATION
For each intervention:
  Fork canonical state
  Apply intervention vector
  Run Monte Carlo (500 iterations)
  Run deliberation (actor reactions)
  Compute outcome delta vs baseline
        │
        ▼
EFFICIENCY RANKER
Ranks by: outcome_improvement / political_cost / time_to_effect
        │
        ▼
SYNTHESIS ENGINE
Generates: ranked recommendation with tradeoffs + doctrine grounding
        │
        ▼
INTERVENTION REPORT
Ranked interventions + sensitivity + actor reactions + confidence
```

---

### Migration: `008_interventions.sql`

```sql
-- Intervention library
CREATE TABLE intervention_library (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intervention_id     TEXT NOT NULL UNIQUE,  -- "INT-E01"
  intervention_name   TEXT NOT NULL,
  category            TEXT NOT NULL,
  -- "economic"|"security"|"political"|"diplomatic"|"social"|"informational"
  description         TEXT NOT NULL,

  -- What this intervention does to state variables
  -- { "variable_code": delta, ... }
  state_vector        JSONB NOT NULL DEFAULT '{}',

  -- Cost dimensions (all 0–1)
  political_cost      NUMERIC(4,3),  -- regime legitimacy cost
  economic_cost       NUMERIC(4,3),  -- fiscal cost
  social_cost         NUMERIC(4,3),  -- public approval cost
  time_to_effect_days INTEGER,       -- days before effect materializes
  duration_days       INTEGER,       -- how long the effect lasts
  reversibility       NUMERIC(4,3),  -- 1.0 = fully reversible

  -- Which actors support/oppose this intervention
  -- [{ "entity_id": "UGTT", "stance": "oppose", "intensity": 0.85 }]
  actor_stances       JSONB DEFAULT '[]',

  -- Historical precedents
  historical_basis    TEXT,
  success_rate        NUMERIC(4,3),  -- historical success rate

  -- Constraints
  requires_imf_approval BOOLEAN DEFAULT FALSE,
  requires_parliament   BOOLEAN DEFAULT FALSE,
  requires_ugtt_consent BOOLEAN DEFAULT FALSE,

  tags                TEXT[] DEFAULT '{}',
  status              TEXT DEFAULT 'active'
);

-- Intervention simulation runs
CREATE TABLE intervention_runs (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id              TEXT NOT NULL UNIQUE,
  investigation_id    UUID REFERENCES investigations(id),

  -- Context
  target_outcome      TEXT NOT NULL,
  -- "reduce_unrest"|"stabilize_fx"|"prevent_strike"|"reduce_p_revolution"
  base_state_version_id TEXT NOT NULL,
  base_rri            NUMERIC(6,4),
  base_p_revolution   NUMERIC(5,4),
  time_horizon_days   INTEGER DEFAULT 30,

  -- Interventions tested (ordered by efficiency rank)
  interventions_tested TEXT[] NOT NULL,  -- intervention_ids
  ranked_results      JSONB DEFAULT '[]',
  -- [{
  --   "intervention_id": "INT-E01",
  --   "rank": 1,
  --   "efficiency_score": 0.82,
  --   "p_revolution_delta": -0.18,
  --   "rri_delta": -0.34,
  --   "political_cost": 0.45,
  --   "time_to_effect_days": 14,
  --   "actor_opposition": ["UGTT", "LPR"],
  --   "actor_support": ["BCT", "DONOR"],
  --   "confidence": 0.74,
  --   "tradeoffs": "...",
  --   "doctrine_grounding": "..."
  -- }]

  -- Recommended intervention
  top_recommendation  TEXT,           -- intervention_id
  recommendation_confidence NUMERIC(4,3),

  -- Comparison baseline (no intervention)
  baseline_p_revolution NUMERIC(5,4),
  baseline_rri         NUMERIC(6,4),

  status              TEXT DEFAULT 'pending',
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  completed_at        TIMESTAMPTZ
);

CREATE INDEX idx_il_category ON intervention_library(category);
CREATE INDEX idx_ir_target ON intervention_runs(target_outcome);
CREATE INDEX idx_ir_status ON intervention_runs(status);
```

---

### Intervention Library Seed

```python
INTERVENTIONS = [

  # ── ECONOMIC ────────────────────────────────────────────────────────

  {
    "intervention_id": "INT-E01",
    "intervention_name": "Emergency Bread Subsidy Increase",
    "category": "economic",
    "description": "Temporarily increase bread subsidy allocation by 30%. "
                   "Requires BCT reserve drawdown or emergency financing.",
    "state_vector": {
      "E2_wheat_stress": -0.25,
      "E2_bci": -0.30,
      "S1_public_anger": -0.20
    },
    "political_cost": 0.20,
    "economic_cost": 0.70,
    "social_cost": 0.05,
    "time_to_effect_days": 3,
    "duration_days": 90,
    "reversibility": 0.60,
    "actor_stances": [
      {"entity_id": "UGTT", "stance": "support", "intensity": 0.80},
      {"entity_id": "BCT",  "stance": "oppose",  "intensity": 0.70},
      {"entity_id": "DONOR","stance": "oppose",  "intensity": 0.85}
    ],
    "historical_basis": "TUN_2011_POST_REVOLUTION_SUBSIDY",
    "success_rate": 0.72,
    "requires_imf_approval": False,
    "tags": ["food", "subsidy", "short_term"]
  },

  {
    "intervention_id": "INT-E02",
    "intervention_name": "Gulf Emergency Financial Injection",
    "category": "diplomatic",
    "description": "Request emergency budget support from KSA or UAE. "
                   "Historically $1–3B deposits at BCT.",
    "state_vector": {
      "E4_fx_reserves_days": +30,
      "E4_parallel_fx_premium": -0.20,
      "P3_imf_pressure": -0.15
    },
    "political_cost": 0.55,
    "economic_cost": 0.10,
    "social_cost": 0.15,
    "time_to_effect_days": 7,
    "duration_days": 180,
    "reversibility": 0.30,
    "actor_stances": [
      {"entity_id": "BCT",  "stance": "support", "intensity": 0.90},
      {"entity_id": "LPR",  "stance": "oppose",  "intensity": 0.60},
      {"entity_id": "LTDH", "stance": "oppose",  "intensity": 0.70}
    ],
    "historical_basis": "TUN_2013_QATAR_DEPOSITS",
    "success_rate": 0.65,
    "requires_imf_approval": False,
    "tags": ["external", "fx", "gulf", "medium_term"]
  },

  {
    "intervention_id": "INT-E03",
    "intervention_name": "Phased Subsidy Reform (24 months)",
    "category": "economic",
    "description": "Gradual subsidy reduction with compensatory cash transfers. "
                   "IMF-approved. UGTT negotiated timeline.",
    "state_vector": {
      "P3_imf_pressure": -0.35,
      "E4_fx_reserves_pressure": -0.20,
      "S4_ugtt_strike_index": -0.15
    },
    "political_cost": 0.40,
    "economic_cost": 0.30,
    "social_cost": 0.35,
    "time_to_effect_days": 30,
    "duration_days": 730,
    "reversibility": 0.20,
    "actor_stances": [
      {"entity_id": "DONOR","stance": "support", "intensity": 0.95},
      {"entity_id": "BCT",  "stance": "support", "intensity": 0.80},
      {"entity_id": "UGTT", "stance": "neutral", "intensity": 0.50}
    ],
    "historical_basis": "TUN_2023_IMF_NEGOTIATION",
    "success_rate": 0.45,
    "requires_imf_approval": True,
    "requires_ugtt_consent": True,
    "tags": ["imf", "subsidy", "long_term", "structural"]
  },

  # ── SECURITY ────────────────────────────────────────────────────────

  {
    "intervention_id": "INT-S01",
    "intervention_name": "Targeted Security Deployment — Interior",
    "category": "security",
    "description": "Deploy security forces to Kasserine, Gafsa, Sidi Bouzid. "
                   "Suppress protest spread. Short-term containment.",
    "state_vector": {
      "S1_sir_infected": -0.20,
      "S1_protest_velocity": -0.25,
      "S3_repression_index": +0.35
    },
    "political_cost": 0.60,
    "economic_cost": 0.20,
    "social_cost": 0.65,
    "time_to_effect_days": 1,
    "duration_days": 30,
    "reversibility": 0.80,
    "actor_stances": [
      {"entity_id": "INT",  "stance": "support", "intensity": 0.95},
      {"entity_id": "ARM",  "stance": "neutral",  "intensity": 0.50},
      {"entity_id": "EU",   "stance": "oppose",   "intensity": 0.70},
      {"entity_id": "UGTT", "stance": "oppose",   "intensity": 0.75}
    ],
    "historical_basis": "TUN_2008_GAFSA_CONTAINMENT",
    "success_rate": 0.58,
    "tags": ["security", "short_term", "repression", "regional"],
    "warning": "Activates CHAIN-07 (repression→radicalization feedback). "
               "Short-term calm, long-term volatility increase."
  },

  {
    "intervention_id": "INT-S02",
    "intervention_name": "Internet Throttling — Social Media Restriction",
    "category": "informational",
    "description": "Restrict social media bandwidth. Reduces narrative "
                   "amplification A(t) and protest coordination speed.",
    "state_vector": {
      "narrative_convergence": -0.25,
      "A19_information_amplification": -0.30,
      "S1_sir_transmission_rate": -0.15
    },
    "political_cost": 0.55,
    "economic_cost": 0.10,
    "social_cost": 0.50,
    "time_to_effect_days": 1,
    "duration_days": 14,
    "reversibility": 0.95,
    "actor_stances": [
      {"entity_id": "INT",  "stance": "support", "intensity": 0.90},
      {"entity_id": "EU",   "stance": "oppose",  "intensity": 0.85},
      {"entity_id": "LTDH", "stance": "oppose",  "intensity": 0.95},
      {"entity_id": "DIASPORA","stance":"oppose","intensity": 0.80}
    ],
    "historical_basis": "TUN_2021_SOCIAL_MEDIA_RESTRICTIONS",
    "success_rate": 0.50,
    "warning": "Increases diaspora amplification paradox. "
               "International salience rises when domestic is suppressed.",
    "tags": ["informational", "short_term", "digital"]
  },

  # ── POLITICAL ───────────────────────────────────────────────────────

  {
    "intervention_id": "INT-P01",
    "intervention_name": "Cabinet Reshuffle — Technocratic Signal",
    "category": "political",
    "description": "Replace political ministers with technocrats. "
                   "Signals competence restoration to IMF and markets.",
    "state_vector": {
      "P1_mii": -0.20,
      "P1_elite_cohesion": +0.15,
      "P3_imf_pressure": -0.10
    },
    "political_cost": 0.35,
    "economic_cost": 0.05,
    "social_cost": 0.10,
    "time_to_effect_days": 7,
    "duration_days": 365,
    "reversibility": 0.50,
    "actor_stances": [
      {"entity_id": "BCT",  "stance": "support", "intensity": 0.75},
      {"entity_id": "DONOR","stance": "support", "intensity": 0.70},
      {"entity_id": "LPR",  "stance": "neutral", "intensity": 0.40}
    ],
    "historical_basis": "TUN_2023_TECHNOCRATIC_APPOINTMENTS",
    "success_rate": 0.60,
    "tags": ["political", "elite", "medium_term"]
  },

  {
    "intervention_id": "INT-P02",
    "intervention_name": "National Dialogue — UGTT Mediation",
    "category": "political",
    "description": "Convene UGTT-mediated national dialogue. "
                   "Historical precedent: 2013 Quartet model.",
    "state_vector": {
      "S4_ugtt_strike_index": -0.35,
      "P1_elite_cohesion": +0.20,
      "S1_protest_velocity": -0.15,
      "narrative_convergence": -0.20
    },
    "political_cost": 0.45,
    "economic_cost": 0.05,
    "social_cost": 0.10,
    "time_to_effect_days": 14,
    "duration_days": 180,
    "reversibility": 0.40,
    "actor_stances": [
      {"entity_id": "UGTT", "stance": "support", "intensity": 0.85},
      {"entity_id": "LPR",  "stance": "support", "intensity": 0.70},
      {"entity_id": "EU",   "stance": "support", "intensity": 0.80},
      {"entity_id": "PRES", "stance": "neutral", "intensity": 0.40}
    ],
    "historical_basis": "TUN_2013_NATIONAL_DIALOGUE",
    "success_rate": 0.68,
    "requires_ugtt_consent": True,
    "tags": ["political", "dialogue", "medium_term", "ugtt"]
  },

  # ── SOCIAL ──────────────────────────────────────────────────────────

  {
    "intervention_id": "INT-V01",
    "intervention_name": "Emergency Water Infrastructure — Interior",
    "category": "social",
    "description": "Fast-track water network repair in Kasserine, "
                   "Sidi Bouzid, Gafsa. Reduces structural grievance.",
    "state_vector": {
      "B1_water_stress": -0.25,
      "S1_rural_grievance": -0.20,
      "E2_bci": -0.10
    },
    "political_cost": 0.15,
    "economic_cost": 0.40,
    "social_cost": 0.02,
    "time_to_effect_days": 30,
    "duration_days": 1825,  # 5 years
    "reversibility": 0.05,
    "actor_stances": [
      {"entity_id": "PPL",  "stance": "support", "intensity": 0.90},
      {"entity_id": "UGTT", "stance": "support", "intensity": 0.75},
      {"entity_id": "LPR",  "stance": "support", "intensity": 0.70}
    ],
    "success_rate": 0.80,
    "tags": ["social", "infrastructure", "long_term", "regional"]
  },

  # ── DIPLOMATIC ──────────────────────────────────────────────────────

  {
    "intervention_id": "INT-D01",
    "intervention_name": "EU Migration Deal Leverage",
    "category": "diplomatic",
    "description": "Use migration leverage to unlock EU budget support "
                   "and suspend reform conditionality pressure.",
    "state_vector": {
      "P3_foreign_pressure": -0.25,
      "E4_fx_reserves_days": +15,
      "P3_imf_pressure": -0.10
    },
    "political_cost": 0.30,
    "economic_cost": 0.05,
    "social_cost": 0.20,
    "time_to_effect_days": 14,
    "duration_days": 365,
    "reversibility": 0.40,
    "actor_stances": [
      {"entity_id": "EU",   "stance": "conditional","intensity": 0.70},
      {"entity_id": "LTDH", "stance": "oppose",     "intensity": 0.80},
      {"entity_id": "BCT",  "stance": "support",    "intensity": 0.75}
    ],
    "historical_basis": "TUN_2023_EU_MIGRATION_DEAL",
    "success_rate": 0.62,
    "tags": ["diplomatic", "eu", "migration", "medium_term"]
  }
]
```

---

### Core Service: `intervention_engine.py`

```python
# backend/app/services/intervention_engine.py

class InterventionEngine:

    async def run(
        self,
        target_outcome: str,
        investigation_id: str = None,
        base_state_version_id: str = None,
        time_horizon_days: int = 30,
        intervention_ids: list = None,   # None = auto-select all viable
        top_n: int = 5
    ) -> dict:
        """
        Run intervention efficiency analysis.
        Returns ranked interventions with outcome deltas.
        """
        run_id = f"int_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"
        snapshot = await self._load_state(base_state_version_id)

        # Select interventions to test
        interventions = await self._select_interventions(
            target_outcome, snapshot, intervention_ids
        )

        # Baseline: no intervention
        baseline = await self._run_baseline(
            snapshot, time_horizon_days
        )

        # Test each intervention in parallel
        results = await asyncio.gather(*[
            self._test_intervention(
                intervention, snapshot,
                time_horizon_days, baseline
            )
            for intervention in interventions
        ])

        # Rank by efficiency
        ranked = self._rank_by_efficiency(results, target_outcome)

        # Synthesize recommendation
        recommendation = await self._synthesize_recommendation(
            ranked[:top_n], snapshot, target_outcome, baseline
        )

        return {
            "run_id": run_id,
            "target_outcome": target_outcome,
            "baseline": baseline,
            "ranked_interventions": ranked[:top_n],
            "top_recommendation": ranked[0] if ranked else None,
            "recommendation_narrative": recommendation["narrative"],
            "recommendation_citations": recommendation["citations"],
            "confidence": recommendation["confidence"]
        }


    async def _select_interventions(
        self,
        target_outcome: str,
        snapshot: dict,
        override_ids: list = None
    ) -> list:
        """
        Select viable interventions for this target outcome.
        Filter out:
        - Interventions that require unavailable resources
        - Interventions already active (state vector already applied)
        - Interventions with actor opposition > 0.90 from PRES
        """
        TARGET_TAGS = {
            "reduce_unrest":      ["food", "social", "political", "security"],
            "stabilize_fx":       ["economic", "diplomatic"],
            "prevent_strike":     ["political", "ugtt", "economic"],
            "reduce_p_revolution":["political", "economic", "social"],
            "reduce_cascade":     ["security", "regional", "social"]
        }

        target_tags = TARGET_TAGS.get(target_outcome, [])

        if override_ids:
            return await self._load_interventions(override_ids)

        all_interventions = await self._load_all_interventions()

        return [
            i for i in all_interventions
            if any(tag in i["tags"] for tag in target_tags)
            and i["status"] == "active"
        ]


    async def _test_intervention(
        self,
        intervention: dict,
        snapshot: dict,
        time_horizon_days: int,
        baseline: dict
    ) -> dict:
        """
        Fork state, apply intervention, run simulation,
        compute outcome delta vs baseline.
        """
        # Apply intervention vector
        modified_state = self._apply_intervention_vector(
            snapshot, intervention["state_vector"]
        )

        # Run simulation (500 MC iterations — faster than full 1000)
        sim_result = await simulation_engine.run(
            custom_scenario={
                "scenario_name": f"Intervention: {intervention['intervention_name']}",
                "scenario_type": "policy_decision",
                "shock_vector": intervention["state_vector"]
            },
            base_state_version_id=snapshot["state_version_id"],
            mc_iterations=500,
            time_horizon_days=time_horizon_days
        )

        # Run deliberation — actor reactions to this intervention
        deliberation = await deliberation_engine.run(
            scenario=f"Intervention proposed: {intervention['intervention_name']}",
            trigger_type="intervention",
            state_version_id=snapshot["state_version_id"],
            is_simulation=True
        )

        # Compute deltas
        p_rev_delta = (
            sim_result["p_revolution_range"]["mean"] -
            baseline["p_revolution_range"]["mean"]
        )
        rri_delta = (
            sim_result.get("rri_trajectory", [{}])[-1].get("mean", 0) -
            baseline.get("rri_final_mean", snapshot["rri"])
        )

        # Efficiency score
        # = outcome_improvement / (political_cost + economic_cost + social_cost)
        outcome_improvement = abs(p_rev_delta) if p_rev_delta < 0 else 0
        total_cost = (
            intervention["political_cost"] * 0.40 +
            intervention["economic_cost"] * 0.35 +
            intervention["social_cost"] * 0.25
        )
        efficiency_score = outcome_improvement / max(total_cost, 0.01)

        # Actor opposition summary
        actor_opposition = [
            s["entity_id"] for s in intervention.get("actor_stances", [])
            if s["stance"] == "oppose" and s["intensity"] > 0.60
        ]
        actor_support = [
            s["entity_id"] for s in intervention.get("actor_stances", [])
            if s["stance"] == "support" and s["intensity"] > 0.60
        ]

        return {
            "intervention_id": intervention["intervention_id"],
            "intervention_name": intervention["intervention_name"],
            "category": intervention["category"],
            "efficiency_score": round(efficiency_score, 3),
            "p_revolution_delta": round(p_rev_delta, 4),
            "rri_delta": round(rri_delta, 4),
            "political_cost": intervention["political_cost"],
            "economic_cost": intervention["economic_cost"],
            "social_cost": intervention["social_cost"],
            "time_to_effect_days": intervention["time_to_effect_days"],
            "reversibility": intervention["reversibility"],
            "actor_opposition": actor_opposition,
            "actor_support": actor_support,
            "deliberation_resolution": deliberation.get("resolution_type"),
            "veto_risk": deliberation.get("veto_actor"),
            "historical_success_rate": intervention.get("success_rate", 0.5),
            "requires_imf_approval": intervention.get("requires_imf_approval"),
            "requires_ugtt_consent": intervention.get("requires_ugtt_consent"),
            "warning": intervention.get("warning"),
            "confidence": min(
                sim_result.get("confidence", 0.7),
                intervention.get("success_rate", 0.5) + 0.2
            )
        }


    def _rank_by_efficiency(
        self,
        results: list,
        target_outcome: str
    ) -> list:
        """
        Composite ranking:
        60% efficiency_score
        20% historical_success_rate
        10% time_to_effect (faster = better)
        10% reversibility (more reversible = safer)
        """
        def composite_score(r):
            time_score = 1 - min(1, r["time_to_effect_days"] / 30)
            return (
                r["efficiency_score"]        * 0.60 +
                r["historical_success_rate"] * 0.20 +
                time_score                   * 0.10 +
                r["reversibility"]           * 0.10
            )

        ranked = sorted(results, key=composite_score, reverse=True)
        for i, r in enumerate(ranked):
            r["rank"] = i + 1
        return ranked


    async def _synthesize_recommendation(
        self,
        top_interventions: list,
        snapshot: dict,
        target_outcome: str,
        baseline: dict
    ) -> dict:
        """
        Generate strategic recommendation narrative.
        Cites doctrine + historical precedents.
        """
        doctrine_context = await doctrine_client.search_doctrine(
            query=f"intervention {target_outcome} Tunisia political stability",
            limit=2
        )

        system_prompt = f"""
You are a senior strategic analyst for Tunisia.

TARGET OUTCOME: {target_outcome}
CURRENT STATE: RRI {snapshot['rri']}, P(rev) {snapshot['p_revolution']}
BASELINE (no intervention): P(rev) {baseline['p_revolution_range']['mean']:.3f}

TOP {len(top_interventions)} RANKED INTERVENTIONS:
{json.dumps(top_interventions, indent=2)}

DOCTRINE CONTEXT:
{doctrine_context}

Generate a strategic recommendation as JSON:
{{
  "narrative": "3-4 sentences: top recommendation, why, key tradeoff, timing",
  "primary_recommendation": "intervention_id",
  "backup_recommendation": "intervention_id",
  "key_tradeoff": "one sentence on main cost of top recommendation",
  "timing_note": "when to implement for maximum effect",
  "confidence": 0.0-1.0,
  "citations": [...]
}}

RULES:
- Be direct. Recommend one action.
- State the tradeoff honestly.
- Do not recommend interventions with UGTT veto if ugtt_consent required
  and UGTT is in opposition.
- Output valid JSON only.
"""
        response = await llm_client.generate(
            prompt=f"Recommend intervention for: {target_outcome}",
            system=system_prompt,
            response_format="json"
        )
        return json.loads(response)
```

---

### API Endpoints

```
POST /api/interventions/run
  body: { target_outcome, investigation_id?, time_horizon_days?,
          intervention_ids? }
  → ranked intervention report

GET  /api/interventions/library
  → full intervention library

GET  /api/interventions/library/:intervention_id
  → single intervention detail

POST /api/interventions/test
  body: { intervention_id, base_state_version_id? }
  → single intervention simulation result

GET  /api/interventions/runs/:run_id
  → full intervention run record
```

---

### Workspace Integration

Add to capability selector in `workspace_orchestrator.py`:

```python
# Intent: "intervention" or keywords: "what should we do", "how to reduce",
# "best action", "recommend", "intervention"

if any(kw in query_lower for kw in
       ["what should", "how to reduce", "best action",
        "recommend", "intervention", "what can be done"]):
    intent = "intervention"
    capabilities["engines"].append("intervention")
    capabilities["blocks"].append("intervention-ranker")
```

---

---

## Part B — High Table Concentric Circle Architecture

### The Five Rings

```
                    ┌─────────────────────────────────┐
                    │         RING 4: EXTERNAL        │
                    │   EU · DZA · KSA · USA · CHN    │
              ┌─────┴─────────────────────────────────┴─────┐
              │           RING 3: CIVIL-POLITICAL           │
              │        UGTT · LPR · LTDH · PPL              │
        ┌─────┴─────────────────────────────────────────────┴─────┐
        │               RING 2: ECONOMIC COUNCIL                  │
        │            BCT · UTICA · Finance · DONOR                │
    ┌───┴───────────────────────────────────────────────────────┴───┐
    │                  RING 1: SECURITY COUNCIL                     │
    │                   ARM · INT · Security                        │
    │   ┌─────────────────────────────────────────────────────┐    │
    │   │              CORE: CARTHAGE ECHELON                  │    │
    │   │                      PRES                            │    │
    │   └─────────────────────────────────────────────────────┘    │
    └───────────────────────────────────────────────────────────────┘
```

### Ring Definitions

| Ring | Label | Color | Actors | Logic |
|------|-------|-------|--------|-------|
| Core | Carthage Echelon | `#7C3AED` purple | PRES | Executive decision authority |
| Ring 1 | Security Council | `#DC2626` red | ARM, INT | Coercive capacity |
| Ring 2 | Economic Council | `#2563EB` blue | BCT, UTICA, Finance, DONOR | Fiscal/monetary authority |
| Ring 3 | Civil-Political | `#D97706` amber | UGTT, LPR, LTDH, PPL | Legitimacy and veto power |
| Ring 4 | External Powers | `#374151` gray | EU, DZA, KSA, UAE, USA | Geopolitical pressure |

### Ring Interaction Logic

- **Decision flows inward:** External pressure → Civil reaction → Economic constraint → Security response → Presidential decision
- **Cascade flows outward:** Presidential decree → Security enforcement → Economic transmission → Civil reaction → International observation
- **Veto lines cut across rings:** UGTT veto (Ring 3) cuts directly to Core — drawn as a distinct dashed red line crossing all intermediate rings
- **Coalition arcs stay within rings first**, then cross rings when coalition spans multiple layers

---

### Updated `CircularTable.tsx` — Concentric Architecture

```tsx
// src/components/HighTable/CircularTable.tsx — REDESIGNED

const RING_CONFIG = {
  core: {
    radius: 70,
    label: 'CARTHAGE',
    color: '#7C3AED',
    strokeWidth: 2,
    actors: ['PRES']
  },
  ring1: {
    radius: 145,
    label: 'SECURITY COUNCIL',
    color: '#DC2626',
    strokeWidth: 1.5,
    actors: ['ARM', 'INT']
  },
  ring2: {
    radius: 220,
    label: 'ECONOMIC COUNCIL',
    color: '#2563EB',
    strokeWidth: 1.5,
    actors: ['BCT', 'UTICA', 'DONOR']
  },
  ring3: {
    radius: 300,
    label: 'CIVIL-POLITICAL',
    color: '#D97706',
    strokeWidth: 1,
    actors: ['UGTT', 'LPR', 'LTDH', 'PPL']
  },
  ring4: {
    radius: 380,
    label: 'EXTERNAL',
    color: '#374151',
    strokeWidth: 1,
    actors: ['EU', 'DZA', 'KSA', 'USA', 'DZA']
  }
};

const CENTER_X = 420;
const CENTER_Y = 420;
const SVG_W = 840;
const SVG_H = 840;

// Compute actor positions within each ring
// Actors within a ring are distributed evenly around that ring's circumference
function computeRingPositions(
  ringConfig: typeof RING_CONFIG
): Record<string, {x: number, y: number, ring: string, color: string}> {
  const positions: Record<string, any> = {};

  Object.entries(ringConfig).forEach(([ringKey, ring]) => {
    const count = ring.actors.length;
    // Start angle offset per ring to avoid visual collision
    const startAngle = ringKey === 'core' ? 0
      : ringKey === 'ring1' ? -90
      : ringKey === 'ring2' ? -60
      : ringKey === 'ring3' ? -80
      : -70;

    ring.actors.forEach((actorId, i) => {
      const angle = startAngle + (360 / count) * i;
      const rad = (angle * Math.PI) / 180;
      positions[actorId] = {
        x: CENTER_X + ring.radius * Math.cos(rad),
        y: CENTER_Y + ring.radius * Math.sin(rad),
        ring: ringKey,
        ringColor: ring.color,
        ringRadius: ring.radius
      };
    });
  });

  return positions;
}

export const CircularTable: React.FC<Props> = ({
  snapshot, session, selectedActor, mode,
  interventionRun
}) => {
  const actorPositions = useMemo(
    () => computeRingPositions(RING_CONFIG), []
  );

  return (
    <div className="circular-table-container">
      <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`}
           className="circular-table-svg">

        {/* Background rings — drawn outside-in */}
        {Object.entries(RING_CONFIG).reverse().map(([key, ring]) => (
          <g key={key}>
            {/* Ring circle */}
            <circle
              cx={CENTER_X} cy={CENTER_Y}
              r={ring.radius}
              fill="none"
              stroke={ring.color}
              strokeWidth={ring.strokeWidth}
              strokeOpacity={0.25}
            />
            {/* Ring label — at top of each ring */}
            <text
              x={CENTER_X}
              y={CENTER_Y - ring.radius - 6}
              textAnchor="middle"
              fill={ring.color}
              fontSize={8}
              fontFamily="monospace"
              letterSpacing="0.15em"
              opacity={0.60}
            >
              {ring.label}
            </text>
          </g>
        ))}

        {/* Tunisia map at center (inside core ring) */}
        <TunisiaMapCenter
          cx={CENTER_X} cy={CENTER_Y}
          snapshot={snapshot}
          radius={55}
        />

        {/* RRI pulse rings */}
        <RRIPulse
          cx={CENTER_X} cy={CENTER_Y}
          rri={snapshot?.rri}
          pRevolution={snapshot?.p_revolution}
        />

        {/* Inter-ring decision flow arrows */}
        <DecisionFlowArrows
          session={session}
          positions={actorPositions}
          cx={CENTER_X} cy={CENTER_Y}
        />

        {/* Coalition arcs — within ring first */}
        {session && (
          <CoalitionArcs
            session={session}
            positions={actorPositions}
            ringConfig={RING_CONFIG}
            cx={CENTER_X} cy={CENTER_Y}
          />
        )}

        {/* Veto lines — cut across rings */}
        {session?.veto_actor && (
          <VetoLine
            vetoActor={session.veto_actor}
            positions={actorPositions}
            cx={CENTER_X} cy={CENTER_Y}
          />
        )}

        {/* Chain signal lines */}
        <ChainSignalLines
          snapshot={snapshot}
          positions={actorPositions}
          cx={CENTER_X} cy={CENTER_Y}
        />

        {/* Intervention efficiency overlay */}
        {interventionRun && (
          <InterventionOverlay
            run={interventionRun}
            positions={actorPositions}
          />
        )}

        {/* Actor nodes — drawn last (on top) */}
        {Object.entries(actorPositions).map(([entityId, pos]) => (
          <ActorNode
            key={entityId}
            entityId={entityId}
            position={pos}
            ringColor={pos.ringColor}
            snapshot={snapshot}
            session={session}
            isSelected={selectedActor === entityId}
            isPres={entityId === 'PRES'}
            onClick={() => onActorSelect(entityId)}
          />
        ))}

      </svg>
    </div>
  );
};
```

---

### New Component: `VetoLine.tsx`

```tsx
// Draws a veto line from the vetoing actor directly to the PRES core
// Crosses all intermediate rings — visually distinct from coalition arcs

export const VetoLine: React.FC<Props> = ({
  vetoActor, positions, cx, cy
}) => {
  const vetoPos = positions[vetoActor];
  const presPos = positions['PRES'];
  if (!vetoPos || !presPos) return null;

  return (
    <g className="veto-line">
      {/* Veto line — thick dashed red */}
      <line
        x1={vetoPos.x} y1={vetoPos.y}
        x2={presPos.x} y2={presPos.y}
        stroke="#DC2626"
        strokeWidth={2}
        strokeDasharray="6 3"
        strokeOpacity={0.85}
        className="veto-pulse"
      />

      {/* Veto label at midpoint */}
      <text
        x={(vetoPos.x + presPos.x) / 2 + 8}
        y={(vetoPos.y + presPos.y) / 2 - 8}
        fill="#DC2626"
        fontSize={8}
        fontFamily="monospace"
        letterSpacing="0.1em"
        opacity={0.85}
      >
        VETO
      </text>

      {/* Veto dot at actor end */}
      <circle
        cx={vetoPos.x} cy={vetoPos.y} r={4}
        fill="#DC2626" opacity={0.9}
        className="pulse-ring"
      />
    </g>
  );
};
```

---

### New Component: `DecisionFlowArrows.tsx`

```tsx
// Shows decision/pressure flow direction between rings
// Inward arrows = pressure flowing toward PRES
// Outward arrows = decree flowing from PRES outward

export const DecisionFlowArrows: React.FC<Props> = ({
  session, positions, cx, cy
}) => {
  if (!session) return null;

  const resolution = session.resolution_type;
  // Outward flow on consensus/compromise, inward on deadlock/escalation
  const flowDirection = ['consensus', 'compromise'].includes(resolution)
    ? 'outward'
    : 'inward';

  // Draw subtle arrows along each ring boundary
  // showing which direction pressure is moving
  return (
    <g className="decision-flow" opacity={0.35}>
      {Object.entries(RING_CONFIG).slice(1).map(([key, ring]) => (
        <FlowArrow
          key={key}
          cx={cx} cy={cy}
          radius={ring.radius}
          color={ring.color}
          direction={flowDirection}
        />
      ))}
    </g>
  );
};
```

---

### New Component: `InterventionOverlay.tsx`

```tsx
// When an intervention run is active, overlay efficiency indicators
// on relevant actor nodes

export const InterventionOverlay: React.FC<Props> = ({
  run, positions
}) => {
  if (!run?.ranked_interventions?.length) return null;

  const top = run.ranked_interventions[0];

  return (
    <g className="intervention-overlay">
      {/* Support actors — green glow */}
      {top.actor_support?.map(actorId => {
        const pos = positions[actorId];
        if (!pos) return null;
        return (
          <circle key={actorId}
            cx={pos.x} cy={pos.y} r={32}
            fill="none"
            stroke="#10B981"
            strokeWidth={2}
            strokeOpacity={0.60}
            className="support-pulse"
          />
        );
      })}

      {/* Opposition actors — red glow */}
      {top.actor_opposition?.map(actorId => {
        const pos = positions[actorId];
        if (!pos) return null;
        return (
          <circle key={actorId}
            cx={pos.x} cy={pos.y} r={32}
            fill="none"
            stroke="#DC2626"
            strokeWidth={2}
            strokeOpacity={0.60}
            strokeDasharray="4 2"
          />
        );
      })}

      {/* Efficiency score label on top intervention */}
      <text
        x={CENTER_X} y={CENTER_Y + 75}
        textAnchor="middle"
        fill="#10B981"
        fontSize={10}
        fontFamily="monospace"
      >
        TOP: {top.intervention_name}
      </text>
      <text
        x={CENTER_X} y={CENTER_Y + 88}
        textAnchor="middle"
        fill="#6B7280"
        fontSize={9}
        fontFamily="monospace"
      >
        ΔP(rev): {(top.p_revolution_delta * 100).toFixed(1)}%
      </text>
    </g>
  );
};
```

---

### Updated `ActorRegistry.tsx` — Ring-Grouped

Left panel now groups actors by ring with clear visual separation.

```tsx
// Group actors by ring in the registry

const RING_GROUPS = [
  { key: 'core',  label: 'CARTHAGE ECHELON', color: '#7C3AED',
    actors: ['PRES'] },
  { key: 'ring1', label: 'SECURITY COUNCIL', color: '#DC2626',
    actors: ['ARM', 'INT'] },
  { key: 'ring2', label: 'ECONOMIC COUNCIL', color: '#2563EB',
    actors: ['BCT', 'UTICA', 'DONOR'] },
  { key: 'ring3', label: 'CIVIL-POLITICAL',  color: '#D97706',
    actors: ['UGTT', 'LPR', 'LTDH', 'PPL'] },
  { key: 'ring4', label: 'EXTERNAL POWERS',  color: '#374151',
    actors: ['EU', 'DZA', 'KSA', 'USA'] }
];

// Render registry with ring group headers
{RING_GROUPS.map(group => (
  <div key={group.key} className="ring-group">
    <div className="ring-group-header"
         style={{ borderColor: group.color, color: group.color }}>
      {group.label}
    </div>
    {group.actors.map(entityId => (
      <ActorRow key={entityId} entityId={entityId} ... />
    ))}
  </div>
))}
```

---

### Updated CSS additions

```css
/* Ring group headers in registry */
.ring-group {
  margin-bottom: 12px;
}
.ring-group-header {
  font-size: 8px;
  letter-spacing: 0.18em;
  padding: 3px 6px;
  border-left: 2px solid;
  margin-bottom: 4px;
  opacity: 0.80;
}

/* Veto line pulse */
@keyframes veto-pulse {
  0%,100% { stroke-opacity: 0.85; }
  50%      { stroke-opacity: 0.40; }
}
.veto-pulse { animation: veto-pulse 1.2s ease-in-out infinite; }

/* Support/opposition overlays */
@keyframes support-pulse {
  0%,100% { r: 32; opacity: 0.60; }
  50%      { r: 36; opacity: 0.30; }
}
.support-pulse { animation: support-pulse 2s ease-in-out infinite; }

/* Decision flow arrows */
.decision-flow { pointer-events: none; }
```

---

## Implementation Order

```
PART A — Intervention Engine
1. Migration 008_interventions.sql                        → 30 min
2. intervention_engine.py — full service                  → 4 hrs
3. Seed intervention library (9 interventions)            → 1 hr
4. API endpoints                                          → 1 hr
5. Wire into workspace_orchestrator (intent + block)      → 1 hr
6. InterventionRanker block component                     → 2 hrs

PART B — High Table Concentric Redesign
7. Update RING_CONFIG + computeRingPositions()            → 1 hr
8. Update CircularTable.tsx — concentric SVG              → 2 hrs
9. VetoLine.tsx                                           → 30 min
10. DecisionFlowArrows.tsx                                → 30 min
11. InterventionOverlay.tsx                               → 1 hr
12. Update ActorRegistry.tsx — ring-grouped               → 1 hr
13. CSS additions                                         → 30 min
14. Wire intervention run into HighTableRoom state        → 30 min
```

Total: ~3 days.

---

## Validation Tests

```
Test 1: Intervention run — reduce unrest
  POST /api/interventions/run
  { target_outcome: "reduce_unrest", time_horizon_days: 30 }
  Expected:
  - At least 5 interventions ranked
  - INT-E01 (bread subsidy) in top 3
  - INT-S01 (security deployment) has warning field
  - Top recommendation narrative cites historical precedent

Test 2: Veto detection in intervention
  If UGTT oppose + requires_ugtt_consent = true
  Expected: intervention flagged, UGTT veto risk: true

Test 3: Concentric rings render correctly
  Open High Table
  Expected:
  - 5 visible rings with labels
  - PRES at center, ARM+INT in Ring 1, BCT+UTICA+DONOR in Ring 2
  - UGTT in Ring 3, EU+DZA in Ring 4
  - Each ring labeled with correct color

Test 4: Veto line renders
  Trigger deliberation with UGTT veto active
  Expected: dashed red line from UGTT position to PRES center
  "VETO" label at midpoint

Test 5: Intervention overlay on High Table
  Run intervention analysis, open High Table
  Expected: green glow on support actors, red dashed on opposition
  Top intervention name shown at center bottom
```

---

## What Phase 10 Completes

```
PHASE 1:  One truth            → canonical state
PHASE 2:  Why it escalates     → causal ontology
PHASE 3:  What happened        → RAG memory
PHASE 4:  Who does what        → actor cognition
PHASE 5:  Why patterns repeat  → doctrine library
PHASE 6:  What they decide     → deliberation engine
PHASE 7:  What happens next    → simulation chamber
PHASE 8:  The sovereign table  → High Table UI
PHASE 9:  Ask anything         → cognitive workspace
PHASE 10: What to do about it  → intervention engine
```

The system now closes the full intelligence loop:

```
MONITOR → UNDERSTAND → SIMULATE → DELIBERATE → INTERVENE
```

An analyst asks:
"How do we prevent a UGTT strike triggering a cascade?"

The system retrieves evidence, models actor reactions,
runs 500 simulations per intervention, ranks by efficiency,
detects UGTT veto risk on economic options,
recommends National Dialogue (INT-P02) with 68% historical
success rate, and renders the full actor coalition map
on the concentric High Table — showing exactly which rings
support the decision and which resist it.

That is the complete sovereign intelligence cognition system.

---

*Phase 10 v1.0 — 2026-05-21*
