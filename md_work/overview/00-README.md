# TunisiaIntel v2.0 — Enhancement Plan
## From Dashboard to National Intelligence Simulation Environment

**Version:** 2.0-ENHANCEMENT  
**Date:** 2026-05-10  
**Status:** Architecture & Implementation Roadmap  
**Target:** Claude Code (implementation)  

---

## Document Structure

Organized into thematic subfolders:

| Folder | Contents |
|--------|----------|
| `overview/` | README, Executive Summary, Current State, Appendix, Master Plan |
| `architecture/` | Target Architecture, Data Flow, Cerebras, Cognitive Architecture, Mode Runtime, Strategic Brain Layer, v3 Cognitive Workspace, MultiAgent Tab |
| `phases/` | Phase 4–10 build specs (Actor Cognition, Doctrine Library, Deliberation Engine, Simulation Chamber, High Table, Cognitive Workspace, Intervention Engine) |
| `ontology/` | Ontology Problem statement, Ontology v1 causal chains |
| `backend/` | Shock Engine, RAG Architecture, RAG Upload, NationalStateSnapshot Schema |
| `ui-design/` | AI Config Page, Brain Mode Spec, Notification Improvement, Component Specs, Navigation Config, Mission Control |
| `planning/` | Implementation Roadmap, Strategic Evolution Plan, SaaS Upgrade |
| `devops/` | Build Status, Bugfix Spec, Audit Future Fix |

---

## Quick Start for Claude

1. Read `overview/01-Executive-Summary.md` first for context
2. Read `architecture/04-Target-Architecture.md` for the new sidebar structure
3. Read `planning/05-Implementation-Roadmap.md` for execution order
4. Reference `ui-design/06-Component-Specs.md` and `ui-design/10-Navigation-Config.md` during implementation
5. Use `backend/09-Shock-Engine.md` and `ui-design/08-Mission-Control.md` for advanced features
6. See `phases/Phase*_Spec.md` for individual phase build specs

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
