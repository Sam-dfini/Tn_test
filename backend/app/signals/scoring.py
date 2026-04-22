from typing import List, Dict, Any, Optional
from datetime import datetime
from .models import Source
from ..core.database import db

class SourceScoringSystem:
    """
    Evaluates and updates source reliability based on historical performance.
    """
    def __init__(self):
        self.table = "sources"

    async def get_source(self, source_id: str) -> Optional[Source]:
        """
        Retrieves source metadata from the registry.
        """
        response = db.table(self.table).select("*").eq("id", source_id).execute()
        if response.data:
            return Source(**response.data[0])
        return None

    async def update_reliability(self, source_id: str, accuracy_delta: float):
        """
        Updates source reliability score based on a new accuracy measurement.
        Formula: new_score = (old_score * N + new_accuracy) / (N + 1)
        """
        source = await self.get_source(source_id)
        if not source:
            return

        # Simple moving average for reliability
        alpha = 0.1 # Weight for new data
        new_reliability = (1 - alpha) * source.reliability_score + alpha * (source.historical_accuracy + accuracy_delta)
        new_accuracy = (1 - alpha) * source.historical_accuracy + alpha * accuracy_delta

        db.table(self.table).update({
            "reliability_score": max(0, min(1, new_reliability)),
            "historical_accuracy": max(0, min(1, new_accuracy)),
            "last_updated": datetime.now().isoformat()
        }).eq("id", source_id).execute()

    def calculate_signal_weight(self, source_reliability: float, confidence: float, recency_hours: float, severity: float, decay_rate: float = 0.05) -> float:
        """
        Calculates the final weight of a signal before fusion.
        Factors: Source reliability (40%), Confidence (25%), Recency (25%), Severity (10%)
        Applies confidence decay for stale intelligence.
        """
        # Linear decay based on age (recency_hours)
        decayed_confidence = max(0.1, confidence - (recency_hours * decay_rate))
        
        # Recency factor: decays over time (e.g., half-life of 24 hours)
        recency_factor = 1.0 / (1.0 + (recency_hours / 24.0))
        
        weight = (source_reliability * 0.4) + (decayed_confidence * 0.25) + (recency_factor * 0.25) + (severity * 0.1)
        return max(0, min(1, weight))
