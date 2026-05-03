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
