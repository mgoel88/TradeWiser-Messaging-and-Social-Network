import { WebSocketServer, WebSocket } from 'ws';
import { log } from './vite';
import { storage } from './storage';

// Client connections store
interface ConnectedClient {
  userId?: number;
  circles: number[];
  commodities: number[];
  ws: WebSocket;
  lastActivity: Date;
}

const connectedClients: ConnectedClient[] = [];

// Message types for WebSocket communication
export enum MessageType {
  CONNECT = 'connect',
  PRICE_UPDATE = 'price_update',
  LISTING_UPDATE = 'listing_update',
  OFFER_RECEIVED = 'offer_received',
  TRADE_UPDATE = 'trade_update',
  CIRCLE_UPDATE = 'circle_update',
  NOTIFICATION = 'notification'
}

interface BaseMessage {
  type: MessageType;
  timestamp: string;
}

export interface PriceUpdateMessage extends BaseMessage {
  type: MessageType.PRICE_UPDATE;
  commodityId: number;
  circleId: number;
  newPrice: number;
  priceChange: number;
  changePercentage: number;
  changeDirection: 'up' | 'down' | 'stable';
  quality?: string;
  arrivals?: string;
}

export interface ListingUpdateMessage extends BaseMessage {
  type: MessageType.LISTING_UPDATE;
  listingId: number;
  action: 'new' | 'updated' | 'expired' | 'completed';
  commodityId: number;
  circleId: number;
  listingType: 'buy' | 'sell';
}

export interface OfferReceivedMessage extends BaseMessage {
  type: MessageType.OFFER_RECEIVED;
  offerId: number;
  listingId: number;
  buyerId: number;
  sellerId: number;
  commodityId: number;
  quantity: number;
  pricePerUnit: number;
}

export interface TradeUpdateMessage extends BaseMessage {
  type: MessageType.TRADE_UPDATE;
  tradeId: number;
  buyerId: number;
  sellerId: number;
  status: string;
  commodityId: number;
}

export interface CircleUpdateMessage extends BaseMessage {
  type: MessageType.CIRCLE_UPDATE;
  circleId: number;
  updateType: 'market_activity' | 'new_member' | 'event';
  data: any;
}

export interface NotificationMessage extends BaseMessage {
  type: MessageType.NOTIFICATION;
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  link?: string;
  icon?: string;
}

export type WebSocketMessage = 
  | PriceUpdateMessage
  | ListingUpdateMessage
  | OfferReceivedMessage
  | TradeUpdateMessage
  | CircleUpdateMessage
  | NotificationMessage;

// Helper function to send message to a specific user
export function sendMessageToUser(userId: number, message: WebSocketMessage): boolean {
  const userClients = connectedClients.filter(client => client.userId === userId);
  
  if (userClients.length === 0) {
    return false;
  }
  
  userClients.forEach(client => {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(message));
    }
  });
  
  return true;
}

// Helper function to broadcast to all connected clients
export function broadcastMessage(message: WebSocketMessage): void {
  connectedClients.forEach(client => {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(message));
    }
  });
}

// Helper function to broadcast to clients interested in a specific circle
export function broadcastToCircle(circleId: number, message: WebSocketMessage): void {
  connectedClients.forEach(client => {
    if (client.circles.includes(circleId) && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(message));
    }
  });
}

// Helper function to broadcast to clients interested in a specific commodity
export function broadcastToCommodity(commodityId: number, message: WebSocketMessage): void {
  connectedClients.forEach(client => {
    if (client.commodities.includes(commodityId) && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(message));
    }
  });
}

// Helper to simulate price updates (in a real app, this would come from external data sources)
export async function simulatePriceUpdates(): Promise<void> {
  try {
    // Get commodities
    const commodities = await storage.listCommodities();
    
    // Get circles
    const circles = await storage.listCircles();
    
    // For each commodity-circle combination, simulate a price update
    for (const commodity of commodities) {
      for (const circle of circles) {
        // Check if we have connected clients interested in this circle or commodity
        const hasInterestedClients = connectedClients.some(
          client => client.circles.includes(circle.id) || client.commodities.includes(commodity.id)
        );
        
        // Only generate updates if we have interested clients
        if (hasInterestedClients) {
          // Get current price or generate a reasonable one based on commodity type
          const basePrice = commodity.basePrice || 
            (commodity.category === 'grain' ? 2500 : 
             commodity.category === 'pulse' ? 6000 : 
             commodity.category === 'oilseed' ? 4500 : 
             commodity.category === 'spice' ? 12000 : 3000);
          
          // Generate a random price change (-3% to +3%)
          const changePercentage = (Math.random() * 6) - 3;
          const priceChange = Math.round((basePrice * changePercentage) / 100);
          const newPrice = basePrice + priceChange;
          
          // Create price update message
          const message: PriceUpdateMessage = {
            type: MessageType.PRICE_UPDATE,
            timestamp: new Date().toISOString(),
            commodityId: commodity.id,
            circleId: circle.id,
            newPrice,
            priceChange,
            changePercentage,
            changeDirection: priceChange > 0 ? 'up' : priceChange < 0 ? 'down' : 'stable',
            quality: 'Standard',
            arrivals: `${Math.floor(Math.random() * 200) + 50} quintals`
          };
          
          // Broadcast to interested clients
          broadcastToCommodity(commodity.id, message);
          broadcastToCircle(circle.id, message);
        }
      }
    }
  } catch (error) {
    log(`Error generating price updates: ${error}`, 'websocket');
  }
}

// Setup interval for periodic price updates (every 30 seconds)
let priceUpdateInterval: NodeJS.Timeout | null = null;

// Setup WebSocket server
export function setupWebsocketServer(wss: WebSocketServer): void {
  log('WebSocket server initialized', 'websocket');
  
  wss.on('connection', (ws) => {
    log('Client connected', 'websocket');
    
    // Add to connected clients with no user ID yet
    const newClient: ConnectedClient = {
      circles: [],
      commodities: [],
      ws,
      lastActivity: new Date()
    };
    
    connectedClients.push(newClient);
    
    // Handle messages from client
    ws.on('message', async (message) => {
      try {
        const parsed = JSON.parse(message.toString());
        
        // Update last activity timestamp
        newClient.lastActivity = new Date();
        
        if (parsed.type === MessageType.CONNECT) {
          // Handle authentication and subscription preferences
          if (parsed.userId) {
            newClient.userId = parsed.userId;
            
            // Load user's circles
            if (parsed.userId) {
              const userCircles = await storage.listUserCircles(parsed.userId);
              newClient.circles = userCircles.map(uc => uc.circleId);
              
              // Load user's commodities of interest
              const userCommodities = await storage.listUserCommodities(parsed.userId);
              newClient.commodities = userCommodities.map(uc => uc.commodityId);
              
              log(`User ${parsed.userId} connected with ${newClient.circles.length} circles and ${newClient.commodities.length} commodities`, 'websocket');
            }
          }
          
          // If explicit subscriptions are provided, use those
          if (parsed.circles && Array.isArray(parsed.circles)) {
            newClient.circles = parsed.circles;
          }
          
          if (parsed.commodities && Array.isArray(parsed.commodities)) {
            newClient.commodities = parsed.commodities;
          }
          
          // Send confirmation
          ws.send(JSON.stringify({
            type: MessageType.NOTIFICATION,
            timestamp: new Date().toISOString(),
            title: 'Connected',
            message: 'You are now connected to real-time updates',
            priority: 'low'
          }));
          
          // Start price update interval if not already started
          if (!priceUpdateInterval) {
            priceUpdateInterval = setInterval(simulatePriceUpdates, 30000);
            // Initial update
            simulatePriceUpdates();
          }
        }
      } catch (error) {
        log(`Error processing message: ${error}`, 'websocket');
      }
    });
    
    // Handle disconnection
    ws.on('close', () => {
      const index = connectedClients.indexOf(newClient);
      if (index !== -1) {
        connectedClients.splice(index, 1);
        log(`Client disconnected, ${connectedClients.length} remaining`, 'websocket');
      }
      
      // If no more clients, clear the price update interval
      if (connectedClients.length === 0 && priceUpdateInterval) {
        clearInterval(priceUpdateInterval);
        priceUpdateInterval = null;
      }
    });
    
    // Send welcome message
    ws.send(JSON.stringify({
      type: MessageType.NOTIFICATION,
      timestamp: new Date().toISOString(),
      title: 'Welcome',
      message: 'Welcome to WizXConnect real-time updates! Send a connect message to start receiving updates.',
      priority: 'medium'
    }));
  });
  
  // Setup an interval to clean up stale connections
  setInterval(() => {
    const now = new Date();
    const staleThreshold = new Date(now.getTime() - 5 * 60 * 1000); // 5 minutes
    
    // Find and remove stale connections
    connectedClients.forEach((client, index) => {
      if (client.lastActivity < staleThreshold) {
        if (client.ws.readyState === WebSocket.OPEN) {
          client.ws.close();
        }
        connectedClients.splice(index, 1);
        log('Removed stale connection', 'websocket');
      }
    });
  }, 60000); // Check every minute
}

// Create a function to send notification about new marketplace listing
export function notifyNewListing(listing: any): void {
  try {
    // Notify users in the same circle about the new listing
    const message: ListingUpdateMessage = {
      type: MessageType.LISTING_UPDATE,
      timestamp: new Date().toISOString(),
      listingId: listing.id,
      action: 'new',
      commodityId: listing.commodityId,
      circleId: listing.circleId,
      listingType: listing.listingType
    };
    
    broadcastToCircle(listing.circleId, message);
    broadcastToCommodity(listing.commodityId, message);
    
    log(`Broadcasted new listing notification for listing ${listing.id}`, 'websocket');
  } catch (error) {
    log(`Error sending new listing notification: ${error}`, 'websocket');
  }
}

// Create a function to send notification about received offer
export function notifyOfferReceived(offer: any): void {
  try {
    // Send notification to seller
    const message: OfferReceivedMessage = {
      type: MessageType.OFFER_RECEIVED,
      timestamp: new Date().toISOString(),
      offerId: offer.id,
      listingId: offer.listingId,
      buyerId: offer.buyerId,
      sellerId: offer.sellerId,
      commodityId: offer.commodityId,
      quantity: offer.quantity,
      pricePerUnit: offer.pricePerUnit
    };
    
    sendMessageToUser(offer.sellerId, message);
    
    log(`Sent offer notification to seller ${offer.sellerId} for offer ${offer.id}`, 'websocket');
  } catch (error) {
    log(`Error sending offer notification: ${error}`, 'websocket');
  }
}

// Create a function to send notification about trade status update
export function notifyTradeUpdate(trade: any): void {
  try {
    // Send notification to both buyer and seller
    const message: TradeUpdateMessage = {
      type: MessageType.TRADE_UPDATE,
      timestamp: new Date().toISOString(),
      tradeId: trade.id,
      buyerId: trade.buyerId,
      sellerId: trade.sellerId,
      status: trade.status,
      commodityId: trade.commodityId
    };
    
    sendMessageToUser(trade.buyerId, message);
    sendMessageToUser(trade.sellerId, message);
    
    log(`Sent trade update notifications for trade ${trade.id}`, 'websocket');
  } catch (error) {
    log(`Error sending trade update notification: ${error}`, 'websocket');
  }
}