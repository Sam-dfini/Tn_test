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

    async def run(self, data: Any, context: Optional[Dict[str, Any]] = None) -> AgentResponse:
        """
        Specialized run for security analysis.
        """
        # Ensure context key is set for memory
        context = context or {}
        if "context_key" not in context:
            context["context_key"] = "security_analysis"
            
        return await super().run(data, context)

    async def analyze_security(
        self,
        security_context: Dict[str, Any],
        signals: List[Any]
    ) -> Dict[str, Any]:
        payload = {
            "security_context": security_context,
            "signals": [s.model_dump() if hasattr(s, "model_dump") else s for s in signals],
            "task": "Assess institutional fragility, elite stability, and short-term regime security risks."
        }
        try:
            response = await self.run(payload, {"context_key": "security_analysis"})
            return {
                "agent": "security_analyst",
                "status": "ok",
                "summary": response.content,
                "confidence": response.confidence,
                "tokens_used": response.tokens_used,
                "structured_data": response.structured_data or {}
            }
        except Exception as e:
            return {
                "agent": "security_analyst",
                "status": "error",
                "summary": f"Security analysis failed: {str(e)}",
                "confidence": 0.0,
                "tokens_used": 0,
                "structured_data": {}
            }
