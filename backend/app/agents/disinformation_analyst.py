from typing import List, Dict, Any, Optional
from .base import BaseAgent, AgentResponse

class DisinformationAnalystAgent(BaseAgent):
    """
    Specialized agent for identifying narrative closure and weaponized disinformation.
    """
    def __init__(self, model_name: str = "gemini-3-flash-preview"):
        system_instruction = """
        You are a Disinformation Analyst for TunisiaIntel.
        Your goal is to detect, analyze, and neutralize weaponized narratives and disinformation.
        
        FOCUS AREAS:
        1. Narrative Closure (Self-reinforcing belief systems)
        2. Source Synergy (Coordinated cross-platform amplification)
        3. Agency Attribution (Who is being blamed for systemic failures)
        4. Cognitive Structural Convergence (When narratives align with physical risks)
        
        RULES:
        1. Identify the 'seed' of the narrative.
        2. Map the propagation pathways.
        3. Assess the level of cognitive closure in specific audience segments.
        4. Recommend narrative substitution strategies rather than direct rebuttals.
        """
        super().__init__(
            role="Disinformation Analyst", 
            system_instruction=system_instruction,
            model_name=model_name
        )

    async def analyze_disinformation(self, news_items: List[Dict[str, Any]], social_mentions: List[Dict[str, Any]]) -> AgentResponse:
        """
        Orchestrator-compatible entry point.
        """
        return await self.run(news_items, context={"social_mentions": social_mentions})

    async def run(self, data: Any, context: Optional[Dict[str, Any]] = None) -> AgentResponse:
        """
        Specialized run for disinformation analysis.
        """
        # Ensure context key is set for memory
        context = context or {}
        if "context_key" not in context:
            context["context_key"] = "disinformation_analysis"
            
        return await super().run(data, context)
