import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import {
  PersonIcon,
  StarIcon,
  CircleIcon,
  GemIcon,
  HandshakeIcon
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { apiRequest } from '@/lib/queryClient';
import { Skeleton } from '@/components/ui/skeleton';
import { getQueryFn } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

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
  const [selectedTab, setSelectedTab] = useState('all');
  const { toast } = useToast();

  // Query for general recommendations
  const { data: generalRecommendations, isLoading: isGeneralLoading } = useQuery({
    queryKey: ['/api/recommendations/connections'],
    queryFn: getQueryFn({ on401: 'returnNull' })
  });

  // Query for business recommendations
  const { data: businessRecommendations, isLoading: isBusinessLoading } = useQuery({
    queryKey: ['/api/recommendations/business'],
    queryFn: getQueryFn({ on401: 'returnNull' })
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

  return (
    <div className="space-y-4">
      <Tabs defaultValue="all" value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="all">All Recommendations</TabsTrigger>
          <TabsTrigger value="business">Business Matches</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-4 space-y-4">
          {isGeneralLoading ? (
            <RecommendationSkeleton count={3} />
          ) : !generalRecommendations?.recommendations?.length ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground">No recommendations available yet. Try following more commodities or joining circles to get recommendations.</p>
              </CardContent>
            </Card>
          ) : (
            generalRecommendations.recommendations.map((rec: RecommendedUser) => (
              <RecommendationCard 
                key={rec.user.id} 
                recommendation={rec} 
                onConnect={() => handleConnect(rec.user.id)} 
              />
            ))
          )}
        </TabsContent>
        
        <TabsContent value="business" className="mt-4 space-y-4">
          {isBusinessLoading ? (
            <RecommendationSkeleton count={3} />
          ) : !businessRecommendations?.recommendations?.length ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground">No business recommendations available yet. Try creating marketplace listings to match with potential traders.</p>
              </CardContent>
            </Card>
          ) : (
            businessRecommendations.recommendations.map((rec: RecommendedUser) => (
              <RecommendationCard 
                key={rec.user.id} 
                recommendation={rec} 
                onConnect={() => handleConnect(rec.user.id)}
                businessFocus={true}
              />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Recommendation Card Component
const RecommendationCard = ({ 
  recommendation, 
  onConnect,
  businessFocus = false
}: { 
  recommendation: RecommendedUser, 
  onConnect: () => void,
  businessFocus?: boolean
}) => {
  const { user, score, matchReasons } = recommendation;
  
  // Get icon for user type
  const getUserTypeIcon = (userType: string) => {
    switch (userType.toLowerCase()) {
      case 'farmer':
        return <span className="mr-1">🌾</span>;
      case 'trader':
        return <span className="mr-1">🏪</span>;
      case 'processor':
        return <span className="mr-1">🏭</span>;
      case 'broker':
        return <span className="mr-1">🤝</span>;
      default:
        return <span className="mr-1">👤</span>;
    }
  };
  
  // Format score for display
  const formattedScore = Math.round(score);
  
  return (
    <Card className={businessFocus ? "border-primary/30" : ""}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-base flex items-center">
                {user.name}
                {user.kycVerified && (
                  <Badge variant="outline" className="ml-2 bg-green-50 text-green-700 border-green-200">
                    <StarIcon className="h-3 w-3 mr-1" /> Verified
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="flex items-center">
                {getUserTypeIcon(user.userType)} {user.userType}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center">
            <Badge variant="secondary" className="flex items-center justify-center h-8 w-8 rounded-full">
              {formattedScore}%
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        {user.bio && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{user.bio}</p>
        )}
        {user.business && (
          <p className="text-sm flex items-center">
            <GemIcon className="h-3.5 w-3.5 mr-1.5 text-primary" />
            <span className="font-medium text-primary">{user.business}</span>
          </p>
        )}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {matchReasons.map((reason, index) => (
            <Badge key={index} variant="outline" className="text-xs py-0.5">
              {reason}
            </Badge>
          ))}
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={onConnect} 
          className="w-full" 
          size="sm"
          variant={businessFocus ? "default" : "secondary"}
        >
          <HandshakeIcon className="h-4 w-4 mr-2" />
          Connect
        </Button>
      </CardFooter>
    </Card>
  );
};

// Skeleton loader for recommendations
const RecommendationSkeleton = ({ count = 3 }: { count?: number }) => {
  return (
    <>
      {Array(count).fill(0).map((_, i) => (
        <Card key={i}>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div>
                  <Skeleton className="h-5 w-[120px]" />
                  <Skeleton className="h-4 w-[80px] mt-1" />
                </div>
              </div>
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
          </CardHeader>
          <CardContent className="pb-2">
            <Skeleton className="h-4 w-full mt-2" />
            <Skeleton className="h-4 w-4/5 mt-2" />
            <div className="mt-3 flex gap-1.5">
              <Skeleton className="h-6 w-[70px] rounded-full" />
              <Skeleton className="h-6 w-[90px] rounded-full" />
              <Skeleton className="h-6 w-[60px] rounded-full" />
            </div>
          </CardContent>
          <CardFooter>
            <Skeleton className="h-9 w-full rounded-md" />
          </CardFooter>
        </Card>
      ))}
    </>
  );
};

export default RecommendedConnections;