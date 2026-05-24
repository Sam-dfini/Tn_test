# Phase 4 — Actor Cognition Profiles
## Build Spec — TunisiaIntel High Table Layer

**Version:** 1.0  
**Date:** 2026-05-21  
**Depends on:** Phase 1 (canonical state), Phase 2 (ontology), Phase 3 (RAG)

---

## Architecture Decision

Actor cognition profiles live in a **separate table** from `graph_entities`.

- `graph_entities` = graph node (lean, for D3 rendering, network traversal)
- `actor_profiles` = cognition schema (heavy, for deliberation engine, simulation)
- Linked by `entity_id` foreign key
- Versioned independently — profile can be updated without touching the graph

---

## Migration: `004_actor_cognition.sql`

```sql
CREATE TABLE actor_profiles (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Link to knowledge graph
  entity_id             TEXT NOT NULL UNIQUE,  -- matches graph_entities.id (e.g. "PRES", "UGTT")
  actor_name            TEXT NOT NULL,
  actor_class           TEXT NOT NULL,  -- "national"|"security"|"economic"|"civil"|"foreign"

  -- ── OBJECTIVES ────────────────────────────────────────────────────────
  -- [{ "goal": "maintain stability", "weight": 0.95, "time_horizon": "short" }]
  objectives            JSONB NOT NULL DEFAULT '[]',

  -- ── FEAR MATRIX ───────────────────────────────────────────────────────
  -- [{ "fear": "mass unrest", "threshold": 0.65, "reaction": "repression|concession|speech" }]
  fears                 JSONB NOT NULL DEFAULT '[]',

  -- ── DECISION STYLE ────────────────────────────────────────────────────
  decision_style        TEXT NOT NULL,  -- "centralized"|"consensus"|"factional"|"reactive"|"technocratic"
  risk_tolerance        NUMERIC(4,3),   -- 0.0–1.0
  time_horizon          TEXT,           -- "short"|"medium"|"long"
  doctrine              TEXT,           -- core institutional survival principle

  -- ── ACTION REPERTOIRE ─────────────────────────────────────────────────
  -- ["repression", "speech", "reshuffle", "negotiation", ...]
  preferred_tools       JSONB NOT NULL DEFAULT '[]',

  -- ── INPUT SENSITIVITY MAP ─────────────────────────────────────────────
  -- Maps RRI signals to how much this actor cares about them (0–1)
  -- { "unrest": 0.95, "elite_cohesion": 0.90, "imf_pressure": 0.80, ... }
  input_sensitivity     JSONB NOT NULL DEFAULT '{}',

  -- ── OUTPUT PROBABILITY MATRIX ─────────────────────────────────────────
  -- Base probabilities for each action (updated by state_update_rules)
  -- { "repression": 0.65, "concessions": 0.25, "speeches": 0.55, ... }
  output_probability_matrix JSONB NOT NULL DEFAULT '{}',

  -- ── STATE UPDATE RULES (CRITICAL) ─────────────────────────────────────
  -- How output probabilities shift when input signals change
  -- [{ "if_signal": "unrest", "operator": ">", "threshold": 0.75,
  --    "then_action": "repression", "delta": +0.20,
  --    "and_action": "concessions", "and_delta": -0.15 }]
  state_update_rules    JSONB NOT NULL DEFAULT '[]',

  -- ── HISTORICAL PATTERNS ───────────────────────────────────────────────
  -- Encoded past behavior references for validation
  -- [{ "event": "2011_revolution", "behavior": "fled", "phase": "terminal",
  --    "rri_at_event": 2.9, "trigger": "military_neutrality" }]
  historical_patterns   JSONB NOT NULL DEFAULT '[]',

  -- ── AUTHORITY WEIGHTS (CONTEXT-SENSITIVE) ─────────────────────────────
  -- How much weight this actor carries in deliberation by crisis type
  -- { "economic_crisis": 0.45, "security_crisis": 0.30,
  --   "labor_crisis": 0.20, "legitimacy_crisis": 0.80 }
  authority_weights     JSONB NOT NULL DEFAULT '{}',

  -- ── COALITION AFFINITIES ──────────────────────────────────────────────
  -- Which actors this one naturally aligns with under pressure
  -- [{ "entity_id": "INT", "affinity": 0.85, "condition": "security_crisis" }]
  coalition_affinities  JSONB NOT NULL DEFAULT '[]',

  -- ── VETO CONDITIONS ───────────────────────────────────────────────────
  -- Conditions under which this actor can block a decision
  -- [{ "condition": "ugtt_strike_index > 0.75", "blocks": "subsidy_removal" }]
  veto_conditions       JSONB NOT NULL DEFAULT '[]',

  -- ── VALIDATION ────────────────────────────────────────────────────────
  validation_score      NUMERIC(4,3),   -- 0–1, backtested against historical events
  validated_events      JSONB DEFAULT '[]',
  last_validated_at     TIMESTAMPTZ,

  -- ── CURRENT LIVE STATE (updated from snapshot) ────────────────────────
  current_stress        NUMERIC(4,3),   -- 0–1, pulled from national_state_snapshots
  current_posture       TEXT,           -- "passive"|"defensive"|"aggressive"|"negotiating"|"collapsing"
  posture_updated_at    TIMESTAMPTZ,

  -- ── METADATA ──────────────────────────────────────────────────────────
  version               INTEGER DEFAULT 1,
  status                TEXT DEFAULT 'draft',  -- "draft"|"validated"|"active"
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ap_entity ON actor_profiles(entity_id);
CREATE INDEX idx_ap_class ON actor_profiles(actor_class);
CREATE INDEX idx_ap_status ON actor_profiles(status);
```

---

## The 11 Core Actor Profiles

### PROFILE-01: Presidency (PRES)
```json
{
  "entity_id": "PRES",
  "actor_name": "Presidency / Executive Authority",
  "actor_class": "national",
  "doctrine": "regime_survival_through_concentration",
  "decision_style": "centralized",
  "risk_tolerance": 0.72,
  "time_horizon": "short",

  "objectives": [
    { "goal": "maintain executive control", "weight": 0.98, "time_horizon": "short" },
    { "goal": "prevent elite fracture", "weight": 0.90, "time_horizon": "short" },
    { "goal": "secure international legitimacy", "weight": 0.75, "time_horizon": "medium" },
    { "goal": "manage IMF relationship", "weight": 0.70, "time_horizon": "medium" },
    { "goal": "neutralize organized opposition", "weight": 0.85, "time_horizon": "short" }
  ],

  "fears": [
    { "fear": "military_neutrality", "threshold": 0.60, "reaction": "immediate_concession_or_flight" },
    { "fear": "mass_unrest_sustained", "threshold": 0.75, "reaction": "repression_then_negotiation" },
    { "fear": "elite_defection_cascade", "threshold": 0.50, "reaction": "preemptive_reshuffle" },
    { "fear": "foreign_isolation", "threshold": 0.65, "reaction": "diplomatic_speech" },
    { "fear": "economic_collapse", "threshold": 0.80, "reaction": "delay_blame_shift" }
  ],

  "preferred_tools": [
    "legal_decrees", "media_narrative_reset", "security_pressure",
    "symbolic_speeches", "reshuffles", "internet_throttling",
    "targeted_arrests", "foreign_diplomacy"
  ],

  "input_sensitivity": {
    "unrest": 0.95,
    "elite_cohesion": 0.92,
    "military_posture": 0.98,
    "imf_pressure": 0.80,
    "foreign_pressure": 0.75,
    "narrative_convergence": 0.70,
    "ugtt_strike_index": 0.65,
    "p_revolution": 0.99
  },

  "output_probability_matrix": {
    "repression": 0.65,
    "concessions": 0.20,
    "distraction_narrative": 0.55,
    "reshuffle": 0.35,
    "speech": 0.60,
    "arrest_opposition": 0.40,
    "internet_throttling": 0.30,
    "imf_delay": 0.75,
    "foreign_outreach": 0.45
  },

  "state_update_rules": [
    { "if_signal": "military_posture", "operator": "<", "threshold": 0.40,
      "then_action": "concessions", "delta": 0.40,
      "and_action": "repression", "and_delta": -0.35 },
    { "if_signal": "unrest", "operator": ">", "threshold": 0.75,
      "then_action": "repression", "delta": 0.20,
      "and_action": "speech", "and_delta": 0.15 },
    { "if_signal": "elite_cohesion", "operator": "<", "threshold": 0.40,
      "then_action": "reshuffle", "delta": 0.30 },
    { "if_signal": "p_revolution", "operator": ">", "threshold": 0.60,
      "then_action": "imf_delay", "delta": 0.20,
      "and_action": "distraction_narrative", "and_delta": 0.25 }
  ],

  "authority_weights": {
    "economic_crisis": 0.70,
    "security_crisis": 0.90,
    "labor_crisis": 0.60,
    "legitimacy_crisis": 0.85,
    "foreign_pressure": 0.80
  },

  "historical_patterns": [
    { "event": "2021_self_coup", "behavior": "concentrated_power", "rri_estimate": 1.8,
      "trigger": "parliamentary_deadlock + public_frustration" },
    { "event": "2023_imf_negotiation", "behavior": "delayed_reforms", "pattern": "promise_then_defer" },
    { "event": "2024_arrests", "behavior": "targeted_opposition_arrest", "trigger": "narrative_threat" }
  ],

  "veto_conditions": []
}
```

---

### PROFILE-02: UGTT (Labor Confederation)
```json
{
  "entity_id": "UGTT",
  "actor_name": "UGTT — Union Générale Tunisienne du Travail",
  "actor_class": "civil",
  "doctrine": "class_interest_with_national_legitimacy_role",
  "decision_style": "consensus",
  "risk_tolerance": 0.45,
  "time_horizon": "medium",

  "objectives": [
    { "goal": "protect wage levels against inflation", "weight": 0.95, "time_horizon": "short" },
    { "goal": "block subsidy removal", "weight": 0.90, "time_horizon": "short" },
    { "goal": "maintain institutional legitimacy", "weight": 0.85, "time_horizon": "medium" },
    { "goal": "negotiate from strength not rupture", "weight": 0.80, "time_horizon": "medium" },
    { "goal": "prevent regime from bypassing labor law", "weight": 0.75, "time_horizon": "medium" }
  ],

  "fears": [
    { "fear": "loss_of_negotiating_relevance", "threshold": 0.50, "reaction": "escalate_to_general_strike" },
    { "fear": "wage_erosion_above_15pct_real", "threshold": 0.60, "reaction": "sector_strikes_then_national" },
    { "fear": "legal_dissolution_threat", "threshold": 0.70, "reaction": "international_solidarity_activation" },
    { "fear": "internal_factional_split", "threshold": 0.55, "reaction": "leadership_consolidation" }
  ],

  "preferred_tools": [
    "sector_strikes", "general_strike_threat", "negotiation",
    "public_statements", "international_labor_solidarity",
    "civil_society_coalition", "press_conferences"
  ],

  "input_sensitivity": {
    "inflation_rate": 0.95,
    "real_wage_index": 0.90,
    "repression_index": 0.75,
    "subsidy_removal_signal": 0.98,
    "public_anger": 0.70,
    "imf_conditionality": 0.85,
    "unemployment_rate": 0.80
  },

  "output_probability_matrix": {
    "negotiation": 0.70,
    "sector_strike": 0.45,
    "general_strike": 0.20,
    "public_statement": 0.80,
    "neutrality": 0.35,
    "coalition_with_opposition": 0.30,
    "international_appeal": 0.40
  },

  "state_update_rules": [
    { "if_signal": "subsidy_removal_signal", "operator": ">", "threshold": 0.70,
      "then_action": "general_strike", "delta": 0.55,
      "and_action": "negotiation", "and_delta": -0.20 },
    { "if_signal": "inflation_rate", "operator": ">", "threshold": 0.12,
      "then_action": "sector_strike", "delta": 0.30 },
    { "if_signal": "repression_index", "operator": ">", "threshold": 0.70,
      "then_action": "international_appeal", "delta": 0.35,
      "and_action": "general_strike", "and_delta": 0.20 }
  ],

  "authority_weights": {
    "economic_crisis": 0.85,
    "security_crisis": 0.25,
    "labor_crisis": 0.98,
    "legitimacy_crisis": 0.60,
    "foreign_pressure": 0.30
  },

  "veto_conditions": [
    { "condition": "ugtt_strike_index > 0.75", "blocks": "subsidy_removal",
      "historical_basis": "Every subsidy removal attempt 2011-2024 required UGTT consent" }
  ],

  "historical_patterns": [
    { "event": "2013_national_dialogue", "behavior": "mediated_crisis", "role": "kingmaker" },
    { "event": "2012_general_strike", "behavior": "escalated_then_negotiated" },
    { "event": "2022_wage_negotiations", "behavior": "accepted_partial_deal_under_fiscal_pressure" }
  ]
}
```

---

### PROFILE-03: Military (ARM)
```json
{
  "entity_id": "ARM",
  "actor_name": "Tunisian Armed Forces",
  "actor_class": "security",
  "doctrine": "institutional_preservation_through_neutrality",
  "decision_style": "centralized",
  "risk_tolerance": 0.25,
  "time_horizon": "long",

  "objectives": [
    { "goal": "preserve institutional integrity", "weight": 0.98, "time_horizon": "long" },
    { "goal": "avoid direct political entanglement", "weight": 0.90, "time_horizon": "long" },
    { "goal": "maintain foreign military partnerships", "weight": 0.80, "time_horizon": "medium" },
    { "goal": "protect border security", "weight": 0.85, "time_horizon": "short" },
    { "goal": "prevent civil war scenario", "weight": 0.95, "time_horizon": "short" }
  ],

  "fears": [
    { "fear": "ordered_to_fire_on_civilians", "threshold": 0.50,
      "reaction": "neutrality_declaration" },
    { "fear": "institutional_fragmentation", "threshold": 0.40,
      "reaction": "internal_consolidation" },
    { "fear": "foreign_military_aid_suspension", "threshold": 0.60,
      "reaction": "diplomatic_signal_to_west" },
    { "fear": "regime_collapse_creating_vacuum", "threshold": 0.65,
      "reaction": "transitional_stabilization_role" }
  ],

  "preferred_tools": [
    "neutrality_declaration", "silent_pressure_on_presidency",
    "border_deployment", "transitional_stabilization",
    "foreign_partnership_signaling"
  ],

  "input_sensitivity": {
    "p_revolution": 0.95,
    "elite_cohesion": 0.85,
    "civilian_casualty_risk": 0.99,
    "foreign_pressure": 0.70,
    "institutional_legitimacy": 0.90,
    "unrest": 0.80
  },

  "output_probability_matrix": {
    "neutrality": 0.75,
    "regime_support": 0.50,
    "silent_pressure": 0.40,
    "transitional_role": 0.15,
    "intervention": 0.05,
    "border_deployment": 0.60
  },

  "state_update_rules": [
    { "if_signal": "p_revolution", "operator": ">", "threshold": 0.55,
      "then_action": "neutrality", "delta": 0.30,
      "and_action": "regime_support", "and_delta": -0.35 },
    { "if_signal": "civilian_casualty_risk", "operator": ">", "threshold": 0.60,
      "then_action": "neutrality", "delta": 0.45 },
    { "if_signal": "elite_cohesion", "operator": "<", "threshold": 0.30,
      "then_action": "transitional_role", "delta": 0.40 }
  ],

  "authority_weights": {
    "economic_crisis": 0.20,
    "security_crisis": 0.90,
    "labor_crisis": 0.15,
    "legitimacy_crisis": 0.95,
    "foreign_pressure": 0.60
  },

  "veto_conditions": [
    { "condition": "civilian_casualty_order = true",
      "blocks": "any_action",
      "historical_basis": "2011 — military refused Ben Ali order to fire on protesters" }
  ],

  "historical_patterns": [
    { "event": "2011_revolution", "behavior": "refused_to_fire_on_protesters",
      "effect": "regime_collapse_accelerated", "rri_at_event": 2.85 },
    { "event": "2021_self_coup", "behavior": "supported_presidential_power_grab",
      "condition": "framed_as_constitutional_not_military" }
  ]
}
```

---

### PROFILE-04: Interior Ministry (INT)
```json
{
  "entity_id": "INT",
  "actor_name": "Ministry of Interior / Security Apparatus",
  "actor_class": "security",
  "doctrine": "order_maintenance_through_coercion",
  "decision_style": "centralized",
  "risk_tolerance": 0.60,
  "time_horizon": "short",

  "objectives": [
    { "goal": "suppress protest before it spreads", "weight": 0.95, "time_horizon": "short" },
    { "goal": "protect strategic infrastructure", "weight": 0.85, "time_horizon": "short" },
    { "goal": "monitor opposition networks", "weight": 0.90, "time_horizon": "medium" },
    { "goal": "manage border and migration flows", "weight": 0.75, "time_horizon": "medium" }
  ],

  "fears": [
    { "fear": "protest_exceeding_containment_capacity", "threshold": 0.70,
      "reaction": "request_military_support" },
    { "fear": "international_scrutiny_of_methods", "threshold": 0.60,
      "reaction": "reduce_visible_violence" },
    { "fear": "budget_cut_reducing_capacity", "threshold": 0.50,
      "reaction": "loyalty_signal_to_presidency" }
  ],

  "preferred_tools": [
    "mass_arrests", "tear_gas_water_cannon", "surveillance_expansion",
    "targeted_opposition_arrests", "border_control",
    "internet_monitoring", "informant_networks"
  ],

  "input_sensitivity": {
    "protest_intensity": 0.98,
    "regional_spread": 0.90,
    "foreign_scrutiny": 0.65,
    "budget_constraints": 0.55,
    "presidential_directive": 0.99
  },

  "output_probability_matrix": {
    "crackdown": 0.75,
    "targeted_arrests": 0.65,
    "surveillance_expansion": 0.80,
    "border_tightening": 0.60,
    "reduced_visibility": 0.30
  },

  "state_update_rules": [
    { "if_signal": "protest_intensity", "operator": ">", "threshold": 0.80,
      "then_action": "crackdown", "delta": 0.20 },
    { "if_signal": "foreign_scrutiny", "operator": ">", "threshold": 0.75,
      "then_action": "reduced_visibility", "delta": 0.35,
      "and_action": "crackdown", "and_delta": -0.25 }
  ],

  "authority_weights": {
    "economic_crisis": 0.20,
    "security_crisis": 0.95,
    "labor_crisis": 0.60,
    "legitimacy_crisis": 0.70,
    "foreign_pressure": 0.40
  },

  "veto_conditions": [],

  "historical_patterns": [
    { "event": "2011_revolution", "behavior": "escalating_crackdown_then_collapse",
      "lesson": "repression_beyond_capacity_accelerates_defection" },
    { "event": "2021_2024_arrests", "behavior": "targeted_political_opposition",
      "pattern": "selective_not_mass_repression" }
  ]
}
```

---

### PROFILE-05: Central Bank (BCT)
```json
{
  "entity_id": "BCT",
  "actor_name": "Banque Centrale de Tunisie",
  "actor_class": "economic",
  "doctrine": "monetary_stability_under_political_constraint",
  "decision_style": "technocratic",
  "risk_tolerance": 0.20,
  "time_horizon": "medium",

  "objectives": [
    { "goal": "maintain FX reserves above 90 days import cover", "weight": 0.95 },
    { "goal": "control inflation below 8%", "weight": 0.85 },
    { "goal": "preserve currency stability", "weight": 0.90 },
    { "goal": "maintain IMF program credibility", "weight": 0.80 },
    { "goal": "resist political interference in monetary policy", "weight": 0.70 }
  ],

  "fears": [
    { "fear": "fx_reserves_below_30_days", "threshold": 0.30,
      "reaction": "emergency_imf_contact + rate_hike" },
    { "fear": "currency_speculative_attack", "threshold": 0.55,
      "reaction": "capital_controls_signal" },
    { "fear": "political_pressure_to_print", "threshold": 0.60,
      "reaction": "technical_resistance + imf_signal" }
  ],

  "preferred_tools": [
    "interest_rate_adjustment", "fx_intervention",
    "liquidity_controls", "public_statements",
    "imf_technical_communication", "reserve_management"
  ],

  "input_sensitivity": {
    "fx_reserves_days": 0.99,
    "inflation_rate": 0.95,
    "imf_pressure": 0.85,
    "political_pressure": 0.70,
    "parallel_fx_premium": 0.90,
    "subsidy_fiscal_cost": 0.80
  },

  "output_probability_matrix": {
    "rate_hike": 0.50,
    "fx_intervention": 0.60,
    "public_statement": 0.70,
    "imf_consultation": 0.65,
    "capital_controls": 0.20,
    "technical_resistance": 0.55
  },

  "state_update_rules": [
    { "if_signal": "fx_reserves_days", "operator": "<", "threshold": 45,
      "then_action": "imf_consultation", "delta": 0.30,
      "and_action": "fx_intervention", "delta": 0.25 },
    { "if_signal": "parallel_fx_premium", "operator": ">", "threshold": 0.25,
      "then_action": "public_statement", "delta": 0.20 },
    { "if_signal": "inflation_rate", "operator": ">", "threshold": 0.10,
      "then_action": "rate_hike", "delta": 0.30 }
  ],

  "authority_weights": {
    "economic_crisis": 0.95,
    "security_crisis": 0.10,
    "labor_crisis": 0.50,
    "legitimacy_crisis": 0.30,
    "foreign_pressure": 0.75
  },

  "veto_conditions": [],

  "historical_patterns": [
    { "event": "2023_imf_negotiations", "behavior": "technical_compliance_with_political_delays" },
    { "event": "2024_reserve_stress", "behavior": "fx_rationing_informal" }
  ]
}
```

---

### PROFILE-06: Opposition (LPR + civil coalition)
```json
{
  "entity_id": "LPR",
  "actor_name": "Organized Opposition / Civil Coalition",
  "actor_class": "civil",
  "doctrine": "power_acquisition_through_mobilization_or_negotiation",
  "decision_style": "factional",
  "risk_tolerance": 0.55,
  "time_horizon": "medium",

  "objectives": [
    { "goal": "restore democratic institutions", "weight": 0.90 },
    { "goal": "build protest coalition with UGTT", "weight": 0.80 },
    { "goal": "attract foreign support", "weight": 0.70 },
    { "goal": "avoid violent confrontation", "weight": 0.75 },
    { "goal": "expose regime legitimacy failures", "weight": 0.85 }
  ],

  "fears": [
    { "fear": "mass_arrest_of_leadership", "threshold": 0.60, "reaction": "go_underground_or_exile" },
    { "fear": "internal_factional_split", "threshold": 0.50, "reaction": "unity_declaration" },
    { "fear": "public_apathy", "threshold": 0.65, "reaction": "narrative_escalation" }
  ],

  "input_sensitivity": {
    "repression_index": 0.85,
    "public_anger": 0.90,
    "ugtt_posture": 0.80,
    "foreign_support": 0.70,
    "narrative_frame": 0.75
  },

  "output_probability_matrix": {
    "street_mobilization": 0.50,
    "negotiation": 0.35,
    "boycott": 0.40,
    "foreign_appeal": 0.55,
    "coalition_building": 0.65,
    "media_campaign": 0.70
  },

  "state_update_rules": [
    { "if_signal": "public_anger", "operator": ">", "threshold": 0.75,
      "then_action": "street_mobilization", "delta": 0.30 },
    { "if_signal": "repression_index", "operator": ">", "threshold": 0.70,
      "then_action": "foreign_appeal", "delta": 0.35,
      "and_action": "street_mobilization", "and_delta": -0.20 }
  ],

  "authority_weights": {
    "economic_crisis": 0.30,
    "security_crisis": 0.20,
    "labor_crisis": 0.40,
    "legitimacy_crisis": 0.80,
    "foreign_pressure": 0.50
  },

  "veto_conditions": [],

  "historical_patterns": [
    { "event": "2013_national_dialogue", "behavior": "negotiated_under_ugtt_mediation" },
    { "event": "2021_coup", "behavior": "fragmented_response_no_unified_resistance" }
  ]
}
```

---

### PROFILE-07: EU / Western Powers
```json
{
  "entity_id": "EU",
  "actor_name": "European Union / Western Powers",
  "actor_class": "foreign",
  "doctrine": "stability_migration_control_over_democracy_promotion",
  "decision_style": "consensus",
  "risk_tolerance": 0.30,
  "time_horizon": "medium",

  "objectives": [
    { "goal": "prevent migration surge to Europe", "weight": 0.98 },
    { "goal": "maintain IMF program on track", "weight": 0.85 },
    { "goal": "preserve nominal democratic norms", "weight": 0.60 },
    { "goal": "counter Chinese and Russian influence", "weight": 0.70 },
    { "goal": "secure energy corridor stability", "weight": 0.80 }
  ],

  "fears": [
    { "fear": "regime_collapse_migration_wave", "threshold": 0.65,
      "reaction": "emergency_aid_package" },
    { "fear": "tunisia_pivot_to_china_russia", "threshold": 0.55,
      "reaction": "increased_engagement_offers" }
  ],

  "input_sensitivity": {
    "migration_pressure": 0.99,
    "regime_stability": 0.85,
    "imf_program_status": 0.80,
    "human_rights_violations": 0.55,
    "chinese_influence": 0.70
  },

  "output_probability_matrix": {
    "aid_conditionality": 0.65,
    "diplomatic_statement": 0.75,
    "migration_deal": 0.80,
    "sanctions": 0.10,
    "emergency_support": 0.50
  },

  "state_update_rules": [
    { "if_signal": "migration_pressure", "operator": ">", "threshold": 0.75,
      "then_action": "emergency_support", "delta": 0.40,
      "and_action": "sanctions", "and_delta": -0.10 },
    { "if_signal": "regime_stability", "operator": "<", "threshold": 0.30,
      "then_action": "aid_conditionality", "delta": 0.30 }
  ],

  "authority_weights": {
    "economic_crisis": 0.70,
    "security_crisis": 0.50,
    "labor_crisis": 0.20,
    "legitimacy_crisis": 0.55,
    "foreign_pressure": 0.90
  },

  "veto_conditions": [],

  "historical_patterns": [
    { "event": "2023_migration_deal", "behavior": "prioritized_migration_control_over_rights" },
    { "event": "2021_coup", "behavior": "mild_condemnation_then_continued_engagement" }
  ]
}
```

---

### PROFILES 08–11: Condensed Specs

Build these with the same schema. Key parameters:

**PROFILE-08: Algeria (DZA)**
- Doctrine: `strategic_depth_through_tunisia_stability`
- Key fear: Islamist spillover + NATO encirclement
- Primary tools: energy leverage (gas transit), quiet diplomacy, border security cooperation
- Veto: none formal, but energy dependency gives informal leverage
- Historical pattern: 2011 — supported Ben Ali, then rapidly recognized new government

**PROFILE-09: Business Elites (UTICA)**
- Doctrine: `profit_preservation_through_political_hedging`
- Key fear: capital controls, contract uncertainty, nationalization signal
- Primary tools: lobbying presidency, capital movement, public statements
- State update rule: if `policy_uncertainty > 0.70` → capital_flight probability +0.35
- Historical pattern: 2011 — hedged early, switched sides at military neutrality signal

**PROFILE-10: IMF / International Creditors (DONOR)**
- Doctrine: `fiscal_discipline_as_condition_for_support`
- Key fear: program suspension due to political instability
- Primary tools: conditionality, disbursement gating, technical missions, public statements
- State update rule: if `reform_implementation < 0.40` → disbursement_suspension +0.50
- Historical pattern: 2023–2024 — suspended disbursements pending reform progress

**PROFILE-11: Population Blocs (PPL)**
- Doctrine: `survival_and_dignity`
- Decision style: `reactive` (no central coordination)
- Key fears: bread price spike, unemployment, humiliation
- Primary tools: street protest, apathy, emigration, informal economy
- State update rule: if `bread_price_spike > 0.65` AND `narrative_frame = anti_imf` → protest_probability +0.45
- Historical pattern: 2010–2011 — Mohamed Bouazizi self-immolation as activation event

---

## Service: `actor_engine.py`

```python
# backend/app/services/actor_engine.py

async def get_actor_posture(entity_id: str, snapshot: dict) -> dict:
    """
    Given a state snapshot, compute current posture and
    adjusted output probabilities for one actor.
    
    1. Load actor profile from Supabase
    2. Extract relevant signals from snapshot
    3. Apply state_update_rules sequentially
    4. Return adjusted probability matrix + posture label
    """

async def get_all_postures(snapshot: dict) -> list[dict]:
    """
    Run get_actor_posture() for all active profiles.
    Called after every snapshot write.
    Results stored back in snapshot.actor_postures.
    """

async def backtest_actor(entity_id: str, historical_event: str) -> dict:
    """
    Reconstruct historical state at event time.
    Run actor through state_update_rules.
    Compare output to documented historical behavior.
    Return validation_score (cosine similarity).
    """
```

---

## API Endpoints

```
GET  /api/actors                          → all active profiles (lean)
GET  /api/actors/:entity_id               → full profile with current posture
GET  /api/actors/:entity_id/posture       → current posture only (for UI)
POST /api/actors/:entity_id/backtest      → run historical validation
GET  /api/actors/postures/current         → all postures from latest snapshot
```

---

## Validation Protocol

Before any profile reaches `status: active`:

```
1. Reconstruct state snapshot for 2011 revolution (January 14 week)
2. Run all profiles through state_update_rules
3. Check:
   - PRES: repression high, then flight signal when military neutral → ✓
   - ARM: neutrality declared when civilian_casualty_risk > 0.60 → ✓
   - UGTT: coalition with opposition when unrest > 0.80 → ✓
   - BCT: IMF consultation when reserves stressed → ✓
   - EU: continued engagement despite rights concerns → ✓
4. Validation score per profile must exceed 0.70
5. Document mismatches → adjust weights → re-run
```

---

## Implementation Order

```
1. Migration 004_actor_cognition.sql                    → 30 min
2. actor_engine.py service                              → 2 hrs
3. Seed 11 profiles (Python seed file)                  → 2 hrs
4. Wire get_all_postures() into snapshot write cycle    → 1 hr
5. API endpoints                                        → 1 hr
6. Backtest validation: 2011 event                      → 2 hrs (analyst + engineer)
7. Promote validated profiles to status: active         → 30 min
```

Total: ~1.5 days.

---

## What This Enables

Once actor postures are live in every snapshot:

- **High Table UI:** each member shows live stress + current posture
- **Intelligence Briefs:** "UGTT is in defensive posture — subsidy signal likely to trigger strike escalation"
- **Deliberation Engine (Phase 6):** actors have dynamic probability matrices to submit positions from
- **Simulation Chamber (Phase 7):** inject a shock → watch postures shift in real time

---

*Actor Cognition Profiles v1.0 — 2026-05-21*
