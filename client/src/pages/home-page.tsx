import { useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, Users, Wallet, TrendingUp, Package, Bell, MoreHorizontal, RefreshCw } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { FeatureTutorial } from "@/components/onboarding";
import { useOnboarding } from "@/components/onboarding/OnboardingContext";

// Feature tutorial steps for dashboard
const dashboardFeatureSteps = [
  {
    id: "dashboard-intro",
    title: "Welcome to Your Dashboard",
    description: "This is your home base for all your trading activities. Let's explore the key features.",
    targetSelector: ".dashboard-title"
  },
  {
    id: "market-overview",
    title: "Market Overview",
    description: "Track commodity prices and market trends across your trading circles at a glance.",
    targetSelector: ".market-overview-card",
    placement: "bottom"
  },
  {
    id: "price-tracker",
    title: "Price Tracker",
    description: "Monitor real-time prices for commodities you're interested in trading.",
    targetSelector: ".price-tracker-card",
    placement: "left"
  },
  {
    id: "quick-actions",
    title: "Quick Actions",
    description: "Easily create new marketplace listings or send trade messages with these shortcuts.",
    targetSelector: ".quick-actions-card",
    placement: "left"
  },
  {
    id: "trading-tabs",
    title: "Trading Insights",
    description: "Switch tabs to view your network connections, trading history, and contracts.",
    targetSelector: "[data-tutorial='tabs-list']",
    placement: "bottom"
  }
];

export default function HomePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tab, setTab] = useState("overview");
  const { shouldShowFeatureOnboarding, markPageVisited } = useOnboarding();
  const [showDashboardTutorial, setShowDashboardTutorial] = useState(false);
  
  // Get trending commodities
  const { data: trendingCommodities = [], isLoading: isTrendingLoading } = useQuery({
    queryKey: ['/api/commodities/trending'],
  });
  
  // Fetch latest posts for the news feed
  const { data: posts = [], isLoading: isPostsLoading } = useQuery({
    queryKey: ['/api/posts'],
  });
  
  // Get circles the user is part of
  const { data: circles = [], isLoading: isCirclesLoading } = useQuery({
    queryKey: ['/api/circles'],
  });
  
  // Get user's commodities of interest
  const { data: commodities = [], isLoading: isCommoditiesLoading } = useQuery({
    queryKey: ['/api/commodities'],
  });
  
  // Get all users for demo
  const { data: usersData, isLoading: isUsersLoading } = useQuery({
    queryKey: ['/api/users'],
  });
  const users = usersData?.users || [];

  // Check if we should show dashboard tutorial
  useEffect(() => {
    // Mark this page as visited
    markPageVisited('/');
    
    if (shouldShowFeatureOnboarding('/')) {
      setShowDashboardTutorial(true);
    }
  }, [shouldShowFeatureOnboarding, markPageVisited]);

  return (
    <div className="py-6 container">
      <Helmet>
        <title>WizXConnect - Dashboard</title>
      </Helmet>
      
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight dashboard-title">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.name || user?.username || 'User'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/market-news">
              <Bell className="h-4 w-4 mr-1" />
              Market News
            </Link>
          </Button>
          <Button variant="default" size="sm" asChild>
            <Link href="/marketplace">
              <BarChart3 className="h-4 w-4 mr-1" />
              Marketplace
            </Link>
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="overview" value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList data-tutorial="tabs-list">
          <TabsTrigger value="overview">Market Overview</TabsTrigger>
          <TabsTrigger value="trading">Trading</TabsTrigger>
          <TabsTrigger value="network">Network</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {isTrendingLoading ? (
              <Card className="col-span-3 h-[200px] flex items-center justify-center">
                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
              </Card>
            ) : (
              <>
                <div className="md:col-span-2">
                  <Card className="market-overview-card">
                    <CardHeader>
                      <CardTitle>Market Overview</CardTitle>
                      <CardDescription>Current trends across your trading circles</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {trendingCommodities.slice(0, 3).map((commodity, index) => (
                          <div key={index} className="flex items-center justify-between border-b pb-3">
                            <div className="flex items-center gap-2">
                              <div className="bg-primary/10 p-2 rounded-full">
                                <TrendingUp className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <div className="font-medium">{commodity.name}</div>
                                <div className="text-xs text-muted-foreground">{commodity.circle}</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-medium">₹{commodity.price}/quintal</div>
                              <div className={`text-xs ${commodity.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {commodity.change > 0 ? '↑' : '↓'} {Math.abs(commodity.change)}%
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
                <div className="space-y-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Your Circles</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {circles.slice(0, 3).map((circle, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="font-medium">{circle.name}</div>
                          <Badge variant="outline">{circle.memberCount} members</Badge>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                  <Card className="quick-actions-card">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <Button variant="outline" className="w-full justify-start" asChild>
                        <Link href="/marketplace/new">
                          <Package className="h-4 w-4 mr-2" />
                          Create New Listing
                        </Link>
                      </Button>
                      <Button variant="outline" className="w-full justify-start" asChild>
                        <Link href="/messages">
                          <Users className="h-4 w-4 mr-2" />
                          Send Trade Message
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <Card className="h-full">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">Latest Market News & Updates</CardTitle>
                    <Button variant="ghost" size="icon" asChild>
                      <Link href="/market-news">
                        <MoreHorizontal className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 h-[400px] overflow-auto">
                  {isPostsLoading ? (
                    <div className="h-full flex items-center justify-center">
                      <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : posts.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-4">
                      <Bell className="h-12 w-12 text-muted-foreground mb-2" />
                      <h3 className="text-lg font-medium">No updates yet</h3>
                      <p className="text-sm text-muted-foreground">
                        Market news and updates from your circles will appear here.
                      </p>
                    </div>
                  ) : (
                    posts.map((post, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>{post.author?.substring(0, 2)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{post.author}</div>
                            <div className="text-xs text-muted-foreground">{post.time}</div>
                          </div>
                        </div>
                        <p className="text-sm">{post.content}</p>
                        {post.image && (
                          <div className="mt-2 rounded-md overflow-hidden">
                            <img src={post.image} alt="Post attachment" className="w-full" />
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
            
            <div>
              <Card className="price-tracker-card h-full">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">Price Tracker</CardTitle>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => {
                              toast({
                                title: "Prices updated",
                                description: "The latest commodity prices have been loaded.",
                              });
                            }}
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Refresh prices</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <CardDescription>
                    Your commodities of interest
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 h-[400px] overflow-auto px-2">
                  {isCommoditiesLoading ? (
                    <div className="h-full flex items-center justify-center">
                      <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : commodities.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-4">
                      <TrendingUp className="h-12 w-12 text-muted-foreground mb-2" />
                      <h3 className="text-lg font-medium">No commodities selected</h3>
                      <p className="text-sm text-muted-foreground">
                        Add commodities to your profile to track prices.
                      </p>
                      <Button className="mt-4" size="sm" asChild>
                        <Link href="/commodities">
                          Select Commodities
                        </Link>
                      </Button>
                    </div>
                  ) : (
                    commodities.map((commodity, index) => (
                      <div key={index} className="rounded-lg border p-3 bg-card">
                        <div className="flex justify-between items-center">
                          <div className="font-medium">{commodity.name}</div>
                          <Badge variant={commodity.change > 0 ? "default" : "destructive"} className="ml-auto">
                            {commodity.change > 0 ? '↑' : '↓'} {Math.abs(commodity.change)}%
                          </Badge>
                        </div>
                        <div className="flex justify-between mt-2">
                          <span className="text-xs text-muted-foreground">{commodity.location}</span>
                          <span className="font-medium">₹{commodity.price}/quintal</span>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="trading" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Trading Summary</CardTitle>
                  <CardDescription>Your trading activities this month</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="border rounded-md p-4 text-center">
                      <div className="text-2xl font-bold">5</div>
                      <div className="text-xs text-muted-foreground">Active Trades</div>
                    </div>
                    <div className="border rounded-md p-4 text-center">
                      <div className="text-2xl font-bold">12</div>
                      <div className="text-xs text-muted-foreground">Completed</div>
                    </div>
                    <div className="border rounded-md p-4 text-center">
                      <div className="text-2xl font-bold">₹42K</div>
                      <div className="text-xs text-muted-foreground">Total Volume</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Active Contracts</CardTitle>
                <CardDescription>
                  Your ongoing trading contracts
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between border p-3 rounded-md">
                    <div>
                      <h4 className="font-medium">Rice - IR64</h4>
                      <p className="text-xs text-muted-foreground">With Vikram Traders</p>
                    </div>
                    <Badge variant="outline">In Progress</Badge>
                  </div>
                  <div className="flex items-center justify-between border p-3 rounded-md">
                    <div>
                      <h4 className="font-medium">Wheat - Grade A</h4>
                      <p className="text-xs text-muted-foreground">With Ganesh Mills</p>
                    </div>
                    <Badge variant="outline">Pending Signature</Badge>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link href="/contracts">
                    View All Contracts
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Recent Transactions</CardTitle>
                <CardDescription>
                  Your recent trading activity
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between border-b pb-2">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <Wallet className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium">Sold: Potato - Red</div>
                      <div className="text-xs text-muted-foreground">to Sharma Enterprises</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">₹25,000</div>
                    <div className="text-xs text-muted-foreground">Aug 25, 2023</div>
                  </div>
                </div>
                <div className="flex items-center justify-between border-b pb-2">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <Wallet className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium">Bought: Onion - White</div>
                      <div className="text-xs text-muted-foreground">from Patel Farms</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">₹18,500</div>
                    <div className="text-xs text-muted-foreground">Aug 18, 2023</div>
                  </div>
                </div>
                <div className="flex items-center justify-between pb-2">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <Wallet className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium">Sold: Wheat - Grade A</div>
                      <div className="text-xs text-muted-foreground">to Modern Mills</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">₹32,000</div>
                    <div className="text-xs text-muted-foreground">Aug 10, 2023</div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" className="w-full">
                  View All Transactions
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Trade Opportunities</CardTitle>
                <CardDescription>
                  Matching buy/sell listings for your commodities
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between border p-3 rounded-md">
                    <div className="flex items-center gap-2">
                      <div className="flex flex-col">
                        <span className="font-medium">Potato - Red</span>
                        <span className="text-xs text-muted-foreground">Buy Offer · Ludhiana Circle</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">₹1,250/quintal</div>
                      <div className="text-xs text-muted-foreground">Qty: 50 quintals</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between border p-3 rounded-md">
                    <div className="flex items-center gap-2">
                      <div className="flex flex-col">
                        <span className="font-medium">Onion - White</span>
                        <span className="text-xs text-muted-foreground">Sell Offer · Nashik Circle</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">₹950/quintal</div>
                      <div className="text-xs text-muted-foreground">Qty: 100 quintals</div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link href="/marketplace">
                    Browse Marketplace
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="network" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Recommended Connections</CardTitle>
                  <CardDescription>
                    People you might want to connect with based on your trading patterns
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {users.slice(0, 5).map((user, index) => (
                    <div key={index} className="flex items-center justify-between border-b last:border-0 pb-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={user.avatar} alt={user.username} />
                          <AvatarFallback>{user.username?.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{user.username}</div>
                          <div className="text-xs text-muted-foreground">{user.userType} · {user.location}</div>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">Connect</Button>
                    </div>
                  ))}
                </CardContent>
                <CardFooter>
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <Link href="/connections">
                      View All Recommendations
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            </div>
            
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Your Network</CardTitle>
                  <CardDescription>
                    Statistics about your connections
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="border rounded-md p-4 text-center">
                      <div className="text-3xl font-bold">27</div>
                      <div className="text-xs text-muted-foreground">Connections</div>
                    </div>
                    <div className="border rounded-md p-4 text-center">
                      <div className="text-3xl font-bold">8</div>
                      <div className="text-xs text-muted-foreground">Trading Partners</div>
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <h4 className="text-sm font-medium mb-2">Recent Connections</h4>
                    <div className="flex flex-col gap-2">
                      {users.slice(0, 3).map((user, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.avatar} alt={user.username} />
                            <AvatarFallback>{user.username?.substring(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="text-sm font-medium">{user.username}</div>
                            <div className="text-xs text-muted-foreground">{user.userType}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <Link href="/connections">
                      View All Connections
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Your Circles</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-2">
                    {circles.slice(0, 3).map((circle, index) => (
                      <div key={index} className="flex items-center gap-2 border p-2 rounded-md">
                        <div className="flex-1">
                          <div className="text-sm font-medium">{circle.name}</div>
                          <div className="text-xs text-muted-foreground">{circle.memberCount} members</div>
                        </div>
                        <Badge variant="secondary">{circle.tradingVolume}MT/month</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <Link href="/circles">
                      View All Circles
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Dashboard feature tutorial */}
      {showDashboardTutorial && (
        <FeatureTutorial
          featureId="dashboard"
          steps={dashboardFeatureSteps}
          onComplete={() => setShowDashboardTutorial(false)}
        />
      )}
    </div>
  );
}