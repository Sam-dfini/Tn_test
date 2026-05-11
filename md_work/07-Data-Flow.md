# 7. Data Flow & Equation Architecture

## 7.1 System Topology

```
┌─ TELEMETRY SOURCES ─┐
│ • Supabase (real-time)
│ • RSS feeds (news)
│ • Gemini AI (analysis)
│ • External APIs (economic, weather)
│ • Manual analyst inputs
└─────────┬───────────┘
          ↓
┌─ SIGNAL PROCESSING ─┐
│ • RTEE (Real-Time Event Engine)
│ • OSINT Intercepts
│ • NLP pipeline (narrative extraction)
│ • Geospatial tagging
└─────────┬───────────┘
          ↓
┌─ VARIABLE MAPPING ─┐
│ • Normalization (0-1 scales)
│ • Governorate attribution
│ • Temporal weighting
│ • Confidence scoring
└─────────┬───────────┘
          ↓
┌─ EQUATION ENGINE ─┐
│ • EQ.1-EQ.20 (RRI core)
│ • Cascade models
│ • Information amplification
│ • SIR protest spread
│ • Monte Carlo sampling
└─────────┬───────────┘
          ↓
┌─ RRI / CASCADE / SALIENCE ─┐
│ • Revolutionary Risk Index
│ • Ministerial Instability Index
│ • Cascade probability
│ • Narrative salience score
└─────────┬──────────────────┘
          ↓
┌─ SIMULATION ENGINE ─┐
│ • Shock propagation
│ • Scenario testing
│ • Agent modeling
│ • Backtesting
└─────────┬───────────┘
          ↓
┌─ STRATEGIC ALERTS ─┐
│ • Alert Hub (deduplicated)
│ • Mission Control
│ • Daily Briefing
│ • Executive notifications
└─────────┬───────────┘
          ↓
┌─ DECISION LAYER ─┐
│ • Analyst assessment
│ • Gov. Agent queries
│ • Report generation
│ • Action recommendations
└──────────────────┘
```

## 7.2 Equation Visibility

Every module that consumes or produces equation outputs must display:

```typescript
interface EquationVisibility {
  equationId: string;           // e.g., "EQ.13"
  equationName: string;           // e.g., "Shock Aggregation"
  inputs: string[];             // Variables consumed
  outputs: string[];            // Variables produced
  currentValue?: number;         // Live output value
  confidence: number;            // 0-1
  lastUpdated: Date;
}
```

**UI Pattern:** Small "EQ" badge on widgets. Hover → tooltip with equation details. Click → routes to Methodology page with equation highlighted.

## 7.3 Signal Flow Monitor

A technical view (in `Intelligence Architecture` or `Model Performance`) showing:

| Data Source | Status | Feeds Into | Latency |
|---|---|---|---|
| Supabase RRI table | ● Live | Core Intelligence, Alert Hub | <1s |
| RSS Aggregator | ● Live | Daily Briefing, Events | ~5min |
| Gemini AI | ● Live | Gov. Agent, Daily Briefing | ~2min |
| Economic API | ● Live | Macro Dashboard | ~1hr |
| Weather API | ● Live | Climate & Water, Fire Intel | ~15min |
| OSINT Scrapers | ○ Delayed | Black Market, Cognitive Warfare | ~30min |
| Manual Inputs | ● Live | Gov. Agent, Model Correction | Real-time |

**Status Legend:**
- ● Green = Live (< 2x expected latency)
- ○ Amber = Delayed (2-5x expected latency)
- ⊘ Red = Stale (> 5x expected latency or offline)
