import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

export interface PriceData {
  commodityId: number;
  circleId: number;
  timestamp: string;
  price: number;
  priceChange: number;
  changePercentage: number;
  changeDirection: 'up' | 'down' | 'stable';
  quality?: string;
  arrivals?: string;
}

interface PriceUpdatesState {
  // Store price updates by commodityId -> circleId -> timestamp
  priceUpdates: Record<number, Record<number, PriceData[]>>;
  
  // Current prices by commodity and circle
  currentPrices: Record<number, Record<number, PriceData>>;
  
  // Recent price updates for all commodities (used for notifications feed)
  recentUpdates: PriceData[];
  
  // Actions
  addPriceUpdate: (update: PriceData) => void;
  getCurrentPrice: (commodityId: number, circleId?: number) => PriceData | undefined;
  getPriceHistory: (commodityId: number, circleId: number, limit?: number) => PriceData[];
}

export const usePriceUpdatesStore = create<PriceUpdatesState>()(
  devtools(
    persist(
      (set, get) => ({
        priceUpdates: {},
        currentPrices: {},
        recentUpdates: [],
        
        addPriceUpdate: (update) => set((state) => {
          // Create deep copies to ensure immutability
          const priceUpdates = JSON.parse(JSON.stringify(state.priceUpdates));
          const currentPrices = JSON.parse(JSON.stringify(state.currentPrices));
          const recentUpdates = [...state.recentUpdates];
          
          // Initialize the commodity and circle objects if they don't exist
          if (!priceUpdates[update.commodityId]) {
            priceUpdates[update.commodityId] = {};
          }
          
          if (!priceUpdates[update.commodityId][update.circleId]) {
            priceUpdates[update.commodityId][update.circleId] = [];
          }
          
          if (!currentPrices[update.commodityId]) {
            currentPrices[update.commodityId] = {};
          }
          
          // Add the update to the price history for this commodity and circle
          priceUpdates[update.commodityId][update.circleId].push(update);
          
          // Keep the price history limited to 100 entries per commodity/circle combo
          if (priceUpdates[update.commodityId][update.circleId].length > 100) {
            priceUpdates[update.commodityId][update.circleId] = 
              priceUpdates[update.commodityId][update.circleId].slice(-100);
          }
          
          // Update the current price
          currentPrices[update.commodityId][update.circleId] = update;
          
          // Add to recent updates and limit to 50 entries
          recentUpdates.unshift(update);
          if (recentUpdates.length > 50) {
            recentUpdates.pop();
          }
          
          return { priceUpdates, currentPrices, recentUpdates };
        }),
        
        getCurrentPrice: (commodityId, circleId) => {
          const { currentPrices } = get();
          
          // If no circleId is provided, return the first available current price for this commodity
          if (!circleId) {
            if (!currentPrices[commodityId]) return undefined;
            const circlePrices = currentPrices[commodityId];
            const circleIds = Object.keys(circlePrices);
            return circleIds.length > 0 ? circlePrices[circleIds[0]] : undefined;
          }
          
          // If circleId is provided, return the specific price for that commodity+circle combo
          return currentPrices[commodityId]?.[circleId];
        },
        
        getPriceHistory: (commodityId, circleId, limit = 10) => {
          const { priceUpdates } = get();
          
          if (!priceUpdates[commodityId] || !priceUpdates[commodityId][circleId]) {
            return [];
          }
          
          // Return the most recent 'limit' price updates
          return priceUpdates[commodityId][circleId]
            .slice(0, limit)
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        }
      }),
      {
        name: 'price-updates-storage',
        partialize: (state) => ({
          // Only persist the current prices to local storage, not the full history
          currentPrices: state.currentPrices,
          recentUpdates: state.recentUpdates.slice(0, 10) // Only store 10 most recent
        })
      }
    )
  )
);