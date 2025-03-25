import { useEffect, useState, useRef, useCallback } from 'react';
import { useToast } from './use-toast';
import { usePriceUpdatesStore, PriceData } from '@/stores/price-updates-store';

export enum WebSocketStatus {
  CONNECTING = 'connecting',
  OPEN = 'open',
  CLOSING = 'closing',
  CLOSED = 'closed'
}

interface WebSocketMessage {
  type: string;
  timestamp: string;
  [key: string]: any;
}

interface PriceUpdateMessage extends WebSocketMessage {
  type: 'price_update';
  commodityId: number;
  circleId: number;
  newPrice: number;
  priceChange: number;
  changePercentage: number;
  changeDirection: 'up' | 'down' | 'stable';
  quality?: string;
  arrivals?: string;
}

export function useWebSocket() {
  const [status, setStatus] = useState<WebSocketStatus>(WebSocketStatus.CLOSED);
  const socketRef = useRef<WebSocket | null>(null);
  const { toast } = useToast();
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const connect = useCallback(() => {
    if (socketRef.current && 
        (socketRef.current.readyState === WebSocket.OPEN || 
         socketRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }
    
    try {
      setStatus(WebSocketStatus.CONNECTING);
      
      // Determine the WebSocket URL based on the current environment
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      const socket = new WebSocket(wsUrl);
      socketRef.current = socket;
      
      socket.onopen = () => {
        setStatus(WebSocketStatus.OPEN);
        console.log('WebSocket connection established');
        
        // Send initial connection message with user data if available
        const userJson = localStorage.getItem('user');
        if (userJson) {
          try {
            const user = JSON.parse(userJson);
            socket.send(JSON.stringify({
              type: 'connect',
              userId: user.id,
              timestamp: new Date().toISOString()
            }));
          } catch (error) {
            console.error('Failed to parse user data from localStorage', error);
          }
        }
      };
      
      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as WebSocketMessage;
          handleMessage(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message', error);
        }
      };
      
      socket.onclose = () => {
        setStatus(WebSocketStatus.CLOSED);
        console.log('WebSocket connection closed');
        
        // Attempt to reconnect after a delay
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 5000); // Try to reconnect after 5 seconds
      };
      
      socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        // Close the socket on error to trigger reconnect
        socket.close();
      };
    } catch (error) {
      console.error('Failed to establish WebSocket connection', error);
      setStatus(WebSocketStatus.CLOSED);
    }
  }, []);
  
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      setStatus(WebSocketStatus.CLOSING);
      socketRef.current.close();
      socketRef.current = null;
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);
  
  const send = useCallback((data: any) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(data));
    } else {
      console.error('Cannot send message, WebSocket is not open');
    }
  }, []);
  
  const handleMessage = (message: WebSocketMessage) => {
    console.log('Received WebSocket message:', message);
    
    // Get priceUpdatesStore's addPriceUpdate function
    const addPriceUpdate = usePriceUpdatesStore.getState().addPriceUpdate;
    
    // Handle different message types
    switch (message.type) {
      case 'notification':
        toast({
          title: message.title,
          description: message.message,
          variant: message.priority === 'high' ? 'destructive' : 
                  message.priority === 'medium' ? 'default' : null
        });
        break;
        
      case 'price_update':
        // Convert WebSocket message to our PriceData format
        const priceUpdateMsg = message as PriceUpdateMessage;
        const priceData: PriceData = {
          commodityId: priceUpdateMsg.commodityId,
          circleId: priceUpdateMsg.circleId,
          timestamp: priceUpdateMsg.timestamp,
          price: priceUpdateMsg.newPrice,
          priceChange: priceUpdateMsg.priceChange,
          changePercentage: priceUpdateMsg.changePercentage,
          changeDirection: priceUpdateMsg.changeDirection,
          quality: priceUpdateMsg.quality,
          arrivals: priceUpdateMsg.arrivals
        };
        
        // Update the store with the new price data
        addPriceUpdate(priceData);
        
        // Show toast notification for price change
        const priceChangeText = priceData.priceChange > 0 
          ? `+₹${priceData.priceChange}` 
          : `-₹${Math.abs(priceData.priceChange)}`;
          
        const description = `${priceData.changeDirection === 'up' ? '📈' : priceData.changeDirection === 'down' ? '📉' : '➡️'} ₹${priceData.price} (${priceChangeText}) - ${priceData.changePercentage.toFixed(2)}%`;
        
        toast({
          title: `Price update for commodity #${priceData.commodityId}`,
          description,
          variant: priceData.changeDirection === 'up' ? 'default' : 
                 priceData.changeDirection === 'down' ? 'destructive' : null
        });
        break;
        
      case 'listing_update':
        // Handle listing updates
        toast({
          title: `New ${message.listingType} listing`,
          description: `A new ${message.listingType} listing has been posted for circle #${message.circleId}`,
          variant: 'default'
        });
        break;
        
      case 'offer_received':
        // Handle offer received
        toast({
          title: 'New offer received',
          description: `You've received an offer for ${message.quantity} units at ₹${message.pricePerUnit} per unit`,
          variant: 'default'
        });
        break;
        
      case 'trade_update':
        // Handle trade status updates
        toast({
          title: 'Trade update',
          description: `Trade #${message.tradeId} status changed to ${message.status}`,
          variant: message.status === 'completed' ? 'default' : 
                  message.status === 'cancelled' ? 'destructive' : null
        });
        break;
        
      case 'circle_update':
        // Handle circle updates
        toast({
          title: `Circle #${message.circleId} update`,
          description: `${message.updateType} - ${JSON.stringify(message.data)}`,
          variant: 'default'
        });
        break;
        
      default:
        console.log('Unhandled message type:', message.type);
    }
  };
  
  // Connect on component mount and disconnect on unmount
  useEffect(() => {
    connect();
    
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);
  
  return {
    status,
    connect,
    disconnect,
    send
  };
}