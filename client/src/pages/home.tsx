import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/Sidebar";
import RightSidebar from "@/components/layout/RightSidebar";
import CreatePost from "@/components/feed/CreatePost";
import FeedItem from "@/components/feed/FeedItem";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader } from "lucide-react";
import { getQueryFn } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";

const Home: React.FC = () => {
  const { toast } = useToast();
  const [feedType, setFeedType] = useState("latest");
  const { user } = useAuth();
  
  // Define post data types
  interface Post {
    id: number;
    content: string;
    type: string;
    createdAt: string;
    imageUrl?: string;
    commodityId?: number;
    metadata?: {
      // For price_update posts
      currentPrice?: string;
      priceChange?: string;
      changeDirection?: string;
      arrivals?: string;
      quality?: string;
      
      // For circle_update posts
      activeBuyers?: string;
      topCommodity?: string;
      priceTrend?: string;
      trendDirection?: string;
      
      // For news posts
      headline?: string;
      summary?: string;
      url?: string;
    };
    user: {
      id: number;
      name: string;
      username: string;
      avatar: string;
      userType: string;
      kycVerified: boolean;
    };
    circle?: {
      id: number;
      name: string;
    };
    commodity?: {
      id: number;
      name: string;
      icon: string;
    };
  }
  
  interface PostsData {
    posts: Post[];
  }
  
  // Fetch posts for feed
  const { data: postsData, isLoading, error } = useQuery<PostsData | null>({
    queryKey: ['/api/posts'],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  // Filter posts based on selected feed type
  const filteredPosts = React.useMemo(() => {
    // Handle case where postsData might be null or posts array might not exist
    const posts = postsData?.posts || [];
    
    switch (feedType) {
      case 'circle':
        return posts.filter((post: Post) => post.type === 'circle_update');
      case 'commodity':
        return posts.filter((post: Post) => post.type === 'price_update' || post.commodityId);
      default:
        return posts;
    }
  }, [postsData, feedType]);

  // Handle error in useEffect to avoid re-renders
  useEffect(() => {
    if (error) {
      toast({
        title: "Error loading feed",
        description: "There was a problem loading the feed. Please try again later.",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  return (
    <main className="container mx-auto px-4 py-6">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* LEFT SIDEBAR */}
        {user && <Sidebar />}

        {/* MIDDLE SECTION - Feed & Activity */}
        <div className="w-full lg:w-2/4 space-y-6">
          {/* Create Post (only show if logged in) */}
          {user && <CreatePost />}

          {/* Feed Filter Tabs */}
          <Card className="overflow-hidden">
            <Tabs defaultValue="latest" onValueChange={setFeedType}>
              <TabsList className="w-full grid grid-cols-3">
                <TabsTrigger value="latest">Latest Updates</TabsTrigger>
                <TabsTrigger value="circle">Circle Updates</TabsTrigger>
                <TabsTrigger value="commodity">Commodity News</TabsTrigger>
              </TabsList>
            </Tabs>
          </Card>

          {/* Feed Items */}
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredPosts.length > 0 ? (
            filteredPosts.map((post: Post) => (
              <FeedItem key={post.id} post={post} />
            ))
          ) : (
            <Card className="p-12 text-center">
              <h3 className="text-lg font-medium mb-2">No posts to show</h3>
              <p className="text-gray-500 mb-4">There are no posts in this feed yet.</p>
              {user && (
                <Button 
                  onClick={() => {
                    // TypeScript-safe focus for DOM element
                    const input = document.querySelector('input[placeholder*="Share market updates"]') as HTMLInputElement;
                    if (input) input.focus();
                  }}
                >
                  Create your first post
                </Button>
              )}
            </Card>
          )}
        </div>

        {/* RIGHT SIDEBAR */}
        <RightSidebar />
      </div>
    </main>
  );
};

export default Home;
