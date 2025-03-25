import React from "react";
import { Link } from "wouter";
import { Wheat, ArrowUp, ArrowDown } from "lucide-react";

interface CommodityItemProps {
  commodity: {
    id: number;
    name: string;
    icon?: string;
    category?: string;
  };
  price?: number;
  priceChange?: number;
  location?: string;
}

const CommodityItem: React.FC<CommodityItemProps> = ({ 
  commodity, 
  price, 
  priceChange = 0, 
  location 
}) => {
  const isPositiveChange = priceChange >= 0;
  const formattedPrice = price ? `₹${price.toLocaleString()}/quintal` : 'N/A';
  const formattedChange = Math.abs(priceChange).toFixed(1) + '%';

  // Get icon based on commodity category or default to wheat
  const getCommodityIcon = () => {
    switch (commodity.icon) {
      case 'seedling':
        return '🌱';
      case 'wheat-awn':
        return '🌾';
      default:
        return '🌾';
    }
  };

  return (
    <div className="px-4 py-3 hover:bg-gray-50">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-700">
            {commodity.icon ? <Wheat className="h-4 w-4" /> : getCommodityIcon()}
          </div>
          <div className="ml-3">
            <Link href={`/commodities/${commodity.id}`}>
              <p className="font-medium text-sm hover:underline cursor-pointer">{commodity.name}</p>
            </Link>
            <p className="text-xs text-gray-500">{location || 'Multiple locations'}</p>
          </div>
        </div>
        {price && priceChange !== undefined && (
          <div className="text-right">
            <p className={`text-sm font-data ${isPositiveChange ? 'text-green-600' : 'text-red-600'}`}>
              {isPositiveChange ? (
                <ArrowUp className="inline h-3 w-3 mr-1" />
              ) : (
                <ArrowDown className="inline h-3 w-3 mr-1" />
              )}
              {formattedChange}
            </p>
            <p className="text-xs text-gray-500">Today</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommodityItem;
