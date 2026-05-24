"""
Doctrine Client — AnythingLLM API wrapper.

Queries the doctrine library for strategic/theoretical context
from ingested books, papers, and reports.

Resilient: if AnythingLLM is unreachable, returns empty results
gracefully — does not block the synthesis pipeline.
"""

from __future__ import annotations

import json
from typing import Any, Dict, List, Optional

import httpx

from ..core.config import settings

ANYTHINGLLM_BASE = settings.ANYTHINGLLM_BASE_URL
ANYTHINGLLM_KEY = settings.ANYTHINGLLM_API_KEY

HEADERS = {
    "Authorization": f"Bearer {ANYTHINGLLM_KEY}",
    "Content-Type": "application/json",
}

WORKSPACES = [
    "CORE_DOCTRINE",
    "TUNISIA_STATE",
    "POLITICAL_ACTORS",
    "SECURITY_INTEL",
    "HISTORICAL_MEMORY",
    "RRI_ENGINE",
    "LIVE_INTELLIGENCE",
]

TIMEOUT = 10.0  # seconds


async def search_doctrine(
    query: str,
    workspace: Optional[str] = None,
    limit: int = 5,
) -> List[Dict[str, Any]]:
    """Query AnythingLLM for doctrine-relevant chunks.

    If workspace is None, searches across all workspaces sequentially
    (AnythingLLM doesn't support cross-workspace query natively).
    If AnythingLLM is unreachable, returns empty list.

    Returns:
        List of chunks with chunk_id, workspace, source_document,
        chunk_text, similarity, metadata.
    """
    if not ANYTHINGLLM_KEY:
        return []

    targets = [workspace] if workspace else WORKSPACES
    results: List[Dict[str, Any]] = []
    max_per_ws = max(1, limit // len(targets)) + 1

    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        for ws in targets:
            try:
                payload = {
                    "message": query,
                    "mode": "query",
                    "sessionId": "doctrine-retrieval",
                }
                resp = await client.post(
                    f"{ANYTHINGLLM_BASE}/v1/workspace/{ws}/chat",
                    json=payload,
                    headers=HEADERS,
                )
                if resp.status_code != 200:
                    continue

                data = resp.json()
                chunks = _parse_doctrine_response(data, ws)

                # Add similarity ranking (AnythingLLM returns relevance scores)
                for chunk in chunks:
                    sim = chunk.get("similarity", 0.5)
                    chunk["rerank_score"] = round(sim * 0.9 + 0.1, 4)

                results.extend(chunks[:max_per_ws])

            except (httpx.ConnectError, httpx.TimeoutException):
                continue
            except Exception:
                continue

    # Sort by rerank_score descending
    results.sort(key=lambda c: c.get("rerank_score", 0), reverse=True)
    return results[:limit]


def _parse_doctrine_response(
    data: Dict[str, Any],
    workspace: str,
) -> List[Dict[str, Any]]:
    """Parse AnythingLLM chat response into chunk list.

    AnythingLLM returns:
    {
        "sources": [
            {
                "text": "...",
                "title": "Document Title",
                "metadata": { ... },
                "score": 0.84,
                "document_id": "..."
            }
        ]
    }
    """
    sources = []
    raw_sources = data.get("sources", data.get("documents", []))

    for src in raw_sources:
        if isinstance(src, dict):
            sources.append({
                "chunk_id": src.get("document_id", src.get("id", "")),
                "workspace": workspace,
                "source_document": src.get("title", src.get("filename", "Unknown")),
                "chunk_text": src.get("text", src.get("content", "")),
                "similarity": src.get("score", src.get("similarity", 0.5)),
                "metadata": src.get("metadata", {}),
            })
        elif isinstance(src, str):
            sources.append({
                "chunk_id": "",
                "workspace": workspace,
                "source_document": "Unknown",
                "chunk_text": src,
                "similarity": 0.5,
                "metadata": {},
            })

    return sources


async def get_workspace_status() -> List[Dict[str, Any]]:
    """Return document count and status per workspace.

    Fetches from AnythingLLM API. Falls back to doctrine_ingestion_log
    in Supabase if AnythingLLM is unreachable.
    """
    if not ANYTHINGLLM_KEY:
        return _status_from_db()

    statuses: List[Dict[str, Any]] = []

    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        for ws in WORKSPACES:
            try:
                resp = await client.get(
                    f"{ANYTHINGLLM_BASE}/v1/workspace/{ws}",
                    headers=HEADERS,
                )
                if resp.status_code == 200:
                    data = resp.json()
                    doc_count = len(data.get("documents", []))
                    statuses.append({
                        "workspace": ws,
                        "document_count": doc_count,
                        "status": "active" if doc_count > 0 else "empty",
                        "source": "anythingllm",
                    })
                else:
                    statuses.append({
                        "workspace": ws,
                        "document_count": 0,
                        "status": "unavailable",
                        "source": "anythingllm",
                    })
            except (httpx.ConnectError, httpx.TimeoutException):
                statuses.append({
                    "workspace": ws,
                    "document_count": 0,
                    "status": "offline",
                    "source": "anythingllm",
                })
                continue

    return statuses


def _status_from_db() -> List[Dict[str, Any]]:
    """Fallback: read workspace status from doctrine_ingestion_log."""
    try:
        from ..core.database import db

        statuses = []
        for ws in WORKSPACES:
            res = (
                db.table("doctrine_ingestion_log")
                .select("id")
                .eq("workspace", ws)
                .eq("status", "active")
                .execute()
            )
            doc_count = len(res.data) if res.data else 0
            statuses.append({
                "workspace": ws,
                "document_count": doc_count,
                "status": "active" if doc_count > 0 else "empty",
                "source": "db_log",
            })
        return statuses
    except Exception:
        return [
            {"workspace": ws, "document_count": 0, "status": "unknown", "source": "db_log"}
            for ws in WORKSPACES
        ]


async def ingest_document(
    file_path: str,
    workspace: str,
    metadata: Optional[Dict[str, Any]] = None,
) -> bool:
    """Programmatic document ingestion into AnythingLLM.

    Uses the /api/document/upload endpoint.
    For Tier 1 and 2 docs, use AnythingLLM UI instead.
    This is for automated Tier 3 sources.

    Returns:
        True if ingestion succeeded.
    """
    if not ANYTHINGLLM_KEY:
        return False

    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            with open(file_path, "rb") as f:
                files = {"file": f}
                data = {"workspace": workspace}
                if metadata:
                    data["metadata"] = json.dumps(metadata)

                resp = await client.post(
                    f"{ANYTHINGLLM_BASE}/document/upload",
                    headers={"Authorization": f"Bearer {ANYTHINGLLM_KEY}"},
                    data=data,
                    files=files,
                )
                return resp.status_code in (200, 201)

        except (httpx.ConnectError, httpx.TimeoutException, FileNotFoundError):
            return False


async def workspace_suggest(query: str) -> Optional[str]:
    """Suggest the most relevant workspace for a query.

    Uses simple keyword matching against workspace descriptions.
    """
    ws_keywords: Dict[str, List[str]] = {
        "CORE_DOCTRINE": [
            "analysis", "analytic", "methodology", "tradecraft", "cognitive",
            "bias", "heuer", "kent", "doctrine", "strategy", "theory",
        ],
        "TUNISIA_STATE": [
            "economic", "debt", "imf", "fiscal", "inflation",
            "subsidy", "sovereign", "default", "unemployment", "bct",
            "budget", "trade", "growth", "gdp",
        ],
        "POLITICAL_ACTORS": [
            "saied", "ugtt", "ennahda", "president", "parliament",
            "elite", "actor", "political", "coalition", "decree",
        ],
        "SECURITY_INTEL": [
            "security", "threat", "terrorism", "protest", "border",
            "libya", "algeria", "smuggling", "military", "instability",
        ],
        "HISTORICAL_MEMORY": [
            "tunisia", "tunisian", "tunis", "gafsa", "kasserine",
            "bouazizi", "revolution", "history", "historical", "crisis",
            "arab spring", "bread riot",
        ],
        "RRI_ENGINE": [
            "rri", "risk", "index", "cascade", "equation", "formula",
            "model", "simulation", "scenario", "threshold", "velocity",
        ],
        "LIVE_INTELLIGENCE": [
            "live", "current", "recent", "today", "monitoring",
            "signal", "alert", "feed", "rss", "breaking",
        ],
    }

    query_lower = query.lower()
    best_ws = None
    best_count = 0

    for ws, keywords in ws_keywords.items():
        count = sum(1 for kw in keywords if kw in query_lower)
        if count > best_count:
            best_count = count
            best_ws = ws

    return best_ws if best_count > 0 else None
