"""
Telegram Intelligence Collector — Tunisian channels monitoring.

Dual-mode:
  - Bot token (TELEGRAM_BOT_TOKEN) → can read channels bot is admin in
  - User API credentials (TELEGRAM_API_ID + TELEGRAM_API_HASH) → can read any public channel

Stores messages in Supabase `telegram_messages` table.
"""

import asyncio
import os
import re
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional, Set
from telethon import TelegramClient, events, errors
from telethon.tl.types import Message, Channel, Chat, User

from ..core.database import db
from ..core.config import settings

# ── Channels to monitor ─────────────────────────────────────────────
# Tunisian political / activist / news Telegram channels
MONITORED_CHANNELS: List[Dict[str, Any]] = [
    # Opposition & activist
    {"username": "tunisie_embargo", "name": "Tunisie Embargo", "category": "activist"},
    {"username": "manichmsamah", "name": "Manich Msamah", "category": "activist"},
    {"username": "wataniyoun", "name": "Wataniyoun", "category": "opposition"},
    {"username": "damirtunisie", "name": "Damir Tunisie", "category": "activist"},
    {"username": "chourak_tunisie", "name": "Chourak Tunisie", "category": "activist"},
    {"username": "i7tijaj", "name": "Ihtijaj", "category": "protest"},
    {"username": "tunisiecreatives", "name": "Tunisie Créatives", "category": "activist"},
    # News & media
    {"username": "tunisianewstn", "name": "Tunisia News", "category": "news"},
    {"username": "tunisieactu", "name": "Tunisie Actu", "category": "news"},
    {"username": "businessnewstn", "name": "Business News TN", "category": "news"},
    {"username": "kapitalistn", "name": "Kapitalis TN", "category": "news"},
    {"username": "nessmatn", "name": "Nessma TN", "category": "news"},
    {"username": "jarvis_tunisia", "name": "Jarvis Tunisia", "category": "analyst"},
    {"username": "tunisianeconomicforum", "name": "Tunisian Economic Forum", "category": "analyst"},
    # Union & labor
    {"username": "UGTT_Officiel", "name": "UGTT Officiel", "category": "union"},
    {"username": "uttintunisie", "name": "UTT Tunisie", "category": "union"},
    # Security & government
    {"username": "tunisianpresidency", "name": "Presidence TN", "category": "government"},
    {"username": "moitunisie", "name": "Ministère Intérieur", "category": "government"},
]

# Keywords to flag for intelligence alerts
ALERT_KEYWORDS = [
    "grève", "protestation", "manifestation", "émeute", "soulèvement",
    "sit-in", "rassemblement", "marche", "blocus", "occupation",
    "arrestation", "détention", "répression", "censure", "décret",
    "démission", "démissionner", "crise", "effondrement", "faillite",
    "pénurie", "inflation", "austérité", "FMI", "prêt", "dette",
    "attentat", "explosion", "incendie", "conflit", "affrontement",
    "grève générale", "révolution", "soulèvement populaire",
]


class TelegramCollector:
    """Monitors Tunisian Telegram channels for intelligence signals."""

    def __init__(self):
        self.client: Optional[TelegramClient] = None
        self.running = False
        self.monitored: Set[str] = set()
        self.stats = {
            "total_messages": 0,
            "channels_joined": 0,
            "channels_failed": 0,
            "last_fetch": None,
            "errors": [],
        }
        self._connect_lock = asyncio.Lock()

    # ── Credentials ────────────────────────────────────────────────

    def _get_bot_token(self) -> Optional[str]:
        return os.getenv("TELEGRAM_BOT_TOKEN")

    def _get_api_credentials(self) -> tuple[Optional[int], Optional[str]]:
        api_id = os.getenv("TELEGRAM_API_ID")
        api_hash = os.getenv("TELEGRAM_API_HASH")
        if api_id and api_hash:
            return int(api_id), api_hash
        return None, None

    def has_credentials(self) -> bool:
        return bool(self._get_bot_token()) or bool(os.getenv("TELEGRAM_API_ID"))

    # ── Connect ────────────────────────────────────────────────────

    async def connect(self):
        async with self._connect_lock:
            if self.client and self.client.is_connected():
                return

            bot_token = self._get_bot_token()
            api_id, api_hash = self._get_api_credentials()
            session = "telegram_collector"

            if api_id and api_hash:
                self.client = TelegramClient(session, api_id, api_hash)
                await self.client.start()
                print(f"[Telegram] Connected as user client")
            elif bot_token:
                self.client = TelegramClient(session + "_bot", api_id=2040, api_hash="b18441a1ff607e10a98989")
                await self.client.start(bot_token=bot_token)
                print(f"[Telegram] Connected as bot")
            else:
                raise RuntimeError("No Telegram credentials available")

    # ── Join & monitor channels ────────────────────────────────────

    async def join_channels(self):
        if not self.client:
            return
        for ch in MONITORED_CHANNELS:
            try:
                entity = await self.client.get_entity(ch["username"])
                # For bots: need to be invited. Check if we can access.
                if hasattr(entity, 'participants_count'):
                    ch["participants"] = entity.participants_count
                self.monitored.add(ch["username"])
                self.stats["channels_joined"] += 1
                ch["status"] = "active"
            except errors.rpcerrorlist.UsernameNotOccupiedError:
                self.stats["channels_failed"] += 1
                print(f"[Telegram] Channel @{ch['username']} not found")
            except errors.rpcerrorlist.ChannelPrivateError:
                # Bot can't access private channels unless added
                self.stats["channels_failed"] += 1
                print(f"[Telegram] Channel @{ch['username']} is private")
            except Exception as e:
                self.stats["channels_failed"] += 1
                err = str(e)[:100]
                print(f"[Telegram] Failed to join @{ch['username']}: {err}")
        print(f"[Telegram] Joined {self.stats['channels_joined']}/{len(MONITORED_CHANNELS)} channels")

    # ── Fetch messages ─────────────────────────────────────────────

    async def fetch_recent_messages(self, limit: int = 50) -> List[Dict[str, Any]]:
        if not self.client:
            return []
        messages = []
        for ch in MONITORED_CHANNELS:
            if ch.get("username") not in self.monitored:
                continue
            try:
                entity = await self.client.get_entity(ch["username"])
                async for msg in self.client.iter_messages(entity, limit=limit):
                    if not msg.text and not msg.message:
                        continue
                    text = msg.text or msg.message or ""
                    parsed = self._parse_message(msg, ch, text)
                    if parsed:
                        messages.append(parsed)
                await asyncio.sleep(0.5)  # rate limit
            except Exception as e:
                print(f"[Telegram] Fetch error @{ch['username']}: {str(e)[:80]}")
        self.stats["last_fetch"] = datetime.now(timezone.utc).isoformat()
        self.stats["total_messages"] += len(messages)
        return messages

    def _parse_message(self, msg: Message, ch: Dict, text: str) -> Optional[Dict]:
        alerts = [kw for kw in ALERT_KEYWORDS if kw.lower() in text.lower()]
        return {
            "message_id": msg.id,
            "channel_username": ch["username"],
            "channel_name": ch["name"],
            "channel_category": ch["category"],
            "sender_id": str(msg.sender_id) if msg.sender_id else "",
            "text": text[:4000],
            "date": msg.date.isoformat() if msg.date else "",
            "views": getattr(msg, 'views', 0) or 0,
            "forwards": getattr(msg, 'forwards', 0) or 0,
            "reply_to": msg.reply_to_msg_id,
            "has_media": bool(msg.media),
            "alerts": alerts,
            "alert_count": len(alerts),
            "fetched_at": datetime.now(timezone.utc).isoformat(),
        }

    # ── Store to Supabase ──────────────────────────────────────────

    async def store_messages(self, messages: List[Dict]) -> int:
        if not messages:
            return 0
        count = 0
        for msg in messages:
            try:
                existing = db.table("telegram_messages").select("id").eq("message_id", msg["message_id"]).eq("channel_username", msg["channel_username"]).execute()
                if existing.data:
                    continue
                db.table("telegram_messages").insert(msg).execute()
                count += 1
            except Exception as e:
                print(f"[Telegram] Store error: {str(e)[:80]}")
        return count

    # ── Collect + Store (full cycle) ────────────────────────────────

    async def collect(self) -> Dict:
        if not self.has_credentials():
            return {"status": "no_credentials", "messages": 0}
        try:
            await self.connect()
            if not self.monitored:
                await self.join_channels()
            messages = await self.fetch_recent_messages()
            stored = await self.store_messages(messages)
            return {
                "status": "ok",
                "fetched": len(messages),
                "stored": stored,
                "channels_active": len(self.monitored),
                "total_messages": self.stats["total_messages"],
            }
        except Exception as e:
            err = str(e)
            self.stats["errors"].append(err)
            return {"status": "error", "error": err[:200]}

    # ── Background loop ────────────────────────────────────────────

    async def run_loop(self, interval: int = 300):
        self.running = True
        while self.running:
            result = await self.collect()
            if result["status"] == "ok" and result["stored"] > 0:
                print(f"[Telegram] Collected {result['stored']} new messages from {result['channels_active']} channels")
            await asyncio.sleep(interval)

    def stop(self):
        self.running = False

    # ── Status ──────────────────────────────────────────────────────

    def get_status(self) -> Dict:
        return {
            "running": self.running,
            "has_credentials": self.has_credentials(),
            "channels_total": len(MONITORED_CHANNELS),
            "channels_active": len(self.monitored),
            "channels_failed": self.stats["channels_failed"],
            "total_messages": self.stats["total_messages"],
            "last_fetch": self.stats["last_fetch"],
            "recent_errors": self.stats["errors"][-5:],
        }


# Singleton
_instance: Optional[TelegramCollector] = None

def get_telegram_collector() -> TelegramCollector:
    global _instance
    if _instance is None:
        _instance = TelegramCollector()
    return _instance
