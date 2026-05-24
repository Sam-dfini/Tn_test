"""
Brief Engine — RAG-grounded intelligence briefs.

Generates structured briefs from the current RRI snapshot, then
enriches them with RAG-grounded citations via the synthesis pipeline.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from uuid import uuid4

from ..core.database import db
from .llm_client import generate
from .rag_synthesis import synthesize
from .state_snapshot import get_latest_snapshot


def _classify(
    rri: float,
    p_rev: float,
    velocity: float,
    compound_stress: float,
    mii: float,
    cascade_prob: float,
    oci: float,
    elite_cohesion: float,
) -> Dict[str, str]:
    """Deterministic classification matching the frontend intelligenceBrief.ts logic."""
    if rri > 2.8 or p_rev > 0.80 or oci > 0.65:
        basis = (
            f"OCI={oci*100:.0f}% — critical opposition coordination"
            if oci > 0.65
            else f"R(t)={rri:.2f} · P_rev={p_rev*100:.0f}% — threshold exceeded"
        )
        return {"classification": "EMERGENCY", "basis": basis}

    if rri >= 2.5 or (compound_stress > 0.35 and cascade_prob > 0.60):
        bases = [f"R(t)={rri:.2f}"]
        if compound_stress > 0.35:
            bases.append("Compound stress active")
        if cascade_prob > 0.60:
            bases.append(f"Cascade prob {cascade_prob*100:.0f}%")
        return {"classification": "CRITICAL", "basis": " · ".join(bases)}

    high_signals: List[str] = []
    if rri >= 2.2:
        high_signals.append(f"R(t)={rri:.2f}")
    if velocity > 0.20:
        high_signals.append("rapid deterioration")
    if mii > 0.60:
        high_signals.append(f"MII={mii*100:.0f}%")
    if cascade_prob > 0.55:
        high_signals.append(f"cascade={cascade_prob*100:.0f}%")
    if oci > 0.45:
        high_signals.append(f"OCI={oci*100:.0f}%")

    if len(high_signals) >= 2:
        return {"classification": "HIGH", "basis": " · ".join(high_signals)}

    if rri >= 1.8 or velocity > 0.12 or mii > 0.50:
        basis = (
            f"R(t)={rri:.2f}"
            if rri >= 1.8
            else f"V(t)={velocity:.3f} deteriorating"
            if velocity > 0.12
            else f"MII={mii*100:.0f}%"
        )
        return {"classification": "ELEVATED", "basis": basis}

    return {"classification": "ROUTINE", "basis": "No significant threshold breaches"}


async def generate_brief(
    snapshot: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Generate a full RAG-grounded intelligence brief.

    Args:
        snapshot: Current RRI snapshot. If None, fetches latest.

    Returns:
        Structured brief with situation, developments, assessment,
        watch indicators, actions, and citations.
    """
    if snapshot is None:
        snapshot = get_latest_snapshot()
    if snapshot is None:
        return {
            "id": f"brief-{uuid4().hex[:8]}",
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "classification": "ROUTINE",
            "classification_basis": "No snapshot available",
            "situation": "Insufficient data to generate a brief.",
            "key_developments": [],
            "assessment": "No data.",
            "watch_indicators": [],
            "recommended_actions": [],
            "citations": [],
        }

    rri = snapshot.get("rri", 0.0)
    p_rev = snapshot.get("p_revolution", 0.0)
    velocity = snapshot.get("velocity", 0.0)
    compound_stress = snapshot.get("compound_stress", 0.0)
    mii = snapshot.get("mii", 0.0)
    cascade_prob = snapshot.get("cascade_probability", 0.0)
    oci = snapshot.get("oci", 0.0)
    elite_cohesion = snapshot.get("elite_cohesion", 0.0)

    cls = _classify(rri, p_rev, velocity, compound_stress, mii, cascade_prob, oci, elite_cohesion)

    rri_context = {
        "rri": rri,
        "p_revolution": p_rev,
        "velocity": velocity,
        "acceleration": snapshot.get("acceleration", 0.0),
        "compound_stress": compound_stress,
        "cascade_probability": cascade_prob,
        "salience": snapshot.get("salience", 0.0),
        "elite_cohesion": elite_cohesion,
        "mii": mii,
        "oci": oci,
        "classification": cls["classification"],
    }

    # Generate situation via RAG
    situation_result = await synthesize(
        query=f"What is the current situation in Tunisia? RRI={rri:.2f}, classification={cls['classification']}",
        trigger_source="brief_engine",
        rri_context=rri_context,
        max_chunks=5,
    )

    # Generate assessment via RAG
    assessment_result = await synthesize(
        query=f"What are the key risks and their drivers? RRI trend is {snapshot.get('velocity_label', 'stable')}",
        trigger_source="brief_engine",
        rri_context=rri_context,
        max_chunks=5,
    )

    # Build developments from snapshot deltas
    developments = []
    for key, label, direction in [
        ("rri", "RRI", "up" if rri > 2.3 else "stable"),
        ("velocity", "Velocity", snapshot.get("velocity_label", "stable").lower()),
        ("compound_stress", "Compound Stress", "up" if compound_stress > 0.3 else "stable"),
        ("cascade_probability", "Cascade Probability", "up" if cascade_prob > 0.5 else "stable"),
        ("mii", "Ministerial Instability", "up" if mii > 0.5 else "stable"),
    ]:
        val = snapshot.get(key, 0.0)
        if val > 0:
            developments.append({
                "signal": label,
                "source": "rri_engine",
                "direction": direction,
                "severity": "critical" if val > 0.7 else "high" if val > 0.5 else "medium" if val > 0.3 else "low",
                "value": f"{val:.3f}",
            })

    # Build watch indicators from ontology chains
    watch_indicators = [
        {
            "indicator": "Bread Price Stress",
            "current_value": "0.00",
            "threshold": "0.65",
            "consequence": "Bread price cascade activation",
            "timeframe": "7-14 days",
            "probability": 0.35,
        },
        {
            "indicator": "FX Reserve Days",
            "current_value": "0.00",
            "threshold": "45 days",
            "consequence": "Social contract breach risk",
            "timeframe": "30-60 days",
            "probability": 0.40,
        },
        {
            "indicator": "Elite Cohesion",
            "current_value": f"{elite_cohesion:.2f}",
            "threshold": "0.35",
            "consequence": "Elite defection cascade",
            "timeframe": "7-30 days",
            "probability": round(1.0 - elite_cohesion, 2),
        },
    ]

    # Build recommended actions
    actions = []
    if cls["classification"] in ("CRITICAL", "EMERGENCY"):
        actions.append({
            "priority": "IMMEDIATE",
            "action": "Activate continuous monitoring — all channels",
            "rationale": f"Classification {cls['classification']} triggered",
        })
    if cascade_prob > 0.5:
        actions.append({
            "priority": "URGENT",
            "action": "Pre-run cascade simulations for interior governorates",
            "rationale": f"Cascade probability at {cascade_prob*100:.0f}%",
        })
    if mii > 0.5:
        actions.append({
            "priority": "MONITOR",
            "action": "Track ministerial instability signals daily",
            "rationale": f"MII at {mii*100:.0f}% — cabinet reshuffle risk",
        })
    actions.append({
        "priority": "PREPARE",
        "action": "Run next model snapshot in 24-48 hours and compare",
        "rationale": "Learning loop: establish prediction baseline",
    })

    # Merge citations from both RAG calls
    all_citations = situation_result.get("citations", []) + assessment_result.get("citations", [])
    seen_cids: set = set()
    unique_citations = []
    for c in all_citations:
        if c["chunk_id"] not in seen_cids:
            seen_cids.add(c["chunk_id"])
            unique_citations.append(c)

    return {
        "id": f"brief-{uuid4().hex[:8]}",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "classification": cls["classification"],
        "classification_basis": cls["basis"],
        "situation": situation_result["prose"],
        "situation_confidence": situation_result["confidence"],
        "key_developments": developments,
        "assessment": assessment_result["prose"],
        "assessment_confidence": assessment_result["confidence"],
        "watch_indicators": watch_indicators,
        "recommended_actions": actions,
        "citations": unique_citations,
        "model_used": situation_result.get("model_used", ""),
        "rri_context": rri_context,
    }
