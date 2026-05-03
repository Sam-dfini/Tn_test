# Deployment & Scaling Plan

## Infrastructure Requirements
- **Runtime**: Node.js (Vite Frontend) + Python 3.12 (FastAPI Backend).
- **Database**: Supabase (PostgreSQL) with Realtime enabled (though we prefer WebSockets for raw intel).
- **Intelligence**: Gemini 1.5 Flash (via `@google/genai` and Python `google-generativeai`).

## Performance Scaling
- **Scalable Ingestion**: The backend ingestion service uses `asyncio` for non-blocking parallel fetches.
- **Load Balancing**: Multiple backend instances can run; however, the scheduler should be protected with a distributed lock (Redis) if scaled horizontally.
- **Cache**: In-memory cache in the backend for hot "Signal" data reduces database pressure.

## Security
- **Strict ID Policy**: No manual ID generation on frontend.
- **CORS Bypass**: Frontend fetches are restricted; all external traffic goes through backend proxies.
- **Observability**: Built-in Dashboard monitors 100% of pipeline health.
