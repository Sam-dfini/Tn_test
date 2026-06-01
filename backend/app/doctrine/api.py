"""
Doctrine Library API Router.

Endpoints:
  GET    /api/doctrine/status        — workspace/document status
  GET    /api/doctrine/search        — query a workspace
  POST   /api/doctrine/ingest        — ingest a file into a workspace
  GET    /api/doctrine/events        — list historical events
  GET    /api/doctrine/events/{id}   — single event detail
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException, Query

from ..services.doctrine_client import get_workspace_status, ingest_document, search_doctrine
from .historical_events import HISTORICAL_EVENTS, EVENT_CHAIN_MAP

router = APIRouter(prefix="/api/doctrine", tags=["doctrine"])


@router.get("/status", response_model=Dict[str, Any])
async def doctrine_status() -> List[Dict[str, Any]]:
    """Return document count and status per workspace."""
    return await get_workspace_status()


@router.get("/search", response_model=Dict[str, Any])
async def doctrine_search(
    query: str = Query(..., min_length=1),
    workspace: Optional[str] = Query(None),
    limit: int = Query(5, ge=1, le=20),
) -> Dict[str, Any]:
    """Query the doctrine library.

    If workspace is None, searches all workspaces.
    """
    results = await search_doctrine(query, workspace=workspace, limit=limit)
    return {
        "query": query,
        "workspace": workspace if workspace else "all",
        "results_count": len(results),
        "results": results,
    }


@router.post("/ingest", response_model=Dict[str, Any])
async def doctrine_ingest(
    file_path: str = Query(..., description="Absolute path to the file"),
    workspace: str = Query(..., description="Target workspace"),
) -> Dict[str, str]:
    """Ingest a file into an AnythingLLM workspace.

    Primarily for automated Tier 3 sources. Tier 1/2 documents
    should be ingested via AnythingLLM UI.
    """
    success = await ingest_document(file_path, workspace)
    if not success:
        raise HTTPException(
            status_code=502,
            detail="Ingestion failed — check AnythingLLM is running and file path is valid",
        )
    return {"status": "ingested", "file_path": file_path, "workspace": workspace}


@router.get("/events", response_model=Dict[str, Any])
async def list_events(
    chain_id: Optional[str] = Query(None),
    limit: int = Query(10, ge=1, le=50),
) -> List[Dict[str, Any]]:
    """List historical events for the tunisia-history workspace.

    If chain_id is provided, filters events that activated that chain.
    """
    events = HISTORICAL_EVENTS
    if chain_id:
        events = [
            e for e in events
            if chain_id in e.get("chains_activated", [])
        ]
    return [
        {
            "event_id": e["event_id"],
            "title": e["title"],
            "date_start": e["date_start"],
            "date_end": e["date_end"],
            "trigger": e["trigger"],
            "outcome": e["outcome"],
            "rri_estimate": e["rri_estimate"],
            "p_rev_estimate": e["p_rev_estimate"],
            "chains_activated": e.get("chains_activated", []),
            "intel_significance": e["intel_significance"],
        }
        for e in events[:limit]
    ]


@router.get("/events/{event_id}", response_model=Dict[str, Any])
async def get_event(event_id: str) -> Dict[str, Any]:
    """Return full detail for a single historical event."""
    for event in HISTORICAL_EVENTS:
        if event["event_id"] == event_id:
            return event
    raise HTTPException(status_code=404, detail=f"Event {event_id} not found")
