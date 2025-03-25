import React from "react";
import { Link } from "wouter";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ConnectionItemProps {
  user: {
    id: number;
    name: string;
    userType: string;
    avatar?: string;
    bio?: string;
    circle?: string;
    kycVerified?: boolean;
  };
  connectionId?: number;
  status?: string;
  showConnect?: boolean;
}

const ConnectionItem: React.FC<ConnectionItemProps> = ({ 
  user, 
  connectionId, 
  status = "accepted", 
  showConnect = false 
}) => {
  const { toast } = useToast();
  
  const connectMutation = useMutation({
    mutationFn: () => {
      return apiRequest("POST", "/api/connections", {
        receiverId: user.id
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/connections'] });
      toast({
        title: "Connection request sent",
        description: `You've sent a connection request to ${user.name}.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Connection failed",
        description: error instanceof Error ? error.message : "Failed to send connection request",
        variant: "destructive",
      });
    }
  });

  const respondToConnectionMutation = useMutation({
    mutationFn: (response: string) => {
      if (!connectionId) throw new Error("Connection ID is required");
      return apiRequest("PATCH", `/api/connections/${connectionId}`, {
        status: response
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/connections'] });
      queryClient.invalidateQueries({ queryKey: ['/api/connections/pending'] });
      toast({
        title: "Connection updated",
        description: "The connection request has been processed.",
      });
    },
    onError: (error) => {
      toast({
        title: "Action failed",
        description: error instanceof Error ? error.message : "Failed to process connection request",
        variant: "destructive",
      });
    }
  });

  const handleConnect = () => {
    connectMutation.mutate();
  };

  const handleAccept = () => {
    respondToConnectionMutation.mutate("accepted");
  };

  const handleReject = () => {
    respondToConnectionMutation.mutate("rejected");
  };

  const getUserTypeColor = (userType: string) => {
    const colorMap: Record<string, string> = {
      'farmer': 'bg-green-100 text-green-800',
      'trader': 'bg-blue-100 text-blue-800',
      'broker': 'bg-orange-100 text-orange-800',
      'processor': 'bg-purple-100 text-purple-800',
      'business': 'bg-gray-100 text-gray-800'
    };
    
    return colorMap[userType] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="p-4">
      <div className="flex">
        <Link href={`/profile/${user.id}`}>
          <img 
            src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}`} 
            alt={`${user.name}'s profile`} 
            className="w-12 h-12 rounded-full object-cover cursor-pointer"
          />
        </Link>
        <div className="ml-3 flex-1">
          <Link href={`/profile/${user.id}`}>
            <h4 className="font-medium text-sm hover:underline cursor-pointer">{user.name}</h4>
          </Link>
          <div className="flex items-center mt-1">
            <Badge className={`text-xs px-1.5 py-0.5 ${getUserTypeColor(user.userType)}`}>
              {user.userType.charAt(0).toUpperCase() + user.userType.slice(1)}
            </Badge>
            {user.circle && (
              <>
                <span className="mx-1 text-xs text-gray-500">•</span>
                <span className="text-xs text-gray-500">{user.circle}</span>
              </>
            )}
          </div>
          {user.bio && (
            <p className="text-xs text-gray-500 mt-1">
              {user.bio}
            </p>
          )}
        </div>
      </div>
      
      {showConnect && (
        <div className="mt-3 flex space-x-2">
          <Button 
            className="flex-1 bg-primary text-white text-xs py-2 rounded-md hover:bg-primary/90"
            onClick={handleConnect}
            disabled={connectMutation.isPending}
          >
            {connectMutation.isPending ? "Connecting..." : "Connect"}
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="w-10 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
      
      {status === "pending" && connectionId && (
        <div className="mt-3 flex space-x-2">
          <Button
            className="flex-1 bg-primary text-white text-xs py-2 rounded-md hover:bg-primary/90"
            onClick={handleAccept}
            disabled={respondToConnectionMutation.isPending}
          >
            Accept
          </Button>
          <Button
            variant="outline"
            className="flex-1 border-gray-300 text-gray-700 text-xs py-2 rounded-md"
            onClick={handleReject}
            disabled={respondToConnectionMutation.isPending}
          >
            Decline
          </Button>
        </div>
      )}
    </div>
  );
};

export default ConnectionItem;
