import { Link, useLocation } from "wouter";
import { Home, Users, Wheat, Bell, User } from "lucide-react";

const MobileNavigation = () => {
  const [location] = useLocation();

  const isActive = (path: string) => {
    return location === path ? "text-primary" : "text-gray-600";
  };

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t border-gray-200 z-40">
      <div className="flex justify-around">
        <Link href="/" className="flex flex-col items-center p-2">
          <Home className={`h-5 w-5 ${isActive("/")}`} />
          <span className={`text-xs mt-1 ${isActive("/")}`}>Home</span>
        </Link>
        <Link href="/circles" className="flex flex-col items-center p-2">
          <Users className={`h-5 w-5 ${isActive("/circles")}`} />
          <span className={`text-xs mt-1 ${isActive("/circles")}`}>Circles</span>
        </Link>
        <Link href="/commodities" className="flex flex-col items-center p-2">
          <Wheat className={`h-5 w-5 ${isActive("/commodities")}`} />
          <span className={`text-xs mt-1 ${isActive("/commodities")}`}>Commodities</span>
        </Link>
        <Link href="#" className="flex flex-col items-center p-2">
          <Bell className="h-5 w-5 text-gray-600" />
          <span className="text-xs mt-1 text-gray-600">Notifications</span>
        </Link>
        <Link href="/profile" className="flex flex-col items-center p-2">
          <User className={`h-5 w-5 ${isActive("/profile")}`} />
          <span className={`text-xs mt-1 ${isActive("/profile")}`}>Profile</span>
        </Link>
      </div>
    </div>
  );
};

export default MobileNavigation;
