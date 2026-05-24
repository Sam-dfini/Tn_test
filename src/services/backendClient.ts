import { io, Socket } from 'socket.io-client';

export const checkBackendHealth = async () => {
  try {
    const response = await fetch('/api/health');
    return response.ok;
  } catch (error) {
    return false;
  }
};

export const connectBackendWebSocket = (onEvent: (type: string, payload: any) => void) => {
  const socket: Socket = io(window.location.origin, {
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 2000,
  });

  socket.on('intel_event', (data: any) => {
    onEvent(data.type, data.payload);
  });

  socket.on('disconnect', () => {
    setTimeout(() => {
      if (!socket.connected) {
        socket.connect();
      }
    }, 2000);
  });

  return {
    addEventListener: (event: string, callback: () => void) => {
      if (event === 'open') {
        socket.on('connect', callback);
        if (socket.connected) callback();
      } else if (event === 'close') {
        socket.on('disconnect', callback);
      }
    },
    close: () => {
      socket.disconnect();
    },
    send: (msg: string) => {
      socket.emit('message', JSON.parse(msg));
    },
    get readyState() {
      return socket.connected ? 1 : 0;
    },
  } as any;
};

export const runIntelligenceLoop = async () => {
  console.log('Intelligence loop triggered');
  return true;
};

export const syncActiveSignals = async (signals: any[]) => {
  try {
    const response = await fetch('/api/state/active-shocks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shocks: signals }),
    });
    return response.ok;
  } catch {
    return false;
  }
};

export const runDeliberation = async (scenario: string, triggerType = 'analyst') => {
  try {
    const response = await fetch('/api/deliberation/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario, trigger_type: triggerType }),
    });
    return response.ok ? await response.json() : null;
  } catch {
    return null;
  }
};

export const fetchDeliberationSessions = async (limit = 10) => {
  try {
    const response = await fetch(`/api/deliberation/sessions?limit=${limit}`);
    return response.ok ? await response.json() : [];
  } catch {
    return [];
  }
};

export const fetchLatestDeliberation = async () => {
  try {
    const response = await fetch('/api/deliberation/sessions/latest');
    if (!response.ok) return null;
    const data = await response.json();
    return data.status === 'no_sessions_yet' ? null : data;
  } catch {
    return null;
  }
};

// ── Simulation Chamber API ────────────────────────────────────────────

export const runSimulation = async (params: {
  scenario_id?: string;
  custom_scenario?: any;
  base_state_version_id?: string;
  mc_iterations?: number;
  time_horizon_days?: number;
  time_step_days?: number;
  counterfactual_of?: string;
}) => {
  try {
    const query = new URLSearchParams();
    if (params.scenario_id) query.set('scenario_id', params.scenario_id);
    if (params.base_state_version_id) query.set('base_state_version_id', params.base_state_version_id);
    if (params.mc_iterations) query.set('mc_iterations', String(params.mc_iterations));
    if (params.time_horizon_days) query.set('time_horizon_days', String(params.time_horizon_days));
    if (params.time_step_days) query.set('time_step_days', String(params.time_step_days));
    if (params.counterfactual_of) query.set('counterfactual_of', params.counterfactual_of);
    const url = `/api/simulation/run${query.toString() ? '?' + query.toString() : ''}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: params.custom_scenario ? JSON.stringify({ custom_scenario: params.custom_scenario }) : undefined,
    });
    return response.ok ? await response.json() : null;
  } catch {
    return null;
  }
};

export const fetchSimulationRuns = async (limit = 10) => {
  try {
    const response = await fetch(`/api/simulation/runs?limit=${limit}`);
    return response.ok ? await response.json() : [];
  } catch {
    return [];
  }
};

export const fetchSimulationRun = async (runId: string) => {
  try {
    const response = await fetch(`/api/simulation/runs/${runId}`);
    return response.ok ? await response.json() : null;
  } catch {
    return null;
  }
};

export const fetchSimulationScenarios = async (typeFilter?: string) => {
  try {
    const url = typeFilter
      ? `/api/simulation/scenarios?type=${encodeURIComponent(typeFilter)}`
      : '/api/simulation/scenarios';
    const response = await fetch(url);
    return response.ok ? await response.json() : [];
  } catch {
    return [];
  }
};

export const compareSimulationRuns = async (runA: string, runB: string) => {
  try {
    const response = await fetch(`/api/simulation/compare?run_a=${runA}&run_b=${runB}`);
    return response.ok ? await response.json() : null;
  } catch {
    return null;
  }
};

// ── Cognitive Workspace API (Phase 9) ─────────────────────────────────

export const createInvestigation = async (title?: string) => {
  try {
    const response = await fetch('/api/workspace/investigations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    });
    return response.ok ? await response.json() : null;
  } catch {
    return null;
  }
};

export const fetchInvestigations = async (userId?: string) => {
  try {
    const url = userId ? `/api/workspace/investigations?user_id=${userId}` : '/api/workspace/investigations';
    const response = await fetch(url);
    return response.ok ? await response.json() : [];
  } catch {
    return [];
  }
};

export const fetchInvestigation = async (investigationId: string) => {
  try {
    const response = await fetch(`/api/workspace/investigations/${investigationId}`);
    return response.ok ? await response.json() : null;
  } catch {
    return null;
  }
};

export const queryInvestigation = async (investigationId: string, query: string) => {
  try {
    const response = await fetch(`/api/workspace/investigations/${investigationId}/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });
    return response.ok ? await response.json() : null;
  } catch {
    return null;
  }
};

export const queryInvestigationStream = (
  investigationId: string,
  query: string,
  onToken: (token: string) => void,
  onComplete: (envelope: any) => void,
  onError?: (error: string) => void,
) => {
  const controller = new AbortController();

  fetch(`/api/workspace/investigations/${investigationId}/query/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
    signal: controller.signal,
  }).then(async (response) => {
    if (!response.ok) {
      onError?.(`HTTP ${response.status}`);
      return;
    }
    const reader = response.body?.getReader();
    if (!reader) {
      onError?.('No response body');
      return;
    }
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim();
          if (data === '[DONE]') continue;
          try {
            const parsed = JSON.parse(data);
            if (parsed.type === 'narrative_token') {
              onToken(parsed.token);
            } else if (parsed.type === 'complete') {
              onComplete(parsed.envelope);
            }
          } catch {
            // skip malformed lines
          }
        }
      }
    }
  }).catch((err) => {
    if (err.name !== 'AbortError') {
      onError?.(err.message);
    }
  });

  return controller;
};

export const fetchMessages = async (investigationId: string) => {
  try {
    const response = await fetch(`/api/workspace/investigations/${investigationId}/messages`);
    return response.ok ? await response.json() : [];
  } catch {
    return [];
  }
};

export const fetchBlockRegistry = async () => {
  try {
    const response = await fetch('/api/workspace/blocks');
    return response.ok ? await response.json() : [];
  } catch {
    return [];
  }
};

export const runQuickMacro = async (macro: string) => {
  try {
    const response = await fetch('/api/workspace/quick', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ macro }),
    });
    return response.ok ? await response.json() : null;
  } catch {
    return null;
  }
};

export const addWatchlistItem = async (investigationId: string, type: string, id: string, threshold = 0.7) => {
  try {
    const response = await fetch(`/api/workspace/investigations/${investigationId}/watchlist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, id, threshold }),
    });
    return response.ok ? await response.json() : null;
  } catch {
    return null;
  }
};

export const exportInvestigation = async (investigationId: string) => {
  try {
    const response = await fetch(`/api/workspace/investigations/${investigationId}/export`, {
      method: 'POST',
    });
    return response.ok ? await response.json() : null;
  } catch {
    return null;
  }
};

// ── Intervention Engine API (Phase 10) ────────────────────────────────────

export const runInterventionAnalysis = async (
  targetOutcome: string,
  opts: { investigationId?: string; timeHorizonDays?: number; interventionIds?: string[]; topN?: number } = {}
) => {
  try {
    const response = await fetch('/api/interventions/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        target_outcome: targetOutcome,
        investigation_id: opts.investigationId,
        time_horizon_days: opts.timeHorizonDays ?? 30,
        intervention_ids: opts.interventionIds,
        top_n: opts.topN ?? 5,
      }),
    });
    return response.ok ? await response.json() : null;
  } catch {
    return null;
  }
};

export const fetchInterventionLibrary = async () => {
  try {
    const response = await fetch('/api/interventions/library');
    return response.ok ? await response.json() : [];
  } catch {
    return [];
  }
};

export const fetchInterventionById = async (interventionId: string) => {
  try {
    const response = await fetch(`/api/interventions/library/${interventionId}`);
    return response.ok ? await response.json() : null;
  } catch {
    return null;
  }
};

export const testSingleIntervention = async (interventionId: string, timeHorizonDays = 30) => {
  try {
    const response = await fetch('/api/interventions/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ intervention_id: interventionId, time_horizon_days: timeHorizonDays }),
    });
    return response.ok ? await response.json() : null;
  } catch {
    return null;
  }
};

export const fetchLatestInterventionRun = async () => {
  try {
    const response = await fetch('/api/interventions/runs/latest');
    return response.ok ? await response.json() : null;
  } catch {
    return null;
  }
};

export const fetchInterventionRun = async (runId: string) => {
  try {
    const response = await fetch(`/api/interventions/runs/${runId}`);
    return response.ok ? await response.json() : null;
  } catch {
    return null;
  }
};

export const fetchDoctrineStatus = async () => {
  try {
    const response = await fetch('/api/doctrine/status');
    return response.ok ? await response.json() : null;
  } catch {
    return null;
  }
};

export const fetchDoctrineSearch = async (query: string, workspace?: string, limit: number = 5) => {
  try {
    const params = new URLSearchParams({ query, limit: String(limit) });
    if (workspace) params.set('workspace', workspace);
    const response = await fetch(`/api/doctrine/search?${params}`);
    return response.ok ? await response.json() : null;
  } catch {
    return null;
  }
};
