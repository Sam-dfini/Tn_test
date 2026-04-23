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
