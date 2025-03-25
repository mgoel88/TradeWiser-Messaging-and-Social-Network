import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader, CircleDot } from "lucide-react";
import CommodityItem from "@/components/commodity/CommodityItem";
import ConnectionItem from "@/components/connections/ConnectionItem";
import { Map } from "@/components/ui/map";

const RightSidebar = () => {
  // Fetch trending commodities
  const { data: trendingData, isLoading: trendingLoading } = useQuery({
    queryKey: ['/api/commodities/trending'],
  });

  const trendingCommodities = trendingData?.trendingCommodities || [];

  return (
    <aside className="w-full lg:w-1/4 space-y-6">
      {/* Trending Commodities */}
      <Card className="overflow-hidden">
        <CardHeader className="px-4 py-3 bg-gray-50 border-b border-gray-100">
          <h3 className="font-heading font-semibold">Trending Commodities</h3>
        </CardHeader>
        <div className="divide-y divide-gray-100">
          {trendingLoading ? (
            <div className="p-4 flex justify-center">
              <Loader className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : trendingCommodities.length > 0 ? (
            trendingCommodities.map((item) => (
              <CommodityItem 
                key={item.id} 
                commodity={item.commodity}
                price={item.currentPrice}
                priceChange={item.priceChange}
                location={item.circleName}
              />
            ))
          ) : (
            <div className="p-4 text-center text-gray-500 text-sm">
              No trending commodities available.
            </div>
          )}
          <div className="p-3 text-center">
            <Link href="/commodities">
              <Button variant="link" className="text-primary text-sm p-0 h-auto">
                View All Commodities
              </Button>
            </Link>
          </div>
        </div>
      </Card>

      {/* Map View */}
      <Card className="overflow-hidden">
        <CardHeader className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-heading font-semibold">Circles Near You</h3>
          <Link href="/circles/map">
            <Button variant="link" className="text-primary text-sm p-0 h-auto">
              Full Map
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="p-4">
          <Map height="12rem" />
          <div className="mt-3 space-y-2">
            <div className="flex items-center px-3 py-2 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-primary">
                <CircleDot className="h-4 w-4" />
              </div>
              <div className="ml-3 flex-1">
                <p className="font-medium text-sm">Bikaner APMC Circle</p>
                <p className="text-xs text-gray-500">12 km from you</p>
              </div>
              <Link href="/circles/1">
                <Button variant="link" className="text-primary text-sm p-0 h-auto">
                  View
                </Button>
              </Link>
            </div>
            <div className="flex items-center px-3 py-2 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-primary">
                <CircleDot className="h-4 w-4" />
              </div>
              <div className="ml-3 flex-1">
                <p className="font-medium text-sm">Jodhpur Trading Circle</p>
                <p className="text-xs text-gray-500">75 km from you</p>
              </div>
              <Link href="/circles/2">
                <Button variant="link" className="text-primary text-sm p-0 h-auto">
                  View
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recommended Connections */}
      <Card className="overflow-hidden">
        <CardHeader className="px-4 py-3 bg-gray-50 border-b border-gray-100">
          <h3 className="font-heading font-semibold">Recommended Connections</h3>
        </CardHeader>
        <div className="divide-y divide-gray-100">
          <ConnectionItem 
            user={{
              id: 5,
              name: "Amit Sharma",
              userType: "trader",
              avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e",
              bio: "Specializes in Chana and Wheat trading",
              circle: "Delhi Circle"
            }} 
            showConnect={true}
          />
          <ConnectionItem 
            user={{
              id: 6,
              name: "Vijay Processors Ltd.",
              userType: "processor",
              avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a",
              bio: "Soybean processing company looking for suppliers",
              circle: "Indore Circle"
            }} 
            showConnect={true}
          />
          <div className="p-3 text-center">
            <Link href="/connections/recommended">
              <Button variant="link" className="text-primary text-sm p-0 h-auto">
                View More Recommendations
              </Button>
            </Link>
          </div>
        </div>
      </Card>
    </aside>
  );
};

export default RightSidebar;
