from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from datetime import datetime
from uuid import UUID, uuid4

class Signal(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    type: str # protest, economic, political, security, etc.
    subtype: Optional[str] = None
    location: str # city/region
    timestamp: datetime
    intensity: float = Field(ge=0, le=1) # 0 -> 1
    source_id: str
    source_reliability_score: float = Field(ge=0, le=1)
    confidence_score: float = Field(ge=0, le=1)
    priority: str = "MEDIUM" # LOW, MEDIUM, HIGH, CRITICAL
    uncertainty_score: float = 0.0
    is_expired: bool = False
    decay_rate: float = 0.05 # Confidence decay per hour (5%)
    provenance: List[Dict[str, Any]] = [] # Audit trail for AI decisions
    last_validated_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    raw_text: str
    extracted_entities: List[Dict[str, Any]] = []
    tags: List[str] = []
    metadata: Dict[str, Any] = {}

class Event(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    event_type: str
    subtype: Optional[str] = None
    location: str
    timestamp: datetime
    actors: List[str] = []
    cause: Optional[str] = None
    severity: str # LOW, MEDIUM, HIGH, CRITICAL
    priority: str = "MEDIUM"
    uncertainty_score: float = 0.0
    is_resolved: bool = False
    resolution_notes: Optional[str] = None
    description: str
    signals_count: int = 1
    related_signal_ids: List[UUID] = []
    provenance: List[Dict[str, Any]] = [] # XAI logs
    confidence: float = Field(ge=0, le=1)

class Source(BaseModel):
    id: str
    name: str
    url: Optional[str] = None
    reliability_score: float = 0.5
    historical_accuracy: float = 0.5
    bias_level: Optional[float] = None # -1 (left) to 1 (right) or 0 to 1
    update_frequency_minutes: int = 60
    last_updated: Optional[datetime] = None
