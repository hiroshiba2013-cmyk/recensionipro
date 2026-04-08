import { Star, Clock, CheckCircle, MapPin, FileText } from 'lucide-react';
import { Review } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import ReportButton from '../moderation/ReportButton';

interface ReviewCardProps {
  review: Review;
}

const reviewTypeLabels: Record<string, string> = {
  service_used: 'Servizio Fruito',
  booking_not_completed: 'Prenotazione Non Completata',
  quote_request: 'Richiesta Preventivo',
  customer_service: 'Assistenza Clienti',
  problem_before_service: 'Problema Pre-Servizio'
};

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
          {(review as any).business?.name && (
            <p className="text-base font-semibold text-gray-900 mb-1">
              {(review as any).business.name}
            </p>
          )}
          {(review as any).location_info && (
            <p className="text-sm text-gray-600 flex items-center gap-1 mb-1">
              <MapPin className="w-3 h-3" />
              {(review as any).location_info.name ?
                `${(review as any).location_info.name} - ${(review as any).location_info.city}` :
                (review as any).location_info.city
              }
            </p>
          )}
          {review.family_member ? (
            <p className="text-sm font-medium text-gray-700">{review.family_member.nickname}</p>
          ) : review.customer ? (
            <p className="text-sm font-medium text-gray-700">{review.customer.nickname || review.customer.full_name}</p>
          ) : null}
          <span className="text-xs text-gray-500">{formatDate(review.created_at)}</span>
        </div>
      </div>

      {review.title && <h4 className="font-semibold text-gray-900 mb-3">{review.title}</h4>}

      {(review as any).review_type && (
        <div className="mb-3">
          <span className={`inline-flex items-center gap-1 text-xs font-medium px-3 py-1 rounded-full ${
            (review as any).review_type === 'service_used'
              ? 'bg-green-100 text-green-800'
              : 'bg-blue-100 text-blue-800'
          }`}>
            {reviewTypeLabels[(review as any).review_type] || (review as any).review_type}
          </span>
        </div>
      )}

      {(review as any).review_type === 'service_used' && (review as any).booking_management_rating && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
          <div>
            <p className="text-xs font-medium text-gray-700 mb-1">Gestione Prenotazione</p>
            {renderStars((review as any).booking_management_rating)}
            <p className="text-xs text-gray-600 mt-1">{getRatingLabel((review as any).booking_management_rating)}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-700 mb-1">Affidabilità</p>
            {renderStars((review as any).reliability_rating)}
            <p className="text-xs text-gray-600 mt-1">{getRatingLabel((review as any).reliability_rating)}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-700 mb-1">Organizzazione</p>
            {renderStars((review as any).organization_rating)}
            <p className="text-xs text-gray-600 mt-1">{getRatingLabel((review as any).organization_rating)}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-700 mb-1">Esperienza</p>
            {renderStars((review as any).experience_rating)}
            <p className="text-xs text-gray-600 mt-1">{getRatingLabel((review as any).experience_rating)}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-700 mb-1">Prezzo</p>
            {renderStars((review as any).price_rating)}
            <p className="text-xs text-gray-600 mt-1">{getRatingLabel((review as any).price_rating)}</p>
          </div>
        </div>
      )}

      {(review as any).proof_documents && (review as any).proof_documents.length > 0 && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 text-sm text-blue-900">
            <FileText className="w-4 h-4" />
            <span className="font-medium">Documentazione fornita</span>
            <span className="text-blue-700">({(review as any).proof_documents.length} documento{(review as any).proof_documents.length > 1 ? 'i' : ''})</span>
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

      {!isOwnReview && (
        <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end">
          <ReportButton entityType="review" entityId={review.id} />
        </div>
      )}
    </div>
  );
}
