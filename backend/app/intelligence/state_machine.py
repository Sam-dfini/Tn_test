"""
HMM/Regime-Switching National State Machine
Upgrades the rules-based classifier to a Hidden Markov Model with:
- Gaussian emission probabilities per phase (8 signal dimensions)
- Forward-filter inference for online posterior computation
- Viterbi decoding for most likely state sequence (history smoothing)
- Online Bayesian updating of emission means/variances and transition counts
- Regime persistence penalty to prevent flickering

Phases:
  Accumulation → Stagnation → Suppression → Fracture → Ignition → Cascade → Exhaustion
"""

from typing import Dict, List, Optional, Tuple
from datetime import datetime, timedelta
from math import exp, log, sqrt, pi


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

NUM_PHASES = len(PHASES)
PHASE_INDEX = {p: i for i, p in enumerate(PHASES)}

SIGNAL_KEYS = ["rri", "velocity", "cascade_prob", "coercion_idx",
               "narrative_divergence", "elite_cohesion", "sir_infected", "compound_stress"]
NUM_SIGNALS = len(SIGNAL_KEYS)

# ── Expert-defined emission priors (means per phase per signal) ──────────
# Rows = phases (same order as PHASES), cols = signals (same order as SIGNAL_KEYS)
EMISSION_MEANS: List[List[float]] = [
    [1.5,  0.03,  0.20, 0.20, 0.30, 0.70, 0.02, 0.25],  # accumulation
    [2.0,  0.00,  0.30, 0.40, 0.50, 0.55, 0.05, 0.40],  # stagnation
    [2.7,  0.05,  0.35, 0.75, 0.40, 0.65, 0.08, 0.55],  # suppression
    [2.5,  0.15,  0.45, 0.50, 0.70, 0.35, 0.10, 0.50],  # fracture
    [3.0,  0.35,  0.55, 0.55, 0.60, 0.30, 0.20, 0.60],  # ignition
    [3.5,  0.20,  0.70, 0.50, 0.55, 0.35, 0.35, 0.70],  # cascade
    [1.8, -0.15,  0.25, 0.30, 0.35, 0.50, 0.10, 0.35],  # exhaustion
]

EMISSION_STDS: List[List[float]] = [
    [0.4, 0.08, 0.10, 0.10, 0.10, 0.10, 0.03, 0.10],
    [0.4, 0.08, 0.10, 0.15, 0.10, 0.10, 0.04, 0.10],
    [0.5, 0.08, 0.10, 0.10, 0.10, 0.10, 0.04, 0.10],
    [0.4, 0.10, 0.10, 0.15, 0.10, 0.10, 0.04, 0.10],
    [0.4, 0.15, 0.10, 0.15, 0.10, 0.10, 0.06, 0.10],
    [0.5, 0.10, 0.10, 0.15, 0.10, 0.10, 0.10, 0.10],
    [0.4, 0.15, 0.10, 0.10, 0.10, 0.10, 0.04, 0.10],
]

# Base transition matrix (prior)
BASE_TRANSITION: List[List[float]] = [
    [0.15, 0.35, 0.25, 0.15, 0.10, 0.00, 0.00],  # accumulation
    [0.20, 0.10, 0.30, 0.25, 0.15, 0.00, 0.00],  # stagnation
    [0.10, 0.20, 0.10, 0.35, 0.25, 0.00, 0.00],  # suppression
    [0.00, 0.15, 0.20, 0.10, 0.40, 0.15, 0.00],  # fracture
    [0.00, 0.00, 0.15, 0.20, 0.05, 0.50, 0.10],  # ignition
    [0.00, 0.00, 0.00, 0.20, 0.20, 0.20, 0.40],  # cascade
    [0.60, 0.25, 0.00, 0.00, 0.00, 0.00, 0.15],  # exhaustion
]

# Regime persistence bonus: extra log-prob for staying in same state
# Higher values = smoother, less flickering
REGIME_PERSISTENCE_BONUS = 0.05

# Dirichlet prior strength (pseudo-counts for transition learning)
DIRICHLET_PRIOR = 5.0


def _gaussian_log_prob(x: float, mu: float, sigma: float) -> float:
    """Log-probability of x under N(mu, sigma²)."""
    if sigma < 1e-6:
        sigma = 1e-6
    return -0.5 * log(2 * pi) - log(sigma) - 0.5 * ((x - mu) / sigma) ** 2


def _softmax(logits: List[float]) -> List[float]:
    """Stable softmax."""
    max_l = max(logits)
    exps = [exp(v - max_l) for v in logits]
    total = sum(exps)
    return [e / total for e in exps]


def _entropy(probs: List[float]) -> float:
    """Entropy of a probability distribution."""
    eps = 1e-12
    return -sum(p * log(max(p, eps)) for p in probs)


class HMMStateMachine:
    """HMM-based national state classifier with online Bayesian updates."""

    def __init__(self):
        self.history: List[Dict] = []
        self.current_phase: str = "accumulation"
        self.phase_start: datetime = datetime.utcnow()
        self.transition_log: List[Dict] = []

        # HMM parameters (online-learned) — deep copy to avoid mutation
        self.emission_means: List[List[float]] = [row[:] for row in EMISSION_MEANS]
        self.emission_stds: List[List[float]] = [row[:] for row in EMISSION_STDS]
        self.transition_counts: List[List[float]] = [
            [cell * DIRICHLET_PRIOR for cell in row] for row in BASE_TRANSITION
        ]

        # Online state tracking
        self._prev_obs: Optional[List[float]] = None
        self._prev_posterior: List[float] = [1.0 / NUM_PHASES] * NUM_PHASES
        self._log_likelihood: float = 0.0

    # ── Emission Model ────────────────────────────────────────────

    def _compute_log_emission(self, obs: List[float]) -> List[float]:
        """Compute log P(obs | phase) for each phase."""
        log_probs = [0.0] * NUM_PHASES
        for s in range(NUM_PHASES):
            lp = 0.0
            for i in range(NUM_SIGNALS):
                lp += _gaussian_log_prob(obs[i], self.emission_means[s][i], self.emission_stds[s][i])
            log_probs[s] = lp
        return log_probs

    # ── Forward Filter ────────────────────────────────────────────

    def _logsumexp(self, a: float, b: float) -> float:
        """Stable log(exp(a) + exp(b))."""
        if a == -float('inf') and b == -float('inf'):
            return -float('inf')
        if a > b:
            return a + log(1 + exp(b - a))
        return b + log(1 + exp(a - b))

    def _forward_filter(self, obs: List[float], prev_log_transition: Optional[List[float]] = None) -> List[float]:
        log_emit = self._compute_log_emission(obs)

        if prev_log_transition is None:
            log_prior = [-log(NUM_PHASES)] * NUM_PHASES
        else:
            log_prior = list(prev_log_transition)

        log_pred = [-float('inf')] * NUM_PHASES
        for j in range(NUM_PHASES):
            for i in range(NUM_PHASES):
                row_sum = max(sum(self.transition_counts[i]), 1e-10)
                    trans_lp = log(max(self.transition_counts[i][j] / row_sum, 1e-12))
                    if i == j:
                        trans_lp += REGIME_PERSISTENCE_BONUS
                    val = delta[t - 1][i] + trans_lp
                    if val > best_val:
                        best_val = val
                        best_i = i
                delta[t][j] = best_val + log_emit_t[j]
                psi[t][j] = best_i

        best_last = max(range(N), key=lambda j: delta[T - 1][j])
        path = [best_last]
        for t in range(T - 1, 0, -1):
            path.insert(0, psi[t][path[0]])
        return path

    # ── Online Bayesian Update ────────────────────────────────────

    def _update_emission_params(self, obs: List[float], phase_idx: int, lr: float = 0.05):
        for i in range(NUM_SIGNALS):
            mu = self.emission_means[phase_idx][i]
            std = self.emission_stds[phase_idx][i]
            diff = obs[i] - mu
            self.emission_means[phase_idx][i] += lr * diff
            self.emission_stds[phase_idx][i] = max(0.03, std + lr * (abs(diff) - std))

    def _update_transition(self, prev_idx: int, curr_idx: int):
        self.transition_counts[prev_idx][curr_idx] += 1.0

    # ── Public API ────────────────────────────────────────────────

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
        obs = [rri, velocity, cascade_prob, coercion_idx,
               narrative_divergence, elite_cohesion, sir_infected, compound_stress]

        prev_log = None
        if self._prev_obs is not None:
            prev_log = self._forward_filter(self._prev_obs)
        log_posterior = self._forward_filter(obs, prev_log)
        posterior = _softmax(log_posterior)
        phase_idx = max(range(NUM_PHASES), key=lambda i: posterior[i])
        confidence = posterior[phase_idx]
        entropy_val = _entropy(posterior)

        phase = PHASES[phase_idx]
        prev = self.current_phase
        now = datetime.utcnow()

        if phase != prev:
            self.transition_log.append({
                "from": prev, "to": phase,
                "timestamp": now.isoformat(),
                "rri": rri, "velocity": velocity,
                "confidence": confidence,
            })
            self.phase_start = now
            prev_idx = PHASE_INDEX.get(prev, 0)
            self._update_transition(prev_idx, phase_idx)

        self._update_emission_params(obs, phase_idx)

        dwell_days = (now - self.phase_start).total_seconds() / 86400.0
        self.current_phase = phase
        self._prev_obs = obs[:]
        self._prev_posterior = posterior[:]

        row = self.transition_counts[phase_idx]
        row_total = max(sum(row), 1e-10)
        transitions = []
        for j, target in enumerate(PHASES):
            prob = row[j] / row_total
            if prob > 0.005:
                transitions.append({"target": target, "probability": round(prob, 3)})
        transitions.sort(key=lambda t: -t["probability"])

        result = {
            "phase": phase,
            "phase_label": PHASE_LABELS.get(phase, phase),
            "phase_signature": PHASE_SIGNATURES.get(phase, ""),
            "phase_color": PHASE_COLORS.get(phase, "#64748b"),
            "dwell_days": round(dwell_days, 1),
            "transitions": transitions,
            "phase_index": phase_idx,
            "confidence": round(confidence, 4),
            "entropy": round(entropy_val, 4),
            "phase_probabilities": {PHASES[i]: round(posterior[i], 4) for i in range(NUM_PHASES)},
            "inputs": {
                "rri": rri, "velocity": velocity,
                "cascade_prob": cascade_prob,
                "coercion_idx": coercion_idx,
                "narrative_divergence": narrative_divergence,
                "elite_cohesion": elite_cohesion,
                "sir_infected": sir_infected,
                "compound_stress": compound_stress,
            },
        }

        self.history.append({"timestamp": now.isoformat(), **result})
        if len(self.history) > 1000:
            self.history = self.history[-1000:]

        return result

    def decode_history_path(self) -> List[Dict]:
        if len(self.history) < 2:
            return self.history
        observations = []
        for h in self.history:
            inp = h.get("inputs", {})
            observations.append([
                inp.get("rri", 2.0),
                inp.get("velocity", 0.0),
                inp.get("cascade_prob", 0.3),
                inp.get("coercion_idx", 0.3),
                inp.get("narrative_divergence", 0.3),
                inp.get("elite_cohesion", 0.6),
                inp.get("sir_infected", 0.0),
                inp.get("compound_stress", 0.3),
            ])
        viterbi_path = self._viterbi(observations)
        smoothed = []
        for i, h in enumerate(self.history):
            entry = dict(h)
            v_idx = viterbi_path[i] if i < len(viterbi_path) else h.get("phase_index", 0)
            entry["viterbi_phase"] = PHASES[v_idx]
            entry["viterbi_phase_label"] = PHASE_LABELS.get(PHASES[v_idx], PHASES[v_idx])
            smoothed.append(entry)
        return smoothed

    def get_history(self, limit: int = 100) -> List[Dict]:
        return self.history[-limit:]

    def get_transition_log(self, limit: int = 50) -> List[Dict]:
        return self.transition_log[-limit:]

    def get_phase_duration_distribution(self) -> Dict[str, float]:
        if not self.history:
            return {p: 0.0 for p in PHASES}
        counts = {p: 0 for p in PHASES}
        for h in self.history:
            p = h.get("phase", "accumulation")
            if p in counts:
                counts[p] += 1
        total = sum(counts.values()) or 1
        return {p: round(c / total, 3) for p, c in counts.items()}

    def get_emission_table(self) -> Dict:
        return {
            "means": {PHASES[s]: {SIGNAL_KEYS[i]: round(self.emission_means[s][i], 3)
                                   for i in range(NUM_SIGNALS)} for s in range(NUM_PHASES)},
            "stds": {PHASES[s]: {SIGNAL_KEYS[i]: round(self.emission_stds[s][i], 3)
                                 for i in range(NUM_SIGNALS)} for s in range(NUM_PHASES)},
        }


# Singleton
_instance: Optional[HMMStateMachine] = None


def get_state_machine() -> HMMStateMachine:
    global _instance
    if _instance is None:
        _instance = HMMStateMachine()
    return _instance
