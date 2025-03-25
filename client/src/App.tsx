import { useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient, getQueryFn } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Profile from "@/pages/profile";
import Circles from "@/pages/circles";
import Commodities from "@/pages/commodities";
import KYC from "@/pages/kyc";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Messages from "@/pages/messages";
import Assets from "@/pages/assets";
import Connections from "@/pages/connections";
import MarketNews from "@/pages/market-news";
import Marketplace from "@/pages/marketplace";
import MarketplaceNew from "@/pages/marketplace-new";
import TradingTemplates from "@/pages/trading-templates";
import { useQuery } from "@tanstack/react-query";
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import MobileNavigation from "./components/layout/MobileNavigation";
import { NotificationsProvider } from "./components/notifications";

function Router() {
  const [location, setLocation] = useLocation();
  const { data: session } = useQuery({ 
    queryKey: ['/api/auth/session'],
    retry: false,
    staleTime: 0,
    queryFn: getQueryFn({ on401: "returnNull" })
  });

  // Redirect to login if not authenticated, except for public pages
  useEffect(() => {
    const publicPages = ['/login', '/register'];
    const isPrivatePage = !publicPages.includes(location);
    
    if (isPrivatePage && session && session.message === "Not authenticated") {
      setLocation('/login');
    }
    
    // Redirect to home if already authenticated and trying to access login/register
    if (publicPages.includes(location) && session && session.user) {
      setLocation('/');
    }
  }, [location, session, setLocation]);

  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/" component={Home} />
      <Route path="/profile/:id?" component={Profile} />
      <Route path="/circles" component={Circles} />
      <Route path="/commodities" component={Commodities} />
      <Route path="/kyc" component={KYC} />
      <Route path="/messages" component={Messages} />
      <Route path="/connections" component={Connections} />
      <Route path="/assets" component={Assets} />
      <Route path="/market-news" component={MarketNews} />
      <Route path="/marketplace" component={Marketplace} />
      <Route path="/marketplace/new" component={MarketplaceNew} />
      <Route path="/trading-templates" component={TradingTemplates} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [location] = useLocation();
  const isAuthPage = location === '/login' || location === '/register';

  return (
    <QueryClientProvider client={queryClient}>
      <NotificationsProvider>
        {!isAuthPage && <Header />}
        <Router />
        {!isAuthPage && <Footer />}
        {!isAuthPage && <MobileNavigation />}
        <Toaster />
      </NotificationsProvider>
    </QueryClientProvider>
  );
}

export default App;
