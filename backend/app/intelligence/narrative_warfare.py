"""
Narrative Warfare Engine — Framing detection, slogan tracking, sentiment clustering.

Consumes Telegram + RSS text from Supabase, produces:
  - Active frames with strength per source category
  - Trending slogans/memes (emerging ngrams)
  - Sentiment distribution (anger, fear, hope, defiance, resignation)
  - Narrative convergence score (how aligned sources are)
  - Government narrative decay (contradictions over time)
"""

import re
from collections import Counter, defaultdict
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Optional, Tuple
import math

from ..core.database import db

# ── Frame definitions ──────────────────────────────────────────────

FRAMES: Dict[str, Dict[str, Any]] = {
    "anti_imf": {
        "label": "Anti-IMF",
        "keywords": ["fmi", "prêt", "dette", "austérité", "condition", "remboursement", "fonds monétaire"],
        "color": "#ef4444", "category": "economic", "polarity": -1,
    },
    "anti_elite": {
        "label": "Anti-Elite",
        "keywords": ["corruption", "élite", "privilège", "caste", "voleur", "détournement", "impunité"],
        "color": "#dc2626", "category": "political", "polarity": -1,
    },
    "anti_system": {
        "label": "Anti-System",
        "keywords": ["système", "régime", "dictature", "autoritaire", "oppression", "tyrannie"],
        "color": "#991b1b", "category": "political", "polarity": -1,
    },
    "dignity": {
        "label": "Dignity",
        "keywords": ["karama", "dignité", "honneur", "respect", "كرامة", "عزة"],
        "color": "#a855f7", "category": "social", "polarity": 1,
    },
    "hunger": {
        "label": "Hunger / Cost of Living",
        "keywords": ["faim", "prix", "pénurie", "vie chère", "pauvreté", "subvention", " inflation"],
        "color": "#f59e0b", "category": "economic", "polarity": -1,
    },
    "sovereignty": {
        "label": "Sovereignty",
        "keywords": ["souveraineté", "indépendance", "colonial", "ingérence", "nationalisme", "patriotisme"],
        "color": "#22c55e", "category": "political", "polarity": 1,
    },
    "security": {
        "label": "Security / Stability",
        "keywords": ["sécurité", "terrorisme", "stabilité", "ordre", "paix", "protection"],
        "color": "#3b82f6", "category": "security", "polarity": 0,
    },
    "reform": {
        "label": "Reform / Modernization",
        "keywords": ["réforme", "modernisation", "développement", "investissement", "transformation"],
        "color": "#06b6d4", "category": "economic", "polarity": 1,
    },
    "protest": {
        "label": "Protest / Mobilization",
        "keywords": ["grève", "manifestation", "protestation", "soulèvement", "émeute", "rassemblement"],
        "color": "#ff6b35", "category": "social", "polarity": -1,
    },
    "unity": {
        "label": "Unity / Solidarity",
        "keywords": ["unité", "solidarité", "national", "ensemble", "réconciliation", "union"],
        "color": "#14b8a6", "category": "social", "polarity": 1,
    },
}

# ── Sentiment lexicon (Arabic/French/English) ──────────────────────

SENTIMENT_LEXICON: Dict[str, Dict[str, List[str]]] = {
    "anger": {
        "ar": ["غضب", "سخط", "حقد", "كراهية", "ثورة"],
        "fr": ["colère", "rage", "haine", "indignation", "frustration"],
        "en": ["anger", "rage", "fury", "outrage", "frustration"],
    },
    "fear": {
        "ar": ["خوف", "قلق", "رعب", "ذعر", "هلع"],
        "fr": ["peur", "crainte", "inquiétude", "panique", "terreur"],
        "en": ["fear", "anxiety", "panic", "terror", "dread"],
    },
    "hope": {
        "ar": ["أمل", "تفاؤل", "رجاء", "تطلع"],
        "fr": ["espoir", "optimisme", "confiance", "foi"],
        "en": ["hope", "optimism", "confidence", "faith", "trust"],
    },
    "defiance": {
        "ar": ["تحدي", "صمود", "مقاومة", "ثبات"],
        "fr": ["défi", "résistance", "bravade", "combativité"],
        "en": ["defiance", "resistance", "defy", "challenge", "confront"],
    },
    "resignation": {
        "ar": ["استسلام", "يأس", "لامبالاة", "انكسار"],
        "fr": ["résignation", "désespoir", "apathie", "lassitude"],
        "en": ["resignation", "despair", "apathy", "hopeless", "tired"],
    },
    "surprise": {
        "ar": ["مفاجأة", "صدمة", "دهشة", "ذهول"],
        "fr": ["surprise", "choc", "étonnement", "stupeur"],
        "en": ["surprise", "shock", "astonishment", "stun"],
    },
}


def _tokenize(text: str) -> List[str]:
    return re.findall(r'\w+', text.lower())


def _detect_frames(text: str) -> Dict[str, float]:
    tokens = _tokenize(text)
    scores = {}
    for fid, frame in FRAMES.items():
        count = sum(1 for kw in frame["keywords"] if kw.lower() in text.lower())
        if count > 0:
            scores[fid] = min(1.0, count / 5)
    return scores


def _detect_sentiment(text: str) -> Dict[str, float]:
    text_lower = text.lower()
    scores = {}
    for emotion, lang_dict in SENTIMENT_LEXICON.items():
        count = 0
        for lang_words in lang_dict.values():
            count += sum(1 for w in lang_words if w.lower() in text_lower)
        scores[emotion] = count
    total = sum(scores.values()) or 1
    return {k: round(v / total, 3) for k, v in scores.items()}


def _extract_ngrams(text: str, n: int = 3) -> List[str]:
    tokens = _tokenize(text)
    if len(tokens) < n:
        return []
    return [' '.join(tokens[i:i+n]) for i in range(len(tokens) - n + 1)]


class NarrativeEngine:
    """Analyzes text sources for narrative warfare indicators."""

    def __init__(self):
        self.history: List[Dict] = []
        self._frame_history: Dict[str, List[float]] = defaultdict(list)
        self._cached: Optional[Dict] = None
        self._last_fetch: Optional[datetime] = None
        self._cache_ttl: int = 120  # seconds

    async def get_or_analyze(self, hours: int = 720) -> Dict:
        """Return cached result if fresh, otherwise fetch and analyze."""
        now = datetime.now(timezone.utc)
        if self._cached and self._last_fetch:
            age = (now - self._last_fetch).total_seconds()
            if age < self._cache_ttl:
                return self._cached
        # Run analysis (slow)
        result = await self.fetch_and_analyze(hours)
        self._cached = result
        self._last_fetch = now
        return result

    def analyze_texts(self, texts: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze a batch of texts (from Telegram + RSS). Each text has: text, source, category, date."""
        if not texts:
            return self._empty_result()

        frame_counts: Dict[str, int] = Counter()
        frame_total: Dict[str, float] = defaultdict(float)
        sentiment_total: Dict[str, float] = defaultdict(float)
        all_ngrams: Counter = Counter()
        source_frames: Dict[str, Counter] = defaultdict(Counter)
        source_counts: Counter = Counter()

        for item in texts:
            text = item.get("text", "") or ""
            source_cat = item.get("channel_category", item.get("category", "unknown"))
            source_counts[source_cat] += 1

            frames = _detect_frames(text)
            for fid, score in frames.items():
                frame_counts[fid] += 1
                frame_total[fid] += score
                source_frames[source_cat][fid] += 1

            sentiment = _detect_sentiment(text)
            for emo, score in sentiment.items():
                sentiment_total[emo] += score

            ngrams = _extract_ngrams(text, 3)
            # Filter meaningful ngrams (no stopwords-only)
            for ng in ngrams:
                if len(ng.split()) >= 2 and all(len(w) > 2 for w in ng.split()):
                    all_ngrams[ng] += 1

        # Frame strengths
        n = len(texts)
        frame_results = {}
        for fid in FRAMES:
            count = frame_counts.get(fid, 0)
            frame_results[fid] = {
                "label": FRAMES[fid]["label"],
                "color": FRAMES[fid]["color"],
                "category": FRAMES[fid]["category"],
                "polarity": FRAMES[fid]["polarity"],
                "count": count,
                "strength": round(frame_total.get(fid, 0) / max(n, 1), 3),
                "share": round(count / max(n, 1), 3),
            }

        # Sentiment distribution
        sent_total = sum(sentiment_total.values()) or 1
        sentiment_results = {
            emo: round(score / sent_total, 3)
            for emo, score in sorted(sentiment_total.items(), key=lambda x: -x[1])
        }

        # Trending slogans (ngrams appearing more than once)
        slogan_results = [
            {"text": ng, "count": cnt}
            for ng, cnt in all_ngrams.most_common(30)
            if cnt >= 2
        ]

        # Source-level frame analysis
        source_results = {}
        for src, frames_counter in source_frames.items():
            total = sum(frames_counter.values()) or 1
            source_results[src] = {
                "total_texts": source_counts[src],
                "top_frame": frames_counter.most_common(1)[0][0] if frames_counter else None,
                "frame_diversity": len(frames_counter),
                "dominant_frame_share": round(frames_counter.most_common(1)[0][1] / total, 3) if frames_counter else 0,
            }

        # Narrative convergence score
        # High convergence = all source categories share similar frame distributions
        convergence = self._compute_convergence(source_frames, source_counts)

        # Dominant narrative sentiment polarity
        dominant_frame = max(frame_results.values(), key=lambda f: f["strength"]) if frame_results else None
        polarity_score = dominant_frame["polarity"] if dominant_frame else 0

        result = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "texts_analyzed": n,
            "active_frames": sorted(frame_results.values(), key=lambda f: -f["strength"]),
            "dominant_frame": dominant_frame["label"] if dominant_frame else None,
            "sentiment": sentiment_results,
            "dominant_emotion": max(sentiment_results, key=sentiment_results.get) if sentiment_results else "neutral",
            "trending_slogans": slogan_results[:15],
            "source_analysis": source_results,
            "narrative_convergence": round(convergence, 3),
            "polarity_score": polarity_score,
            "frame_diversity": len([f for f in frame_results.values() if f["count"] > 0]),
        }

        self.history.append(result)
        for fid, fdata in frame_results.items():
            self._frame_history[fid].append(fdata["strength"])
            if len(self._frame_history[fid]) > 100:
                self._frame_history[fid] = self._frame_history[fid][-100:]

        if len(self.history) > 500:
            self.history = self.history[-500:]

        return result

    def _compute_convergence(self, source_frames: Dict[str, Counter], source_counts: Counter) -> float:
        """How aligned different source categories are. 1.0 = perfect alignment, 0.0 = total divergence."""
        sources = list(source_frames.keys())
        if len(sources) < 2:
            return 1.0
        # Compare each source's frame distribution using cosine similarity
        all_frames = list(FRAMES.keys())
        similarities = []
        for i in range(len(sources)):
            for j in range(i + 1, len(sources)):
                si = sources[i]
                sj = sources[j]
                vec_i = [source_frames[si].get(f, 0) for f in all_frames]
                vec_j = [source_frames[sj].get(f, 0) for f in all_frames]
                dot = sum(a * b for a, b in zip(vec_i, vec_j))
                mag_i = math.sqrt(sum(a * a for a in vec_i)) or 1
                mag_j = math.sqrt(sum(b * b for b in vec_j)) or 1
                similarities.append(dot / (mag_i * mag_j))
        return sum(similarities) / len(similarities) if similarities else 1.0

    def get_current_state(self) -> Dict:
        return self.history[-1] if self.history else self._empty_result()

    def get_frame_trend(self, frame_id: str, window: int = 20) -> List[float]:
        return self._frame_history.get(frame_id, [])[-window:]

    def get_history(self, limit: int = 50) -> List[Dict]:
        return self.history[-limit:]

    def _empty_result(self) -> Dict:
        return {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "texts_analyzed": 0,
            "active_frames": [],
            "dominant_frame": None,
            "sentiment": {},
            "dominant_emotion": "neutral",
            "trending_slogans": [],
            "source_analysis": {},
            "narrative_convergence": 1.0,
            "polarity_score": 0,
            "frame_diversity": 0,
        }

    async def fetch_and_analyze(self, hours: int = 720) -> Dict:
        """Fetch recent Telegram + RSS texts from Supabase and analyze."""
        since = (datetime.now(timezone.utc) - timedelta(hours=hours)).isoformat()
        texts = []

        try:
            tg = db.table("telegram_messages").select("text, channel_category, date")\
                .gte("date", since).limit(100).execute()
            for row in tg.data or []:
                if row.get("text"):
                    texts.append({
                        "text": row["text"],
                        "channel_category": row.get("channel_category", "unknown"),
                        "category": "telegram",
                        "date": row.get("date", ""),
                    })
        except Exception as e:
            print(f"[Narrative] Telegram fetch error: {e}")

        try:
            articles = db.table("articles").select("title, summary, category, published_at")\
                .gte("published_at", since).limit(100).execute()
            for row in articles.data or []:
                text = f"{row.get('title', '')} {row.get('summary', '')}"
                if text.strip():
                    texts.append({
                        "text": text,
                        "channel_category": row.get("category", "news"),
                        "category": "rss",
                        "date": row.get("published_at", ""),
                    })
        except Exception as e:
            print(f"[Narrative] RSS fetch error: {e}")

        result = self.analyze_texts(texts)
        self._cached = result
        self._last_fetch = datetime.now(timezone.utc)
        return result


# Singleton
_instance: Optional[NarrativeEngine] = None

def get_narrative_engine() -> NarrativeEngine:
    global _instance
    if _instance is None:
        _instance = NarrativeEngine()
    return _instance
