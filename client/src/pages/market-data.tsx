import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useWebSocket } from '@/hooks/use-websocket';
import { usePriceUpdatesStore } from '@/stores/price-updates-store';
import { WebSocketDemo } from '@/components/notifications/WebSocketDemo';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ConnectButton, HelpCircleIcon, LineChartIcon, BarChartIcon, ListIcon } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CommodityCard } from '@/components/feed/CommodityCard';
import { AnimatedCardSkeleton } from '@/components/ui/animated-skeleton';
import { Badge } from '@/components/ui/badge';

// Price chart component (placeholder)
const PriceChart = ({ commodityId, circleId }: { commodityId: number, circleId: number }) => {
  const priceUpdates = usePriceUpdatesStore(state => 
    state.getPriceHistory(commodityId, circleId, 30));

  return (
    <div className="h-80 w-full rounded-md border p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium">Price Trend</h3>
        <div className="flex items-center gap-2">
          <Badge variant="outline">30 Day View</Badge>
          <Badge variant="outline">Daily</Badge>
        </div>
      </div>
      {priceUpdates.length > 0 ? (
        <div className="h-60 relative">
          {/* This would be replaced with an actual chart library */}
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-muted-foreground text-sm">
              Price chart would render here with {priceUpdates.length} data points
            </p>
          </div>
        </div>
      ) : (
        <div className="h-60 flex items-center justify-center border border-dashed rounded-md">
          <div className="text-center">
            <LineChartIcon className="mx-auto h-8 w-8 text-muted-foreground" />
            <h3 className="mt-2 text-sm font-medium">No price history available</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Wait for real-time updates or select another commodity
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default function MarketDataPage() {
  const { status: wsStatus, connect } = useWebSocket();
  const [selectedCommodity, setSelectedCommodity] = useState<number | null>(null);
  const [selectedCircle, setSelectedCircle] = useState<number | null>(null);
  
  // Fetch commodities
  const { data: commoditiesData, isLoading: commoditiesLoading } = useQuery({
    queryKey: ['/api/commodities'],
    retry: false,
  });

  // Fetch circles
  const { data: circlesData, isLoading: circlesLoading } = useQuery({
    queryKey: ['/api/circles'],
    retry: false,
  });

  // Fetch trending commodities with price data
  const { data: trendingData, isLoading: trendingLoading } = useQuery({
    queryKey: ['/api/commodities/trending'],
    retry: false,
  });

  // Connect to WebSocket on component mount
  useEffect(() => {
    if (wsStatus !== 'open' && wsStatus !== 'connecting') {
      connect();
    }
  }, [wsStatus, connect]);

  // Set defaults when data is loaded
  useEffect(() => {
    if (trendingData?.trendingCommodities?.length && !selectedCommodity) {
      const firstTrending = trendingData.trendingCommodities[0];
      setSelectedCommodity(firstTrending.commodityId);
      setSelectedCircle(firstTrending.circleId);
    }
  }, [trendingData, selectedCommodity]);

  // Format trending data for commodity cards
  const getTrendingFormatted = () => {
    if (!trendingData?.trendingCommodities) return [];
    
    return trendingData.trendingCommodities.map((item: any) => ({
      id: item.id,
      commodityId: item.commodityId,
      circleId: item.circleId,
      commodity: item.commodityName,
      circle: item.circleName,
      data: {
        currentPrice: `₹${item.currentPrice.toLocaleString()}`,
        priceChange: item.priceChange.toFixed(2),
        changeDirection: item.changeDirection,
        arrivals: item.arrivals || 'N/A',
        quality: item.quality || 'Standard',
      }
    }));
  };

  const trendingItems = getTrendingFormatted();

  return (
    <div className="container py-6 space-y-6">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Main content area */}
        <div className="flex-1 space-y-6">
          <Card className="shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Market Data Dashboard</CardTitle>
                <Badge variant={wsStatus === 'open' ? 'default' : 'destructive'}>
                  {wsStatus === 'open' ? 'Connected' : 'Disconnected'}
                </Badge>
              </div>
              <CardDescription>
                Real-time agricultural commodity price monitoring and market intelligence
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="trend">
                <TabsList className="mb-4">
                  <TabsTrigger value="trend">
                    <LineChartIcon className="mr-2 h-4 w-4" />
                    Price Trend
                  </TabsTrigger>
                  <TabsTrigger value="volume">
                    <BarChartIcon className="mr-2 h-4 w-4" />
                    Trading Volume
                  </TabsTrigger>
                  <TabsTrigger value="listings">
                    <ListIcon className="mr-2 h-4 w-4" />
                    Active Listings
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="trend" className="space-y-4">
                  {selectedCommodity && selectedCircle ? (
                    <PriceChart 
                      commodityId={selectedCommodity} 
                      circleId={selectedCircle} 
                    />
                  ) : (
                    <div className="h-80 flex items-center justify-center border rounded-md">
                      <div className="text-center">
                        <HelpCircleIcon className="mx-auto h-8 w-8 text-muted-foreground" />
                        <h3 className="mt-2 text-sm font-medium">No commodity selected</h3>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Select a commodity and circle from the trending list
                        </p>
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-4">
                    <h3 className="text-sm font-medium mb-3">Trending Commodities</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {trendingLoading ? (
                        Array(3).fill(0).map((_, i) => (
                          <AnimatedCardSkeleton key={i} lines={3} hasFooter />
                        ))
                      ) : trendingItems.length > 0 ? (
                        trendingItems.map((item, idx) => (
                          <div 
                            key={idx} 
                            className={`cursor-pointer transition-all ${
                              selectedCommodity === item.commodityId && 
                              selectedCircle === item.circleId ? 
                              'ring-2 ring-primary' : ''
                            }`}
                            onClick={() => {
                              setSelectedCommodity(item.commodityId);
                              setSelectedCircle(item.circleId);
                            }}
                          >
                            <CommodityCard 
                              commodity={item.commodity} 
                              circle={item.circle} 
                              data={item.data} 
                            />
                          </div>
                        ))
                      ) : (
                        <div className="col-span-3 h-32 flex items-center justify-center border border-dashed rounded-md">
                          <p className="text-muted-foreground">No trending commodities available</p>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="volume">
                  <div className="h-80 flex items-center justify-center border rounded-md">
                    <div className="text-center">
                      <BarChartIcon className="mx-auto h-8 w-8 text-muted-foreground" />
                      <h3 className="mt-2 text-sm font-medium">Trading Volume Analysis</h3>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Coming soon - Trading volume metrics and trends
                      </p>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="listings">
                  <div className="h-80 flex items-center justify-center border rounded-md">
                    <div className="text-center">
                      <ListIcon className="mx-auto h-8 w-8 text-muted-foreground" />
                      <h3 className="mt-2 text-sm font-medium">Active Market Listings</h3>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Coming soon - Live tracking of buy and sell listings
                      </p>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
          
          {/* Real-time WebSocket data demo */}
          <WebSocketDemo />
        </div>
        
        {/* Right sidebar */}
        <div className="w-full md:w-80 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Market Insights</CardTitle>
              <CardDescription>Key metrics and updates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="rounded-md border p-3">
                  <div className="text-sm font-medium">Total Trading Volume</div>
                  <div className="text-2xl font-bold">₹2.34 Cr</div>
                  <div className="text-xs text-muted-foreground">Last 24 hours</div>
                </div>
                
                <div className="rounded-md border p-3">
                  <div className="text-sm font-medium">Active Listings</div>
                  <div className="text-2xl font-bold">324</div>
                  <div className="flex justify-between text-xs">
                    <span className="text-green-600">142 Buy</span>
                    <span className="text-blue-600">182 Sell</span>
                  </div>
                </div>
                
                <div className="rounded-md border p-3">
                  <div className="text-sm font-medium">Market Sentiment</div>
                  <div className="text-2xl font-bold">Bullish</div>
                  <div className="text-xs text-green-600">+2.3% overall</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent Notifications</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                <div className="space-y-3 pr-3">
                  <div className="rounded-md border p-3">
                    <div className="text-sm font-medium">Price Alert</div>
                    <div className="text-xs text-muted-foreground">
                      Chickpea prices up 4.2% in Gulbarga circle
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">10 mins ago</div>
                  </div>
                  
                  <div className="rounded-md border p-3">
                    <div className="text-sm font-medium">New Listing</div>
                    <div className="text-xs text-muted-foreground">
                      1200 quintals of Basmati Rice available in Karnal
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">30 mins ago</div>
                  </div>
                  
                  <div className="rounded-md border p-3">
                    <div className="text-sm font-medium">Contract Signed</div>
                    <div className="text-xs text-muted-foreground">
                      Mustard Seed contract signed by both parties
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">2 hours ago</div>
                  </div>
                  
                  <div className="rounded-md border p-3">
                    <div className="text-sm font-medium">Market News</div>
                    <div className="text-xs text-muted-foreground">
                      Government announces MSP increase for Rabi crops
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">4 hours ago</div>
                  </div>
                  
                  <div className="rounded-md border p-3">
                    <div className="text-sm font-medium">Circle Update</div>
                    <div className="text-xs text-muted-foreground">
                      Indore circle trading volume up 18% this week
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">6 hours ago</div>
                  </div>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}