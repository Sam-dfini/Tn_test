"""RAG API — Semantic search, ingestion, and synthesis endpoints."""

from __future__ import annotations

from typing import Any, Dict, Optional

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from ..services.rag_ingestion import (
    backfill_all_articles,
    backfill_all_telegram,
    embed_article,
    embed_telegram_message,
)
from ..services.rag_synthesis import _search_embeddings, synthesize
from ..services.brief_engine import generate_brief
from ..services.llm_client import embed
from ..services.state_snapshot import get_latest_snapshot

router = APIRouter(prefix="/rag", tags=["rag"])


class SynthesizeRequest(BaseModel):
    query: str
    trigger_source: str = "manual"
    chain_id: Optional[str] = None
    rri_context: Optional[Dict[str, Any]] = None
    max_chunks: int = 5


# ── Search ──────────────────────────────────────────────────────────


@router.get("/search")
async def search(
    q: str = Query(..., description="Query text"),
    limit: int = Query(10, ge=1, le=50),
    source: str = Query("all", pattern="^(articles|telegram|all)$"),
    governorate: Optional[str] = None,
    category: Optional[str] = None,
    days_back: int = Query(30, ge=1, le=365),
):
    """Semantic search across article and Telegram embeddings.

    Embeds the query, searches both tables by cosine similarity,
    applies filters, reranks by (similarity * freshness), returns top chunks.
    """
    try:
        query_embedding = await embed(q)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Embedding failed: {e}")

    results = await _search_embeddings(
        query_embedding=query_embedding,
        source=source,
        limit=limit,
        governorate=governorate,
        category=category,
        days_back=days_back,
    )

    return {
        "query": q,
        "total": len(results),
        "results": results,
        "retrieved_at": __import__("datetime").datetime.now().isoformat(),
    }


# ── Synthesis ───────────────────────────────────────────────────────


@router.get("/brief")
async def get_brief():
    """Generate a full RAG-grounded intelligence brief from the current snapshot.

    Returns structured brief with situation, assessment, developments,
    watch indicators, recommended actions, and citations.
    """
    snapshot = get_latest_snapshot()
    if not snapshot:
        return {
            "id": None,
            "generated_at": __import__("datetime").datetime.now().isoformat(),
            "classification": "ROUTINE",
            "classification_basis": "No snapshot available",
            "situation": "Insufficient data to generate a brief.",
            "key_developments": [],
            "assessment": "No data.",
            "watch_indicators": [],
            "recommended_actions": [],
            "citations": [],
        }
    return await generate_brief(snapshot)


@router.post("/synthesize")
async def synthesize_endpoint(req: SynthesizeRequest):
    """Full RAG pipeline: retrieve → format → generate → cite → log.

    Accepts a query and optional RRI context, returns grounded prose
    with citations and confidence score.
    """
    result = await synthesize(
        query=req.query,
        trigger_source=req.trigger_source,
        chain_id=req.chain_id,
        rri_context=req.rri_context,
        max_chunks=req.max_chunks,
    )
    return result


# ── Ingestion ───────────────────────────────────────────────────────


class IngestArticleRequest(BaseModel):
    article_id: str


class IngestTelegramRequest(BaseModel):
    message_id: str


@router.post("/ingest/article")
async def ingest_article(req: IngestArticleRequest):
    """Embed a single article (chunk + embed + upsert)."""
    try:
        chunks = await embed_article(req.article_id)
        return {"status": "ok", "article_id": req.article_id, "chunks_created": chunks}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Embedding failed: {e}")


@router.post("/ingest/telegram")
async def ingest_telegram(req: IngestTelegramRequest):
    """Embed a single Telegram message."""
    try:
        ok = await embed_telegram_message(req.message_id)
        return {"status": "ok", "message_id": req.message_id, "embedded": ok}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Embedding failed: {e}")


@router.post("/ingest/backfill")
async def ingest_backfill():
    """Batch embed all existing articles and Telegram messages without embeddings."""
    article_result = await backfill_all_articles()
    telegram_result = await backfill_all_telegram()
    return {
        "status": "ok",
        "articles": article_result,
        "telegram": telegram_result,
    }
