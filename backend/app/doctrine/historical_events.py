"""
Historical Events for Tunisia History Workspace.

Each event is a structured document matching the Phase 5 spec,
designed for ingestion into AnythingLLM's tunisia-history workspace.

Enables:
- Historical similarity queries (EQ.20 HPS)
- Chain validation (Phase 2 ontology)
- Actor backtest reconstruction (Phase 4)
- Simulation grounding (Phase 7)
"""

from __future__ import annotations

from typing import Any, Dict, List

HISTORICAL_EVENTS: List[Dict[str, Any]] = [
    # ── EVENT-01: Gafsa Mining Basin Uprising 2008 ────────────────────
    {
        "event_id": "TUN_2008_GAFSA",
        "title": "Gafsa Mining Basin Uprising 2008",
        "date_start": "2008-01-05",
        "date_end": "2008-06-15",
        "trigger": "CPG hiring process corruption + chronic unemployment",
        "actors_involved": ["CPG", "UGTT", "INT", "PPL", "YOUTH"],
        "governorates": ["gafsa", "metlaoui", "redeyef"],
        "rri_estimate": 1.9,
        "p_rev_estimate": 0.35,
        "escalation_sequence": [
            "hiring_corruption_revealed",
            "local_protest_gafsa",
            "security_crackdown",
            "ugtt_local_support",
            "general_strike_gafsa",
            "military_containment",
            "negotiated_end",
        ],
        "outcome": "contained_with_force",
        "lessons": [
            "gafsa_grievance_permanent_not_resolved",
            "ugtt_split_local_vs_national_leadership",
            "security_force_containment_below_national_threshold",
            "interior_governorate_ignition_pattern_established",
        ],
        "chains_activated": ["phosphate_disruption", "repression_feedback"],
        "doctrine_parallels": ["olson_collective_action", "selectorate_local_elite"],
        "intel_significance": "First major post-2000 outbreak. Established the interior-vs-coast grievance pattern that prefigured 2011. Showed security forces could contain without military intervention.",
    },
    # ── EVENT-02: Tunisian Revolution 2010–2011 ───────────────────────
    {
        "event_id": "TUN_2010_REVOLUTION",
        "title": "Tunisian Revolution 2010–2011",
        "date_start": "2010-12-17",
        "date_end": "2011-01-14",
        "trigger": "Mohamed Bouazizi self-immolation + accumulated economic grievance",
        "actors_involved": ["PRES", "INT", "ARM", "UGTT", "PPL", "YOUTH", "LPR", "MEDIA", "FRA", "EU", "USA", "DZA", "UTICA"],
        "governorates": ["sidi_bouzid", "kasserine", "gafsa", "tunis", "sfax", "all"],
        "rri_estimate": 2.85,
        "p_rev_estimate": 0.78,
        "escalation_sequence": [
            "bouazizi_self_immolation",
            "local_protest_sidi_bouzid",
            "social_media_amplification",
            "security_crackdown",
            "protest_spread_interior",
            "ugtt_local_support",
            "protest_reach_tunis",
            "elite_defection_begin",
            "military_neutrality_declaration",
            "ben_ali_flight",
        ],
        "outcome": "regime_collapse",
        "lessons": [
            "single_ignition_event_bouazizi",
            "social_media_as_accelerator",
            "military_neutrality_as_terminal_signal",
            "interior_governorate_ignition_national_spread",
            "elite_defection_cascade_after_military_signal",
            "ugtt_as_legitimacy_broker_post_exit",
        ],
        "chains_activated": [
            "bread_price_cascade", "elite_defection", "narrative_mobilization",
            "legitimacy_collapse", "repression_feedback", "external_shock",
        ],
        "doctrine_parallels": [
            "schelling_tipping_point", "selectorate_defection_cascade",
            "beissinger_mobilization_cascade", "olson_collective_action",
        ],
        "intel_significance": "Canonical regime collapse event. Validates RRI model at extreme — RRI > 2.8, P_rev > 0.75, elite cohesion collapse. Military neutrality was the irreversible trigger.",
    },
    # ── EVENT-03: Bardo Museum Attack & National Dialogue 2013 ────────
    {
        "event_id": "TUN_2013_BARDO",
        "title": "Bardo Museum Attack, Political Crisis & National Dialogue 2013",
        "date_start": "2013-02-06",
        "date_end": "2014-01-26",
        "trigger": "Opposition politician Chokri Belaid assassination + security crisis",
        "actors_involved": ["PRES", "ENN", "UGTT", "ARM", "INT", "LPR", "LTDH", "UTICA", "FRA", "EU"],
        "governorates": ["tunis"],
        "rri_estimate": 2.1,
        "p_rev_estimate": 0.45,
        "escalation_sequence": [
            "belaid_assassination",
            "opposition_walkout",
            "ugtt_mediation_offer",
            "national_dialogue_launch",
            "bardo_museum_attack",
            "security_crackdown",
            "constitution_completion",
            "elections_scheduled",
        ],
        "outcome": "negotiated_transition",
        "lessons": [
            "ugtt_kingmaker_role_in_crisis",
            "national_dialogue_as_conflict_resolution_model",
            "security_crisis_can_unite_political_factions",
            "islamist_secularist_negotiation_template",
        ],
        "chains_activated": ["repression_feedback", "narrative_mobilization"],
        "doctrine_parallels": ["network_bargaining", "hurricane_analogy_crisis"],
        "intel_significance": "Demonstrates UGTT's institutional role as crisis mediator. RRI in elevated (2.1) but not critical range — shows regime can survive if legitimacy brokers intervene.",
    },
    # ── EVENT-04: Presidential Self-Coup 2021 ─────────────────────────
    {
        "event_id": "TUN_2021_COUP",
        "title": "Presidential Self-Coup & Constitutional Coup 2021",
        "date_start": "2021-07-25",
        "date_end": "2022-03-15",
        "trigger": "Parliamentary deadlock + COVID economic crisis + public frustration",
        "actors_involved": ["PRES", "ARM", "INT", "ENN", "PPL", "UGTT", "EU", "FRA", "USA", "UTICA", "MEDIA", "LPR"],
        "governorates": ["tunis"],
        "rri_estimate": 1.8,
        "p_rev_estimate": 0.35,
        "escalation_sequence": [
            "president_fires_pm",
            "suspends_parliament",
            "article_80_invocation",
            "military_backs_president",
            "ugtt_cautious_support",
            "international_mild_condemnation",
            "new_constitution_announced",
            "referendum_approval",
        ],
        "outcome": "power_consolidated",
        "lessons": [
            "military_support_enables_executive_power_grab",
            "public_exhaustion_allows_authoritarian_shift",
            "ugtt_can_be_neutralized_by_national_security_frame",
            "international_community_prioritizes_stability_over_democracy",
            "RRI_below_critical_threshold_allows_consolidation",
        ],
        "chains_activated": ["elite_defection", "narrative_mobilization"],
        "doctrine_parallels": [
            "svolik_authoritarian_consolidation",
            "selectorate_elite_cooptation",
        ],
        "intel_significance": "Demonstrates authoritarian consolidation below RRI critical threshold (2.5). Military posture (ARM support) was decisive. International response validated EU doctrine: stability > democracy.",
    },
    # ── EVENT-05: IMF Crisis & Subsidy Tensions 2023–2024 ─────────────
    {
        "event_id": "TUN_2023_IMF",
        "title": "IMF Program Suspension & Subsidy Removal Tensions 2023–2024",
        "date_start": "2023-01-01",
        "date_end": "2024-12-31",
        "trigger": "IMF conditionality demands for subsidy reform + political resistance",
        "actors_involved": ["PRES", "BCT", "UGTT", "DONOR", "EU", "FRA", "UTICA", "PPL", "INT"],
        "governorates": ["tunis", "sfax", "kasserine", "sidi_bouzid"],
        "rri_estimate": 2.35,
        "p_rev_estimate": 0.55,
        "escalation_sequence": [
            "imf_loan_negotiation",
            "subsidy_reform_demanded",
            "ugtt_opposition_signal",
            "president_delays_reforms",
            "localized_shortage_protests",
            "imf_suspends_disbursement",
            "fx_reserve_stress",
            "bct_rationing_informal",
            "president_blames_imf",
            "narrative_shift_anti_imf",
        ],
        "outcome": "frozen_conflict",
        "lessons": [
            "subsidy_removal_triggers_ugtt_veto",
            "president_uses_delay_as_survival_tactic",
            "fx_reserves_below_45_days_as_critical_threshold",
            "international_creditors_prefer_partial_engagement_over_suspension",
            "narrative_shift_blaming_imf_is_presidential_default",
        ],
        "chains_activated": [
            "imf_subsidy", "fx_depletion", "bread_price_cascade",
        ],
        "doctrine_parallels": [
            "reinhart_rogoff_sovereign_debt",
            "selectorate_fiscal_crisis_management",
        ],
        "intel_significance": "Active crisis pattern. RRI at elevated (2.35) — below critical but with structural trajectory upward. Central test case for IMF conditionality chain (CHAIN-09) and FX depletion chain (CHAIN-04). Demonstrates presidential delay tactic under fiscal stress.",
    },
    # ── EVENT-06: Sfax & Interior Water Riots 2023 ────────────────────
    {
        "event_id": "TUN_2023_WATER",
        "title": "Sfax & Interior Governorate Water Riots 2023",
        "date_start": "2023-03-01",
        "date_end": "2023-09-30",
        "trigger": "Record drought + dam levels below 30% + water rationing",
        "actors_involved": ["SONEDE", "PPL", "YOUTH", "INT", "STEG", "PRES"],
        "governorates": ["sfax", "sidi_bouzid", "kairouan", "kasserine", "gabes"],
        "rri_estimate": 2.15,
        "p_rev_estimate": 0.42,
        "escalation_sequence": [
            "drought_intensifies",
            "dam_levels_critical",
            "water_rationing_announced",
            "localized_protests_sfax",
            "security_deployment_water_nodes",
            "steg_cooling_water_risk",
            "government_promise_of_desalination",
            "protests_subsided",
        ],
        "outcome": "contained_with_promise",
        "lessons": [
            "water_scarcity_as_protest_ignition",
            "security_deployment_at_infrastructure_nodes",
            "desalination_promise_as_temporary_deescalation",
            "summer_heat_+_ramadan_as_amplifier",
        ],
        "chains_activated": ["water_scarcity"],
        "doctrine_parallels": ["environmental_security_theory"],
        "intel_significance": "Validates water scarcity chain (CHAIN-08). Demonstrates environmental stress as independent protest driver in coastal governorates (Sfax) typically less active than interior.",
    },
]

EVENT_DOMAINS: List[str] = [
    "economic",
    "political",
    "security",
    "social",
    "environmental",
    "external",
]

EVENT_CHAIN_MAP: Dict[str, List[str]] = {
    "TUN_2008_GAFSA": ["phosphate_disruption", "repression_feedback"],
    "TUN_2010_REVOLUTION": [
        "bread_price_cascade", "elite_defection", "narrative_mobilization",
        "legitimacy_collapse", "repression_feedback", "external_shock",
    ],
    "TUN_2013_BARDO": ["repression_feedback", "narrative_mobilization"],
    "TUN_2021_COUP": ["elite_defection", "narrative_mobilization"],
    "TUN_2023_IMF": ["imf_subsidy", "fx_depletion", "bread_price_cascade"],
    "TUN_2023_WATER": ["water_scarcity"],
}
