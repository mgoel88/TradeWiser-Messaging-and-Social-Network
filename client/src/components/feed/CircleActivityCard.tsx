import React from "react";
import { CircleDot, ArrowUp, ArrowDown } from "lucide-react";
import { Link } from "wouter";

interface CircleActivityCardProps {
  circle: string;
  data: {
    arrivals: string;
    activeBuyers: string;
    topCommodity: string;
    priceTrend: string;
    trendDirection: string;
  };
}

const CircleActivityCard: React.FC<CircleActivityCardProps> = ({ circle, data }) => {
  const isUp = data.trendDirection === 'up';

  return (
    <div className="mt-3 border border-gray-200 rounded-lg overflow-hidden">
      <div className="flex items-center p-3 bg-green-50">
        <div className="w-8 h-8 rounded-full bg-primary bg-opacity-20 flex items-center justify-center text-primary">
          <CircleDot className="h-4 w-4" />
        </div>
        <div className="ml-2">
          <h5 className="font-medium text-sm">{circle} Activity</h5>
        </div>
      </div>
      <div className="p-3 grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-gray-500">Today's Arrivals</p>
          <p className="font-semibold font-data">{data.arrivals}</p>
        </div>
        <div>
          <p className="text-gray-500">Active Buyers</p>
          <p className="font-semibold font-data">{data.activeBuyers}</p>
        </div>
        <div>
          <p className="text-gray-500">Top Commodity</p>
          <p className="font-semibold font-data">{data.topCommodity}</p>
        </div>
        <div>
          <p className="text-gray-500">Price Trend</p>
          <p className={`font-semibold font-data ${isUp ? 'text-green-600' : 'text-red-600'}`}>
            {isUp ? <ArrowUp className="inline h-3 w-3 mr-1" /> : <ArrowDown className="inline h-3 w-3 mr-1" />}
            {data.priceTrend}
          </p>
        </div>
      </div>
      <Link href="/circles">
        <button className="block w-full bg-gray-50 p-3 text-primary text-center hover:bg-gray-100 transition">
          View Circle Details
        </button>
      </Link>
    </div>
  );
};

export default CircleActivityCard;
