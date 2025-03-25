import { useEffect, useState } from 'react';
import { usePriceUpdatesStore, PriceData } from '@/stores/price-updates-store';

/**
 * Hook to access price updates for a specific commodity and/or circle
 * 
 * @param commodityId The ID of the commodity to get price updates for
 * @param circleId Optional: The ID of the circle to get price updates for
 * @returns Object containing price data and helpers
 */
export function usePriceUpdates(commodityId: number, circleId?: number) {
  // Get current price data from store
  const getCurrentPrice = usePriceUpdatesStore(state => state.getCurrentPrice);
  const getPriceHistory = usePriceUpdatesStore(state => state.getPriceHistory);
  
  // Local state to trigger re-renders when price updates occur
  const [currentPrice, setCurrentPrice] = useState<PriceData | undefined>(
    getCurrentPrice(commodityId, circleId)
  );
  
  const [priceHistory, setPriceHistory] = useState<PriceData[]>(
    circleId ? getPriceHistory(commodityId, circleId) : []
  );
  
  // Subscribe to store updates
  useEffect(() => {
    // Get initial values
    setCurrentPrice(getCurrentPrice(commodityId, circleId));
    if (circleId) {
      setPriceHistory(getPriceHistory(commodityId, circleId));
    }
    
    // Create a subscription to the store
    const unsubscribe = usePriceUpdatesStore.subscribe(
      (state) => {
        const newPrice = state.getCurrentPrice(commodityId, circleId);
        if (newPrice) {
          setCurrentPrice(newPrice);
          
          if (circleId) {
            setPriceHistory(state.getPriceHistory(commodityId, circleId));
          }
        }
      }
    );
    
    return () => {
      unsubscribe();
    };
  }, [commodityId, circleId, getCurrentPrice, getPriceHistory]);
  
  // Format the price change for display
  const formattedPriceChange = currentPrice?.priceChange 
    ? currentPrice.priceChange > 0 
      ? `+₹${currentPrice.priceChange}` 
      : `-₹${Math.abs(currentPrice.priceChange)}`
    : '₹0';
    
  // Format the price change percentage for display
  const formattedPercentChange = currentPrice?.changePercentage
    ? `${currentPrice.changePercentage > 0 ? '+' : ''}${currentPrice.changePercentage.toFixed(2)}%`
    : '0.00%';
  
  // Determine the CSS class based on price change direction
  const priceChangeClass = !currentPrice?.changeDirection 
    ? 'text-gray-500' 
    : currentPrice.changeDirection === 'up' 
      ? 'text-green-600' 
      : currentPrice.changeDirection === 'down' 
        ? 'text-red-600' 
        : 'text-gray-500';
  
  return {
    currentPrice,
    priceHistory,
    formattedPriceChange,
    formattedPercentChange,
    priceChangeClass,
    
    // Helper function to get price change icon
    getPriceChangeIcon: () => {
      return currentPrice?.changeDirection === 'up' ? '📈' : 
             currentPrice?.changeDirection === 'down' ? '📉' : '➡️';
    }
  };
}