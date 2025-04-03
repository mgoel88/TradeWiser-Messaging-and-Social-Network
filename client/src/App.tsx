import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Profile from "@/pages/profile";
import Circles from "@/pages/circles";
import Commodities from "@/pages/commodities";
import KYC from "@/pages/kyc";
import AuthPage from "@/pages/auth-page";
import Messages from "@/pages/messages-new";
import Assets from "@/pages/assets";
import Connections from "@/pages/connections";
import MarketNews from "@/pages/market-news";
import Marketplace from "@/pages/marketplace";
import MarketplaceNew from "@/pages/marketplace-new";
import TradingTemplates from "@/pages/trading-templates";
import Contracts from "@/pages/contracts";
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import MobileNavigation from "./components/layout/MobileNavigation";
import { NotificationsProvider } from "./components/notifications";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/" component={Home} />
      <ProtectedRoute path="/profile/:id?" component={Profile} />
      <ProtectedRoute path="/circles" component={Circles} />
      <ProtectedRoute path="/commodities" component={Commodities} />
      <ProtectedRoute path="/kyc" component={KYC} />
      <ProtectedRoute path="/messages" component={Messages} />
      <ProtectedRoute path="/connections" component={Connections} />
      <ProtectedRoute path="/assets" component={Assets} />
      <ProtectedRoute path="/market-news" component={MarketNews} />
      <ProtectedRoute path="/marketplace" component={Marketplace} />
      <ProtectedRoute path="/marketplace/new" component={MarketplaceNew} />
      <ProtectedRoute path="/trading-templates" component={TradingTemplates} />
      <ProtectedRoute path="/contracts" component={Contracts} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [location] = useLocation();
  const isAuthPage = location === '/auth';

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <NotificationsProvider>
          {!isAuthPage && <Header />}
          <Router />
          {!isAuthPage && <Footer />}
          {!isAuthPage && <MobileNavigation />}
          <Toaster />
        </NotificationsProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;