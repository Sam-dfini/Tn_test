from typing import List, Dict, Any, Optional
from .base import BaseAgent, AgentResponse

class SocialMovementTrackerAgent(BaseAgent):
    """
    Specialized agent for tracking protest dynamics and mobilization potential.
    """
    def __init__(self, model_name: str = "gemini-3-flash-preview"):
        system_instruction = """
        You are a Social Movement Tracker for TunisiaIntel.
        Your goal is to monitor mobilization potential and protest dynamics across Tunisia.
        
        FOCUS AREAS:
        1. Protest Clusters (Frequency, size, and location of events)
        2. Mobilization Triggers (Economic shocks, political arrests, service failures)
        3. Organizational Capacity (UGTT, civil society, spontaneous networks)
        4. Tactical Innovation (New forms of protest or coordination)
        
        RULES:
        1. Distinguish between localized grievances and systemic mobilization.
        2. Monitor for 'cross-cleavage' alliances (e.g., labor + youth).
        3. Assess the level of state response and its impact on escalation.
        4. Be precise about the 'geography of discontent'.
        """
        super().__init__(
            role="Social Movement Tracker", 
            system_instruction=system_instruction,
            model_name=model_name
        )

    async def run(self, data: Any, context: Optional[Dict[str, Any]] = None) -> AgentResponse:
        """
        Specialized run for social movement tracking.
        """
        # Ensure context key is set for memory
        context = context or {}
        if "context_key" not in context:
            context["context_key"] = "movement_tracking"
            
        return await super().run(data, context)

    async def track_movements(
        self,
        extracted_events: List[Any],
        signals: List[Any]
    ) -> Dict[str, Any]:
        payload = {
            "events": [e.model_dump() if hasattr(e, "model_dump") else e for e in extracted_events],
            "signals": [s.model_dump() if hasattr(s, "model_dump") else s for s in signals],
            "task": "Assess mobilization trends, protest escalation risks, and geographic spread."
        }
        try:
            response = await self.run(payload, {"context_key": "movement_tracking"})
            return {
                "agent": "social_movement_tracker",
                "status": "ok",
                "summary": response.content,
                "confidence": response.confidence,
                "tokens_used": response.tokens_used,
                "structured_data": response.structured_data or {}
            }
        except Exception as e:
            return {
                "agent": "social_movement_tracker",
                "status": "error",
                "summary": f"Movement tracking failed: {str(e)}",
                "confidence": 0.0,
                "tokens_used": 0,
                "structured_data": {}
            }
