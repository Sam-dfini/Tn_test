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

RSS_SOURCES = [
    {
        "id": "france24",
        "name": "France 24",
        "url": "https://www.france24.com/en/rss",
        "alignment": "NEUTRAL"
    },
]

class RSSService:
    def __init__(self):
        # Increased timeout and generic browser UA
        self.client = httpx.AsyncClient(
            timeout=30.0, 
            verify=False, 
            follow_redirects=True,
            headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            }
        )
        self.last_sync_time = None
        self.sync_lock = asyncio.Lock()

    def generate_id(self, title: str, source: str) -> str:
        """
        Match the JS dual-hash 64-bit implementation exactly.
        """
        base = f"{(title or '').strip().lower()}|{(source or 'unknown').strip().lower()}"
        
        # 32-bit integer overflow simulation
        def imul(a, b):
            return (a * b) & 0xFFFFFFFF

        h1 = 0xdeadbeef
        h2 = 0x41c6ce57
        
        for ch in base:
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
                    "language": "fr/en",
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
            f.write(f"Processing {len(articles)} articles\n")
            
        if not articles:
            return 0
            
        new_count = 0
        for article in articles:
            try:
                # 1. Deterministic ID generation for article
                article_id = self.generate_id(article["title"], article["source_name"])
                article["id"] = article_id
                article["fingerprint"] = article_id

                # 2. Check duplication
                exists = db.table("articles").select("id").eq("id", article_id).execute()
                if exists.data:
                    continue

                # 3. Enrich
                article["severity"] = self._detect_severity(article["title"])
                article["category"] = self._detect_category(article["title"])
                
                # 4. Handle Event grouping (Match JS eventKey)
                date_str = article["published_at"].split("T")[0]
                category = article["category"]
                gov = "national" # Default for now
                event_key = f"{category}-{gov}-{date_str}"
                
                # Try to find existing event
                existing_event = db.table("events").select("*").eq("event_key", event_key).execute()
                
                event_id = None
                if existing_event.data:
                    event_id = existing_event.data[0]["id"]
                    # Update article_count
                    db.table("events").update({
                        "article_count": existing_event.data[0]["article_count"] + 1,
                        "last_updated": datetime.now().isoformat()
                    }).eq("id", event_id).execute()
                else:
                    # Create new event
                    event_id = str(uuid.uuid4())
                    event_data = {
                        "id": event_id,
                        "event_key": event_key,
                        "title": article["title"][:100],
                        "description": article["summary"] or article["title"],
                        "category": category,
                        "severity": article["severity"],
                        "status": "ACTIVE",
                        "article_count": 1,
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
                    db.table("events").insert(event_data).execute()

                article["event_id"] = event_id

                # 5. Insert article
                db.table("articles").insert(article).execute()
                new_count += 1

            except Exception as e:
                with open(log_file, "a") as f:
                    f.write(f"Article processing error: {e}\n")
                
        with open(log_file, "a") as f:
            f.write(f"Sync finished. New: {new_count}\n")
            
        return new_count

    def _detect_severity(self, text: str) -> int:
        text = text.lower()
        if any(w in text for w in ["terrorism", "mort", "killed", "coup", "emergency"]): return 5
        if any(w in text for w in ["strike", "grève", "protest", "arrest", "imf", "crisis"]): return 4
        if any(w in text for w in ["pénurie", "shortage", "water", "inflation"]): return 3
        return 1

    def _detect_category(self, text: str) -> str:
        text = text.lower()
        if any(w in text for w in ["protest", "strike", "grève"]): return "protest"
        if any(w in text for w in ["imf", "bank", "dinar", "inflation"]): return "economic"
        if any(w in text for w in ["saied", "president", "election", "parliament"]): return "political"
        return "general"

rss_service = RSSService()
