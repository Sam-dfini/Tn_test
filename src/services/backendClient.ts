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
