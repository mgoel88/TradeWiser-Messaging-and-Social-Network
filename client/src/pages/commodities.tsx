import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import { Wheat, Loader, Search, ArrowUp, ArrowDown, BarChart } from "lucide-react";
import CommodityItem from "@/components/commodity/CommodityItem";
import { AnimatedSkeleton, AnimatedCardSkeleton } from "@/components/ui/animated-skeleton";
import { COMMODITY_CATEGORIES } from "@/lib/constants";

const Commodities: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  
  // Fetch all commodities
  const { data: commoditiesData, isLoading } = useQuery({
    queryKey: ['/api/commodities'],
  });
  
  // Fetch trending commodities
  const { data: trendingData, isLoading: trendingLoading } = useQuery({
    queryKey: ['/api/commodities/trending'],
  });
  
  // Filter and sort commodities
  const filteredCommodities = React.useMemo(() => {
    if (!commoditiesData?.commodities) return [];
    
    return commoditiesData.commodities
      .filter((commodity: any) => {
        // Apply search filter
        if (searchQuery && !commodity.name.toLowerCase().includes(searchQuery.toLowerCase())) {
          return false;
        }
        
        // Apply category filter
        if (categoryFilter !== "All" && commodity.category !== categoryFilter) {
          return false;
        }
        
        return true;
      })
      .sort((a: any, b: any) => a.name.localeCompare(b.name));
  }, [commoditiesData, searchQuery, categoryFilter]);
  
  return (
    <main className="container mx-auto px-4 py-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold mb-1">Agricultural Commodities</h1>
            <p className="text-gray-600">Track prices and trading information for agricultural commodities</p>
          </div>
        </div>
        
        {/* Trending Commodities */}
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <h2 className="font-heading font-semibold text-lg flex items-center">
              <BarChart className="h-5 w-5 mr-2 text-primary" />
              Trending Commodities
            </h2>
          </CardHeader>
          <CardContent>
            {trendingLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <AnimatedCardSkeleton 
                    key={i}
                    variant="shimmer"
                    imageHeight={50}
                    lines={2}
                    hasFooter={false}
                    className="h-28"
                  />
                ))}
              </div>
            ) : trendingData?.trendingCommodities && trendingData.trendingCommodities.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {trendingData.trendingCommodities.map((item: any) => (
                  <Card key={`trending-${item.commodityId}`} className="overflow-hidden">
                    <div className="bg-gray-50 p-3 flex items-center border-b">
                      <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-700">
                        <Wheat className="h-4 w-4" />
                      </div>
                      <div className="ml-3">
                        <Link href={`/commodities/${item.commodityId}`}>
                          <p className="font-medium text-sm hover:underline cursor-pointer">{item.commodity?.name || "Commodity"}</p>
                        </Link>
                        <p className="text-xs text-gray-500">{item.circleName || "Circle"}</p>
                      </div>
                    </div>
                    <div className="p-3">
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-sm text-gray-600">Current Price:</p>
                        <p className="font-semibold font-data">₹{item.currentPrice}/quintal</p>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-gray-600">Change:</p>
                        <p className={`font-semibold font-data ${item.priceChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {item.priceChange >= 0 ? (
                            <ArrowUp className="inline h-3 w-3 mr-1" />
                          ) : (
                            <ArrowDown className="inline h-3 w-3 mr-1" />
                          )}
                          {Math.abs(item.priceChange).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-gray-500">No trending commodities available at the moment.</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Commodities list */}
        <Tabs defaultValue="all" className="space-y-6">
          <Card>
            <TabsList className="w-full flex border-b justify-start rounded-none p-0 overflow-x-auto">
              <TabsTrigger value="all">All Commodities</TabsTrigger>
              <TabsTrigger value="grain">Grains</TabsTrigger>
              <TabsTrigger value="pulse">Pulses</TabsTrigger>
              <TabsTrigger value="oilseed">Oilseeds</TabsTrigger>
              <TabsTrigger value="spice">Spices</TabsTrigger>
              <TabsTrigger value="cash_crop">Cash Crops</TabsTrigger>
            </TabsList>
          </Card>
          
          {/* Filter controls */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search commodities by name..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <select
              className="bg-white border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="All">All Categories</option>
              {COMMODITY_CATEGORIES.map((category) => (
                <option key={category.value} value={category.value}>{category.label}</option>
              ))}
            </select>
          </div>
          
          <TabsContent value="all" className="m-0">
            <CommoditiesList 
              commodities={filteredCommodities} 
              isLoading={isLoading} 
              searchQuery={searchQuery}
              categoryFilter={categoryFilter}
            />
          </TabsContent>
          
          {/* Create tabs for each category */}
          {COMMODITY_CATEGORIES.map((category) => (
            <TabsContent key={category.value} value={category.value} className="m-0">
              <CommoditiesList 
                commodities={filteredCommodities.filter((c: any) => c.category === category.value)} 
                isLoading={isLoading} 
                searchQuery={searchQuery}
                categoryFilter={categoryFilter}
                category={category.label}
              />
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </main>
  );
};

interface CommoditiesListProps {
  commodities: any[];
  isLoading: boolean;
  searchQuery: string;
  categoryFilter: string;
  category?: string;
}

const CommoditiesList: React.FC<CommoditiesListProps> = ({ 
  commodities, 
  isLoading, 
  searchQuery,
  categoryFilter,
  category
}) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <AnimatedSkeleton className="h-7 w-40" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100">
            <div className="md:pr-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="py-3 flex items-center">
                  <AnimatedSkeleton className="h-10 w-10 rounded-full" variant="shimmer" />
                  <div className="ml-3 space-y-2">
                    <AnimatedSkeleton className="h-5 w-32" variant="shimmer" />
                    <AnimatedSkeleton className="h-4 w-24" variant="shimmer" />
                  </div>
                </div>
              ))}
            </div>
            <div className="md:pl-4 pt-0 md:pt-0">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="py-3 flex items-center">
                  <AnimatedSkeleton className="h-10 w-10 rounded-full" variant="shimmer" />
                  <div className="ml-3 space-y-2">
                    <AnimatedSkeleton className="h-5 w-32" variant="shimmer" />
                    <AnimatedSkeleton className="h-4 w-24" variant="shimmer" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (commodities.length === 0) {
    return (
      <Card className="p-12 text-center">
        <Wheat className="h-12 w-12 mx-auto mb-3 text-gray-300" />
        <h3 className="text-lg font-medium mb-1">No commodities found</h3>
        <p className="text-gray-500 mb-4">
          {searchQuery || categoryFilter !== "All" 
            ? "Try adjusting your filters to find more commodities."
            : `No ${category ? category.toLowerCase() : "commodities"} available at the moment.`}
        </p>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <h2 className="font-heading font-semibold text-lg">
          {commodities.length} {commodities.length === 1 ? 'Commodity' : 'Commodities'} Found
        </h2>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100">
          <div className="md:pr-4">
            {commodities.slice(0, Math.ceil(commodities.length / 2)).map((commodity: any) => (
              <CommodityItem
                key={commodity.id}
                commodity={commodity}
              />
            ))}
          </div>
          <div className="md:pl-4 pt-0 md:pt-0">
            {commodities.slice(Math.ceil(commodities.length / 2)).map((commodity: any) => (
              <CommodityItem
                key={commodity.id}
                commodity={commodity}
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default Commodities;
