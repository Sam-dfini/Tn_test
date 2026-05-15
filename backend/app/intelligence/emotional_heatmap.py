"""
Emotional Heatmap — per-governorate emotion aggregation from Telegram + RSS text.

Uses the Narrative Warfare engine's sentiment analysis and maps emotions
to Tunisian governorates via keyword matching.
"""

import re
from collections import defaultdict, Counter
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timezone, timedelta

from ..core.database import db
from .narrative_warfare import _detect_sentiment, _tokenize

# ── Governorate names (Arabic, French, English) ────────────────

GOVERNORATES = {
    "tunis": {"ar": ["تونس", "العاصمة", "تunis"], "fr": ["tunis", "la capitale"], "en": ["tunis"]},
    "ben_arous": {"ar": ["بن عروس"], "fr": ["ben arous"], "en": ["ben arous"]},
    "ariana": {"ar": ["أريانة"], "fr": ["ariana"], "en": ["ariana"]},
    "nabeul": {"ar": ["نابل", "الوطن القبلي", "الحمامات", "قربة", "دار شعبان"], "fr": ["nabeul", "nabeul-hammamet", "hammamet"], "en": ["nabeul", "hammamet"]},
    "manouba": {"ar": ["منوبة"], "fr": ["manouba"], "en": ["manouba"]},
    "bizerte": {"ar": ["بنزرت", "منزل بورقيبة", "منزل جميل"], "fr": ["bizerte", "bizert", "menzel bourguiba"], "en": ["bizerte"]},
    "zaghouan": {"ar": ["زغوان"], "fr": ["zaghouan"], "en": ["zaghouan"]},
    "jendouba": {"ar": ["جندوبة", "طبرقة", "عين دراهم", "بوسالم"], "fr": ["jendouba", "tabarka", "ain drahem"], "en": ["jendouba", "tabarka"]},
    "beja": {"ar": ["باجة", "تستور", "ماطر"], "fr": ["béja", "beja", "testour"], "en": ["beja"]},
    "tataouine": {"ar": ["تطاوين"], "fr": ["tataouine"], "en": ["tataouine"]},
    "medenine": {"ar": ["مدنين", "جربة", "جرجيس", "حومة السوق", "ميدون", "أجيم"], "fr": ["medenine", "djerba", "houmt souk", "midoun", "ajim"], "en": ["medenine", "djerba"]},
    "gabes": {"ar": ["قابس", "قابس", "شنني"], "fr": ["gabès", "gabes"], "en": ["gabes"]},
    "kebili": {"ar": ["قبلي", "دوز"], "fr": ["kébili", "kebili", "douz"], "en": ["kebili", "douz"]},
    "tozeur": {"ar": ["توزر", "نفطة"], "fr": ["tozeur", "nefta"], "en": ["tozeur"]},
    "gafsa": {"ar": ["قفصة", "المظيلة", "الرديف", "أم العرائس", "المتلوي"], "fr": ["gafsa", "métlaoui", "redayef", "om larayes"], "en": ["gafsa"]},
    "sousse": {"ar": ["سوسة", "القنطاوي", "مساكن", "حمام سوسة", "أكودة"], "fr": ["sousse", "port el kantaoui", "akouda", "msaken"], "en": ["sousse"]},
    "monastir": {"ar": ["المنستير", "مكنين", "قصر هلال", "الوردانين"], "fr": ["monastir", "moknine", "ksar hellal"], "en": ["monastir"]},
    "mahdia": {"ar": ["المهدية"], "fr": ["mahdia"], "en": ["mahdia"]},
    "sfax": {"ar": ["صفاقس", "قرمدة", "جبنيانة"], "fr": ["sfax", "gremda"], "en": ["sfax"]},
    "kairouan": {"ar": ["القيروان"], "fr": ["kairouan"], "en": ["kairouan"]},
    "kasserine": {"ar": ["القصرين", "فريانة", "سبيطلة"], "fr": ["kasserine", "feriana", "sbeitla"], "en": ["kasserine"]},
    "sidi_bouzid": {"ar": ["سيدي بوزيد"], "fr": ["sidi bouzid"], "en": ["sidi bouzid"]},
    "le_kef": {"ar": ["الكاف", "دقاش"], "fr": ["le kef", "el kef"], "en": ["kef"]},
    "siliana": {"ar": ["سليانة"], "fr": ["siliana", "siliana"], "en": ["siliana"]},
}

GOV_NAMES = list(GOVERNORATES.keys())
GOV_COORDINATES = {
    "tunis": (10.15, 36.80), "ben_arous": (10.22, 36.75), "ariana": (10.20, 36.87),
    "nabeul": (10.73, 36.45), "manouba": (10.10, 36.81), "bizerte": (9.85, 37.27),
    "zaghouan": (10.14, 36.40), "jendouba": (8.78, 36.50), "beja": (9.18, 36.73),
    "tataouine": (10.45, 32.93), "medenine": (10.41, 33.35), "gabes": (10.10, 33.88),
    "kebili": (8.97, 33.70), "tozeur": (8.13, 33.92), "gafsa": (8.78, 34.42),
    "sousse": (10.63, 35.83), "monastir": (10.81, 35.78), "mahdia": (11.06, 35.50),
    "sfax": (10.77, 34.73), "kairouan": (10.10, 35.68), "kasserine": (8.80, 35.17),
    "sidi_bouzid": (9.70, 35.03), "le_kef": (8.70, 36.18), "siliana": (9.38, 36.08),
}

EMOTION_COLORS = {
    "anger": "#ef4444", "fear": "#a855f7", "hope": "#22c55e",
    "defiance": "#f97316", "resignation": "#64748b", "surprise": "#06b6d4",
}


def _extract_governorates(text: str) -> List[str]:
    """Extract mentioned governorate IDs from text."""
    text_lower = text.lower()
    found = []
    for gov_id, names in GOVERNORATES.items():
        for lang in ["ar", "fr", "en"]:
            for name in names[lang]:
                if name in text_lower:
                    found.append(gov_id)
                    break  # one match per governorate
    return found


class EmotionalHeatmapEngine:
    """Aggregates emotion data per governorate from text sources."""

    def __init__(self):
        self._cache: Optional[Dict] = None
        self._cache_time: Optional[datetime] = None

    def compute(self, texts: List[Dict]) -> Dict[str, Any]:
        """Compute per-governorate emotion from texts.
        Each text has: text, source, optionally governorate (from RSS field)."""
        gov_emotions: Dict[str, Counter] = defaultdict(Counter)
        gov_counts: Dict[str, int] = defaultdict(int)

        for item in texts:
            text = item.get("text", "") or ""
            # 1. Use explicit governorate field if available (from RSS pipeline)
            govs = []
            explicit_gov = item.get("governorate", "")
            if explicit_gov and explicit_gov in GOV_NAMES:
                govs = [explicit_gov]
            # 2. Always also try text extraction for additional matches
            govs.extend(g for g in _extract_governorates(text) if g not in govs)
            if not govs:
                continue
            sentiment = _detect_sentiment(text)
            for gov in set(govs):
                for emotion, score in sentiment.items():
                    gov_emotions[gov][emotion] += score
                gov_counts[gov] += 1

        # Build results
        governorates = {}
        for gov_id in GOV_NAMES:
            emo_counter = gov_emotions.get(gov_id)
            count = gov_counts.get(gov_id, 0)
            if not emo_counter or count == 0:
                governorates[gov_id] = {
                    "name": gov_id.replace("_", " ").title(),
                    "total_mentions": 0,
                    "dominant_emotion": "neutral",
                    "emotions": {e: 0 for e in EMOTION_COLORS},
                    "coordinates": GOV_COORDINATES.get(gov_id, (0, 0)),
                }
                continue

            total = sum(emo_counter.values()) or 1
            emotions = {e: round(emo_counter[e] / total, 3) for e in EMOTION_COLORS}
            dominant = max(emotions, key=emotions.get)

            governorates[gov_id] = {
                "name": gov_id.replace("_", " ").title(),
                "total_mentions": count,
                "dominant_emotion": dominant,
                "dominant_color": EMOTION_COLORS[dominant],
                "emotions": emotions,
                "coordinates": GOV_COORDINATES.get(gov_id, (0, 0)),
            }

        # Compute national mood
        all_emotions = Counter()
        for emo_counter in gov_emotions.values():
            all_emotions += emo_counter
        total_all = sum(all_emotions.values()) or 1
        national_mood = {
            e: round(all_emotions[e] / total_all, 3) for e in EMOTION_COLORS
        }
        national_dominant = max(national_mood, key=national_mood.get)

        # Emotional entropy (diversity)
        n_govs_with_data = sum(1 for g in governorates.values() if g["total_mentions"] > 0)
        govs_active = [g for g in governorates.values() if g["total_mentions"] > 0]

        return {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "national_mood": {
                "dominant_emotion": national_dominant,
                "dominant_color": EMOTION_COLORS[national_dominant],
                "distribution": national_mood,
            },
            "governorates": governorates,
            "governorates_active": n_govs_with_data,
            "governorates_total": len(GOV_NAMES),
            "total_signals_analyzed": sum(gov_counts.values()),
        }

    async def fetch_and_compute(self, hours: int = 720) -> Dict:
        """Fetch recent texts from Supabase and compute heatmap."""
        since = (datetime.now(timezone.utc) - timedelta(hours=hours)).isoformat()
        texts = []

        # Fetch from Telegram
        try:
            tg = db.table("telegram_messages").select("text, date")\
                .gte("date", since).limit(200).execute()
            for row in tg.data or []:
                if row.get("text"):
                    texts.append({"text": row["text"], "source": "telegram"})
        except: pass

        # Fetch from RSS articles (with governorate field)
        try:
            articles = db.table("articles").select("title, summary, governorate, published_at")\
                .gte("published_at", since).limit(200).execute()
            for row in articles.data or []:
                text = f"{row.get('title', '')} {row.get('summary', '')}"
                if text.strip():
                    entry = {"text": text, "source": "rss"}
                    if row.get("governorate"):
                        entry["governorate"] = row["governorate"]
                    texts.append(entry)
        except: pass

        result = self.compute(texts)
        self._cache = result
        self._cache_time = datetime.now(timezone.utc)
        return result

    def get_cached(self) -> Optional[Dict]:
        if self._cache and self._cache_time:
            age = (datetime.now(timezone.utc) - self._cache_time).total_seconds()
            if age < 120:  # 2 min cache
                return self._cache
        return None


# Singleton
_instance: Optional[EmotionalHeatmapEngine] = None

def get_heatmap_engine() -> EmotionalHeatmapEngine:
    global _instance
    if _instance is None:
        _instance = EmotionalHeatmapEngine()
    return _instance
