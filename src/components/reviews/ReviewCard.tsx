import { Star } from 'lucide-react';
import { Review } from '../../lib/supabase';

interface ReviewCardProps {
  review: Review;
}

export function ReviewCard({ review }: ReviewCardProps) {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('it-IT', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${
                    i < review.rating
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-gray-600">{formatDate(review.created_at)}</span>
          </div>
          {review.customer && (
            <p className="text-sm font-medium text-gray-900">{review.customer.full_name}</p>
          )}
        </div>
      </div>

      <h4 className="font-semibold text-gray-900 mb-2">{review.title}</h4>
      <p className="text-gray-700 leading-relaxed">{review.content}</p>

      {review.responses && review.responses.length > 0 && (
        <div className="mt-4 pl-4 border-l-2 border-blue-200">
          <p className="text-sm font-medium text-blue-700 mb-1">Risposta dell'attività</p>
          <p className="text-sm text-gray-700">{review.responses[0].content}</p>
          <p className="text-xs text-gray-500 mt-1">
            {formatDate(review.responses[0].created_at)}
          </p>
        </div>
      )}
    </div>
  );
}
