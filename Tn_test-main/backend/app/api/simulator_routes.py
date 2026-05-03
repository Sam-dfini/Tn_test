from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, ConfigDict
from datetime import datetime
from uuid import UUID
from ..core.database_orm import get_db_session
from ..models.simulator_orm import SimulatedScenario as SimulatedScenarioORM, ScenarioStep as ScenarioStepORM, Outcome as OutcomeORM

router = APIRouter(prefix="/simulator", tags=["simulator"])

# --- Pydantic Schemas ---

class OutcomeBase(BaseModel):
    type: str
    description: str
    probability: float = 1.0
    impact_score: float = 0.0
    metadata: Dict[str, Any] = {}

class Outcome(OutcomeBase):
    id: UUID
    step_id: UUID
    model_config = ConfigDict(from_attributes=True)

class ScenarioStepBase(BaseModel):
    step_number: int
    timestamp: datetime
    rri: float
    variable_states: Dict[str, float] = {}
    events: List[str] = []

class ScenarioStepCreate(ScenarioStepBase):
    pass

class ScenarioStep(ScenarioStepBase):
    id: UUID
    scenario_id: UUID
    outcomes: List[Outcome] = []
    model_config = ConfigDict(from_attributes=True)

class SimulatedScenarioBase(BaseModel):
    name: str
    description: Optional[str] = None
    mission_id: Optional[str] = None
    probability: float = 0.5
    severity: float = 0.5
    projected_rri: Optional[float] = None
    variable_contributions: Dict[str, float] = {}
    historical_analogs: List[Dict[str, Any]] = []
    causal_chains: List[Dict[str, Any]] = []
    metadata: Dict[str, Any] = {}

class SimulatedScenarioCreate(SimulatedScenarioBase):
    pass

class SimulatedScenarioUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    probability: Optional[float] = None
    severity: Optional[float] = None
    projected_rri: Optional[float] = None
    variable_contributions: Optional[Dict[str, float]] = None
    historical_analogs: Optional[List[Dict[str, Any]]] = None
    causal_chains: Optional[List[Dict[str, Any]]] = None
    metadata: Optional[Dict[str, Any]] = None

class SimulatedScenario(SimulatedScenarioBase):
    id: UUID
    created_at: datetime
    steps: List[ScenarioStep] = []
    model_config = ConfigDict(from_attributes=True)

# --- Endpoints: SimulatedScenario ---

@router.post("/scenarios", response_model=SimulatedScenario, status_code=status.HTTP_201_CREATED)
def create_scenario(scenario: SimulatedScenarioCreate, db: Session = Depends(get_db_session)):
    db_scenario = SimulatedScenarioORM(**scenario.model_dump())
    db.add(db_scenario)
    db.commit()
    db.refresh(db_scenario)
    return db_scenario

@router.get("/scenarios", response_model=List[SimulatedScenario])
def list_scenarios(skip: int = 0, limit: int = 100, db: Session = Depends(get_db_session)):
    return db.query(SimulatedScenarioORM).offset(skip).limit(limit).all()

@router.get("/scenarios/{scenario_id}", response_model=SimulatedScenario)
def get_scenario(scenario_id: UUID, db: Session = Depends(get_db_session)):
    db_scenario = db.query(SimulatedScenarioORM).filter(SimulatedScenarioORM.id == scenario_id).first()
    if not db_scenario:
        raise HTTPException(status_code=404, detail="Scenario not found")
    return db_scenario

@router.put("/scenarios/{scenario_id}", response_model=SimulatedScenario)
def update_scenario(scenario_id: UUID, scenario_update: SimulatedScenarioUpdate, db: Session = Depends(get_db_session)):
    db_scenario = db.query(SimulatedScenarioORM).filter(SimulatedScenarioORM.id == scenario_id).first()
    if not db_scenario:
        raise HTTPException(status_code=404, detail="Scenario not found")
    
    update_data = scenario_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_scenario, key, value)
    
    db.commit()
    db.refresh(db_scenario)
    return db_scenario

@router.delete("/scenarios/{scenario_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_scenario(scenario_id: UUID, db: Session = Depends(get_db_session)):
    db_scenario = db.query(SimulatedScenarioORM).filter(SimulatedScenarioORM.id == scenario_id).first()
    if not db_scenario:
        raise HTTPException(status_code=404, detail="Scenario not found")
    db.delete(db_scenario)
    db.commit()
    return None

# --- Endpoints: ScenarioStep ---

@router.post("/scenarios/{scenario_id}/steps", response_model=ScenarioStep, status_code=status.HTTP_201_CREATED)
def add_step_to_scenario(scenario_id: UUID, step: ScenarioStepCreate, db: Session = Depends(get_db_session)):
    db_scenario = db.query(SimulatedScenarioORM).filter(SimulatedScenarioORM.id == scenario_id).first()
    if not db_scenario:
        raise HTTPException(status_code=404, detail="Scenario not found")
    
    db_step = ScenarioStepORM(**step.model_dump(), scenario_id=scenario_id)
    db.add(db_step)
    db.commit()
    db.refresh(db_step)
    return db_step

@router.get("/scenarios/{scenario_id}/steps", response_model=List[ScenarioStep])
def get_scenario_steps(scenario_id: UUID, db: Session = Depends(get_db_session)):
    db_scenario = db.query(SimulatedScenarioORM).filter(SimulatedScenarioORM.id == scenario_id).first()
    if not db_scenario:
        raise HTTPException(status_code=404, detail="Scenario not found")
    return db_scenario.steps

@router.put("/steps/{step_id}", response_model=ScenarioStep)
def update_step(step_id: UUID, step_update: ScenarioStepCreate, db: Session = Depends(get_db_session)):
    db_step = db.query(ScenarioStepORM).filter(ScenarioStepORM.id == step_id).first()
    if not db_step:
        raise HTTPException(status_code=404, detail="Step not found")
    
    update_data = step_update.model_dump()
    for key, value in update_data.items():
        setattr(db_step, key, value)
    
    db.commit()
    db.refresh(db_step)
    return db_step

@router.delete("/steps/{step_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_step(step_id: UUID, db: Session = Depends(get_db_session)):
    db_step = db.query(ScenarioStepORM).filter(ScenarioStepORM.id == step_id).first()
    if not db_step:
        raise HTTPException(status_code=404, detail="Step not found")
    db.delete(db_step)
    db.commit()
    return None

# --- Endpoints: Outcome (Read-only) ---

@router.get("/steps/{step_id}/outcomes", response_model=List[Outcome])
def get_step_outcomes(step_id: UUID, db: Session = Depends(get_db_session)):
    db_step = db.query(ScenarioStepORM).filter(ScenarioStepORM.id == step_id).first()
    if not db_step:
        raise HTTPException(status_code=404, detail="Step not found")
    return db_step.outcomes
