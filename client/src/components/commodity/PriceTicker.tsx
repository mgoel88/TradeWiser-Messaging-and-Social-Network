import React from 'react';
import { usePriceUpdatesStore, PriceData } from '@/stores/price-updates-store';
import { ArrowUp, ArrowDown, MinusIcon } from 'lucide-react';
import { AnimatedSkeleton } from '@/components/ui/animated-skeleton';
import { useQuery } from '@tanstack/react-query';

interface PriceTickerProps {
  limit?: number;
  circleId?: number;
  className?: string;
  autoScroll?: boolean;
  scrollInterval?: number; // in milliseconds
}

export const PriceTicker: React.FC<PriceTickerProps> = ({
  limit = 10,
  circleId,
  className = '',
  autoScroll = true,
  scrollInterval = 5000
}) => {
  const recentUpdates = usePriceUpdatesStore(state => state.recentUpdates);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [currentScrollIndex, setCurrentScrollIndex] = React.useState(0);
  
  // Filter updates by circle if specified
  const filteredUpdates = React.useMemo(() => {
    if (!circleId) return recentUpdates.slice(0, limit);
    return recentUpdates
      .filter(update => update.circleId === circleId)
      .slice(0, limit);
  }, [recentUpdates, circleId, limit]);
  
  // Get commodity data to display names
  const { data: commoditiesData } = useQuery({
    queryKey: ['/api/commodities'],
  });
  
  // Helper to get commodity name by ID
  const getCommodityName = (id: number) => {
    if (!commoditiesData?.commodities) return `Commodity #${id}`;
    const commodity = commoditiesData.commodities.find((c: any) => c.id === id);
    return commodity ? commodity.name : `Commodity #${id}`;
  };
  
  // Set up auto-scrolling if enabled
  React.useEffect(() => {
    if (!autoScroll || filteredUpdates.length <= 1) return;
    
    const scrollTimer = setInterval(() => {
      setCurrentScrollIndex(prev => (prev + 1) % filteredUpdates.length);
    }, scrollInterval);
    
    return () => clearInterval(scrollTimer);
  }, [autoScroll, filteredUpdates.length, scrollInterval]);
  
  // Scroll to the current index when it changes
  React.useEffect(() => {
    if (scrollRef.current && filteredUpdates.length > 0) {
      const tickerItems = scrollRef.current.querySelectorAll('.ticker-item');
      if (tickerItems[currentScrollIndex]) {
        tickerItems[currentScrollIndex].scrollIntoView({
          behavior: 'smooth',
          block: 'nearest'
        });
      }
    }
  }, [currentScrollIndex, filteredUpdates]);
  
  if (filteredUpdates.length === 0) {
    return (
      <div className={`${className} bg-white rounded-lg shadow p-3 overflow-hidden`}>
        <div className="flex space-x-4 items-center">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex-none">
              <AnimatedSkeleton className="h-6 w-32" variant="shimmer" />
              <AnimatedSkeleton className="h-4 w-24 mt-1" variant="shimmer" />
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  return (
    <div className={`${className} bg-white rounded-lg shadow overflow-hidden`}>
      <div 
        ref={scrollRef}
        className="flex space-x-4 p-3 overflow-x-auto scrollbar-hide" 
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {filteredUpdates.map((update: PriceData, index: number) => {
          // Determine icon based on price change direction
          const PriceIcon = update.changeDirection === 'up' 
            ? ArrowUp 
            : update.changeDirection === 'down' 
              ? ArrowDown 
              : MinusIcon;
          
          // Format the price change
          const priceChange = update.priceChange > 0 
            ? `+₹${update.priceChange}` 
            : `-₹${Math.abs(update.priceChange)}`;
          
          // Format the percentage change
          const percentChange = 
            `${update.changePercentage > 0 ? '+' : ''}${update.changePercentage.toFixed(2)}%`;
          
          // Determine CSS class for price change direction
          const priceChangeClass = update.changeDirection === 'up' 
            ? 'text-green-600' 
            : update.changeDirection === 'down' 
              ? 'text-red-600' 
              : 'text-gray-500';
          
          const commodityName = getCommodityName(update.commodityId);
          
          return (
            <div 
              key={`${update.commodityId}-${update.circleId}-${update.timestamp}`}
              className="ticker-item flex-none scroll-snap-align-start"
              style={{ scrollSnapAlign: 'start' }}
            >
              <div className="font-medium">{commodityName}</div>
              <div className="flex items-center">
                <span className="mr-1 text-gray-600">₹{update.price.toLocaleString()}</span>
                <div className={`flex items-center ${priceChangeClass} text-sm`}>
                  <PriceIcon className="h-3 w-3 mr-0.5" />
                  <span>{percentChange}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};