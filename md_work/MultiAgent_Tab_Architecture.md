# Multi-Agent Tab — Architecture Plan

> **Date:** 2026-05-19  
> **Status:** Architecture Plan — Tab Shell Built, Engine Deferred  
> **Icon:** Bot  
> **Location:** `src/components/system/MultiAgentTab.tsx`

---

## 1. Purpose

Six specialized AI agents, each owning one domain, running analysis independently then passing findings to a **Meta-Agent** that resolves contradictions and produces a consensus intelligence brief.

## 2. The 6 Domain Agents

| Agent | Domain | Watches |
|-------|--------|---------|
| **Economy Agent** | EQ.1, EQ.24 | FX reserves, inflation, IMF status, subsidy burn rate |
| **Social Agent** | EQ.4, EQ.3 | UGTT signals, protest velocity, SIR model state |
| **Narrative Agent** | EQ.19 | Frame convergence, slogan velocity, disinformation load |
| **Security Agent** | EQ.8, EQ.13 | Border incidents, decree 54 arrests, military posture |
| **Elite Agent** | EQ.7, EQ.18, EQ.21 | MII, cabinet changes, elite cohesion dynamics |
| **External Agent** | EQ.8, EQ.9 | Libya/Algeria pressure, remittances, diaspora signals |

**Meta-Agent:** Receives all 6 assessments, detects contradictions, weights by SCI credibility scores, produces final consensus brief with confidence interval.

## 3. Data Model

```typescript
const DOMAIN_AGENTS = [
  { id: 'economy',  label: 'Economy Agent',  domain: 'Economy',       color: '#10b981', equations: ['EQ.1', 'EQ.24'], watches: 'FX reserves, inflation, IMF, subsidy burn rate' },
  { id: 'social',   label: 'Social Agent',   domain: 'Social',        color: '#f59e0b', equations: ['EQ.4', 'EQ.3'],  watches: 'UGTT signals, protest velocity, SIR model state' },
  { id: 'narrative',label: 'Narrative Agent',domain: 'Narrative',     color: '#8b5cf6', equations: ['EQ.19'],         watches: 'Frame convergence, slogan velocity, disinformation load' },
  { id: 'security', label: 'Security Agent', domain: 'Security',      color: '#ef4444', equations: ['EQ.8', 'EQ.13'], watches: 'Border incidents, decree 54 arrests, military posture' },
  { id: 'elite',    label: 'Elite Agent',    domain: 'Elite',         color: '#ec4899', equations: ['EQ.7', 'EQ.18', 'EQ.21'], watches: 'MII, cabinet changes, elite cohesion' },
  { id: 'external', label: 'External Agent', domain: 'External',      color: '#06b6d4', equations: ['EQ.8', 'EQ.9'],  watches: 'Libya/Algeria pressure, remittances, diaspora signals' },
];
```

## 4. State Model (local only, no persistence)

```typescript
type AgentStatus = 'standby' | 'running' | 'error';
interface AgentState {
  status: AgentStatus;
  lastRun: string | null;
  assessment: string | null;
  contradictions: number;
  confidence: number | null;
}
```

## 5. Layout

```
┌──────────────────────────────────────────────────────────────┐
│  META-AGENT SYNTHESIS                                        │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  [STANDBY] Consensus Brief                             │  │
│  │  Confidence: —  ·  Contradictions: 0  ·  Reports: 0    │  │
│  └────────────────────────────────────────────────────────┘  │
├──────────────────────────────────────────────────────────────┤
│  DOMAIN AGENTS  (2×3 grid)                                  │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐               │
│  │ Economy    │ │ Social     │ │ Narrative  │               │
│  │ ◉ STANDBY  │ │ ◉ STANDBY  │ │ ◉ STANDBY  │               │
│  │ EQ.1,24    │ │ EQ.4,3     │ │ EQ.19      │               │
│  ├────────────┤ ├────────────┤ ├────────────┤               │
│  │ Security   │ │ Elite      │ │ External   │               │
│  │ ◉ STANDBY  │ │ ◉ STANDBY  │ │ ◉ STANDBY  │               │
│  │ EQ.8,13    │ │ EQ.7,18,21 │ │ EQ.8,9     │               │
│  └────────────┘ └────────────┘ └────────────┘               │
├──────────────────────────────────────────────────────────────┤
│  CONTRADICTION DETECTOR                                      │
│  [No contradictions detected — system idle]                  │
└──────────────────────────────────────────────────────────────┘
```

## 6. SCC Integration

| File | Change |
|------|--------|
| `SystemCommandCenter.tsx` | Add `'MULTI_AGENT'` to `Tab` type |
| `SystemCommandCenter.tsx` | Add `{ id: 'MULTI_AGENT', label: 'Multi-Agent', labelShort: 'Agents', icon: Bot }` to `TABS` |
| `SystemCommandCenter.tsx` | Add `{activeTab === 'MULTI_AGENT' && <MultiAgentTab />}` |
| `src/components/system/MultiAgentTab.tsx` | **New file** with full tab shell |

## 7. Deferred (until RAG + engine dependencies land)

- Actual agent execution (AI model calls)
- Real-time variable polling from pipeline (EQ values)
- Contradiction detection logic
- Meta-Agent consensus synthesis
- SCI credibility scoring
- agent_memory persistence
- Any backend API calls

## 8. Day 1 UX

Every element shows an amber `STANDBY` / `NOT YET ACTIVE` badge. The layout is fully built — once the engine layer lands, flip from `standby` → `running` and wire real data in.
