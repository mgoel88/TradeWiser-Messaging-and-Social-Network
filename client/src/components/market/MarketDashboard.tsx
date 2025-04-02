import React from 'react';
import { Card } from '@/components/ui/card';
import { PriceHistoryChart } from '../commodity/PriceHistoryChart';
import { PriceTicker } from '../commodity/PriceTicker';
import { RecentPriceUpdates } from '../commodity/RecentPriceUpdates';
import { useWebSocket } from '@/hooks/use-websocket';
import { usePriceUpdates } from '@/hooks/use-price-updates';

export function MarketDashboard() {
  const { connected } = useWebSocket();
  const { priceUpdates } = usePriceUpdates();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card className="p-4">
        <h2 className="text-xl font-bold mb-4">Live Price Updates</h2>
        <PriceTicker autoScroll={true} scrollInterval={3000} />
        <div className="mt-4">
          <RecentPriceUpdates updates={priceUpdates} />
        </div>
      </Card>

      <Card className="p-4">
        <h2 className="text-xl font-bold mb-4">Market Overview</h2>
        <PriceHistoryChart commodityId={1} timeRange="1d" />
      </Card>

      <Card className="p-4 md:col-span-2">
        <h2 className="text-xl font-bold mb-4">Trading Activity</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="stat-card">
            <h3>Total Volume</h3>
            <p className="text-2xl font-bold">₹2.4M</p>
            <p className="text-sm text-green-600">+12% today</p>
          </div>
          <div className="stat-card">
            <h3>Active Trades</h3>
            <p className="text-2xl font-bold">156</p>
            <p className="text-sm text-blue-600">23 new today</p>
          </div>
          <div className="stat-card">
            <h3>Market Sentiment</h3>
            <p className="text-2xl font-bold">Bullish</p>
            <p className="text-sm text-green-600">65% buy signals</p>
          </div>
        </div>
      </Card>
    </div>
  );
}