# TunisiaIntel v2.0 — Enhancement Plan
## From Dashboard to National Intelligence Simulation Environment

**Version:** 2.0-ENHANCEMENT  
**Date:** 2026-05-10  
**Status:** Architecture & Implementation Roadmap  
**Target:** Claude Code (implementation)  

---

## Document Structure

This plan is split into 13 files for easier navigation:

| # | File | Content |
|---|---|---|
| 0 | `00-README.md` | This file — overview and index |
| 1 | `01-Executive-Summary.md` | What we built, what it is, what is missing, the goal |
| 2 | `02-Current-State.md` | Full module inventory, shock engine fragments, naming conflicts |
| 3 | `03-Ontology-Problem.md` | Domain-based vs mission-based navigation, the three layers |
| 4 | `04-Target-Architecture.md` | 3 Tiers + Cross-Cutting: National Command, Intelligence Domains, Advanced Systems, Mission Control |
| 5 | `05-Implementation-Roadmap.md` | Phase 0–6, 11-week timeline, hour estimates |
| 6 | `06-Component-Specs.md` | StubPage, Navigation Config, Alert Hub, Shock Engine, Mission Workspace schemas |
| 7 | `07-Data-Flow.md` | System topology, equation visibility, signal flow monitor |
| 8 | `08-Mission-Control.md` | 6 mission definitions, trigger conditions, lifecycle |
| 9 | `09-Shock-Engine.md` | DAG architecture, propagation example, governorate spread, UI spec |
| 10 | `10-Navigation-Config.md` | Complete navigation.ts tree with all routes, statuses, equations |
| 11 | `11-Build-Status.md` | Full build status matrix for every module |
| 12 | `12-Appendix.md` | Naming conflicts resolution, file renames, routing changes |

---

## Quick Start for Claude

1. Read `01-Executive-Summary.md` first for context
2. Read `04-Target-Architecture.md` for the new sidebar structure
3. Read `05-Implementation-Roadmap.md` for execution order
4. Reference `06-Component-Specs.md` and `10-Navigation-Config.md` during implementation
5. Use `09-Shock-Engine.md` and `08-Mission-Control.md` for the advanced features

---

## Key Decisions Before Implementation

1. **Gov. Agent placement:** Move to Tier 3 (Advanced Systems) — too complex for executive view
2. **SocialIntelligence collision:** Rename to `SocialPoliticalIntelligence` (Socio-Political) and `SocialThreatIntelligence` (Security)
3. **Food Supply Chains:** Collapse Agricultural Pulse + Feed + Poultry + Livestock + Dairy into one node
4. **Events sub-tabs:** Convert to view mode toggles, not separate routes
5. **Daily News:** Merge into Daily Briefing as a "Live Feed" panel

---

## Build Status Legend

| Symbol | Status | Meaning |
|---|---|---|
| ● | Live | Built and functional |
| ○ | Stub | Page exists, placeholder content, ready for data |
| ⊘ | Planned | Route exists, links to "Coming Soon" card |
