from typing import List, Optional, Dict, Any
from .models import Entity, Relation


class GraphDatabase:
    """Supabase-backed graph database using the graph_entities and graph_relations tables."""

    def __init__(self, db_client):
        self.db = db_client

    # ── Entities ───────────────────────────────────────────────────────

    async def get_entities(self, entity_type: Optional[str] = None) -> List[Dict[str, Any]]:
        query = self.db.table("graph_entities").select("*")
        if entity_type:
            query = query.eq("type", entity_type)
        result = query.execute()
        return result.data or []

    async def get_entity(self, entity_id: str) -> Optional[Dict[str, Any]]:
        result = self.db.table("graph_entities").select("*").eq("id", entity_id).execute()
        return result.data[0] if result.data else None

    async def upsert_entity(self, entity: Entity) -> Dict[str, Any]:
        data = entity.model_dump()
        result = self.db.table("graph_entities").upsert(data, on_conflict="id").execute()
        return result.data[0] if result.data else data

    async def upsert_entities(self, entities: List[Entity]) -> int:
        count = 0
        for entity in entities:
            await self.upsert_entity(entity)
            count += 1
        return count

    # ── Relations ─────────────────────────────────────────────────────

    async def get_relations(self, relation_type: Optional[str] = None) -> List[Dict[str, Any]]:
        query = self.db.table("graph_relations").select("*")
        if relation_type:
            query = query.eq("type", relation_type)
        result = query.execute()
        return result.data or []

    async def get_relations_for_entity(self, entity_id: str) -> List[Dict[str, Any]]:
        result = self.db.table("graph_relations").select("*").or_(
            f"source_id.eq.{entity_id},target_id.eq.{entity_id}"
        ).execute()
        return result.data or []

    async def upsert_relation(self, relation: Relation) -> Dict[str, Any]:
        data = relation.model_dump()
        result = self.db.table("graph_relations").upsert(data, on_conflict="id").execute()
        return result.data[0] if result.data else data

    async def upsert_relations(self, relations: List[Relation]) -> int:
        count = 0
        for relation in relations:
            await self.upsert_relation(relation)
            count += 1
        return count

    # ── Traversal / Query ─────────────────────────────────────────────

    async def traverse(self, source_id: str, relation_type: Optional[str] = None, max_depth: int = 3) -> List[Dict[str, Any]]:
        """BFS traversal from source_id up to max_depth using recursive CTE."""
        type_filter = f"AND r.type = '{relation_type}'" if relation_type else ""
        sql = f"""
            WITH RECURSIVE graph_traversal AS (
                SELECT r.source_id, r.target_id, r.type, r.weight, 1 AS depth
                FROM graph_relations r
                WHERE r.source_id = '{source_id}' {type_filter}
                UNION
                SELECT r.source_id, r.target_id, r.type, r.weight, t.depth + 1
                FROM graph_relations r
                INNER JOIN graph_traversal t ON r.source_id = t.target_id
                WHERE t.depth < {max_depth} {type_filter}
            )
            SELECT DISTINCT e.id, e.label, e.type, e.tier, e.color, e.confidence
            FROM graph_entities e
            INNER JOIN graph_traversal t ON e.id = t.target_id
            LIMIT 100
        """
        # Execute raw SQL using raw_query method
        try:
            result = self.db.raw(sql).execute()
            return result.data or []
        except Exception as e:
            print(f"[GraphDB] Raw query failed: {e}")
            return []

    async def neighbors(self, entity_id: str, relation_type: Optional[str] = None) -> Dict[str, Any]:
        """Get entity + its immediate neighbors."""
        entity = await self.get_entity(entity_id)
        if not entity:
            return {"entity": None, "relations": [], "neighbors": []}
        relations = await self.get_relations_for_entity(entity_id)
        if relation_type:
            relations = [r for r in relations if r["type"] == relation_type]
        neighbor_ids = set()
        for r in relations:
            if r["source_id"] != entity_id:
                neighbor_ids.add(r["source_id"])
            if r["target_id"] != entity_id:
                neighbor_ids.add(r["target_id"])
        neighbors = []
        for nid in neighbor_ids:
            n = await self.get_entity(nid)
            if n:
                neighbors.append(n)
        return {"entity": entity, "relations": relations, "neighbors": neighbors}

    # ── Seed ──────────────────────────────────────────────────────────

    async def seed_from_data(self, entities: List[Entity], relations: List[Relation]) -> dict:
        e_count = await self.upsert_entities(entities)
        r_count = await self.upsert_relations(relations)
        return {"entities_seeded": e_count, "relations_seeded": r_count}
