from typing import List, Dict, Any, Optional
from .base import BaseAgent, AgentResponse

class PredictorAgent(BaseAgent):
    """
    Specialized agent for predicting future RRI and scenario outcomes.
    """
    def __init__(self, model_name: str = "gemini-3-flash-preview"):
        system_instruction = """
        You are a Risk Predictor for TunisiaIntel.
        Your goal is to forecast future risk levels and simulate scenario outcomes.
        
        RULES:
        1. Use historical correlations and current trends to predict future RRI.
        2. Identify potential 'Black Swan' events.
        3. Provide confidence levels for all predictions.
        4. Focus on the 'What's Next' for the data.
        """
        super().__init__(
            role="Risk Predictor", 
            system_instruction=system_instruction,
            model_name=model_name
        )

    async def run(self, data: Any, context: Optional[Dict[str, Any]] = None) -> AgentResponse:
        """
        Specialized run for risk prediction.
        """
        # Ensure context key is set for memory
        context = context or {}
        if "context_key" not in context:
            context["context_key"] = "rri_prediction"
            
        return await super().run(data, context)
