"""
Seed 12 core causal chains from TunisiaIntel_Ontology_v1.md
Each chain encodes how a signal propagates through Tunisia's specific
institutional and social fabric.

All chains derived from RRI equations (EQ.1–EQ.24).
All require historical validation before promotion to status: active.
"""

from __future__ import annotations

from typing import Any, Dict, List

CHAINS: List[Dict[str, Any]] = [
    # ── CHAIN-01: Bread Price Cascade ──────────────────────────────────
    {
        "chain_id": "bread_price_cascade",
        "chain_name": "Bread Price Cascade",
        "domain": "economic→social",
        "trigger_category": "economic",
        "activation_threshold": 0.65,
        "activation_variable": "E2_wheat_stress",
        "causal_nodes": [
            {"step": 1, "concept": "Wheat import cost spike", "rri_variable": "E2_wheat_stress", "entity_ids": ["BCT", "TUN"], "propagation_weight": 0.85, "time_lag_days": 2, "amplifiers": ["FX weakness"], "suppressors": ["subsidy buffer"]},
            {"step": 2, "concept": "Bread subsidy fiscal pressure", "rri_variable": "A03", "entity_ids": ["TUN", "DONOR"], "propagation_weight": 0.80, "time_lag_days": 5, "amplifiers": [], "suppressors": []},
            {"step": 3, "concept": "Bakery shortage signals", "rri_variable": "E51", "entity_ids": [], "propagation_weight": 0.75, "time_lag_days": 3, "amplifiers": ["Facebook groups", "WhatsApp chains"], "suppressors": []},
            {"step": 4, "concept": "Public anger activation", "rri_variable": "salience", "entity_ids": [], "propagation_weight": 0.70, "time_lag_days": 7, "amplifiers": [], "suppressors": []},
            {"step": 5, "concept": "Queue protests at distribution points", "rri_variable": "E51", "entity_ids": ["LPR", "YOUTH"], "propagation_weight": 0.65, "time_lag_days": 4, "amplifiers": [], "suppressors": []},
            {"step": 6, "concept": "UGTT narrative amplification", "rri_variable": "S4_ugtt_strike_index", "entity_ids": ["UGTT"], "propagation_weight": 0.60, "time_lag_days": 10, "amplifiers": ["UGTT adoption +0.35"], "suppressors": ["UGTT neutrality -0.30"]},
            {"step": 7, "concept": "Governorate spread: interior first", "rri_variable": "cascade_probability", "entity_ids": [], "propagation_weight": 0.55, "time_lag_days": 5, "amplifiers": [], "suppressors": []},
            {"step": 8, "concept": "Elite anxiety: BCT reserves pressure", "rri_variable": "E4_fx_reserves_days", "entity_ids": ["BCT", "DONOR"], "propagation_weight": 0.50, "time_lag_days": 14, "amplifiers": [], "suppressors": []},
        ],
        "local_amplifiers": [
            {"factor": "Ramadan timing", "boost": 0.35},
            {"factor": "Summer heat", "boost": 0.20},
            {"factor": "Election proximity", "boost": 0.25},
        ],
        "local_suppressors": [
            {"factor": "W(t) war distraction", "reduction": -0.22},
            {"factor": "UGTT neutrality", "reduction": -0.30},
        ],
        "regional_sensitivity": {"Kasserine": 0.92, "Gafsa": 0.88, "Sidi Bouzid": 0.85, "Tunis": 0.45},
        "doctrine_refs": [
            {"source": "Economic crisis contagion theory", "concept": "food price → unrest linkage"},
            {"source": "Le Bon crowd behavior", "concept": "queue → protest escalation"},
        ],
        "validated_events": [
            {"year": 2011, "event": "Pre-revolution bread shortages", "match": 0.0},
            {"year": 2023, "event": "Flour shortage episodes", "match": 0.0},
        ],
        "validation_score": None,
        "status": "draft",
        "confidence": 0.75,
    },
    # ── CHAIN-02: Phosphate Disruption Cascade ─────────────────────────
    {
        "chain_id": "phosphate_disruption",
        "chain_name": "Phosphate Disruption Cascade",
        "domain": "economic→political→security",
        "trigger_category": "economic",
        "activation_threshold": 0.60,
        "activation_variable": "S4_phosphate_strike",
        "causal_nodes": [
            {"step": 1, "concept": "CPG production disruption", "rri_variable": "S4_phosphate_strike", "entity_ids": ["CPG"], "propagation_weight": 0.90, "time_lag_days": 1, "amplifiers": ["Strike blockade"], "suppressors": []},
            {"step": 2, "concept": "Export revenue drop", "rri_variable": "A03", "entity_ids": ["TUN"], "propagation_weight": 0.75, "time_lag_days": 7, "amplifiers": ["Phosphate = 8% GDP"], "suppressors": []},
            {"step": 3, "concept": "FX reserve pressure", "rri_variable": "E4_fx_reserves_days", "entity_ids": ["BCT"], "propagation_weight": 0.70, "time_lag_days": 3, "amplifiers": [], "suppressors": []},
            {"step": 4, "concept": "Gafsa regional grievance amplification", "rri_variable": "compound_stress", "entity_ids": [], "propagation_weight": 0.85, "time_lag_days": 2, "amplifiers": ["Historical grievance memory +0.45"], "suppressors": []},
            {"step": 5, "concept": "Interior Ministry deployment signal", "rri_variable": "w_t", "entity_ids": ["INT"], "propagation_weight": 0.80, "time_lag_days": 5, "amplifiers": [], "suppressors": []},
            {"step": 6, "concept": "National UGTT solidarity signal", "rri_variable": "S4_ugtt_strike_index", "entity_ids": ["UGTT"], "propagation_weight": 0.65, "time_lag_days": 10, "amplifiers": [], "suppressors": []},
            {"step": 7, "concept": "International media coverage", "rri_variable": "info_amplification", "entity_ids": ["MEDIA", "LTDH"], "propagation_weight": 0.60, "time_lag_days": 14, "amplifiers": [], "suppressors": []},
            {"step": 8, "concept": "Investment chill", "rri_variable": "structural_econ", "entity_ids": ["DONOR"], "propagation_weight": 0.55, "time_lag_days": 7, "amplifiers": [], "suppressors": []},
        ],
        "local_amplifiers": [
            {"factor": "Gafsa historical grievance memory", "boost": 0.45},
            {"factor": "Unemployment >30% local", "boost": 0.40},
        ],
        "local_suppressors": [
            {"factor": "CPG employment dependency", "reduction": -0.25},
        ],
        "regional_sensitivity": {"Gafsa": 0.98, "Metlaoui": 0.95, "Redeyef": 0.93},
        "doctrine_refs": [
            {"source": "Bueno de Mesquita selectorate", "concept": "resource revenue → regime stability"},
        ],
        "validated_events": [
            {"year": 2008, "event": "Gafsa mining basin uprising", "match": 0.0},
        ],
        "validation_score": None,
        "status": "draft",
        "confidence": 0.80,
    },
    # ── CHAIN-03: Elite Defection Cascade ─────────────────────────────
    {
        "chain_id": "elite_defection",
        "chain_name": "Elite Defection Cascade",
        "domain": "political",
        "trigger_category": "political",
        "activation_threshold": 0.70,
        "activation_variable": "P1_mii",
        "causal_nodes": [
            {"step": 1, "concept": "Cabinet reshuffle signal (MII spike)", "rri_variable": "P1_mii", "entity_ids": ["PRES"], "propagation_weight": 0.90, "time_lag_days": 1, "amplifiers": [], "suppressors": []},
            {"step": 2, "concept": "Elite loyalty recalculation", "rri_variable": "elite_defection_prob", "entity_ids": [], "propagation_weight": 0.75, "time_lag_days": 3, "amplifiers": ["EQ.7 utility function"], "suppressors": []},
            {"step": 3, "concept": "Business elite hedging", "rri_variable": "structural_econ", "entity_ids": ["UTICA", "INFORMAL"], "propagation_weight": 0.70, "time_lag_days": 5, "amplifiers": [], "suppressors": []},
            {"step": 4, "concept": "Military posture signal", "rri_variable": "elite_cohesion_dynamics", "entity_ids": ["ARM"], "propagation_weight": 0.85, "time_lag_days": 2, "amplifiers": [], "suppressors": []},
            {"step": 5, "concept": "Opposition coalition formation", "rri_variable": "oci", "entity_ids": ["ENN", "PPL"], "propagation_weight": 0.65, "time_lag_days": 7, "amplifiers": [], "suppressors": []},
            {"step": 6, "concept": "Foreign power repositioning", "rri_variable": "w_t", "entity_ids": ["FRA", "EU", "DZA"], "propagation_weight": 0.80, "time_lag_days": 4, "amplifiers": [], "suppressors": []},
            {"step": 7, "concept": "Cascade defection chain", "rri_variable": "elite_defection_prob", "entity_ids": [], "propagation_weight": 0.90, "time_lag_days": 1, "amplifiers": ["Each defection +0.15 to next (EQ.7 λ)"], "suppressors": []},
        ],
        "local_amplifiers": [],
        "local_suppressors": [
            {"factor": "Concentrated presidential power", "reduction": -0.30},
        ],
        "regional_sensitivity": {"Tunis": 0.95, "Sfax": 0.75},
        "doctrine_refs": [
            {"source": "Bueno de Mesquita selectorate", "concept": "elite defection cascade"},
            {"source": "Schelling", "concept": "tipping point dynamics"},
        ],
        "validated_events": [
            {"year": 2011, "event": "Ben Ali defection sequence", "match": 0.0},
            {"year": 2013, "event": "Ennahda negotiated exit", "match": 0.0},
            {"year": 2021, "event": "Presidential self-coup elite splits", "match": 0.0},
        ],
        "validation_score": None,
        "status": "draft",
        "confidence": 0.85,
    },
    # ── CHAIN-04: FX Reserve Depletion → Social Contract Breach ───────
    {
        "chain_id": "fx_depletion",
        "chain_name": "FX Reserve Depletion → Social Contract Breach",
        "domain": "economic→social",
        "trigger_category": "economic",
        "activation_threshold": 45,
        "activation_variable": "E4_fx_reserves_days",
        "causal_nodes": [
            {"step": 1, "concept": "FX reserves drop below 45 days", "rri_variable": "E4_fx_reserves_days", "entity_ids": ["BCT"], "propagation_weight": 0.85, "time_lag_days": 3, "amplifiers": [], "suppressors": []},
            {"step": 2, "concept": "BCT rate defense → depreciation signal", "rri_variable": "A01", "entity_ids": ["BCT", "INFORMAL"], "propagation_weight": 0.80, "time_lag_days": 5, "amplifiers": [], "suppressors": []},
            {"step": 3, "concept": "Import cost transmission", "rri_variable": "E2_wheat_stress", "entity_ids": [], "propagation_weight": 0.90, "time_lag_days": 7, "amplifiers": ["Fuel", "food", "medicine"], "suppressors": []},
            {"step": 4, "concept": "Parallel market premium spike", "rri_variable": "A01", "entity_ids": ["INFORMAL"], "propagation_weight": 0.75, "time_lag_days": 10, "amplifiers": ["BMI activation"], "suppressors": []},
            {"step": 5, "concept": "Subsidy fiscal unsustainability signal", "rri_variable": "structural_econ", "entity_ids": ["TUN", "DONOR"], "propagation_weight": 0.70, "time_lag_days": 14, "amplifiers": [], "suppressors": []},
            {"step": 6, "concept": "IMF conditionality pressure", "rri_variable": "P3_imf_pressure", "entity_ids": ["DONOR", "BCT"], "propagation_weight": 0.65, "time_lag_days": 7, "amplifiers": [], "suppressors": []},
            {"step": 7, "concept": "Social contract breach probability", "rri_variable": "compound_stress", "entity_ids": [], "propagation_weight": 0.85, "time_lag_days": 5, "amplifiers": [], "suppressors": []},
            {"step": 8, "concept": "Protest activation: interior governorates", "rri_variable": "cascade_probability", "entity_ids": ["LPR", "YOUTH"], "propagation_weight": 0.75, "time_lag_days": 10, "amplifiers": [], "suppressors": []},
        ],
        "local_amplifiers": [
            {"factor": "Diaspora remittance drop", "boost": 0.20},
            {"factor": "Tourism seasonality", "boost": 0.15},
        ],
        "local_suppressors": [],
        "regional_sensitivity": {"Kasserine": 0.85, "Sidi Bouzid": 0.82, "Gafsa": 0.80, "Tunis": 0.50},
        "doctrine_refs": [
            {"source": "Economic crisis contagion theory", "concept": "FX → social contract breach"},
        ],
        "validated_events": [
            {"year": 2023, "event": "BCT reserve stress", "match": 0.0},
            {"year": 2024, "event": "IMF negotiation cycles", "match": 0.0},
        ],
        "validation_score": None,
        "status": "draft",
        "confidence": 0.75,
    },
    # ── CHAIN-05: Narrative Warfare → Protest Mobilization ────────────
    {
        "chain_id": "narrative_mobilization",
        "chain_name": "Narrative Warfare → Protest Mobilization",
        "domain": "narrative→social",
        "trigger_category": "narrative",
        "activation_threshold": 0.70,
        "activation_variable": "narrative_convergence",
        "causal_nodes": [
            {"step": 1, "concept": "Single dominant narrative frame emerges", "rri_variable": "narrative_convergence", "entity_ids": ["MEDIA"], "propagation_weight": 0.80, "time_lag_days": 1, "amplifiers": ["Anti-IMF or anti-elite frame"], "suppressors": []},
            {"step": 2, "concept": "Cross-platform amplification", "rri_variable": "info_amplification", "entity_ids": ["MEDIA", "TNI"], "propagation_weight": 0.75, "time_lag_days": 2, "amplifiers": ["Facebook dominant in TUN"], "suppressors": []},
            {"step": 3, "concept": "UGTT narrative adoption", "rri_variable": "salience_effective", "entity_ids": ["UGTT"], "propagation_weight": 0.85, "time_lag_days": 1, "amplifiers": ["+0.35 if UGTT adopts"], "suppressors": []},
            {"step": 4, "concept": "A(t) info amplification factor spikes", "rri_variable": "info_amplification", "entity_ids": [], "propagation_weight": 0.70, "time_lag_days": 3, "amplifiers": ["EQ.19 activation"], "suppressors": []},
            {"step": 5, "concept": "SIR transmission rate β increases", "rri_variable": "sir_infected", "entity_ids": [], "propagation_weight": 0.65, "time_lag_days": 5, "amplifiers": ["+0.20 β"], "suppressors": []},
            {"step": 6, "concept": "Interior Ministry surveillance escalation", "rri_variable": "w_t", "entity_ids": ["INT"], "propagation_weight": 0.60, "time_lag_days": 3, "amplifiers": [], "suppressors": []},
            {"step": 7, "concept": "International media pickup", "rri_variable": "salience", "entity_ids": ["MEDIA", "LTDH"], "propagation_weight": 0.55, "time_lag_days": 7, "amplifiers": [], "suppressors": []},
        ],
        "local_amplifiers": [
            {"factor": "Friday prayer amplification", "boost": 0.30},
            {"factor": "Diaspora signal boost", "boost": 0.20},
        ],
        "local_suppressors": [
            {"factor": "W(t) war distraction active", "reduction": -0.25},
            {"factor": "Presidential speech narrative reset", "reduction": -0.35},
        ],
        "regional_sensitivity": {"Tunis": 0.90, "Sfax": 0.75, "Kasserine": 0.60},
        "doctrine_refs": [
            {"source": "Arquilla & Ronfeldt", "concept": "information environment amplification"},
            {"source": "Le Bon", "concept": "crowd psychology via narrative"},
        ],
        "validated_events": [
            {"year": 2011, "event": "Social media role in revolution", "match": 0.0},
            {"year": 2021, "event": "Constitutional crisis framing", "match": 0.0},
        ],
        "validation_score": None,
        "status": "draft",
        "confidence": 0.78,
    },
    # ── CHAIN-06: UGTT General Strike → Systemic Paralysis ────────────
    {
        "chain_id": "ugtt_strike",
        "chain_name": "UGTT General Strike → Systemic Paralysis",
        "domain": "social→economic→political",
        "trigger_category": "social",
        "activation_threshold": 0.75,
        "activation_variable": "S4_ugtt_strike_index",
        "causal_nodes": [
            {"step": 1, "concept": "UGTT strike escalation threshold crossed", "rri_variable": "S4_ugtt_strike_index", "entity_ids": ["UGTT"], "propagation_weight": 0.95, "time_lag_days": 1, "amplifiers": [], "suppressors": []},
            {"step": 2, "concept": "Transport paralysis", "rri_variable": "w_t", "entity_ids": ["STEG", "SNCFT"], "propagation_weight": 0.85, "time_lag_days": 1, "amplifiers": ["Logistics nodes hit"], "suppressors": []},
            {"step": 3, "concept": "Public sector shutdown cascade", "rri_variable": "E51", "entity_ids": [], "propagation_weight": 0.80, "time_lag_days": 2, "amplifiers": [], "suppressors": []},
            {"step": 4, "concept": "Business elite pressure on presidency", "rri_variable": "elite_cohesion_dynamics", "entity_ids": ["UTICA"], "propagation_weight": 0.70, "time_lag_days": 3, "amplifiers": [], "suppressors": []},
            {"step": 5, "concept": "Presidency decision: negotiation or repression", "rri_variable": "P1_mii", "entity_ids": ["PRES"], "propagation_weight": 0.75, "time_lag_days": 2, "amplifiers": [], "suppressors": []},
            {"step": 6, "concept": "International creditor concern", "rri_variable": "P3_imf_pressure", "entity_ids": ["DONOR"], "propagation_weight": 0.65, "time_lag_days": 5, "amplifiers": [], "suppressors": []},
            {"step": 7, "concept": "Opposition coordination with strike narrative", "rri_variable": "oci", "entity_ids": ["ENN", "PPL"], "propagation_weight": 0.60, "time_lag_days": 7, "amplifiers": [], "suppressors": []},
        ],
        "local_amplifiers": [],
        "local_suppressors": [
            {"factor": "UGTT prefers negotiation over rupture", "reduction": -0.30},
        ],
        "regional_sensitivity": {"Tunis": 0.90, "Sfax": 0.75, "Gafsa": 0.70},
        "doctrine_refs": [
            {"source": "Olson collective action", "concept": "union mobilization logic"},
        ],
        "validated_events": [
            {"year": 2012, "event": "UGTT general strike", "match": 0.0},
            {"year": 2013, "event": "UGTT national dialogue mediation", "match": 0.0},
        ],
        "validation_score": None,
        "status": "draft",
        "confidence": 0.82,
    },
    # ── CHAIN-07: Security Repression → Radicalization Feedback ───────
    {
        "chain_id": "repression_feedback",
        "chain_name": "Security Repression → Radicalization Feedback",
        "domain": "security→social→long-term",
        "trigger_category": "security",
        "activation_threshold": 0.65,
        "activation_variable": "S3_repression_index",
        "causal_nodes": [
            {"step": 1, "concept": "Security crackdown intensity crosses threshold", "rri_variable": "S3_repression_index", "entity_ids": ["INT"], "propagation_weight": 0.75, "time_lag_days": 5, "amplifiers": [], "suppressors": []},
            {"step": 2, "concept": "Civil society narrative: legitimacy erosion", "rri_variable": "salience", "entity_ids": ["LTDH", "FTDES", "AWAT"], "propagation_weight": 0.70, "time_lag_days": 7, "amplifiers": [], "suppressors": []},
            {"step": 3, "concept": "EU/international rights org condemnation", "rri_variable": "info_amplification", "entity_ids": ["FRA", "EU"], "propagation_weight": 0.65, "time_lag_days": 14, "amplifiers": [], "suppressors": []},
            {"step": 4, "concept": "Underground network formation", "rri_variable": "cpi_index", "entity_ids": [], "propagation_weight": 0.80, "time_lag_days": 10, "amplifiers": ["Removed from visible signal"], "suppressors": []},
            {"step": 5, "concept": "Youth radicalization flux increase", "rri_variable": "acceleration", "entity_ids": ["YOUTH"], "propagation_weight": 0.60, "time_lag_days": 30, "amplifiers": [], "suppressors": []},
            {"step": 6, "concept": "Sleeper network activation probability", "rri_variable": "cascade_probability", "entity_ids": [], "propagation_weight": 0.55, "time_lag_days": 60, "amplifiers": ["Prison overcrowding"], "suppressors": []},
        ],
        "local_amplifiers": [
            {"factor": "Prison radicalization vector", "boost": 0.25},
        ],
        "local_suppressors": [],
        "regional_sensitivity": {"Tunis": 0.70, "Kasserine": 0.60, "Sidi Bouzid": 0.55},
        "doctrine_refs": [
            {"source": "Sherman Kent", "concept": "suppression illusion — invisible risk grows"},
        ],
        "validated_events": [
            {"year": 2013, "event": "Ansar al-Sharia suppression cycle", "match": 0.0},
            {"year": 2021, "event": "Post-coup arrest wave", "match": 0.0},
        ],
        "validation_score": None,
        "status": "draft",
        "confidence": 0.70,
    },
    # ── CHAIN-08: Water Scarcity → Regional Conflict ──────────────────
    {
        "chain_id": "water_scarcity",
        "chain_name": "Water Scarcity → Regional Conflict",
        "domain": "environmental→social→security",
        "trigger_category": "environmental",
        "activation_threshold": 0.70,
        "activation_variable": "B1_water_stress",
        "causal_nodes": [
            {"step": 1, "concept": "Aquifer depletion / drought signal crosses threshold", "rri_variable": "B1_water_stress", "entity_ids": ["SONEDE"], "propagation_weight": 0.85, "time_lag_days": 7, "amplifiers": [], "suppressors": []},
            {"step": 2, "concept": "Agricultural yield collapse", "rri_variable": "structural_econ", "entity_ids": [], "propagation_weight": 0.80, "time_lag_days": 14, "amplifiers": ["ASIL cascade"], "suppressors": []},
            {"step": 3, "concept": "Rural livelihood stress → urban migration signal", "rri_variable": "E51", "entity_ids": ["YOUTH"], "propagation_weight": 0.75, "time_lag_days": 10, "amplifiers": [], "suppressors": []},
            {"step": 4, "concept": "Regional inter-community water conflict", "rri_variable": "compound_stress", "entity_ids": [], "propagation_weight": 0.70, "time_lag_days": 5, "amplifiers": [], "suppressors": []},
            {"step": 5, "concept": "Infrastructure failure: STEG cooling water", "rri_variable": "w_t", "entity_ids": ["STEG"], "propagation_weight": 0.65, "time_lag_days": 20, "amplifiers": [], "suppressors": []},
            {"step": 6, "concept": "Food price pressure", "rri_variable": "E2_wheat_stress", "entity_ids": [], "propagation_weight": 0.60, "time_lag_days": 30, "amplifiers": [], "suppressors": []},
            {"step": 7, "concept": "Security deployment to water nodes", "rri_variable": "cascade_probability", "entity_ids": ["INT", "ARM"], "propagation_weight": 0.55, "time_lag_days": 14, "amplifiers": [], "suppressors": []},
        ],
        "local_amplifiers": [
            {"factor": "July–August heat + Ramadan overlap", "boost": 0.50},
        ],
        "local_suppressors": [],
        "regional_sensitivity": {"Sidi Bouzid": 0.93, "Kairouan": 0.90, "Kasserine": 0.87, "Sfax": 0.75},
        "doctrine_refs": [
            {"source": "Environmental security theory", "concept": "water stress → conflict"},
        ],
        "validated_events": [
            {"year": 2011, "event": "Recurring Sfax water crisis", "match": 0.0},
            {"year": 2023, "event": "Sidi Bouzid water protests", "match": 0.0},
        ],
        "validation_score": None,
        "status": "draft",
        "confidence": 0.73,
    },
    # ── CHAIN-09: IMF Conditionality → Subsidy Removal → Crisis ──────
    {
        "chain_id": "imf_subsidy",
        "chain_name": "IMF Conditionality → Subsidy Removal → Crisis",
        "domain": "external→economic→social",
        "trigger_category": "external",
        "activation_threshold": 0.70,
        "activation_variable": "P3_imf_pressure",
        "causal_nodes": [
            {"step": 1, "concept": "IMF program conditionality: subsidy removal demanded", "rri_variable": "P3_imf_pressure", "entity_ids": ["DONOR"], "propagation_weight": 0.80, "time_lag_days": 14, "amplifiers": [], "suppressors": []},
            {"step": 2, "concept": "Narrative frame shift: anti-IMF frame activation", "rri_variable": "narrative_convergence", "entity_ids": ["MEDIA", "UGTT"], "propagation_weight": 0.85, "time_lag_days": 1, "amplifiers": [], "suppressors": []},
            {"step": 3, "concept": "UGTT opposition signal", "rri_variable": "S4_ugtt_strike_index", "entity_ids": ["UGTT"], "propagation_weight": 0.75, "time_lag_days": 7, "amplifiers": [], "suppressors": []},
            {"step": 4, "concept": "Interior Ministry: unrest probability assessment", "rri_variable": "w_t", "entity_ids": ["INT"], "propagation_weight": 0.70, "time_lag_days": 3, "amplifiers": [], "suppressors": []},
            {"step": 5, "concept": "Military: escalation risk assessment", "rri_variable": "elite_cohesion_dynamics", "entity_ids": ["ARM"], "propagation_weight": 0.65, "time_lag_days": 5, "amplifiers": [], "suppressors": []},
            {"step": 6, "concept": "Presidency decision: delay + distraction", "rri_variable": "P1_mii", "entity_ids": ["PRES"], "propagation_weight": 0.90, "time_lag_days": 2, "amplifiers": [], "suppressors": []},
            {"step": 7, "concept": "IMF program suspension risk", "rri_variable": "structural_econ", "entity_ids": ["DONOR", "BCT"], "propagation_weight": 0.60, "time_lag_days": 30, "amplifiers": [], "suppressors": []},
            {"step": 8, "concept": "Sovereign credit downgrade signal", "rri_variable": "E4_fx_reserves_days", "entity_ids": [], "propagation_weight": 0.75, "time_lag_days": 60, "amplifiers": [], "suppressors": []},
        ],
        "local_amplifiers": [
            {"factor": "Historical delay pattern", "boost": 0.30},
        ],
        "local_suppressors": [],
        "regional_sensitivity": {"Tunis": 0.85, "Sfax": 0.60},
        "doctrine_refs": [
            {"source": "Economic crisis contagion theory", "concept": "austerity → unrest cycle"},
        ],
        "validated_events": [
            {"year": 2019, "event": "IMF negotiation stall", "match": 0.0},
            {"year": 2021, "event": "IMF program suspension", "match": 0.0},
            {"year": 2023, "event": "Subsidy adjustment signals", "match": 0.0},
        ],
        "validation_score": None,
        "status": "draft",
        "confidence": 0.78,
    },
    # ── CHAIN-10: Regional External Shock → Tunisia Contagion ─────────
    {
        "chain_id": "external_shock",
        "chain_name": "Regional External Shock → Tunisia Contagion",
        "domain": "external→economic+narrative",
        "trigger_category": "external",
        "activation_threshold": 0.65,
        "activation_variable": "w_t",
        "causal_nodes": [
            {"step": 1, "concept": "Regional conflict or shock intensifies", "rri_variable": "w_t", "entity_ids": ["LBY", "DZA"], "propagation_weight": 0.80, "time_lag_days": 1, "amplifiers": [], "suppressors": []},
            {"step": 2, "concept": "W(t) war distraction: domestic salience suppressed", "rri_variable": "salience", "entity_ids": [], "propagation_weight": 0.75, "time_lag_days": 3, "amplifiers": [], "suppressors": ["EQ.8 activation"]},
            {"step": 3, "concept": "Migration pressure", "rri_variable": "compound_stress", "entity_ids": ["INT", "TUN"], "propagation_weight": 0.70, "time_lag_days": 7, "amplifiers": [], "suppressors": []},
            {"step": 4, "concept": "Security deployment: southern border + coast", "rri_variable": "w_t", "entity_ids": ["ARM", "INT"], "propagation_weight": 0.65, "time_lag_days": 5, "amplifiers": [], "suppressors": []},
            {"step": 5, "concept": "Tourism revenue risk", "rri_variable": "structural_econ", "entity_ids": [], "propagation_weight": 0.60, "time_lag_days": 14, "amplifiers": ["Perception effect"], "suppressors": []},
            {"step": 6, "concept": "EU leverage increase: migration card", "rri_variable": "P3_imf_pressure", "entity_ids": ["EU", "ITA"], "propagation_weight": 0.55, "time_lag_days": 10, "amplifiers": [], "suppressors": []},
            {"step": 7, "concept": "Energy supply risk", "rri_variable": "A01", "entity_ids": ["STEG", "DZA"], "propagation_weight": 0.50, "time_lag_days": 30, "amplifiers": [], "suppressors": []},
        ],
        "local_amplifiers": [],
        "local_suppressors": [],
        "regional_sensitivity": {"Tunis": 0.85, "Gabes": 0.80, "Medenine": 0.78},
        "doctrine_refs": [
            {"source": "Contagion theory", "concept": "regional instability spillover"},
        ],
        "validated_events": [
            {"year": 2011, "event": "Libya spillover", "match": 0.0},
            {"year": 2023, "event": "Gaza salience effect", "match": 0.0},
        ],
        "validation_score": None,
        "status": "draft",
        "confidence": 0.72,
    },
    # ── CHAIN-11: Legitimacy Collapse → Regime Transition Threshold ───
    {
        "chain_id": "legitimacy_collapse",
        "chain_name": "Legitimacy Collapse → Regime Transition",
        "domain": "political—terminal",
        "trigger_category": "political",
        "activation_threshold": 2.8,
        "activation_variable": "rri",
        "causal_nodes": [
            {"step": 1, "concept": "Triple threshold breach: RRI critical + P_rev elevated + Elite cohesion collapsed", "rri_variable": "rri", "entity_ids": [], "propagation_weight": 0.95, "time_lag_days": 1, "amplifiers": [], "suppressors": []},
            {"step": 2, "concept": "Military posture shift: neutrality declaration", "rri_variable": "elite_cohesion_dynamics", "entity_ids": ["ARM"], "propagation_weight": 0.90, "time_lag_days": 1, "amplifiers": [], "suppressors": []},
            {"step": 3, "concept": "Business elite capital flight acceleration", "rri_variable": "structural_econ", "entity_ids": ["UTICA", "INFORMAL"], "propagation_weight": 0.85, "time_lag_days": 2, "amplifiers": [], "suppressors": []},
            {"step": 4, "concept": "Foreign powers: repositioning signals", "rri_variable": "w_t", "entity_ids": ["FRA", "EU", "USA", "DZA"], "propagation_weight": 0.80, "time_lag_days": 3, "amplifiers": [], "suppressors": []},
            {"step": 5, "concept": "Opposition unified front formation", "rri_variable": "oci", "entity_ids": ["ENN", "PPL", "UGTT"], "propagation_weight": 0.95, "time_lag_days": 1, "amplifiers": [], "suppressors": []},
            {"step": 6, "concept": "Cascade defection: irreversible once military neutral", "rri_variable": "elite_defection_prob", "entity_ids": [], "propagation_weight": 0.95, "time_lag_days": 0, "amplifiers": ["Irreversible cascade"], "suppressors": []},
        ],
        "local_amplifiers": [],
        "local_suppressors": [
            {"factor": "Suppression probability drops below 0.30", "reduction": 0.0},
        ],
        "regional_sensitivity": {"Tunis": 1.0, "Sfax": 0.90, "All": 0.85},
        "doctrine_refs": [
            {"source": "Bueno de Mesquita selectorate", "concept": "terminal defection cascade"},
            {"source": "Schelling", "concept": "tipping point — irreversible once military neutral"},
        ],
        "validated_events": [
            {"year": 2011, "event": "Ben Ali exit sequence", "match": 0.0},
        ],
        "validation_score": None,
        "status": "draft",
        "confidence": 0.90,
    },
    # ── CHAIN-12: Brain Drain → Long-term State Fragility ────────────
    {
        "chain_id": "brain_drain",
        "chain_name": "Brain Drain → Long-term State Fragility",
        "domain": "social→economic—slow",
        "trigger_category": "social",
        "activation_threshold": 0.60,
        "activation_variable": "A16_brain_drain_rate",
        "causal_nodes": [
            {"step": 1, "concept": "Professional emigration rate sustained above threshold", "rri_variable": "A16_brain_drain_rate", "entity_ids": ["YOUTH"], "propagation_weight": 0.70, "time_lag_days": 90, "amplifiers": [], "suppressors": []},
            {"step": 2, "concept": "Medical sector capacity erosion", "rri_variable": "structural_econ", "entity_ids": [], "propagation_weight": 0.65, "time_lag_days": 180, "amplifiers": [], "suppressors": []},
            {"step": 3, "concept": "Engineering/technical sector hollowing", "rri_variable": "acceleration", "entity_ids": [], "propagation_weight": 0.75, "time_lag_days": 60, "amplifiers": [], "suppressors": []},
            {"step": 4, "concept": "SME management capacity decline", "rri_variable": "structural_econ", "entity_ids": ["UTICA"], "propagation_weight": 0.60, "time_lag_days": 365, "amplifiers": [], "suppressors": []},
            {"step": 5, "concept": "Tax base erosion", "rri_variable": "cpi_index", "entity_ids": [], "propagation_weight": 0.55, "time_lag_days": 180, "amplifiers": ["Formal sector shrinks"], "suppressors": []},
            {"step": 6, "concept": "Institutional memory loss", "rri_variable": "elite_cohesion_dynamics", "entity_ids": [], "propagation_weight": 0.50, "time_lag_days": 365, "amplifiers": [], "suppressors": []},
            {"step": 7, "concept": "Diaspora remittance increase (partial offset)", "rri_variable": "structural_econ", "entity_ids": ["DIASPORA"], "propagation_weight": 0.65, "time_lag_days": 90, "amplifiers": [], "suppressors": ["Finite offset"]},
        ],
        "local_amplifiers": [],
        "local_suppressors": [],
        "regional_sensitivity": {"Tunis": 0.85, "Sfax": 0.70, "Nabeul": 0.65},
        "doctrine_refs": [
            {"source": "State fragility theory", "concept": "brain drain → institutional decay"},
        ],
        "validated_events": [
            {"year": 2015, "event": "Continuous emigration acceleration", "match": 0.0},
        ],
        "validation_score": None,
        "status": "draft",
        "confidence": 0.65,
    },
]

# ── Trigger Thresholds ──────────────────────────────────────────────

TRIGGER_THRESHOLDS: List[Dict[str, Any]] = [
    # Bread Price Cascade
    {"variable_code": "E2_wheat_stress", "threshold_name": "latent", "threshold_value": 0.40, "chain_ids": ["bread_price_cascade"], "historical_basis": "Normal import cost variation"},
    {"variable_code": "E2_wheat_stress", "threshold_name": "active", "threshold_value": 0.65, "chain_ids": ["bread_price_cascade"], "historical_basis": "2011 pre-revolution, 2023 flour shortage"},
    {"variable_code": "E2_wheat_stress", "threshold_name": "critical", "threshold_value": 0.80, "chain_ids": ["bread_price_cascade"], "historical_basis": "Queue protests observed"},

    # Phosphate Disruption
    {"variable_code": "S4_phosphate_strike", "threshold_name": "latent", "threshold_value": 0.30, "chain_ids": ["phosphate_disruption"], "historical_basis": "Routine labor negotiations"},
    {"variable_code": "S4_phosphate_strike", "threshold_name": "active", "threshold_value": 0.60, "chain_ids": ["phosphate_disruption"], "historical_basis": "2008 Gafsa uprising"},

    # Elite Defection
    {"variable_code": "P1_mii", "threshold_name": "latent", "threshold_value": 0.40, "chain_ids": ["elite_defection"], "historical_basis": "Routine reshuffle"},
    {"variable_code": "P1_mii", "threshold_name": "active", "threshold_value": 0.70, "chain_ids": ["elite_defection"], "historical_basis": "2011 Ben Ali defections"},
    {"variable_code": "P1_mii", "threshold_name": "critical", "threshold_value": 0.85, "chain_ids": ["elite_defection"], "historical_basis": "Irreversible cascade"},

    # FX Depletion
    {"variable_code": "E4_fx_reserves_days", "threshold_name": "latent", "threshold_value": 60, "chain_ids": ["fx_depletion"], "historical_basis": "Standard BCT target"},
    {"variable_code": "E4_fx_reserves_days", "threshold_name": "active", "threshold_value": 45, "chain_ids": ["fx_depletion"], "historical_basis": "2023–2024 reserve stress"},
    {"variable_code": "E4_fx_reserves_days", "threshold_name": "critical", "threshold_value": 30, "chain_ids": ["fx_depletion"], "historical_basis": "Acute crisis — BCT loses room"},

    # Narrative Mobilization
    {"variable_code": "narrative_convergence", "threshold_name": "active", "threshold_value": 0.70, "chain_ids": ["narrative_mobilization"], "historical_basis": "2011 social media role"},

    # UGTT Strike
    {"variable_code": "S4_ugtt_strike_index", "threshold_name": "active", "threshold_value": 0.75, "chain_ids": ["ugtt_strike"], "historical_basis": "2012, 2013 general strikes"},

    # Repression Feedback
    {"variable_code": "S3_repression_index", "threshold_name": "active", "threshold_value": 0.65, "chain_ids": ["repression_feedback"], "historical_basis": "Post-2021 arrests"},

    # Water Scarcity
    {"variable_code": "B1_water_stress", "threshold_name": "latent", "threshold_value": 0.50, "chain_ids": ["water_scarcity"], "historical_basis": "Seasonal variation"},
    {"variable_code": "B1_water_stress", "threshold_name": "active", "threshold_value": 0.70, "chain_ids": ["water_scarcity"], "historical_basis": "Sfax, Sidi Bouzid water crises"},

    # IMF Pressure
    {"variable_code": "P3_imf_pressure", "threshold_name": "active", "threshold_value": 0.70, "chain_ids": ["imf_subsidy"], "historical_basis": "2023 IFM negotiations"},
    {"variable_code": "P3_imf_pressure", "threshold_name": "critical", "threshold_value": 0.85, "chain_ids": ["imf_subsidy"], "historical_basis": "Subsidy removal imminent"},

    # External Shock
    {"variable_code": "w_t", "threshold_name": "active", "threshold_value": 0.65, "chain_ids": ["external_shock"], "historical_basis": "Libya spillover"},

    # Legitimacy Collapse
    {"variable_code": "rri", "threshold_name": "critical", "threshold_value": 2.50, "chain_ids": ["legitimacy_collapse"], "historical_basis": "Elevated risk"},
    {"variable_code": "rri", "threshold_name": "terminal", "threshold_value": 2.80, "chain_ids": ["legitimacy_collapse"], "historical_basis": "2011 exit trajectory"},
    {"variable_code": "p_rev", "threshold_name": "terminal", "threshold_value": 0.45, "chain_ids": ["legitimacy_collapse"], "historical_basis": "2011 exit trajectory"},
    {"variable_code": "elite_cohesion_dynamics", "threshold_name": "terminal", "threshold_value": 0.35, "chain_ids": ["legitimacy_collapse"], "historical_basis": "2011 exit trajectory"},

    # Brain Drain
    {"variable_code": "A16_brain_drain_rate", "threshold_name": "active", "threshold_value": 0.60, "chain_ids": ["brain_drain"], "historical_basis": "2015–2026 continuous acceleration"},
]
