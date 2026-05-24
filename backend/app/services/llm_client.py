"""
LLM Client — Abstract generation + embedding layer.

Provider: Groq (free tier, Llama 3.3 70B). Fallback: OpenRouter.
Embeddings: OpenRouter (text-embedding-3-small, 1536-dim).

No other file in the codebase imports Groq or OpenRouter directly.
"""

from __future__ import annotations

from typing import Optional

from groq import AsyncGroq
from openai import AsyncOpenAI

from ..core.config import settings

# ── Client Initialization ───────────────────────────────────────────

_groq: Optional[AsyncGroq] = None
_openrouter: Optional[AsyncOpenAI] = None

GROQ_MODEL = "llama-3.3-70b-versatile"
OPENROUTER_CHAT_MODEL = "google/gemini-2.0-flash"
EMBED_MODEL = "text-embedding-3-small"
EMBED_DIMENSIONS = 1536
OPENROUTER_BASE = "https://openrouter.ai/api/v1"


def _get_groq() -> AsyncGroq:
    global _groq
    if _groq is None and settings.GROQ_API_KEY:
        _groq = AsyncGroq(api_key=settings.GROQ_API_KEY)
    return _groq


def _get_openrouter() -> AsyncOpenAI:
    global _openrouter
    if _openrouter is None:
        _openrouter = AsyncOpenAI(
            base_url=OPENROUTER_BASE,
            api_key=settings.OPENROUTER_API_KEY,
            default_headers={
                "HTTP-Referer": "https://tunisia-intel.local",
                "X-Title": "TunisiaIntel",
            },
        )
    return _openrouter


# ── Generation ──────────────────────────────────────────────────────


async def generate(
    prompt: str,
    system: str = "",
    max_tokens: int = 1000,
    response_format: str = "text",
) -> str:
    """Generate text via Groq (primary) or OpenRouter (fallback).

    Args:
        prompt: User message.
        system: System instruction.
        max_tokens: Maximum output tokens.
        response_format: "text" or "json". JSON mode enforces structured output.

    Returns:
        Generated text string.
    """
    messages = []
    if system:
        messages.append({"role": "system", "content": system})
    messages.append({"role": "user", "content": prompt})

    kwargs = dict(
        model=GROQ_MODEL,
        messages=messages,
        max_tokens=max_tokens,
    )

    if response_format == "json":
        kwargs["response_format"] = {"type": "json_object"}

    # Primary: Groq
    groq = _get_groq()
    if groq:
        try:
            resp = await groq.chat.completions.create(**kwargs)
            return resp.choices[0].message.content or ""
        except Exception:
            pass

    # Fallback: OpenRouter
    or_client = _get_openrouter()
    fallback_kwargs = dict(
        model=OPENROUTER_CHAT_MODEL,
        messages=messages,
        max_tokens=max_tokens,
    )
    if response_format == "json":
        fallback_kwargs["response_format"] = {"type": "json_object"}
    try:
        resp = await or_client.chat.completions.create(**fallback_kwargs)
        return resp.choices[0].message.content or ""
    except Exception as e:
        raise RuntimeError(f"LLM generation failed: {e}")


# ── Embedding ───────────────────────────────────────────────────────


async def embed(text: str) -> list[float]:
    """Embed text into a 1536-dim vector via OpenRouter.

    Args:
        text: Input text to embed.

    Returns:
        List of 1536 floats.
    """
    or_client = _get_openrouter()
    try:
        resp = await or_client.embeddings.create(
            model=EMBED_MODEL,
            input=text,
            dimensions=EMBED_DIMENSIONS,
        )
        return resp.data[0].embedding
    except Exception as e:
        raise RuntimeError(f"Embedding failed: {e}")
