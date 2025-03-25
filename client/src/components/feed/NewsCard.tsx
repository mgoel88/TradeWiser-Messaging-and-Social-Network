import React from "react";

interface NewsCardProps {
  data: {
    headline: string;
    summary: string;
    url: string;
  };
}

const NewsCard: React.FC<NewsCardProps> = ({ data }) => {
  return (
    <div className="mt-3 border border-gray-200 rounded-lg p-3 bg-gray-50">
      <h5 className="font-medium">{data.headline}</h5>
      <p className="text-sm text-gray-600 mt-1">
        {data.summary}
      </p>
      <a 
        href={data.url}
        className="text-primary text-sm mt-2 inline-block hover:underline"
      >
        Read full article
      </a>
    </div>
  );
};

export default NewsCard;
