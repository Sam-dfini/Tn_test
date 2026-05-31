# 5. Phase-by-Phase Implementation Roadmap

## Phase 0: Foundation (Week 1)
**Goal:** Structural reorganization without breaking existing functionality.

| Task | Effort | Files |
|---|---|---|
| Fix `SocialIntelligence` naming collision | 30 min | Rename components, update imports |
| Create `navigation.ts` config (source of truth) | 2 hours | New file |
| Build `StubPage` reusable component | 2 hours | New file |
| Reorganize sidebar into 3 tiers + missions | 4 hours | Update `ProfessionalIntel.tsx` |
| Merge `Daily News` into `Daily Briefing` | 1 hour | Modify `DailyBriefing.tsx` |
| Move `Gov. Agent` to Tier 3 | 1 hour | Update routing |
| Move `Methodology` to Tier 3 | 30 min | Update routing |
| Collapse Agri-Pulse/Feed/Poultry/Livestock/Dairy into `Food Supply Chains` | 2 hours | New wrapper component |
| Build `Intelligence Architecture` stub page | 2 hours | Static topology diagram |
| **Phase 0 Total** | **~15 hours** | |

**Deliverable:** Reorganized sidebar with all stubs visible. Platform feels like one system.

## Phase 1: Alert Hub (Week 2)
**Goal:** First new feature with immediate executive value.

| Task | Effort |
|---|---|
| Design alert schema (tactical/operational/strategic) | 2 hours |
| Build alert ingestion from all domains | 4 hours |
| Implement deduplication logic | 3 hours |
| Build escalation rules engine | 3 hours |
| Create Alert Hub UI (feed + filters + detail view) | 4 hours |
| Wire to `PipelineContext` | 2 hours |
| **Phase 1 Total** | **~18 hours** |

**Deliverable:** Unified alert stream. Executives see one alert, not 40.

## Phase 2: Shock Propagation Engine (Weeks 3–4)
**Goal:** The heart of the platform. Unify existing fragments.

| Task | Effort |
|---|---|
| Design shock schema (event → variable → equation → output) | 4 hours |
| Build shock ingestion adapter (connects Events/RTEE → engine) | 6 hours |
| Build variable mapping layer (which shocks affect which variables) | 6 hours |
| Create propagation chain visualizer (vertical flow diagram) | 8 hours |
| Implement Live Mode (auto-populate from Events feed) | 4 hours |
| Implement Sandbox Mode (analyst-adjustable variables) | 6 hours |
| Implement Governorate Propagation (spatial spread) | 6 hours |
| Add equation visibility (each arrow shows which EQ fires) | 4 hours |
| Connect to RRI engine for delta calculation | 4 hours |
| **Phase 2 Total** | **~48 hours** |

**Deliverable:** Analysts can see any shock propagate through the system in real time.

## Phase 3: Mission Control (Week 5)
**Goal:** Transform threat-chain thinking into workspaces.

| Task | Effort |
|---|---|
| Design mission workspace layout (auto-assemble widgets) | 4 hours |
| Build mission config schema (which domains feed which mission) | 3 hours |
| Implement widget assembly engine | 6 hours |
| Build 6 initial mission pages | 12 hours |
| Connect missions to Shock Engine (pre-loaded variables) | 4 hours |
| Add "Open in Simulation Sandbox" routing | 2 hours |
| **Phase 3 Total** | **~31 hours** |

**Deliverable:** Mission-based workspaces. Analysts navigate by threat, not domain.

## Phase 4: Data Integration & Real-Time (Weeks 6–7)
**Goal:** Connect stubs to live data.

| Task | Effort |
|---|---|
| Activate `Societal Fracture` with real data | 6 hours |
| Activate `Actor Network` with real data | 8 hours |
| Connect `Governance Matrix (TRGM)` to live MII signals | 8 hours |
| Build `Corporate Explorer` (entity resolution + graph) | 12 hours |
| Build `Entrepreneur Intel` (startup ecosystem data) | 6 hours |
| Connect `Cognitive Warfare` to narrative signals | 8 hours |
| **Phase 4 Total** | **~48 hours** |

## Phase 5: Advanced Systems Completion (Weeks 8–10)
**Goal:** Full predictive intelligence capability.

| Task | Effort |
|---|---|
| Rebuild RRI with all 20 equations + governorate propagation | 16 hours |
| Implement dynamic salience (variable weight adjustment) | 8 hours |
| Implement information amplification (EQ.19) with live feeds | 6 hours |
| Build stochastic shock injection (Monte Carlo) | 8 hours |
| Complete `Civilizational Analysis` (Dalio, Haupt, Freedom, Ideology) | 8 hours |
| Build `Historical Pattern Matching` engine | 10 hours |
| **Phase 5 Total** | **~56 hours** |

## Phase 6: Polish & Performance (Week 11)
**Goal:** Production readiness.

| Task | Effort |
|---|---|
| Lazy loading optimization for all stubs | 4 hours |
| Bundle analysis and code splitting | 4 hours |
| Error boundaries for all mission workspaces | 3 hours |
| Mobile responsive pass | 6 hours |
| Accessibility audit | 4 hours |
| **Phase 6 Total** | **~21 hours** |

## Total Estimated Effort

| Phase | Duration | Hours |
|---|---|---|
| Phase 0: Foundation | Week 1 | 15 |
| Phase 1: Alert Hub | Week 2 | 18 |
| Phase 2: Shock Engine | Weeks 3–4 | 48 |
| Phase 3: Mission Control | Week 5 | 31 |
| Phase 4: Data Integration | Weeks 6–7 | 48 |
| Phase 5: Advanced Systems | Weeks 8–10 | 56 |
| Phase 6: Polish | Week 11 | 21 |
| **Total** | **11 weeks** | **~237 hours** |
