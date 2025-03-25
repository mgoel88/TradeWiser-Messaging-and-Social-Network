import React from "react";
import { Link } from "wouter";
import { CircleDot } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CircleItemProps {
  circle: {
    id: number;
    name: string;
    description?: string;
    mainCommodities?: string[];
    state?: string;
  };
  isNative?: boolean;
}

const CircleItem: React.FC<CircleItemProps> = ({ circle, isNative = false }) => {
  return (
    <div className="flex items-center px-4 py-3 hover:bg-gray-50">
      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-primary">
        <CircleDot className="h-5 w-5" />
      </div>
      <div className="ml-3 flex-1">
        <Link href={`/circles/${circle.id}`}>
          <p className="font-medium text-sm hover:underline cursor-pointer">{circle.name}</p>
        </Link>
        <p className="text-xs text-gray-500">
          {circle.mainCommodities && circle.mainCommodities.length > 0 
            ? `Primary: ${circle.mainCommodities.slice(0, 2).join(', ')}${circle.mainCommodities.length > 2 ? '...' : ''}`
            : circle.state 
              ? `Location: ${circle.state}` 
              : 'Agricultural Circle'}
        </p>
      </div>
      {isNative ? (
        <Badge className="text-xs bg-secondary bg-opacity-20 text-yellow-800 px-2 py-1">
          Native
        </Badge>
      ) : (
        <Badge className="text-xs bg-blue-100 text-blue-800 px-2 py-1">
          Connected
        </Badge>
      )}
    </div>
  );
};

export default CircleItem;
