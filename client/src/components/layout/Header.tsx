import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Leaf, Home, Users, MapPin, Bell, Search, Menu, X } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
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
        title: "Logged out successfully",
        description: "You have been logged out of your account.",
      });
    } catch (error) {
      toast({
        title: "Logout failed",
        description: "An error occurred while logging out.",
        variant: "destructive",
      });
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Implement search functionality
    toast({
      title: "Search not implemented",
      description: `You searched for: ${searchQuery}`,
    });
  };

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
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

          {/* Mobile Menu Button */}
          {isMobile && (
            <button
              className="ml-4 p-2 text-gray-700 hover:text-primary rounded-full hover:bg-gray-100 md:hidden"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          )}

          {/* Search Bar - Desktop */}
          <div className="hidden md:block flex-1 max-w-xl mx-6">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                  <Search className="h-4 w-4" />
                </span>
                <Input
                  type="text"
                  placeholder="Search commodities, circles, or people"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full bg-gray-50"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </form>
          </div>

          {/* Navigation Icons */}
          <nav className="flex items-center space-x-1 md:space-x-4">
            <Link href="/" className="p-2 text-gray-700 hover:text-primary rounded-full hover:bg-gray-100">
              <Home className="h-5 w-5" />
            </Link>
            <Link href="/circles" className="p-2 text-gray-700 hover:text-primary rounded-full hover:bg-gray-100">
              <Users className="h-5 w-5" />
            </Link>
            <Link href="/commodities" className="p-2 text-gray-700 hover:text-primary rounded-full hover:bg-gray-100">
              <MapPin className="h-5 w-5" />
            </Link>
            <Button variant="ghost" size="icon" className="p-2 text-gray-700 hover:text-primary rounded-full hover:bg-gray-100">
              <Bell className="h-5 w-5" />
            </Button>
            
            {isLoading ? (
              <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse"></div>
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="hidden md:flex items-center space-x-2 p-1">
                    <img
                      src={user.avatar || "https://ui-avatars.com/api/?name=" + encodeURIComponent(user.name)}
                      alt="Profile"
                      className="w-8 h-8 rounded-full object-cover border border-gray-300"
                    />
                    <span className="font-medium text-sm hidden lg:inline">{user.name}</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setLocation(`/profile/${user.id}`)}>
                    My Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setLocation("/kyc")}>
                    KYC Verification
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="default" onClick={() => setLocation("/login")}>
                Login
              </Button>
            )}
          </nav>
        </div>
      </div>

      {/* Mobile Search Bar */}
      <div className="md:hidden px-4 pb-3">
        <form onSubmit={handleSearch}>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
              <Search className="h-4 w-4" />
            </span>
            <Input
              type="text"
              placeholder="Search"
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full bg-gray-50"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </form>
      </div>

      {/* Mobile Navigation Menu */}
      {isMobile && menuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100">
          <div className="py-3 space-y-1">
            <Link href="/profile" className="flex items-center px-4 py-3 hover:bg-gray-50">
              <span>My Profile</span>
            </Link>
            <Link href="/kyc" className="flex items-center px-4 py-3 hover:bg-gray-50">
              <span>KYC Verification</span>
            </Link>
            <button 
              onClick={handleLogout}
              className="flex items-center px-4 py-3 hover:bg-gray-50 w-full text-left"
            >
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
