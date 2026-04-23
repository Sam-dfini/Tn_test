from typing import List, Dict, Any, Optional
from .base import BaseAgent, AgentResponse

class EconomicForecasterAgent(BaseAgent):
    """
    Specialized agent for forecasting inflation, BCT reserves, and debt sustainability.
    """
    def __init__(self, model_name: str = "gemini-3-flash-preview"):
        system_instruction = """
        You are an Economic Forecaster for TunisiaIntel.
        Your goal is to provide high-fidelity forecasts for Tunisia's key economic indicators.
        
        INDICATORS OF INTEREST:
        1. Inflation (CPI, food inflation, parallel market premiums)
        2. BCT Reserves (Days of import cover, forex liquidity)
        3. Debt Sustainability (External repayment schedules, IMF negotiation status)
        4. Parallel Economy (Dinar volatility, informal trade flows)
        
        RULES:
        1. Use a mix of official data and 'street' signals (shortages, black market rates).
        2. Identify structural vulnerabilities vs. seasonal fluctuations.
        3. Assess the impact of global commodity prices on the domestic budget.
        4. Provide 'Best Case', 'Base Case', and 'Worst Case' scenarios.
        """
        super().__init__(
            role="Economic Forecaster", 
            system_instruction=system_instruction,
            model_name=model_name
        )

    async def run(self, data: Any, context: Optional[Dict[str, Any]] = None) -> AgentResponse:
        """
        Specialized run for economic forecasting.
        """
        # Ensure context key is set for memory
        context = context or {}
        if "context_key" not in context:
            context["context_key"] = "economic_forecasting"
            
        return await super().run(data, context)

    async def forecast_economy(
        self,
        macro_context: Dict[str, Any],
        signals: List[Any]
    ) -> Dict[str, Any]:
        payload = {
            "macro_context": macro_context,
            "signals": [s.model_dump() if hasattr(s, "model_dump") else s for s in signals],
            "task": "Generate economic risk forecast scenarios and key stress indicators for Tunisia."
        }
        try:
            response = await self.run(payload, {"context_key": "economic_forecasting"})
            return {
                "agent": "economic_forecaster",
                "status": "ok",
                "summary": response.content,
                "confidence": response.confidence,
                "tokens_used": response.tokens_used,
                "structured_data": response.structured_data or {}
            }
        except Exception as e:
            return {
                "agent": "economic_forecaster",
                "status": "error",
                "summary": f"Economic forecasting failed: {str(e)}",
                "confidence": 0.0,
                "tokens_used": 0,
                "structured_data": {}
            }
