import React from "react";
import { Wheat, ArrowDown, ArrowUp } from "lucide-react";

interface CommodityCardProps {
  commodity: string;
  circle: string;
  data: {
    currentPrice: string;
    priceChange: string;
    changeDirection: string;
    arrivals: string;
    quality: string;
  };
}

const CommodityCard: React.FC<CommodityCardProps> = ({ commodity, circle, data }) => {
  const isDown = data.changeDirection === 'down';

  return (
    <div className="mt-3 border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
      <div className="flex items-center p-3 bg-primary bg-opacity-10">
        <div className="w-8 h-8 rounded-full bg-primary bg-opacity-20 flex items-center justify-center text-primary">
          <Wheat className="h-4 w-4" />
        </div>
        <div className="ml-2">
          <h5 className="font-medium text-sm">{commodity} - {circle}</h5>
        </div>
      </div>
      <div className="p-3">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-gray-500">Current Price</p>
            <p className="font-semibold font-data">{data.currentPrice}</p>
          </div>
          <div>
            <p className="text-gray-500">Price Change</p>
            <p className={`font-semibold font-data ${isDown ? 'text-red-600' : 'text-green-600'}`}>
              {isDown ? <ArrowDown className="inline h-3 w-3 mr-1" /> : <ArrowUp className="inline h-3 w-3 mr-1" />}
              {data.priceChange}
            </p>
          </div>
          <div>
            <p className="text-gray-500">Arrivals</p>
            <p className="font-semibold font-data">{data.arrivals}</p>
          </div>
          <div>
            <p className="text-gray-500">Quality</p>
            <p className="font-semibold font-data">{data.quality}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommodityCard;
