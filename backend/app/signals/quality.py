from typing import List, Dict, Any, Optional
from .models import Signal
from datetime import datetime, timedelta

class SignalQualityLayer:
    """
    Validates signal ranges, removes noise, and rejects malformed data.
    """
    def __init__(self):
        self.validation_rules = {
            "intensity": lambda x: 0 <= x <= 1,
            "confidence": lambda x: 0 <= x <= 1,
            "timestamp": lambda x: x <= datetime.now() + timedelta(minutes=5) # Allow for slight clock skew
        }

    def validate_signal(self, signal: Signal) -> Dict[str, Any]:
        """
        Validates a signal against predefined rules.
        """
        errors = []
        
        # 1. Range validation
        if not self.validation_rules["intensity"](signal.intensity):
            errors.append(f"Invalid intensity: {signal.intensity}")
        
        if not self.validation_rules["confidence"](signal.confidence_score):
            errors.append(f"Invalid confidence score: {signal.confidence_score}")
            
        if not self.validation_rules["timestamp"](signal.timestamp):
            errors.append(f"Invalid timestamp: {signal.timestamp} (future date)")
            
        # 2. Noise filtering (e.g., empty text or location)
        if not signal.raw_text or len(signal.raw_text.strip()) < 10:
            errors.append("Signal text too short or empty (noise)")
            
        if not signal.location or len(signal.location.strip()) < 2:
            errors.append("Signal location missing or invalid")
            
        # 3. Malformed data rejection
        if not signal.type:
            errors.append("Signal type missing")

        return {
            "is_valid": len(errors) == 0,
            "errors": errors,
            "signal": signal
        }

    def apply_confidence_decay(self, signal: Signal) -> Signal:
        """
        Applies temporal decay to signal confidence.
        Confidence drops by decay_rate per hour of age.
        """
        now = datetime.now()
        age_hours = (now - signal.timestamp).total_seconds() / 3600.0
        
        if age_hours > 0:
            original_confidence = signal.confidence_score
            signal.confidence_score = max(0.1, signal.confidence_score - (age_hours * signal.decay_rate))
            
            # Record decay in provenance
            signal.provenance.append({
                "action": "confidence_decay",
                "timestamp": now.isoformat(),
                "agent": "SignalQualityLayer",
                "reasoning": f"Temporal decay applied. Age: {age_hours:.1f}h. Confidence: {original_confidence:.2f} -> {signal.confidence_score:.2f}"
            })
            
            if signal.confidence_score <= 0.2:
                signal.is_expired = True
                
        return signal

    def filter_noise(self, signals: List[Signal]) -> List[Signal]:
        """
        Filters out noise signals from a list.
        """
        valid_signals = []
        for s in signals:
            validation = self.validate_signal(s)
            if validation["is_valid"]:
                valid_signals.append(s)
            else:
                print(f"Signal rejected: {validation['errors']}")
        return valid_signals
