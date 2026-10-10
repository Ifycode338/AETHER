import React from 'react';
import { Star } from 'lucide-react';

export default function RatingStars({ rating, size = 'sm', showCount = false, count = 0 }) {
  const starSize = size === 'sm' ? 'w-4 h-4' : size === 'md' ? 'w-5 h-5' : 'w-6 h-6';
  
  return (
    <div className="flex items-center gap-1">
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${starSize} ${
              star <= rating
                ? 'fill-[#FFC107] text-[#FFC107]'
                : 'text-gray-300 dark:text-gray-600'
            }`}
          />
        ))}
      </div>
      {showCount && (
        <span className="text-xs text-[#0A3D2E]/60 dark:text-white/60 ml-1">
          ({count})
        </span>
      )}
    </div>
  );
}
