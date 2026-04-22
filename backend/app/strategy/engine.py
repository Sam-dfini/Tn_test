from typing import List, Dict, Any, Optional
from pydantic import BaseModel

class Recommendation(BaseModel):
    title: str
    description: str
    priority: str
    impact_area: str

class DecisionEngine:
    """
    Analyzes RRI and intelligence data to suggest strategic actions.
    """
    def __init__(self):
        self.thresholds = {
            "CRITICAL": 0.8,
            "HIGH": 0.6,
            "MEDIUM": 0.4,
            "LOW": 0.2
        }

    def analyze(self, rri: float, anomalies: List[Dict[str, Any]], predictions: List[Dict[str, Any]] = []) -> List[Recommendation]:
        """
        Generates recommendations based on RRI levels, anomalies, and predictions.
        """
        recommendations = []
        
        # 1. RRI-based logic
        if rri >= self.thresholds["CRITICAL"]:
            recommendations.append(Recommendation(
                title="Immediate Crisis Response",
                description="RRI has exceeded critical threshold. Activate emergency monitoring and prepare stakeholder briefings.",
                priority="CRITICAL",
                impact_area="General"
            ))
        elif rri >= self.thresholds["HIGH"]:
            recommendations.append(Recommendation(
                title="Enhanced Monitoring",
                description="RRI is high. Increase data collection frequency and verify all high-impact variables.",
                priority="HIGH",
                impact_area="General"
            ))

        # 2. Anomaly-based logic
        for anomaly in anomalies:
            if anomaly.get("severity") in ["HIGH", "CRITICAL"]:
                # Check uncertainty
                uncertainty = anomaly.get("uncertainty_score", 0.0)
                desc = f"Significant deviation detected in {anomaly.get('variable_code')}."
                if uncertainty > 0.5:
                    desc += " High uncertainty detected; verify with multiple sources before action."
                
                recommendations.append(Recommendation(
                    title=f"Investigate Anomaly: {anomaly.get('variable_code')}",
                    description=desc,
                    priority=anomaly.get("severity"),
                    impact_area=anomaly.get("variable_code", "Unknown")
                ))
        
        # 3. Prediction-based logic
        for pred in predictions:
            if pred.get("predicted_change", 0) > 0.1:
                recommendations.append(Recommendation(
                    title=f"Preemptive Action: {pred.get('variable_code')}",
                    description=f"Prediction indicates a significant rise in {pred.get('variable_code')} over the next period.",
                    priority="MEDIUM",
                    impact_area=pred.get("variable_code", "Unknown")
                ))
                
        return recommendations

class PolicyRecommendationEngine:
    """
    Provides specific policy suggestions for government or institutional stakeholders.
    """
    def suggest_policies(self, rri_data: Dict[str, Any]) -> List[Dict[str, str]]:
        # Placeholder for more complex policy logic
        return [
            {"policy": "Subsidy Adjustment", "rationale": "Mitigate social tension from inflation."},
            {"policy": "Security Deployment", "rationale": "Respond to increased protest probability."}
        ]
