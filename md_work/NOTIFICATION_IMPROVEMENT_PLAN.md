# TunisiaIntel - Notification System Improvement Plan

Status: Proposed  
Scope: Frontend notification/alert pipeline (`NotificationContext`, `AlertContext`, `useNotificationTriggers`, panel/toast/bell UI)  
Goal: Make red/yellow signaling accurate, reduce noise, unify logic, and improve trust.

---

## 1) Why this improvement is needed

Current behavior has 4 structural issues:

1. Two partially overlapping systems:
   - `NotificationContext` + `useNotificationTriggers`
   - `AlertContext`
2. Color semantics are mixed:
   - some UI elements use **type-based** color
   - others use **priority-based** color
3. Duplicate/noisy triggers:
   - title-based dedup only
   - multiple alerts can fire for one root event
4. Hard to audit why something is red/yellow:
   - missing explicit trigger metadata in UI

This plan fixes those issues incrementally without blocking product work.

---

## 2) Target behavior

### Severity (single source of color truth)

- `CRITICAL` -> Red
- `HIGH` -> Orange
- `MEDIUM` -> Yellow
- `LOW` -> Gray

`type` remains taxonomy only (`RRI`, `ALERT`, `PIPELINE`, `RSS`, `SHOCK`, etc.) and should not override urgency color.

### Quality goals

- Fewer duplicate notifications
- Fewer low-value bursts
- Clear traceability for each notification
- Same severity appearance across bell, toast, and panel

---

## 3) Implementation roadmap (step-by-step)

## Phase 1 - Normalize severity and visuals (high impact, low risk)

### Step 1.1 - Define one visual mapping for priority

Create a single shared config (or utility) used by:

- `NotificationPanel.tsx`
- `NotificationToast.tsx`
- notification bell badge

Example structure:

```ts
PRIORITY_UI = {
  CRITICAL: { dot: 'red', badge: 'red', icon: 'red', pulse: true },
  HIGH:     { dot: 'orange', badge: 'orange', icon: 'orange' },
  MEDIUM:   { dot: 'yellow', badge: 'yellow', icon: 'yellow' },
  LOW:      { dot: 'gray', badge: 'gray', icon: 'gray' }
}
```

### Step 1.2 - Keep type icons, remove type color authority

- Keep icon shape by type (`RRI`, `RSS`, `PIPELINE`, etc.)
- Color icon/badges by priority only

### Step 1.3 - Align audio to same severity model

Map sound by priority:

- CRITICAL -> critical
- HIGH -> warning
- MEDIUM/LOW -> info

`SHOCK` can still force a stronger sound if needed, but color stays severity-based.

---

## Phase 2 - Rule normalization and dedup hardening

### Step 2.1 - Centralize trigger rules in one object

In `useNotificationTriggers`, define all thresholds in one config:

- RRI breach = `2.625`
- velocity alert = `> 0.20`
- FX warning = `< 90`
- FX crisis = `< 60`
- pattern activation = `> 0.65`
- UGTT high, protest surge, etc.

Benefits:

- easier tuning
- less hidden magic numbers
- safer future edits

### Step 2.2 - Add deterministic dedup key

Current dedup relies mostly on title + time.  
Add explicit `dedupKey` based on rule identity and state bucket:

```text
dedupKey = ruleId + ":" + bucket + ":" + timeWindow
```

Examples:

- `rri_breach:>=2.625:2026-05-28`
- `fx_crisis:<60:2026-05-28T10`

### Step 2.3 - Add cooldown policy per rule class

- CRITICAL: short cooldown
- HIGH: medium cooldown
- MEDIUM/LOW: longer cooldown

This prevents repeated noise while preserving urgent signal.

---

## Phase 3 - Merge user-facing streams

### Step 3.1 - Decide ownership

Recommended:

- `NotificationContext` = final user-facing stream
- `AlertContext` = analytical source that emits normalized events/alerts

### Step 3.2 - Add mapper from `SystemAlert` to `Notification`

Create one mapper layer:

- keeps domain/source/equations metadata
- converts severity model consistently
- avoids duplicated UI logic

### Step 3.3 - Remove overlapping trigger checks

Eliminate duplicated thresholds split across contexts.  
Only one place should decide whether an event becomes a user notification.

---

## Phase 4 - Explainability in UI

### Step 4.1 - Add trigger metadata to notification payload

Include:

- `triggerRule`
- `threshold`
- `observedValue`
- `previousValue`
- `delta`

### Step 4.2 - Show "why this alert" in expanded item

In panel item details, display:

- why it fired
- when it fired
- what changed
- link/action to relevant tab

### Step 4.3 - Add priority filters and mute controls

- Filter by `CRITICAL/HIGH/MEDIUM/LOW`
- Optional mute for medium/low categories for analyst focus

---

## Phase 5 - Observability and tests

### Step 5.1 - Add telemetry counters

Track:

- fired alerts by rule
- dedup suppressions
- cooldown suppressions
- read/ack latency

### Step 5.2 - Add test matrix

Minimum tests:

1. threshold crossing up/down
2. one event -> one notification under cooldown
3. severity -> correct color in panel/toast/bell
4. dedup key suppresses duplicates
5. critical count and unread count correctness

---

## 4) Suggested execution order (practical)

## PR 1 (quick win)

- Priority-driven colors in panel/toast/bell
- keep type icon only
- no behavioral changes yet

## PR 2

- Rule config extraction in `useNotificationTriggers`
- dedup key + cooldown

## PR 3

- unify AlertContext -> NotificationContext mapping
- remove overlapping triggers

## PR 4

- explainability fields in payload + UI
- priority filters and mute controls

## PR 5

- telemetry and test suite hardening

---

## 5) Definition of done

This improvement is complete when:

- [ ] Red/yellow/orange/gray are strictly priority-based everywhere
- [ ] Duplicate alerts are significantly reduced
- [ ] One root event does not flood multiple noisy alerts
- [ ] Every high/critical alert has explainable trigger metadata
- [ ] Alert and notification flows are unified for end users
- [ ] Tests cover thresholds, dedup, cooldown, and color mapping

---

## 6) Risks and mitigations

### Risk 1: Missing alerts due to over-aggressive dedup
- Mitigation: start with conservative cooldowns and log suppressions

### Risk 2: UX confusion during transition
- Mitigation: keep icon-by-type while changing color-by-priority

### Risk 3: Refactor breaks existing navigation actions
- Mitigation: preserve `action.event` contract and add regression checks

---

## 7) Notes for future editors

- Do not add new thresholds directly in random components.
- Add all trigger rules in the central rule config.
- Do not use type-based color for urgency.
- Keep `NotificationContext` as the final user stream boundary.

This document should be updated whenever notification rules or severity semantics change.

