import { useState } from 'react';
import { CheckCircle, XCircle, Eye, Star, Filter, MapPin, Building2, Calendar, Clock, User, Search, X, FileEdit as Edit, Save, X as CloseIcon, ChevronDown, ChevronUp, Image as ImageIcon, Award, FileText } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Review {
  id: string;
  title: string;
  content: string;
  overall_rating: number;
  price_rating: number | null;
  service_rating: number | null;
  quality_rating: number | null;
  review_type: string | null;
  proof_image_url: string | null;
  proof_documents: string[] | null;
  points_awarded: number | null;
  review_status: string;
  created_at: string;
  customer: {
    id: string;
    full_name: string;
    nickname: string | null;
    email: string;
  };
  customer_id: string;
  family_member_id?: string | null;
  family_member?: {
    nickname: string | null;
    full_name: string;
  } | null;
  business_id: string | null;
  business_location_id: string | null;
  unclaimed_business_location_id: string | null;
  business_location?: {
    name: string;
    internal_name: string | null;
    city: string;
    address: string;
  } | null;
  unclaimed_business_location?: {
    name: string;
    city: string;
    street: string;
  } | null;
  businesses?: {
    name: string;
  } | null;
  booking_management_rating?: number | null;
  reliability_rating?: number | null;
  organization_rating?: number | null;
  experience_rating?: number | null;
  booking_gestione_prenotazione?: number | null;
  booking_affidabilita?: number | null;
  booking_organizzazione?: number | null;
  booking_comunicazione?: number | null;
  quote_chiarezza?: number | null;
  quote_trasparenza?: number | null;
  quote_tempistiche_risposta?: number | null;
  quote_disponibilita?: number | null;
  cs_cortesia?: number | null;
  cs_competenza?: number | null;
  cs_rapidita?: number | null;
  cs_risoluzione_problema?: number | null;
  problem_affidabilita?: number | null;
  problem_organizzazione?: number | null;
  problem_gestione_problema?: number | null;
  problem_comunicazione?: number | null;
}

const reviewTypeLabels: Record<string, { label: string; color: string; bg: string }> = {
  service_used: { label: 'Servizio Fruito', color: 'bg-green-100 text-green-800', bg: 'from-green-50 to-emerald-50 border-green-200' },
  booking_not_completed: { label: 'Prenotazione Non Completata', color: 'bg-red-100 text-red-800', bg: 'from-red-50 to-rose-50 border-red-200' },
  quote_request: { label: 'Richiesta Preventivo', color: 'bg-blue-100 text-blue-800', bg: 'from-blue-50 to-sky-50 border-blue-200' },
  customer_service: { label: 'Assistenza Clienti', color: 'bg-teal-100 text-teal-800', bg: 'from-teal-50 to-cyan-50 border-teal-200' },
  problem_before_service: { label: 'Problema Pre-Servizio', color: 'bg-amber-100 text-amber-800', bg: 'from-amber-50 to-yellow-50 border-amber-200' },
};

const TYPE_CRITERIA: Record<string, { label: string; field: string }[]> = {
  service_used: [
    { label: 'Gestione Prenotazione', field: 'booking_management_rating' },
    { label: 'Affidabilita\'', field: 'reliability_rating' },
    { label: 'Organizzazione', field: 'organization_rating' },
    { label: 'Esperienza/Servizio', field: 'experience_rating' },
    { label: 'Prezzo', field: 'price_rating' },
  ],
  booking_not_completed: [
    { label: 'Gestione Prenotazione', field: 'booking_gestione_prenotazione' },
    { label: 'Affidabilita\'', field: 'booking_affidabilita' },
    { label: 'Organizzazione', field: 'booking_organizzazione' },
    { label: 'Comunicazione', field: 'booking_comunicazione' },
  ],
  quote_request: [
    { label: 'Chiarezza', field: 'quote_chiarezza' },
    { label: 'Trasparenza', field: 'quote_trasparenza' },
    { label: 'Tempistiche Risposta', field: 'quote_tempistiche_risposta' },
    { label: 'Disponibilita\'', field: 'quote_disponibilita' },
  ],
  customer_service: [
    { label: 'Cortesia', field: 'cs_cortesia' },
    { label: 'Competenza', field: 'cs_competenza' },
    { label: 'Rapidita\'', field: 'cs_rapidita' },
    { label: 'Risoluzione Problema', field: 'cs_risoluzione_problema' },
  ],
  problem_before_service: [
    { label: 'Affidabilita\'', field: 'problem_affidabilita' },
    { label: 'Organizzazione', field: 'problem_organizzazione' },
    { label: 'Gestione Problema', field: 'problem_gestione_problema' },
    { label: 'Comunicazione', field: 'problem_comunicazione' },
  ],
};

const REVIEW_TYPE_OPTIONS = [
  { value: '', label: 'Tutti i tipi' },
  { value: 'service_used', label: 'Ho usufruito del servizio' },
  { value: 'booking_not_completed', label: 'Prenotazione non completata' },
  { value: 'quote_request', label: 'Preventivo / Informazioni' },
  { value: 'customer_service', label: 'Assistenza Clienti' },
  { value: 'problem_before_service', label: 'Problema pre-servizio' },
];

const RATING_OPTIONS = [
  { value: '', label: 'Qualsiasi' },
  { value: '1', label: '1 stella e piu' },
  { value: '2', label: '2 stelle e piu' },
  { value: '3', label: '3 stelle e piu' },
  { value: '4', label: '4 stelle e piu' },
  { value: '5', label: '5 stelle' },
];

interface ReviewsSectionProps {
  reviews: Review[];
  onReload: () => void;
  adminId: string;
}

export function ReviewsSection({ reviews, onReload, adminId }: ReviewsSectionProps) {
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterReviewType, setFilterReviewType] = useState<string>('');
  const [searchNickname, setSearchNickname] = useState('');
  const [searchBusinessName, setSearchBusinessName] = useState('');
  const [minOverallRating, setMinOverallRating] = useState<string>('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [reviewToReject, setReviewToReject] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [editForm, setEditForm] = useState<Partial<Review> | null>(null);

  const getReviewerName = (review: Review) => {
    if (review.family_member) {
      return review.family_member.nickname || review.family_member.full_name;
    }
    return review.customer?.nickname || review.customer?.full_name || 'Utente';
  };

  const getBusinessName = (review: Review) => {
    if (review.business_location) {
      return review.business_location.internal_name || review.business_location.name || review.businesses?.name || 'Attivita\'';
    }
    if (review.unclaimed_business_location) {
      return review.unclaimed_business_location.name;
    }
    if (review.businesses) {
      return review.businesses.name;
    }
    return 'Attivita\' non specificata';
  };

  const getLocationInfo = (review: Review) => {
    if (review.business_location) {
      return `${review.business_location.address}, ${review.business_location.city}`;
    }
    if (review.unclaimed_business_location) {
      return `${review.unclaimed_business_location.street}, ${review.unclaimed_business_location.city}`;
    }
    return '';
  };

  const getExpectedPoints = (review: Review) => {
    if (review.review_status === 'approved' && review.points_awarded) return review.points_awarded;
    return review.proof_image_url ? 50 : 25;
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

  const renderStars = (rating: number, size: 'sm' | 'md' | 'lg' = 'sm') => {
    const sizeClass = size === 'lg' ? 'w-7 h-7' : size === 'md' ? 'w-5 h-5' : 'w-4 h-4';
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClass} ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
          />
        ))}
      </div>
    );
  };

  const getCriteriaForReview = (review: Review) => {
    if (!review.review_type) return null;
    const criteria = TYPE_CRITERIA[review.review_type];
    if (!criteria) return null;
    const hasValues = criteria.some(c => {
      const val = (review as any)[c.field];
      return val != null && val > 0;
    });
    return hasValues ? criteria : null;
  };

  const filteredReviews = reviews.filter(review => {
    if (filterStatus !== 'all' && review.review_status !== filterStatus) return false;
    if (filterReviewType && review.review_type !== filterReviewType) return false;
    if (searchNickname.trim()) {
      const reviewerName = getReviewerName(review).toLowerCase();
      if (!reviewerName.includes(searchNickname.toLowerCase())) return false;
    }
    if (searchBusinessName.trim()) {
      const businessName = getBusinessName(review).toLowerCase();
      if (!businessName.includes(searchBusinessName.toLowerCase())) return false;
    }
    if (minOverallRating && review.overall_rating < Number(minOverallRating)) return false;
    return true;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('it-IT', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const clearFilters = () => {
    setFilterStatus('all');
    setFilterReviewType('');
    setSearchNickname('');
    setSearchBusinessName('');
    setMinOverallRating('');
  };

  const approveReview = async (reviewId: string) => {
    try {
      const review = reviews.find(r => r.id === reviewId);
      if (!review) return;

      if (review.proof_image_url) {
        const filePath = review.proof_image_url.split('/').pop();
        if (filePath) {
          await supabase.storage.from('review-proofs').remove([filePath]);
        }
      }

      const { error } = await supabase.rpc('approve_review', {
        review_id_param: reviewId,
        staff_id_param: adminId,
      });

      if (error) throw error;

      await supabase
        .from('reviews')
        .update({ proof_image_url: null })
        .eq('id', reviewId);

      alert('Recensione approvata con successo!');
      onReload();
      setSelectedReview(null);
    } catch (error: any) {
      console.error('Error approving review:', error);
      alert(`Errore: ${error.message}`);
    }
  };

  const approveReviewWithoutProof = async (reviewId: string) => {
    try {
      const review = reviews.find(r => r.id === reviewId);
      if (!review) return;

      if (review.proof_image_url) {
        const filePath = review.proof_image_url.split('/').pop();
        if (filePath) {
          await supabase.storage.from('review-proofs').remove([filePath]);
        }
      }

      await supabase
        .from('reviews')
        .update({ proof_image_url: null })
        .eq('id', reviewId);

      const { error } = await supabase.rpc('approve_review', {
        review_id_param: reviewId,
        staff_id_param: adminId,
      });

      if (error) throw error;

      alert('Recensione approvata con 25 punti (prova rifiutata).');
      onReload();
      setSelectedReview(null);
    } catch (error: any) {
      console.error('Error approving review without proof:', error);
      alert(`Errore: ${error.message}`);
    }
  };

  const openRejectModal = (reviewId: string) => {
    setReviewToReject(reviewId);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const confirmReject = async () => {
    if (!reviewToReject) return;
    if (!rejectReason.trim()) {
      alert('Inserisci la motivazione del rifiuto');
      return;
    }

    try {
      const review = reviews.find(r => r.id === reviewToReject);

      if (review?.proof_image_url) {
        const filePath = review.proof_image_url.split('/').pop();
        if (filePath) {
          await supabase.storage.from('review-proofs').remove([filePath]);
        }
      }

      const { error } = await supabase.rpc('reject_review', {
        review_id_param: reviewToReject,
        staff_id_param: adminId,
      });

      if (error) throw error;

      await supabase
        .from('reviews')
        .update({ proof_image_url: null })
        .eq('id', reviewToReject);

      alert('Recensione rifiutata.');
      setShowRejectModal(false);
      setRejectReason('');
      setReviewToReject(null);
      onReload();
      setSelectedReview(null);
    } catch (error: any) {
      console.error('Error rejecting review:', error);
      alert(`Errore: ${error.message}`);
    }
  };

  const startEditReview = (review: Review) => {
    setEditingReview(review);
    setEditForm({
      title: review.title,
      content: review.content,
      overall_rating: review.overall_rating,
      quality_rating: review.quality_rating,
      price_rating: review.price_rating,
      service_rating: review.service_rating,
    });
  };

  const cancelEditReview = () => {
    setEditingReview(null);
    setEditForm(null);
  };

  const saveReviewEdit = async () => {
    if (!editingReview || !editForm) return;
    try {
      const { error } = await supabase
        .from('reviews')
        .update({
          title: editForm.title,
          content: editForm.content,
          overall_rating: editForm.overall_rating,
          quality_rating: editForm.quality_rating,
          price_rating: editForm.price_rating,
          service_rating: editForm.service_rating,
        })
        .eq('id', editingReview.id);

      if (error) throw error;

      alert('Recensione aggiornata con successo');
      setEditingReview(null);
      setEditForm(null);
      onReload();
      if (selectedReview?.id === editingReview.id) {
        setSelectedReview(null);
      }
    } catch (error: any) {
      console.error('Error updating review:', error);
      alert(`Errore: ${error.message}`);
    }
  };

  const renderReviewCard = (review: Review) => {
    const typeInfo = review.review_type ? reviewTypeLabels[review.review_type] : null;
    const criteria = getCriteriaForReview(review);
    const points = getExpectedPoints(review);
    const locationInfo = getLocationInfo(review);

    return (
      <div
        key={review.id}
        className={`bg-white rounded-xl shadow-sm border-2 transition-all hover:shadow-md ${
          review.review_status === 'pending'
            ? 'border-yellow-300 bg-yellow-50/20'
            : review.review_status === 'approved'
            ? 'border-green-200'
            : 'border-red-200'
        }`}
      >
        <div className="p-5">
          {/* Header: reviewer + status + actions */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <User className="w-4 h-4 text-gray-500 flex-shrink-0" />
                <span className="font-bold text-gray-900">{getReviewerName(review)}</span>
                <span className={`px-2.5 py-0.5 text-xs rounded-full font-semibold ${
                  review.review_status === 'approved'
                    ? 'bg-green-100 text-green-800'
                    : review.review_status === 'pending'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {review.review_status === 'approved' ? 'Approvata' : review.review_status === 'pending' ? 'In attesa' : 'Rifiutata'}
                </span>
                {review.proof_image_url && (
                  <span className="flex items-center gap-1 px-2.5 py-0.5 text-xs rounded-full font-semibold bg-blue-100 text-blue-800">
                    <ImageIcon className="w-3 h-3" />
                    Con prova
                  </span>
                )}
                {review.proof_documents && review.proof_documents.length > 0 && (
                  <span className="flex items-center gap-1 px-2.5 py-0.5 text-xs rounded-full font-semibold bg-blue-100 text-blue-800">
                    <FileText className="w-3 h-3" />
                    {review.proof_documents.length} doc
                  </span>
                )}
                <span className={`flex items-center gap-1 px-2.5 py-0.5 text-xs rounded-full font-bold ${
                  points === 50 ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-700'
                }`}>
                  <Award className="w-3 h-3" />
                  {review.review_status === 'approved' ? `${review.points_awarded || points} punti` : `${points} punti`}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatDate(review.created_at)}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatTime(review.created_at)}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => startEditReview(review)}
                className="p-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors"
                title="Modifica"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={() => setSelectedReview(review)}
                className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                title="Dettaglio"
              >
                <Eye className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Business info */}
          <div className="flex items-start gap-2 mb-3">
            <Building2 className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <p className="font-semibold text-blue-900 text-sm">{getBusinessName(review)}</p>
              {locationInfo && (
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {locationInfo}
                </p>
              )}
            </div>
          </div>

          {/* Type badge */}
          {typeInfo && (
            <div className="mb-3">
              <span className={`inline-flex text-xs font-medium px-2.5 py-1 rounded-full ${typeInfo.color}`}>
                {typeInfo.label}
              </span>
            </div>
          )}

          {/* Overall rating */}
          <div className="flex items-center gap-2 mb-3">
            {renderStars(review.overall_rating, 'md')}
            <span className="text-sm font-bold text-gray-900">{review.overall_rating}/5</span>
            <span className="text-sm text-gray-600">{getRatingLabel(review.overall_rating)}</span>
          </div>

          {/* Type-specific criteria ratings */}
          {criteria && (
            <div className={`grid grid-cols-2 sm:grid-cols-${Math.min(criteria.length, 5)} gap-2 mb-3 p-3 bg-gradient-to-r ${typeInfo?.bg || 'from-gray-50 to-gray-50 border-gray-200'} rounded-lg border`}>
              {criteria.map((c) => {
                const val = (review as any)[c.field];
                if (!val || val === 0) return null;
                return (
                  <div key={c.field}>
                    <p className="text-xs font-medium text-gray-700 mb-0.5">{c.label}</p>
                    {renderStars(val)}
                    <p className="text-xs text-gray-500 mt-0.5">{getRatingLabel(val)}</p>
                  </div>
                );
              })}
            </div>
          )}

          {/* Title + content preview */}
          {review.title && (
            <h4 className="font-semibold text-gray-900 text-sm mb-1">{review.title}</h4>
          )}
          <p className="text-sm text-gray-700 line-clamp-2">{review.content}</p>

          {/* Quick approve/reject for pending */}
          {review.review_status === 'pending' && (
            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100">
              <button
                onClick={() => approveReview(review.id)}
                className="flex items-center gap-1.5 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-semibold"
              >
                <CheckCircle className="w-4 h-4" />
                Approva ({getExpectedPoints(review)} pt)
              </button>
              {review.proof_image_url && (
                <button
                  onClick={() => approveReviewWithoutProof(review.id)}
                  className="flex items-center gap-1.5 bg-yellow-600 text-white px-3 py-2 rounded-lg hover:bg-yellow-700 transition-colors text-sm font-medium"
                >
                  Approva senza prova (25 pt)
                </button>
              )}
              <button
                onClick={() => openRejectModal(review.id)}
                className="flex items-center gap-1.5 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm font-semibold"
              >
                <XCircle className="w-4 h-4" />
                Rifiuta
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-900">Gestione Recensioni</h2>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Filter className="w-5 h-5" />
          {showFilters ? 'Nascondi Filtri' : 'Mostra Filtri'}
        </button>
      </div>

      {showFilters && (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-5">
            <h3 className="text-lg font-bold text-gray-900">Filtri di Ricerca</h3>
            <button
              onClick={clearFilters}
              className="flex items-center gap-2 text-red-600 hover:text-red-700 font-medium text-sm"
            >
              <X className="w-4 h-4" />
              Pulisci tutti
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Search className="w-4 h-4 inline mr-1" />
                Cerca per Nickname
              </label>
              <input
                type="text"
                value={searchNickname}
                onChange={(e) => setSearchNickname(e.target.value)}
                placeholder="Inserisci nickname..."
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Building2 className="w-4 h-4 inline mr-1" />
                Cerca per Nome Attivita'
              </label>
              <input
                type="text"
                value={searchBusinessName}
                onChange={(e) => setSearchBusinessName(e.target.value)}
                placeholder="Inserisci nome attivita'..."
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Stato Recensione</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Tutte ({reviews.length})</option>
                <option value="pending">In attesa ({reviews.filter(r => r.review_status === 'pending').length})</option>
                <option value="approved">Approvate ({reviews.filter(r => r.review_status === 'approved').length})</option>
                <option value="rejected">Rifiutate ({reviews.filter(r => r.review_status === 'rejected').length})</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Tipo di Esperienza</label>
              <select
                value={filterReviewType}
                onChange={(e) => setFilterReviewType(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {REVIEW_TYPE_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Voto Generale Minimo</label>
              <select
                value={minOverallRating}
                onChange={(e) => setMinOverallRating(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {RATING_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              <strong className="text-gray-900">{filteredReviews.length}</strong> recensioni trovate su <strong className="text-gray-900">{reviews.length}</strong> totali
            </p>
          </div>
        </div>
      )}

      {filteredReviews.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <Star className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Nessuna recensione trovata</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredReviews.map(renderReviewCard)}
        </div>
      )}

      {/* Modal Dettaglio Recensione */}
      {selectedReview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between z-10">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Dettaglio Recensione</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {formatDate(selectedReview.created_at)} alle {formatTime(selectedReview.created_at)}
                </p>
              </div>
              <button
                onClick={() => setSelectedReview(null)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Reviewer info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">Recensore</h4>
                <p className="text-gray-700 font-medium">{getReviewerName(selectedReview)}</p>
                <p className="text-sm text-gray-500">{selectedReview.customer?.email}</p>
              </div>

              {/* Business info */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  Attivita' Recensita
                </h4>
                <p className="font-semibold text-blue-900">{getBusinessName(selectedReview)}</p>
                {getLocationInfo(selectedReview) && (
                  <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                    <MapPin className="w-4 h-4" />
                    {getLocationInfo(selectedReview)}
                  </p>
                )}
              </div>

              {/* Points info */}
              <div className={`rounded-lg p-4 flex items-center gap-3 ${
                selectedReview.proof_image_url ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-50 border border-gray-200'
              }`}>
                <Award className={`w-6 h-6 ${selectedReview.proof_image_url ? 'text-yellow-600' : 'text-gray-600'}`} />
                <div>
                  <p className="font-bold text-gray-900">
                    {selectedReview.review_status === 'approved'
                      ? `${selectedReview.points_awarded || 0} punti assegnati`
                      : `${getExpectedPoints(selectedReview)} punti previsti`
                    }
                  </p>
                  <p className="text-sm text-gray-600">
                    {selectedReview.proof_image_url
                      ? 'Recensione con prova di acquisto (50 punti)'
                      : 'Recensione senza prova (25 punti)'
                    }
                  </p>
                </div>
              </div>

              {/* Review type badge */}
              {selectedReview.review_type && reviewTypeLabels[selectedReview.review_type] && (
                <div>
                  <span className={`inline-flex text-sm font-medium px-3 py-1.5 rounded-full ${reviewTypeLabels[selectedReview.review_type].color}`}>
                    {reviewTypeLabels[selectedReview.review_type].label}
                  </span>
                </div>
              )}

              {/* Overall rating */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Voto Generale</h4>
                <div className="flex items-center gap-3">
                  {renderStars(selectedReview.overall_rating, 'lg')}
                  <span className="text-lg font-bold text-gray-900">{selectedReview.overall_rating}/5</span>
                  <span className="text-gray-600">{getRatingLabel(selectedReview.overall_rating)}</span>
                </div>
              </div>

              {/* Type-specific criteria */}
              {(() => {
                const criteria = getCriteriaForReview(selectedReview);
                const typeInfo = selectedReview.review_type ? reviewTypeLabels[selectedReview.review_type] : null;
                if (!criteria) return null;
                return (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Valutazioni Dettagliate</h4>
                    <div className={`grid grid-cols-2 md:grid-cols-${Math.min(criteria.length, 5)} gap-4 p-4 bg-gradient-to-r ${typeInfo?.bg || 'from-gray-50 to-gray-50 border-gray-200'} rounded-lg border`}>
                      {criteria.map((c) => {
                        const val = (review: any) => (selectedReview as any)[c.field];
                        const rating = (selectedReview as any)[c.field];
                        if (!rating || rating === 0) return null;
                        return (
                          <div key={c.field}>
                            <p className="text-xs font-semibold text-gray-700 mb-1">{c.label}</p>
                            {renderStars(rating, 'md')}
                            <p className="text-sm text-gray-600 mt-1">{getRatingLabel(rating)}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* Title + content */}
              {selectedReview.title && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Titolo</h4>
                  <p className="text-gray-900 font-medium text-lg">{selectedReview.title}</p>
                </div>
              )}
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Descrizione dell'esperienza</h4>
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{selectedReview.content}</p>
              </div>

              {/* Proof documents */}
              {selectedReview.proof_documents && selectedReview.proof_documents.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <h4 className="font-semibold text-blue-900">
                      Documentazione fornita ({selectedReview.proof_documents.length} documento{selectedReview.proof_documents.length > 1 ? 'i' : ''})
                    </h4>
                  </div>
                </div>
              )}

              {/* Proof image */}
              {selectedReview.proof_image_url && (
                <div className="bg-gradient-to-br from-blue-50 to-green-50 border-2 border-blue-300 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <ImageIcon className="w-5 h-5 text-blue-600" />
                    <h4 className="text-base font-bold text-blue-900">
                      Prova di Acquisto (Visibile SOLO in Admin)
                    </h4>
                    <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-bold rounded-full">50 PUNTI</span>
                  </div>
                  <div className="bg-white rounded-lg p-2 border border-blue-200">
                    <img
                      src={selectedReview.proof_image_url}
                      alt="Prova di acquisto"
                      className="w-full rounded-lg"
                    />
                  </div>
                  <p className="text-xs text-blue-700 mt-2 italic">
                    Questa immagine NON e' visibile pubblicamente. Viene eliminata dopo l'approvazione o il rifiuto.
                  </p>
                </div>
              )}

              {/* Actions */}
              {selectedReview.review_status === 'pending' && (
                <div className="space-y-3 pt-6 border-t">
                  <div className="flex gap-3">
                    <button
                      onClick={() => approveReview(selectedReview.id)}
                      className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 font-semibold"
                    >
                      <CheckCircle className="w-5 h-5" />
                      Approva ({getExpectedPoints(selectedReview)} punti)
                    </button>
                    <button
                      onClick={() => openRejectModal(selectedReview.id)}
                      className="flex-1 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2 font-semibold"
                    >
                      <XCircle className="w-5 h-5" />
                      Rifiuta
                    </button>
                  </div>

                  {selectedReview.proof_image_url && (
                    <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4">
                      <p className="text-sm text-yellow-800 font-medium mb-3">
                        Se l'immagine non e' valida ma la recensione e' corretta, puoi approvarla con 25 punti:
                      </p>
                      <button
                        onClick={() => approveReviewWithoutProof(selectedReview.id)}
                        className="w-full bg-yellow-600 text-white px-6 py-3 rounded-lg hover:bg-yellow-700 transition-colors flex items-center justify-center gap-2 font-semibold"
                      >
                        <CheckCircle className="w-5 h-5" />
                        Approva senza prova (25 punti)
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Rifiuto con Motivazione */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Rifiuta Recensione</h3>
              <p className="text-gray-600 mb-4">
                Inserisci la motivazione del rifiuto. L'utente ricevera' una notifica con questa spiegazione.
              </p>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Es: La recensione contiene linguaggio inappropriato..."
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
              />
              <div className="flex gap-3 mt-6">
                <button
                  onClick={confirmReject}
                  disabled={!rejectReason.trim()}
                  className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Conferma Rifiuto
                </button>
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectReason('');
                    setReviewToReject(null);
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
                >
                  Annulla
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Modifica Recensione */}
      {editingReview && editForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[70]">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-amber-600 to-amber-700 px-6 py-4 flex items-center justify-between z-10">
              <h3 className="text-xl font-bold text-white">Modifica Recensione</h3>
              <button
                onClick={cancelEditReview}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <CloseIcon className="w-5 h-5 text-white" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">Informazioni Recensore</h4>
                <div className="text-sm space-y-1">
                  <p>
                    <span className="text-gray-600">Nome:</span>
                    <span className="ml-2 font-medium">{getReviewerName(editingReview)}</span>
                  </p>
                  <p>
                    <span className="text-gray-600">Email:</span>
                    <span className="ml-2 font-medium">{editingReview.customer?.email}</span>
                  </p>
                  <p>
                    <span className="text-gray-600">Attivita':</span>
                    <span className="ml-2 font-medium">{getBusinessName(editingReview)}</span>
                  </p>
                  <p>
                    <span className="text-gray-600">Data:</span>
                    <span className="ml-2 font-medium">
                      {formatDate(editingReview.created_at)} alle {formatTime(editingReview.created_at)}
                    </span>
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Titolo Recensione *</label>
                <input
                  type="text"
                  value={editForm.title || ''}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  maxLength={100}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Contenuto Recensione *</label>
                <textarea
                  value={editForm.content || ''}
                  onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                  rows={6}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Voto Generale *</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setEditForm({ ...editForm, overall_rating: star })}
                      className="p-1"
                    >
                      <Star
                        className={`w-8 h-8 transition-colors ${
                          star <= (editForm.overall_rating || 0)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300 hover:text-yellow-300'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="self-center text-sm text-gray-600 ml-2">
                    {editForm.overall_rating ? getRatingLabel(editForm.overall_rating) : ''}
                  </span>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">Stato</h4>
                <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                  editingReview.review_status === 'approved'
                    ? 'bg-green-100 text-green-700'
                    : editingReview.review_status === 'rejected'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {editingReview.review_status === 'approved'
                    ? 'Approvata'
                    : editingReview.review_status === 'rejected'
                    ? 'Rifiutata'
                    : 'In Attesa'}
                </span>
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t border-gray-200">
              <button
                onClick={cancelEditReview}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
              >
                Annulla
              </button>
              <button
                onClick={saveReviewEdit}
                disabled={!editForm.title || !editForm.content || !editForm.overall_rating}
                className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium flex items-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                Salva Modifiche
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
