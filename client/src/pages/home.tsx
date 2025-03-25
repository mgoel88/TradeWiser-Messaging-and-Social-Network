import React, { useState } from "react";
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

const Home: React.FC = () => {
  const { toast } = useToast();
  const [feedType, setFeedType] = useState("latest");
  
  // Fetch posts for feed
  const { data: postsData, isLoading, error } = useQuery({
    queryKey: ['/api/posts'],
  });

  // Check if user is authenticated
  const { data: sessionData } = useQuery({
    queryKey: ['/api/auth/session'],
  });

  const isAuthenticated = sessionData?.user;

  // Filter posts based on selected feed type
  const filteredPosts = React.useMemo(() => {
    if (!postsData?.posts) return [];
    
    switch (feedType) {
      case 'circle':
        return postsData.posts.filter((post: any) => post.type === 'circle_update');
      case 'commodity':
        return postsData.posts.filter((post: any) => post.type === 'price_update' || post.commodityId);
      default:
        return postsData.posts;
    }
  }, [postsData, feedType]);

  if (error) {
    toast({
      title: "Error loading feed",
      description: "There was a problem loading the feed. Please try again later.",
      variant: "destructive",
    });
  }

  return (
    <main className="container mx-auto px-4 py-6">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* LEFT SIDEBAR */}
        {isAuthenticated && <Sidebar />}

        {/* MIDDLE SECTION - Feed & Activity */}
        <div className="w-full lg:w-2/4 space-y-6">
          {/* Create Post (only show if logged in) */}
          {isAuthenticated && <CreatePost />}

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
            filteredPosts.map((post: any) => (
              <FeedItem key={post.id} post={post} />
            ))
          ) : (
            <Card className="p-12 text-center">
              <h3 className="text-lg font-medium mb-2">No posts to show</h3>
              <p className="text-gray-500 mb-4">There are no posts in this feed yet.</p>
              {isAuthenticated && (
                <Button 
                  onClick={() => document.querySelector('input[placeholder*="Share market updates"]')?.focus()}
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
