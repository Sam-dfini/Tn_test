import logging
import numpy as np
import pandas as pd
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from uuid import uuid4, UUID

from .models import SimulatedScenario, SimulatedStep, HistoricalEvent
from ..intelligence.engines import CausalityEngine, TemporalPatternEngine
from ..reliability.simulation import AdvancedScenarioSimulator
from ..core.database import db

logger = logging.getLogger(__name__)

class TunisiaSimulator:
    """
    Institution-grade Tunisia-specific simulation engine.
    Integrates historical analogs, causal modeling, and stochastic progression.
    """
    
    def __init__(self):
        self.causality_engine = CausalityEngine()
        self.temporal_engine = TemporalPatternEngine()
        self.base_simulator = AdvancedScenarioSimulator()
        
        # Load historical anchors (fallback if DB is empty)
        self.historical_data = self._load_historical_anchors()
        
    def _load_historical_anchors(self) -> List[HistoricalEvent]:
        """
        Defines key historical events in Tunisia (2000-2025) for analog matching.
        """
        return [
            HistoricalEvent(
                name="2011 Revolution",
                date=datetime(2011, 1, 14),
                type="REVOLUTION",
                rri_impact=0.9,
                variable_states={"unemployment": 0.8, "inflation": 0.4, "social_unrest": 1.0, "political_stability": 0.1},
                description="Mass protests leading to regime change."
            ),
            HistoricalEvent(
                name="2013 Political Crisis",
                date=datetime(2013, 7, 25),
                type="POLITICAL_INSTABILITY",
                rri_impact=0.75,
                variable_states={"social_unrest": 0.8, "political_stability": 0.2, "terrorism_risk": 0.5},
                description="Assassinations of political figures leading to national dialogue."
            ),
            HistoricalEvent(
                name="2015 Security Crisis",
                date=datetime(2015, 6, 26),
                type="SECURITY",
                rri_impact=0.7,
                variable_states={"terrorism_risk": 0.9, "tourism_revenue": 0.1, "gdp_growth": 0.2},
                description="Major terrorist attacks impacting economy and security."
            ),
            HistoricalEvent(
                name="2021 Constitutional Shift",
                date=datetime(2021, 7, 25),
                type="POLITICAL_REFORM",
                rri_impact=0.65,
                variable_states={"political_stability": 0.4, "institutional_risk": 0.7, "social_unrest": 0.5},
                description="Suspension of parliament and shift in governance structure."
            ),
            HistoricalEvent(
                name="2024 Economic Strain",
                date=datetime(2024, 1, 1),
                type="ECONOMIC",
                rri_impact=0.6,
                variable_states={"inflation": 0.9, "debt_to_gdp": 0.8, "subsidies_cost": 0.7, "social_unrest": 0.6},
                description="High inflation and debt sustainability challenges."
            )
        ]

    def match_historical_analogs(self, current_state: Dict[str, float]) -> List[Dict[str, Any]]:
        """
        Compares current signals to historical events using vector similarity.
        """
        matches = []
        for event in self.historical_data:
            # Calculate Euclidean distance between current state and historical state
            common_vars = set(current_state.keys()) & set(event.variable_states.keys())
            if not common_vars:
                continue
                
            dist = np.sqrt(sum((current_state[v] - event.variable_states[v])**2 for v in common_vars))
            similarity = 1 / (1 + dist)
            
            if similarity > 0.6: # Threshold for a "match"
                matches.append({
                    "event_name": event.name,
                    "similarity": round(similarity, 4),
                    "rri_impact": event.rri_impact,
                    "description": event.description,
                    "date": event.date.isoformat()
                })
        
        return sorted(matches, key=lambda x: x["similarity"], reverse=True)

    def simulate_causal_chains(self, initial_state: Dict[str, float]) -> List[Dict[str, Any]]:
        """
        Models causal links and cascading effects based on current state.
        """
        # In a real system, we'd fetch these from the causal_relationships table
        # For now, we use some expert rules + placeholders
        active_chains = []
        
        # Expert Rule: High Inflation -> Social Unrest (Lag 1)
        if initial_state.get("inflation", 0) > 0.7:
            active_chains.append({
                "cause": "inflation",
                "effect": "social_unrest",
                "strength": 0.8,
                "lag": 1,
                "type": "CAUSAL"
            })
            
        # Expert Rule: High Social Unrest -> Political Instability (Lag 1)
        if initial_state.get("social_unrest", 0) > 0.6:
            active_chains.append({
                "cause": "social_unrest",
                "effect": "political_stability",
                "strength": -0.7, # Negative impact on stability
                "lag": 1,
                "type": "CAUSAL"
            })
            
        # Expert Rule: Low Tourism -> GDP Drop (Lag 2)
        if initial_state.get("tourism_revenue", 1.0) < 0.4:
            active_chains.append({
                "cause": "tourism_revenue",
                "effect": "gdp_growth",
                "strength": 0.6,
                "lag": 2,
                "type": "CAUSAL"
            })
            
        return active_chains

    def temporal_progression(self, state: Dict[str, float], steps: int = 6) -> List[SimulatedStep]:
        """
        Predicts the evolution of state over N months using stochastic progression.
        """
        progression = []
        current_state = state.copy()
        current_rri = sum(current_state.values()) / len(current_state) if current_state else 0.5
        
        # Fetch causal links and temporal patterns from DB if possible
        try:
            causal_links = db.table("causal_relationships").select("*").execute().data or []
            temporal_patterns = db.table("temporal_patterns").select("*").execute().data or []
        except Exception:
            causal_links = []
            temporal_patterns = []

        # Use AdvancedScenarioSimulator for the core logic
        sim_results = self.base_simulator.simulate_time_series(
            base_rri=current_rri,
            inputs=current_state,
            correlations=[], # We use causal_links instead
            causal_links=causal_links,
            temporal_patterns=temporal_patterns,
            steps=steps
        )
        
        for res in sim_results:
            progression.append(SimulatedStep(
                step=res["step"],
                timestamp=datetime.fromisoformat(res["timestamp"]),
                rri=res["rri"],
                variable_states=res.get("cascading_effects", {}),
                events=[] # Could be populated by anomaly detection
            ))
            
        return progression

    def generate_scenarios(self, current_state: Dict[str, float], mission_id: Optional[str] = None) -> List[SimulatedScenario]:
        """
        Generates 3 predictive scenarios: BASELINE, OPTIMISTIC, PESSIMISTIC.
        """
        scenarios = []
        
        # 1. Match Analogs
        analogs = self.match_historical_analogs(current_state)
        
        # 2. Identify Causal Chains
        causal_chains = self.simulate_causal_chains(current_state)
        
        # 3. Generate 3 Scenarios
        scenario_configs = [
            ("Baseline", "Continuation of current trends with moderate volatility.", 0.5, 0.0),
            ("Optimistic", "Successful reforms and external support leading to stabilization.", 0.2, -0.15),
            ("Pessimistic", "Escalating social unrest and economic shocks.", 0.3, 0.2)
        ]
        
        for name, desc, prob, shock in scenario_configs:
            # Apply shock to current state for this scenario
            shocked_state = {k: min(1.0, max(0.0, v + shock + np.random.normal(0, 0.05))) for k, v in current_state.items()}
            
            # Run temporal progression
            steps = self.temporal_progression(shocked_state, steps=6)
            
            # Calculate variable contributions (simplified)
            contributions = {k: round(v / sum(shocked_state.values()), 4) for k, v in shocked_state.items()} if shocked_state else {}
            
            scenario = SimulatedScenario(
                mission_id=mission_id,
                name=name,
                description=desc,
                probability=prob,
                severity=sum(shocked_state.values()) / len(shocked_state) if shocked_state else 0.5,
                projected_rri=steps[-1].rri if steps else 0.5,
                steps=steps,
                variable_contributions=contributions,
                historical_analogs=analogs[:2], # Top 2 analogs
                causal_chains=causal_chains,
                metadata={"shock_applied": shock}
            )
            scenarios.append(scenario)
            
            # 4. Persist to DB
            self._persist_scenario(scenario)
            
        return scenarios

    def _persist_scenario(self, scenario: SimulatedScenario):
        """
        Stores the simulated scenario in Supabase.
        """
        try:
            data = scenario.model_dump(mode='json')
            if "id" in data and data["id"] is None:
                del data["id"]
            if "created_at" in data and data["created_at"] is None:
                del data["created_at"]
                
            db.table("simulated_scenarios").insert(data).execute()
        except Exception as e:
            logger.error(f"Failed to persist scenario: {e}")

    async def run_hitl_adjustment(self, scenario_id: UUID, analyst_id: UUID, adjusted_prob: float, notes: str):
        """
        Allows an analyst to adjust the probability of a scenario.
        """
        try:
            db.table("simulated_scenarios").update({
                "probability": adjusted_prob,
                "metadata": {"hitl_adjustment": True, "analyst_id": str(analyst_id), "notes": notes}
            }).eq("id", str(scenario_id)).execute()
            
            # Also log to human_validations
            db.table("human_validations").insert({
                "target_type": "SCENARIO",
                "target_id": str(scenario_id),
                "analyst_id": str(analyst_id),
                "is_valid": True,
                "adjusted_confidence": adjusted_prob,
                "notes": notes
            }).execute()
        except Exception as e:
            logger.error(f"HITL adjustment failed: {e}")
