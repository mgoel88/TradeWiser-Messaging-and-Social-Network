import React, { useEffect } from 'react';
import { useWebSocket } from '@/hooks/use-websocket';
import { toast } from '@/hooks/use-toast';
import { Bell, AlertCircle, TrendingUp, HandshakeIcon } from 'lucide-react';

export function WebSocketDemo() {
  const { connected, lastMessage, reconnect } = useWebSocket();

  useEffect(() => {
    if (!connected) {
      // Attempt to reconnect every 5 seconds if disconnected
      const reconnectInterval = setInterval(() => {
        reconnect();
      }, 5000);

      return () => clearInterval(reconnectInterval);
    }
  }, [connected, reconnect]);

  useEffect(() => {
    if (lastMessage) {
      const data = JSON.parse(lastMessage.data);

      switch (data.type) {
        case 'price_update':
          toast({
            title: 'Price Update',
            description: data.message,
            icon: <TrendingUp className="text-green-500" />
          });
          break;

        case 'trade_alert':
          toast({
            title: 'Trade Alert',
            description: data.message,
            icon: <HandshakeIcon className="text-blue-500" />
          });
          break;

        case 'market_alert':
          toast({
            title: 'Market Alert',
            description: data.message,
            icon: <AlertCircle className="text-red-500" />
          });
          break;

        default:
          toast({
            title: data.title,
            description: data.message,
            icon: <Bell />
          });
      }
    }
  }, [lastMessage]);

  return (
    <div className="fixed bottom-4 right-4">
      <div className={`h-3 w-3 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
    </div>
  );
}