# Phase 7 — Simulation Chamber
## Strategic Scenario Engine — TunisiaIntel

**Version:** 1.0  
**Date:** 2026-05-21  
**Depends on:** All previous phases (1–6)

---

## What This Phase Builds

The simulation chamber answers one question:

> "What happens next if decision X is taken — or if shock Y occurs?"

Phases 1–6 built the analytical brain. Phase 7 gives it the ability to run futures.

A simulation is a **fork** from the canonical state snapshot. The engine:
1. Takes a current or historical state as the base
2. Injects a shock or policy decision
3. Propagates effects through the ontology causal chains (Phase 2)
4. Runs actor responses through the deliberation engine (Phase 6)
5. Advances the state forward in discrete time steps
6. Runs Monte Carlo across N iterations for robustness
7. Returns a probability distribution of outcomes — not a single prediction

This is not a chatbot "what if." Every step is equation-driven, chain-validated, and actor-grounded.

---

## Architecture

```
SCENARIO INPUT
(shock | policy decision | black swan)
        │
        ▼
FORK from NationalStateSnapshot
(creates isolated simulation branch)
        │
        ▼
SHOCK INJECTION ENGINE
Applies shock vector to forked state
Updates affected RRI variables
Flags activated causal chains
        │
        ▼
PROPAGATION ENGINE  (per time step T)
Advances each active chain one step
Updates governorate vectors
Updates actor postures
        │
        ▼
DELIBERATION ENGINE  (Phase 6)
Actors respond to propagated state
Decision output feeds back into next step
        │
        ▼
MONTE CARLO WRAPPER
Runs N iterations with Gaussian noise
Produces probability distributions
        │
        ▼
SIMULATION OUTPUT
Outcome map · Sensitivity analysis
Counterfactual comparison · Timeline
Historical analogue match
```

---

## Migration: `006_simulation.sql`

```sql
-- Simulation runs
CREATE TABLE simulation_runs (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id                TEXT NOT NULL UNIQUE,   -- "sim_20260521_143022"

  -- Scenario definition
  scenario_name         TEXT NOT NULL,
  scenario_description  TEXT NOT NULL,
  scenario_type         TEXT NOT NULL,
  -- "shock_injection"|"policy_decision"|"black_swan"|"compound"

  -- Fork base
  base_state_version_id TEXT NOT NULL,
  base_rri              NUMERIC(6,4),
  base_p_revolution     NUMERIC(5,4),
  base_state_phase      TEXT,
  is_historical_fork    BOOLEAN DEFAULT FALSE,
  -- true = forked from historical event, not live state

  -- Shock parameters
  shock_vector          JSONB NOT NULL DEFAULT '{}',
  -- { "variable_code": delta_value, ... }
  -- e.g. { "E2_wheat_stress": +0.30, "E4_fx_reserves_days": -15 }

  -- Time parameters
  time_horizon_days     INTEGER NOT NULL DEFAULT 30,
  time_step_days        INTEGER NOT NULL DEFAULT 7,
  -- advance in 7-day steps by default

  -- Monte Carlo parameters
  mc_iterations         INTEGER NOT NULL DEFAULT 1000,
  noise_sigma           NUMERIC(5,4) DEFAULT 0.05,
  -- Gaussian noise applied to each variable per iteration

  -- Chains activated by shock
  activated_chain_ids   TEXT[] DEFAULT '{}',

  -- Aggregated outputs (across all MC iterations)
  outcome_distribution  JSONB DEFAULT '{}',
  -- { "stable": 0.22, "elevated": 0.35, "crisis": 0.28,
  --   "acute_crisis": 0.12, "transition": 0.03 }

  p_revolution_range    JSONB DEFAULT '{}',
  -- { "mean": 0.42, "p10": 0.28, "p50": 0.41, "p90": 0.61 }

  rri_trajectory        JSONB DEFAULT '[]',
  -- [{ "day": 7, "mean": 2.3, "p10": 1.9, "p90": 2.8 }, ...]

  governorate_risk_delta JSONB DEFAULT '{}',
  -- { "gafsa": +0.35, "kasserine": +0.28, "tunis": +0.12, ... }

  elite_fracture_probability NUMERIC(5,4),
  military_posture_shift     NUMERIC(5,4),
  ugtt_strike_probability    NUMERIC(5,4),
  migration_pressure_delta   NUMERIC(5,4),

  -- Sensitivity analysis
  sensitivity_ranking   JSONB DEFAULT '[]',
  -- [{ "variable": "E2_wheat_stress", "impact": 0.78 },
  --   { "variable": "military_posture", "impact": 0.71 }, ...]

  -- Counterfactual
  counterfactual_run_id TEXT,
  -- linked sim_run_id with alternative decision

  -- Historical match
  historical_analogue   TEXT,
  analogue_similarity   NUMERIC(4,3),

  -- Deliberation output per time step
  deliberation_session_ids TEXT[] DEFAULT '{}',

  -- Status
  status                TEXT DEFAULT 'pending',
  -- "pending"|"running"|"complete"|"failed"
  started_at            TIMESTAMPTZ DEFAULT NOW(),
  completed_at          TIMESTAMPTZ,
  duration_ms           INTEGER,
  error_message         TEXT
);

-- Individual MC iteration results (sampled storage — not all 1000)
-- Store every 10th iteration for inspection
CREATE TABLE simulation_iterations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id          UUID NOT NULL REFERENCES simulation_runs(id) ON DELETE CASCADE,
  iteration_index INTEGER NOT NULL,
  final_rri       NUMERIC(6,4),
  final_p_rev     NUMERIC(5,4),
  final_phase     TEXT,
  trajectory      JSONB DEFAULT '[]',
  -- [{ "day": 7, "rri": 2.1, "p_rev": 0.38 }, ...]
  chain_sequence  TEXT[],
  -- ordered list of chains that activated during this iteration
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Pre-built scenario library
CREATE TABLE scenario_library (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id     TEXT NOT NULL UNIQUE,
  scenario_name   TEXT NOT NULL,
  scenario_type   TEXT NOT NULL,
  description     TEXT NOT NULL,
  shock_vector    JSONB NOT NULL DEFAULT '{}',
  tags            TEXT[] DEFAULT '{}',
  -- ["economic","imf","food","security","climate","political"]
  historical_basis TEXT,
  created_by      TEXT DEFAULT 'system',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sr_type ON simulation_runs(scenario_type);
CREATE INDEX idx_sr_status ON simulation_runs(status);
CREATE INDEX idx_sr_base ON simulation_runs(base_state_version_id);
CREATE INDEX idx_si_run ON simulation_iterations(run_id);
CREATE INDEX idx_sl_type ON scenario_library(scenario_type);
CREATE INDEX idx_sl_tags ON scenario_library USING GIN(tags);
```

---

## Pre-built Scenario Library

Seed these on startup. Analysts can run any of these immediately.

```python
SCENARIO_LIBRARY = [

  # ── ECONOMIC ──────────────────────────────────────────────────────────

  {
    "scenario_id": "SCN-E01",
    "scenario_name": "Full Subsidy Removal — IMF Demand",
    "scenario_type": "policy_decision",
    "description": "IMF demands complete removal of bread and fuel subsidies "
                   "as condition for program continuation.",
    "shock_vector": {
      "E2_wheat_stress": +0.35,
      "E4_fx_reserves_pressure": +0.25,
      "P3_imf_pressure": +0.40,
      "A12_supply_squeeze": +0.20
    },
    "tags": ["economic", "imf", "food", "ugtt"],
    "historical_basis": "TUN_2023_IMF_NEGOTIATION"
  },

  {
    "scenario_id": "SCN-E02",
    "scenario_name": "FX Reserve Crisis — Below 30 Days",
    "scenario_type": "shock_injection",
    "description": "Foreign exchange reserves drop to critical level "
                   "below 30 days import cover.",
    "shock_vector": {
      "E4_fx_reserves_days": -25,
      "E4_parallel_fx_premium": +0.30,
      "A18_revenue_collapse": +0.25
    },
    "tags": ["economic", "currency", "bct", "imf"]
  },

  {
    "scenario_id": "SCN-E03",
    "scenario_name": "Global Wheat Price Spike +40%",
    "scenario_type": "shock_injection",
    "description": "Global wheat price rises 40% due to Black Sea disruption.",
    "shock_vector": {
      "E2_wheat_stress": +0.40,
      "E2_bci": +0.30,
      "A12_supply_squeeze": +0.25
    },
    "tags": ["economic", "food", "global"],
    "historical_basis": "TUN_2011_FOOD_PRICE_SPIKE"
  },

  # ── POLITICAL ─────────────────────────────────────────────────────────

  {
    "scenario_id": "SCN-P01",
    "scenario_name": "Cabinet Reshuffle — MII Spike",
    "scenario_type": "policy_decision",
    "description": "Sudden dismissal of 5+ ministers signals elite fracture.",
    "shock_vector": {
      "P1_mii": +0.35,
      "P1_elite_cohesion": -0.25,
      "P1_cabinet_friction": +0.30
    },
    "tags": ["political", "elite", "presidency"]
  },

  {
    "scenario_id": "SCN-P02",
    "scenario_name": "Constitutional Crisis",
    "scenario_type": "black_swan",
    "description": "Legitimacy challenge to executive authority — "
                   "opposition coalition + international condemnation.",
    "shock_vector": {
      "P1_elite_cohesion": -0.40,
      "P3_foreign_pressure": +0.35,
      "S1_protest_velocity": +0.30,
      "narrative_convergence": +0.45
    },
    "tags": ["political", "legitimacy", "opposition", "foreign"],
    "historical_basis": "TUN_2021_SELF_COUP"
  },

  # ── SECURITY ──────────────────────────────────────────────────────────

  {
    "scenario_id": "SCN-S01",
    "scenario_name": "UGTT General Strike",
    "scenario_type": "shock_injection",
    "description": "UGTT calls a national general strike over wage demands.",
    "shock_vector": {
      "S4_ugtt_strike_index": +0.50,
      "S1_protest_velocity": +0.25,
      "E4_economic_output": -0.15
    },
    "tags": ["labor", "ugtt", "social"],
    "historical_basis": "TUN_2013_GENERAL_STRIKE"
  },

  {
    "scenario_id": "SCN-S02",
    "scenario_name": "Gafsa Mining Basin Blockade",
    "scenario_type": "shock_injection",
    "description": "CPG production halted by protest blockade — "
                   "phosphate exports suspended.",
    "shock_vector": {
      "S4_phosphate_strike": +0.60,
      "A18_revenue_collapse": +0.30,
      "E4_fx_reserves_pressure": +0.20
    },
    "tags": ["security", "economic", "regional", "phosphate"],
    "historical_basis": "TUN_2008_GAFSA"
  },

  # ── ENVIRONMENTAL ─────────────────────────────────────────────────────

  {
    "scenario_id": "SCN-V01",
    "scenario_name": "Severe Drought — Agricultural Collapse",
    "scenario_type": "shock_injection",
    "description": "Third consecutive drought year. Wheat yield -60%. "
                   "Water rationing in 12 governorates.",
    "shock_vector": {
      "B1_water_stress": +0.45,
      "E2_wheat_stress": +0.35,
      "E2_bci": +0.30,
      "S1_rural_grievance": +0.25
    },
    "tags": ["environmental", "food", "water", "agriculture"]
  },

  # ── COMPOUND ──────────────────────────────────────────────────────────

  {
    "scenario_id": "SCN-C01",
    "scenario_name": "Perfect Storm — IMF + Drought + Gaza Escalation",
    "scenario_type": "compound",
    "description": "Simultaneous: IMF program suspended + severe drought + "
                   "major regional conflict escalation.",
    "shock_vector": {
      "P3_imf_pressure": +0.50,
      "B1_water_stress": +0.40,
      "E2_wheat_stress": +0.40,
      "W_war_intensity": +0.35,
      "E4_fx_reserves_pressure": +0.30,
      "A12_supply_squeeze": +0.25
    },
    "tags": ["compound", "critical", "economic", "environmental", "external"]
  },

  {
    "scenario_id": "SCN-C02",
    "scenario_name": "Regime Transition Threshold",
    "scenario_type": "compound",
    "description": "Conditions matching 2011 pre-departure week: "
                   "mass protest + elite fracture + military signal.",
    "shock_vector": {
      "P1_elite_cohesion": -0.50,
      "S1_sir_infected": +0.40,
      "P1_mii": +0.40,
      "ARM_posture_shift": -0.35,
      "narrative_convergence": +0.50
    },
    "tags": ["compound", "critical", "terminal", "political"],
    "historical_basis": "TUN_2011_REVOLUTION"
  },

  # ── BLACK SWANS ───────────────────────────────────────────────────────

  {
    "scenario_id": "SCN-B01",
    "scenario_name": "Presidential Incapacitation",
    "scenario_type": "black_swan",
    "description": "Sudden removal of executive authority — "
                   "succession crisis, power vacuum.",
    "shock_vector": {
      "P1_elite_cohesion": -0.60,
      "P1_mii": +0.55,
      "S1_protest_velocity": +0.20,
      "ARM_posture_shift": -0.40
    },
    "tags": ["black_swan", "political", "succession"]
  },

  {
    "scenario_id": "SCN-B02",
    "scenario_name": "Major Terrorist Attack — Tourism Collapse",
    "scenario_type": "black_swan",
    "description": "High-casualty attack on tourist site. "
                   "Tourism revenue collapse + security state activation.",
    "shock_vector": {
      "S3_terrorism_risk": +0.60,
      "A18_revenue_collapse": +0.40,
      "S3_repression_index": +0.35,
      "E4_fx_reserves_pressure": +0.25
    },
    "tags": ["black_swan", "security", "economic"],
    "historical_basis": "TUN_2015_BARDO_SOUSSE"
  },

  {
    "scenario_id": "SCN-B03",
    "scenario_name": "Libya State Collapse Spillover",
    "scenario_type": "black_swan",
    "description": "Western Libya falls to armed faction. "
                   "Weapons flow + migration surge + border crisis.",
    "shock_vector": {
      "W_war_intensity": +0.55,
      "S3_border_incidents": +0.40,
      "S3_repression_index": +0.25,
      "P3_foreign_pressure": +0.20,
      "migration_pressure": +0.45
    },
    "tags": ["black_swan", "external", "security", "regional"]
  }
]
```

---

## Core Service: `simulation_engine.py`

```python
# backend/app/services/simulation_engine.py

class SimulationEngine:

    async def run(
        self,
        scenario_id: str = None,       # from library
        custom_scenario: dict = None,  # or custom
        base_state_version_id: str = None,  # None = latest live
        mc_iterations: int = 1000,
        time_horizon_days: int = 30,
        time_step_days: int = 7,
        counterfactual_of: str = None  # run_id to compare against
    ) -> dict:
        """
        Full simulation pipeline. Returns run_id immediately,
        executes async, broadcasts on completion.
        """
        run_id = f"sim_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"

        # Create pending record
        await self._create_run_record(run_id, scenario_id, custom_scenario,
                                      base_state_version_id, mc_iterations)

        # Execute async
        asyncio.create_task(
            self._execute(run_id, mc_iterations, time_horizon_days, time_step_days)
        )

        return {"run_id": run_id, "status": "running"}


    async def _execute(
        self,
        run_id: str,
        mc_iterations: int,
        time_horizon_days: int,
        time_step_days: int
    ):
        try:
            run = await self._load_run(run_id)
            base_state = await self._load_base_state(run["base_state_version_id"])

            # Apply shock to base state
            shocked_state = self._apply_shock(base_state, run["shock_vector"])

            # Identify activated chains
            activated_chains = await self._identify_chains(shocked_state)

            # Monte Carlo
            iteration_results = []
            for i in range(mc_iterations):
                result = await self._run_iteration(
                    shocked_state, activated_chains,
                    time_horizon_days, time_step_days,
                    noise_sigma=run["noise_sigma"]
                )
                iteration_results.append(result)

                # Store every 10th
                if i % 10 == 0:
                    await self._store_iteration(run_id, i, result)

            # Aggregate
            aggregated = self._aggregate_results(iteration_results)

            # Sensitivity analysis
            sensitivity = await self._sensitivity_analysis(
                base_state, run["shock_vector"],
                time_horizon_days, time_step_days
            )

            # Historical match
            analogue = await self._match_historical(shocked_state, aggregated)

            # Update run record
            await self._complete_run(run_id, aggregated, sensitivity, analogue)

            # Broadcast
            await broadcast("ti:SIMULATION_COMPLETE", {"run_id": run_id})

        except Exception as e:
            await self._fail_run(run_id, str(e))


    async def _run_iteration(
        self,
        initial_state: dict,
        activated_chains: list,
        time_horizon_days: int,
        time_step_days: int,
        noise_sigma: float
    ) -> dict:
        """
        Single Monte Carlo iteration.
        Advances state forward in time_step_days increments.
        """
        state = self._add_gaussian_noise(initial_state, noise_sigma)
        trajectory = []
        chain_sequence = []

        for day in range(0, time_horizon_days + 1, time_step_days):
            # Propagate each active chain one step
            for chain in activated_chains:
                state = await self._propagate_chain_step(chain, state, day)
                if chain["chain_id"] not in chain_sequence:
                    chain_sequence.append(chain["chain_id"])

            # Check if new chains activate
            new_chains = await self._check_new_activations(state, activated_chains)
            activated_chains.extend(new_chains)

            # Recompute RRI from updated variables
            state = await self._recompute_rri(state)

            # Run deliberation at key thresholds
            if self._deliberation_warranted(state, day):
                session = await deliberation_engine.run(
                    scenario=f"Simulation step day {day}",
                    trigger_type="simulation",
                    state_version_id=state.get("state_version_id"),
                    is_simulation=True
                )
                # Feed deliberation output back into state
                state = self._apply_deliberation(state, session)

            trajectory.append({
                "day": day,
                "rri": state["rri"],
                "p_revolution": state["p_revolution"],
                "state_phase": state["state_phase"],
                "active_chains": [c["chain_id"] for c in activated_chains]
            })

        return {
            "final_rri": state["rri"],
            "final_p_revolution": state["p_revolution"],
            "final_phase": state["state_phase"],
            "trajectory": trajectory,
            "chain_sequence": chain_sequence,
            "elite_fracture": state.get("elite_cohesion", 1.0) < 0.35,
            "military_shifted": state.get("arm_posture") == "neutral",
            "ugtt_strike": state.get("ugtt_strike_probability", 0) > 0.70
        }


    def _apply_shock(self, base_state: dict, shock_vector: dict) -> dict:
        """
        Apply shock_vector deltas to base state variables.
        Clamps all values to valid ranges.
        """
        state = copy.deepcopy(base_state)
        for variable_code, delta in shock_vector.items():
            current = state.get("variables", {}).get(variable_code, 0.5)
            state["variables"][variable_code] = max(0.0, min(1.0, current + delta))
        return state


    async def _propagate_chain_step(
        self,
        chain: dict,
        state: dict,
        current_day: int
    ) -> dict:
        """
        Advance one causal chain by one time step.
        Apply the next node's propagation_weight to relevant variables.
        Respect time_lag_days before applying downstream effects.
        """
        nodes = chain["causal_nodes"]
        for node in nodes:
            if node["time_lag_days"] <= current_day:
                # Apply this node's effect to state
                affected_var = node.get("rri_variable")
                if affected_var:
                    current = state["variables"].get(affected_var, 0.5)
                    delta = node["propagation_weight"] * 0.1  # scaled impact
                    state["variables"][affected_var] = min(1.0, current + delta)
        return state


    async def _sensitivity_analysis(
        self,
        base_state: dict,
        shock_vector: dict,
        time_horizon_days: int,
        time_step_days: int,
        n_samples: int = 100
    ) -> list[dict]:
        """
        One-at-a-time sensitivity analysis.
        For each variable in shock_vector, run N iterations
        with only that variable shocked. Measure impact on final RRI.
        Rank by impact magnitude.
        """
        results = []
        for var, delta in shock_vector.items():
            single_shock = {var: delta}
            shocked = self._apply_shock(base_state, single_shock)
            chains = await self._identify_chains(shocked)

            outcomes = []
            for _ in range(n_samples):
                r = await self._run_iteration(
                    shocked, chains, time_horizon_days, time_step_days, 0.03
                )
                outcomes.append(r["final_rri"])

            base_rri = base_state["rri"]
            mean_rri = sum(outcomes) / len(outcomes)
            results.append({
                "variable": var,
                "delta_applied": delta,
                "mean_rri_impact": mean_rri - base_rri,
                "impact_magnitude": abs(mean_rri - base_rri)
            })

        return sorted(results, key=lambda x: -x["impact_magnitude"])


    def _aggregate_results(self, iterations: list[dict]) -> dict:
        """
        Aggregate MC iteration results into probability distributions.
        """
        n = len(iterations)

        # Phase distribution
        phases = [r["final_phase"] for r in iterations]
        phase_counts = Counter(phases)
        outcome_distribution = {
            phase: count / n
            for phase, count in phase_counts.items()
        }

        # P_revolution distribution
        p_revs = sorted([r["final_p_revolution"] for r in iterations])
        p_revolution_range = {
            "mean": sum(p_revs) / n,
            "p10": p_revs[int(n * 0.10)],
            "p50": p_revs[int(n * 0.50)],
            "p90": p_revs[int(n * 0.90)]
        }

        # RRI trajectory (mean per time step)
        max_steps = max(len(r["trajectory"]) for r in iterations)
        rri_trajectory = []
        for step_idx in range(max_steps):
            step_rris = [
                r["trajectory"][step_idx]["rri"]
                for r in iterations
                if step_idx < len(r["trajectory"])
            ]
            step_rris_sorted = sorted(step_rris)
            rri_trajectory.append({
                "day": iterations[0]["trajectory"][step_idx]["day"],
                "mean": sum(step_rris) / len(step_rris),
                "p10": step_rris_sorted[int(len(step_rris) * 0.10)],
                "p90": step_rris_sorted[int(len(step_rris) * 0.90)]
            })

        # Binary outcomes
        elite_fracture_p = sum(1 for r in iterations if r["elite_fracture"]) / n
        military_shift_p = sum(1 for r in iterations if r["military_shifted"]) / n
        ugtt_strike_p = sum(1 for r in iterations if r["ugtt_strike"]) / n

        return {
            "outcome_distribution": outcome_distribution,
            "p_revolution_range": p_revolution_range,
            "rri_trajectory": rri_trajectory,
            "elite_fracture_probability": elite_fracture_p,
            "military_posture_shift": military_shift_p,
            "ugtt_strike_probability": ugtt_strike_p
        }
```

---

## Simulation Output Schema

```json
{
  "run_id": "sim_20260521_143022",
  "scenario_name": "Full Subsidy Removal — IMF Demand",
  "scenario_type": "policy_decision",
  "base_rri": 2.14,
  "base_p_revolution": 0.31,
  "time_horizon_days": 30,
  "mc_iterations": 1000,

  "outcome_distribution": {
    "stable": 0.08,
    "elevated": 0.22,
    "crisis": 0.38,
    "acute_crisis": 0.24,
    "transition": 0.08
  },

  "p_revolution_range": {
    "mean": 0.52,
    "p10": 0.34,
    "p50": 0.51,
    "p90": 0.71
  },

  "rri_trajectory": [
    { "day": 0,  "mean": 2.14, "p10": 2.01, "p90": 2.28 },
    { "day": 7,  "mean": 2.38, "p10": 2.18, "p90": 2.61 },
    { "day": 14, "mean": 2.61, "p10": 2.31, "p90": 2.95 },
    { "day": 21, "mean": 2.74, "p10": 2.38, "p90": 3.12 },
    { "day": 30, "mean": 2.81, "p10": 2.40, "p90": 3.28 }
  ],

  "governorate_risk_delta": {
    "gafsa": +0.38,
    "kasserine": +0.32,
    "sidi_bouzid": +0.28,
    "tunis": +0.15,
    "sfax": +0.18
  },

  "elite_fracture_probability": 0.34,
  "military_posture_shift": 0.28,
  "ugtt_strike_probability": 0.81,

  "sensitivity_ranking": [
    { "variable": "P3_imf_pressure", "impact_magnitude": 0.78 },
    { "variable": "E2_wheat_stress", "impact_magnitude": 0.65 },
    { "variable": "S4_ugtt_strike_index", "impact_magnitude": 0.61 },
    { "variable": "E4_fx_reserves_days", "impact_magnitude": 0.44 }
  ],

  "activated_chains": ["CHAIN-01", "CHAIN-04", "CHAIN-06", "CHAIN-09"],

  "deliberation_summary": {
    "session_id": "del_20260521_143055",
    "resolution_type": "compromise",
    "dominant_coalition": ["PRES", "INT"],
    "veto_actor": "UGTT",
    "primary_decision": "imf_delay"
  },

  "historical_analogue": "TUN_2023_IMF_NEGOTIATION",
  "analogue_similarity": 0.71,

  "counterfactual_run_id": null,

  "status": "complete",
  "duration_ms": 8400
}
```

---

## Counterfactual Comparison

The engine supports side-by-side simulation of two decisions.

```python
# Analyst runs:
# 1. Base: subsidy removal (SCN-E01)
# 2. Counterfactual: subsidy phasing over 24 months

run_a = await simulation_engine.run(scenario_id="SCN-E01")
run_b = await simulation_engine.run(
    custom_scenario={
        "scenario_name": "Phased Subsidy Removal 24 months",
        "shock_vector": {
            "P3_imf_pressure": +0.20,      # lower than full removal
            "E2_wheat_stress": +0.15,
            "S4_ugtt_strike_index": +0.10  # UGTT partially appeased
        }
    },
    counterfactual_of=run_a["run_id"]
)

# GET /api/simulation/compare?run_a=X&run_b=Y
# Returns delta on all output metrics
```

---

## API Endpoints

```
POST /api/simulation/run
  body: { scenario_id?, custom_scenario?, base_state_version_id?,
          mc_iterations?, time_horizon_days? }
  → returns { run_id, status: "running" } immediately

GET  /api/simulation/runs/:run_id
  → full run record (poll until status: complete)

GET  /api/simulation/runs
  → list recent runs

GET  /api/simulation/scenarios
  → full scenario library

GET  /api/simulation/scenarios/:scenario_id
  → single scenario

GET  /api/simulation/compare?run_a=X&run_b=Y
  → side-by-side comparison of two runs

POST /api/simulation/scenarios
  → save custom scenario to library
```

---

## Frontend: Simulation Panel

```
SimulationChamber.tsx

Layout:
┌─────────────────────────────────────────────────────┐
│  SCENARIO SELECTOR                                   │
│  [dropdown: library scenarios] [custom input]        │
│  [Run Simulation] [Compare with counterfactual]      │
├──────────────────────┬──────────────────────────────┤
│  OUTCOME DISTRIBUTION│  RRI TRAJECTORY               │
│  pie/donut chart     │  line chart (mean + p10/p90) │
│  stable/elevated/    │  30-day forward projection    │
│  crisis/acute/trans  │                               │
├──────────────────────┴──────────────────────────────┤
│  KEY PROBABILITIES                                   │
│  P(Revolution): 0.52  UGTT Strike: 0.81             │
│  Elite Fracture: 0.34  Military Shift: 0.28         │
├─────────────────────────────────────────────────────┤
│  SENSITIVITY RANKING          GOVERNORATE RISK DELTA│
│  1. IMF pressure      0.78    Gafsa:     +38%       │
│  2. Wheat stress      0.65    Kasserine: +32%       │
│  3. UGTT strike       0.61    Tunis:     +15%       │
├─────────────────────────────────────────────────────┤
│  ACTIVATED CHAINS                                   │
│  CHAIN-01 · CHAIN-04 · CHAIN-06 · CHAIN-09         │
├─────────────────────────────────────────────────────┤
│  DELIBERATION SUMMARY                               │
│  Resolution: compromise | UGTT veto active          │
│  Coalition: PRES + INT | Dissent: BCT + DONOR       │
├─────────────────────────────────────────────────────┤
│  HISTORICAL ANALOGUE                                │
│  TUN_2023_IMF_NEGOTIATION  (71% similarity)         │
└─────────────────────────────────────────────────────┘
```

---

## Validation Tests

```
Test 1: SCN-E01 (Subsidy Removal)
  Expected after 30 days, 1000 iterations:
  - P(crisis or above) > 0.55
  - UGTT strike probability > 0.75
  - CHAIN-06 activated
  - Gafsa + Kasserine highest risk delta

Test 2: SCN-B03 (Libya Collapse)
  Expected:
  - W(t) war distraction → domestic salience drops
  - Migration pressure delta > 0.40
  - Security crisis classification
  - ARM authority weight dominant in deliberation

Test 3: SCN-C01 (Perfect Storm)
  Expected:
  - P(acute_crisis or transition) > 0.40
  - All 4 core chains activated
  - P_revolution p90 > 0.70
  - Historical analogue: TUN_2011

Test 4: Counterfactual comparison
  Run SCN-E01 vs phased removal version
  Expected: phased version shows P(crisis) at least 0.15 lower
  Deliberation: UGTT strike probability drops below 0.50 in phased version
```

---

## Implementation Order

```
1. Migration 006_simulation.sql                         → 30 min
2. simulation_engine.py — full service                  → 5 hrs
3. Seed scenario library (13 scenarios)                 → 1 hr
4. API endpoints                                        → 1 hr
5. SimulationChamber.tsx — frontend panel               → 3 hrs
6. Wire ti:SIMULATION_COMPLETE WebSocket broadcast      → 30 min
7. Run 4 validation tests                               → 2 hrs
```

Total: ~2 days.

---

## What Phase 7 Unlocks

After this phase the system can:

- **Answer "what happens next"** with probability distributions,
  not single predictions
- **Test policy decisions before they are made** — subsidy removal
  vs phasing vs delay
- **Identify leverage points** — sensitivity analysis shows which
  variable matters most
- **Auto-simulate on chain activation** — every CHAIN-01 breach
  triggers both deliberation (Phase 6) and a 30-day simulation
- **Compare scenarios side by side** — counterfactual engine
  makes trade-offs visible
- **Ground simulations in history** — analogue matching connects
  every run to a documented Tunisian precedent

Phase 8 (High Table UI) wraps this in the circular deliberation
interface — the dark strategic room with actors around the map.

---

*Simulation Chamber v1.0 — 2026-05-21*
