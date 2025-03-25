import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Leaf, Home, Users, MapPin, Bell, Search, Menu, X, Newspaper, ShoppingCart } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLanguage } from "@/lib/i18n";
import { LanguageSelector } from "@/components/layout/LanguageSelector";
import { ConnectionStatus } from "@/components/notifications/ConnectionStatus";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Header = () => {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  const { data: sessionData, isLoading } = useQuery({
    queryKey: ['/api/auth/session'],
  });

  const user = sessionData?.user;

  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout", {});
      // Invalidate the session query
      queryClient.invalidateQueries({ queryKey: ['/api/auth/session'] });
      // Redirect to login page
      setLocation("/login");
      toast({
        title: t("messages.success.logout"),
        description: t("messages.success.logout_description"),
      });
    } catch (error) {
      toast({
        title: t("messages.errors.logout_failed"),
        description: t("messages.errors.connection_failed"),
        variant: "destructive",
      });
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Implement search functionality
    toast({
      title: t("messages.errors.search_not_implemented"),
      description: `${t("common.search")}: ${searchQuery}`,
    });
  };

  return (
    <header className="bg-white shadow-md sticky top-0 z-50 hidden lg:block">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <div className="text-primary mr-2">
                <Leaf className="h-6 w-6" />
              </div>
              <h1 className="text-primary font-heading font-bold text-xl">{APP_NAME}</h1>
            </Link>
          </div>

          {/* Search Bar - Desktop */}
          <div className="flex-1 max-w-xl mx-6">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                  <Search className="h-4 w-4" />
                </span>
                <Input
                  type="text"
                  placeholder={t("common.search_placeholder")}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full bg-gray-50"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </form>
          </div>

          {/* Navigation Icons */}
          <nav className="flex items-center space-x-4">
            <Link href="/" className="p-2 text-gray-700 hover:text-primary rounded-full hover:bg-gray-100">
              <Home className="h-5 w-5" />
            </Link>
            <Link href="/circles" className="p-2 text-gray-700 hover:text-primary rounded-full hover:bg-gray-100">
              <Users className="h-5 w-5" />
            </Link>
            <Link href="/commodities" className="p-2 text-gray-700 hover:text-primary rounded-full hover:bg-gray-100">
              <MapPin className="h-5 w-5" />
            </Link>
            <Link href="/marketplace" className="p-2 text-gray-700 hover:text-primary rounded-full hover:bg-gray-100">
              <ShoppingCart className="h-5 w-5" />
            </Link>
            <Link href="/messages" className="p-2 text-gray-700 hover:text-primary rounded-full hover:bg-gray-100">
              <Bell className="h-5 w-5" />
            </Link>
            <Link href="/market-news" className="p-2 text-gray-700 hover:text-primary rounded-full hover:bg-gray-100">
              <Newspaper className="h-5 w-5" />
            </Link>
            <ConnectionStatus />
            <LanguageSelector />
            
            {isLoading ? (
              <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse"></div>
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center space-x-2 p-1">
                    <img
                      src={user.avatar || "https://ui-avatars.com/api/?name=" + encodeURIComponent(user.name)}
                      alt="Profile"
                      className="w-8 h-8 rounded-full object-cover border border-gray-300"
                    />
                    <span className="font-medium text-sm hidden xl:inline">{user.name}</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setLocation(`/profile/${user.id}`)}>
                    {t("profile.edit_profile")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setLocation("/kyc")}>
                    {t("kyc.verification")}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    {t("auth.logout")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="default" onClick={() => setLocation("/login")}>
                {t("auth.login")}
              </Button>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
