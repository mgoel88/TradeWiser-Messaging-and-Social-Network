import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getQueryFn, queryClient } from "@/lib/queryClient";
import { Link } from "wouter";
import { QUALITY_OPTIONS } from "@/lib/constants";
import { useEffect, useState } from "react";
import { AnimatedSkeleton, AnimatedCardSkeleton } from "@/components/ui/animated-skeleton";
import { 
  CircleIcon, 
  Loader2, 
  BarChart2, 
  TrendingUp, 
  TrendingDown, 
  LineChart, 
  BarChart,
  PieChart,
  Search,
  SlidersHorizontal,
  Filter,
  DollarSign,
  Scale,
  Building2
} from "lucide-react";

export default function Marketplace() {
  const [tab, setTab] = useState("buy");
  const [searchParams, setSearchParams] = useState({
    commodityId: undefined as number | undefined,
    circleId: undefined as number | undefined,
    minPrice: undefined as number | undefined,
    maxPrice: undefined as number | undefined,
    quality: undefined as string | undefined,
    listingType: tab as string
  });
  
  // Fetch active listings based on the current tab
  const { data: listingsData, isLoading: listingsLoading } = useQuery({
    queryKey: ['/api/listings/active', { type: tab }],
    queryFn: getQueryFn({ on401: 'returnNull' })
  });
  
  // Fetch commodities for filtering
  const { data: commoditiesData } = useQuery({
    queryKey: ['/api/commodities'],
    queryFn: getQueryFn({ on401: 'returnNull' })
  });
  
  // Fetch circles for filtering
  const { data: circlesData } = useQuery({
    queryKey: ['/api/circles'],
    queryFn: getQueryFn({ on401: 'returnNull' })
  });
  
  // Update search params when tab changes
  useEffect(() => {
    setSearchParams(prev => ({
      ...prev,
      listingType: tab
    }));
  }, [tab]);
  
  // Handle search
  const handleSearch = () => {
    // Build query string for search
    const params = new URLSearchParams();
    if (searchParams.commodityId) params.append('commodityId', searchParams.commodityId.toString());
    if (searchParams.circleId) params.append('circleId', searchParams.circleId.toString());
    if (searchParams.minPrice) params.append('minPrice', searchParams.minPrice.toString());
    if (searchParams.maxPrice) params.append('maxPrice', searchParams.maxPrice.toString());
    if (searchParams.quality) params.append('quality', searchParams.quality);
    if (searchParams.listingType) params.append('type', searchParams.listingType);
    
    // Execute search query
    queryClient.prefetchQuery({
      queryKey: ['/api/listings/search', params.toString()],
      queryFn: getQueryFn({ on401: 'returnNull' })
    });
  };
  
  return (
    <div className="container py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Marketplace</h1>
        <Button asChild>
          <Link href="/marketplace/new">Create Listing</Link>
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Filter sidebar */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter size={18} />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Commodity</label>
              <select 
                className="w-full rounded border p-2"
                onChange={(e) => setSearchParams({
                  ...searchParams,
                  commodityId: e.target.value ? parseInt(e.target.value) : undefined
                })}
              >
                <option value="">All Commodities</option>
                {commoditiesData?.commodities?.map((commodity: any) => (
                  <option key={commodity.id} value={commodity.id}>
                    {commodity.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Circle</label>
              <select 
                className="w-full rounded border p-2"
                onChange={(e) => setSearchParams({
                  ...searchParams,
                  circleId: e.target.value ? parseInt(e.target.value) : undefined
                })}
              >
                <option value="">All Circles</option>
                {circlesData?.circles?.map((circle: any) => (
                  <option key={circle.id} value={circle.id}>
                    {circle.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Price Range</label>
              <div className="flex items-center gap-2">
                <input 
                  type="number" 
                  placeholder="Min" 
                  className="w-1/2 rounded border p-2"
                  onChange={(e) => setSearchParams({
                    ...searchParams,
                    minPrice: e.target.value ? parseFloat(e.target.value) : undefined
                  })}
                />
                <span>-</span>
                <input 
                  type="number" 
                  placeholder="Max" 
                  className="w-1/2 rounded border p-2"
                  onChange={(e) => setSearchParams({
                    ...searchParams,
                    maxPrice: e.target.value ? parseFloat(e.target.value) : undefined
                  })}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Quality</label>
              <select 
                className="w-full rounded border p-2"
                onChange={(e) => setSearchParams({
                  ...searchParams,
                  quality: e.target.value || undefined
                })}
              >
                <option value="">All Qualities</option>
                {QUALITY_OPTIONS.map((quality) => (
                  <option key={quality} value={quality}>
                    {quality}
                  </option>
                ))}
              </select>
            </div>
            
            <Button 
              className="w-full mt-4" 
              onClick={handleSearch}
            >
              <Search size={16} className="mr-2" />
              Search
            </Button>
          </CardContent>
        </Card>
        
        {/* Listings content */}
        <div className="md:col-span-3 space-y-6">
          <Tabs defaultValue="buy" onValueChange={setTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger 
                value="buy"
                className="data-[state=active]:bg-green-100 data-[state=active]:text-green-900"
              >
                <TrendingUp size={16} className="mr-2" />
                Buy
              </TabsTrigger>
              <TabsTrigger 
                value="sell"
                className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-900"
              >
                <TrendingDown size={16} className="mr-2" />
                Sell
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="buy" className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {listingsLoading ? (
                  <>
                    {[...Array(6)].map((_, i) => (
                      <AnimatedCardSkeleton 
                        key={i} 
                        variant="shimmer" 
                        imageHeight={0}
                        lines={6}
                        hasFooter={true}
                        className="h-full"
                      />
                    ))}
                  </>
                ) : listingsData?.listings?.length === 0 ? (
                  <div className="col-span-full text-center py-12">
                    <p className="text-lg text-muted-foreground">No sell listings found</p>
                  </div>
                ) : (
                  listingsData?.listings
                    ?.filter((listing: any) => listing.listingType === 'sell')
                    .map((listing: any) => (
                      <ListingCard key={listing.id} listing={listing} />
                    ))
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="sell" className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {listingsLoading ? (
                  <>
                    {[...Array(6)].map((_, i) => (
                      <AnimatedCardSkeleton 
                        key={i} 
                        variant="shimmer" 
                        imageHeight={0}
                        lines={6}
                        hasFooter={true}
                        className="h-full"
                      />
                    ))}
                  </>
                ) : listingsData?.listings?.length === 0 ? (
                  <div className="col-span-full text-center py-12">
                    <p className="text-lg text-muted-foreground">No buy listings found</p>
                  </div>
                ) : (
                  listingsData?.listings
                    ?.filter((listing: any) => listing.listingType === 'buy')
                    .map((listing: any) => (
                      <ListingCard key={listing.id} listing={listing} />
                    ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function ListingCard({ listing }: { listing: any }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl">{listing.commodity?.name}</CardTitle>
            <CardDescription className="flex items-center mt-1">
              <Building2 size={12} className="mr-1" />
              {listing.circle?.name}
            </CardDescription>
          </div>
          <Badge variant={listing.listingType === 'buy' ? "outline" : "default"}>
            {listing.listingType === 'buy' ? (
              <div className="flex items-center gap-1">
                <TrendingUp size={12} />
                <span>Buying</span>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <TrendingDown size={12} />
                <span>Selling</span>
              </div>
            )}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="text-sm text-muted-foreground flex items-center">
              <DollarSign size={14} className="mr-1" />
              Price
            </p>
            <p className="font-medium">₹{listing.pricePerUnit}/kg</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground flex items-center">
              <Scale size={14} className="mr-1" />
              Quantity
            </p>
            <p className="font-medium">{listing.quantity} kg</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground flex items-center">
              <BarChart size={14} className="mr-1" />
              Quality
            </p>
            <p className="font-medium">{listing.quality}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground flex items-center">
              <PieChart size={14} className="mr-1" />
              {listing.minQuantity ? 'Min. Order' : 'Available'}
            </p>
            <p className="font-medium">
              {listing.minQuantity ? listing.minQuantity + ' kg' : 'Immediate'}
            </p>
          </div>
        </div>
        
        {listing.description && (
          <>
            <Separator className="my-3" />
            <p className="text-sm text-muted-foreground line-clamp-2">
              {listing.description}
            </p>
          </>
        )}
      </CardContent>
      <CardFooter className="pt-2">
        <Button className="w-full" asChild>
          <Link href={`/marketplace/${listing.id}`}>
            {listing.listingType === 'buy' ? 'Offer to Sell' : 'Make Offer'}
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}