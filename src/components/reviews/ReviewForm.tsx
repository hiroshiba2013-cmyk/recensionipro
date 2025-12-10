import { useState } from 'react';
import { Star, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface ReviewFormProps {
  businessId: string;
  businessName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function ReviewForm({ businessId, businessName, onClose, onSuccess }: ReviewFormProps) {
  const { profile } = useAuth();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!profile) {
      setError('Devi essere autenticato per lasciare una recensione');
      return;
    }

    if (profile.user_type !== 'customer') {
      setError('Solo i clienti possono lasciare recensioni');
      return;
    }

    if (profile.subscription_status !== 'active') {
      setError('È necessario un abbonamento attivo per lasciare recensioni');
      return;
    }

    if (rating === 0) {
      setError('Seleziona una valutazione');
      return;
    }

    if (!title.trim() || !content.trim()) {
      setError('Compila tutti i campi');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data: existingReview } = await supabase
        .from('reviews')
        .select('id')
        .eq('business_id', businessId)
        .eq('customer_id', profile.id)
        .maybeSingle();

      if (existingReview) {
        setError('Hai già recensito questa attività');
        setLoading(false);
        return;
      }

      const { error: insertError } = await supabase
        .from('reviews')
        .insert({
          business_id: businessId,
          customer_id: profile.id,
          rating,
          title: title.trim(),
          content: content.trim(),
        });

      if (insertError) throw insertError;

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error submitting review:', err);
      setError('Errore durante l\'invio della recensione');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Scrivi una recensione</h2>
            <p className="text-gray-600 mt-1">{businessName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Valutazione *
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="focus:outline-none transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-12 h-12 transition-colors ${
                      star <= (hoveredRating || rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-sm text-gray-600 mt-2">
                {rating === 1 && 'Pessimo'}
                {rating === 2 && 'Scarso'}
                {rating === 3 && 'Sufficiente'}
                {rating === 4 && 'Buono'}
                {rating === 5 && 'Eccellente'}
              </p>
            )}
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Titolo della recensione *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Riassumi la tua esperienza"
              maxLength={100}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">{title.length}/100 caratteri</p>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Descrizione *
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Descrivi la tua esperienza in dettaglio..."
              rows={6}
              maxLength={1000}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">{content.length}/1000 caratteri</p>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading || rating === 0}
              className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Invio in corso...' : 'Pubblica recensione'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
            >
              Annulla
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
