from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from datetime import datetime

class Variable(BaseModel):
    id: str
    category: str
    value: float
    unit: str
    source: str
    confidence: float
    last_updated: datetime
    history: List[Dict[str, Any]] = []

class RRIEngine:
    """
    The mathematical core of TunisiaIntel.
    Handles the calculation of the Revolutionary Risk Index (RRI).
    """
    def __init__(self):
        # (This would pull from the DB or a config service)
        self.variables = {}
        
    async def calculate_rri(self, variables: List[Variable]) -> float:
        # Use the same category weights as frontend
        CATEGORY_WEIGHTS = {
            'A': 0.26, 'B': 0.06, 'C': 0.07, 'D': 0.10,
            'E': 0.09, 'F': 0.06, 'G': 0.06, 'H': 0.07,
            'I': 0.05, 'J': 0.05, 'K': 0.02, 'L': 0.08,
            'M': 0.07, 'N': 0.09, 'O': 0.04, 'X': 0.03,
        }

        # Fetch variables from Supabase if not provided
        if not variables:
            try:
                from .supabase_client import db
                result = db.table("rri_variables") \
                    .select("*").execute()
                # Convert to Variable objects
                for row in (result.data or []):
                    variables.append(Variable(
                        id=row['id'],
                        category=row['code'],
                        value=row['value_2026'] or 0,
                        unit='',
                        source='supabase',
                        confidence=0.8,
                        last_updated=datetime.now()
                    ))
            except:
                pass

        if not variables:
            return 0.6  # fallback

        # Calculate weighted category scores
        cat_scores = {}
        cat_weights_sum = {}
        for v in variables:
            cat = v.category
            if cat not in cat_scores:
                cat_scores[cat] = 0
                cat_weights_sum[cat] = 0
            # Normalize value (assume 0-100 range → 0-1)
            norm_val = min(1.0, max(0.0, v.value / 100.0))
            weight = CATEGORY_WEIGHTS.get(cat, 0.02)
            cat_scores[cat] += weight * norm_val
            cat_weights_sum[cat] += weight

        # Aggregate to final RRI (0-5 scale like frontend)
        rri = 0.0
        total_weight = 0.0
        for cat, score in cat_scores.items():
            w = CATEGORY_WEIGHTS.get(cat, 0.02)
            rri += score
            total_weight += w

        if total_weight > 0:
            rri = (rri / total_weight) * 5.0

        return round(min(5.0, max(0.0, rri)), 4)
        
    def _calculate_category_score(self, category: str, variables: List[Variable]) -> float:
        """
        Calculates a score for a specific category.
        """
        # (Specific math for each category would go here)
        if not variables:
            return 0.0
            
        total_value = sum(v.value for v in variables)
        return total_value / len(variables)
