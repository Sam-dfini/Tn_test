"""Cognitive Workspace API — Phase 9 conversational intelligence endpoints."""

from __future__ import annotations

import json
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from ..services.workspace_orchestrator import workspace

router = APIRouter(prefix="/workspace", tags=["cognitive_workspace"])


class CreateInvestigationRequest(BaseModel):
    title: Optional[str] = None
    user_id: Optional[str] = None


class QueryRequest(BaseModel):
    query: str


class WatchlistRequest(BaseModel):
    type: str
    id: str
    threshold: float = 0.7


class QuickRequest(BaseModel):
    macro: str


@router.post("/investigations", response_model=Dict[str, Any])
async def create_investigation(req: CreateInvestigationRequest):
    """Create a new investigation dossier."""
    inv = await workspace.create_investigation(title=req.title, user_id=req.user_id)
    return inv


@router.get("/investigations", response_model=Dict[str, Any])
async def list_investigations(user_id: str = None):
    """List all investigations for a user."""
    investigations = await workspace.list_investigations(user_id=user_id)
    return investigations


@router.get("/investigations/{investigation_id}", response_model=Dict[str, Any])
async def get_investigation(investigation_id: str):
    """Get an investigation with all messages."""
    inv = await workspace.get_investigation(investigation_id)
    if not inv:
        raise HTTPException(status_code=404, detail="Investigation not found")
    messages = await workspace.get_messages(investigation_id)
    return {**inv, "messages": messages}


@router.post("/investigations/{investigation_id}/query", response_model=Dict[str, Any])
async def query_investigation(investigation_id: str, req: QueryRequest):
    """Submit a query to the investigation. Returns structured response envelope."""
    inv = await workspace.get_investigation(investigation_id)
    if not inv:
        raise HTTPException(status_code=404, detail="Investigation not found")
    # Store user message
    await workspace.store_message(investigation_id, {
        "role": "user",
        "message_index": inv.get("message_count", 0),
        "query_text": req.query,
    })
    envelope = await workspace.process_query(req.query, investigation_id)
    return envelope


@router.post("/investigations/{investigation_id}/query/stream", response_model=Dict[str, Any])
async def query_investigation_stream(investigation_id: str, req: QueryRequest):
    """Submit a query, stream narrative tokens via SSE, then complete with full envelope."""
    inv = await workspace.get_investigation(investigation_id)
    if not inv:
        raise HTTPException(status_code=404, detail="Investigation not found")
    await workspace.store_message(investigation_id, {
        "role": "user",
        "message_index": inv.get("message_count", 0),
        "query_text": req.query,
    })

    async def event_stream():
        async for event in workspace.process_query_stream(req.query, investigation_id):
            if event["type"] == "narrative_token":
                yield f"data: {json.dumps(event)}\n\n"
            elif event["type"] == "complete":
                yield f"data: {json.dumps(event)}\n\n"
                yield "data: [DONE]\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        }
    )


@router.get("/investigations/{investigation_id}/messages", response_model=Dict[str, Any])
async def get_messages(investigation_id: str):
    """Get message history for an investigation."""
    messages = await workspace.get_messages(investigation_id)
    return messages


@router.post("/investigations/{investigation_id}/watchlist", response_model=Dict[str, Any])
async def add_watchlist(investigation_id: str, req: WatchlistRequest):
    """Add an item to the investigation watchlist."""
    inv = await workspace.get_investigation(investigation_id)
    if not inv:
        raise HTTPException(status_code=404, detail="Investigation not found")
    watchlist = inv.get("watchlist", [])
    watchlist.append({"type": req.type, "id": req.id, "threshold": req.threshold})
    await workspace.update_investigation_context(investigation_id, {"watchlist": watchlist})
    return {"status": "ok", "watchlist": watchlist}


@router.post("/investigations/{investigation_id}/export", response_model=Dict[str, Any])
async def export_investigation(investigation_id: str):
    """Export investigation as a structured brief."""
    inv = await workspace.get_investigation(investigation_id)
    if not inv:
        raise HTTPException(status_code=404, detail="Investigation not found")
    messages = await workspace.get_messages(investigation_id)
    export = {
        "title": inv["title"],
        "investigation_id": investigation_id,
        "created_at": inv.get("created_at"),
        "message_count": inv.get("message_count", 0),
        "messages": [
            {"role": m["role"], "narrative": m.get("narrative"), "blocks_rendered": m.get("blocks_rendered", [])}
            for m in messages
        ],
    }
    return export


@router.get("/blocks", response_model=Dict[str, Any])
async def list_blocks():
    """Return the block registry."""
    blocks = workspace.__class__.BLOCK_REGISTRY_SEED
    return blocks


@router.post("/quick", response_model=Dict[str, Any])
async def run_quick_macro(req: QuickRequest):
    """Run a predefined macro query and create a new investigation."""
    from ..services.workspace_orchestrator import MACRO_QUERIES
    macro = MACRO_QUERIES.get(req.macro)
    if not macro:
        raise HTTPException(status_code=400, detail=f"Unknown macro: {req.macro}")
    inv = await workspace.create_investigation(title=f"{req.macro.replace('_', ' ').title()}")
    await workspace.store_message(inv["investigation_id"], {
        "role": "user",
        "message_index": 0,
        "query_text": macro["query"],
    })
    envelope = await workspace.process_query(macro["query"], inv["investigation_id"])
    return envelope
