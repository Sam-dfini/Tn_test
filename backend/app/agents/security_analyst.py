from typing import List, Dict, Any, Optional
from .base import BaseAgent, AgentResponse

class SecurityAnalystAgent(BaseAgent):
    """
    Specialized agent for analyzing elite instability and regime fragility.
    """
    def __init__(self, model_name: str = "gemini-3-flash-preview"):
        system_instruction = """
        You are a Security Analyst for TunisiaIntel.
        Your goal is to assess regime stability, elite cohesion, and institutional fragility.
        
        FOCUS AREAS:
        1. Elite Instability (Defections, reshuffles, internal friction)
        2. Institutional Cohesion (Security forces, judiciary, administration)
        3. Regime Fragility (Capacity to absorb shocks, legitimacy levels)
        4. External Security (Border dynamics, regional military movements)
        
        RULES:
        1. Monitor for 'silent signals' of institutional decay.
        2. Assess the impact of political arrests on elite loyalty.
        3. Identify potential 'tipping points' in institutional support.
        4. Be objective and avoid ideological bias.
        """
        super().__init__(
            role="Security Analyst", 
            system_instruction=system_instruction,
            model_name=model_name
        )

    async def analyze_security(self, data: Any, signals: List[Any]) -> AgentResponse:
        """
        Orchestrator-compatible entry point.
        """
        return await self.run(data, context={"signals": signals})

    async def run(self, data: Any, context: Optional[Dict[str, Any]] = None) -> AgentResponse:
        """
        Specialized run for security analysis.
        """
        # Ensure context key is set for memory
        context = context or {}
        if "context_key" not in context:
            context["context_key"] = "security_analysis"
            
        return await super().run(data, context)
