# RRI Variables — Supabase Integration Plan

## Current Problem

The RRI engine (`src/math/rri/engine.ts`) imports 251 variables from `src/data/rri_variables.json` **at build time**. The values are frozen until the next build. `PipelineContext.recalculateRRI()` overrides ~30 of them via the `overrides` object, but the other ~220 variables always use the static JSON fallback values.

## Target Architecture

```
Supabase `variables` table (live values)
  ↓ (fetched by Python backend /api/variables)
initializeVariables() fetches → stores in module-level cache (pipelineService.ts)
  ↓ (read by PipelineContext.recalculateRRI())
calculateRRI(overrides, 0, liveVars)
  ↓
All 251 variables have LIVE values + PipelineContext overrides on top
```

## Implementation Steps

### Step 1 — Variables Table in Schema

**File:** `src/utils/schemaValidator.ts`

Add `variables` table to `SCHEMA_MAP`:

```ts
variables: {
  id: 'text',
  code: 'text',
  number: 'int8',
  value_2026: 'float8',
  min_value: 'float8',
  max_value: 'float8',
  invert: 'boolean',
  weight: 'float8',
  threshold: 'float8',
  threshold_weight: 'float8',
  volatility: 'float8',
  pipeline_field: 'text',
  label: 'text',
  source: 'text',
  category: 'text'
}
```

### Step 2 — Variable Cache in pipelineService.ts

**File:** `src/services/pipelineService.ts`

Add a module-level cache and getter:

```ts
let RV_CACHE: RRIVariable[] | null = null;

export function getVarCache(): RRIVariable[] | null {
  return RV_CACHE;
}

export function setVarCache(v: RRIVariable[]) {
  RV_CACHE = v;
}
```

In `initializeVariables()`, after the successful fetch, store the result in `RV_CACHE`:

```ts
if (response.ok) {
  const variables = await response.json();
  // Update FIELD_MAP (existing logic)
  variables.forEach((v: any) => { ... });
  FIELD_MAP = newMap;
  // Also update RV_CACHE for RRI engine
  RV_CACHE = variables.map((v: any) => ({
    id: v.id || `${v.code}${v.number}`,
    code: v.code,
    number: v.number,
    value_2026: v.value_2026,
    value: v.value,
    min_value: v.min_value,
    max_value: v.max_value,
    invert: v.invert,
    weight: v.weight,
    threshold: v.threshold,
    threshold_weight: v.threshold_weight,
    volatility: v.volatility,
    pipeline_field: v.pipeline_field,
    label: v.label,
    source: v.source,
    category: v.category,
    last_updated: v.last_updated,
    history: v.history,
  }));
  return true;
}
```

### Step 3 — RRI Engine Accepts Live Data

**File:** `src/math/rri/engine.ts`

Add a third parameter to `calculateRRI()`:

```ts
export function calculateRRI(
  overridesOrVars?: Partial<Record<string, number>> | RRIVariable[],
  rpi_t: number = 0,
  liveData?: RRIVariable[]
): RRIState {
```

After cloning `baseVars`, merge live values on top:

```ts
// Merge live values from Supabase into baseVars
if (liveData && liveData.length > 0) {
  for (const live of liveData) {
    if (!live.code || !live.number) continue;
    const key = `${live.code}${live.number}`;
    const match = vars.find(v =>
      v.id === key || v.id === live.id || `${v.code}${v.number}` === key
    );
    if (match && live.value_2026 !== undefined) {
      match.value_2026 = live.value_2026;
      match.value = eq1_normalize(match);
    }
  }
}
```

### Step 4 — PipelineContext Passes Live Data

**File:** `src/context/PipelineContext.tsx`

In `recalculateRRI()`, pass the cache to `calculateRRI()`:

```ts
const { getVarCache } = await import('../services/pipelineService');
const liveVars = getVarCache();
const newState = calculateRRI(overrides, 0, liveVars ?? undefined);
```

### Step 5 — Seed Variables to Supabase (Optional)

Add a `/api/variables/seed` endpoint in the Python backend that upserts all 251 variables from the JSON file into Supabase.

## Data Flow After Implementation

```
Supabase `variables` table
  ↓ (Python backend queries Supabase first, falls back to JSON)
/api/variables (Express proxy → Python backend)
  ↓ (initializeVariables() fetches on startup + every 6h)
pipelineService.RV_CACHE
  ↓ (recalculateRRI() reads cache)
calculateRRI(overrides, 0, liveVars)
  ↓
JSON schema (weights, thresholds) + Supabase values = dynamic

PipelineContext overrides (30 vars, applied on top)
```

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Cache is empty on first render before API returns | Fall back to JSON-only calculation (current behavior) |
| Variable IDs mismatch between JSON and Supabase | Use `code+number` as canonical key (`A01`, `B21`) |
| Performance of merging 251 vars every tick | Cache last fetched data, only re-merge on fresh fetch |
| Supabase table doesn't exist yet | Schema fixer creates it on startup |
