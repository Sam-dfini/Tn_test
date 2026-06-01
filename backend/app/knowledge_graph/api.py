from fastapi import APIRouter, HTTPException
from typing import Optional, Dict, Any
from ..core.database import db
from .models import Entity, Relation, GraphQuery
from .graph_db import GraphDatabase

router = APIRouter(prefix="/graph", tags=["knowledge_graph"])
graph_db = GraphDatabase(db)


@router.get("/entities", response_model=Dict[str, Any])
async def list_entities(type: Optional[str] = None):
    """List all entities, optionally filtered by type."""
    return await graph_db.get_entities(type)


@router.get("/entities/{entity_id}", response_model=Dict[str, Any])
async def get_entity(entity_id: str):
    """Get a single entity by ID."""
    entity = await graph_db.get_entity(entity_id)
    if not entity:
        raise HTTPException(status_code=404, detail="Entity not found")
    return entity


@router.get("/relations", response_model=Dict[str, Any])
async def list_relations(type: Optional[str] = None):
    """List all relations, optionally filtered by type."""
    return await graph_db.get_relations(type)


@router.get("/relations/{entity_id}", response_model=Dict[str, Any])
async def get_relations_for_entity(entity_id: str):
    """Get all relations involving an entity."""
    return await graph_db.get_relations_for_entity(entity_id)


@router.post("/query", response_model=Dict[str, Any])
async def query_graph(query: GraphQuery):
    """Traverse the graph: BFS from source_id with depth limit."""
    if not query.source_id and not query.action == "neighbors":
        raise HTTPException(status_code=400, detail="source_id is required for traversal")
    if query.action == "neighbors":
        return await graph_db.neighbors(query.source_id, query.relation_type)
    if query.action == "traverse":
        return await graph_db.traverse(query.source_id, query.relation_type, query.max_depth)
    raise HTTPException(status_code=400, detail=f"Unknown action: {query.action}")


@router.post("/seed", response_model=Dict[str, Any])
async def seed_graph():
    """Seed the graph from predefined entity and relation data."""
    try:
        # Ensure tables exist before seeding
        for sql in [
            """
            CREATE TABLE IF NOT EXISTS graph_entities (
                id TEXT PRIMARY KEY,
                type TEXT,
                label TEXT,
                aliases JSONB DEFAULT '[]',
                first_seen TEXT DEFAULT '',
                last_seen TEXT DEFAULT '',
                confidence FLOAT8 DEFAULT 1.0,
                metadata JSONB DEFAULT '{}',
                tier INT8 DEFAULT 1,
                domain JSONB DEFAULT '[]',
                power_type TEXT DEFAULT '',
                color TEXT DEFAULT '#6366f1',
                size INT8 DEFAULT 25,
                resources JSONB DEFAULT '{}',
                goals JSONB DEFAULT '[]',
                constraints JSONB DEFAULT '[]',
                risk_tolerance TEXT DEFAULT 'medium',
                time_horizon TEXT DEFAULT 'medium',
                fixed_x FLOAT8,
                fixed_y FLOAT8
            );
            """,
            """
            CREATE TABLE IF NOT EXISTS graph_relations (
                id TEXT PRIMARY KEY,
                source_id TEXT,
                target_id TEXT,
                type TEXT,
                weight FLOAT8 DEFAULT 1.0,
                domain TEXT DEFAULT '',
                description TEXT DEFAULT '',
                conditionality TEXT DEFAULT '',
                trend TEXT DEFAULT 'stable',
                valid_from TEXT DEFAULT '',
                valid_to TEXT DEFAULT '',
                confidence FLOAT8 DEFAULT 1.0
            );
            """
        ]:
            try:
                # Execute raw SQL using raw_query method
                db.raw(sql).execute()
            except Exception:
                pass  # table may already exist

        from .seed_data import GEOPOLITICAL_ENTITIES, GEOPOLITICAL_RELATIONS, NATIONAL_ENTITIES, NATIONAL_RELATIONS, INFRASTRUCTURE_ENTITIES, INFRASTRUCTURE_RELATIONS
        all_entities = GEOPOLITICAL_ENTITIES + NATIONAL_ENTITIES + INFRASTRUCTURE_ENTITIES
        all_relations = GEOPOLITICAL_RELATIONS + NATIONAL_RELATIONS + INFRASTRUCTURE_RELATIONS
        result = await graph_db.seed_from_data(all_entities, all_relations)
        return result
    except Exception as e:
        from fastapi import HTTPException
        raise HTTPException(status_code=500, detail=f"Graph seed failed: {str(e)}")
