# 12. Appendix: Naming Conflicts & Resolutions

## A.1 SocialIntelligence Collision

**Problem:** Two components named `SocialIntelligence` exist under different parents, causing routing collisions and state confusion.

| Current Name | Parent | Content | New Name |
|---|---|---|---|
| `SocialIntelligence` | Threat & Security | Migration, Diaspora, Brain Drain, Labor, Policy, Family, Health | `SocialThreatIntelligence` |
| `SocialIntelligence` | Socio-Political | Demographics, Social Cohesion, Education & Labor, Health & Welfare | `SocialPoliticalIntelligence` |

**Files to rename:**
- `src/components/SocialIntelligence.tsx` (Threat & Security) → `SocialThreatIntelligence.tsx`
- `src/components/SocialIntelligence.tsx` (Socio-Political) → `SocialPoliticalIntelligence.tsx`

**Imports to update:**
- All files importing `SocialIntelligence` from Threat & Security path
- All files importing `SocialIntelligence` from Socio-Political path
- Router configuration
- Sidebar navigation config

## A.2 File Moves

| Module | From | To |
|---|---|---|
| Gov. Agent | Tier 1 / Command Center | Tier 3 / Advanced Systems |
| Methodology | Tier 1 / Command Center (modal) | Tier 3 / Advanced Systems (page) |
| Daily News | Tier 1 / Top-level | Merged into Daily Briefing as panel |

## A.3 Route Changes

| Old Route | New Route | Status |
|---|---|---|
| `/gov-agent` | `/advanced/gov-agent` | Redirect |
| `/methodology` | `/advanced/methodology` | Redirect |
| `/daily-news` | `/` (panel inside Daily Briefing) | Remove route |
| `/agricultural-pulse` | `/environment/food-chains/pulse` | Redirect |
| `/feed-hub` | `/environment/food-chains/feed` | Redirect |
| `/poultry-eggs` | `/environment/food-chains/poultry` | Redirect |
| `/livestock-meat` | `/environment/food-chains/livestock` | Redirect |
| `/milk-dairy` | `/environment/food-chains/dairy` | Redirect |
| `/events/news` | `/security/events?view=news` | Query param |
| `/events/engine` | `/security/events?view=engine` | Query param |
| `/events/timeline` | `/security/events?view=timeline` | Query param |
| `/events/signal` | `/security/events?view=signal` | Query param |
| `/events/temporal` | `/security/events?view=temporal` | Query param |
| `/events/rtee` | `/security/events?view=rtee` | Query param |

## A.4 New Routes

| Route | Component | Status |
|---|---|---|
| `/alerts` | `AlertHub` | Stub |
| `/missions/food-security` | `MissionControl` | Planned |
| `/missions/elite-fracture` | `MissionControl` | Planned |
| `/missions/ugtt-escalation` | `MissionControl` | Planned |
| `/missions/water-collapse` | `MissionControl` | Planned |
| `/missions/border-instability` | `MissionControl` | Planned |
| `/missions/narrative-war` | `MissionControl` | Planned |
| `/intelligence-architecture` | `IntelligenceArchitecture` | Stub |

## A.5 Component Renames

| Old Name | New Name | Reason |
|---|---|---|
| `SocialIntelligence` (Security) | `SocialThreatIntelligence` | Avoid collision |
| `SocialIntelligence` (Socio-Political) | `SocialPoliticalIntelligence` | Avoid collision |
| `StrategicExplorer` | `CorporateExplorer` | Clearer purpose |
| `AgriculturalPulse` | `FoodSupplyChains` | Merge 5 nodes |
| `FeedHub` | `FoodSupplyChains` | Merge 5 nodes |
| `PoultryEggsIntelligence` | `FoodSupplyChains` | Merge 5 nodes |
| `LivestockMeatIntelligence` | `FoodSupplyChains` | Merge 5 nodes |
| `MilkDairyIntelligence` | `FoodSupplyChains` | Merge 5 nodes |

## A.6 Data Source Tags

Used in navigation config to track which modules consume which data sources:

| Tag | Source | Latency |
|---|---|---|
| `supabase` | PostgreSQL real-time | <1s |
| `rss` | RSS news aggregator | ~5min |
| `gemini` | Google Gemini AI | ~2min |
| `external-api` | Economic/weather APIs | ~1hr |
| `osint` | OSINT scrapers | ~30min |
| `nlp` | NLP pipeline | ~5min |
| `weather-api` | Weather data | ~15min |
| `satellite` | Satellite imagery | ~1hr |
| `pipeline` | Internal data pipeline | <1s |
| `news` | News analysis | ~5min |
| `social-media` | Social media feeds | ~10min |

## A.7 Equation Tags

Used in navigation config to track which modules consume which equations:

| Tag | Name | Used By |
|---|---|---|
| `EQ.1` | RRI Aggregate | National Command, Core Intelligence, Strategic Modeling |
| `EQ.2` | Ministerial Instability Index | Governance Matrix |
| `EQ.3` | Grievance → Mobilization | Radicalisation, Shock Engine |
| `EQ.4` | Mobilization → Action | Radicalisation, Border Instability |
| `EQ.5` | Social Contract Breakdown | Societal Fracture |
| `EQ.6` | Polarization Index | Societal Fracture |
| `EQ.7` | Resource Stress → Grievance | Shock Engine |
| `EQ.13` | Shock Aggregation | Core Intelligence, Alert Hub, Shock Engine, Mission Control |
| `EQ.17` | Cascade Risk | Shock Engine, Mission Control |
| `EQ.19` | Information Amplification | Radicalisation, Narrative, Shock Engine, Mission Control |
