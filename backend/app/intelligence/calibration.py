"""
Calibration Dashboard — prediction accuracy tracking and self-correction.

Reads from Supabase `predictions` table, computes:
  - Overall accuracy by variable, horizon, and time
  - Calibration curve (predicted probability vs actual frequency)
  - Bias detection (overconfidence/underconfidence per variable)
  - Bayesian parameter update suggestions
"""

from collections import defaultdict, Counter
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Optional, Tuple
import math

from ..core.database import db

VARIABLE_CATEGORIES = {
    "fx": ["fx_reserves_below_75", "fx_reserves_below_60"],
    "protest": ["protests_exceed_30", "protests_exceed_40"],
    "rri": ["rri_above_2_5", "rri_above_3_0"],
    "elite": ["elite_defection_above_30"],
    "cascade": ["cascade_prob_above_60"],
    "velocity": ["velocity_above_20"],
    "ugtt": ["ugtt_escalates"],
    "sei": ["sei_phase_4_any", "sei_anger_window"],
    "rpi": ["rpi_above_50"],
    "etm": ["etm_closure_above_65"],
    "mii": ["mii_phase_chaotic"],
}

VARIABLE_LABELS: Dict[str, str] = {
    "fx_reserves_below_75": "FX Reserves < 75 days",
    "fx_reserves_below_60": "FX Reserves < 60 days",
    "ugtt_escalates": "UGTT Escalation",
    "protests_exceed_30": "Protests > 30/mo",
    "protests_exceed_40": "Protests > 40/mo",
    "sei_phase_4_any": "SEI Phase 4+",
    "sei_anger_window": "SEI Anger Trigger",
    "cascade_prob_above_60": "Cascade > 60%",
    "velocity_above_20": "Velocity > 0.20",
    "rpi_above_50": "RPI > 0.50",
    "etm_closure_above_65": "ETM Closure > 65%",
    "mii_phase_chaotic": "MII Chaotic Phase",
    "elite_defection_above_30": "Elite Defection > 30%",
    "rri_above_2_5": "RRI > 2.5",
    "rri_above_3_0": "RRI > 3.0",
}


def _compute_brier_score(predicted: float, actual: bool) -> float:
    """Brier score (0 = perfect, 1 = worst)."""
    return (predicted - (1 if actual else 0)) ** 2


class CalibrationEngine:
    """Tracks prediction accuracy and computes calibration metrics."""

    def __init__(self):
        self._cache: Optional[Dict] = None
        self._cache_time: Optional[datetime] = None

    async def compute(self) -> Dict:
        """Fetch all predictions from Supabase and compute calibration."""
        try:
            res = db.table("predictions").select("*")\
                .order("created_at", desc=True).limit(500).execute()
            records = res.data or []
        except Exception as e:
            return {"error": f"Failed to fetch predictions: {e}", "records": 0}

        if not records:
            return {
                "records": 0,
                "message": "No predictions found. They are generated during RRI recalculation.",
                "evaluated": 0,
            }

        # Separate evaluated vs pending
        evaluated = [r for r in records if r.get("evaluated_at") and r.get("hit_count") is not None]
        pending = [r for r in records if not r.get("evaluated_at")]

        # ── Overall metrics ──────────────────────────────────────
        total_hits = sum(r.get("hit_count", 0) for r in evaluated)
        total_misses = sum(r.get("miss_count", 0) for r in evaluated)
        total_predictions = total_hits + total_misses
        overall_accuracy = total_hits / max(total_predictions, 1)

        # ── Per-variable accuracy ────────────────────────────────
        var_hits: Dict[str, int] = Counter()
        var_misses: Dict[str, int] = Counter()
        var_total: Dict[str, int] = Counter()
        var_score: Dict[str, float] = defaultdict(float)

        for rec in evaluated:
            predictions = rec.get("predictions", []) or []
            actuals = rec.get("actuals", {}) or {}
            for pred in predictions:
                var = pred.get("variable", "unknown")
                actual = actuals.get(var)
                if actual is None:
                    continue
                var_total[var] += 1
                if actual == pred.get("predicted", False):
                    var_hits[var] += 1
                else:
                    var_misses[var] += 1
                # Brier score
                var_score[var] += _compute_brier_score(
                    pred.get("confidence", 0.5), actual
                )

        var_results = {}
        for var in sorted(set(list(var_hits.keys()) + list(var_misses.keys()))):
            total = var_total[var]
            hits = var_hits[var]
            var_results[var] = {
                "label": VARIABLE_LABELS.get(var, var),
                "hits": hits,
                "misses": var_misses[var],
                "total": total,
                "accuracy": round(hits / max(total, 1), 3),
                "brier_score": round(var_score[var] / max(total, 1), 3),
                # Category
                "category": self._get_category(var),
            }

        # ── Per-horizon accuracy ────────────────────────────────
        horizon_results = defaultdict(lambda: {"hits": 0, "misses": 0, "total": 0})
        for rec in evaluated:
            h = rec.get("horizon_days", 14)
            hits = rec.get("hit_count", 0)
            misses = rec.get("miss_count", 0)
            horizon_results[h]["hits"] += hits
            horizon_results[h]["misses"] += misses
            horizon_results[h]["total"] += hits + misses

        horizon_acc = {
            str(h): {
                "hits": d["hits"], "misses": d["misses"],
                "total": d["total"],
                "accuracy": round(d["hits"] / max(d["total"], 1), 3),
            }
            for h, d in sorted(horizon_results.items())
        }

        # ── Calibration curve ────────────────────────────────────
        # Group predictions by confidence decile, compute actual frequency
        decile_buckets = defaultdict(lambda: {"predicted": 0.0, "actual_true": 0, "count": 0})
        for rec in evaluated:
            predictions = rec.get("predictions", []) or []
            actuals = rec.get("actuals", {}) or {}
            for pred in predictions:
                var = pred.get("variable", "unknown")
                actual = actuals.get(var)
                if actual is None:
                    continue
                conf = pred.get("confidence", 0.5)
                decile = min(9, int(conf * 10))
                decile_buckets[decile]["predicted"] += conf
                decile_buckets[decile]["count"] += 1
                if actual:
                    decile_buckets[decile]["actual_true"] += 1

        calibration_curve = []
        for decile in range(10):
            b = decile_buckets[decile]
            if b["count"] == 0:
                calibration_curve.append({
                    "confidence_bin": f"{decile*10}-{(decile+1)*10}%",
                    "predicted_avg": (decile + 0.5) / 10,
                    "actual_frequency": 0,
                    "count": 0,
                })
            else:
                calibration_curve.append({
                    "confidence_bin": f"{decile*10}-{(decile+1)*10}%",
                    "predicted_avg": round(b["predicted"] / b["count"], 3),
                    "actual_frequency": round(b["actual_true"] / b["count"], 3),
                    "count": b["count"],
                })

        # ── Accuracy trend over time ────────────────────────────
        # Group by week
        weekly: Dict[str, list] = defaultdict(list)
        for rec in evaluated:
            try:
                dt_str = rec.get("predicted_at") or rec.get("created_at", "")
                dt = datetime.fromisoformat(dt_str.replace("Z", "+00:00"))
                week = dt.strftime("%Y-W%V")
                weekly[week].append({
                    "hits": rec.get("hit_count", 0),
                    "misses": rec.get("miss_count", 0),
                    "total": rec.get("hit_count", 0) + rec.get("miss_count", 0),
                })
            except: pass

        trend = []
        for week in sorted(weekly.keys()):
            entries = weekly[week]
            total_h = sum(e["hits"] for e in entries)
            total_m = sum(e["misses"] for e in entries)
            total = total_h + total_m
            trend.append({
                "week": week,
                "hits": total_h,
                "misses": total_m,
                "total": total,
                "accuracy": round(total_h / max(total, 1), 3),
            })

        # ── Overconfidence / underconfidence bias ────────────────
        conf_sum = 0.0
        conf_count = 0
        actual_positives = 0
        for rec in evaluated:
            predictions = rec.get("predictions", []) or []
            actuals = rec.get("actuals", {}) or {}
            for pred in predictions:
                var = pred.get("variable", "unknown")
                actual = actuals.get(var)
                if actual is None:
                    continue
                conf_sum += pred.get("confidence", 0.5)
                conf_count += 1
                if actual:
                    actual_positives += 1

        avg_confidence = conf_sum / max(conf_count, 1)
        base_rate = actual_positives / max(conf_count, 1)
        bias = round(avg_confidence - base_rate, 3)  # positive = overconfident

        result = {
            "records": len(records),
            "evaluated": len(evaluated),
            "pending": len(pending),
            "overall_accuracy": round(overall_accuracy, 3),
            "total_predictions": total_predictions,
            "total_hits": total_hits,
            "total_misses": total_misses,
            "by_variable": var_results,
            "by_horizon": horizon_acc,
            "calibration_curve": calibration_curve,
            "trend": trend,
            "bias": {
                "avg_confidence": round(avg_confidence, 3),
                "base_rate": round(base_rate, 3),
                "bias": bias,
                "bias_label": "Overconfident" if bias > 0.05 else "Underconfident" if bias < -0.05 else "Well-calibrated",
            },
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

        self._cache = result
        self._cache_time = datetime.now(timezone.utc)
        return result

    def _get_category(self, var: str) -> str:
        for cat, vars_list in VARIABLE_CATEGORIES.items():
            if var in vars_list:
                return cat
        return "other"

    def get_cached(self) -> Optional[Dict]:
        if self._cache and self._cache_time:
            age = (datetime.now(timezone.utc) - self._cache_time).total_seconds()
            if age < 120:
                return self._cache
        return None


# Singleton
_instance: Optional[CalibrationEngine] = None

def get_calibration_engine() -> CalibrationEngine:
    global _instance
    if _instance is None:
        _instance = CalibrationEngine()
    return _instance
