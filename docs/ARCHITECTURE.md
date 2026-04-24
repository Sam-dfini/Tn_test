# TunisiaIntel: System Architecture

## Overview
TunisiaIntel is an OSINT (Open Source Intelligence) real-time platform designed for high-density information gathering and analysis. It follows a **Single Source of Truth** architecture where the backend manages all ingestion, and the frontend act as a real-time subscriber.

## Core Pillars

### 1. Ingestion Layer (Backend Only)
- **Centralized Fetching**: All RSS feeds are fetched by the Python/FastAPI backend.
- **Deduplication**: Using deterministic IDs based on content hash to prevent duplication.
- **Normalization**: Diverse feed formats are transformed into a unified `IntelRecord`.

### 2. Processing Layer (Intelligence Engine)
- **NLP Analysis**: AI agents (Gemini) classify articles, extract entities, and assign severity scores.
- **Cluster Intelligence**: Related articles are grouped into "Events" to identify emerging trends.
- **Geospatial Mapping**: Intel is mapped to Tunisia's 24 governorates.

### 3. Streaming Layer (Real-time)
- **WebSockets**: The frontend maintains a persistent connection to `ws://backend/ws/intel`.
- **Push Architecture**: When the backend processes new news, it broadcasts to all clients instantly.
- **State Synchronization**: Eliminates the "Double Fetch" problem where backend and frontend were previously out of sync.

### 4. Persistence Layer
- **PostgreSQL/Supabase**: Structured storage for Articles, Events, and RRI (Risk/Resilience Index) metrics.
- **Audit Logging**: Every pipeline event is traced for observability.

## Component Flow
1. **Discovery**: Backend cron job polls RSS sources (TAP, Mosaique, Business News, etc.).
2. **Analysis**: AI agents run extraction on new items.
3. **Storage**: Data is saved to the database.
4. **Broadcast**: Connected clients receive `NEW_ARTICLES` or `EVENTS_UPDATED` messages over WS.
5. **Observation**: Dashboard reflects metrics (success rate, latency, DB ops).
