from fastapi import APIRouter, HTTPException
from typing import Optional
from ..core.database import db
from .models import Entity, Relation, GraphQuery
from .graph_db import GraphDatabase

router = APIRouter(prefix="/graph", tags=["knowledge_graph"])
graph_db = GraphDatabase(db)


@router.get("/entities")
async def list_entities(type: Optional[str] = None):
    """List all entities, optionally filtered by type."""
    return await graph_db.get_entities(type)


@router.get("/entities/{entity_id}")
async def get_entity(entity_id: str):
    """Get a single entity by ID."""
    entity = await graph_db.get_entity(entity_id)
    if not entity:
        raise HTTPException(status_code=404, detail="Entity not found")
    return entity


@router.get("/relations")
async def list_relations(type: Optional[str] = None):
    """List all relations, optionally filtered by type."""
    return await graph_db.get_relations(type)


@router.get("/relations/{entity_id}")
async def get_relations_for_entity(entity_id: str):
    """Get all relations involving an entity."""
    return await graph_db.get_relations_for_entity(entity_id)


@router.post("/query")
async def query_graph(query: GraphQuery):
    """Traverse the graph: BFS from source_id with depth limit."""
    if not query.source_id and not query.action == "neighbors":
        raise HTTPException(status_code=400, detail="source_id is required for traversal")
    if query.action == "neighbors":
        return await graph_db.neighbors(query.source_id, query.relation_type)
    if query.action == "traverse":
        return await graph_db.traverse(query.source_id, query.relation_type, query.max_depth)
    raise HTTPException(status_code=400, detail=f"Unknown action: {query.action}")


@router.post("/seed")
async def seed_graph():
    """Seed the graph from predefined entity and relation data."""
    from .seed_data import GEOPOLITICAL_ENTITIES, GEOPOLITICAL_RELATIONS, NATIONAL_ENTITIES, NATIONAL_RELATIONS
    all_entities = GEOPOLITICAL_ENTITIES + NATIONAL_ENTITIES
    all_relations = GEOPOLITICAL_RELATIONS + NATIONAL_RELATIONS
    result = await graph_db.seed_from_data(all_entities, all_relations)
    return result
