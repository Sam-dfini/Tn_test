import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { connectBackendWebSocket } from '../services/backendClient';

interface WebSocketContextType {
  isConnected: boolean;
  lastMessage: any;
  sendMessage: (msg: any) => void;
}

const WebSocketContext = createContext<WebSocketContextType>({
  isConnected: false,
  lastMessage: null,
  sendMessage: () => {},
});

export const useWebSocket = () => useContext(WebSocketContext);

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<any>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const ws = connectBackendWebSocket((type, payload) => {
      setLastMessage({ type, payload });
      window.dispatchEvent(new CustomEvent(`ti:${type}`, { detail: payload }));
    });

    if (ws) {
      ws.addEventListener('open', () => setIsConnected(true));
      ws.addEventListener('close', () => setIsConnected(false));
      wsRef.current = ws;
    }

    return () => {
      wsRef.current?.close();
    };
  }, []);

  const sendMessage = useCallback((msg: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  return (
    <WebSocketContext.Provider value={{ isConnected, lastMessage, sendMessage }}>
      {children}
    </WebSocketContext.Provider>
  );
};

