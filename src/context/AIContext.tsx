import { safeStorage } from '../utils/storage';
import React, {
  createContext, useContext, useState,
  useEffect, useCallback, useRef
} from 'react';

// ── Types ─────────────────────────────────────────────────────

export type AIProvider = 'GEMINI' | 'OPENAI' | 'ANTHROPIC' | 'NONE';

export type AIMode = 'SIMPLIFIED' | 'ADVANCED' | 'PROFESSIONAL' | 'PALANTIR' | 'BLOOMBERG';

export type AIStatus = 'OK' | 'WARNING' | 'CRITICAL' | 'EXHAUSTED' | 'OFFLINE';

interface AIContextType {
  // Config
  provider: AIProvider;
  mode: AIMode;
  apiKey: string;         // for non-Gemini providers (future)
  dailyBudget: number;    // max calls per day analyst sets
  isPaused: boolean;
  
  // Live state
  status: AIStatus;
  dailyCalls: number;
  callsThisSession: number;
  lastError: string | null;
  quotaExhausted: boolean;
  lastCallAt: number | null;
  
  // Actions
  setProvider: (p: AIProvider) => void;
  setMode: (m: AIMode) => void;
  setApiKey: (k: string) => void;
  setDailyBudget: (n: number) => void;
  setIsPaused: (b: boolean) => void;
  recordCall: () => void;
  recordError: (err: string) => void;
  recordQuotaExhausted: () => void;
  resetDailyCalls: () => void;
  clearError: () => void;
  
  // Permission check — call before any AI request
  canCallAI: (fromUserAction?: boolean) => boolean;
}

const AIContext = createContext<AIContextType | null>(null);

const STORAGE_KEY = 'ti_ai_config';
const CALLS_KEY = 'ti_ai_calls';

interface StoredCalls {
  date: string;   // YYYY-MM-DD
  count: number;
}

export const AIProvider_: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {

  // Load persisted config
  const [provider, setProviderState] = useState<AIProvider>(() => {
    try {
      const s = safeStorage.getItem(STORAGE_KEY);
      return s ? JSON.parse(s).provider || 'GEMINI' : 'GEMINI';
    } catch { return 'GEMINI'; }
  });

  const [mode, setModeState] = useState<AIMode>(() => {
    try {
      const s = safeStorage.getItem(STORAGE_KEY);
      return s ? JSON.parse(s).mode || 'ADVANCED' : 'ADVANCED';
    } catch { return 'ADVANCED'; }
  });

  const [apiKey, setApiKeyState] = useState<string>(() => {
    try {
      const s = safeStorage.getItem(STORAGE_KEY);
      return s ? JSON.parse(s).apiKey || '' : '';
    } catch { return ''; }
  });

  const [dailyBudget, setDailyBudgetState] = useState<number>(() => {
    try {
      const s = safeStorage.getItem(STORAGE_KEY);
      return s ? JSON.parse(s).dailyBudget || 50 : 50;
    } catch { return 50; }
  });

  const [isPaused, setIsPausedState] = useState(() => {
    try {
      const s = safeStorage.getItem(STORAGE_KEY);
      return s ? JSON.parse(s).isPaused || false : false;
    } catch { return false; }
  });

  // Load today's call count
  const [dailyCalls, setDailyCalls] = useState<number>(() => {
    try {
      const s = safeStorage.getItem(CALLS_KEY);
      if (!s) return 0;
      const stored: StoredCalls = JSON.parse(s);
      const today = new Date().toISOString().slice(0, 10);
      return stored.date === today ? stored.count : 0;
    } catch { return 0; }
  });

  const [callsThisSession, setCallsThisSession] = useState(0);
  const [lastError, setLastError] = useState<string | null>(null);
  const [quotaExhausted, setQuotaExhausted] = useState(false);
  const [lastCallAt, setLastCallAt] = useState<number | null>(null);

  // Derive status
  const status: AIStatus = (() => {
    if (provider === 'NONE') return 'OFFLINE';
    if (quotaExhausted) return 'EXHAUSTED';
    const pct = dailyBudget > 0 ? dailyCalls / dailyBudget : 0;
    if (pct >= 0.90) return 'CRITICAL';
    if (pct >= 0.70) return 'WARNING';
    return 'OK';
  })();

  // Persist config on change
  useEffect(() => {
    safeStorage.setItem(STORAGE_KEY, JSON.stringify({
      provider, mode, apiKey, dailyBudget, isPaused
    }));
  }, [provider, mode, apiKey, dailyBudget, isPaused]);

  // Persist call count
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    safeStorage.setItem(CALLS_KEY, JSON.stringify({
      date: today,
      count: dailyCalls
    }));
  }, [dailyCalls]);

  // Auto-reset at midnight
  useEffect(() => {
    const checkMidnight = () => {
      try {
        const s = safeStorage.getItem(CALLS_KEY);
        if (!s) return;
        const stored: StoredCalls = JSON.parse(s);
        const today = new Date().toISOString().slice(0, 10);
        if (stored.date !== today) {
          setDailyCalls(0);
          setQuotaExhausted(false);
        }
      } catch {}
    };
    const interval = setInterval(checkMidnight, 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Fire window event when status changes
  const prevStatus = useRef<AIStatus>('OK');
  useEffect(() => {
    if (status !== prevStatus.current) {
      window.dispatchEvent(new CustomEvent('ai:status:change', {
        detail: { status, dailyCalls, dailyBudget }
      }));
      prevStatus.current = status;
    }
  }, [status, dailyCalls, dailyBudget]);

  // ── Actions ────────────────────────────────────────────────

  const setProvider = useCallback((p: AIProvider) => {
    setProviderState(p);
    // Reset quota when switching provider
    setQuotaExhausted(false);
    setLastError(null);
  }, []);

  const setMode = useCallback((m: AIMode) => {
    setModeState(m);
  }, []);

  const setApiKey = useCallback((k: string) => {
    setApiKeyState(k);
  }, []);

  const setDailyBudget = useCallback((n: number) => {
    setDailyBudgetState(Math.max(1, Math.min(500, n)));
  }, []);

  const setIsPaused = useCallback((b: boolean) => {
    setIsPausedState(b);
  }, []);

  const recordCall = useCallback(() => {
    setDailyCalls(prev => prev + 1);
    setCallsThisSession(prev => prev + 1);
    setLastCallAt(Date.now());
  }, []);

  const recordError = useCallback((err: string) => {
    setLastError(err);
  }, []);

  const recordQuotaExhausted = useCallback(() => {
    setQuotaExhausted(true);
    setLastError('API quota exhausted. Switch model or wait until tomorrow.');
    window.dispatchEvent(new CustomEvent('ai:quota:exhausted'));
  }, []);

  const resetDailyCalls = useCallback(() => {
    setDailyCalls(0);
    setCallsThisSession(0);
    setQuotaExhausted(false);
    setLastError(null);
  }, []);

  const clearError = useCallback(() => {
    setLastError(null);
  }, []);

  // ── Permission check ───────────────────────────────────────
  // Call this before every AI request
  const canCallAI = useCallback((fromUserAction = false): boolean => {
    if (isPaused) return false;
    if (provider === 'NONE') return false;
    if (quotaExhausted) return false;
    if (dailyBudget > 0 && dailyCalls >= dailyBudget) return false;
    return true;
  }, [isPaused, provider, quotaExhausted, dailyCalls, dailyBudget]);

  return (
    <AIContext.Provider value={{
      provider, mode, apiKey, dailyBudget,
      status, dailyCalls, callsThisSession,
      lastError, quotaExhausted, lastCallAt,
      isPaused,
      setProvider, setMode, setApiKey, setDailyBudget, setIsPaused,
      recordCall, recordError, recordQuotaExhausted,
      resetDailyCalls, clearError, canCallAI,
    }}>
      {children}
    </AIContext.Provider>
  );
};

export const useAI = () => {
  const ctx = useContext(AIContext);
  if (!ctx) throw new Error('useAI must be inside AIProvider_');
  return ctx;
};
