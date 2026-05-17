# TunisiaIntel — Bug Fix Spec
**For OpenCode. Execute steps in order. One file per step. No other changes.**

---

## STEP 1 — Fix loading screen state reset (`App.tsx`)

**Problem:** `loadingProgress` and `loadingLogs` are never reset when a new mode is selected. On second mode selection, `dataLoadedRef.current` is already `true` so `runLoadPipelineData` returns immediately, progress never reaches 100, and `handleLoadingComplete` is never called. App hangs on loading screen.

**Fix in `src/App.tsx`:**

In `handleModeSelect`, reset loading state before starting:

```ts
const handleModeSelect = (newMode: any) => {
  // Going home never needs a loading screen
  if (newMode === 'selection') {
    setMode('selection');
    return;
  }
  if (newMode === mode) return;
  setLoadingProgress(0);
  setLoadingLogs([]);
  dataLoadedRef.current = false;
  setPendingMode(newMode);
  setIsLoading(true);
};
```

---

## STEP 2 — Fix `pyramid` mode routing (`App.tsx`)

**Problem:** `ModeSelection` has a `pyramid` card that calls `handleModeSelect('pyramid')`. After loading completes, `mode` is set to `'pyramid'` but `renderMode()` has no case for it — falls to `default` which renders `ModeSelection` again.

**Fix in `src/App.tsx`:**

Option A (recommended): Remove `pyramid` from the `ModeCard[]` array in `ModeSelection.tsx` entirely — it is not implemented.

Option B: Add a case in `renderMode()` that redirects to `professional`:
```tsx
case 'pyramid' as any:
  return (
    <motion.div key="pyramid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
      <ProfessionalIntel
        onOpenAI={() => setShowAIAnalyst(true)}
        onOpenPipeline={handleOpenPipeline}
        onGoHome={() => handleModeSelect('selection')}
        onOpenReport={() => setShowReport(true)}
        onToggleDebug={() => setShowDebug(prev => !prev)}
        context={{ governorates: govData.governorates, events: liveEvents.length > 0 ? liveEvents : eventData.events }}
      />
    </motion.div>
  );
```

**Use Option A. Remove the pyramid card from `ModeSelection.tsx`.**

In `src/components/modes/ModeSelection.tsx`, remove this object from the `MODES` array:
```ts
{
  id: 'pyramid',
  node: 'INTEL_NODE_07',
  label: 'PYRAMID HIERARCHY',
  ...
}
```

Also remove `'pyramid'` from the `onSelect` prop type union in both `ModeSelection.tsx` and `App.tsx`.

---

## STEP 3 — Add auth check timeout (`App.tsx`)

**Problem:** If Supabase is unreachable, `supabase.auth.getSession()` hangs and `isLoadingAuth` stays `true` forever — user sees a spinner with no escape.

**Fix in `src/App.tsx`**, inside `checkSession`:

```ts
const checkSession = async () => {
  const authStart = Date.now();
  logBootEvent('AUTH', 'Auth Check Started', authStart);

  try {
    const sessionPromise = supabase.auth.getSession();
    const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 4000));
    const result = await Promise.race([sessionPromise, timeoutPromise]);

    if (result && (result as any).data?.session) {
      setIsAuthenticated(true);
    } else if (safeGetItem('ti_authenticated') === 'true') {
      setIsAuthenticated(true);
    }
  } catch {
    if (safeGetItem('ti_authenticated') === 'true') {
      setIsAuthenticated(true);
    }
  }

  setIsLoadingAuth(false);
  logBootEvent('AUTH', 'Auth Check Complete', authStart);
  // ... rest of checkSession (seeding events) unchanged
};
```

---

## STEP 4 — Remove hardcoded auth bypass (`Authentication.tsx`)

**Problem:** `email === 'operator' && password === 'pass'` is a plaintext backdoor visible in source code.

**Fix in `src/components/shared/Authentication.tsx`:**

Remove these lines entirely:
```ts
if (!isSignUp && email === 'operator' && password === 'pass') {
  safeStorage.setItem('ti_authenticated', 'true');
  onAuthenticate();
  setLoading(false);
  return;
}
```

Replace with a proper demo shortcut using an env variable. Add this instead:
```ts
const DEMO_CODE = import.meta.env.VITE_DEMO_CODE || '';
if (!isSignUp && DEMO_CODE && password === DEMO_CODE && email.includes('@')) {
  safeStorage.setItem('ti_authenticated', 'true');
  onAuthenticate();
  setLoading(false);
  return;
}
```

Then add `VITE_DEMO_CODE=your_secret_here` to `.env.local`. The bypass only works if the env var is set — safe in production if not set.

---

## STEP 5 — Fix loading screen logs per mode (`App.tsx` + `TacticalLoading.tsx`)

**Problem:** `TacticalLoading` has a `MODE_MESSAGES` map that is never used. App always sends the same generic log sequence regardless of mode. The `mode` prop is passed but ignored.

**Fix in `src/App.tsx`:**

Replace `runLoadPipelineData` log lines to use mode-specific messages. Add a helper:

```ts
const getModeMessages = (m: string | null) => {
  const map: Record<string, string[]> = {
    professional: [
      'VERIFYING_ANALYST_CLEARANCE... [OK]',
      'LOADING_RRI_ENGINE_v4.2... [OK]',
      'ESTABLISHING_SECURE_UPLINK... [OK]',
      'DECRYPTING_INTELLIGENCE_LEDGER... [OK]',
      'SYNCING_PREDICTIVE_MODEL_STATE... [OK]',
      'CALIBRATING_RRI_THRESHOLD_MONITORS... [OK]',
    ],
    brain: [
      'INIT_COGNITIVE_INTERFACE... [OK]',
      'LOADING_NEURAL_TOPOLOGY_ENGINE... [OK]',
      'SYNCING_STATE_MACHINE_PHASES... [OK]',
      'CALIBRATING_PROPAGATION_GRAPH... [OK]',
    ],
    advanced: [
      'INIT_OSINT_RECONNAISSANCE_MODE... [OK]',
      'CONNECTING_RSS_INTEL_STREAMS... [OK]',
      'SCANNING_SOCIAL_SIGNAL_CLUSTERS... [OK]',
    ],
    agriculture: [
      'INIT_AGRI_CLIMATE_SYSTEM... [OK]',
      'CONNECTING_SATELLITE_NDVI_FEEDS... [OK]',
      'LOADING_CROP_STRESS_INDICES... [OK]',
    ],
  };
  return map[m || ''] || [
    'ESTABLISHING_SECURE_UPLINK... [OK]',
    'LOADING_INTELLIGENCE_CORE... [OK]',
    'CALIBRATING_SENSOR_GRID... [OK]',
  ];
};
```

Then in `runLoadPipelineData`, replace the hardcoded `setLoadingLogs` calls:
```ts
const messages = getModeMessages(pendingMode);
messages.forEach((msg, i) => {
  setTimeout(() => {
    setLoadingLogs(prev => [...prev, msg]);
    setLoadingProgress(Math.round(((i + 1) / messages.length) * 90));
  }, i * 300);
});
```

After `loadPipelineData()` resolves: `setLoadingProgress(100)`.

**Fix in `src/components/shared/TacticalLoading.tsx`:**

Add a minimum display time of 1200ms so it never flashes:

```ts
useEffect(() => {
  if (progress >= 100) {
    const timeout = setTimeout(() => onCompleteRef.current(), 1200); // was 300
    return () => clearTimeout(timeout);
  }
}, [progress]);
```

---

## STEP 6 — Delete stale context backups

**Problem:** `PipelineContext_backup.tsx` and `PipelineContext_fixed.tsx` exist in `src/context/`. They are never imported. They create confusion about which file is canonical.

**Fix:** Delete both files:
- `src/context/PipelineContext_backup.tsx`
- `src/context/PipelineContext_fixed.tsx`

---

## STEP 7 — Verify `'selection'` mode type is handled everywhere

**Problem:** `handleModeSelect('selection')` was previously triggering the loading screen (before Step 1 fix). After Step 1, going home bypasses loading. But the `mode` state type union needs `'selection'` to remain valid.

**Verify only — no change needed if Step 1 is correctly applied.**

Check that the `mode` useState type still includes `'selection'`:
```ts
const [mode, setMode] = useState<'selection' | 'simplified' | 'professional' | ...>('selection');
```

This should already be correct. No change needed.

---

## STEP 8 — Fix `setRSSEnabled` double state update (`App.tsx`)

**Problem:** `handleLoadingComplete` calls both `setMode(pendingMode)` and `setRSSEnabled(true)` in the same function. `setRSSEnabled` dispatches a CustomEvent which triggers `setEnabled(true)` in `RSSProviderWrapper`, causing a second render cascade immediately after mode switch.

**Fix in `src/App.tsx`:** Delay the RSS enable slightly:

```ts
const handleLoadingComplete = () => {
  if (pendingMode) {
    setMode(pendingMode as any);
    try { safeStorage.setItem('ti_current_mode', pendingMode); } catch(e) {}
    setPendingMode(null);
  }
  setIsLoading(false);
  // Delay RSS activation to avoid render cascade on mode switch
  setTimeout(() => setRSSEnabled(true), 500);
};
```

---

## Summary — Files Changed

| File | Steps |
|------|-------|
| `src/App.tsx` | 1, 2, 3, 5, 8 |
| `src/components/modes/ModeSelection.tsx` | 2 |
| `src/components/shared/Authentication.tsx` | 4 |
| `src/components/shared/TacticalLoading.tsx` | 5 |
| `src/context/PipelineContext_backup.tsx` | 6 (delete) |
| `src/context/PipelineContext_fixed.tsx` | 6 (delete) |
| `.env.local` | 4 (add `VITE_DEMO_CODE`) |

**Do not touch any other files. Do not refactor adjacent code. Match existing style.**
