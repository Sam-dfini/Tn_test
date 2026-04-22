from sqlalchemy import Column, String, Float, JSON, DateTime, ForeignKey, Integer, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
from ..core.database_orm import Base

class SimulatedScenario(Base):
    __tablename__ = "simulated_scenarios"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    mission_id = Column(String, nullable=True)
    name = Column(String, nullable=False)
    description = Column(String)
    probability = Column(Float, default=0.5)
    severity = Column(Float, default=0.5)
    projected_rri = Column(Float)
    variable_contributions = Column(JSON, default={})
    historical_analogs = Column(JSON, default=[])
    causal_chains = Column(JSON, default=[])
    metadata = Column(JSON, default={})
    created_at = Column(DateTime, default=datetime.utcnow)

    steps = relationship("ScenarioStep", back_populates="scenario", cascade="all, delete-orphan")

class ScenarioStep(Base):
    __tablename__ = "scenario_steps"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    scenario_id = Column(UUID(as_uuid=True), ForeignKey("simulated_scenarios.id", ondelete="CASCADE"))
    step_number = Column(Integer, nullable=False)
    timestamp = Column(DateTime, nullable=False)
    rri = Column(Float, nullable=False)
    variable_states = Column(JSON, default={})
    events = Column(JSON, default=[])

    scenario = relationship("SimulatedScenario", back_populates="steps")
    outcomes = relationship("Outcome", back_populates="step", cascade="all, delete-orphan")

class Outcome(Base):
    __tablename__ = "outcomes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    step_id = Column(UUID(as_uuid=True), ForeignKey("scenario_steps.id", ondelete="CASCADE"))
    type = Column(String, nullable=False) # e.g., 'Risk Event', 'RRI Change'
    description = Column(String, nullable=False)
    probability = Column(Float, default=1.0)
    impact_score = Column(Float, default=0.0)
    metadata = Column(JSON, default={})

    step = relationship("ScenarioStep", back_populates="outcomes")
