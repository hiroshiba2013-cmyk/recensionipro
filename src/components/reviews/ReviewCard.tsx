import { Star, Clock, CheckCircle } from 'lucide-react';
import { Review } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface ReviewCardProps {
  review: Review;
}

export function ReviewCard({ review }: ReviewCardProps) {
  const { user } = useAuth();
  const isOwnReview = user?.id === review.customer_id;

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('it-IT', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getRatingLabel = (rating: number) => {
    switch (rating) {
      case 1: return 'Pessimo';
      case 2: return 'Discreto';
      case 3: return 'Buono';
      case 4: return 'Eccellente';
      case 5: return 'Ottimo';
      default: return '';
    }
  };

  const renderStars = (rating: number, size: 'sm' | 'md' = 'sm') => {
    const sizeClass = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
    return (
      <div className="flex">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`${sizeClass} ${
              i < rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            {renderStars(review.overall_rating, 'md')}
            <span className="text-sm font-medium text-gray-700">{getRatingLabel(review.overall_rating)}</span>
            {isOwnReview && review.review_status === 'pending' && (
              <span className="flex items-center gap-1 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                <Clock className="w-3 h-3" />
                In attesa di approvazione
              </span>
            )}
            {review.review_status === 'approved' && review.points_awarded > 0 && (
              <span className="flex items-center gap-1 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                <CheckCircle className="w-3 h-3" />
                +{review.points_awarded} punti
              </span>
            )}
          </div>
          {review.customer && (
            <p className="text-sm font-medium text-gray-900">{review.customer.full_name}</p>
          )}
          <span className="text-xs text-gray-500">{formatDate(review.created_at)}</span>
        </div>
      </div>

      <h4 className="font-semibold text-gray-900 mb-3">{review.title}</h4>

      {review.price_rating && review.service_rating && review.quality_rating && (
        <div className="grid grid-cols-3 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <p className="text-xs font-medium text-gray-600 mb-1">Prezzo</p>
            {renderStars(review.price_rating)}
            <p className="text-xs text-gray-500 mt-1">{getRatingLabel(review.price_rating)}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-600 mb-1">Servizio</p>
            {renderStars(review.service_rating)}
            <p className="text-xs text-gray-500 mt-1">{getRatingLabel(review.service_rating)}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-600 mb-1">Qualità</p>
            {renderStars(review.quality_rating)}
            <p className="text-xs text-gray-500 mt-1">{getRatingLabel(review.quality_rating)}</p>
          </div>
        </div>
      )}

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
