import { Star, Clock, CheckCircle, MapPin, FileText } from 'lucide-react';
import { Review } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import ReportButton from '../moderation/ReportButton';

interface ReviewCardProps {
  review: Review;
}

const reviewTypeLabels: Record<string, { label: string; color: string }> = {
  service_used: { label: 'Servizio Fruito', color: 'bg-green-100 text-green-800' },
  booking_not_completed: { label: 'Prenotazione Non Completata', color: 'bg-red-100 text-red-800' },
  quote_request: { label: 'Richiesta Preventivo', color: 'bg-blue-100 text-blue-800' },
  customer_service: { label: 'Assistenza Clienti', color: 'bg-teal-100 text-teal-800' },
  problem_before_service: { label: 'Problema Pre-Servizio', color: 'bg-amber-100 text-amber-800' },
};

const BOOKING_CRITERION = { label: 'Gestione Prenotazione', field: 'booking_management_rating' };

const TYPE_CRITERIA: Record<string, { label: string; field: string }[]> = {
  service_used: [
    { label: 'Affidabilita', field: 'reliability_rating' },
    { label: 'Organizzazione', field: 'organization_rating' },
    { label: 'Esperienza/Servizio', field: 'experience_rating' },
    { label: 'Prezzo', field: 'price_rating' },
  ],
  booking_not_completed: [
    { label: 'Affidabilita', field: 'booking_affidabilita' },
    { label: 'Organizzazione', field: 'booking_organizzazione' },
    { label: 'Comunicazione', field: 'booking_comunicazione' },
  ],
  quote_request: [
    { label: 'Chiarezza', field: 'quote_chiarezza' },
    { label: 'Trasparenza', field: 'quote_trasparenza' },
    { label: 'Tempistiche Risposta', field: 'quote_tempistiche_risposta' },
    { label: 'Disponibilita', field: 'quote_disponibilita' },
  ],
  customer_service: [
    { label: 'Cortesia', field: 'cs_cortesia' },
    { label: 'Competenza', field: 'cs_competenza' },
    { label: 'Rapidita', field: 'cs_rapidita' },
    { label: 'Risoluzione Problema', field: 'cs_risoluzione_problema' },
  ],
  problem_before_service: [
    { label: 'Affidabilita', field: 'problem_affidabilita' },
    { label: 'Organizzazione', field: 'problem_organizzazione' },
    { label: 'Gestione Problema', field: 'problem_gestione_problema' },
    { label: 'Comunicazione', field: 'problem_comunicazione' },
  ],
};

const TYPE_BG: Record<string, string> = {
  service_used: 'from-green-50 to-emerald-50 border-green-200',
  booking_not_completed: 'from-red-50 to-rose-50 border-red-200',
  quote_request: 'from-blue-50 to-sky-50 border-blue-200',
  customer_service: 'from-teal-50 to-cyan-50 border-teal-200',
  problem_before_service: 'from-amber-50 to-yellow-50 border-amber-200',
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
    switch (Math.round(rating)) {
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
            className={`${sizeClass} ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
          />
        ))}
      </div>
    );
  };

  const reviewType = (review as any).review_type as string | undefined;
  const criteria = reviewType ? TYPE_CRITERIA[reviewType] : null;
  const bgClass = reviewType ? (TYPE_BG[reviewType] || 'from-gray-50 to-gray-50 border-gray-200') : '';
  const typeInfo = reviewType ? reviewTypeLabels[reviewType] : null;

  const hasBookingRating = (review as any)[BOOKING_CRITERION.field] != null && (review as any)[BOOKING_CRITERION.field] > 0;
  const hasCriteriaRatings = (criteria && criteria.some(c => (review as any)[c.field] != null && (review as any)[c.field] > 0)) || hasBookingRating;

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            {renderStars(review.overall_rating, 'md')}
            <span className="text-sm font-medium text-gray-700">{getRatingLabel(review.overall_rating)}</span>
            <span className="text-sm font-bold text-gray-900">{(review.overall_rating || 0).toFixed(1)}/5</span>
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
            <p className="text-base font-semibold text-gray-900 mb-1">{(review as any).business.name}</p>
          )}
          {(review as any).location_info && (
            <p className="text-sm text-gray-600 flex items-center gap-1 mb-1">
              <MapPin className="w-3 h-3" />
              {(review as any).location_info.name
                ? `${(review as any).location_info.name} - ${(review as any).location_info.city}`
                : (review as any).location_info.city}
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

      {typeInfo && (
        <div className="mb-3">
          <span className={`inline-flex items-center gap-1 text-xs font-medium px-3 py-1 rounded-full ${typeInfo.color}`}>
            {typeInfo.label}
          </span>
        </div>
      )}

      {hasCriteriaRatings && (
        <div className={`grid grid-cols-2 md:grid-cols-${Math.min((criteria?.length || 0) + (hasBookingRating ? 1 : 0), 5)} gap-3 mb-4 p-4 bg-gradient-to-r ${bgClass} rounded-lg border`}>
          {criteria?.map((c) => {
            const val = (review as any)[c.field];
            if (!val || val === 0) return null;
            return (
              <div key={c.field}>
                <p className="text-xs font-medium text-gray-700 mb-1">{c.label}</p>
                {renderStars(val)}
                <p className="text-xs text-gray-600 mt-1">{getRatingLabel(val)}</p>
              </div>
            );
          })}
          {hasBookingRating && (
            <div>
              <p className="text-xs font-medium text-gray-700 mb-1">{BOOKING_CRITERION.label}</p>
              {renderStars((review as any)[BOOKING_CRITERION.field])}
              <p className="text-xs text-gray-600 mt-1">{getRatingLabel((review as any)[BOOKING_CRITERION.field])}</p>
            </div>
          )}
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
          <p className="text-xs text-gray-500 mt-1">{formatDate(review.responses[0].created_at)}</p>
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
