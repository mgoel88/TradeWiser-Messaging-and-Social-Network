import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useLanguage } from "@/lib/i18n";
import { 
  Calendar,
  Cloud, 
  CloudRain, 
  ExternalLink, 
  Flame, 
  GitBranchPlus, 
  GitCommit, 
  LineChart, 
  Loader2, 
  MapPin, 
  MoreHorizontal, 
  Newspaper, 
  RotateCcw, 
  Share2, 
  SunMedium, 
  TrendingDown, 
  TrendingUp, 
  Wind 
} from "lucide-react";
import { useState } from "react";

export default function MarketNews() {
  const { t } = useLanguage();
  const [activeNewsId, setActiveNewsId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("news");

  // Fetch market news
  const { data: newsData, isLoading: isNewsLoading } = useQuery({
    queryKey: ['/api/market-news'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch weather data
  const { data: weatherData, isLoading: isWeatherLoading } = useQuery({
    queryKey: ['/api/weather'],
    staleTime: 30 * 60 * 1000, // 30 minutes
  });

  // Fetch recommendations
  const { data: recommendationsData, isLoading: isRecommendationsLoading } = useQuery({
    queryKey: ['/api/recommendations'],
    staleTime: 15 * 60 * 1000, // 15 minutes
  });

  // Fetch market analysis
  const { data: analysisData, isLoading: isAnalysisLoading } = useQuery({
    queryKey: ['/api/market-analysis'],
    staleTime: 15 * 60 * 1000, // 15 minutes
  });

  const getActiveNewsItem = () => {
    if (!newsData || !newsData.news) return null;
    return newsData.news.find((item: any) => item.id === activeNewsId);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getWeatherIcon = (condition: string) => {
    switch (condition.toLowerCase()) {
      case 'clear':
        return <SunMedium className="h-6 w-6 text-yellow-500" />;
      case 'partly cloudy':
        return <Cloud className="h-6 w-6 text-gray-400" />;
      case 'rain':
      case 'showers':
        return <CloudRain className="h-6 w-6 text-blue-500" />;
      default:
        return <Cloud className="h-6 w-6 text-gray-400" />;
    }
  };

  const getRecommendationIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'buy':
        return <TrendingUp className="h-5 w-5 text-green-600" />;
      case 'sell':
        return <TrendingDown className="h-5 w-5 text-red-600" />;
      case 'hold':
        return <GitCommit className="h-5 w-5 text-amber-600" />;
      case 'alert':
        return <Flame className="h-5 w-5 text-purple-600" />;
      default:
        return <MoreHorizontal className="h-5 w-5 text-gray-600" />;
    }
  };

  const getRecommendationColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'buy':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
      case 'sell':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100';
      case 'hold':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100';
      case 'alert':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100';
    }
  };

  return (
    <div className="container py-6">
      <h1 className="text-3xl font-bold mb-6">
        {t('marketNews')}
      </h1>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-4 mb-6">
          <TabsTrigger value="news">
            <Newspaper className="mr-2 h-4 w-4" /> {t('news')}
          </TabsTrigger>
          <TabsTrigger value="weather">
            <Cloud className="mr-2 h-4 w-4" /> {t('weather')}
          </TabsTrigger>
          <TabsTrigger value="recommendations">
            <TrendingUp className="mr-2 h-4 w-4" /> {t('recommendations')}
          </TabsTrigger>
          <TabsTrigger value="analysis">
            <LineChart className="mr-2 h-4 w-4" /> {t('analysis')}
          </TabsTrigger>
        </TabsList>

        {/* News Tab Content */}
        <TabsContent value="news" className="space-y-4">
          {isNewsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2 mt-2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full mt-2" />
                    <Skeleton className="h-4 w-3/4 mt-2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {newsData && newsData.news && newsData.news.map((item: any) => (
                <Card key={item.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <Badge>{item.category}</Badge>
                      <div className="text-sm text-muted-foreground">
                        {formatDate(item.publishedAt)}
                      </div>
                    </div>
                    <CardTitle className="text-xl mt-2">{item.headline}</CardTitle>
                    <CardDescription className="text-base">{item.summary}</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <p className="line-clamp-3 text-sm">{item.content}</p>
                  </CardContent>
                  <CardFooter className="flex justify-between pt-0">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{item.source}</Badge>
                      <Badge variant="outline">{item.region}</Badge>
                    </div>
                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setActiveNewsId(item.id)}
                          >
                            {t('readMore')}
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[600px]">
                          <DialogHeader>
                            <DialogTitle>{getActiveNewsItem()?.headline}</DialogTitle>
                            <DialogDescription>
                              {getActiveNewsItem()?.source} - {formatDate(getActiveNewsItem()?.publishedAt)}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="py-4">
                            <p className="mb-4 font-medium">{getActiveNewsItem()?.summary}</p>
                            <ScrollArea className="h-[350px] rounded-md border p-4">
                              <p className="whitespace-pre-line">{getActiveNewsItem()?.content}</p>
                            </ScrollArea>
                          </div>
                          <DialogFooter className="flex justify-between">
                            <div className="flex flex-wrap gap-1">
                              {getActiveNewsItem()?.tags.map((tag: string) => (
                                <Badge key={tag} variant="outline" className="mr-1">
                                  #{tag}
                                </Badge>
                              ))}
                            </div>
                            <Button size="sm" variant="outline" asChild>
                              <a 
                                href={getActiveNewsItem()?.sourceUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center gap-1"
                              >
                                <ExternalLink className="h-4 w-4" />
                                {t('source')}
                              </a>
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      <Button variant="ghost" size="sm">
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Weather Tab Content */}
        <TabsContent value="weather" className="space-y-4">
          {isWeatherLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-24 w-full rounded-md" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {weatherData && weatherData.weather && weatherData.weather.map((item: any, index: number) => (
                <Card key={index} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-xl flex items-center">
                        <MapPin className="h-5 w-5 mr-1" /> {item.location}
                      </CardTitle>
                      <Badge variant="outline">{item.state}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        {getWeatherIcon(item.condition)}
                        <span className="text-3xl font-bold ml-2">{item.temperature}°C</span>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center text-sm">
                          <Wind className="h-4 w-4 mr-1" /> {item.windSpeed} km/h
                        </div>
                        <div className="text-sm">{item.humidity}% humidity</div>
                      </div>
                    </div>
                    <Separator className="my-2" />
                    <h4 className="font-medium mb-2">{t('forecast')}</h4>
                    <div className="grid grid-cols-3 gap-2">
                      {item.forecast.map((day: any, i: number) => (
                        <div key={i} className="text-center p-2 bg-muted rounded-md">
                          <div className="text-sm font-medium">{day.day}</div>
                          <div className="flex justify-center my-1">
                            {getWeatherIcon(day.condition)}
                          </div>
                          <div className="text-sm">{day.temperature}°C</div>
                        </div>
                      ))}
                    </div>
                    {item.alerts && item.alerts.length > 0 && (
                      <div className="mt-3 p-2 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100 rounded-md text-sm">
                        {item.alerts.map((alert: string, i: number) => (
                          <div key={i}>{alert}</div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Recommendations Tab Content */}
        <TabsContent value="recommendations" className="space-y-4">
          {isRecommendationsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full mt-2" />
                    <Skeleton className="h-4 w-3/4 mt-2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {recommendationsData && recommendationsData.recommendations && recommendationsData.recommendations.map((item: any) => (
                <Card key={item.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between">
                      <div className="flex items-center">
                        <span className={`inline-flex items-center justify-center rounded-full p-1 mr-2 ${getRecommendationColor(item.type)}`}>
                          {getRecommendationIcon(item.type)}
                        </span>
                        <CardTitle className="text-xl">{item.commodity}</CardTitle>
                      </div>
                      <Badge className={getRecommendationColor(item.type)}>
                        {item.type.toUpperCase()}
                      </Badge>
                    </div>
                    <CardDescription className="text-base">
                      {item.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <div className="text-sm text-muted-foreground">{t('currentPrice')}</div>
                        <div className="font-medium">₹{item.currentPrice.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">{t('targetPrice')}</div>
                        <div className="font-medium">₹{item.targetPrice.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">{t('stopLoss')}</div>
                        <div className="font-medium">
                          {item.stopLoss ? `₹${item.stopLoss.toLocaleString()}` : '-'}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">{t('confidence')}</div>
                        <div className="font-medium capitalize">{item.confidence}</div>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm text-muted-foreground mb-1">{t('rationale')}</h4>
                      <p className="text-sm">{item.rationale}</p>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-0 justify-between">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4 mr-1" /> {item.region}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatDate(item.timestamp)}
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Analysis Tab Content */}
        <TabsContent value="analysis" className="space-y-4">
          {isAnalysisLoading ? (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-[200px] w-full" />
                </CardContent>
              </Card>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <Skeleton className="h-6 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full mt-2" />
                    <Skeleton className="h-4 w-3/4 mt-2" />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <Skeleton className="h-6 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full mt-2" />
                    <Skeleton className="h-4 w-3/4 mt-2" />
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>{t('dailyMarketSummary')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead>
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            {t('commodity')}
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            {t('price')}
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            {t('change')}
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            {t('volume')}
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            {t('sentiment')}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {analysisData && analysisData.analysis && analysisData.analysis.daily.map((item: any, index: number) => (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap font-medium">
                              {item.commodity}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              ₹{item.price.toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center ${item.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {item.change >= 0 ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
                                {item.change >= 0 ? '+' : ''}{item.change}%
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {item.volume}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                                <div 
                                  className={`h-2.5 rounded-full ${
                                    item.sentiment > 60 ? 'bg-green-600' : 
                                    item.sentiment > 40 ? 'bg-amber-500' : 
                                    'bg-red-600'
                                  }`} 
                                  style={{ width: `${item.sentiment}%` }}
                                ></div>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('weeklyOutlook')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-4">
                      {analysisData?.analysis?.weekly.summary}
                    </p>
                    <div className="space-y-3">
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-1">
                          {t('topPerformers')}
                        </h4>
                        <div className="flex flex-wrap gap-1">
                          {analysisData?.analysis?.weekly.topPerformers.map((item: string) => (
                            <Badge key={item} variant="secondary" className="mr-1">
                              <TrendingUp className="h-3 w-3 mr-1" /> {item}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-1">
                          {t('worstPerformers')}
                        </h4>
                        <div className="flex flex-wrap gap-1">
                          {analysisData?.analysis?.weekly.worstPerformers.map((item: string) => (
                            <Badge key={item} variant="outline" className="mr-1">
                              <TrendingDown className="h-3 w-3 mr-1" /> {item}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>{t('monthlyOutlook')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-2">
                      {analysisData?.analysis?.monthly.summary}
                    </p>
                    <p className="mb-4">
                      {analysisData?.analysis?.monthly.outlook}
                    </p>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">
                        {t('keyFactors')}
                      </h4>
                      <ul className="list-disc pl-5 text-sm space-y-1">
                        {analysisData?.analysis?.monthly.keyFactors.map((item: string, index: number) => (
                          <li key={index}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}