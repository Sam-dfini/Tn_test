"""
Signal Credibility Index — source reliability, corroboration, propagation velocity scoring.

Every signal (Telegram message, RSS article) gets an SCI score (0.0–1.0):
  - Fact (≥0.85)
  - Probable (0.60–0.84)
  - Rumor (0.35–0.59)
  - Coordinated Narrative (high propagation + low corroboration)
  - Psychological Operation (synthetic markers)
  - Early Weak Signal (< 0.35, high novelty)
"""

import re
import math
from collections import defaultdict
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Optional, Tuple

from ..core.database import db

# ── Source reliability defaults ─────────────────────────────────

SOURCE_BASE_RELIABILITY: Dict[str, float] = {
    # News
    "google-news-tunisie": 0.65, "google-news-tunisia": 0.65,
    "reuters-africa": 0.90, "middleeasteye-tunisia": 0.75,
    "jeuneafrique-tn": 0.80, "leconomistemaghrebin": 0.70,
    "businessnews-tn": 0.70, "kapitalis-tn": 0.65,
    "leaders-tn": 0.55, "realites-tn": 0.60,
    "inkyfada": 0.75, "babnet": 0.60, "africanmanager": 0.65,
    "nessmatn": 0.50,
    # Telegram categories
    "news": 0.55, "analyst": 0.60, "activist": 0.45,
    "opposition": 0.40, "protest": 0.35,
    "union": 0.55, "government": 0.50,
    # Default
    "default_news": 0.60, "default_telegram": 0.40,
}

SCI_LABELS = {
    "fact": {"label": "Fact", "color": "#22c55e", "min": 0.85},
    "probable": {"label": "Probable", "color": "#3b82f6", "min": 0.60},
    "rumor": {"label": "Rumor", "color": "#f59e0b", "min": 0.35},
    "coordinated_narrative": {"label": "Coordinated Narrative", "color": "#a855f7", "min": 0.0},
    "psychological_operation": {"label": "PSYOP", "color": "#ef4444", "min": 0.0},
    "early_weak": {"label": "Early Weak Signal", "color": "#64748b", "min": 0.0},
}


def _word_overlap(a: str, b: str) -> float:
    """Jaccard similarity of word sets."""
    wa = set(re.findall(r'\w+', a.lower()))
    wb = set(re.findall(r'\w+', b.lower()))
    if not wa or not wb:
        return 0.0
    return len(wa & wb) / len(wa | wb)


def _extract_keywords(text: str) -> set:
    words = re.findall(r'\w+', text.lower())
    stopwords = {'le', 'la', 'les', 'de', 'du', 'des', 'et', 'ou', 'à', 'au', 'aux',
                 'un', 'une', 'dans', 'sur', 'pour', 'par', 'avec', 'est', 'sont',
                 'ce', 'cette', 'ces', 'qui', 'que', 'dont', 'où', 'il', 'elle',
                 'nous', 'vous', 'ils', 'elles', 'the', 'and', 'for', 'in', 'of',
                 'to', 'a', 'an', 'is', 'was', 'it', 'its', 'at', 'by', 'as',
                 'من', 'في', 'على', 'إلى', 'عن', 'مع', 'كان', 'هذا', 'هذه',
                 'ذلك', 'تلك', 'التي', 'الذي', 'الذين', 'و', 'ف', 'ب', 'ل'}
    return {w for w in words if len(w) > 3 and w not in stopwords}


class SCIEngine:
    """Signal Credibility Index — scores every signal from 0.0 to 1.0."""

    def __init__(self):
        self.source_reliability: Dict[str, float] = dict(SOURCE_BASE_RELIABILITY)
        self._corroboration_cache: Dict[str, List[str]] = defaultdict(list)
        self._keyword_history: Dict[str, List[str]] = defaultdict(list)
        self._scores_history: List[Dict] = []

    def get_source_reliability(self, source_id: str) -> float:
        return self.source_reliability.get(source_id, 0.50)

    def update_source_reliability(self, source_id: str, correct: bool):
        """Bayesian update: increase reliability if correct, decrease if not."""
        current = self.source_reliability.get(source_id, 0.50)
        if correct:
            current = min(0.99, current + (1 - current) * 0.1)
        else:
            current = max(0.01, current - current * 0.15)
        self.source_reliability[source_id] = round(current, 3)

    def score_text(self, text: str, source_id: str, source_category: str = "",
                   timestamp: Optional[str] = None, keywords: Optional[List[str]] = None,
                   source_name: str = "", text_preview: str = "") -> Dict:
        """Compute SCI score for a single text."""
        if not text.strip():
            return self._empty_score(source_id)

        # 1. Source reliability (0–0.35)
        src_rel = self.source_reliability.get(source_id) or \
                  self.source_reliability.get(source_category) or 0.50
        src_score = src_rel * 0.35

        # 2. Corroboration (0–0.30)
        text_keywords = set(keywords or []) | _extract_keywords(text)
        corrob_count = 0
        for kw in text_keywords:
            matches = self._keyword_history.get(kw, [])
            # Don't count the source itself
            corrob_count += sum(1 for s in matches if s != source_id)
        corrob_score = min(0.30, corrob_count * 0.06)

        # 3. Propagation velocity (0–0.15, inverted — fast uncorroborated = low)
        # Check how many sources have covered similar content in short time
        now = datetime.now(timezone.utc)
        recent_window = timedelta(hours=6)
        recent_matches = 0
        for kw in text_keywords:
            for entry_time_str in self._keyword_history.get(kw, []):
                if isinstance(entry_time_str, str):
                    try:
                        entry_time = datetime.fromisoformat(entry_time_str)
                        if now - entry_time < recent_window:
                            recent_matches += 1
                    except Exception:

                        pass
        # If many sources cover it fast → higher credibility (unless 0 corroboration)
        if corrob_count > 0:
            prop_score = min(0.15, recent_matches * 0.02)
        else:
            # Fast propagation with no corroboration = suspicious
            prop_score = max(0, 0.08 - recent_matches * 0.01)

        # 4. Content freshness (0–0.10)
        if timestamp:
            try:
                age = (now - datetime.fromisoformat(timestamp)).total_seconds()
                freshness = max(0, 1 - age / 86400)  # decays over 24h
            except Exception:
                freshness = 0.5
        else:
            freshness = 0.5
        fresh_score = freshness * 0.10

        # 5. Contradiction / pattern detection (0–0.10, inverted)
        contradict_score = 0.10  # start high, deduct if markers found
        text_lower = text.lower()
        psyop_markers = [
            "coordinated", "astroTurf", "bot", "troll", "synthetic",
            "نسق", "منسق", "ممول", "مأجور",
        ]
        for marker in psyop_markers:
            if marker in text_lower:
                contradict_score -= 0.03
        contradict_score = max(0, contradict_score)

        # Total SCI
        sci = round(src_score + corrob_score + prop_score + fresh_score + contradict_score, 3)

        # Classification
        classification = self._classify(sci, corrob_count, recent_matches, text_lower)

        result = {
            "sci": sci,
            "classification": classification["id"],
            "classification_label": classification["label"],
            "classification_color": classification["color"],
            "components": {
                "source_reliability": round(src_score, 3),
                "corroboration": round(corrob_score, 3),
                "propagation_velocity": round(prop_score, 3),
                "freshness": round(fresh_score, 3),
                "contradiction": round(contradict_score, 3),
            },
            "source_reliability_base": src_rel,
            "corroboration_count": corrob_count,
            "source_name": source_name,
            "text_preview": text_preview,
        }

        # Store for future corroboration
        for kw in text_keywords:
            self._keyword_history[kw].append(source_id)
            if len(self._keyword_history[kw]) > 100:
                self._keyword_history[kw] = self._keyword_history[kw][-100:]

        self._scores_history.append({
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "source_id": source_id,
            **result,
        })
        if len(self._scores_history) > 1000:
            self._scores_history = self._scores_history[-1000:]

        return result

    def _classify(self, sci: float, corrob: int, prop_speed: int, text: str) -> Dict:
        psyop_markers_found = any(m in text for m in
            ["نسق", "منسق", "ممول", "مأجور", "astroTurf", "synthetic", "bot"])
        high_prop_low_corrob = prop_speed > 5 and corrob == 0

        if psyop_markers_found and sci < 0.5:
            return {"id": "psychological_operation", "label": "PSYOP", "color": "#ef4444"}
        if high_prop_low_corrob and sci < 0.6:
            return {"id": "coordinated_narrative", "label": "Coordinated Narrative", "color": "#a855f7"}
        if sci >= 0.85:
            return {"id": "fact", "label": "Fact", "color": "#22c55e"}
        if sci >= 0.60:
            return {"id": "probable", "label": "Probable", "color": "#3b82f6"}
        if sci >= 0.35:
            return {"id": "rumor", "label": "Rumor", "color": "#f59e0b"}
        if sci > 0 and corrob == 0:
            return {"id": "early_weak", "label": "Early Weak Signal", "color": "#64748b"}
        return {"id": "rumor", "label": "Rumor", "color": "#f59e0b"}

    def _empty_score(self, source_id: str) -> Dict:
        return {
            "sci": 0.0, "classification": "unknown",
            "classification_label": "Unknown", "classification_color": "#64748b",
            "components": {"source_reliability": 0, "corroboration": 0,
                          "propagation_velocity": 0, "freshness": 0, "contradiction": 0},
            "source_reliability_base": self.source_reliability.get(source_id, 0.5),
            "corroboration_count": 0,
        }

    def score_recent_signals(self, hours: int = 24) -> List[Dict]:
        """Score all recent Telegram + RSS signals from Supabase."""
        since = (datetime.now(timezone.utc) - timedelta(hours=hours)).isoformat()
        results = []

        # Score Telegram messages
        try:
            tg = db.table("telegram_messages").select("text, channel_username, channel_category, date, message_id")\
                .gte("date", since).limit(200).execute()
            for row in tg.data or []:
                if row.get("text"):
                    result = self.score_text(
                        text=row["text"],
                        source_id=f"tg:{row.get('channel_username', 'unknown')}",
                        source_category=row.get("channel_category", ""),
                        timestamp=row.get("date"),
                        source_name=row.get("channel_username", "unknown"),
                        text_preview=row["text"][:400],
                    )
                    result["source_type"] = "telegram"
                    result["message_id"] = row.get("message_id")
                    results.append(result)
        except Exception as e:
            print(f"[SCI] Telegram fetch error: {e}")

        # Score RSS articles
        try:
            articles = db.table("articles").select("title, summary, source_id, source_name, category, published_at, id")\
                .gte("published_at", since).limit(200).execute()
            for row in articles.data or []:
                text = f"{row.get('title', '')} {row.get('summary', '')}"
                if text.strip():
                    result = self.score_text(
                        text=text,
                        source_id=row.get("source_id", "unknown"),
                        source_category=row.get("category", "news"),
                        timestamp=row.get("published_at"),
                        source_name=row.get("source_name", row.get("source_id", "unknown")),
                        text_preview=((row.get("summary", "") or row.get("title", "") or ""))[:400],
                    )
                    result["source_type"] = "rss"
                    result["message_id"] = row.get("id")
                    results.append(result)
        except Exception as e:
            print(f"[SCI] RSS fetch error: {e}")

        return sorted(results, key=lambda r: -r["sci"])

    def get_source_table(self) -> List[Dict]:
        return [
            {"source_id": sid, "reliability": rel}
            for sid, rel in sorted(self.source_reliability.items(), key=lambda x: -x[1])
        ]

    def get_all_scores(self) -> List[Dict]:
        return list(self._scores_history)

    def get_stats(self) -> Dict:
        scored = [s for s in self._scores_history if s["sci"] > 0]
        return {
            "total_scored": len(scored),
            "average_sci": round(sum(s["sci"] for s in scored) / max(len(scored), 1), 3),
            "classifications": {
                cid: sum(1 for s in scored if s["classification"] == cid)
                for cid in SCI_LABELS
            },
            "sources_tracked": len(self.source_reliability),
        }


# Singleton
_instance: Optional[SCIEngine] = None

def get_sci_engine() -> SCIEngine:
    global _instance
    if _instance is None:
        _instance = SCIEngine()
    return _instance
