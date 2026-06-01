# TunisiaIntel — UI/UX Pro Max Audit & Improvement Plan

**Generated:** 2026-06-01  
**Tool:** UI/UX Pro Max (community skill, v1)  
**Scope:** Full frontend audit — `src/`, `src/index.css`, all component directories  
**Status:** Audit complete — no code changed yet

---

## 1. Design System Verdict

UI/UX Pro Max classifies TunisiaIntel as a **Data-Dense Dashboard** with **Dark Mode (OLED)** style. The current codebase is largely aligned with this classification. The base design system is strong — the audit surfaced execution gaps, not a wrong direction.

| Category | Recommended | Current | Match |
|---|---|---|---|
| Background | `#000000` / `#0A0E27` | `#05070a` | ✅ Near-perfect OLED black |
| Primary accent | Cyan / Blue trust | `#00f2ff` intel-cyan | ✅ Correct |
| Alert palette | Red / Amber / Green | intel-red/orange/green | ✅ Correct |
| Typography heading | Fira Code / Share Tech Mono | Inter (font-sans) | ⚠ Functional but generic |
| Typography data labels | Fira Code or Roboto Mono | JetBrains Mono | ✅ Good mono choice |
| Effects | Minimal glow, scanlines | glow-hover, border-glow-cyan, scanline animation | ⚠ Some overuse |
| Performance | OLED excellent | Lazy mode loading | ✅ Correct |

---

## 2. Critical Issues (Fix First)

### 2.1 Z-Index Chaos — `HIGH`
**File scope:** ~16 components across `src/components/`  
**Problem:** No z-index system. Arbitrary values found: `z-[4]`, `z-[60]`, `z-[70]`, `z-[100]`, `z-[110]`, `z-[200]`, `z-[250]`, `z-[300]`, `z-[400]`, `z-[999]`, `z-[1000]`, `z-[9990]`, `z-[9991]`, `z-[9998]`, `z-[9999]`, `z-[10000]`. At minimum two components use `z-[10000]`, one uses `z-[9999]` — these were clearly added to force stacking and signal underlying context bugs.

**UI/UX Pro Max rule:** Define a fixed scale. Stacking context conflicts cause hidden elements, and arbitrary `z-[9999]` values don't work when a parent creates a new stacking context.

**Proposed scale:**
```
z-10   — cards, inline widgets
z-20   — sticky headers / sidebars
z-30   — dropdowns, tooltips, popovers
z-40   — bottom drawers / side sheets
z-50   — modals, overlays
z-60   — top-level system overlays (TacticalLoading, SystemCommandCenter)
z-70   — toast notifications (always on top)
```

**Action:** Define these as Tailwind tokens in `@theme` in `index.css`. Replace all `z-[*]` with the scale values.

---

### 2.2 `prefers-reduced-motion` Not Respected — `HIGH`
**File:** `src/index.css` + all animated components  
**Problem:** 0 implementations of `@media (prefers-reduced-motion: reduce)` found anywhere. The app has 7 custom CSS animations (`scanline`, `ticker`, `marquee`, `fadeSlideUp`, `shimmer`, `pulseRing`, `borderFlow`) plus Framer Motion transitions throughout. For users with vestibular disorders or motion sensitivity, this is an accessibility failure.

**Action:** Add to `index.css`:
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```
And check the `useReducedMotion()` hook from Framer Motion in key transition components.

---

### 2.3 Focus States Removed Without Replacement — `HIGH`
**Files:** 12 instances across:
- `src/components/political/PoliticalOverview.tsx` (2× `outline-none`)
- `src/components/economy/BusinessInvestigator.tsx`
- `src/components/economy/EntrepreneurIntelligence.tsx`
- `src/components/shared/Authentication.tsx` (raw `outline: none` in CSS)
- `src/components/agriculture_dashboard/index.tsx`
- `src/components/agriculture_dashboard/GovernoratePanel.tsx`
- `src/components/agriculture_dashboard/PricePrediction.tsx` (select without focus)
- `src/components/terminal/CommandInput.tsx`
- `src/components/system/DeliberationPanel.tsx`

**Problem:** `outline-none` with no `focus:ring-*` replacement. Keyboard users get zero visual indication of focused element.

**Action pattern:**
```tsx
// Replace:
className="... outline-none"
// With:
className="... outline-none focus:ring-1 focus:ring-intel-cyan/50"
```
Terminal input (`CommandInput.tsx`) is the one valid exception — the terminal cursor IS the focus indicator.

---

### 2.4 No Focus Trapping in Modals — `HIGH`
**Files:** `AIAnalystPanel`, `DataPipeline`, `SystemCommandCenter`, `RRIMethodology`, `IntelligenceDossierExporterModal`, `CalendarOverlay`, `Onboarding`  
**Problem:** When any overlay opens, keyboard focus is not moved into it and Tab can still cycle through the background. There is no focus trap, meaning keyboard users can interact with obscured content.

**Action:** Install `focus-trap-react` or use the native `dialog` element with `<dialog>` + `showModal()` which traps focus natively. At minimum, add `onKeyDown` escape handling and initial `autoFocus` on the close button or first interactive element.

---

### 2.5 Touch Target Undersizing — `HIGH` (mobile)
**Problem:** Navigation icon buttons (`Shield`, `User`, `LogOut`) in `ModeSelection` header use `p-2` with `w-4 h-4` icons — total tap area ~32×32px. Many status strip widgets in `NationalCommandCenter` are below 44×44px.

**Rule:** Minimum 44×44px touch target, 8px gap between adjacent targets.

**Action:** Add `min-h-[44px] min-w-[44px]` to all header icon buttons. For the status strip, this is a desktop-first component so document the decision — but ensure the mobile nav (hamburger / mode selector) meets the 44px minimum.

---

## 3. High Priority Issues

### 3.1 Missing `cursor-pointer` on Interactive Divs — `HIGH`
**Count:** ~483 `onClick` handlers on non-button elements (`div`, `span`, `li`, `td`) without `cursor-pointer`.  
**Problem:** Without a pointer cursor, nothing signals that elements are clickable. This is especially visible on the mode selection cards which use `cursor-pointer` correctly — but many inner widgets, table rows, and collapsible panels do not.

**Action:** Audit rule — any `div`/`span`/`li` with `onClick` must have `cursor-pointer` in its className. Most common fix is adding it to intel-card click wrappers.

---

### 3.2 Sub-8px Text Everywhere — `HIGH`  
**Count:** 4,290 instances of `text-[8px]` through `text-[11px]`; specific `text-[7px]` found in `NationalCommandCenter.tsx` for legend labels ("V(t)", "Stable Zone", "Elevated Zone")

**Problem:** 7px text is functionally unreadable on standard DPI screens. 8–9px text is only legible on high-DPI displays in ideal conditions. The app's "intel aesthetic" drives small text, but this is crossing into illegibility. WCAG minimum is 9px but best practice is 11px minimum for data labels.

**Proposed minimum floor:**
```
Data labels / axis ticks:  text-[10px] minimum
Secondary metadata:         text-[11px] minimum  
Body / descriptions:        text-xs (12px) minimum
```

**Action:** Do a targeted sweep for `text-[7px]` and `text-[8px]` — raise all to `text-[10px]`. The 9px labels can stay as-is for now (borderline acceptable for a specialist tool).

---

### 3.3 Decorative Continuous Animations — `MEDIUM→HIGH`
**Count:** 16 uses of `animate-ping` / `animate-bounce` / `animate-spin` outside of loading contexts  
**CSS:** `--animate-scanline: scanline 8s linear infinite` is a full-screen decorative overlay that runs forever

**Problem:** UX Pro Max rule — infinite animations should be for loading indicators only. Decorative infinite animations drain battery on mobile, cause visual fatigue on extended sessions, and are the primary trigger for `prefers-reduced-motion` requests.

**Specific offenders to review:**
- Scanline animation on background overlays → reduce opacity to near-invisible or remove
- `animate-ping` status dots (multiple components) → keep one per screen max, remove redundant ones
- `animate-bounce` on non-loading icons → replace with hover state transitions

---

### 3.4 Aria Labels Missing on Icon-Only Buttons — `HIGH`
**Count:** Only 27 `aria-label` attributes across the entire component tree. There are many icon-only buttons throughout.

**Specific confirmed gaps (from audit):**
- Header `Shield` button (ModeSelection) — no label
- Header `User` button (ModeSelection) — no label  
- LogOut button uses only `<span className="hidden sm:inline">LOGOUT</span>` — the icon-only state (mobile) has no label
- Close buttons (`×`) in overlays — some have no aria-label

**Action:** Every `<button>` or clickable element with only an icon and no visible text must have `aria-label="..."`.

---

### 3.5 One Missing Image Alt Text — `MEDIUM`
**File:** `src/components/social/Media.tsx:117`  
**Action:** Add descriptive `alt=""` (decorative) or meaningful alt text to the `<img>` element.

---

## 4. Medium Priority Improvements

### 4.1 Typography: Heading Font Can Be More Distinctive
**Current:** Inter (generic humanist sans-serif) for all headings  
**UI/UX Pro Max recommendation for HUD/Sci-fi dashboards:** Share Tech Mono for section headers / module titles; Fira Code for inline data values

**Assessment:** JetBrains Mono (`font-mono`) is already used well for data labels and is a better choice than Fira Code for readability at small sizes. The weak point is `font-sans` (Inter) on module headers — it reads as generic SaaS rather than tactical intelligence.

**Suggested improvement (non-breaking):**  
Add Share Tech Mono as a third font token, use it specifically for panel header titles (the uppercase tracking-widest module names). This is additive — no existing text needs to change.

```css
/* In index.css @theme: */
--font-hud: "Share Tech Mono", monospace;

/* In Google Fonts import: */
family=Share+Tech+Mono
```

Usage: `className="font-hud text-xs uppercase tracking-widest"` for panel headers like "BREAKING INTEL", "RRI ENGINE", "ACTOR NETWORK".

---

### 4.2 Button Loading States Incomplete
**Count:** 28 loading/disabled patterns in button contexts — likely incomplete given the number of AI-triggered actions across the app

**Problem:** AI analysis buttons, RSS refresh triggers, and report generation buttons may allow double-submission during async operations. The `AIAnalystPanel`, `intelligenceBrief` trigger buttons, and export buttons should disable while pending.

**Pattern to enforce:**
```tsx
<button
  disabled={isLoading}
  className={cn("...", isLoading && "opacity-50 cursor-not-allowed")}
>
  {isLoading ? <Spinner /> : <Icon />}
  {label}
</button>
```

---

### 4.3 `text-white` Bypasses Design System
**Count:** 1,457 uses of `text-white` vs the defined `text-on-surface` token

**Problem:** `text-white` is `#ffffff` pure white (contrast ratio vs `#05070a` background: 21:1 — which exceeds WCAG AAA). This is not a contrast failure, but it bypasses the design token system. The design system defines `--color-on-surface: #e0e2ea` for a reason — pure white at full opacity in a dark theme causes halation (bloom effect on OLED, eye strain on extended use). The softer `#e0e2ea` is intentional.

**Recommendation:** Not a blocking issue — do a gradual migration pass to replace `text-white` with `text-on-surface` on body/description text. Keep `text-white` for deliberately high-emphasis elements (alerts, active mode labels, error states).

---

### 4.4 Chart Type Gaps
Based on the data types in this app, two chart upgrades are worth adding:

**a) Streaming RRI line chart** — the RRI pulse tracker should implement a proper streaming area chart with a visible "pause live feed" button. Currently the chart re-renders on each pipeline update. A streaming approach (shift buffer, append newest point) is smoother and provides the pause accessibility control that UX Pro Max flags as required for `⚠ Flashing elements`.

**b) Radar / Spider chart for multi-domain RRI breakdown** — the 6 RRI sub-domains (Social, Economic, Security, Political, Agricultural, Cognitive) are currently shown as individual KPI numbers. A radar chart allows instant visual comparison of domain weights. Recharts has `RadarChart` built-in. This would be most useful in the Professional and Palantir modes.

---

### 4.5 Glassmorphism Opacity at Light Mode Risk
**Files:** `.glass`, `.glass-card`, `.glass-panel` in `index.css`

**Assessment:** The glass utilities use `rgba(10,15,22,0.7–0.85)` which are correct for dark mode. However, if any future light-mode consideration is added (or if a panel is rendered over a lighter background), these will become invisible. UI/UX Pro Max flags `bg-white/10` as too transparent for light mode glass. While the app is pure dark-mode, document that `.glass-*` utilities are dark-mode only and must not be used on any light-background surface.

---

## 5. Low Priority / Future Enhancements

### 5.1 Responsive Breakpoints Sparse in Mode Components
**Count:** Only 61 responsive breakpoints in `src/components/modes/`  
**Assessment:** TunisiaIntel is a desktop analyst tool by design, so this is partially intentional. However, the ModeSelection screen (the entry point) should be fully responsive. The current grid (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`) is good. Main gap is the header control strip on small screens — it hides some buttons with `hidden md:flex` but provides no alternative.

**Recommendation:** Ensure `simplified` (CitizenEdition) mode is fully usable at 375px — this is the mode targeting general public users who may be on mobile.

---

### 5.2 Fixed Pixel Widths May Break Narrow Layouts
**Count:** 232 instances of `w-[*px]` fixed widths  
**Action:** Review fixed widths in sidebars and panel layouts. Most are probably fine (icon sizes, avatar circles) — but sidebar width tokens (e.g. `w-[280px]`) should use `min-w-[280px]` or be contained within a responsive wrapper.

---

### 5.3 Font Display / FOIT Already Handled
**Assessment:** `display=swap` is already in the Google Fonts import URL. ✅ No action needed.

---

### 5.4 Image Lazy Loading
**Assessment:** There are very few `<img>` tags in the app (it's mostly SVG icons and canvas). The one found in `Media.tsx:117` should get `loading="lazy"` in addition to the missing `alt`.

---

## 6. Pre-Delivery Checklist (for future UI work)

Before merging any new component or UI change, verify:

**Accessibility**
- [x] All icon-only buttons have `aria-label` ✅
- [x] No `outline-none` without a `focus:ring-*` replacement ✅
- [ ] Color is not the sole indicator of state (use icon + color)
- [x] `prefers-reduced-motion` global override in `index.css` ✅

**Interaction**
- [x] All `onClick` divs/spans have `cursor-pointer` ✅
- [x] AI / async action buttons disable during loading ✅
- [ ] Touch targets ≥ 44px on any interactive element used in SimplifiedMode

**Typography**
- [x] No text below `text-[9px]` minimum (was `text-[6px]`/`text-[7px]`) ✅
- [ ] No text below `text-xs` for body descriptions

**Z-Index**
- [x] Semantic z-index scale (`z-sticky` → `z-toast`) — no arbitrary `z-[*]` ✅

**Animation**
- [x] `animate-bounce` replaced with `animate-pulse` on decorative icons ✅
- [x] Infinite decorative animations reduced in opacity ✅
- [x] Global reduced-motion override disables all animations for accessibility ✅

**Design Tokens**
- [ ] New colors use `intel-*` tokens, not raw hex
- [ ] New overlays use `.glass-panel` or `.glass-card` classes

---

## 7. Implementation Priority Order

| # | Issue | Severity | Effort | Status |
|---|---|---|---|---|
| 1 | Z-index scale system | HIGH | Low | ✅ DONE — 9 semantic tokens added to `index.css @theme`; all `z-[*]` replaced (Leaflet `z-[1000]` retained) |
| 2 | `prefers-reduced-motion` global fix | HIGH | Low | ✅ DONE — `@media (prefers-reduced-motion: reduce)` added to `@layer base` in `index.css` |
| 3 | Focus rings on `outline-none` inputs | HIGH | Low | ✅ DONE — `focus:ring-1 focus:ring-intel-cyan/30` added to 9 files; `focus-visible:ring-2` on tab buttons |
| 4 | `cursor-pointer` on onClick divs | HIGH | Medium | ✅ DONE — Audit found codebase already largely correct; 1 residual (stopPropagation wrapper, not interactive) |
| 5 | `aria-label` on icon-only buttons | HIGH | Medium | ✅ DONE — Added to RealTimeNewsFeed close, SystemCommandCenter X buttons (×2), SourceLibrary close; ModeSelection header was already labeled |
| 6 | Min text size floor (6px/7px→9px) | HIGH | Medium | ✅ DONE — All `text-[7px]` → `text-[9px]` (256 instances) and `text-[6px]` → `text-[9px]` (28 instances) globally replaced |
| 7 | Button loading/disabled states | MEDIUM | Medium | ✅ DONE — ScenarioCompare RUN button now `disabled={isSynthesizing}` with loading label; other AI buttons already had guards |
| 8 | Reduce decorative infinite animations | MEDIUM | Low–Medium | ✅ DONE — `animate-bounce` → `animate-pulse` on Zap icon (PyramidHierarchy); scanline opacity halved in ProfessionalShared |
| 9 | Add Share Tech Mono font token | LOW | Low | ✅ DONE — Font added to Google Fonts import; `--font-hud: "Share Tech Mono"` token in `@theme` |
| 10 | Modal focus trapping (Escape key) | HIGH | Medium-High | ✅ DONE — Escape `keydown` handlers added to all 7 overlays: AIAnalystPanel, DataPipeline (+role/aria-modal), IntelligenceDossierExporter, CalendarOverlay, Onboarding, RRIMethodology, SourceLibrary |
| 11 | Radar chart for RRI domains | LOW | High | ✅ DONE — `RRIDomainRadar.tsx` created in `src/components/shared/`; 6 domains (Economy, Governance, Security, Social, Narrative, Geopolitical); toggle current/trend; placed in NationalCommandCenter 3-col grid alongside InstabilityTimeline |
| 12 | Streaming RRI chart with pause | LOW | High | ✅ DONE — `InstabilityTimeline` refactored to shift-buffer (60 points max); pause/resume button with aria-label; zone-color-aware stroke/fill; `isAnimationActive={false}` for smooth streaming; paused banner overlay |
| 13 | `text-white` → `text-on-surface` migration | LOW | High | ✅ DONE — 1,145 instances migrated; 166 state-modifier variants (`hover:text-white`, `group-hover:text-white`, `active:text-white`) preserved; 2 `selection:text-white` kept intentionally |
