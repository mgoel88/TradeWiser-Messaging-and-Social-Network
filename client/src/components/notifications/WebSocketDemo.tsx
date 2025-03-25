import React, { useState, useEffect } from 'react';
import { useWebSocket } from '@/hooks/use-websocket';
import { usePriceUpdatesStore } from '@/stores/price-updates-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Info, Bell, RotateCw } from 'lucide-react';

export function WebSocketDemo() {
  const { status, connect, disconnect, send } = useWebSocket();
  const [messages, setMessages] = useState<any[]>([]);
  const [lastMessage, setLastMessage] = useState<any>(null);
  const addPriceUpdate = usePriceUpdatesStore((state) => state.addPriceUpdate);
  const recentUpdates = usePriceUpdatesStore((state) => state.recentUpdates);
  
  // Monitor WebSocket messages
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const data = JSON.parse(event.data);
      setLastMessage(data);
    };
    
    // Add event listener for WebSocket messages
    window.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'websocket_message') {
        handleMessage(event.data.payload);
      }
    });
    
    return () => {
      window.removeEventListener('message', (event) => {
        if (event.data && event.data.type === 'websocket_message') {
          handleMessage(event.data.payload);
        }
      });
    };
  }, []);

  useEffect(() => {
    if (lastMessage) {
      setMessages((prev) => [lastMessage, ...prev].slice(0, 20));
      
      // Handle price updates
      if (lastMessage.type === 'price_update') {
        addPriceUpdate({
          commodityId: lastMessage.commodityId,
          circleId: lastMessage.circleId,
          timestamp: lastMessage.timestamp,
          price: lastMessage.newPrice,
          priceChange: lastMessage.priceChange,
          changePercentage: lastMessage.changePercentage,
          changeDirection: lastMessage.changeDirection,
          quality: lastMessage.quality,
          arrivals: lastMessage.arrivals
        });
      }
    }
  }, [lastMessage, addPriceUpdate]);

  const getStatusColor = () => {
    switch (status) {
      case 'open':
        return 'bg-green-500';
      case 'connecting':
        return 'bg-yellow-500';
      case 'closed':
      case 'closing':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Real-Time Market Data</CardTitle>
          <div className="flex items-center space-x-2">
            <div className={`h-3 w-3 rounded-full ${getStatusColor()}`} />
            <span className="text-sm font-medium">
              {status === 'open' ? 'Connected' : 
               status === 'connecting' ? 'Connecting...' : 
               'Disconnected'}
            </span>
          </div>
        </div>
        <CardDescription>
          Live market data and notifications from your circles and commodities
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col space-y-4">
          {status !== 'open' && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Connection Lost</AlertTitle>
              <AlertDescription>
                You're not receiving real-time market updates. Try reconnecting or check your internet connection.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <h3 className="text-sm font-medium">Recent Price Updates</h3>
            {recentUpdates.length > 0 ? (
              <ScrollArea className="h-[200px]">
                <div className="space-y-2">
                  {recentUpdates.slice(0, 5).map((update, idx) => (
                    <div key={idx} className="flex items-center justify-between rounded-md border p-3">
                      <div>
                        <div className="font-medium">Commodity ID: {update.commodityId}</div>
                        <div className="text-sm text-muted-foreground">
                          Circle: {update.circleId} • {new Date(update.timestamp).toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-right font-bold">₹{update.price.toLocaleString()}</div>
                        <div className={`text-sm ${
                          update.changeDirection === 'up' ? 'text-green-600' : 
                          update.changeDirection === 'down' ? 'text-red-600' : 'text-muted-foreground'
                        }`}>
                          {update.changeDirection === 'up' ? '↑' : 
                           update.changeDirection === 'down' ? '↓' : '→'} 
                          {update.priceChange.toFixed(2)} ({update.changePercentage.toFixed(2)}%)
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="flex h-[200px] items-center justify-center rounded-md border border-dashed">
                <div className="text-center">
                  <Info className="mx-auto h-8 w-8 text-muted-foreground" />
                  <h3 className="mt-2 text-sm font-medium">No price updates yet</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Connect to start receiving real-time price updates
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium">Raw Message Log</h3>
            <ScrollArea className="h-[150px] rounded-md border">
              <div className="p-4 space-y-2">
                {messages.length > 0 ? messages.map((msg, idx) => (
                  <div key={idx} className="text-xs font-mono border-b pb-2">
                    <div className="flex items-center">
                      <Badge variant="outline" className="mr-2">
                        {msg.type}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <pre className="mt-1 overflow-x-auto whitespace-pre-wrap">
                      {JSON.stringify(msg, null, 2)}
                    </pre>
                  </div>
                )) : (
                  <div className="flex h-24 items-center justify-center text-sm text-muted-foreground">
                    No messages received
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button 
          variant="outline"
          onClick={disconnect}
          disabled={status !== 'open'}>
          Disconnect
        </Button>
        <Button 
          onClick={connect} 
          disabled={status === 'open' || status === 'connecting'}
          className="flex items-center">
          <RotateCw className="mr-2 h-4 w-4" />
          Reconnect
        </Button>
      </CardFooter>
    </Card>
  );
}