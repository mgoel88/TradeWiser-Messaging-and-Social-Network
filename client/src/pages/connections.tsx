import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { apiRequest, getQueryFn } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import ConnectionItem from '@/components/connections/ConnectionItem';
import RecommendedConnections from '@/components/connections/RecommendedConnections';
import { Input } from '@/components/ui/input';
import { Search, UserPlus, Users } from 'lucide-react';

export default function ConnectionsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch connections
  const { data: connectionsData, isLoading } = useQuery({
    queryKey: ['/api/connections'], 
    queryFn: getQueryFn({ on401: 'returnNull' })
  });

  // Fetch pending connection requests
  const { data: pendingData, isLoading: isPendingLoading } = useQuery({
    queryKey: ['/api/connections/pending'], 
    queryFn: getQueryFn({ on401: 'returnNull' })
  });

  // Accept connection mutation
  const acceptMutation = useMutation({
    mutationFn: (connectionId: number) => {
      return apiRequest({
        method: 'PATCH',
        endpoint: `/api/connections/${connectionId}/accept`
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/connections'] });
      queryClient.invalidateQueries({ queryKey: ['/api/connections/pending'] });
      toast({
        title: 'Connection accepted',
        description: 'The connection request has been accepted.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to accept connection request.',
        variant: 'destructive',
      });
    }
  });

  // Reject connection mutation
  const rejectMutation = useMutation({
    mutationFn: (connectionId: number) => {
      return apiRequest({
        method: 'PATCH',
        endpoint: `/api/connections/${connectionId}/reject`
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/connections'] });
      queryClient.invalidateQueries({ queryKey: ['/api/connections/pending'] });
      toast({
        title: 'Connection rejected',
        description: 'The connection request has been rejected.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to reject connection request.',
        variant: 'destructive',
      });
    }
  });

  // Filter connections based on search query
  const filteredConnections = connectionsData?.connections?.filter(
    (connection: any) => 
      connection.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      connection.user.userType.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="container max-w-screen-lg mx-auto py-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Connections</h1>
          <p className="text-muted-foreground">Manage your network of agricultural partners</p>
        </div>
      </div>

      <Tabs defaultValue="connections" className="w-full">
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="connections">
            <Users className="h-4 w-4 mr-2" />
            My Connections
          </TabsTrigger>
          <TabsTrigger value="pending">
            <UserPlus className="h-4 w-4 mr-2" />
            Pending
          </TabsTrigger>
          <TabsTrigger value="recommended">
            <UserPlus className="h-4 w-4 mr-2" />
            Recommended
          </TabsTrigger>
        </TabsList>

        <TabsContent value="connections">
          <div className="relative mb-4">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search connections..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="p-4">
                  <div className="flex items-center space-x-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[200px]" />
                      <Skeleton className="h-4 w-[150px]" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : !filteredConnections.length ? (
            <Card className="p-6 text-center">
              <p className="text-muted-foreground mb-4">You don't have any connections yet.</p>
              <p className="text-sm">Connections help you build a strong network of agricultural partners for trading.</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredConnections.map((connection: any) => (
                <ConnectionItem 
                  key={connection.id} 
                  user={connection.user} 
                  connectionId={connection.id}
                  status="accepted"
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="pending">
          {isPendingLoading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <Card key={i} className="p-4">
                  <div className="flex items-center space-x-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[200px]" />
                      <Skeleton className="h-4 w-[150px]" />
                    </div>
                    <div className="flex space-x-2 ml-auto">
                      <Skeleton className="h-9 w-[60px]" />
                      <Skeleton className="h-9 w-[60px]" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : !pendingData?.connections?.length ? (
            <Card className="p-6 text-center">
              <p className="text-muted-foreground">You don't have any pending connection requests.</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {pendingData.connections.map((connection: any) => (
                <Card key={connection.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <ConnectionItem 
                      user={connection.user} 
                      status="pending"
                      showConnect={false}
                    />
                    <div className="flex space-x-2">
                      <Button 
                        size="sm" 
                        variant="default" 
                        onClick={() => acceptMutation.mutate(connection.id)}
                        disabled={acceptMutation.isPending}
                      >
                        Accept
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => rejectMutation.mutate(connection.id)}
                        disabled={rejectMutation.isPending}
                      >
                        Decline
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="recommended">
          <RecommendedConnections />
        </TabsContent>
      </Tabs>
    </div>
  );
}