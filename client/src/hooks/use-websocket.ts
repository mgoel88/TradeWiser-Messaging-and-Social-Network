import { useEffect, useRef, useState, useCallback } from 'react';

export enum WebSocketStatus {
  CONNECTING = 0,
  OPEN = 1,
  CLOSING = 2,
  CLOSED = 3,
}

export function useWebSocket() {
  const [readyState, setReadyState] = useState<WebSocketStatus>(WebSocketStatus.CLOSED);
  const [lastMessage, setLastMessage] = useState<any>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const getWebSocketUrl = () => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    return `${protocol}//${host}/ws`;
  };

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocketStatus.OPEN) return;

    const ws = new WebSocket(getWebSocketUrl());
    wsRef.current = ws;

    ws.onopen = () => {
      setReadyState(WebSocketStatus.OPEN);
      console.log('WebSocket connected');
    };

    ws.onclose = () => {
      setReadyState(WebSocketStatus.CLOSED);
      setTimeout(connect, 3000); // Reconnect after 3 seconds
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      ws.close();
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setLastMessage(data);
      } catch (err) {
        setLastMessage(event.data);
      }
    };
  }, []);

  useEffect(() => {
    connect();
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  const sendMessage = useCallback((message: any) => {
    if (wsRef.current?.readyState === WebSocketStatus.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  return { lastMessage, sendMessage, readyState };
}