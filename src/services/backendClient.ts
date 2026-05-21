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
