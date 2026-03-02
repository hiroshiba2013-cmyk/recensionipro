import { useState } from 'react';
import { CheckCircle, XCircle, Eye, Star, Filter, MapPin, Building2, Calendar, Clock, User, Search, X, Edit, Save, X as CloseIcon } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Review {
  id: string;
  title: string;
  content: string;
  overall_rating: number;
  price_rating: number | null;
  service_rating: number | null;
  quality_rating: number | null;
  proof_image_url: string | null;
  review_status: string;
  created_at: string;
  customer: {
    full_name: string;
    nickname: string | null;
    email: string;
  };
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
}

interface ReviewsSectionProps {
  reviews: Review[];
  onReload: () => void;
  adminId: string;
}

export function ReviewsSection({ reviews, onReload, adminId }: ReviewsSectionProps) {
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchNickname, setSearchNickname] = useState('');
  const [filterQuality, setFilterQuality] = useState<number | ''>('');
  const [filterPrice, setFilterPrice] = useState<number | ''>('');
  const [filterService, setFilterService] = useState<number | ''>('');
  const [filterOverall, setFilterOverall] = useState<number | ''>('');
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
    return review.customer.nickname || review.customer.full_name;
  };

  const filteredReviews = reviews.filter(review => {
    // Filtro per stato
    if (filterStatus !== 'all' && review.review_status !== filterStatus) {
      return false;
    }

    // Filtro per nickname
    if (searchNickname.trim()) {
      const reviewerName = getReviewerName(review).toLowerCase();
      if (!reviewerName.includes(searchNickname.toLowerCase())) {
        return false;
      }
    }

    // Filtro per qualità
    if (filterQuality !== '' && review.quality_rating !== filterQuality) {
      return false;
    }

    // Filtro per prezzo
    if (filterPrice !== '' && review.price_rating !== filterPrice) {
      return false;
    }

    // Filtro per servizio
    if (filterService !== '' && review.service_rating !== filterService) {
      return false;
    }

    // Filtro per voto generale
    if (filterOverall !== '' && review.overall_rating !== filterOverall) {
      return false;
    }

    return true;
  });

  const clearFilters = () => {
    setFilterStatus('all');
    setSearchNickname('');
    setFilterQuality('');
    setFilterPrice('');
    setFilterService('');
    setFilterOverall('');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('it-IT', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getBusinessName = (review: Review) => {
    if (review.business_location) {
      return review.business_location.internal_name || review.business_location.name || review.businesses?.name || 'Attività';
    }
    if (review.unclaimed_business_location) {
      return review.unclaimed_business_location.name;
    }
    if (review.businesses) {
      return review.businesses.name;
    }
    return 'Attività non specificata';
  };

  const getLocationInfo = (review: Review) => {
    if (review.business_location) {
      return `${review.business_location.address}, ${review.business_location.city}`;
    }
    if (review.unclaimed_business_location) {
      return `${review.unclaimed_business_location.street}, ${review.unclaimed_business_location.city}`;
    }
    return 'Sede non specificata';
  };

  const approveReview = async (reviewId: string) => {
    try {
      const { error } = await supabase.rpc('approve_review', {
        review_id_param: reviewId,
        staff_id_param: adminId,
      });

      if (error) throw error;

      alert('Recensione approvata con successo!');
      onReload();
      setSelectedReview(null);
    } catch (error: any) {
      console.error('Error approving review:', error);
      alert(`Errore: ${error.message}`);
    }
  };

  const openRejectModal = (reviewId: string) => {
    setReviewToReject(reviewId);
    setRejectReason('');
    setShowRejectModal(true);
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

  const confirmReject = async () => {
    if (!reviewToReject) return;

    if (!rejectReason.trim()) {
      alert('Inserisci la motivazione del rifiuto');
      return;
    }

    try {
      const { error } = await supabase.rpc('reject_review', {
        review_id_param: reviewToReject,
        staff_id_param: adminId,
      });

      if (error) throw error;

      // Invia notifica all'utente con la motivazione
      const review = reviews.find(r => r.id === reviewToReject);
      if (review) {
        await supabase.from('notifications').insert({
          user_id: review.customer.email,
          title: 'Recensione rifiutata',
          message: `La tua recensione "${review.title}" è stata rifiutata. Motivazione: ${rejectReason}`,
          type: 'review_rejected',
        });
      }

      alert('Recensione rifiutata');
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

      {/* Pannello Filtri */}
      {showFilters && (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-900">Filtri di Ricerca</h3>
            <button
              onClick={clearFilters}
              className="flex items-center gap-2 text-red-600 hover:text-red-700 font-medium"
            >
              <X className="w-4 h-4" />
              Pulisci Filtri
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Ricerca per Nickname */}
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

            {/* Filtro Stato */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Stato Recensione
              </label>
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

            {/* Filtro Qualità */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                1. Qualità
              </label>
              <select
                value={filterQuality}
                onChange={(e) => setFilterQuality(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Tutte</option>
                <option value="1">⭐ Pessimo (1)</option>
                <option value="2">⭐⭐ Discreto (2)</option>
                <option value="3">⭐⭐⭐ Buono (3)</option>
                <option value="4">⭐⭐⭐⭐ Eccellente (4)</option>
                <option value="5">⭐⭐⭐⭐⭐ Ottimo (5)</option>
              </select>
            </div>

            {/* Filtro Prezzo */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                2. Prezzo
              </label>
              <select
                value={filterPrice}
                onChange={(e) => setFilterPrice(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Tutte</option>
                <option value="1">⭐ Pessimo (1)</option>
                <option value="2">⭐⭐ Discreto (2)</option>
                <option value="3">⭐⭐⭐ Buono (3)</option>
                <option value="4">⭐⭐⭐⭐ Eccellente (4)</option>
                <option value="5">⭐⭐⭐⭐⭐ Ottimo (5)</option>
              </select>
            </div>

            {/* Filtro Servizio */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                3. Esperienza / Servizio
              </label>
              <select
                value={filterService}
                onChange={(e) => setFilterService(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Tutte</option>
                <option value="1">⭐ Pessimo (1)</option>
                <option value="2">⭐⭐ Discreto (2)</option>
                <option value="3">⭐⭐⭐ Buono (3)</option>
                <option value="4">⭐⭐⭐⭐ Eccellente (4)</option>
                <option value="5">⭐⭐⭐⭐⭐ Ottimo (5)</option>
              </select>
            </div>

            {/* Filtro Voto Generale */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                4. Voto Generale
              </label>
              <select
                value={filterOverall}
                onChange={(e) => setFilterOverall(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Tutte</option>
                <option value="1">⭐ Pessimo (1)</option>
                <option value="2">⭐⭐ Discreto (2)</option>
                <option value="3">⭐⭐⭐ Buono (3)</option>
                <option value="4">⭐⭐⭐⭐ Eccellente (4)</option>
                <option value="5">⭐⭐⭐⭐⭐ Ottimo (5)</option>
              </select>
            </div>
          </div>

          {/* Contatore Risultati */}
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
          {filteredReviews.map((review) => (
            <div key={review.id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <User className="w-5 h-5 text-gray-500" />
                    <h3 className="font-bold text-lg text-gray-900">{getReviewerName(review)}</h3>
                    <span
                      className={`px-3 py-1 text-xs rounded-full font-medium ${
                        review.review_status === 'approved'
                          ? 'bg-green-100 text-green-800'
                          : review.review_status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {review.review_status === 'approved' ? 'Approvata' : review.review_status === 'pending' ? 'In attesa' : 'Rifiutata'}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(review.created_at)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{formatTime(review.created_at)}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 mb-2">
                    <Building2 className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-blue-900">{getBusinessName(review)}</p>
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <MapPin className="w-3 h-3" />
                        <span>{getLocationInfo(review)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => startEditReview(review)}
                    className="flex items-center gap-2 bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors"
                    title="Modifica recensione"
                  >
                    <Edit className="w-4 h-4" />
                    Modifica
                  </button>
                  <button
                    onClick={() => setSelectedReview(review)}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    Visualizza
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Dettaglio Recensione */}
      {selectedReview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
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
              {/* Info Recensore */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">Recensore</h4>
                <p className="text-gray-700">{getReviewerName(selectedReview)}</p>
                <p className="text-sm text-gray-500">{selectedReview.customer.email}</p>
              </div>

              {/* Info Attività */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  Attività Recensita
                </h4>
                <p className="font-semibold text-blue-900">{getBusinessName(selectedReview)}</p>
                <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                  <MapPin className="w-4 h-4" />
                  {getLocationInfo(selectedReview)}
                </p>
              </div>

              {/* Form Recensione (stessi campi del form utente) */}
              <div className="border-t pt-6">
                <h4 className="font-semibold text-gray-900 mb-4">Valutazioni</h4>

                <div className="space-y-4">
                  {/* Qualità */}
                  {selectedReview.quality_rating && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        1. Qualità
                      </label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-8 h-8 ${
                              star <= selectedReview.quality_rating!
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-sm text-gray-600 mt-2">
                        {selectedReview.quality_rating === 1 && 'Pessimo'}
                        {selectedReview.quality_rating === 2 && 'Discreto'}
                        {selectedReview.quality_rating === 3 && 'Buono'}
                        {selectedReview.quality_rating === 4 && 'Eccellente'}
                        {selectedReview.quality_rating === 5 && 'Ottimo'}
                      </p>
                    </div>
                  )}

                  {/* Prezzo */}
                  {selectedReview.price_rating && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        2. Prezzo
                      </label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-8 h-8 ${
                              star <= selectedReview.price_rating!
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-sm text-gray-600 mt-2">
                        {selectedReview.price_rating === 1 && 'Pessimo'}
                        {selectedReview.price_rating === 2 && 'Discreto'}
                        {selectedReview.price_rating === 3 && 'Buono'}
                        {selectedReview.price_rating === 4 && 'Eccellente'}
                        {selectedReview.price_rating === 5 && 'Ottimo'}
                      </p>
                    </div>
                  )}

                  {/* Servizio */}
                  {selectedReview.service_rating && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        3. Esperienza / Servizio
                      </label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-8 h-8 ${
                              star <= selectedReview.service_rating!
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-sm text-gray-600 mt-2">
                        {selectedReview.service_rating === 1 && 'Pessimo'}
                        {selectedReview.service_rating === 2 && 'Discreto'}
                        {selectedReview.service_rating === 3 && 'Buono'}
                        {selectedReview.service_rating === 4 && 'Eccellente'}
                        {selectedReview.service_rating === 5 && 'Ottimo'}
                      </p>
                    </div>
                  )}

                  {/* Voto Generale */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      4. Voto Generale
                    </label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-8 h-8 ${
                            star <= selectedReview.overall_rating
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      {selectedReview.overall_rating === 1 && 'Pessimo'}
                      {selectedReview.overall_rating === 2 && 'Discreto'}
                      {selectedReview.overall_rating === 3 && 'Buono'}
                      {selectedReview.overall_rating === 4 && 'Eccellente'}
                      {selectedReview.overall_rating === 5 && 'Ottimo'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Titolo e Contenuto */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Titolo della recensione
                </label>
                <p className="text-gray-900 font-medium">{selectedReview.title}</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Descrizione dell'esperienza
                </label>
                <p className="text-gray-700 whitespace-pre-wrap">{selectedReview.content}</p>
              </div>

              {/* Prova di Acquisto */}
              {selectedReview.proof_image_url && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Prova di Acquisto
                  </label>
                  <img
                    src={selectedReview.proof_image_url}
                    alt="Prova di acquisto"
                    className="w-full rounded-lg border border-gray-300"
                  />
                </div>
              )}

              {/* Azioni */}
              {selectedReview.review_status === 'pending' && (
                <div className="flex gap-3 pt-6 border-t">
                  <button
                    onClick={() => approveReview(selectedReview.id)}
                    className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 font-semibold"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Approva {selectedReview.proof_image_url ? '(50 punti)' : '(25 punti)'}
                  </button>
                  <button
                    onClick={() => openRejectModal(selectedReview.id)}
                    className="flex-1 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2 font-semibold"
                  >
                    <XCircle className="w-5 h-5" />
                    Rifiuta
                  </button>
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
                Inserisci la motivazione del rifiuto. L'utente riceverà una notifica con questa spiegazione.
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
            <div className="sticky top-0 bg-gradient-to-r from-amber-600 to-amber-700 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">Modifica Recensione</h3>
              <button
                onClick={cancelEditReview}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <CloseIcon className="w-5 h-5 text-white" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Info Recensore (sola lettura) */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">Informazioni Recensore</h4>
                <div className="text-sm space-y-1">
                  <p>
                    <span className="text-gray-600">Nome:</span>
                    <span className="ml-2 font-medium">{getReviewerName(editingReview)}</span>
                  </p>
                  <p>
                    <span className="text-gray-600">Email:</span>
                    <span className="ml-2 font-medium">{editingReview.customer.email}</span>
                  </p>
                  <p>
                    <span className="text-gray-600">Attività:</span>
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

              {/* Titolo */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Titolo Recensione *
                </label>
                <input
                  type="text"
                  value={editForm.title || ''}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  maxLength={100}
                />
              </div>

              {/* Contenuto */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Contenuto Recensione *
                </label>
                <textarea
                  value={editForm.content || ''}
                  onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                  rows={6}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
                />
              </div>

              {/* Valutazioni */}
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900">Valutazioni</h4>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    1. Qualità *
                  </label>
                  <select
                    value={editForm.quality_rating || ''}
                    onChange={(e) => setEditForm({ ...editForm, quality_rating: Number(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  >
                    <option value="">Seleziona...</option>
                    <option value="1">⭐ Pessimo (1)</option>
                    <option value="2">⭐⭐ Discreto (2)</option>
                    <option value="3">⭐⭐⭐ Buono (3)</option>
                    <option value="4">⭐⭐⭐⭐ Eccellente (4)</option>
                    <option value="5">⭐⭐⭐⭐⭐ Ottimo (5)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    2. Prezzo *
                  </label>
                  <select
                    value={editForm.price_rating || ''}
                    onChange={(e) => setEditForm({ ...editForm, price_rating: Number(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  >
                    <option value="">Seleziona...</option>
                    <option value="1">⭐ Pessimo (1)</option>
                    <option value="2">⭐⭐ Discreto (2)</option>
                    <option value="3">⭐⭐⭐ Buono (3)</option>
                    <option value="4">⭐⭐⭐⭐ Eccellente (4)</option>
                    <option value="5">⭐⭐⭐⭐⭐ Ottimo (5)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    3. Esperienza / Servizio *
                  </label>
                  <select
                    value={editForm.service_rating || ''}
                    onChange={(e) => setEditForm({ ...editForm, service_rating: Number(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  >
                    <option value="">Seleziona...</option>
                    <option value="1">⭐ Pessimo (1)</option>
                    <option value="2">⭐⭐ Discreto (2)</option>
                    <option value="3">⭐⭐⭐ Buono (3)</option>
                    <option value="4">⭐⭐⭐⭐ Eccellente (4)</option>
                    <option value="5">⭐⭐⭐⭐⭐ Ottimo (5)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    4. Voto Generale *
                  </label>
                  <select
                    value={editForm.overall_rating || ''}
                    onChange={(e) => setEditForm({ ...editForm, overall_rating: Number(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  >
                    <option value="">Seleziona...</option>
                    <option value="1">⭐ Pessimo (1)</option>
                    <option value="2">⭐⭐ Discreto (2)</option>
                    <option value="3">⭐⭐⭐ Buono (3)</option>
                    <option value="4">⭐⭐⭐⭐ Eccellente (4)</option>
                    <option value="5">⭐⭐⭐⭐⭐ Ottimo (5)</option>
                  </select>
                </div>
              </div>

              {/* Stato Recensione (sola lettura) */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">Stato</h4>
                <span
                  className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                    editingReview.review_status === 'approved'
                      ? 'bg-green-100 text-green-700'
                      : editingReview.review_status === 'rejected'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}
                >
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
