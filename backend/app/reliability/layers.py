import asyncio
from typing import List, Dict, Any, Optional
import numpy as np
from datetime import datetime, timedelta
from ..core.database import db

class DataQualityLayer:
    """
    Ensures data integrity, filters noise, and scores source reliability.
    """
    def __init__(self):
        self.validation_rules = {
            "percentage": lambda x: 0 <= x <= 100,
            "index": lambda x: 0 <= x <= 1,
            "non_negative": lambda x: x >= 0
        }

    async def validate_signal(self, signal: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validates a signal against predefined rules and filters noise.
        """
        extracted_data = signal.get("extracted_data", {})
        validated_data = {}
        errors = []

        for key, value in extracted_data.items():
            # 1. Basic type check
            if not isinstance(value, (int, float)):
                errors.append(f"Invalid type for {key}: {type(value)}")
                continue

            # 2. Rule-based validation
            # (In a real system, we'd map keys to rules)
            is_valid = True
            if "rate" in key or "percent" in key:
                is_valid = self.validation_rules["percentage"](value)
            elif "index" in key:
                is_valid = self.validation_rules["index"](value)
            
            if is_valid:
                validated_data[key] = value
            else:
                errors.append(f"Value out of range for {key}: {value}")

        # 3. Source Reliability Scoring
        reliability_score = await self._compute_source_score(signal.get("source_url"))

        return {
            "is_valid": len(validated_data) > 0,
            "validated_data": validated_data,
            "errors": errors,
            "reliability_score": reliability_score
        }

    async def _compute_source_score(self, source_url: Optional[str]) -> float:
        """
        Computes a dynamic reliability score for a source based on historical accuracy.
        """
        if not source_url:
            return 0.5
        
        # In a real system, we'd query the 'source_reliability' table
        # For now, return a placeholder
        return 0.85

class ValidationLayer:
    """
    Handles backtesting, confidence scoring, and accuracy metrics.
    """
    async def backtest(self, prediction_id: str, actual_outcome: float) -> Dict[str, Any]:
        """
        Compares a past prediction with the real outcome.
        """
        # 1. Fetch prediction from DB
        # prediction = db.table("scenarios").select("*").eq("id", prediction_id).single().execute()
        
        # 2. Compute error metrics
        predicted_value = 0.7 # Placeholder
        error = abs(predicted_value - actual_outcome)
        accuracy = 1 - error # Simplified
        
        # 3. Store results
        # db.table("accuracy_metrics").insert({
        #     "prediction_id": prediction_id,
        #     "error": error,
        #     "accuracy": accuracy,
        #     "timestamp": datetime.now()
        # }).execute()
        
        return {
            "error": error,
            "accuracy": accuracy
        }

    def compute_confidence_score(self, signal_weights: List[float], source_scores: List[float]) -> float:
        """
        Computes a confidence score for a fused signal.
        """
        if not signal_weights:
            return 0.0
        
        # Combine signal weights and source reliability
        avg_weight = np.mean(signal_weights)
        avg_source = np.mean(source_scores)
        
        return (avg_weight * 0.4) + (avg_source * 0.6)

class FeedbackSystem:
    """
    Implements reward mechanisms and dynamic model updates.
    """
    async def process_feedback(self, agent_id: str, accuracy_score: float):
        """
        Updates agent performance metrics and adjusts internal weights.
        """
        # 1. Update agent performance in DB
        def _db_update():
            perf = db.table("agent_performance").select("*").eq("agent_id", agent_id).single().execute()
            if perf.data:
                total_tasks = perf.data["total_tasks"] + 1
                avg_accuracy = (perf.data["avg_accuracy"] * (total_tasks - 1) + accuracy_score) / total_tasks
                current_weight = perf.data["current_weight"]
                if accuracy_score > 0.8:
                    current_weight = min(1.5, current_weight * 1.05)
                elif accuracy_score < 0.5:
                    current_weight = max(0.5, current_weight * 0.95)
                status = "ACTIVE"
                if avg_accuracy < 0.4 and total_tasks > 10:
                    status = "FLAGGED"
                db.table("agent_performance").update({
                    "total_tasks": total_tasks,
                    "avg_accuracy": round(avg_accuracy, 4),
                    "current_weight": round(current_weight, 4),
                    "status": status,
                    "last_recalibrated_at": datetime.now().isoformat()
                }).eq("agent_id", agent_id).execute()
            else:
                db.table("agent_performance").insert({
                    "agent_id": agent_id,
                    "total_tasks": 1,
                    "avg_accuracy": accuracy_score,
                    "current_weight": 1.0,
                    "status": "ACTIVE"
                }).execute()
        try:
            # Run sync DB ops in thread to avoid blocking the event loop
            await asyncio.to_thread(_db_update)
        except Exception as e:
            print(f"Failed to process feedback for {agent_id}: {e}")

class SignalLifecycleManager:
    """
    Tracks signal age, applies decay, and handles expiration.
    """
    def apply_decay(self, signal: Dict[str, Any]) -> Dict[str, Any]:
        """
        Calculates the current intensity of a signal based on its age and decay rate.
        """
        timestamp = signal.get("timestamp")
        if isinstance(timestamp, str):
            timestamp = datetime.fromisoformat(timestamp)
        
        age_hours = (datetime.now() - timestamp).total_seconds() / 3600
        decay_rate = signal.get("decay_rate", 0.01)
        
        # Exponential decay: I(t) = I0 * e^(-k*t)
        original_intensity = signal.get("intensity", 1.0)
        current_intensity = original_intensity * np.exp(-decay_rate * age_hours)
        
        signal["intensity"] = max(0.0, round(current_intensity, 4))
        
        # Check for expiration
        expires_at = signal.get("expires_at")
        if expires_at:
            if isinstance(expires_at, str):
                expires_at = datetime.fromisoformat(expires_at)
            if datetime.now() > expires_at:
                signal["is_expired"] = True
        
        return signal

class ConflictResolver:
    """
    Resolves disagreements between multiple sources and tracks uncertainty.
    """
    def resolve(self, signals: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Merges conflicting signals and computes an uncertainty score.
        """
        if not signals:
            return {}

        values = [s.get("intensity", 0) for s in signals]
        confidences = [s.get("confidence_score", 0.5) for s in signals]
        reliability_scores = [s.get("source_reliability_score", 0.5) for s in signals]

        # Weighted average value
        weights = np.array(confidences) * np.array(reliability_scores)
        if sum(weights) == 0:
            weights = np.ones(len(signals))
            
        resolved_value = np.average(values, weights=weights)
        
        # Uncertainty score based on variance of values and average confidence
        # High variance + low confidence = high uncertainty
        variance = np.var(values) if len(values) > 1 else 0
        avg_confidence = np.mean(confidences)
        
        # Uncertainty = (Variance * 0.7) + ((1 - Avg Confidence) * 0.3)
        # Normalize variance (assuming max variance is 0.25 for 0-1 range)
        norm_variance = min(1.0, variance / 0.25)
        uncertainty_score = (norm_variance * 0.7) + ((1 - avg_confidence) * 0.3)

        return {
            "resolved_value": round(resolved_value, 4),
            "uncertainty_score": round(uncertainty_score, 4),
            "source_count": len(signals),
            "disagreement_level": "HIGH" if norm_variance > 0.1 else "LOW"
        }

class RiskDecompositionEngine:
    """
    Explains RRI changes by identifying contributing variables.
    """
    def decompose(self, current_rri: float, previous_rri: float, variables: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Identifies which variables contributed most to the RRI change.
        """
        diff = current_rri - previous_rri
        contributions = []
        
        for var in variables:
            # Simplified contribution analysis
            # Contribution = (Var Change * Var Weight) / Total RRI Change
            change = var.get("change", 0)
            weight = var.get("weight", 0.05)
            impact = change * weight
            
            contributions.append({
                "variable": var.get("code"),
                "impact": impact,
                "percentage": (impact / diff) if diff != 0 else 0
            })
            
        # Sort by absolute impact
        contributions.sort(key=lambda x: abs(x["impact"]), reverse=True)
        return contributions
