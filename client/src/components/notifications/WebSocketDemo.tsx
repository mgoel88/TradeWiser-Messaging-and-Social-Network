import React, { useState, useEffect } from 'react';
import { useWebSocket } from '@/hooks/use-websocket';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowUp, ArrowDown, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RotateCw } from 'lucide-react';

interface PriceUpdate {
  commodityId: number;
  newPrice: number;
  priceChange: number;
  changeDirection: 'up' | 'down' | 'stable';
}

interface TradeUpdate {
  tradeId: number;
  status: string;
  commodityId: number;
}

export function WebSocketDemo() {
  const [priceUpdates, setPriceUpdates] = useState<PriceUpdate[]>([]);
  const [tradeUpdates, setTradeUpdates] = useState<TradeUpdate[]>([]);
  const { status, connect, disconnect } = useWebSocket();

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const data = JSON.parse(event.data);
      if (data.type === 'price_update') {
        setPriceUpdates((prev) => [
          ...prev,
          {
            commodityId: data.commodityId,
            newPrice: data.newPrice,
            priceChange: data.priceChange,
            changeDirection: data.changeDirection,
          },
        ]);
      } else if (data.type === 'trade_update') {
        setTradeUpdates((prev) => [...prev, { tradeId: data.tradeId, status: data.status, commodityId: data.commodityId }]);
      }
    };

    // Add event listener for WebSocket messages (modified to directly handle JSON)
    window.addEventListener('message', (event) => {
      if (event.data && typeof event.data === 'string') {
        try {
          const messageData = JSON.parse(event.data);
          if (messageData.type === 'price_update' || messageData.type === 'trade_update') {
            handleMessage(event); // Pass event directly to handleMessage
          }
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      }
    });

    return () => {
        window.removeEventListener('message', (event) => {
          if (event.data && typeof event.data === 'string') {
            try {
              const messageData = JSON.parse(event.data);
              if (messageData.type === 'price_update' || messageData.type === 'trade_update') {
                  handleMessage(event); // Pass event directly to handleMessage
              }
            } catch (error) {
              console.error("Error parsing WebSocket message:", error);
            }
          }
        });
    };
  }, []);

  useEffect(() => {
    if (status === 'disconnected') {
      connect();
    }

    return () => {
      if (status === 'connected') {
        disconnect();
      }
    };
  }, [status, connect, disconnect]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Live Market Updates</CardTitle>
          <Badge variant={status === 'connected' ? 'success' : 'destructive'}>
            {status === 'connected' ? 'Connected' : 'Disconnected'}
          </Badge>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            <div className="space-y-2">
              {priceUpdates.map((update, i) => (
                <div key={i} className="flex items-center justify-between p-2 border rounded">
                  <span>Commodity #{update.commodityId}</span>
                  <div className="flex items-center">
                    <span className="font-mono">₹{update.newPrice}</span>
                    {update.changeDirection === 'up' ? (
                      <ArrowUp className="h-4 w-4 text-green-500 ml-2" />
                    ) : (
                      <ArrowDown className="h-4 w-4 text-red-500 ml-2" />
                    )}
                  </div>
                </div>
              ))}
              {tradeUpdates.map((update, i) => (
                <div key={i} className="flex items-center justify-between p-2 border rounded bg-muted">
                  <span>Trade #{update.tradeId}</span>
                  <Badge variant="outline">{update.status}</Badge>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
      <div className="flex justify-between">
        <Button variant="outline" onClick={disconnect} disabled={status !== 'connected'}>
          Disconnect
        </Button>
        <Button onClick={connect} disabled={status === 'connected'}>
          <RotateCw className="mr-2 h-4 w-4" />
          Reconnect
        </Button>
      </div>
    </div>
  );
}