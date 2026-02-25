import { useState } from 'react';
import { CheckCircle, XCircle, Eye, Trash2, Edit, Star, Filter } from 'lucide-react';
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
    email: string;
  };
  business_id: string | null;
  unclaimed_business_id: string | null;
  business?: {
    name: string;
  } | null;
  unclaimed_business_location?: {
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
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [editForm, setEditForm] = useState({
    title: '',
    content: '',
    overall_rating: 5,
    price_rating: null as number | null,
    service_rating: null as number | null,
    quality_rating: null as number | null,
  });

  const filteredReviews = filterStatus === 'all'
    ? reviews
    : reviews.filter(r => r.review_status === filterStatus);

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

  const rejectReview = async (reviewId: string) => {
    if (!confirm('Sei sicuro di voler rifiutare questa recensione?')) return;

    try {
      const { error } = await supabase.rpc('reject_review', {
        review_id_param: reviewId,
        staff_id_param: adminId,
      });

      if (error) throw error;

      alert('Recensione rifiutata');
      onReload();
      setSelectedReview(null);
    } catch (error: any) {
      console.error('Error rejecting review:', error);
      alert(`Errore: ${error.message}`);
    }
  };

  const deleteReview = async (reviewId: string) => {
    if (!confirm('Sei sicuro di voler eliminare definitivamente questa recensione? Questa azione è irreversibile.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', reviewId);

      if (error) throw error;

      alert('Recensione eliminata con successo');
      onReload();
    } catch (error: any) {
      console.error('Error deleting review:', error);
      alert(`Errore: ${error.message}`);
    }
  };

  const startEdit = (review: Review) => {
    setEditingReview(review);
    setEditForm({
      title: review.title,
      content: review.content,
      overall_rating: review.overall_rating,
      price_rating: review.price_rating,
      service_rating: review.service_rating,
      quality_rating: review.quality_rating,
    });
  };

  const saveEdit = async () => {
    if (!editingReview) return;

    try {
      const { error } = await supabase
        .from('reviews')
        .update({
          title: editForm.title,
          content: editForm.content,
          overall_rating: editForm.overall_rating,
          price_rating: editForm.price_rating,
          service_rating: editForm.service_rating,
          quality_rating: editForm.quality_rating,
        })
        .eq('id', editingReview.id);

      if (error) throw error;

      alert('Recensione modificata con successo');
      setEditingReview(null);
      onReload();
    } catch (error: any) {
      console.error('Error updating review:', error);
      alert(`Errore: ${error.message}`);
    }
  };

  const changeStatus = async (reviewId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('reviews')
        .update({ review_status: newStatus })
        .eq('id', reviewId);

      if (error) throw error;

      alert('Stato recensione aggiornato');
      onReload();
    } catch (error: any) {
      console.error('Error changing status:', error);
      alert(`Errore: ${error.message}`);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-900">Gestione Recensioni</h2>
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-500" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2"
          >
            <option value="all">Tutte</option>
            <option value="pending">In attesa</option>
            <option value="approved">Approvate</option>
            <option value="rejected">Rifiutate</option>
          </select>
        </div>
      </div>

      {filteredReviews.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <Star className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Nessuna recensione trovata</p>
        </div>
      ) : (
        filteredReviews.map((review) => (
          <div key={review.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h3 className="font-bold text-lg text-gray-900">{review.title}</h3>
                <p className="text-sm text-gray-600">
                  di {review.customer.full_name} ({review.customer.email})
                </p>
                <p className="text-sm text-gray-500">
                  {new Date(review.created_at).toLocaleDateString('it-IT', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
                {(review.business?.name || review.unclaimed_business_location?.name) && (
                  <p className="text-sm text-blue-600 mt-1">
                    Attività: {review.business?.name || review.unclaimed_business_location?.name}
                  </p>
                )}
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-5 h-5 ${
                        star <= review.overall_rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
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
            </div>

            <p className="text-gray-700 mb-4 whitespace-pre-wrap">{review.content}</p>

            {(review.price_rating || review.service_rating || review.quality_rating) && (
              <div className="flex gap-6 mb-4 p-3 bg-gray-50 rounded-lg">
                {review.price_rating && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600 text-sm">Prezzo:</span>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${
                            star <= review.price_rating! ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}
                {review.service_rating && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600 text-sm">Servizio:</span>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${
                            star <= review.service_rating! ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}
                {review.quality_rating && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600 text-sm">Qualità:</span>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${
                            star <= review.quality_rating! ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {review.proof_image_url && (
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2 font-medium">Prova di acquisto:</p>
                <button
                  onClick={() => setSelectedReview(review)}
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  Visualizza immagine
                </button>
              </div>
            )}

            <div className="flex gap-2 flex-wrap">
              {review.review_status === 'pending' && (
                <>
                  <button
                    onClick={() => approveReview(review.id)}
                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Approva {review.proof_image_url ? '(50 punti)' : '(25 punti)'}
                  </button>
                  <button
                    onClick={() => rejectReview(review.id)}
                    className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <XCircle className="w-5 h-5" />
                    Rifiuta
                  </button>
                </>
              )}

              {review.review_status === 'approved' && (
                <select
                  value={review.review_status}
                  onChange={(e) => changeStatus(review.id, e.target.value)}
                  className="border border-gray-300 rounded-lg px-4 py-2"
                >
                  <option value="approved">Approvata</option>
                  <option value="rejected">Rifiuta</option>
                </select>
              )}

              <button
                onClick={() => startEdit(review)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Edit className="w-5 h-5" />
                Modifica
              </button>

              <button
                onClick={() => deleteReview(review.id)}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
              >
                <Trash2 className="w-5 h-5" />
                Elimina
              </button>
            </div>
          </div>
        ))
      )}

      {selectedReview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold">Prova di Acquisto</h3>
                <button
                  onClick={() => setSelectedReview(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              <img
                src={selectedReview.proof_image_url || ''}
                alt="Proof"
                className="w-full rounded-lg"
              />
            </div>
          </div>
        </div>
      )}

      {editingReview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold">Modifica Recensione</h3>
                <button
                  onClick={() => setEditingReview(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Titolo
                  </label>
                  <input
                    type="text"
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contenuto
                  </label>
                  <textarea
                    value={editForm.content}
                    onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                    rows={6}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valutazione Complessiva: {editForm.overall_rating}/5
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={editForm.overall_rating}
                    onChange={(e) => setEditForm({ ...editForm, overall_rating: parseInt(e.target.value) })}
                    className="w-full"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Prezzo
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      value={editForm.price_rating || ''}
                      onChange={(e) => setEditForm({ ...editForm, price_rating: e.target.value ? parseInt(e.target.value) : null })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2"
                      placeholder="1-5"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Servizio
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      value={editForm.service_rating || ''}
                      onChange={(e) => setEditForm({ ...editForm, service_rating: e.target.value ? parseInt(e.target.value) : null })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2"
                      placeholder="1-5"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Qualità
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      value={editForm.quality_rating || ''}
                      onChange={(e) => setEditForm({ ...editForm, quality_rating: e.target.value ? parseInt(e.target.value) : null })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2"
                      placeholder="1-5"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={saveEdit}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Salva Modifiche
                  </button>
                  <button
                    onClick={() => setEditingReview(null)}
                    className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Annulla
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
