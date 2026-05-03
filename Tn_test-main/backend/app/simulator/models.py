from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from datetime import datetime
from uuid import UUID

class SimulatedStep(BaseModel):
    step: int
    timestamp: datetime
    rri: float
    variable_states: Dict[str, float]
    events: List[str]

class SimulatedScenario(BaseModel):
    id: Optional[UUID] = None
    mission_id: Optional[str] = None
    name: str
    description: str
    probability: float
    severity: float
    projected_rri: float
    steps: List[SimulatedStep]
    variable_contributions: Dict[str, float]
    historical_analogs: List[Dict[str, Any]]
    causal_chains: List[Dict[str, Any]]
    metadata: Dict[str, Any] = {}
    created_at: Optional[datetime] = None

class HistoricalEvent(BaseModel):
    name: str
    date: datetime
    type: str
    rri_impact: float
    variable_states: Dict[str, float]
    description: str
