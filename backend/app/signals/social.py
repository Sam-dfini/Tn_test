from typing import List, Dict, Any, Optional
from .models import Signal
from datetime import datetime, timedelta
import numpy as np

class SocialSignalAggregator:
    """
    Aggregates signals from trusted social media accounts and uses them as confidence boosters.
    """
    def __init__(self, threshold_mentions: int = 50):
        self.threshold_mentions = threshold_mentions

    def aggregate_social_signals(self, raw_mentions: List[Dict[str, Any]]) -> List[Signal]:
        """
        Aggregates raw social media mentions into structured signals.
        """
        # Group mentions by keyword/topic and location
        topics = {}
        for mention in raw_mentions:
            topic = mention.get("topic", "general")
            location = mention.get("location", "Tunisia")
            key = f"{topic}_{location}"
            
            if key not in topics:
                topics[key] = []
            topics[key].append(mention)
            
        aggregated_signals = []
        for key, mentions in topics.items():
            if len(mentions) < self.threshold_mentions:
                continue
            
            # Threshold-based activation: 50+ mentions
            # Calculate intensity based on volume and sentiment
            volume = len(mentions)
            # Intensity = log10(volume) / 4 (e.g., 10000 mentions = 1.0 intensity)
            intensity = min(1.0, np.log10(volume) / 4.0)
            
            # Average sentiment (if available)
            sentiments = [m.get("sentiment", 0.5) for m in mentions]
            
            topic, location = key.split("_")
            
            signal = Signal(
                type="social_trend",
                subtype=topic,
                location=location,
                timestamp=datetime.now(),
                intensity=intensity,
                source_id="social_aggregator",
                source_reliability_score=0.4, # Social media is low reliability by default
                confidence_score=min(0.6, intensity * 0.8), # Confidence is capped for social signals
                raw_text=f"Social trend detected for {topic} in {location} with {volume} mentions.",
                tags=["social", topic, location],
                metadata={
                    "mention_count": volume,
                    "avg_sentiment": np.mean(sentiments)
                }
            )
            aggregated_signals.append(signal)
            
        return aggregated_signals

    def boost_confidence(self, signal: Signal, social_signals: List[Signal]) -> Signal:
        """
        Uses social signals to boost the confidence of a primary signal.
        """
        for social in social_signals:
            # If social signal matches the primary signal's topic and location
            if social.subtype == signal.type and social.location == signal.location:
                # Boost confidence by up to 0.15
                boost = min(0.15, social.intensity * 0.2)
                signal.confidence_score = min(1.0, signal.confidence_score + boost)
                signal.tags.append("social_confirmed")
                break
        return signal
