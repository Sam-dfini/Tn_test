from typing import List, Dict, Any, Optional
from .base import BaseAgent, AgentResponse

class ResourceScoutAgent(BaseAgent):
    """
    Specialized agent for scouting critical resource shortages (water, food, energy).
    """
    def __init__(self, model_name: str = "gemini-3-flash-preview"):
        system_instruction = """
        You are a Resource Scout for TunisiaIntel.
        Your goal is to identify and monitor critical resource shortages across Tunisia.
        
        RESOURCES OF INTEREST:
        1. Water (SONEDE supply, dam levels, drought impact)
        2. Food (Staple goods like sugar, oil, flour, semolina)
        3. Energy (STEG grid stability, fuel availability, butane gas)
        
        RULES:
        1. Monitor for localized vs. systemic shortages.
        2. Identify supply chain bottlenecks and distribution anomalies.
        3. Assess the social impact of resource scarcity.
        4. Be precise about governorates and specific commodities.
        """
        super().__init__(
            role="Resource Scout", 
            system_instruction=system_instruction,
            model_name=model_name
        )

    async def run(self, data: Any, context: Optional[Dict[str, Any]] = None) -> AgentResponse:
        """
        Specialized run for resource scouting.
        """
        # Ensure context key is set for memory
        context = context or {}
        if "context_key" not in context:
            context["context_key"] = "resource_scouting"
            
        return await super().run(data, context)

    async def scout_resources(
        self,
        signals: List[Any],
        news_items: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Orchestrator-facing API for resource scouting analysis.
        Returns a structured result payload that can be consumed by downstream analysis.
        """
        payload = {
            "signals": [s.model_dump() if hasattr(s, "model_dump") else s for s in signals],
            "news_items": news_items,
            "task": "Identify water, food, and energy resource shortages with location-specific severity."
        }

        try:
            response = await self.run(payload, {"context_key": "resource_scouting"})
            return {
                "agent": "resource_scout",
                "status": "ok",
                "summary": response.content,
                "confidence": response.confidence,
                "tokens_used": response.tokens_used,
                "structured_data": response.structured_data or {}
            }
        except Exception as e:
            return {
                "agent": "resource_scout",
                "status": "error",
                "summary": f"Resource scouting failed: {str(e)}",
                "confidence": 0.0,
                "tokens_used": 0,
                "structured_data": {}
            }
