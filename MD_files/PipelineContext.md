# Continuous Intelligence Pipeline (PipelineContext)

## 1. Core Concept

The `PipelineContext` is the central nervous system of TunisiaIntel v2.0. It bridges the gap between disparate data inputs (economic APIs, satellite data, scraped news) and the core analytical engines that calculate national risk.

It serves three main functions:
1.  **State Management:** Holds the master `PlatformData` (Economy, Social, Geopolitics, Energy) ensuring all UI components and engines act on the exact same snapshot of the country.
2.  **RRI Orchestration:** Automatically re-triggers the `calculateRRI()` engine whenever any underlying variable changes.
3.  **Synthesis Execution:** Triggers AI agent analysis, MII (Malign Information Influence) profiling, Actor Network mapping, and temporal forecasting through `runAIAnalysis`.

---

## 2. Platform Data Structure

The pipeline maintains a massive `PlatformData` object initialized with `DEFAULT_DATA`. This object acts as the "country state."

It is divided into macro-categories:
*   **`economy`**: GDP growth, inflation, FX reserves, parallel market premium, FDI inflows.
*   **`energy`**: STEG debt, gas import percentages, renewable capacity.
*   **`rri`**: The legacy RRI metrics (probability of revolution, compound stress, confidence intervals).
*   **`geopolitical`**: IMF deal probability, EU partnership status, NATO/Gulf alignments.
*   **`social`**: UGTT strikes, protest events, water crisis governorates, youth emigration rates, border crossing deaths.

Whenever a user or an intelligence system detects a change (e.g., *a news article indicates bread shortages*), it is "pushed" into this dataset.

---

## 3. Key Context Methods

### `updateField(path, value, source)`
The primary method for injecting new raw data into the pipeline.
*   Uses dot-notation to target deeply nested state elements (e.g., `updateField('economy.parallel_market_premium', 22, 'BlackMarketEngine')`).
*   Automatically updates the `AuditLog` so all data mutations are perfectly traceable to their source.
*   Dispatches the `ti:pipeline:push` event to trigger UI notification toasts and re-render charts.
*   Immediately calls `recalculateRRI()`.

### `pushApprovedChanges(changes)`
Similar to `updateField`, but takes an array of changes (usually human-verified from a dashboard). Emits similar events.

### `recalculateRRI()`
The pipeline rebuilds an overrides object containing the latest state data and feeds it into the `calculateRRI(overrides)` engine. This ensures the Revolutionary Risk Index always exactly matches the current pipeline state.
It also synchronizes with side-engines:
*   Generates `AgriIntel` satellite baseline mock outputs.
*   Updates legacy sub-node paths for backward compatibility.

### `runAIAnalysis()`
This asynchronous function executes the complex multi-engine intelligence cycle:
1.  Combines current RRI state with historical data.
2.  Passes it to `computeSignals()` and `computeClusters()`.
3.  Generates `SmartAlerts` (e.g., "Critical threshold breached in 3 sectors").
4.  Generates the top-level AI text analysis summary (for the dashboard).
5.  Refreshes the `MIIProfile` (disinformation) and `ActorNetwork` graph.

---

## 4. Sub-System Events & Listeners

The pipeline listens heavily for document-level events triggered by specialized modules to aggregate data seamlessly.

*   `rri-recalculate`: Global listener to force an RRI refresh.
*   `ti:agri_update`: Listens for satellite/agro data. When received, it tries to fetch a centralized summary from `/api/agri/summary` (Python backend) or falls back to local calculations (`processAgroNational`).
    *   **BCI Alerts:** If this update calculates a critical Bread Crisis Index (BCI), the pipeline automatically intercepts it and injects a `CRITICAL` or `HIGH` warning notification into the system UI.

---

## 5. Audit Logging

Every change made to the pipeline—whether by an Analyst overriding a value, an AI extracting a metric from an RSS feed, or an automated scraper update—is strictly logged in `auditLog`. 

The audit log maintains an indisputable record containing:
*   `type`: 'PUSH', 'APPROVED', 'REJECTED', 'EXTRACTED', 'RESET'.
*   `oldValue` -> `value`: The delta.
*   `source`: Which engine module or user made the change.

All audit data is temporarily persisted in local storage (`ti_audit_log` and `ti_platform_data`) to survive page reloads during chaotic intelligence gathering sessions.
