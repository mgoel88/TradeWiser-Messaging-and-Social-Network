import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { 
  UserCircle, Building, CircleDot, Warehouse, 
  Wheat, LineChart, Loader, MessageSquare, Newspaper,
  FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import CircleItem from "@/components/circle/CircleItem";

const Sidebar = () => {
  const [location] = useLocation();
  
  // Fetch current user
  const { data: sessionData, isLoading: sessionLoading } = useQuery({
    queryKey: ['/api/auth/session']
  });
  
  const user = sessionData?.user;
  
  // Fetch user's circles if user is logged in
  const { data: userCirclesData, isLoading: circlesLoading } = useQuery({
    queryKey: ['/api/users', user?.id],
    enabled: !!user?.id
  });
  
  const circles = userCirclesData?.circles || [];

  if (!user) {
    return null;
  }

  return (
    <aside className="w-full lg:w-1/4 space-y-6">
      {/* User Profile Card */}
      <Card className="overflow-hidden">
        <div className="bg-primary h-24 relative"></div>
        <CardContent className="px-4 pb-4 pt-0 relative">
          <div className="flex justify-center">
            <img 
              src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}`}
              alt="Profile" 
              className="w-20 h-20 rounded-full border-4 border-white absolute -top-10 object-cover"
            />
          </div>
          <div className="mt-12 text-center">
            <h2 className="font-heading font-semibold text-lg">{user.name}</h2>
            <p className="text-gray-600 text-sm">{user.business || user.userType}</p>
            <div className="mt-1 flex items-center justify-center space-x-1">
              <span className="text-accent text-xs">📍</span>
              <span className="text-xs text-gray-500">
                {circles.find(c => c.id === user.nativeCircleId)?.name || "No native circle set"}
              </span>
            </div>
            <div className="mt-2 flex justify-center space-x-1">
              {user.kycVerified ? (
                <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                  ✓ KYC Verified
                </Badge>
              ) : (
                <Link href="/kyc">
                  <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200 cursor-pointer">
                    Complete KYC
                  </Badge>
                </Link>
              )}
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs border-t border-gray-100 pt-3">
            <div>
              <p className="font-semibold">{userCirclesData?.connectionsCount || 0}</p>
              <p className="text-gray-500">Connections</p>
            </div>
            <div className="border-l border-r border-gray-100">
              <p className="font-semibold">{circles.length || 0}</p>
              <p className="text-gray-500">Circles</p>
            </div>
            <div>
              <p className="font-semibold">0</p>
              <p className="text-gray-500">Commodities</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Navigation Menu */}
      <Card>
        <nav className="divide-y divide-gray-100">
          <Link href={`/profile/${user.id}`}>
            <Button
              variant="ghost" 
              className="flex items-center w-full justify-start px-4 py-3 rounded-none hover:bg-gray-50"
            >
              <UserCircle className="text-primary w-5 h-5 mr-3" />
              <span>My Profile</span>
            </Button>
          </Link>
          <Link href="/business">
            <Button
              variant="ghost" 
              className="flex items-center w-full justify-start px-4 py-3 rounded-none hover:bg-gray-50"
            >
              <Building className="text-primary w-5 h-5 mr-3" />
              <span>My Business</span>
            </Button>
          </Link>
          <Link href="/circles">
            <Button
              variant="ghost" 
              className="flex items-center w-full justify-start px-4 py-3 rounded-none hover:bg-gray-50"
            >
              <CircleDot className="text-primary w-5 h-5 mr-3" />
              <span>My Circles</span>
            </Button>
          </Link>
          <Link href="/assets">
            <Button
              variant="ghost" 
              className="flex items-center w-full justify-start px-4 py-3 rounded-none hover:bg-gray-50"
            >
              <Warehouse className="text-primary w-5 h-5 mr-3" />
              <span>My Assets</span>
            </Button>
          </Link>
          <Link href="/commodities">
            <Button
              variant="ghost" 
              className="flex items-center w-full justify-start px-4 py-3 rounded-none hover:bg-gray-50"
            >
              <Wheat className="text-primary w-5 h-5 mr-3" />
              <span>My Commodities</span>
            </Button>
          </Link>
          <Link href="/messages">
            <Button
              variant="ghost" 
              className="flex items-center w-full justify-start px-4 py-3 rounded-none hover:bg-gray-50"
            >
              <MessageSquare className="text-primary w-5 h-5 mr-3" />
              <span>Messages</span>
            </Button>
          </Link>
          <Link href="/contracts">
            <Button
              variant="ghost" 
              className="flex items-center w-full justify-start px-4 py-3 rounded-none hover:bg-gray-50"
            >
              <FileText className="text-primary w-5 h-5 mr-3" />
              <span>Contracts</span>
            </Button>
          </Link>
          <Link href="/market-news">
            <Button
              variant="ghost" 
              className="flex items-center w-full justify-start px-4 py-3 rounded-none hover:bg-gray-50"
            >
              <Newspaper className="text-primary w-5 h-5 mr-3" />
              <span>Market News</span>
            </Button>
          </Link>
          <Link href="/market-data">
            <Button
              variant="ghost" 
              className="flex items-center w-full justify-start px-4 py-3 rounded-none hover:bg-gray-50"
            >
              <LineChart className="text-primary w-5 h-5 mr-3" />
              <span>Market Data</span>
            </Button>
          </Link>
        </nav>
      </Card>

      {/* My Circles */}
      <Card>
        <CardHeader className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-heading font-semibold">My Circles</h3>
          <Link href="/circles">
            <Button variant="link" className="text-primary text-sm p-0 h-auto">
              View All
            </Button>
          </Link>
        </CardHeader>
        <div className="divide-y divide-gray-100">
          {circlesLoading ? (
            <div className="p-4 flex justify-center">
              <Loader className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : circles.length > 0 ? (
            circles.slice(0, 3).map((circle) => (
              <CircleItem 
                key={circle.id} 
                circle={circle} 
                isNative={circle.id === user.nativeCircleId}
              />
            ))
          ) : (
            <div className="p-4 text-center text-gray-500 text-sm">
              You haven't joined any circles yet.
            </div>
          )}
        </div>
      </Card>
    </aside>
  );
};

export default Sidebar;
