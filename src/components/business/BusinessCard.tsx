import { useState } from 'react';
import { Star, MapPin, ExternalLink, MessageSquare } from 'lucide-react';
import { Business } from '../../lib/supabase';
import { ReviewForm } from '../reviews/ReviewForm';
import { useAuth } from '../../contexts/AuthContext';

interface BusinessCardProps {
  business: Business & { avg_rating?: number; review_count?: number };
  onClick: () => void;
}

export function BusinessCard({ business, onClick }: BusinessCardProps) {
  const { profile } = useAuth();
  const [showReviewForm, setShowReviewForm] = useState(false);

  const canWriteReview = profile && profile.user_type === 'customer' && profile.subscription_status === 'active';

  const handleReviewClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowReviewForm(true);
  };
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden border border-gray-100"
    >
      <div className="h-48 bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center">
        {business.logo_url ? (
          <img src={business.logo_url} alt={business.name} className="w-full h-full object-cover" />
        ) : (
          <div className="text-6xl font-bold text-blue-200">
            {business.name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      <div className="p-6">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-xl font-semibold text-gray-900">{business.name}</h3>
          {business.verified && (
            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
              Verificato
            </span>
          )}
        </div>

        {business.category && (
          <span className="inline-block px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full mb-3">
            {business.category.name}
          </span>
        )}

        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {business.description || 'Nessuna descrizione disponibile'}
        </p>

        <div className="flex items-center gap-4 text-sm text-gray-500">
          {business.city && (
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              <span>{business.city}</span>
            </div>
          )}

          {business.avg_rating !== undefined && (
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="font-medium text-gray-900">{business.avg_rating.toFixed(1)}</span>
              <span>({business.review_count || 0})</span>
            </div>
          )}

          {business.website && (
            <a
              href={business.website}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="ml-auto text-blue-600 hover:text-blue-700"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>

        {canWriteReview && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <button
              onClick={handleReviewClick}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-semibold text-sm"
            >
              <MessageSquare className="w-4 h-4" />
              Scrivi una recensione
            </button>
          </div>
        )}
      </div>

      {showReviewForm && (
        <ReviewForm
          businessId={business.id}
          businessName={business.name}
          onClose={() => setShowReviewForm(false)}
          onSuccess={() => {
            setShowReviewForm(false);
          }}
        />
      )}
    </div>
  );
}
