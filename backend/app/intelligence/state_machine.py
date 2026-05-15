"""
National State Machine — 7-phase classifier for Tunisian systemic instability.

Phases:
  Accumulation → Stagnation → Suppression → Fracture → Ignition → Cascade → Exhaustion

Inputs:
  - rri: current RRI value (0–10)
  - velocity: daily RRI change
  - cascade_prob: cascade probability (0–1)
  - coercion_idx: coercion intensity (0–1)
  - narrative_divergence: elite narrative fragmentation (0–1)
  - elite_cohesion: elite cohesion index (0–1)
  - sir_infected: protest infection ratio (0–1)
  - compound_stress: compound stress (0–1)
"""

from typing import Dict, List, Optional, Tuple
from datetime import datetime, timedelta
import numpy as np


PHASES = [
    "accumulation",
    "stagnation",
    "suppression",
    "fracture",
    "ignition",
    "cascade",
    "exhaustion",
]

PHASE_LABELS: Dict[str, str] = {
    "accumulation": "Accumulation",
    "stagnation": "Stagnation",
    "suppression": "Suppression",
    "fracture": "Fracture",
    "ignition": "Ignition",
    "cascade": "Cascade",
    "exhaustion": "Exhaustion",
}

PHASE_SIGNATURES: Dict[str, str] = {
    "accumulation": "Grievances build, elite complacency",
    "stagnation": "No reform, no explosion, public cynicism",
    "suppression": "Crackdowns, arrests, narrative control",
    "fracture": "Elite splits, institutional defection",
    "ignition": "Trigger event, mass mobilization",
    "cascade": "Rapid contagion, regional spread",
    "exhaustion": "Resource depletion, demobilization",
}

PHASE_COLORS: Dict[str, str] = {
    "accumulation": "#f59e0b",
    "stagnation": "#64748b",
    "suppression": "#ef4444",
    "fracture": "#a855f7",
    "ignition": "#ff6b35",
    "cascade": "#dc2626",
    "exhaustion": "#475569",
}

TRANSITION_MATRIX: Dict[str, List[Tuple[str, float]]] = {
    "accumulation": [("stagnation", 0.35), ("suppression", 0.25), ("fracture", 0.15), ("ignition", 0.10), ("accumulation", 0.15)],
    "stagnation": [("suppression", 0.30), ("fracture", 0.25), ("ignition", 0.15), ("accumulation", 0.20), ("stagnation", 0.10)],
    "suppression": [("fracture", 0.35), ("ignition", 0.25), ("stagnation", 0.20), ("accumulation", 0.10), ("suppression", 0.10)],
    "fracture": [("ignition", 0.40), ("cascade", 0.15), ("suppression", 0.20), ("stagnation", 0.15), ("fracture", 0.10)],
    "ignition": [("cascade", 0.50), ("exhaustion", 0.10), ("fracture", 0.20), ("suppression", 0.15), ("ignition", 0.05)],
    "cascade": [("exhaustion", 0.40), ("ignition", 0.20), ("fracture", 0.20), ("cascade", 0.20)],
    "exhaustion": [("accumulation", 0.60), ("stagnation", 0.25), ("exhaustion", 0.15)],
}


def _velocity_category(v: float) -> str:
    if v > 0.3: return "surge"
    if v > 0.1: return "rising"
    if v > 0.01: return "slow_rise"
    if v > -0.01: return "flat"
    if v > -0.1: return "slow_decline"
    return "rapid_decline"


def _rri_category(rri: float) -> str:
    if rri >= 3.0: return "critical"
    if rri >= 2.5: return "high"
    if rri >= 2.0: return "elevated"
    if rri >= 1.5: return "moderate"
    return "low"


class StateMachine:
    """National state classifier using signal-based rules."""

    def __init__(self):
        self.history: List[Dict] = []
        self.current_phase: str = "accumulation"
        self.phase_start: datetime = datetime.utcnow()
        self.transition_log: List[Dict] = []

    def classify(
        self,
        rri: float,
        velocity: float,
        cascade_prob: float,
        coercion_idx: float = 0.3,
        narrative_divergence: float = 0.3,
        elite_cohesion: float = 0.6,
        sir_infected: float = 0.0,
        compound_stress: float = 0.3,
    ) -> Dict:
        vcat = _velocity_category(velocity)
        rcat = _rri_category(rri)
        prev = self.current_phase

        # Rule-based classification
        if rcat == "critical" and cascade_prob > 0.6 and sir_infected > 0.15:
            phase = "cascade"
        elif rcat == "critical" and vcat == "surge" and sir_infected > 0.05:
            phase = "ignition"
        elif rcat == "high" and coercion_idx > 0.6 and compound_stress > 0.5:
            phase = "suppression"
        elif rcat == "high" and narrative_divergence > 0.6 and elite_cohesion < 0.4:
            phase = "fracture"
        elif rcat == "elevated" and vcat == "flat" and narrative_divergence > 0.5:
            phase = "stagnation"
        elif rcat == "moderate" and vcat == "slow_rise" and cascade_prob < 0.3:
            phase = "accumulation"
        elif rcat == "low" and compound_stress < 0.3:
            phase = "accumulation"
        elif vcat == "rapid_decline" and cascade_prob < 0.3:
            phase = "exhaustion"
        else:
            phase = prev

        # Track phase transitions
        now = datetime.utcnow()
        if phase != prev:
            self.transition_log.append({
                "from": prev, "to": phase,
                "timestamp": now.isoformat(),
                "rri": rri, "velocity": velocity,
            })
            self.phase_start = now

        dwell_days = (now - self.phase_start).total_seconds() / 86400
        self.current_phase = phase

        # Compute transition probabilities (dynamic — biased by current signals)
        base_transitions = TRANSITION_MATRIX.get(phase, [])
        transitions = []
        for target, base_prob in base_transitions:
            boost = 0.0
            if target == "ignition" and velocity > 0.2:
                boost = 0.15
            if target == "cascade" and cascade_prob > 0.5:
                boost = 0.15
            if target == "exhaustion" and rri < 1.5:
                boost = 0.1
            if target == "suppression" and coercion_idx > 0.7:
                boost = 0.12
            transitions.append({"target": target, "probability": round(min(1.0, base_prob + boost), 3)})

        result = {
            "phase": phase,
            "phase_label": PHASE_LABELS.get(phase, phase),
            "phase_signature": PHASE_SIGNATURES.get(phase, ""),
            "phase_color": PHASE_COLORS.get(phase, "#64748b"),
            "dwell_days": round(dwell_days, 1),
            "transitions": sorted(transitions, key=lambda t: -t["probability"]),
            "phase_index": PHASES.index(phase),
            "inputs": {
                "rri": rri, "velocity": velocity,
                "cascade_prob": cascade_prob,
                "coercion_idx": coercion_idx,
                "narrative_divergence": narrative_divergence,
                "elite_cohesion": elite_cohesion,
                "sir_infected": sir_infected,
                "compound_stress": compound_stress,
            },
            "velocity_category": vcat,
            "rri_category": rcat,
        }

        self.history.append({
            "timestamp": now.isoformat(),
            **result,
        })
        if len(self.history) > 1000:
            self.history = self.history[-1000:]

        return result

    def get_history(self, limit: int = 100) -> List[Dict]:
        return self.history[-limit:]

    def get_transition_log(self, limit: int = 50) -> List[Dict]:
        return self.transition_log[-limit:]

    def get_phase_duration_distribution(self) -> Dict[str, float]:
        """Return fraction of total history spent in each phase."""
        if not self.history:
            return {p: 0.0 for p in PHASES}
        counts = {p: 0 for p in PHASES}
        for h in self.history:
            p = h.get("phase", "accumulation")
            if p in counts:
                counts[p] += 1
        total = sum(counts.values()) or 1
        return {p: round(c / total, 3) for p, c in counts.items()}


# Singleton
_instance: Optional[StateMachine] = None


def get_state_machine() -> StateMachine:
    global _instance
    if _instance is None:
        _instance = StateMachine()
    return _instance
