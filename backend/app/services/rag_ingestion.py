import logging
"""
RAG Ingestion — Chunk, embed, and upsert articles and Telegram messages.

CHUNK_SIZE = 512 tokens, CHUNK_OVERLAP = 50 tokens.
"""

from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from uuid import uuid4

import tiktoken

from ..core.database import db
from .llm_client import embed
logger = logging.getLogger(__name__)

CHUNK_SIZE = 512
CHUNK_OVERLAP = 50
_ENCODER = tiktoken.get_encoding("cl100k_base")


def _tokenize(text: str) -> List[int]:
    return _ENCODER.encode(text)


def _decode(tokens: List[int]) -> str:
    return _ENCODER.decode(tokens)


def _chunk_text(text: str) -> List[str]:
    """Split text into chunks of CHUNK_SIZE tokens with CHUNK_OVERLAP overlap."""
    tokens = _tokenize(text)
    if len(tokens) <= CHUNK_SIZE:
        return [text]

    chunks: List[str] = []
    start = 0
    while start < len(tokens):
        end = min(start + CHUNK_SIZE, len(tokens))
        chunk_tokens = tokens[start:end]
        chunks.append(_decode(chunk_tokens))
        start += CHUNK_SIZE - CHUNK_OVERLAP
        if start >= len(tokens):
            break

    return chunks


async def embed_article(article_id: str) -> int:
    """Fetch article, chunk content, embed each chunk, upsert to article_embeddings.

    Returns:
        Number of chunks created.
    """
    res = db.table("articles").select("*").eq("id", article_id).execute()
    if not res.data:
        raise ValueError(f"Article {article_id} not found")

    article = res.data[0]
    text_parts = [
        article.get("title", ""),
        article.get("summary", ""),
        article.get("content", ""),
    ]
    full_text = "\n\n".join(p for p in text_parts if p).strip()
    if not full_text:
        return 0

    chunks = _chunk_text(full_text)

    metadata = {
        "source": article.get("source_id") or article.get("source_name", ""),
        "date": (
            article.get("published_at")
            if article.get("published_at")
            else datetime.now(timezone.utc).isoformat()
        ),
        "governorate": article.get("governorate", ""),
        "category": article.get("category", ""),
        "language": article.get("language", "fr"),
        "severity": article.get("severity", 1),
        "actors": article.get("actors", []),
        "rri_variable": article.get("rri_variable", ""),
    }

    created = 0
    for idx, chunk_text in enumerate(chunks):
        try:
            embedding = await embed(chunk_text)
            db.table("article_embeddings").upsert({
                "article_id": article_id,
                "chunk_index": idx,
                "chunk_text": chunk_text,
                "embedding": embedding,
                "metadata": json.dumps(metadata),
                "created_at": datetime.now(timezone.utc).isoformat(),
            }).execute()
            created += 1
        except Exception as e:
            logger.warning("Suppressed exception in services/rag_ingestion.py: %s", e)

    return created


async def embed_telegram_message(message_id: str) -> bool:
    """One embedding per Telegram message. No chunking.

    Returns:
        True if embedded successfully.
    """
    res = db.table("telegram_messages").select("*").eq("message_id", message_id).execute()
    if not res.data:
        raise ValueError(f"Telegram message {message_id} not found")

    msg = res.data[0]
    text = msg.get("text", "").strip()
    if not text:
        return False

    metadata = {
        "channel_category": msg.get("channel_category", ""),
        "date": msg.get("date", ""),
        "views": msg.get("views", 0),
        "forwards": msg.get("forwards", 0),
    }

    try:
        embedding = await embed(text)
        db.table("telegram_embeddings").upsert({
            "message_id": message_id,
            "chunk_text": text,
            "embedding": embedding,
            "metadata": json.dumps(metadata),
            "created_at": datetime.now(timezone.utc).isoformat(),
        }).execute()
        return True
    except Exception as e:
        logger.warning("Caught exception in services/rag_ingestion.py: %s", e)
        return False


async def backfill_all_articles() -> Dict[str, int]:
    """Batch embed all existing articles without embeddings.

    Processes in batches of 50. Returns { processed, failed, skipped }.
    """
    processed = 0
    failed = 0
    skipped = 0
    offset = 0
    batch_size = 50

    while True:
        res = (
            db.table("articles")
            .select("id")
            .order("published_at", desc=True)
            .range(offset, offset + batch_size - 1)
            .execute()
        )
        batch = res.data or []
        if not batch:
            break

        # Check which already have embeddings
        ids = [a["id"] for a in batch]
        existing_res = (
            db.table("article_embeddings")
            .select("article_id")
            .in_("article_id", ids)
            .execute()
        )
        existing_ids = {r["article_id"] for r in (existing_res.data or [])}

        for article in batch:
            aid = article["id"]
            if aid in existing_ids:
                skipped += 1
                continue
            try:
                n = await embed_article(aid)
                if n > 0:
                    processed += 1
                else:
                    skipped += 1
            except Exception as e:
                logger.warning("Caught exception in services/rag_ingestion.py: %s", e)
                failed += 1

        offset += batch_size

    return {"processed": processed, "failed": failed, "skipped": skipped}


async def backfill_all_telegram() -> Dict[str, int]:
    """Batch embed all existing Telegram messages without embeddings."""
    processed = 0
    failed = 0
    skipped = 0
    offset = 0
    batch_size = 50

    while True:
        res = (
            db.table("telegram_messages")
            .select("message_id")
            .order("date", desc=True)
            .range(offset, offset + batch_size - 1)
            .execute()
        )
        batch = res.data or []
        if not batch:
            break

        ids = [m["message_id"] for m in batch]
        existing_res = (
            db.table("telegram_embeddings")
            .select("message_id")
            .in_("message_id", ids)
            .execute()
        )
        existing_ids = {r["message_id"] for r in (existing_res.data or [])}

        for msg in batch:
            mid = msg["message_id"]
            if mid in existing_ids:
                skipped += 1
                continue
            try:
                ok = await embed_telegram_message(mid)
                if ok:
                    processed += 1
                else:
                    skipped += 1
            except Exception as e:
                logger.warning("Caught exception in services/rag_ingestion.py: %s", e)
                failed += 1

        offset += batch_size

    return {"processed": processed, "failed": failed, "skipped": skipped}
