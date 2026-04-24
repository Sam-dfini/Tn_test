# Changelog

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
