import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PriceHistoryChart } from '../commodity/PriceHistoryChart';
import { PriceTicker } from '../commodity/PriceTicker';
import { RecentPriceUpdates } from '../commodity/RecentPriceUpdates';
import { getQueryFn } from '@/lib/queryClient';

export function MarketDashboard() {
  const { data: analysis } = useQuery({
    queryKey: ['/api/market-analysis'],
    queryFn: getQueryFn()
  });

  const { data: recommendations } = useQuery({
    queryKey: ['/api/recommendations'],
    queryFn: getQueryFn({ on401: 'returnNull' })
  });

  if (!analysis) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <Card>
        <CardHeader>
          <h3 className="font-heading text-lg">Daily Price Summary</h3>
        </CardHeader>
        <CardContent>
          <PriceTicker commodities={analysis.daily} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="font-heading text-lg">Weekly Overview</h3>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-muted-foreground">{analysis.weekly.summary}</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">Top Performers</h4>
                <ul className="space-y-1">
                  {analysis.weekly.topPerformers.map((item: string) => (
                    <li key={item} className="text-green-600">{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Worst Performers</h4>
                <ul className="space-y-1">
                  {analysis.weekly.worstPerformers.map((item: string) => (
                    <li key={item} className="text-red-600">{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader>
          <h3 className="font-heading text-lg">Monthly Analysis</h3>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-muted-foreground">{analysis.monthly.summary}</p>
            <p className="text-muted-foreground">{analysis.monthly.outlook}</p>
            <div>
              <h4 className="font-medium mb-2">Key Factors</h4>
              <ul className="list-disc list-inside space-y-1">
                {analysis.monthly.keyFactors.map((factor: string) => (
                  <li key={factor}>{factor}</li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {recommendations?.map((rec: any) => (
        <Card key={rec.id}>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg">{rec.commodity}</CardTitle>
              <Badge variant={rec.type === 'buy' ? 'success' : 'destructive'}>
                {rec.type.toUpperCase()}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p>{rec.description}</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>Current: ₹{rec.currentPrice}</div>
                <div>Target: ₹{rec.targetPrice}</div>
                <div>Stop Loss: ₹{rec.stopLoss}</div>
                <div>Confidence: {rec.confidence}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}