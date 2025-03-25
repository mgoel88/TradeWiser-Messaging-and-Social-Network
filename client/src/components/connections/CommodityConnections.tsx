import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getQueryFn, apiRequest } from '@/lib/queryClient';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { StarIcon, HandshakeIcon, UsersIcon, Wheat } from 'lucide-react';

interface CommodityConnectionsProps {
  commodityId: number;
  limit?: number;
}

const CommodityConnections = ({ commodityId, limit = 3 }: CommodityConnectionsProps) => {
  const { toast } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: [`/api/recommendations/commodity/${commodityId}`],
    queryFn: getQueryFn({ on401: 'returnNull' }),
    enabled: !!commodityId
  });

  // Handle connection request
  const handleConnect = async (userId: number) => {
    try {
      await apiRequest({
        method: 'POST',
        endpoint: '/api/connections',
        data: { receiverId: userId }
      });
      
      toast({
        title: 'Connection request sent',
        description: 'Your connection request has been sent successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send connection request. Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-48" />
        </div>
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
    );
  }
  
  if (!data?.recommendations?.length) {
    return (
      <Card className="mt-4">
        <CardContent className="py-6 text-center">
          <Wheat className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground">No connection recommendations available for this commodity.</p>
          <p className="text-sm text-muted-foreground/70 mt-1">
            Try connecting with more users or updating your commodity interests.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Get only limited number of recommendations
  const recommendations = data.recommendations.slice(0, limit);
  const commodityName = data.commodity?.name || 'this commodity';
  
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">People interested in {commodityName}</h3>
        <Badge variant="outline" className="flex items-center">
          <UsersIcon className="h-3 w-3 mr-1" />
          {data.recommendations.length} connections
        </Badge>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {recommendations.map((rec: any) => (
          <Card key={rec.user.id}>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={rec.user.avatar} alt={rec.user.name} />
                  <AvatarFallback>{rec.user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-base flex items-center">
                    {rec.user.name}
                    {rec.user.kycVerified && (
                      <Badge variant="outline" className="ml-2 bg-green-50 text-green-700 border-green-200 text-xs">
                        <StarIcon className="h-2.5 w-2.5 mr-0.5" /> Verified
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription>
                    {rec.user.userType}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pb-2">
              {rec.user.bio && (
                <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{rec.user.bio}</p>
              )}
              <div className="mt-2 flex flex-wrap gap-1.5">
                {rec.matchReasons.slice(0, 3).map((reason: string, index: number) => (
                  <Badge key={index} variant="outline" className="text-xs py-0.5">
                    {reason}
                  </Badge>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={() => handleConnect(rec.user.id)} 
                className="w-full" 
                size="sm"
                variant="secondary"
              >
                <HandshakeIcon className="h-4 w-4 mr-2" />
                Connect
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default CommodityConnections;