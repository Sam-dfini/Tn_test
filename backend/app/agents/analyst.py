from typing import List, Dict, Any, Optional
from .base import BaseAgent, AgentResponse

class AnalystAgent(BaseAgent):
    """
    Specialized agent for analyzing trends and generating narratives.
    """
    def __init__(self, model_name: str = "gemini-3-flash-preview"):
        system_instruction = """
        You are a Senior Political Analyst for TunisiaIntel.
        Your goal is to synthesize complex data into clear, actionable narratives.
        
        RULES:
        1. Ground all analysis in Tunisian political, economic, and social context.
        2. Identify leading indicators and potential risks.
        3. Be objective, analytical, and concise.
        4. Focus on the 'Why' behind the data.
        """
        super().__init__(
            role="Political Analyst", 
            system_instruction=system_instruction,
            model_name=model_name
        )

    async def run(self, data: Any, context: Optional[Dict[str, Any]] = None) -> AgentResponse:
        """
        Specialized run for general political analysis.
        """
        # Ensure context key is set for memory
        context = context or {}
        if "context_key" not in context:
            context["context_key"] = "trend_analysis"
            
        return await super().run(data, context)

    analyze_trends = run
