import { Link, useLocation } from "wouter";
import { Home, Users, Wheat, MessageSquare, User, Warehouse, Menu, X, Newspaper, LineChart, BarChart3, FileText } from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/lib/i18n";

const MobileNavigation = () => {
  const [location] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const { t } = useLanguage();

  // Fetch user data for full menu
  const { data: sessionData = {} } = useQuery<{ user?: any }>({
    queryKey: ['/api/auth/session']
  });
  
  const user = sessionData?.user;

  const isActive = (path: string) => {
    return location === path ? "text-primary" : "text-gray-600";
  };

  // Primary nav items for bottom bar
  const primaryNavItems = [
    { path: "/", icon: Home, label: "Home" },
    { path: "/circles", icon: Users, label: "Circles" },
    { path: "/marketplace", icon: BarChart3, label: "Market" },
    { path: "/messages", icon: MessageSquare, label: "Messages" },
    { path: "/profile", icon: User, label: "Profile" }
  ];

  // All nav items for expanded menu
  const allNavItems = [
    { path: "/", icon: Home, label: "Home" },
    { path: "/profile", icon: User, label: "Profile" },
    { path: "/circles", icon: Users, label: "Circles" },
    { path: "/assets", icon: Warehouse, label: "Assets" },
    { path: "/commodities", icon: Wheat, label: "Commodities" },
    { path: "/marketplace", icon: BarChart3, label: "Marketplace" },
    { path: "/messages", icon: MessageSquare, label: "Messages" },
    { path: "/contracts", icon: FileText, label: "Contracts" },
    { path: "/trading-templates", icon: FileText, label: "Trading Templates" },
    { path: "/market-news", icon: Newspaper, label: "Market News" },
    { path: "/market-data", icon: LineChart, label: "Market Data" }
  ];

  return (
    <>
      {/* Bottom Tab Bar - Main Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t border-gray-200 z-40">
        <div className="flex justify-between">
          {primaryNavItems.map((item) => (
            <Link 
              key={item.path} 
              href={item.path} 
              className="flex flex-col items-center p-2 flex-1"
            >
              <item.icon className={`h-5 w-5 ${isActive(item.path)}`} />
              <span className={`text-xs mt-1 ${isActive(item.path)}`}>{item.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Mobile Header with Menu Button */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white shadow-sm border-b border-gray-200 z-30 h-14 flex items-center justify-between px-4">
        <div className="font-bold text-lg text-primary">WizXConnect</div>
        
        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="p-1">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[80%] pt-12">
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute right-4 top-4"
              onClick={() => setMenuOpen(false)}
            >
              <X className="h-6 w-6" />
            </Button>
            
            {user && (
              <div className="mb-6 flex items-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 mr-3 flex items-center justify-center overflow-hidden">
                  {user.avatar ? (
                    <img 
                      src={user.avatar} 
                      alt={user.name} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="h-6 w-6 text-primary" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold">{user.name}</h3>
                  <p className="text-sm text-gray-500">{user.userType}</p>
                </div>
              </div>
            )}
            
            <div className="space-y-1">
              {allNavItems.map((item) => (
                <Link key={item.path} href={item.path}>
                  <Button
                    variant={location === item.path ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => setMenuOpen(false)}
                  >
                    <item.icon className="mr-2 h-5 w-5" />
                    {item.label}
                  </Button>
                </Link>
              ))}
            </div>
            
            {user && user.kycVerified === false && (
              <div className="mt-6 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <h4 className="font-medium text-yellow-800 text-sm">Complete your KYC</h4>
                <p className="text-yellow-700 text-xs mt-1 mb-2">
                  Verify your identity to access all features
                </p>
                <Link href="/kyc">
                  <Button 
                    size="sm" 
                    className="w-full" 
                    onClick={() => setMenuOpen(false)}
                  >
                    Complete KYC
                  </Button>
                </Link>
              </div>
            )}
          </SheetContent>
        </Sheet>
      </div>
      
      {/* Spacer for fixed header */}
      <div className="lg:hidden h-14"></div>
    </>
  );
};

export default MobileNavigation;
