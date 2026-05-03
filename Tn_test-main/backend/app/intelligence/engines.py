from typing import List, Dict, Any, Optional
import numpy as np
from datetime import datetime

class FusionEngine:
    """
    Combines multiple data sources (RSS, reports, variables) into normalized signals.
    """
    def __init__(self):
        self.source_reliability = {
            "OFFICIAL_STATISTICS": 1.0,
            "INTERNATIONAL_REPORTS": 0.9,
            "RELIABLE_NEWS": 0.8,
            "SOCIAL_MEDIA": 0.4,
            "UNVERIFIED_REPORTS": 0.2
        }

    def fuse(self, signals: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Normalizes and weights signals based on confidence and source reliability.
        """
        if not signals:
            return {}

        fused_data = {}
        for signal in signals:
            source_type = signal.get("source_type", "UNVERIFIED_REPORTS")
            reliability = self.source_reliability.get(source_type, 0.2)
            confidence = signal.get("confidence", 1.0)
            weight = reliability * confidence

            for key, value in signal.get("extracted_data", {}).items():
                if key not in fused_data:
                    fused_data[key] = {"values": [], "weights": []}
                fused_data[key]["values"].append(value)
                fused_data[key]["weights"].append(weight)

        # Weighted average for each key
        result = {}
        for key, data in fused_data.items():
            values = np.array(data["values"])
            weights = np.array(data["weights"])
            result[key] = np.average(values, weights=weights)

        return result

class CorrelationEngine:
    """
    Detects relationships between variables across the 250-variable matrix.
    """
    def compute_correlation(self, var_a_history: List[float], var_b_history: List[float]) -> float:
        """
        Computes the Pearson correlation coefficient between two variable histories.
        """
        if len(var_a_history) != len(var_b_history) or len(var_a_history) < 2:
            return 0.0
        
        correlation_matrix = np.corrcoef(var_a_history, var_b_history)
        return correlation_matrix[0, 1]

    def identify_leading_indicator(self, var_a: List[float], var_b: List[float], max_lag: int = 10) -> Dict[str, Any]:
        """
        Identifies if var_a is a leading indicator for var_b by testing different lags.
        """
        best_lag = 0
        best_corr = 0.0
        
        for lag in range(1, max_lag + 1):
            # Shift var_a forward (lagging it relative to var_b)
            # Actually, to see if var_a leads var_b, we compare var_a[t] with var_b[t+lag]
            a_segment = var_a[:-lag]
            b_segment = var_b[lag:]
            
            if len(a_segment) < 2: continue
            
            corr = np.corrcoef(a_segment, b_segment)[0, 1]
            if abs(corr) > abs(best_corr):
                best_corr = corr
                best_lag = lag
                
        return {"lag": best_lag, "correlation": best_corr}

class AnomalyDetectionEngine:
    """
    Detects abnormal spikes or drops using statistical and rule-based methods.
    """
    def detect(self, current_value: float, history: List[float], threshold_sigma: float = 3.0) -> Dict[str, Any]:
        """
        Detects anomalies based on standard deviation (Z-score).
        """
        if not history or len(history) < 5:
            return {"is_anomaly": False}

        # Filter out NaN values from history
        clean_history = [v for v in history if v is not None and not np.isnan(v)]
        
        if not clean_history or len(clean_history) < 5:
            return {"is_anomaly": False}

        mean = np.mean(clean_history)
        std = np.std(clean_history)
        
        if std == 0 or np.isnan(std):
            return {"is_anomaly": False}

        z_score = (current_value - mean) / std
        is_anomaly = abs(z_score) > threshold_sigma

        severity = "LOW"
        if abs(z_score) > 5.0: severity = "CRITICAL"
        elif abs(z_score) > 4.0: severity = "HIGH"
        elif abs(z_score) > 3.0: severity = "MEDIUM"

        return {
            "is_anomaly": is_anomaly,
            "z_score": z_score,
            "severity": severity,
            "expected_value": mean,
            "deviation_percent": (current_value - mean) / mean if mean != 0 else 0
        }

class CausalityEngine:
    """
    Distinguishes causal vs correlated variables and updates the graph.
    """
    def identify_causality(self, var_a_history: List[float], var_b_history: List[float], max_lag: int = 10) -> Dict[str, Any]:
        """
        Tests for Granger causality (simplified) by checking if var_a's past predicts var_b's future.
        """
        if len(var_a_history) != len(var_b_history) or len(var_a_history) < max_lag + 5:
            return {"is_causal": False, "confidence": 0.0}

        best_lag = 0
        best_strength = 0.0
        
        for lag in range(1, max_lag + 1):
            # var_a[t-lag] predicts var_b[t]
            a_past = var_a_history[:-lag]
            b_current = var_b_history[lag:]
            
            corr = np.corrcoef(a_past, b_current)[0, 1]
            if abs(corr) > abs(best_strength):
                best_strength = corr
                best_lag = lag
        
        # If strength is high and lag is clear, we assume causal potential
        is_causal = abs(best_strength) > 0.6
        return {
            "is_causal": is_causal,
            "strength": round(best_strength, 4),
            "lag_days": best_lag,
            "confidence": round(abs(best_strength) * 0.8, 4) # Simplified confidence
        }

class TemporalPatternEngine:
    """
    Detects repeating cycles (weekly, seasonal) in variables.
    """
    def detect_patterns(self, history: List[float], timestamps: List[datetime]) -> List[Dict[str, Any]]:
        """
        Uses Fourier Transform (simplified) or autocorrelation to find cycles.
        """
        if len(history) < 14: # Need at least 2 weeks for weekly pattern
            return []

        patterns = []
        
        # 1. Weekly Pattern Check (Autocorrelation at lag 7)
        if len(history) >= 21:
            weekly_corr = np.corrcoef(history[:-7], history[7:])[0, 1]
            if weekly_corr > 0.7:
                patterns.append({
                    "type": "WEEKLY",
                    "confidence": round(weekly_corr, 4),
                    "period_days": 7.0
                })

        # 2. Seasonal Pattern Check (Simplified)
        if len(history) >= 180: # Need at least 6 months
            # Check for 30-day (monthly) cycles
            monthly_corr = np.corrcoef(history[:-30], history[30:])[0, 1]
            if monthly_corr > 0.6:
                patterns.append({
                    "type": "MONTHLY",
                    "confidence": round(monthly_corr, 4),
                    "period_days": 30.0
                })

        return patterns

class ScenarioSimulator:
    """
    Simulates "what-if" scenarios and their impact on the RRI.
    """
    def simulate(self, base_rri: float, inputs: Dict[str, float], correlations: List[Dict[str, Any]]) -> float:
        """
        Predicts the new RRI based on input changes and their correlated impacts.
        """
        # Simplified simulation logic:
        # New RRI = Base RRI + Sum(Input Change * Weight) + Sum(Correlated Indirect Impacts)
        
        predicted_change = 0.0
        
        # 1. Direct impacts (assuming weights are normalized)
        for var_code, change_percent in inputs.items():
            # In a real system, we'd look up the variable's weight in the RRI calculation
            weight = 0.1 # Placeholder
            predicted_change += change_percent * weight
            
        # 2. Indirect impacts via correlations
        for corr in correlations:
            var_a = corr["variable_a_code"]
            var_b = corr["variable_b_code"]
            coeff = corr["coefficient"]
            
            if var_a in inputs:
                # If var_a changes, it impacts var_b by coeff * change
                indirect_impact = inputs[var_a] * coeff * 0.05 # 0.05 is a damping factor
                predicted_change += indirect_impact
                
        return round(base_rri + predicted_change, 4)
