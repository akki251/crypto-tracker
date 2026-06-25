import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { wsManager, type WebSocketManager } from '../services/websocket';
import type { ConnectionStatus } from '../types';

interface WebSocketContextValue {
  manager: WebSocketManager;
  status: ConnectionStatus;
}

const WebSocketContext = createContext<WebSocketContextValue | null>(null);

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<ConnectionStatus>(wsManager.getStatus());

  useEffect(() => {
    const unsubscribe = wsManager.onStatusChange(setStatus);
    wsManager.connect();

    return () => {
      unsubscribe();
      wsManager.disconnect();
    };
  }, []);

  return (
    <WebSocketContext.Provider value={{ manager: wsManager, status }}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocketContext(): WebSocketContextValue {
  const ctx = useContext(WebSocketContext);
  if (!ctx) {
    throw new Error('useWebSocketContext must be used within a WebSocketProvider');
  }
  return ctx;
}
