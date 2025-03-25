import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { usePriceUpdates } from '@/hooks/use-price-updates';
import { AnimatedSkeleton } from '@/components/ui/animated-skeleton';

interface PriceHistoryChartProps {
  commodityId: number;
  circleId: number;
  title?: string;
  className?: string;
  height?: number;
}

export const PriceHistoryChart: React.FC<PriceHistoryChartProps> = ({
  commodityId,
  circleId,
  title = 'Price History',
  className = '',
  height = 300
}) => {
  const { priceHistory, currentPrice } = usePriceUpdates(commodityId, circleId);
  
  // Format data for the chart
  const chartData = React.useMemo(() => {
    return priceHistory
      .slice()
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .map(data => ({
        time: new Date(data.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        price: data.price,
        fullTime: new Date(data.timestamp).toLocaleString(),
      }));
  }, [priceHistory]);
  
  // Calculate min and max prices for the Y-axis domain
  const minPrice = React.useMemo(() => {
    if (chartData.length === 0) return 0;
    const min = Math.min(...chartData.map(d => d.price));
    // Return 95% of the minimum price to create some padding
    return Math.floor(min * 0.95);
  }, [chartData]);
  
  const maxPrice = React.useMemo(() => {
    if (chartData.length === 0) return 0;
    const max = Math.max(...chartData.map(d => d.price));
    // Return 105% of the maximum price to create some padding
    return Math.ceil(max * 1.05);
  }, [chartData]);
  
  if (!currentPrice) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <AnimatedSkeleton className="h-60 w-full" variant="shimmer" />
        </CardContent>
      </Card>
    );
  }
  
  if (chartData.length < 2) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-60 border rounded-lg bg-gray-50 text-gray-500">
            <p>Not enough price history data available yet.</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <LineChart
            data={chartData}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis 
              dataKey="time" 
              tick={{ fontSize: 12 }}
              tickMargin={10}
            />
            <YAxis 
              domain={[minPrice, maxPrice]}
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => `₹${value}`}
            />
            <Tooltip 
              formatter={(value) => [`₹${value}`, 'Price']}
              labelFormatter={(value) => `Time: ${value}`}
            />
            <ReferenceLine 
              y={currentPrice.price} 
              stroke="#8884d8" 
              strokeDasharray="3 3" 
              label={{ 
                value: 'Current', 
                position: 'right',
                fill: '#8884d8',
                fontSize: 12
              }} 
            />
            <Line 
              type="monotone" 
              dataKey="price" 
              stroke="#8884d8" 
              activeDot={{ r: 6 }} 
              dot={{ strokeWidth: 2, r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};