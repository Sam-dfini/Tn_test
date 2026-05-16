# Changelog

## [2.2.0] - May 2026

### Added
- **RRI Variable Pipeline**: Live article-to-variable extraction pipeline that pushes real values from RSS/Telegram articles into the 251 RRI variables. When articles are ingested, keyword matching identifies affected variables and applies severity-scaled nudges, updating both the Supabase `variables` table and in-memory cache.
- **Keyword-Based Variable Nudging**: Python `variable_pipeline.py` mirrors the frontend `processArticleForRRI()` logic — normalizes raw values, applies nudge × (severity/3), denormalizes back with correct min/max/invert handling, and tracks history.
- **Pipeline Status API**: Endpoints at `GET /api/variables/pipeline/status`, `POST /api/variables/pipeline/process`, and `POST /api/variables/pipeline/reset` for monitoring and manual triggering.
- **WebSocket Integration**: RSS and Telegram ingestion broadcast `VARIABLE_NUDGE` events after processing, triggering frontend `PipelineContext` to re-fetch variables and recalculate RRI.
- **Pipeline Status in UI**: Sources tab (`SourceLibrary.tsx`) now displays Pipeline articles processed, variables nudged, and last run time in the live status bar alongside RSS/Telegram/SCI.

### Changed
- **Backend Variable Seed Data**: `backend/app/data/rri_variables.json` synced from frontend — all 251 variables now have real values, non-zero weights, thresholds, pipeline fields, and keyword lists instead of zeroed-out placeholders.

## [2.1.0] - April 2026

### Added
- **Real-Time Data Sync**: Fully integrated Supabase Realtime Channels. The `LiveSignalFeed` and `RealTimeNewsFeed` now stream intelligence directly using WebSockets without strict polling delays.
- **Robust Identifiers**: Added fallback hashing to guarantee stable article IDs which resolves data duplication across React renders.

### Fixed
- **Blank Screen / Infinite Loop Crash**: Fixed a critical bug in `EventsIntelligence.tsx` where an improperly stabilized `useEffect` calling generative AI caused React to hit maximum update depth and crash the dashboard (rendering a blank screen).
- **Import Aliasing**: Corrected old `framer-motion` imports to the newer `motion/react` format across specific visualizer modules (`AgroScenarioSimulator`, `AgroCrisisModel`, `ActorNetworkIntelligence`, `WaterIntelligenceHub`).
- **Data Rendering**: Cleaned up mapping components rendering without proper unique keys across diverse signal lists.

### Changed
- Standardized data schemas in Supabase to sync correctly with frontend context providers.
- Updated `ARCHITECTURE.md` to reflect that Supabase is now a mandatory dependency for the data pipeline.
