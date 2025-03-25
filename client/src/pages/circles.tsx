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
import { CircleDot, Loader, Search, Plus, Users, MapPin } from "lucide-react";
import { Map } from "@/components/ui/map";
import CircleItem from "@/components/circle/CircleItem";
import { AnimatedSkeleton, AnimatedCardSkeleton } from "@/components/ui/animated-skeleton";
import { STATES } from "@/lib/constants";

const Circles: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [stateFilter, setStateFilter] = useState("All");
  
  // Fetch all circles
  const { data: circlesData, isLoading } = useQuery({
    queryKey: ['/api/circles'],
  });
  
  // Fetch user's circles
  const { data: sessionData } = useQuery({
    queryKey: ['/api/auth/session'],
  });
  
  const { data: userCirclesData } = useQuery({
    queryKey: ['/api/users', sessionData?.user?.id],
    enabled: !!sessionData?.user?.id,
  });
  
  const userCircleIds = React.useMemo(() => {
    if (!userCirclesData?.circles) return new Set();
    return new Set(userCirclesData.circles.map((c: any) => c.id));
  }, [userCirclesData]);
  
  // Filter and sort circles
  const filteredCircles = React.useMemo(() => {
    if (!circlesData?.circles) return [];
    
    return circlesData.circles
      .filter((circle: any) => {
        // Apply search filter
        if (searchQuery && !circle.name.toLowerCase().includes(searchQuery.toLowerCase())) {
          return false;
        }
        
        // Apply state filter
        if (stateFilter !== "All" && circle.state !== stateFilter) {
          return false;
        }
        
        return true;
      })
      .sort((a: any, b: any) => {
        // Sort by user membership first, then by name
        const aIsMember = userCircleIds.has(a.id);
        const bIsMember = userCircleIds.has(b.id);
        
        if (aIsMember && !bIsMember) return -1;
        if (!aIsMember && bIsMember) return 1;
        
        return a.name.localeCompare(b.name);
      });
  }, [circlesData, searchQuery, stateFilter, userCircleIds]);
  
  return (
    <main className="container mx-auto px-4 py-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold mb-1">Agricultural Circles</h1>
            <p className="text-gray-600">Explore and join circles to connect with stakeholders in your region</p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" /> Create Circle
          </Button>
        </div>
        
        {/* Circles content */}
        <Tabs defaultValue="list" className="space-y-6">
          <Card>
            <TabsList className="w-full flex border-b justify-start rounded-none p-0">
              <TabsTrigger value="list" className="flex items-center">
                <Users className="h-4 w-4 mr-2" /> List View
              </TabsTrigger>
              <TabsTrigger value="map" className="flex items-center">
                <MapPin className="h-4 w-4 mr-2" /> Map View
              </TabsTrigger>
            </TabsList>
          </Card>
          
          {/* Filter controls */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search circles by name..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <select
              className="bg-white border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
            >
              <option value="All">All States</option>
              {STATES.map((state) => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
          </div>
          
          <TabsContent value="list" className="space-y-6 m-0">
            {isLoading ? (
              <Card>
                <CardHeader className="pb-2">
                  <AnimatedSkeleton className="h-7 w-48" variant="shimmer" />
                </CardHeader>
                <CardContent>
                  <div className="divide-y divide-gray-100">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="py-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <AnimatedSkeleton className="w-12 h-12 rounded-full" variant="shimmer" />
                            <div>
                              <div className="flex items-center flex-wrap gap-2 mb-2">
                                <AnimatedSkeleton className="h-6 w-48" variant="shimmer" />
                                <AnimatedSkeleton className="h-5 w-24" variant="shimmer" />
                              </div>
                              <AnimatedSkeleton className="h-4 w-72 mb-2" variant="shimmer" />
                              <div className="flex flex-wrap gap-2 mt-2">
                                <AnimatedSkeleton className="h-6 w-16" variant="shimmer" />
                                <AnimatedSkeleton className="h-6 w-24" variant="shimmer" />
                                <AnimatedSkeleton className="h-6 w-20" variant="shimmer" />
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2 ml-auto">
                            <AnimatedSkeleton className="h-9 w-28" variant="shimmer" />
                            <AnimatedSkeleton className="h-9 w-28" variant="shimmer" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : filteredCircles.length > 0 ? (
              <Card>
                <CardHeader className="pb-2">
                  <h2 className="font-heading font-semibold text-lg">
                    {filteredCircles.length} {filteredCircles.length === 1 ? 'Circle' : 'Circles'} Found
                  </h2>
                </CardHeader>
                <CardContent>
                  <div className="divide-y divide-gray-100">
                    {filteredCircles.map((circle: any) => (
                      <div key={circle.id} className="py-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-primary shrink-0">
                              <CircleDot className="h-6 w-6" />
                            </div>
                            <div>
                              <div className="flex items-center flex-wrap gap-2">
                                <Link href={`/circles/${circle.id}`}>
                                  <h3 className="font-medium text-lg hover:underline cursor-pointer">{circle.name}</h3>
                                </Link>
                                {circle.isMandi && (
                                  <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                                    APMC Mandi
                                  </Badge>
                                )}
                                {userCircleIds.has(circle.id) && (
                                  <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                                    Member
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-600">{circle.description || `Agricultural circle in ${circle.district}, ${circle.state}`}</p>
                              <div className="flex flex-wrap gap-2 mt-2">
                                <Badge variant="outline" className="bg-gray-100">
                                  {circle.state}
                                </Badge>
                                {circle.mainCommodities && circle.mainCommodities.map((commodity: string) => (
                                  <Badge key={commodity} variant="outline" className="bg-primary bg-opacity-10 text-primary">
                                    {commodity}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2 ml-auto">
                            <Link href={`/circles/${circle.id}`}>
                              <Button variant="outline">View Details</Button>
                            </Link>
                            {!userCircleIds.has(circle.id) && (
                              <Button>Join Circle</Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="p-12 text-center">
                <CircleDot className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <h3 className="text-lg font-medium mb-1">No circles found</h3>
                <p className="text-gray-500 mb-4">
                  {searchQuery || stateFilter !== "All" 
                    ? "Try adjusting your filters to find more circles."
                    : "There are no circles available at the moment."}
                </p>
                <Button>
                  <Plus className="h-4 w-4 mr-2" /> Create a new circle
                </Button>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="map" className="m-0">
            <Card>
              <CardHeader className="pb-2">
                <h2 className="font-heading font-semibold text-lg">Circle Map View</h2>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <Map height="400px" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {isLoading ? (
                    <>
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className="flex items-center p-3 bg-gray-50 rounded-lg">
                          <AnimatedSkeleton className="w-8 h-8 rounded-full" variant="shimmer" />
                          <div className="ml-3 flex-1">
                            <AnimatedSkeleton className="h-4 w-32 mb-1" variant="shimmer" />
                            <AnimatedSkeleton className="h-3 w-20" variant="shimmer" />
                          </div>
                          <AnimatedSkeleton className="h-6 w-12" variant="shimmer" />
                        </div>
                      ))}
                    </>
                  ) : filteredCircles.slice(0, 4).map((circle: any) => (
                    <div key={circle.id} className="flex items-center p-3 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-primary">
                        <CircleDot className="h-4 w-4" />
                      </div>
                      <div className="ml-3 flex-1">
                        <Link href={`/circles/${circle.id}`}>
                          <p className="font-medium text-sm hover:underline cursor-pointer">{circle.name}</p>
                        </Link>
                        <p className="text-xs text-gray-500">{circle.state}</p>
                      </div>
                      <Link href={`/circles/${circle.id}`}>
                        <Button variant="link" className="text-primary text-sm p-0 h-auto">
                          View
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        {/* My Circles Section */}
        {sessionData?.user && (
          <Card className="mt-6">
            <CardHeader className="pb-2">
              <h2 className="font-heading font-semibold text-lg">My Circles</h2>
            </CardHeader>
            <CardContent>
              {!userCirclesData?.circles ? (
                <div className="divide-y divide-gray-100">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="py-4">
                      <div className="flex items-start gap-3">
                        <AnimatedSkeleton className="w-10 h-10 rounded-full" variant="shimmer" />
                        <div className="flex-1">
                          <AnimatedSkeleton className="h-5 w-48 mb-2" variant="shimmer" />
                          <AnimatedSkeleton className="h-4 w-64 mb-1" variant="shimmer" />
                          <div className="flex gap-2 mt-2">
                            <AnimatedSkeleton className="h-6 w-16" variant="shimmer" />
                            <AnimatedSkeleton className="h-6 w-20" variant="shimmer" />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : userCirclesData.circles.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {userCirclesData.circles.map((circle: any) => (
                    <CircleItem 
                      key={circle.id} 
                      circle={circle}
                      isNative={circle.id === sessionData.user.nativeCircleId}
                    />
                  ))}
                </div>
              ) : (
                <div className="py-6 text-center">
                  <CircleDot className="h-10 w-10 mx-auto mb-3 text-gray-300" />
                  <p className="text-gray-500">You haven't joined any circles yet.</p>
                  <Button className="mt-4">Browse Circles</Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
};

export default Circles;
