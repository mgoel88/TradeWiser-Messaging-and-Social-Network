import { createContext, useContext, ReactNode } from 'react';
import { useWebSocket, WebSocketStatus } from '@/hooks/use-websocket';

interface NotificationsContextType {
  status: WebSocketStatus;
  connect: () => void;
  disconnect: () => void;
  sendMessage: (data: any) => void;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
}

interface NotificationsProviderProps {
  children: ReactNode;
}

export function NotificationsProvider({ children }: NotificationsProviderProps) {
  const { status, connect, disconnect, send } = useWebSocket();
  
  return (
    <NotificationsContext.Provider
      value={{
        status,
        connect,
        disconnect,
        sendMessage: send
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}