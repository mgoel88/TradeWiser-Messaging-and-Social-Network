import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThumbsUp, MessageSquare, Share, Bookmark, MoreHorizontal, ChevronDown, ChevronUp, CheckCircle } from "lucide-react";
import CommodityCard from "./CommodityCard";
import CircleActivityCard from "./CircleActivityCard";
import NewsCard from "./NewsCard";
import { Link } from "wouter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface FeedItemProps {
  post: {
    id: number;
    content: string;
    type: string;
    createdAt: string;
    imageUrl?: string;
    metadata?: Record<string, any>;
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
  };
}

const FeedItem: React.FC<FeedItemProps> = ({ post }) => {
  // Check if post or necessary properties are undefined
  if (!post || !post.user) {
    return (
      <Card className="mb-6 overflow-hidden">
        <CardContent className="p-4">
          <p className="text-gray-500">Post data unavailable</p>
        </CardContent>
      </Card>
    );
  }
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const secondsAgo = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (secondsAgo < 60) return 'just now';
    if (secondsAgo < 3600) return `${Math.floor(secondsAgo / 60)} minutes ago`;
    if (secondsAgo < 86400) return `${Math.floor(secondsAgo / 3600)} hours ago`;
    if (secondsAgo < 604800) return `${Math.floor(secondsAgo / 86400)} days ago`;
    
    return date.toLocaleDateString();
  };

  const getUserTypeLabel = (userType: string) => {
    const typeMap: Record<string, string> = {
      'farmer': 'Farmer',
      'trader': 'Trader',
      'broker': 'Broker',
      'processor': 'Processor',
      'business': 'Business'
    };
    
    return typeMap[userType] || userType;
  };

  const getBadgeColor = (userType: string) => {
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
    <Card className="mb-6 overflow-hidden">
      <CardContent className="p-4">
        {/* Post Header */}
        <div className="flex items-start">
          <Link href={`/profile/${post.user.id}`}>
            <img 
              src={post.user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.user.name)}`} 
              alt={`${post.user.name}'s avatar`} 
              className="w-10 h-10 rounded-full object-cover mr-3 cursor-pointer"
            />
          </Link>
          <div className="flex-1">
            <div className="flex items-center">
              <Link href={`/profile/${post.user.id}`}>
                <h4 className="font-medium cursor-pointer hover:underline">{post.user.name}</h4>
              </Link>
              <Badge className={`ml-2 text-xs px-1.5 py-0.5 ${getBadgeColor(post.user.userType)}`}>
                {getUserTypeLabel(post.user.userType)}
              </Badge>
              {post.user.kycVerified && (
                <Badge className="ml-2 text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded-full">
                  <CheckCircle className="h-3 w-3 mr-1" /> Verified
                </Badge>
              )}
            </div>
            <div className="flex items-center text-xs text-gray-500 mt-1">
              {post.circle && (
                <>
                  <Link href={`/circles/${post.circle.id}`}>
                    <span className="hover:underline cursor-pointer">{post.circle.name}</span>
                  </Link>
                  <span className="mx-1">•</span>
                </>
              )}
              <span>{formatTimeAgo(post.createdAt)}</span>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-600">
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                Save Post
              </DropdownMenuItem>
              <DropdownMenuItem>
                Report
              </DropdownMenuItem>
              <DropdownMenuItem>
                Hide
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {/* Post Content */}
        <div className="mt-3">
          <p className="text-sm">{post.content}</p>
          
          {/* Image */}
          {post.imageUrl && (
            <div className="mt-3">
              <img 
                src={post.imageUrl} 
                alt="Post attachment" 
                className="w-full h-48 object-cover rounded-lg"
              />
            </div>
          )}
          
          {/* Specialized Cards based on post type */}
          {post.type === 'price_update' && post.commodity && post.metadata && (
            <CommodityCard 
              commodity={post.commodity.name}
              circle={post.circle?.name || ""}
              data={post.metadata}
            />
          )}
          
          {post.type === 'circle_update' && post.circle && post.metadata && (
            <CircleActivityCard 
              circle={post.circle.name}
              data={post.metadata}
            />
          )}
          
          {post.type === 'news' && post.metadata && (
            <NewsCard data={post.metadata} />
          )}
        </div>
        
        {/* Post Actions */}
        <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
          <div className="flex space-x-4">
            <Button variant="ghost" size="sm" className="text-gray-600 hover:text-primary">
              <ThumbsUp className="mr-1 h-4 w-4" />
              <span className="text-sm">42</span>
            </Button>
            <Button variant="ghost" size="sm" className="text-gray-600 hover:text-primary">
              <MessageSquare className="mr-1 h-4 w-4" />
              <span className="text-sm">12</span>
            </Button>
            <Button variant="ghost" size="sm" className="text-gray-600 hover:text-primary">
              <Share className="mr-1 h-4 w-4" />
              <span className="text-sm">Share</span>
            </Button>
          </div>
          
          {post.type === 'price_update' ? (
            <Button variant="link" className="text-primary text-sm p-0 h-auto">
              <ChevronDown className="mr-1 h-4 w-4" /> Full Price History
            </Button>
          ) : post.type === 'news' ? (
            <Button variant="link" className="text-primary text-sm p-0 h-auto">
              <Bookmark className="mr-1 h-4 w-4" /> Save
            </Button>
          ) : post.type === 'circle_update' ? (
            <Link href={`/circles/${post.circle?.id}`}>
              <Button variant="link" className="text-primary text-sm p-0 h-auto">
                <ChevronUp className="mr-1 h-4 w-4" /> Join This Circle
              </Button>
            </Link>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
};

export default FeedItem;
