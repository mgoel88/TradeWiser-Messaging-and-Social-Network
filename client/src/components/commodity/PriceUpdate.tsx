import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowUp, ArrowDown, MinusIcon, Activity, ShoppingBag } from 'lucide-react';
import { usePriceUpdates } from '@/hooks/use-price-updates';
import { AnimatedSkeleton } from '@/components/ui/animated-skeleton';

interface PriceUpdateProps {
  commodityId: number;
  circleId?: number;
  commodityName?: string;
  circleName?: string;
  compact?: boolean;
  className?: string;
}

export const PriceUpdate: React.FC<PriceUpdateProps> = ({
  commodityId,
  circleId,
  commodityName,
  circleName,
  compact = false,
  className = ''
}) => {
  const {
    currentPrice,
    formattedPriceChange,
    formattedPercentChange,
    priceChangeClass
  } = usePriceUpdates(commodityId, circleId);

  if (!currentPrice) {
    return (
      <Card className={`${className} ${compact ? 'p-3' : 'p-4'}`}>
        {compact ? (
          <div className="flex flex-row items-center justify-between">
            <AnimatedSkeleton className="h-6 w-28" variant="shimmer" />
            <AnimatedSkeleton className="h-6 w-20" variant="shimmer" />
          </div>
        ) : (
          <CardContent className="p-0">
            <AnimatedSkeleton className="h-5 w-36 mb-2" variant="shimmer" />
            <div className="flex flex-row items-center gap-4 mt-3">
              <div>
                <AnimatedSkeleton className="h-8 w-24 mb-1" variant="shimmer" />
                <AnimatedSkeleton className="h-4 w-16" variant="shimmer" />
              </div>
              <Separator orientation="vertical" className="h-10" />
              <div>
                <AnimatedSkeleton className="h-6 w-20 mb-1" variant="shimmer" />
                <AnimatedSkeleton className="h-4 w-28" variant="shimmer" />
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    );
  }
  
  // The icon to display based on price change direction
  const PriceIcon = currentPrice.changeDirection === 'up' 
    ? ArrowUp 
    : currentPrice.changeDirection === 'down' 
      ? ArrowDown 
      : MinusIcon;

  if (compact) {
    return (
      <Card className={`${className} p-3`}>
        <div className="flex flex-row items-center justify-between">
          <div className="flex items-center">
            <Activity className="h-4 w-4 mr-2 text-primary" />
            <span className="font-medium">₹{currentPrice.price.toLocaleString()}</span>
          </div>
          <Badge 
            variant={currentPrice.changeDirection === 'up' 
              ? 'outline' 
              : currentPrice.changeDirection === 'down' 
                ? 'destructive' 
                : 'secondary'
            }
            className="flex items-center"
          >
            <PriceIcon className="mr-1 h-3 w-3" />
            {formattedPercentChange}
          </Badge>
        </div>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex flex-col">
            <span className="text-sm text-gray-500">
              {commodityName || `Commodity #${commodityId}`}
              {circleName && ` in ${circleName}`}
            </span>
            <span className="text-xs text-gray-400">
              Last updated: {new Date(currentPrice.timestamp).toLocaleString()}
            </span>
          </div>
          {currentPrice.quality && (
            <Badge variant="outline" className="text-xs">
              Quality: {currentPrice.quality}
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="flex flex-col">
            <span className="text-sm text-gray-500">Current Price</span>
            <div className="flex items-baseline">
              <span className="text-2xl font-semibold font-data">₹{currentPrice.price.toLocaleString()}</span>
              <span className="text-xs text-gray-500 ml-1">/quintal</span>
            </div>
          </div>

          <div className="flex flex-col">
            <span className="text-sm text-gray-500">Price Change</span>
            <div className="flex items-center">
              <PriceIcon className={`${priceChangeClass} mr-1 h-4 w-4`} />
              <span className={`${priceChangeClass} text-lg font-semibold font-data`}>
                {formattedPriceChange} ({formattedPercentChange})
              </span>
            </div>
          </div>
        </div>

        {currentPrice.arrivals && (
          <div className="mt-4 pt-3 border-t border-gray-100">
            <div className="flex items-center">
              <ShoppingBag className="h-4 w-4 mr-2 text-gray-400" />
              <span className="text-sm text-gray-600">
                Daily Arrivals: <span className="font-medium">{currentPrice.arrivals}</span>
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};