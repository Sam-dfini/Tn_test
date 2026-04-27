import asyncio
import httpx
from datetime import datetime
from typing import List, Dict, Any

from ..core.config import settings

class RSSService:
    def __init__(self):
        self.api_key = settings.NEWSDATA_API_KEY
        self.client = httpx.AsyncClient(timeout=30.0, verify=False, follow_redirects=True)
        self.last_sync_time = None
        self.sync_lock = asyncio.Lock()

    async def fetch_all(self, force: bool = False) -> Dict[str, Any]:
        async with self.sync_lock:
            if not self.api_key:
                return {"new_articles": 0, "total_discovered": 0, "feeds_processed": 0, "errors": ["No API key"]}
            url = f"https://newsdata.io/api/1/latest?apikey={self.api_key}&country=tn&language=fr,ar"
            response = await self.client.get(url)
            response.raise_for_status()
            data = response.json()
            articles = []
            for item in data.get("results", []):
                articles.append({
                    "source_id": "newsdata-tn",
                    "source_name": "newsdata",
                    "title": item.get("title"),
                    "url": item.get("link"),
                    "published_at": item.get("pubDate", datetime.now().isoformat()),
                    "content": item.get("description", ""),
                    "summary": item.get("description", "")[:250],
                    "bias_alignment": "NEUTRAL",
                    "severity": 1,
                    "category": "general",
                    "language": "fr/ar",
                    "bias_tone": "NEUTRAL",
                    "rri_nudge": 0.0,
                    "processed": True,
                    "pipeline_pushed": False,
                    "fetched_at": datetime.now().isoformat()
                })
            return {"new_articles": 0, "total_discovered": len(articles), "feeds_processed": 1, "errors": []}

rss_service = RSSService()
