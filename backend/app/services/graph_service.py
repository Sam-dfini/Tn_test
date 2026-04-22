from typing import List, Dict, Any, Optional
from uuid import UUID
from ..core.database import db

class GraphService:
    """
    Manages relationships between variables, regions, and events.
    Enables graph-like traversal in a relational database.
    """
    def __init__(self):
        self.table = "relationships"

    async def add_relationship(
        self, 
        source_id: UUID, 
        source_type: str, 
        target_id: UUID, 
        target_type: str, 
        weight: float, 
        description: str = ""
    ):
        """
        Adds or updates an influence relationship.
        """
        data = {
            "source_id": str(source_id),
            "source_type": source_type,
            "target_id": str(target_id),
            "target_type": target_type,
            "influence_weight": weight,
            "description": description
        }
        return db.table(self.table).upsert(data).execute()

    async def get_influencers(self, target_id: UUID) -> List[Dict[str, Any]]:
        """
        Finds all entities that influence the target entity.
        """
        response = db.table(self.table) \
            .select("*") \
            .eq("target_id", str(target_id)) \
            .execute()
        return response.data

    async def get_impacted(self, source_id: UUID) -> List[Dict[str, Any]]:
        """
        Finds all entities influenced by the source entity.
        """
        response = db.table(self.table) \
            .select("*") \
            .eq("source_id", str(source_id)) \
            .execute()
        return response.data

    async def compute_indirect_impact(self, source_id: UUID, depth: int = 2) -> Dict[str, float]:
        """
        Computes the indirect impact of a source entity across the graph.
        """
        impacts = {}
        # Simple BFS/DFS traversal would go here
        # For now, just a placeholder for the logic
        return impacts
