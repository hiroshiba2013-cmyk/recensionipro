import { useState } from 'react';
import { Star, MapPin, ExternalLink, MessageSquare, Phone, Mail, Clock, Globe } from 'lucide-react';
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
  description?: string | null;
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

interface OpeningHours {
  [key: string]: { open: string; close: string } | null;
}

interface LocationCardProps {
  location: BusinessLocation;
}

const DAY_NAMES: { [key: string]: string } = {
  'monday': 'Lunedì',
  'tuesday': 'Martedì',
  'wednesday': 'Mercoledì',
  'thursday': 'Giovedì',
  'friday': 'Venerdì',
  'saturday': 'Sabato',
  'sunday': 'Domenica'
};

function formatBusinessHours(hours: any): string {
  if (!hours || typeof hours !== 'object') return 'Orari non disponibili';

  const today = new Date().toLocaleDateString('en-US', { weekday: 'lowercase' });
  const todayHours = hours[today];

  if (!todayHours) return 'Chiuso oggi';
  if (todayHours.open && todayHours.close) {
    return `Oggi: ${todayHours.open} - ${todayHours.close}`;
  }

  return 'Orari non disponibili';
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
  const hoursText = formatBusinessHours(location.business_hours);

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

        <div className="flex items-center gap-2 mb-3">
          {location.business?.category && (
            <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full font-medium">
              {location.business.category.name}
            </span>
          )}
          {location.avg_rating !== undefined && location.review_count !== undefined && location.review_count > 0 && (
            <div className="flex items-center gap-1 px-3 py-1 bg-yellow-50 rounded-full">
              <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
              <span className="font-semibold text-sm text-gray-900">{location.avg_rating.toFixed(1)}</span>
              <span className="text-xs text-gray-600">({location.review_count})</span>
            </div>
          )}
        </div>

        {location.description && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
            {location.description}
          </p>
        )}

        <div className="space-y-2 mb-4">
          <div className="flex items-start gap-2 text-sm text-gray-700">
            <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-600" />
            <span className="font-medium">{location.address}, {location.city} ({location.province})</span>
          </div>

          {location.business_hours && (
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Clock className="w-4 h-4 flex-shrink-0 text-green-600" />
              <span className="font-medium">{hoursText}</span>
            </div>
          )}

          {location.website && (
            <div className="flex items-center gap-2 text-sm">
              <Globe className="w-4 h-4 flex-shrink-0 text-blue-600" />
              <a
                href={location.website}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-blue-600 hover:text-blue-700 hover:underline font-medium truncate"
              >
                Visita il sito web
              </a>
            </div>
          )}

          {location.phone && (
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Phone className="w-4 h-4 flex-shrink-0 text-blue-600" />
              <a
                href={`tel:${location.phone}`}
                onClick={(e) => e.stopPropagation()}
                className="font-medium hover:text-blue-600"
              >
                {location.phone}
              </a>
            </div>
          )}

          {location.email && (
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Mail className="w-4 h-4 flex-shrink-0 text-blue-600" />
              <a
                href={`mailto:${location.email}`}
                onClick={(e) => e.stopPropagation()}
                className="font-medium hover:text-blue-600 truncate"
              >
                {location.email}
              </a>
            </div>
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
