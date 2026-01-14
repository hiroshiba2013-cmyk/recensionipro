import { useState } from 'react';
import { Star, MapPin, ExternalLink, MessageSquare, Phone, Mail, Clock } from 'lucide-react';
import { ReviewForm } from '../reviews/ReviewForm';
import { useAuth } from '../../contexts/AuthContext';
import { VerificationBadge } from './VerificationBadge';

interface BusinessLocation {
  id: string;
  business_id: string;
  name: string | null;
  address: string;
  city: string;
  province: string;
  region: string;
  postal_code: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  business_hours: any;
  avatar_url: string | null;
  is_claimed: boolean;
  verification_badge: boolean;
  business?: {
    id: string;
    name: string;
    category_id: string;
    verified: boolean;
    category?: {
      id: string;
      name: string;
      icon: string;
    };
  };
  avg_rating?: number;
  review_count?: number;
}

interface LocationCardProps {
  location: BusinessLocation;
}

export function LocationCard({ location }: LocationCardProps) {
  const { profile } = useAuth();
  const [showReviewForm, setShowReviewForm] = useState(false);

  const canWriteReview = profile && profile.user_type === 'customer' && profile.subscription_status === 'active';

  const handleReviewClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setShowReviewForm(true);
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if (e.target !== e.currentTarget && (e.target as HTMLElement).closest('button, a')) {
      return;
    }
    sessionStorage.setItem('searchReturnUrl', window.location.pathname + window.location.search);
    sessionStorage.setItem('searchScrollPosition', window.scrollY.toString());
    window.history.pushState({}, '', `/location/${location.id}`);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const displayName = location.name || location.business?.name || 'Attività';
  const businessName = location.business?.name || '';

  return (
    <div
      onClick={handleCardClick}
      className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden border border-gray-100"
    >
      <div className="h-48 bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center">
        {location.avatar_url ? (
          <img src={location.avatar_url} alt={displayName} className="w-full h-full object-cover" />
        ) : (
          <div className="text-6xl font-bold text-blue-200">
            {displayName.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      <div className="p-6">
        <div className="flex items-start justify-between mb-2 gap-2">
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-gray-900">{displayName}</h3>
            {location.name && businessName && (
              <p className="text-sm text-gray-600 mt-1">{businessName}</p>
            )}
          </div>
          <VerificationBadge isClaimed={!!location.is_claimed} size="sm" />
        </div>

        {location.business?.category && (
          <span className="inline-block px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full mb-3">
            {location.business.category.name}
          </span>
        )}

        <div className="space-y-2 mb-4">
          <div className="flex items-start gap-2 text-sm text-gray-600">
            <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{location.address}, {location.city} ({location.province})</span>
          </div>

          {location.phone && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Phone className="w-4 h-4 flex-shrink-0" />
              <span>{location.phone}</span>
            </div>
          )}

          {location.email && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Mail className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{location.email}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
          {location.avg_rating !== undefined && location.review_count !== undefined && (
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="font-medium text-gray-900">
                {location.review_count > 0 ? location.avg_rating.toFixed(1) : 'N/D'}
              </span>
              <span>({location.review_count || 0})</span>
            </div>
          )}

          {location.website && (
            <a
              href={location.website}
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
          <div className="pt-4 border-t border-gray-100">
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

      {showReviewForm && location.business_id && (
        <ReviewForm
          businessId={location.business_id}
          businessLocationId={location.id}
          onClose={() => setShowReviewForm(false)}
          onSuccess={() => {
            setShowReviewForm(false);
            window.dispatchEvent(new PopStateEvent('popstate'));
          }}
        />
      )}
    </div>
  );
}
