from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class Entity(BaseModel):
    id: str
    type: str  # 'actor' | 'institution' | 'infrastructure' | 'governorate'
    label: str
    aliases: List[str] = []
    first_seen: str = ""
    last_seen: str = ""
    confidence: float = 1.0
    metadata: Dict[str, Any] = {}
    tier: int = 1
    domain: List[str] = []
    power_type: str = ""
    color: str = "#6366f1"
    size: int = 25
    resources: Dict[str, float] = {}
    goals: List[str] = []
    constraints: List[str] = []
    risk_tolerance: str = "medium"
    time_horizon: str = "medium"
    fixed_x: Optional[float] = None
    fixed_y: Optional[float] = None


class Relation(BaseModel):
    id: str
    source_id: str
    target_id: str
    type: str  # 'coercive' | 'cooperative' | 'competitive' | 'dependent' | 'extractive' | 'spillover'
    weight: float = 1.0
    domain: str = ""
    description: str = ""
    conditionality: str = ""
    trend: str = "stable"  # 'rising' | 'stable' | 'declining'
    valid_from: str = ""
    valid_to: str = ""
    confidence: float = 1.0


class GraphQuery(BaseModel):
    action: str = "traverse"  # 'traverse' | 'path' | 'neighbors'
    source_id: Optional[str] = None
    target_id: Optional[str] = None
    relation_type: Optional[str] = None
    max_depth: int = 3
    limit: int = 100
