import asyncio
import httpx
import xml.etree.ElementTree as ET
from datetime import datetime
from typing import List, Dict, Any, Optional
import re
import email.utils
import uuid
import numpy as np
import google.generativeai as genai

from ..core.database import db
from ..core.config import settings
from .intelligence_stream import intelligence_stream
# We skip importing manager directly to avoid circular imports if any, 
# or we just use a callback/signal if needed.
# However, ws.py is quite isolated.
from ..api.ws import manager

RSS_SOURCES = [
    # ── English ──────────────────────────────────────────────────
    {"id": "google-news-tunisia", "name": "Google News Tunisia",
     "url": "https://news.google.com/rss/search?q=tunisia&hl=en-US&gl=US&ceid=US:en",
     "alignment": "NEUTRAL", "language": "en", "geo_weight": 0.7},
    {"id": "middleeasteye-tunisia", "name": "Middle East Eye Tunisia",
     "url": "https://www.middleeasteye.net/rss/country/Tunisia",
     "alignment": "CRITICAL", "language": "en", "geo_weight": 1.0},
    {"id": "reuters-africa", "name": "Reuters Africa",
     "url": "https://feeds.reuters.com/reuters/AFRICANews",
     "alignment": "NEUTRAL", "language": "en", "geo_weight": 0.3},
    # ── French ───────────────────────────────────────────────────
    {"id": "businessnews-tn", "name": "Business News Tunisie",
     "url": "https://www.businessnews.com.tn/rss.xml",
     "alignment": "NEUTRAL", "language": "fr", "geo_weight": 1.0},
    {"id": "kapitalis-tn", "name": "Kapitalis",
     "url": "https://www.kapitalis.com/feed/",
     "alignment": "NEUTRAL", "language": "fr", "geo_weight": 1.0},
    {"id": "inkyfada", "name": "Inkyfada",
     "url": "https://inkyfada.com/feed/",
     "alignment": "CRITICAL", "language": "fr", "geo_weight": 1.0},
    {"id": "leaders-tn", "name": "Leaders Tunisie",
     "url": "https://www.leaders.com.tn/rss.xml",
     "alignment": "PRO_GOV", "language": "fr", "geo_weight": 1.0},
    {"id": "realites-tn", "name": "Réalités Online",
     "url": "https://www.realites.com.tn/feed/",
     "alignment": "NEUTRAL", "language": "fr", "geo_weight": 1.0},
    {"id": "jeuneafrique-tn", "name": "Jeune Afrique",
     "url": "https://www.jeuneafrique.com/feed/",
     "alignment": "NEUTRAL", "language": "fr", "geo_weight": 0.3},
    {"id": "leconomistemaghrebin", "name": "L'Économiste Maghrébin",
     "url": "https://www.leconomistemaghrebin.com/feed/",
     "alignment": "NEUTRAL", "language": "fr", "geo_weight": 0.8},
    # ── Arabic ───────────────────────────────────────────────────
    {"id": "google-news-tunisia-ar", "name": "Google News تونس",
     "url": "https://news.google.com/rss/search?q=%D8%AA%D9%88%D9%86%D8%B3&hl=ar&gl=TN&ceid=TN:ar",
     "alignment": "NEUTRAL", "language": "ar", "geo_weight": 0.8},
    {"id": "mosaique-fm-ar", "name": "Mosaïque FM",
     "url": "https://www.mosaiquefm.net/ar/feed/rss",
     "alignment": "NEUTRAL", "language": "ar", "geo_weight": 1.0},
    {"id": "nawaat", "name": "Nawaat",
     "url": "https://nawaat.org/feed/",
     "alignment": "CRITICAL", "language": "ar", "geo_weight": 1.0},
]

# ─── GEO-RELEVANCE FILTER ──────────────────────────────────────────────────
# Prevents non-Tunisia articles from reaching Supabase.
# Same logic as frontend scoreGeoRelevance() in rssSources.ts.

_TUNISIA_EN = [
    "tunisia", "tunisian", "tunis", "sfax", "sousse", "kairouan", "bizerte",
    "gafsa", "kasserine", "monastir", "nabeul", "jendouba", "gabes", "medenine",
    "tataouine", "sidi bouzid", "kebili", "tozeur", "beja", "siliana", "zaghouan",
    "kef", "manouba", "ariana", "ben arous", "djerba", "hammamet",
    "saied", "kais saied", "ennahda", "ugtt", "bct", "steg", "sonede",
    "decree 54", "cpg", "phosphate", "maghreb", "north africa", "harraga",
]
_TUNISIA_FR = [
    "tunisie", "tunisien", "tunis", "sfax", "sousse", "kairouan", "bizerte",
    "gafsa", "kasserine", "monastir", "nabeul", "jendouba", "gabès", "médenine",
    "tataouine", "sidi bouzid", "kébili", "tozeur", "béja", "siliana", "zaghouan",
    "le kef", "manouba", "ariana", "ben arous", "djerba", "hammamet",
    "saied", "ennahdha", "ugtt", "bct", "décret 54", "cpg", "phosphate",
    "maghreb", "afrique du nord", "harraga", "steg", "sonede",
]
_TUNISIA_AR = [
    "تونس", "تونسي", "تونسية", "صفاقس", "سوسة", "القيروان", "بنزرت",
    "قفصة", "القصرين", "المنستير", "نابل", "جندوبة", "قابس", "مدنين",
    "تطاوين", "سيدي بوزيد", "قبلي", "توزر", "باجة", "سليانة", "زغوان",
    "الكاف", "منوبة", "أريانة", "بن عروس", "جربة",
    "سعيد", "قيس سعيد", "النهضة", "اتحاد الشغل", "الفسفاط", "حراقة",
]
_TRUSTED_DOMAINS = [
    "businessnews.com.tn", "kapitalis.com", "inkyfada.com", "leaders.com.tn",
    "realites.com.tn", "tap.info.tn", "mosaiquefm.net", "nawaat.org",
    "leconomistemaghrebin.com", "gnet.tn",
]

def _score_geo_relevance(title: str, content: str, source_url: str, geo_weight: float) -> dict:
    """Returns {is_relevant, score, matched_entities}"""
    try:
        from urllib.parse import urlparse
        hostname = urlparse(source_url).hostname or ""
        if any(d in hostname for d in _TRUSTED_DOMAINS):
            return {"is_relevant": True, "score": 100, "matched_entities": ["trusted-domain"]}
    except Exception:
        pass

    text = f"{title} {content}".lower()
    matched = []
    for entity in _TUNISIA_EN + _TUNISIA_FR:
        if entity.lower() in text:
            matched.append(entity)
    for entity in _TUNISIA_AR:
        if entity in text:
            matched.append(entity)

    unique = list(set(matched))
    entity_score = min(80, len(unique) * 20)
    weight_bonus = geo_weight * 20
    score = round(min(100, entity_score + weight_bonus))

    is_relevant = score >= 15 or any(
        e.lower() in ["tunisia", "tunisie", "تونس", "saied", "سعيد", "ugtt"]
        for e in unique
    )
    return {"is_relevant": is_relevant, "score": score, "matched_entities": unique}

class RSSService:
    def __init__(self):
        # Increased timeout and generic browser UA
        self.client = httpx.AsyncClient(
            timeout=30.0, 
            verify=False, 
            follow_redirects=True,
            headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept": "application/rss+xml, application/atom+xml, text/xml, */*",
                "Accept-Language": "en-US,en;q=0.9,fr;q=0.8,ar;q=0.7",
                "Cache-Control": "no-cache",
            }
        )
        self.last_sync_time = None
        self.sync_lock = asyncio.Lock()

    def generate_id(self, title: str, source: str, link: str = "", guid: str = "", pub_date: str = "") -> str:
        """
        Generates a deterministic ID. GUID > Link > Title+Date.
        """
        seed = guid or link or f"{title}|{pub_date}"
        unique_string = f"{seed}|{source}".strip().lower()
        
        # 32-bit integer overflow simulation
        def imul(a, b):
            return (a * b) & 0xFFFFFFFF

        h1 = 0xdeadbeef
        h2 = 0x41c6ce57
        
        for ch in unique_string:
            c = ord(ch)
            h1 = (imul(h1 ^ c, 2654435761)) & 0xFFFFFFFF
            h2 = (imul(h2 ^ c, 1597334677)) & 0xFFFFFFFF
            
        h1_final = (imul(h1 ^ (h1 >> 16), 2246822519) ^ imul(h2 ^ (h2 >> 13), 3266489917)) & 0xFFFFFFFF
        h2_final = (imul(h2 ^ (h2 >> 16), 2246822519) ^ imul(h1 ^ (h1 >> 13), 3266489917)) & 0xFFFFFFFF
        
        return f"art_{h1_final:08x}{h2_final:08x}"

    async def fetch_all(self, force: bool = False) -> Dict[str, Any]:
        async with self.sync_lock:
            # 5-minute cooldown unless forced - disabling temporarily for debugging as requested
            now = datetime.now()
            if not force and self.last_sync_time and (now - self.last_sync_time).total_seconds() < 1:
                print(f"[RSS Sync] Cooldown check (disabled for debugging)")
            
            self.last_sync_time = now
            tasks = [self.fetch_source(source) for source in RSS_SOURCES]
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            new_count = 0
            total_items = 0
            errors = []
            
            for i, res in enumerate(results):
                if isinstance(res, Exception):
                    errors.append(f"{RSS_SOURCES[i]['name']}: {str(res)}")
                elif isinstance(res, dict):
                    new_count += res.get("new", 0)
                    total_items += res.get("total", 0)
                else:
                    new_count += res # Fallback for old return type
                    
            return {
                "new_articles": new_count, 
                "total_discovered": total_items,
                "feeds_processed": len(RSS_SOURCES),
                "errors": errors
            }

    async def fetch_source(self, source: Dict[str, str]) -> Dict[str, int]:
        try:
            # Add cache buster to URL
            sep = "&" if "?" in source["url"] else "?"
            url = f"{source['url']}{sep}_cb={int(datetime.now().timestamp())}"
            
            print(f"[RSS] Fetching {source['name']} from {url}")
            response = await self.client.get(url)
            response.raise_for_status()
            
            articles = self.parse_rss(response.text, source)
            print(f"[RSS] Parsed {len(articles)} items from {source['name']}")
            new_added = await self.process_articles(articles)
            return {"new": new_added, "total": len(articles)}
        except Exception as e:
            print(f"Error fetching {source['name']}: {e}")
            return {"new": 0, "total": 0}

    def parse_rss(self, xml_content: str, source: Dict[str, str]) -> List[Dict[str, Any]]:
        try:
            root = ET.fromstring(xml_content)
            items = root.findall(".//item") or root.findall(".//{http://www.w3.org/2005/Atom}entry")
            
            articles = []
            for item in items:
                title = item.findtext("title") or item.findtext("{http://www.w3.org/2005/Atom}title")
                link = item.findtext("link") or (item.find("{http://www.w3.org/2005/Atom}link").get("href") if item.find("{http://www.w3.org/2005/Atom}link") is not None else None)
                pub_date = item.findtext("pubDate") or item.findtext("{http://www.w3.org/2005/Atom}published") or item.findtext("{http://www.w3.org/2005/Atom}updated")
                description = item.findtext("description") or item.findtext("{http://www.w3.org/2005/Atom}summary") or ""
                
                if not title or not link:
                    continue
                    
                # Clean HTML
                clean_desc = re.sub('<[^<]+?>', '', description)[:500]
                
                # Parse date properly using standard lib
                iso_date = datetime.now().isoformat()
                if pub_date:
                    try:
                        iso_date = email.utils.parsedate_to_datetime(pub_date).isoformat()
                    except Exception:
                        try:
                            iso_date = datetime.fromisoformat(pub_date.replace('Z', '+00:00')).isoformat()
                        except Exception:
                            pass
                
                # ── GEO-RELEVANCE FILTER ──────────────────────────────
                geo = _score_geo_relevance(
                    title, clean_desc,
                    source.get("url", ""),
                    source.get("geo_weight", 0.5)
                )
                if not geo["is_relevant"]:
                    print(f"[GEO-FILTER] Dropped (score={geo['score']}): {title[:60]}")
                    continue  # Do not add to articles list
                # ─────────────────────────────────────────────────────

                articles.append({
                    "source_id": source["id"],
                    "source_name": source["name"],
                    "title": title,
                    "url": link,
                    "published_at": iso_date,
                    "content": clean_desc,
                    "summary": clean_desc[:250],
                    "bias_alignment": source["alignment"],
                    "severity": 1,
                    "category": "general",
                    "language": source.get("language", "fr/en"),
                    "bias_tone": "NEUTRAL",
                    "rri_nudge": 0.0,
                    "processed": True,
                    "pipeline_pushed": False,
                    "fetched_at": datetime.now().isoformat()
                })
            return articles
        except Exception as e:
            print(f"Parsing error for {source['name']}: {e}")
            return []

    async def process_articles(self, articles: List[Dict[str, Any]]) -> int:
        log_file = "backend_sync.log"
        with open(log_file, "a") as f:
            f.write(f"\n--- Sync started at {datetime.now().isoformat()} ---\n")
            f.write(f"Processing {len(articles)} potential articles in batch\n")
            
        if not articles:
            return 0

        # 1. Generate IDs and Deduplicate locally
        processed_articles = []
        article_ids = []
        for article in articles:
            article_id = self.generate_id(
                article["title"], 
                article["source_name"],
                link=article.get("link", ""),
                guid=article.get("guid", ""),
                pub_date=article.get("published_at", "")
            )
            article["id"] = article_id
            article["fingerprint"] = article_id
            article["severity"] = self._detect_severity(
                article["title"],
                article.get("geo_relevance_score", 100)
            )
            article["category"] = self._detect_category(article["title"])
            
            # Grouping keys
            date_str = article["published_at"].split("T")[0]
            article["event_key"] = f"{article['category']}-national-{date_str}"
            
            processed_articles.append(article)
            article_ids.append(article_id)

        # 2. Bulk check existing articles
        try:
            existing_resp = db.table("articles").select("id").in_("id", article_ids).execute()
            existing_ids = {item["id"] for item in existing_resp.data} if existing_resp.data else set()
        except Exception as e:
            print(f"Error in batch check: {e}")
            existing_ids = set()

        # 3. Filter New Articles only
        new_articles = [a for a in processed_articles if a["id"] not in existing_ids]
        if not new_articles:
            with open(log_file, "a") as f:
                f.write("No new articles to process.\n")
            return 0

        with open(log_file, "a") as f:
            f.write(f"Found {len(new_articles)} fresh articles. Grouping into events...\n")

        # 4. Handle Events in Batch
        event_groups = {}
        for a in new_articles:
            key = a["event_key"]
            if key not in event_groups: event_groups[key] = []
            event_groups[key].append(a)

        event_keys = list(event_groups.keys())
        try:
            existing_events_resp = db.table("events").select("*").in_("event_key", event_keys).execute()
            existing_events = {e["event_key"]: e for e in existing_events_resp.data} if existing_events_resp.data else {}
        except Exception as e:
            print(f"Error fetching events: {e}")
            existing_events = {}

        events_to_upsert = []
        articles_to_insert = []

        for key, group in event_groups.items():
            first_art = group[0]
            if key in existing_events:
                evt = existing_events[key]
                evt["article_count"] += len(group)
                evt["last_updated"] = datetime.now().isoformat()
                events_to_upsert.append(evt)
                event_id = evt["id"]
            else:
                event_id = str(uuid.uuid4())
                evt_data = {
                    "id": event_id,
                    "event_key": key,
                    "title": first_art["title"][:100],
                    "description": first_art["summary"] or first_art["title"],
                    "category": first_art["category"],
                    "severity": first_art["severity"],
                    "status": "ACTIVE",
                    "article_count": len(group),
                    "governorate": "National",
                    "is_critical": False,
                    "last_updated": datetime.now().isoformat(),
                    "priority_score": 0.0,
                    "velocity_score": 0.0,
                    "trend": "stable",
                    "pro_gov_count": 0,
                    "neutral_count": 0,
                    "critical_count": 0,
                    "alarmist_count": 0,
                    "minimizing_count": 0
                }
                events_to_upsert.append(evt_data)
            
            for a in group:
                a["event_id"] = event_id
                a.pop("event_key", None)
                articles_to_insert.append(a)

        # 5. Execute Batch Operations
        try:
            if articles_to_insert:
                db.table("articles").insert(articles_to_insert).execute()
                # Broadcast to all connected clients
                await manager.broadcast({
                    "type": "NEW_ARTICLES",
                    "payload": articles_to_insert
                })
            
            if events_to_upsert:
                db.table("events").upsert(events_to_upsert).execute()
                # Also broadcast events
                await manager.broadcast({
                    "type": "EVENTS_UPDATED",
                    "payload": events_to_upsert
                })
            new_count = len(articles_to_insert)
        except Exception as e:
            with open(log_file, "a") as f:
                f.write(f"Batch execution error: {e}\n")
            new_count = 0

        with open(log_file, "a") as f:
            f.write(f"Sync finished. New: {new_count}\n")
            
        return new_count

    def _detect_severity(self, text: str, geo_score: int = 100) -> int:
        """
        Severity scoring requires Tunisia context for high tiers.
        Global events (Nigeria airstrikes, Denmark crashes) that slip through
        geo filter with low score are capped at severity 2.
        """
        t = text.lower()

        # Cap severity for marginal geo-relevance items
        if geo_score < 35:
            return 1
        max_severity = 5 if geo_score >= 60 else 2

        if any(w in t for w in ["terrorism", "attentat", "coup d'état", "assassination",
                                  "إرهاب", "انقلاب", "اغتيال"]):
            return min(5, max_severity)
        if any(w in t for w in ["strike", "grève générale", "general strike", "ugtt",
                                  "imf", "fmi", "default", "decree 54", "décret 54",
                                  "إضراب عام", "اعتقال", "صندوق النقد"]):
            return min(4, max_severity)
        if any(w in t for w in ["protest", "manifestation", "shortage", "pénurie",
                                  "احتجاج", "إضراب", "شحّ"]):
            return min(3, max_severity)
        if any(w in t for w in ["statement", "communiqué", "meeting", "réunion",
                                  "بيان", "اجتماع"]):
            return min(2, max_severity)
        return 1

    def _detect_category(self, text: str) -> str:
        t = text.lower()
        if any(w in t for w in ["protest", "strike", "grève", "ugtt", "manifestation",
                                  "احتجاج", "إضراب", "نقابة"]):
            return "protest"
        if any(w in t for w in ["arrest", "detained", "decree 54", "décret 54", "prison",
                                  "اعتقال", "سجن", "المرسوم"]):
            return "arrest"
        if any(w in t for w in ["imf", "fmi", "bank", "dinar", "inflation", "bct", "budget",
                                  "forex", "dette", "صندوق", "دينار", "تضخم", "ميزانية"]):
            return "economic"
        if any(w in t for w in ["saied", "president", "election", "parlement", "constitution",
                                  "ennahda", "سعيد", "رئيس", "انتخاب", "النهضة"]):
            return "political"
        if any(w in t for w in ["shortage", "pénurie", "مافاماش", "شحّ", "farine", "flour",
                                  "huile", "sucre", "دقيق", "زيت", "سكر"]):
            return "shortage_food"
        if any(w in t for w in ["butane", "gaz", "بوطان", "غاز"]):
            return "shortage_butane"
        if any(w in t for w in ["water", "eau", "sonede", "sécheresse", "مياه", "جفاف"]):
            return "water"
        if any(w in t for w in ["migration", "harraga", "sfax", "traversée", "هجرة", "حراقة"]):
            return "migration"
        if any(w in t for w in ["cpg", "phosphate", "gafsa", "mine", "فسفاط", "قفصة"]):
            return "labor"
        return "general"

rss_service = RSSService()
