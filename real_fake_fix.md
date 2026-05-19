# ProfessionalIntel Tab Audit — Real vs Fake

## Summary
- **REAL (24)** — Pulls from contexts/services, functional
- **HYBRID (17)** — Mix of real data and mock/static content
- **FAKE (14)** — UI shells, hardcoded data, no real connections

---

## REAL ✅ (24 functional tabs)

| Component | Source | Notes |
|-----------|--------|-------|
| Map | `src/components/shared/Map.tsx` | Dynamic geo-visualization of real data |
| PoliticalStabilityIntelligence | `src/components/political/PoliticalStabilityIntelligence.tsx` | Live MII engine from AI Analysis context |
| EconomicReality | `src/components/economy/EconomicReality.tsx` | Supabase real-time price reports subscription |
| RadicalisationIntelligence | `src/components/security/RadicalisationIntelligence.tsx` | Live radicalization analysis engine service |
| CognitiveSecurityIntelligence | `src/components/security/CognitiveSecurityIntelligence.tsx` | Live ETM cognitive environment analysis |
| SocialThreatIntelligence | `src/components/security/SocialThreatIntelligence.tsx` | Pipeline context + live signal filtering |
| NarrativeIntelligence | `src/components/social/NarrativeIntelligence.tsx` | Supabase articles/events + narrative engine |
| InvestmentIntelligenceReportGenerator | `src/components/economy/InvestmentIntelligenceReportGenerator.tsx` | Real investment engine + live contexts |
| CognitiveWarfare | `src/components/security/CognitiveWarfare.tsx` | Live cognitive warfare engine + RSS context |
| GovernmentAgentPanel | `src/components/security/GovernmentAgentPanel.tsx` | Live govAgent assessment service |
| FireIntelligencePanel | `src/components/security/FireIntelligencePanel.tsx` | Real NASA FIRMS VIIRS data + sim fallback |
| IntelligenceBriefPanel | `src/components/system/IntelligenceBriefPanel.tsx` | Live intelligence brief generation service |
| NationalCommandCenter | `src/components/NationalCommandCenter.tsx` | Live pipeline context + computed metrics |
| TRGMDashboard | `src/components/modes/TRGMDashboard.tsx` | Live pipeline context + real GSI computations |
| RRIMethodology | `src/components/system/RRIMethodology.tsx` | Live RRI state + AI analysis context |
| AlertHub | `src/components/system/AlertHub.tsx` | Real AlertContext with live alert feed |
| PoliticalCalendar | `src/components/political/PoliticalCalendar.tsx` | Supabase events + calendar data fetching |
| CalendarOverlay | `src/components/shared/CalendarOverlay.tsx` | Modal wrapper around PoliticalCalendar |
| ClusterIntelligence | `src/components/tactical/ClusterIntelligence.tsx` | Live RRI state + real cluster computation |
| RealTimeNewsFeed | `src/components/tactical/RealTimeNewsFeed.tsx` | Live RSS context with real article feed |
| LiveSignalFeed | `src/components/tactical/LiveSignalFeed.tsx` | Live signal classification from RSS/contexts |
| EventsIntelligence | `src/components/geopolitical/EventsIntelligence.tsx` | Supabase events + RSS context + live feed |
| ObservabilityDashboard | `src/pages/ObservabilityDashboard.tsx` | Observability context + live API + RSS |
| ModelPerformance | `src/components/system/ModelPerformance.tsx` | Live prediction ledger + accuracy stats |

---

## HYBRID ⚠️ (17 mixed tabs)

| Component | Source | Notes |
|-----------|--------|-------|
| GeopoliticalNetworkGraph | `src/components/political/GeopoliticalNetworkGraph.tsx` | Real contexts + hardcoded nodes/edges |
| NationalActorNetwork | `src/components/political/NationalActorNetwork.tsx` | Real contexts + hardcoded actor data |
| StrategicModeling | `src/components/predictive/StrategicModeling.tsx` | Real frameworks + hardcoded crisis events |
| SimulationIntelligence | `src/components/predictive/SimulationIntelligence.tsx` | Real simulation engine + static alerts |
| PoliticalIntelligence | `src/components/political/PoliticalIntelligence.tsx` | Real context + delegates to sub-components |
| EconomyIntelligence | `src/components/economy/EconomyIntelligence.tsx` | Real macro services + static alert arrays |
| EnvironmentalIntelligence | `src/components/agriculture/EnvironmentalIntelligence.tsx` | Real FIRMS fire service + static env alerts |
| CivilizationalAnalysis | `src/components/social/CivilizationalAnalysis.tsx` | Real context + renders sub-components |
| BusinessInvestigator | `src/components/economy/BusinessInvestigator.tsx` | Real Gemini AI + static governorate data |
| EntrepreneurIntelligence | `src/components/economy/EntrepreneurIntelligence.tsx` | Real RRI context + static business profiles |
| RTEE | `src/components/system/RTEE.tsx` | Real RSS events + synthetic computed data |
| TemporalAnalysisTab | `src/components/predictive/TemporalAnalysisTab.tsx` | Real hooks + falls back to mock history |
| AgriIntelDashboard | `src/components/agriculture/AgriIntelDashboard.tsx` | Real pipeline/agri contexts + static tables |
| FeedIntelligenceHub | `src/components/agriculture/FeedIntelligenceHub.tsx` | Real context + static BASE_FEED calibration |
| FoodSupplyChains | `src/components/agriculture/FoodSupplyChains.tsx` | Tab container for mixed sub-components |
| SocietalFractureMonitor | `src/components/SocietalFractureMonitor.tsx` | Real SBDE engine + static fallback tables |
| MissionWorkspace | `src/components/missions/MissionWorkspace.tsx` | Real mission config + mock shock object |

---

## FAKE ❌ (14 fake/placeholder tabs)

| Component | Source | Issue |
|-----------|--------|-------|
| GeopoliticalIntelligence | `src/components/geopolitical/GeopoliticalIntelligence.tsx` | Purely static actor/hardcoded alignment data |
| SecurityIntelligence | `src/components/security/SecurityIntelligence.tsx` | All static security metrics/hotspots data |
| EnergyIntelligence | `src/components/energy/EnergyIntelligence.tsx` | Static energy balance/production/alert data |
| NationalAgriculturalPulse | `src/components/modes/NationalAgriculturalPulse.tsx` | Phase 1 — explicit static calibrated NDVI |
| SocialPoliticalIntelligence | `src/components/social/SocialIntelligence.tsx` | Hardcoded migration/social/family data arrays |
| StrategicEnergyIntelligencePanel | `src/components/energy/StrategicEnergyIntelligencePanel.tsx` | 100% mock data imports (mockEnergy*, etc.) |
| BlackMarketIntelligencePanel | `src/components/geopolitical/BlackMarketIntelligencePanel.tsx` | Entirely static commodities/routes data |
| IndustrialIntelligencePanel | `src/components/economy/IndustrialIntelligencePanel.tsx` | 100% mock governorate/industry data |
| PoultryEggsIntelligence | `src/components/agriculture/PoultryEggsIntelligence.tsx` | Primarily static production/price arrays |
| LivestockMeatIntelligence | `src/components/agriculture/LivestockMeatIntelligence.tsx` | Primarily static herd/meat data arrays |
| MilkDairyIntelligence | `src/components/agriculture/MilkDairyIntelligence.tsx` | Primarily static dairy production arrays |
| IntelligenceArchitecture | `src/components/system/IntelligenceArchitecture.tsx` | Explicit stub/static Phase 4 placeholder |
| DailyBriefing | `src/components/briefing/DailyBriefing.tsx` | Massive hardcoded static briefing content |
| AIVoiceBriefing | `src/components/briefing/AIVoiceBriefing.tsx` | Hardcoded briefing text + static voices |

---

## Recommended action plan

1. **Remove** the 14 fake tabs from sidebar and routing in ProfessionalIntel.tsx
2. **Convert** hybrids to fully real by replacing mock data with context/service calls
3. **Keep** the 24 real tabs as-is
4. **Rebuild** fake tabs properly when backend data sources are available

---

*Audit generated: Wed May 13 2026*
