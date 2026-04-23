# TunisiaIntel Agriculture Dashboard — UI/UX Design Specification

## Overview

A tactical intelligence dashboard for monitoring Tunisia's agricultural system, integrating satellite-derived crop health, economic stress indicators, protein markets, black market detection, and price forecasting — all mapped to governorate-level geospatial visualization.

---

## Design System

### Color Palette (Intelligence/Tactical)

| Token | Hex | Usage |
|-------|-----|-------|
| `--bg-primary` | `#0a0f1a` | Main background — deep navy black |
| `--bg-secondary` | `#111827` | Card/panel backgrounds |
| `--bg-tertiary` | `#1a2332` | Elevated surfaces, hover states |
| `--border-subtle` | `#1e3a5f` | Panel borders, dividers |
| `--border-active` | `#3b82f6` | Active selections, focus rings |
| `--text-primary` | `#f1f5f9` | Headings, primary data |
| `--text-secondary` | `#94a3b8` | Labels, timestamps, metadata |
| `--text-muted` | `#475569` | Disabled, placeholder |
| `--accent-green` | `#10b981` | Healthy/positive indicators |
| `--accent-yellow` | `#f59e0b` | Warning, medium risk |
| `--accent-orange` | `#f97316` | Elevated concern |
| `--accent-red` | `#ef4444` | Critical, high risk |
| `--accent-blue` | `#3b82f6` | Water, information |
| `--accent-purple` | `#8b5cf6` | AI-generated, predictions |
| `--accent-cyan` | `#06b6d4` | Satellite data, real-time |

### Typography

| Element | Font | Size | Weight | Tracking |
|---------|------|------|--------|----------|
| Dashboard Title | Inter | 24px | 700 | -0.02em |
| Panel Title | Inter | 14px | 600 | 0.05em (uppercase) |
| Metric Value | Inter/Mono | 32px | 700 | -0.03em |
| Metric Label | Inter | 12px | 500 | 0.02em |
| Data Table | Inter | 13px | 400 | normal |
| Map Label | Inter | 11px | 500 | normal |
| Alert Banner | Inter | 14px | 600 | normal |

### Spacing Grid

- Base unit: 4px
- Panel padding: 16px (4 units)
- Panel gap: 12px (3 units)
- Section gap: 24px (6 units)
- Border radius: 8px (cards), 12px (modals), 4px (buttons)

---

## Dashboard Layout

### Grid Structure

```
┌─────────────────────────────────────────────────────────────────────┐
│  HEADER BAR (64px)                                                  │
│  [Logo] TunisiaIntel  │  AGRI-INTEL  │  [Breadcrumb]  │  [Alerts] [User]  │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────┐ │
│  │  AGRO STRESS  │  │  WATER INDEX │  │  PROTEIN     │  │  BLACK   │ │
│  │  INDEX        │  │              │  │  STRESS      │  │  MARKET  │ │
│  │  [0.00-1.00]  │  │  [0.00-1.00] │  │  [0.00-1.00] │  │  INDEX   │ │
│  │  ◉ CRITICAL   │  │  ◉ STABLE    │  │  ◉ ELEVATED  │  │  [0.00]  │ │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────┘ │
│  [KPI CARDS ROW — 4 columns, fixed height 120px]                    │
├─────────────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────┐  ┌────────────────────────────────┐ │
│  │                            │  │                                │ │
│  │    TACTICAL MAP            │  │    GOVERNORATE INTELLIGENCE    │ │
│  │    (Tunisia GeoJSON)       │  │    PANEL                       │ │
│  │                            │  │                                │ │
│  │  • NDVI overlay            │  │  • Selected governorate stats  │ │
│  │  • Rainfall heatmap        │  │  • Crop breakdown              │ │
│  │  • Alert markers           │  │  • Water status                │ │
│  │  • Governorate boundaries  │  │  • Price trends                │ │
│  │                            │  │  • Risk flags                  │ │
│  │  [Map Controls]            │  │                                │ │
│  │  [L]ayers [G]overnorate    │  │                                │ │
│  │  [T]ime [R]eset            │  │                                │ │
│  │                            │  │                                │ │
│  └────────────────────────────┘  └────────────────────────────────┘ │
│  [MAP ROW — 60% width map, 40% panel, min-height 500px]            │
├─────────────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────┐  ┌────────────────────────────────┐ │
│  │    CROP MONITORING         │  │    PROTEIN & MARKET            │ │
│  │    (Tabs: Wheat/Olive/     │  │    (Tabs: Livestock/Poultry/   │ │
│  │     Vegetables/Dates)      │  │     Fish/Black Market/Prices)   │ │
│  │                            │  │                                │ │
│  │  • NDVI trend chart        │  │  • Feed stress gauge           │ │
│  │  • Soil moisture chart     │  │  • Price gap visualization     │ │
│  │  • Rainfall bars           │  │  • Currency distortion         │ │
│  │  • Yield forecast          │  │  • Price prediction chart      │ │
│  │  • Risk timeline           │  │  • Market divergence           │ │
│  │                            │  │                                │ │
│  └────────────────────────────┘  └────────────────────────────────┘ │
│  [ANALYSIS ROW — 2 columns, equal width, min-height 400px]         │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │    SATELLITE DATA PIPELINE STATUS                            │   │
│  │    [Sentinel-2] [CHIRPS] [Soil Moisture] [Feed Data]        │   │
│  │    Last update: 2h ago  │  Next refresh: 6h  │  Health: ●●●○  │   │
│  └─────────────────────────────────────────────────────────────┘   │
│  [PIPELINE STATUS BAR — full width, 48px]                          │
├─────────────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────┐  ┌────────────────────────────────┐ │
│  │    FOOD PRICE PREDICTION   │  │    SYSTEM ALERTS & SHOCKS    │ │
│  │    ENGINE                  │  │                                │ │
│  │                            │  │  • Active alerts list          │ │
│  │  • 2-week forecast chart   │  │  • ε(t) shock history          │ │
│  │  • 4-week forecast chart   │  │  • RRI trajectory              │ │
│  │  • 8-week forecast chart   │  │  • Trigger conditions          │ │
│  │  • Product selector        │  │  • Analyst notes               │ │
│  │  • Confidence intervals    │  │                                │ │
│  │                            │  │                                │ │
│  └────────────────────────────┘  └────────────────────────────────┘ │
│  [PREDICTION ROW — 2 columns, min-height 350px]                    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Component Specifications

### 1. KPI Cards (Top Row)

**Layout:** 4 equal-width cards, 120px height
**Background:** `--bg-secondary` with 1px `--border-subtle` border
**Hover:** Border transitions to `--border-active`, subtle glow

**Card Structure:**
```
┌────────────────────────┐
│ ◉ STATUS    [Trend ▲] │  ← Top row: status dot + 24h trend
│                        │
│     0.72               │  ← Main metric: 32px bold
│                        │
│ AGRO STRESS INDEX      │  ← Label: 12px uppercase
│ HIGH RISK              │  ← Status text: color-coded
└────────────────────────┘
```

**Color Logic:**
| Value Range | Status Dot | Status Text | Glow |
|-------------|-----------|-------------|------|
| 0.00 - 0.30 | ● Green | STABLE | None |
| 0.30 - 0.50 | ● Yellow | ELEVATED | Subtle yellow |
| 0.50 - 0.70 | ● Orange | HIGH | Orange glow |
| 0.70 - 1.00 | ● Red + pulse | CRITICAL | Red pulse animation |

**Trend Indicator:**
- ▲ 12% (green) — improving
- ▼ 8% (red) — deteriorating
- → 0% (gray) — stable

---

### 2. Tactical Map (Center-Left)

**Map Engine:** Leaflet or MapLibre GL (open source, no API keys)
**Base Layer:** Dark matter tiles (CartoDB Dark Matter) or self-hosted
**Bounds:** Tunisia bounding box `[7.5, 30.2, 11.6, 37.5]`

**Layer System (Toggleable):**

| Layer | Visualization | Data Source |
|-------|--------------|-------------|
| **Governorate Boundaries** | White outlines, 1px, labels on hover | GeoJSON |
| **NDVI Heatmap** | Chloropleth: green (healthy) → yellow → red (stressed) | Sentinel-2 |
| **Rainfall Anomaly** | Blue intensity: light (deficit) → dark (surplus) | CHIRPS |
| **Soil Moisture** | Cyan gradient | SMAP/Proxy |
| **Alert Markers** | Pulsing red/orange dots with governorate label | System alerts |
| **Protein Stress** | Purple intensity overlay | ProteinIntel |
| **Black Market Activity** | Hatched pattern overlay | BMDM |

**Governorate Interaction:**
- **Hover:** Highlight boundary, show tooltip with name + primary metric
- **Click:** Select governorate, populate right panel, zoom to fit
- **Right-click:** Context menu (View History, Compare, Export)

**Tooltip Design:**
```
┌─────────────────────┐
│ KAIROUAN            │  ← Governorate name, 14px bold
│ ─────────────────── │
│ NDVI:      0.42 ▼  │  ← Metric: value + trend
│ Rainfall:  -23% ▼   │
│ Wheat:     HIGH ⚠   │
│ Water:     0.31 ⚠   │
│ Protein:   0.55 ▲   │
└─────────────────────┘
Background: rgba(17, 24, 39, 0.95)
Border: 1px solid --border-subtle
Border-radius: 6px
Padding: 12px
```

**Map Controls (Bottom-Left):**
- Layer toggle buttons (icon + label)
- Time slider (last 7 days, 30 days, 90 days, 1 year)
- Governorate search/filter
- Reset view button

---

### 3. Governorate Intelligence Panel (Center-Right)

**Dynamic panel — updates when governorate selected on map**

**Header:**
```
┌─────────────────────────────────┐
│ [Flag icon] KAIROUAN            │
│ Central Tunisia │ Pop: 570K     │
│ [Close] [Compare] [Export]      │
└─────────────────────────────────┘
```

**Tab Navigation:**
- Overview | Crops | Water | Protein | Market | Alerts

**Overview Tab Content:**
```
┌─────────────────────────────────┐
│ RISK SUMMARY                    │
│ ┌─────────┐ ┌─────────┐         │
│ │  0.72   │ │  0.55   │         │
│ │  HIGH   │ │ MEDIUM  │         │
│ │  Agro   │ │ Water   │         │
│ └─────────┘ └─────────┘         │
│                                 │
│ PRIMARY THREATS                 │
│ ⚠ Wheat stress: 0.78 (critical)│
│ ⚠ Water reserve: 0.31 (low)    │
│ ⚠ Feed stress: 0.62 (elevated)  │
│                                 │
│ SATELLITE STATUS                │
│ NDVI:  0.42  [████████░░░░]    │
│ Rain:  -23%  [██████░░░░░░]    │
│ Soil:  0.38  [███████░░░░░]    │
│                                 │
│ LAST UPDATED: 2h ago            │
└─────────────────────────────────┘
```

**Mini Charts:** Sparkline charts (50px height) for 30-day trend

---

### 4. Crop Monitoring Panel (Bottom-Left)

**Tab System:** Wheat | Olive | Vegetables | Dates | Barley

**Wheat Tab:**
```
┌─────────────────────────────────┐
│ WHEAT MONITORING          [?]   │
│ ─────────────────────────────── │
│                                 │
│  NDVI TREND (30 days)           │
│  ┌─────────────────────────┐    │
│  │     ╱╲                  │    │  ← Line chart
│  │    ╱  ╲    ╱╲           │    │
│  │ ──╱────╲──╱──╲────     │    │
│  └─────────────────────────┘    │
│  0.42 ── Current │ 0.38 Avg     │
│                                 │
│  SOIL MOISTURE vs RAINFALL      │
│  ┌─────────────────────────┐    │
│  │ ████░░░░░░░░  Rain     │    │  ← Dual axis bar/line
│  │ ─────╲───────  Soil     │    │
│  └─────────────────────────┘    │
│                                 │
│  YIELD FORECAST                 │
│  ┌─────────────────────────┐    │
│  │    ▓▓▓▓▓▓▓▓░░░░░░░░    │    │  ← Horizontal bar gauge
│  │    Expected: 78%        │    │
│  │    Historical: 100%     │    │
│  └─────────────────────────┘    │
│                                 │
│  RISK TIMELINE                  │
│  ┌─────────────────────────┐    │
│  │ ○──○──●──●──●──○──○   │    │  ← Dot timeline
│  │ Low      Elev  High    │    │
│  └─────────────────────────┘    │
│                                 │
│  [View Full Report] [Download]  │
└─────────────────────────────────┘
```

**Chart Specifications:**
- Library: Recharts (React-native) or Chart.js
- Line charts: 2px stroke, no fill, grid dashed at 0.5 opacity
- Bar charts: 8px bar width, 4px radius, gradient fill
- Colors: Primary metric = `--accent-cyan`, Secondary = `--accent-blue`
- Axis: Minimal (no grid lines on Y, ticks at 0, 0.5, 1.0)

---

### 5. Protein & Market Panel (Bottom-Right)

**Tab System:** Livestock | Poultry | Fish | Black Market | Prices

**Black Market Tab (Most Critical):**
```
┌─────────────────────────────────┐
│ BLACK MARKET DETECTION      [🔒] │
│ ─────────────────────────────── │
│                                 │
│  BMI: 0.68  LEVEL: ACTIVE ⚠    │
│  [████████████░░░░░░░░]         │
│                                 │
│  COMPONENT BREAKDOWN            │
│  ┌─────────────────────────┐    │
│  │ Price Gap      0.82 ████████││  ← Horizontal bars
│  │ Availability   0.55 ██████░░││
│  │ Currency Dist. 0.71 ███████░││
│  │ Informal Sig.  0.45 ████░░░░││
│  └─────────────────────────┘    │
│                                 │
│  PRICE DIVERGENCE               │
│  ┌─────────────────────────┐    │
│  │ Product │ Official│ Real│Gap │
│  │─────────┼─────────┼─────┼────│
│  │ Bread   │ 0.200   │0.320│60%  │
│  │ Chicken │ 8.500   │12.50│47%  │
│  │ Flour   │ 0.850   │1.400│65%  │
│  │ Fuel    │ 2.300   │3.100│35%  │
│  └─────────────────────────┘    │
│                                 │
│  CURRENCY DISTORTION            │
│  Official: 3.15 TND/USD         │
│  Parallel: 3.85 TND/USD         │
│  Gap: 22%  [██████████░░░░]     │
│                                 │
│  KEYWORD ALERTS                 │
│  🔥 "prix ytir" +340%           │
│  🔥 "mafama chay" +280%         │
│  ⚠ "souk parallèle" +120%       │
│                                 │
│  [View Details] [Alert Analyst] │
└─────────────────────────────────┘
```

---

### 6. Pipeline Status Bar

**Full-width strip below map section**

```
┌─────────────────────────────────────────────────────────────────────┐
│ ●●●○  System Health  │  🛰 Sentinel-2: 2h ago  │  🌧 CHIRPS: 5h ago │
│                       │  💧 Soil: 12h ago      │  📊 Feed: 1d ago   │
│ Next refresh: 6h      │  [Refresh All] [Settings]                        │
└─────────────────────────────────────────────────────────────────────┘
```

**Health Indicator:**
- ●●●● = All systems operational (green)
- ●●●○ = One system delayed (yellow)
- ●●○○ = Multiple systems delayed (orange)
- ●○○○ = Critical system down (red, pulsing)

---

### 7. Food Price Prediction Engine (Bottom-Left)

```
┌─────────────────────────────────┐
│ FOOD PRICE FORECAST         [🔮] │
│ ─────────────────────────────── │
│                                 │
│  [Chicken ▼] [2W ▼] [4W ▼]    │
│                                 │
│  CURRENT: 8.50 TND/kg           │
│                                 │
│  FORECAST CHART                 │
│  ┌─────────────────────────┐    │
│  │    ╱                    │    │
│  │   ╱  ╱╲                 │    │  ← Confidence band (purple fill)
│  │  ╱──╱──╲──╱╲            │    │
│  │ ╱        ╲╱ ╲___        │    │
│  └─────────────────────────┘    │
│  Now    2W    4W    6W    8W   │
│                                 │
│  PREDICTIONS                    │
│  ┌─────────────────────────┐    │
│  │ 2 weeks:  10.20  ▲20%   │    │
│  │ 4 weeks:  11.80  ▲39%   │    │
│  │ 8 weeks:  12.50  ▲47%   │    │
│  └─────────────────────────┘    │
│                                 │
│  DRIVERS                        │
│  • Feed stress ↑ 0.72          │
│  • BMI active (0.68)           │
│  • Panic buying detected        │
│                                 │
│  CONFIDENCE: 78% [███████░░░]  │
│                                 │
│  [Export Forecast] [Alert Team] │
└─────────────────────────────────┘
```

**Forecast Chart:**
- Solid line = predicted mean
- Shaded band = confidence interval (±1 std dev)
- Dashed line = historical average (for comparison)
- Vertical markers = alert thresholds (20%, 40% increase)

---

### 8. System Alerts & Shocks Panel (Bottom-Right)

```
┌─────────────────────────────────┐
│ ACTIVE ALERTS             [5] 🔥 │
│ ─────────────────────────────── │
│                                 │
│  🔴 CRITICAL                    │
│  ┌─────────────────────────┐    │
│  │ Wheat stress > 0.75     │    │
│  │ Kairouan, Gafsa         │    │
│  │ ε(t) += 0.25 triggered  │    │
│  │ 2h ago                  │    │
│  │ [Acknowledge] [Details] │    │
│  └─────────────────────────┘    │
│                                 │
│  🟠 HIGH                        │
│  ┌─────────────────────────┐    │
│  │ Protein stress > 0.6    │    │
│  │ National level          │    │
│  │ 4h ago                  │    │
│  └─────────────────────────┘    │
│                                 │
│  🟡 ELEVATED                    │
│  ┌─────────────────────────┐    │
│  │ BMI velocity > 0.2      │    │
│  │ Rapid distortion alert    │    │
│  │ 6h ago                  │    │
│  └─────────────────────────┘    │
│                                 │
│  RRI TRAJECTORY                 │
│  ┌─────────────────────────┐    │
│  │    ╱╲                   │    │
│  │   ╱  ╲  ╱╲             │    │
│  │ ─╱────╲╱──╲───         │    │
│  │            ▲ Threshold   │    │
│  └─────────────────────────┘    │
│  Current: 2.45 │ Threshold: 2.625│
│                                 │
│  SHOCK HISTORY                  │
│  ┌─────────────────────────┐    │
│  │ t+0  ε += 0.25  Wheat   │    │
│  │ t-2d ε += 0.30  BMI     │    │
│  │ t-5d ε += 0.15  Water   │    │
│  └─────────────────────────┘    │
└─────────────────────────────────┘
```

---

## Interactive Behaviors

### Real-Time Updates
- WebSocket connection to Supabase WAL
- New data flashes component border (cyan pulse, 2s)
- Counter animates (count-up from old to new value)
- Map markers pulse when new alert arrives

### Governorate Selection Flow
1. User clicks governorate on map
2. Map zooms to fit governorate (smooth animation, 300ms)
3. Right panel slides in with governorate data
4. All charts filter to governorate-specific data
5. URL updates: `/dashboard?governorate=kairouan`

### Alert Acknowledgment
1. Alert card has "Acknowledge" button
2. On click: card opacity reduces to 0.6, moves to "Acknowledged" section
3. System logs: `{ analyst_id, timestamp, alert_id }`
4. If unacknowledged for >30min, escalate (email/push)

### Time Range Selection
- Presets: 24h, 7d, 30d, 90d, 1y
- Custom: Date picker range
- All charts update simultaneously with shared time context

---

## Responsive Behavior

### Desktop (≥1440px)
- Full 4-column KPI row
- Map + Panel side-by-side
- Analysis panels side-by-side
- All charts visible

### Laptop (1024–1439px)
- 2-column KPI row (scrollable)
- Map full width, panel below
- Analysis panels stacked
- Simplified charts

### Tablet (768–1023px)
- 2-column KPI row
- Map full width, panel as drawer
- Analysis panels stacked
- Touch-optimized controls

### Mobile (<768px)
- Single column, scrollable
- Map as full-screen modal
- KPI cards as horizontal scroll
- Bottom navigation for tabs

---

## Animation Specifications

| Animation | Duration | Easing | Trigger |
|-----------|----------|--------|---------|
| Panel slide-in | 300ms | cubic-bezier(0.4, 0, 0.2, 1) | Governorate click |
| Metric count-up | 800ms | ease-out | Data update |
| Alert pulse | 2000ms | ease-in-out | New alert |
| Map zoom | 300ms | cubic-bezier(0.4, 0, 0.2, 1) | Governorate select |
| Chart draw | 600ms | ease-out | Component mount |
| Border flash | 2000ms | ease-out | Real-time update |
| Tooltip fade | 150ms | ease-out | Hover |

---

## Data Flow (Frontend)

```
Supabase WAL ──► WebSocket ──► RSSContext.tsx ──► React State
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────┐
│  Dashboard State Manager (Zustand / Redux)            │
│  • selectedGovernorate: string | null                  │
│  • timeRange: { start: Date, end: Date }               │
│  • activeLayers: string[]                              │
│  • alerts: Alert[]                                      │
│  • kpiData: Record<string, number>                     │
│  • mapData: GeoJSON FeatureCollection                    │
└─────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
              KPI Cards      Map Component    Panel Components
                    │               │               │
                    ▼               ▼               ▼
              Recharts       Leaflet/MapLibre   Recharts
```

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 + TypeScript |
| Styling | Tailwind CSS |
| State | Zustand (lightweight) |
| Charts | Recharts |
| Maps | Leaflet or MapLibre GL |
| Real-time | Supabase Realtime (WebSocket) |
| Icons | Lucide React |
| Animations | Framer Motion |
| Date | date-fns |

---

## File Structure

```
src/
├── components/
│   ├── dashboard/
│   │   ├── DashboardLayout.tsx
│   │   ├── KpiCard.tsx
│   │   ├── KpiRow.tsx
│   │   ├── TacticalMap.tsx
│   │   ├── MapTooltip.tsx
│   │   ├── MapControls.tsx
│   │   ├── GovernoratePanel.tsx
│   │   ├── CropMonitoring.tsx
│   │   ├── ProteinMarket.tsx
│   │   ├── PricePrediction.tsx
│   │   ├── AlertPanel.tsx
│   │   └── PipelineStatus.tsx
│   ├── charts/
│   │   ├── Sparkline.tsx
│   │   ├── AreaChart.tsx
│   │   ├── BarChart.tsx
│   │   ├── ConfidenceBand.tsx
│   │   └── Gauge.tsx
│   └── ui/
│       ├── Badge.tsx
│       ├── ProgressBar.tsx
│       ├── Tooltip.tsx
│       └── Tabs.tsx
├── hooks/
│   ├── useRealtimeData.ts
│   ├── useMapData.ts
│   ├── useGovernorateData.ts
│   └── useAlerts.ts
├── stores/
│   └── dashboardStore.ts
├── types/
│   └── dashboard.ts
└── data/
    └── tunisia_governorates.geojson
```

---

## Color Application Guide

| Element | Color Token | Example |
|---------|------------|---------|
| Background | `--bg-primary` | `#0a0f1a` |
| Card BG | `--bg-secondary` | `#111827` |
| Borders | `--border-subtle` | `#1e3a5f` |
| Primary text | `--text-primary` | `#f1f5f9` |
| Secondary text | `--text-secondary` | `#94a3b8` |
| Healthy/Good | `--accent-green` | `#10b981` |
| Warning | `--accent-yellow` | `#f59e0b` |
| Elevated | `--accent-orange` | `#f97316` |
| Critical | `--accent-red` | `#ef4444` |
| Water | `--accent-blue` | `#3b82f6` |
| Satellite | `--accent-cyan` | `#06b6d4` |
| AI/Prediction | `--accent-purple` | `#8b5cf6` |
| Black Market | `--accent-red` (darker) | `#991b1b` |

---

*Design specification for TunisiaIntel Agriculture Dashboard v1.0*
