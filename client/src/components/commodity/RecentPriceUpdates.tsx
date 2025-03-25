import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowUp, ArrowDown, MinusIcon, RefreshCcw } from 'lucide-react';
import { usePriceUpdatesStore, PriceData } from '@/stores/price-updates-store';
import { Button } from '@/components/ui/button';
import { AnimatedSkeleton } from '@/components/ui/animated-skeleton';
import { useQuery } from '@tanstack/react-query';

interface RecentPriceUpdatesProps {
  limit?: number;
  title?: string;
  className?: string;
  showRefresh?: boolean;
  commodityId?: number; // Optional: Filter by commodity
  circleId?: number; // Optional: Filter by circle
}

export const RecentPriceUpdates: React.FC<RecentPriceUpdatesProps> = ({
  limit = 5,
  title = 'Recent Price Updates',
  className = '',
  showRefresh = true,
  commodityId,
  circleId
}) => {
  // Get recent updates from the store
  const recentUpdates = usePriceUpdatesStore(state => state.recentUpdates);
  
  // Filter updates based on provided commodityId and/or circleId
  const filteredUpdates = React.useMemo(() => {
    let updates = [...recentUpdates];
    
    if (commodityId) {
      updates = updates.filter(update => update.commodityId === commodityId);
    }
    
    if (circleId) {
      updates = updates.filter(update => update.circleId === circleId);
    }
    
    return updates.slice(0, limit);
  }, [recentUpdates, commodityId, circleId, limit]);
  
  // Get commodity data to display names
  const { data: commoditiesData } = useQuery({
    queryKey: ['/api/commodities'],
  });
  
  // Get circles data to display names
  const { data: circlesData } = useQuery({
    queryKey: ['/api/circles'],
  });
  
  // Helper to get commodity name by ID
  const getCommodityName = (id: number) => {
    if (!commoditiesData?.commodities) return `Commodity #${id}`;
    const commodity = commoditiesData.commodities.find((c: any) => c.id === id);
    return commodity ? commodity.name : `Commodity #${id}`;
  };
  
  // Helper to get circle name by ID
  const getCircleName = (id: number) => {
    if (!circlesData?.circles) return `Circle #${id}`;
    const circle = circlesData.circles.find((c: any) => c.id === id);
    return circle ? circle.name : `Circle #${id}`;
  };
  
  // Function to manually refetch commodity and circle data
  const { refetch } = useQuery({
    queryKey: ['combinedRefetch'],
    queryFn: async () => {
      const [commoditiesResult, circlesResult] = await Promise.all([
        fetch('/api/commodities').then(res => res.json()),
        fetch('/api/circles').then(res => res.json())
      ]);
      return { commodities: commoditiesResult, circles: circlesResult };
    },
    enabled: false
  });
  
  const handleRefresh = () => {
    refetch();
  };
  
  // If there are no recent updates yet, show a loading state
  if (filteredUpdates.length === 0) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-medium">{title}</CardTitle>
          {showRefresh && (
            <Button variant="ghost" size="sm" onClick={handleRefresh}>
              <RefreshCcw className="h-4 w-4 mr-1" />
              Refresh
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="py-3 border-b last:border-0">
              <div className="flex justify-between mb-1">
                <AnimatedSkeleton className="h-5 w-40" variant="shimmer" />
                <AnimatedSkeleton className="h-5 w-20" variant="shimmer" />
              </div>
              <AnimatedSkeleton className="h-4 w-32 mt-1" variant="shimmer" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className={className}>
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-medium">{title}</CardTitle>
        {showRefresh && (
          <Button variant="ghost" size="sm" onClick={handleRefresh}>
            <RefreshCcw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {filteredUpdates.map((update: PriceData, index: number) => {
          // Determine icon based on price change direction
          const PriceIcon = update.changeDirection === 'up' 
            ? ArrowUp 
            : update.changeDirection === 'down' 
              ? ArrowDown 
              : MinusIcon;
          
          // Format price change
          const priceChange = update.priceChange > 0 
            ? `+₹${update.priceChange}` 
            : `-₹${Math.abs(update.priceChange)}`;
          
          // Format percentage change
          const percentChange = 
            `${update.changePercentage > 0 ? '+' : ''}${update.changePercentage.toFixed(2)}%`;
          
          // Determine CSS class for price change direction
          const priceChangeClass = update.changeDirection === 'up' 
            ? 'text-green-600' 
            : update.changeDirection === 'down' 
              ? 'text-red-600' 
              : 'text-gray-500';
          
          // Format timestamp
          const formattedTime = new Date(update.timestamp).toLocaleString();
          
          return (
            <div key={index} className="py-3 border-b last:border-0">
              <div className="flex justify-between mb-1">
                <span className="font-medium">
                  {getCommodityName(update.commodityId)}
                </span>
                <div className={`flex items-center ${priceChangeClass}`}>
                  <PriceIcon className="h-4 w-4 mr-1" />
                  <span>{percentChange}</span>
                </div>
              </div>
              <div className="text-sm text-gray-500 flex justify-between">
                <span>
                  {!circleId && getCircleName(update.circleId)} - ₹{update.price.toLocaleString()}
                </span>
                <span className={priceChangeClass}>{priceChange}</span>
              </div>
              <div className="text-xs text-gray-400 mt-1">
                {formattedTime}
              </div>
            </div>
          );
        })}
        
        {filteredUpdates.length === 0 && (
          <div className="py-12 text-center text-gray-500">
            <p>No price updates available yet.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};