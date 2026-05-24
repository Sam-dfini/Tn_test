"""
RAG Synthesis — Retrieve → Format → Generate → Cite → Log.

Full RAG pipeline: accepts a query, retrieves relevant chunks from
article_embeddings / telegram_embeddings PLUS doctrine library via
AnythingLLM, formats them with a system prompt, generates a grounded
response via LLM, and logs everything to rag_query_log.

Live signals weighted 0.60, doctrine/theoretical signals weighted 0.40.
"""

from __future__ import annotations

import json
import time
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from uuid import uuid4

from ..core.database import db
from .doctrine_client import search_doctrine, workspace_suggest
from .llm_client import generate, embed

SYSTEM_PROMPT_TEMPLATE = """\
You are a structured intelligence analyst for Tunisia.
You have been provided {n} retrieved intelligence fragments.
Your task: synthesize a grounded analytical response.

RULES:
- Every factual claim must reference a source chunk by its ID
- Do not state anything not supported by the provided fragments
- If evidence is insufficient, say so explicitly with low confidence
- Output must be valid JSON matching this exact structure:
  {{
    "prose": "your analysis here",
    "confidence": 0.0-1.0,
    "insufficient_evidence": false
  }}
- Maximum prose length: 200 words
- Cite in format: [SOURCE: chunk_id]

RETRIEVED FRAGMENTS:
{chunks}

RRI CONTEXT:
{rri_context}

QUERY: {query}"""


async def _search_embeddings(
    query_embedding: List[float],
    source: str = "all",
    limit: int = 10,
    governorate: Optional[str] = None,
    category: Optional[str] = None,
    days_back: Optional[int] = 30,
) -> List[Dict[str, Any]]:
    """Search both embedding tables by cosine similarity with filters.

    Returns merged, deduplicated results sorted by (similarity * freshness).
    """
    results: List[Dict[str, Any]] = []
    embedding_str = f"[{','.join(str(v) for v in query_embedding)}]"


    tables = []
    if source in ("all", "articles"):
        tables.append(("article_embeddings", "article_id"))
    if source in ("all", "telegram"):
        tables.append(("telegram_embeddings", "message_id"))

    for table_name, id_field in tables:
        try:
            res = (
                db.table(table_name)
                .select(f"*, {table_name}.embedding <=> '{embedding_str}'::vector as distance")
                .order("distance")
                .limit(limit * 2)
                .execute()
            )
        except Exception:
            try:
                res = (
                    db.rpc(
                        "exec_sql_admin",
                        {
                            "sql_query": (
                                f"SELECT *, embedding <=> '{embedding_str}'::vector AS distance "
                                f"FROM {table_name} ORDER BY distance LIMIT {limit * 2}"
                            )
                        },
                    )
                    .execute()
                )
            except Exception:
                continue

        rows = res.data or []
        for row in rows:
            similarity = 1.0 - row.get("distance", 1.0)
            if similarity < 0.1:
                continue

            meta_raw = row.get("metadata", {})
            if isinstance(meta_raw, str):
                try:
                    meta_raw = json.loads(meta_raw)
                except (json.JSONDecodeError, TypeError):
                    meta_raw = {}

            # Apply filters
            if governorate and meta_raw.get("governorate", "").lower() != governorate.lower():
                continue
            if category and meta_raw.get("category", "").lower() != category.lower():
                continue

            # Freshness boost: recency = 1.0 for today, decays to 0.0 over days_back
            freshness = 1.0
            date_str = meta_raw.get("date", "")
            if date_str and days_back:
                try:
                    d = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
                    age_days = (datetime.now(timezone.utc) - d).total_seconds() / 86400
                    freshness = max(0.0, 1.0 - age_days / days_back)
                except (ValueError, TypeError):
                    pass

            rerank_score = similarity * 0.7 + freshness * 0.3

            results.append({
                "chunk_id": row["id"],
                "source_table": table_name,
                "source": meta_raw.get("source", ""),
                "date": meta_raw.get("date", ""),
                "governorate": meta_raw.get("governorate", ""),
                "category": meta_raw.get("category", ""),
                "similarity": round(similarity, 4),
                "freshness": round(freshness, 4),
                "rerank_score": round(rerank_score, 4),
                "chunk_text": row.get("chunk_text", ""),
                "metadata": meta_raw,
            })

    # Sort by rerank_score, deduplicate by chunk_id
    seen: set = set()
    deduped: List[Dict[str, Any]] = []
    for r in sorted(results, key=lambda x: x["rerank_score"], reverse=True):
        if r["chunk_id"] not in seen:
            seen.add(r["chunk_id"])
            deduped.append(r)

    return deduped[:limit]


async def _merge_live_and_doctrine(
    query: str,
    *,
    limit: int = 5,
    governorate: Optional[str] = None,
    category: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """Query both live embedding tables and the doctrine library.

    Returns merged, reranked chunks:
      - Live chunks: weighted 0.60
      - Doctrine chunks: weighted 0.40
    Final sort by combined_score descending.
    """
    # 1. Query embedding
    query_embedding = await embed(query)
    live_chunks = await _search_embeddings(
        query_embedding,
        limit=limit * 2,
        governorate=governorate,
        category=category,
    )

    # 2. Query doctrine
    suggested_ws = await workspace_suggest(query)
    doctrine_chunks = await search_doctrine(query, workspace=suggested_ws, limit=limit * 2)

    # 3. Normalize and weight
    for c in live_chunks:
        c["combined_score"] = c.get("rerank_score", 0.5) * 0.60

    for c in doctrine_chunks:
        c["combined_score"] = c.get("rerank_score", 0.5) * 0.40

    # 4. Tag source
    for c in live_chunks:
        c["doctrine"] = False
    for c in doctrine_chunks:
        c["doctrine"] = True

    merged = live_chunks + doctrine_chunks
    merged.sort(key=lambda x: x["combined_score"], reverse=True)

    # 5. Deduplicate by chunk_id (cross-source)
    seen: set = set()
    deduped: List[Dict[str, Any]] = []
    for c in merged:
        cid = c.get("chunk_id")
        if cid and cid in seen:
            continue
        if cid:
            seen.add(cid)
        deduped.append(c)

    return deduped[:limit]


async def synthesize(
    query: str,
    trigger_source: str,
    chain_id: Optional[str] = None,
    rri_context: Optional[Dict[str, Any]] = None,
    max_chunks: int = 5,
) -> Dict[str, Any]:
    """Full RAG pipeline: retrieve → format → generate → cite → log.

    Args:
        query: User query to answer.
        trigger_source: Origin of query ("brief_engine"|"ontology_chain"|"analyst_terminal"|"manual").
        chain_id: Optional chain ID if triggered by ontology activation.
        rri_context: Current RRI snapshot values for context.
        max_chunks: Maximum chunks to include in the LLM prompt.

    Returns:
        Dict with prose, citations, confidence, model_used, chunks_used.
    """
    start = time.time()

    # 1. Retrieve (live + doctrine merged)
    chunks = await _merge_live_and_doctrine(query, limit=max_chunks)

    # Count how many from each source
    live_count = sum(1 for c in chunks if not c.get("doctrine"))
    doctrine_count = sum(1 for c in chunks if c.get("doctrine"))

    # 2. Format chunks for prompt
    chunk_lines = []
    for i, c in enumerate(chunks):
        source_tag = "LIVE" if not c.get("doctrine") else f"DOCTRINE:{c.get('workspace', 'unknown')}"
        chunk_lines.append(
            f"[{i}] ID: {c['chunk_id']} | {source_tag} | "
            f"SIM: {c.get('similarity', 0.5):.3f}\n"
            f"    TEXT: {c['chunk_text'][:500]}"
        )

    chunks_formatted = "\n\n".join(chunk_lines) if chunk_lines else "No relevant fragments found."
    rri_str = json.dumps(rri_context, indent=2) if rri_context else "No RRI context provided."

    system_prompt = SYSTEM_PROMPT_TEMPLATE.format(
        n=len(chunks),
        chunks=chunks_formatted,
        rri_context=rri_str,
        query=query,
    )

    # 3. Generate
    try:
        raw_output = await generate(
            prompt=query,
            system=system_prompt,
            max_tokens=800,
            response_format="json",
        )
    except Exception:
        raw_output = '{"prose": "Synthesis failed due to LLM error.", "confidence": 0.1, "insufficient_evidence": true}'

    # 4. Parse JSON response
    try:
        parsed = json.loads(raw_output)
    except (json.JSONDecodeError, TypeError):
        parsed = {"prose": raw_output, "confidence": 0.5, "insufficient_evidence": False}

    prose = parsed.get("prose", raw_output)[:1000]
    confidence = float(parsed.get("confidence", 0.5))
    insufficient = parsed.get("insufficient_evidence", False)
    if insufficient or not chunks:
        confidence = min(confidence, 0.4)

    # 5. Build citations from chunks used
    citations = [
        {
            "chunk_id": c["chunk_id"],
            "source": c.get("source", c.get("source_document", "")),
            "doctrine": c.get("doctrine", False),
            "workspace": c.get("workspace", None) if c.get("doctrine") else None,
            "similarity": round(c.get("similarity", 0.5), 4),
            "excerpt": c["chunk_text"][:200],
        }
        for c in chunks[:5]
    ]

    elapsed = int((time.time() - start) * 1000)

    # 6. Log to rag_query_log
    try:
        db.table("rag_query_log").insert({
            "query_text": query,
            "trigger_source": trigger_source,
            "chain_id": chain_id,
            "chunks_retrieved": json.dumps([
                {
                    "chunk_id": c["chunk_id"],
                    "source": c.get("source", c.get("source_document", "")),
                    "doctrine": c.get("doctrine", False),
                    "workspace": c.get("workspace", None) if c.get("doctrine") else None,
                    "similarity": c.get("similarity", 0.5),
                }
                for c in chunks
            ]),
            "synthesis_output": prose,
            "citations": json.dumps(citations),
            "confidence": confidence,
            "model_used": "llama-3.3-70b-versatile",
            "latency_ms": elapsed,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }).execute()
    except Exception:
        pass

    return {
        "prose": prose,
        "citations": citations,
        "confidence": confidence,
        "model_used": "llama-3.3-70b-versatile",
        "chunks_used": len(chunks),
        "live_chunks": live_count,
        "doctrine_chunks": doctrine_count,
        "latency_ms": elapsed,
    }
