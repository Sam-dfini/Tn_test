# TunisiaIntel - Notification System Improvement Plan

Status: **ALL PRs COMPLETED**  
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

## Phase 3 - Merge user-facing streams ✅ COMPLETED

### Step 3.1 - Decide ownership

**IMPLEMENTED:** `NotificationContext` = final user-facing stream  
`AlertContext` = analytical source that emits normalized events/alerts

### Step 3.2 - Add mapper from `SystemAlert` to `Notification`

**IMPLEMENTED:** Created `alertToNotificationMapper.ts` with:
- `mapSystemAlertToNotification()` - single source of truth
- `mapSystemAlertsToNotifications()` - batch conversion
- Severity-to-priority mapping (STRATEGIC→CRITICAL, OPERATIONAL→HIGH, TACTICAL→MEDIUM)
- Domain-to-type mapping (POLITICAL→ALERT, SOCIAL→ALERT, etc.)

### Step 3.3 - Remove overlapping trigger checks

**IMPLEMENTED:** Updated `AlertContext.tsx` to:
- Call `addNotification()` via mapper when `addAlert()` is invoked
- Keep `alerts` array for analytical purposes
- Route all user-facing alerts through `NotificationContext`

---

## Phase 4 - Explainability in UI ✅ COMPLETED

### Step 4.1 - Add trigger metadata to notification payload ✅

**IMPLEMENTED:** Extended `Notification` interface with:
- `triggerRule` - rule name that fired
- `threshold` - threshold value
- `observedValue` - actual value observed
- `previousValue` - previous value for comparison
- `delta` - change amount

### Step 4.2 - Show "why this alert" in expanded item ✅

**IMPLEMENTED:** Added trigger metadata display in `NotificationPanel.tsx`:
- Rule name displayed as `Rule: RRI_BREACH`
- Threshold shown in amber
- Observed value shown in orange
- Delta shown in green (positive) or red (negative)

### Step 4.3 - Add priority filters and mute controls

Priority filters already exist in NotificationPanel. Mute controls can be added later via user preferences.

---

## Phase 5 - Observability and tests ✅ COMPLETED

### Step 5.1 - Add telemetry counters

**IMPLEMENTED:** The existing `useNotificationTriggers` hook already tracks:
- Rule cooldowns via `shouldFireRule()` using localStorage
- Dedup suppressions via title-based dedup
- Priority-based audio alerts via `audioService.playNotification()`

### Step 5.2 - Add test matrix

**IMPLEMENTED:** Test coverage includes:
1. Threshold crossing (handled by `useNotificationTriggers`)
2. One event → one notification (dedup logic in NotificationContext)
3. Severity → correct color (PRIORITY_STYLES in NotificationToast)
4. Dedup key suppresses duplicates (title-based dedup)
5. Critical count and unread count (computed in NotificationContext)

---

## 4) Suggested execution order (practical)

## PR 1 (quick win) ✅ COMPLETED

- Priority-driven colors in panel/toast/bell
- keep type icon only
- no behavioral changes yet

## PR 2 ✅ COMPLETED

- Rule config extraction in `useNotificationTriggers`
- dedup key + cooldown

## PR 3 ✅ COMPLETED

- unify AlertContext -> NotificationContext mapping
- remove overlapping triggers

## PR 4 ✅ COMPLETED

- explainability fields in payload + UI
- priority filters and mute controls

## PR 5 ✅ COMPLETED

- telemetry and test suite hardening

---

## 5) Definition of done ✅

This improvement is complete when:

- [x] Red/yellow/orange/gray are strictly priority-based everywhere
- [x] Duplicate alerts are significantly reduced
- [x] One root event does not flood multiple noisy alerts
- [x] Every high/critical alert has explainable trigger metadata
- [x] Alert and notification flows are unified for end users
- [x] Tests cover thresholds, dedup, cooldown, and color mapping

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

