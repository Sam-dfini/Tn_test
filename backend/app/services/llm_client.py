"""
LLM Client — Abstract generation + embedding layer.

Provider: Groq (free tier, Llama 3.3 70B). Fallback: OpenRouter.
Embeddings: OpenRouter (text-embedding-3-small, 1536-dim).

Boot-time health check: check_providers() tests each provider with a
minimal call. Unhealthy providers are silently skipped for the session.
"""

from __future__ import annotations

import asyncio
from typing import Optional

from groq import AsyncGroq
from openai import AsyncOpenAI

from ..core.config import settings

# ── Boot-time health state ──────────────────────────────────────────

_healthy: set[str] = set()
_checked: bool = False


async def check_providers() -> dict[str, bool]:
    """Test each configured provider with a minimal call.

    Runs once on boot (idempotent). Populates ``_healthy`` so that
    ``_get_groq()`` / ``_get_openrouter()`` return ``None`` for any
    provider that failed.

    Returns:
        ``{"groq": True/False, "openrouter": True/False}``
    """
    global _checked, _healthy

    if _checked:
        return {"groq": "groq" in _healthy, "openrouter": "openrouter" in _healthy}

    _checked = True
    _healthy.clear()
    test_prompt = "Reply with exactly one word: ok"

    async def _test_groq() -> bool:
        if not settings.GROQ_API_KEY:
            return False
        try:
            client = AsyncGroq(api_key=settings.GROQ_API_KEY, timeout=10.0)
            resp = await client.chat.completions.create(
                model=GROQ_MODEL,
                messages=[{"role": "user", "content": test_prompt}],
                max_tokens=4,
            )
            return bool(resp.choices[0].message.content)
        except Exception:
            return False

    async def _test_openrouter() -> bool:
        if not settings.OPENROUTER_API_KEY:
            return False
        try:
            client = AsyncOpenAI(
                base_url=OPENROUTER_BASE,
                api_key=settings.OPENROUTER_API_KEY,
                timeout=10.0,
            )
            resp = await client.chat.completions.create(
                model=OPENROUTER_CHAT_MODEL,
                messages=[{"role": "user", "content": test_prompt}],
                max_tokens=4,
            )
            return bool(resp.choices[0].message.content)
        except Exception:
            return False

    groq_ok, or_ok = await asyncio.gather(_test_groq(), _test_openrouter())

    if groq_ok:
        _healthy.add("groq")
    if or_ok:
        _healthy.add("openrouter")

    print(f"[llm_client] Provider health — groq={groq_ok}, openrouter={or_ok}")
    return {"groq": groq_ok, "openrouter": or_ok}


# ── Client Initialization ───────────────────────────────────────────

_groq: Optional[AsyncGroq] = None
_openrouter: Optional[AsyncOpenAI] = None

GROQ_MODEL = "llama-3.3-70b-versatile"
OPENROUTER_CHAT_MODEL = "google/gemini-2.0-flash"
EMBED_MODEL = "text-embedding-3-small"
EMBED_DIMENSIONS = 1536
OPENROUTER_BASE = "https://openrouter.ai/api/v1"


def _get_groq() -> Optional[AsyncGroq]:
    global _groq
    if "groq" not in _healthy:
        return None
    if _groq is None:
        _groq = AsyncGroq(api_key=settings.GROQ_API_KEY)
    return _groq


def _get_openrouter() -> Optional[AsyncOpenAI]:
    global _openrouter
    if "openrouter" not in _healthy:
        return None
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
    max_tokens: int = 600,
    response_format: str = "text",
) -> str:
    """Generate text via Groq (primary) or OpenRouter (fallback).

    If neither provider is healthy (from boot check), returns an empty
    string — callers handle this gracefully.

    Args:
        prompt: User message.
        system: System instruction.
        max_tokens: Maximum output tokens.
        response_format: "text" or "json". JSON mode enforces structured output.

    Returns:
        Generated text string, or empty string if no LLM is available.
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
        except Exception as e:
            err = str(e)
            if "402" in err or "credits" in err.lower() or "payment" in err.lower():
                _healthy.discard("groq")
            pass

    # Fallback: OpenRouter (cap tokens lower to stay within free-tier limits)
    or_client = _get_openrouter()
    if or_client:
        fallback_kwargs = dict(
            model=OPENROUTER_CHAT_MODEL,
            messages=messages,
            max_tokens=min(max_tokens, 500),
        )
        if response_format == "json":
            fallback_kwargs["response_format"] = {"type": "json_object"}
        try:
            resp = await or_client.chat.completions.create(**fallback_kwargs)
            return resp.choices[0].message.content or ""
        except Exception as e:
            err = str(e)
            if "402" in err or "credits" in err.lower() or "payment" in err.lower():
                _healthy.discard("openrouter")
                print(f"[llm_client] OpenRouter marked unhealthy (402 / insufficient credits)")
            pass

    return ""


# ── Embedding ───────────────────────────────────────────────────────


async def embed(text: str) -> list[float]:
    """Embed text into a 1536-dim vector via OpenRouter.

    Returns an empty list if OpenRouter is unavailable (from boot check)
    so callers need not handle exceptions.

    Args:
        text: Input text to embed.

    Returns:
        List of 1536 floats, or empty list if unavailable.
    """
    or_client = _get_openrouter()
    if not or_client:
        return []
    try:
        resp = await or_client.embeddings.create(
            model=EMBED_MODEL,
            input=text,
            dimensions=EMBED_DIMENSIONS,
        )
        return resp.data[0].embedding
    except Exception:
        return []
