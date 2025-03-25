import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getQueryFn, apiRequest } from '@/lib/queryClient';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { UserPlus, Store, Briefcase, MapPin, Users, Star } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import CommodityConnections from './CommodityConnections';

interface RecommendedUser {
  user: {
    id: number;
    name: string;
    username: string;
    userType: string;
    avatar?: string;
    bio?: string;
    business?: string;
    kycVerified: boolean;
    nativeCircleId?: number;
  };
  score: number;
  matchReasons: string[];
}

const RecommendedConnections = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCommodityId, setSelectedCommodityId] = useState<number | null>(null);

  // Fetch general recommendations
  const { data: generalRecommendations, isLoading: isGeneralLoading } = useQuery({
    queryKey: ['/api/recommendations'],
    queryFn: getQueryFn({ on401: 'returnNull' })
  });

  // Fetch business complementary recommendations
  const { data: businessRecommendations, isLoading: isBusinessLoading } = useQuery({
    queryKey: ['/api/recommendations/business'],
    queryFn: getQueryFn({ on401: 'returnNull' })
  });

  // Fetch user's commodities to show commodity-specific recommendations
  const { data: userCommodities, isLoading: isCommoditiesLoading } = useQuery({
    queryKey: ['/api/user/commodities'],
    queryFn: getQueryFn({ on401: 'returnNull' })
  });

  // Handle connection request
  const connectMutation = useMutation({
    mutationFn: (userId: number) => {
      return apiRequest({
        method: 'POST',
        endpoint: '/api/connections',
        data: { receiverId: userId }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/recommendations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/recommendations/business'] });
      
      toast({
        title: 'Connection request sent',
        description: 'Your connection request has been sent successfully.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to send connection request. Please try again.',
        variant: 'destructive',
      });
    }
  });

  const renderRecommendation = (recommendation: RecommendedUser, index: number) => (
    <Card key={recommendation.user.id || index} className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={recommendation.user.avatar} alt={recommendation.user.name} />
            <AvatarFallback>{recommendation.user.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-base flex items-center">
              {recommendation.user.name}
              {recommendation.user.kycVerified && (
                <Badge variant="outline" className="ml-2 bg-green-50 text-green-700 border-green-200 text-xs">
                  <Star className="h-2.5 w-2.5 mr-0.5" /> Verified
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              {recommendation.user.userType}
              {recommendation.user.business && ` · ${recommendation.user.business}`}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        {recommendation.user.bio && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{recommendation.user.bio}</p>
        )}
        <div className="mt-2 flex flex-wrap gap-1.5">
          {recommendation.matchReasons.slice(0, 3).map((reason, idx) => (
            <Badge key={idx} variant="outline" className="text-xs py-0.5">
              {reason}
            </Badge>
          ))}
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={() => connectMutation.mutate(recommendation.user.id)} 
          className="w-full" 
          size="sm"
          variant="default"
          disabled={connectMutation.isPending}
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Connect
        </Button>
      </CardFooter>
    </Card>
  );

  return (
    <Tabs defaultValue="general" className="w-full">
      <TabsList className="w-full">
        <TabsTrigger value="general" className="flex-1">
          <Users className="h-4 w-4 mr-2" />
          General Recommendations
        </TabsTrigger>
        <TabsTrigger value="business" className="flex-1">
          <Briefcase className="h-4 w-4 mr-2" />
          Business Complementary
        </TabsTrigger>
        <TabsTrigger value="commodity" className="flex-1">
          <Store className="h-4 w-4 mr-2" />
          By Commodity
        </TabsTrigger>
      </TabsList>

      <TabsContent value="general" className="space-y-6 mt-6">
        {isGeneralLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="h-52">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div>
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-4 w-24 mt-1" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pb-2">
                  <Skeleton className="h-4 w-full mt-1" />
                  <Skeleton className="h-4 w-4/5 mt-1" />
                  <div className="mt-3 flex gap-1.5">
                    <Skeleton className="h-6 w-20 rounded-full" />
                    <Skeleton className="h-6 w-20 rounded-full" />
                  </div>
                </CardContent>
                <CardFooter>
                  <Skeleton className="h-9 w-full rounded-md" />
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : !generalRecommendations?.recommendations?.length ? (
          <Card className="p-6 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground font-medium">No recommendations available</p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Try joining more circles or adding more commodity interests to get recommendations.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {generalRecommendations.recommendations.map((recommendation: RecommendedUser, index: number) => 
              renderRecommendation(recommendation, index)
            )}
          </div>
        )}
      </TabsContent>

      <TabsContent value="business" className="space-y-6 mt-6">
        {isBusinessLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="h-52">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div>
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-4 w-24 mt-1" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pb-2">
                  <Skeleton className="h-4 w-full mt-1" />
                  <Skeleton className="h-4 w-4/5 mt-1" />
                  <div className="mt-3 flex gap-1.5">
                    <Skeleton className="h-6 w-20 rounded-full" />
                    <Skeleton className="h-6 w-20 rounded-full" />
                  </div>
                </CardContent>
                <CardFooter>
                  <Skeleton className="h-9 w-full rounded-md" />
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : !businessRecommendations?.recommendations?.length ? (
          <Card className="p-6 text-center">
            <Briefcase className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground font-medium">No business complementary recommendations available</p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Complete your business profile to get better recommendations.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {businessRecommendations.recommendations.map((recommendation: RecommendedUser, index: number) => 
              renderRecommendation(recommendation, index)
            )}
          </div>
        )}
      </TabsContent>

      <TabsContent value="commodity" className="space-y-6 mt-6">
        {isCommoditiesLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-full rounded-md" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="h-52">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div>
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-4 w-24 mt-1" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <Skeleton className="h-4 w-full mt-1" />
                    <Skeleton className="h-4 w-4/5 mt-1" />
                    <div className="mt-3 flex gap-1.5">
                      <Skeleton className="h-6 w-20 rounded-full" />
                      <Skeleton className="h-6 w-20 rounded-full" />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Skeleton className="h-9 w-full rounded-md" />
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        ) : !userCommodities?.commodities?.length ? (
          <Card className="p-6 text-center">
            <Store className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground font-medium">No commodity interests found</p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Add commodity interests to your profile to see recommendations based on specific commodities.
            </p>
          </Card>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-wrap gap-2">
              {userCommodities.commodities.map((commodity: any) => (
                <Badge 
                  key={commodity.id} 
                  variant={selectedCommodityId === commodity.commodityId ? "default" : "outline"}
                  className="cursor-pointer text-sm py-1.5 px-3"
                  onClick={() => setSelectedCommodityId(commodity.commodityId)}
                >
                  {commodity.commodity.name}
                </Badge>
              ))}
              {selectedCommodityId && (
                <Badge 
                  variant="secondary"
                  className="cursor-pointer text-sm py-1.5 px-3"
                  onClick={() => setSelectedCommodityId(null)}
                >
                  Clear
                </Badge>
              )}
            </div>
            
            {selectedCommodityId ? (
              <CommodityConnections commodityId={selectedCommodityId} limit={6} />
            ) : (
              <div className="space-y-8">
                {userCommodities.commodities.slice(0, 3).map((commodity: any) => (
                  <div key={commodity.commodityId}>
                    <CommodityConnections commodityId={commodity.commodityId} />
                    <Separator className="my-8" />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
};

export default RecommendedConnections;