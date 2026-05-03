from typing import List, Dict, Any, Optional
from .models import Signal
from datetime import datetime, timedelta
import numpy as np

class DeduplicationEngine:
    """
    Detects and merges similar signals from multiple sources.
    """
    def __init__(self, similarity_threshold: float = 0.8):
        self.similarity_threshold = similarity_threshold

    def calculate_similarity(self, signal_a: Signal, signal_b: Signal) -> float:
        """
        Calculates similarity between two signals based on text, location, and timestamp.
        """
        # 1. Location similarity (binary for now)
        location_sim = 1.0 if signal_a.location == signal_b.location else 0.0
        
        # 2. Timestamp similarity (decays over 24 hours)
        time_diff = abs((signal_a.timestamp - signal_b.timestamp).total_seconds())
        time_sim = max(0, 1.0 - (time_diff / (24 * 3600)))
        
        # 3. Type similarity
        type_sim = 1.0 if signal_a.type == signal_b.type else 0.0
        
        # 4. Text similarity (placeholder for more advanced NLP)
        # In a real system, we'd use embeddings and cosine similarity
        text_sim = 0.5 # Placeholder
        
        # Weighted average
        similarity = (location_sim * 0.3) + (time_sim * 0.2) + (type_sim * 0.2) + (text_sim * 0.3)
        return similarity

    def merge_signals(self, signals: List[Signal]) -> Signal:
        """
        Merges multiple similar signals into a single enriched signal.
        """
        if not signals:
            raise ValueError("No signals to merge")
        
        if len(signals) == 1:
            return signals[0]

        # Use the most recent signal as the base
        base_signal = sorted(signals, key=lambda x: x.timestamp, reverse=True)[0]
        
        # Aggregate intensities and confidence
        intensities = [s.intensity for s in signals]
        confidences = [s.confidence_score for s in signals]
        
        # Confidence booster: more sources = higher confidence
        source_count = len(set(s.source_id for s in signals))
        confidence_boost = min(0.2, (source_count - 1) * 0.05)
        
        # Merge tags and entities
        all_tags = set()
        all_entities = []
        for s in signals:
            all_tags.update(s.tags)
            all_entities.extend(s.extracted_entities)
            
        # Deduplicate entities by name
        unique_entities = {e["name"]: e for e in all_entities if "name" in e}.values()

        return Signal(
            id=base_signal.id,
            type=base_signal.type,
            subtype=base_signal.subtype,
            location=base_signal.location,
            timestamp=base_signal.timestamp,
            intensity=np.mean(intensities),
            source_id="merged",
            source_reliability_score=np.mean([s.source_reliability_score for s in signals]),
            confidence_score=min(1.0, np.mean(confidences) + confidence_boost),
            raw_text=base_signal.raw_text, # Keep the most recent/detailed text
            extracted_entities=list(unique_entities),
            tags=list(all_tags),
            metadata={
                "merged_count": len(signals),
                "original_ids": [str(s.id) for s in signals],
                "source_ids": list(set(s.source_id for s in signals))
            }
        )
