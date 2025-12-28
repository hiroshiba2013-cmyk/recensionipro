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
  const [priceRating, setPriceRating] = useState(0);
  const [serviceRating, setServiceRating] = useState(0);
  const [qualityRating, setQualityRating] = useState(0);
  const [overallRating, setOverallRating] = useState(0);
  const [hoveredPriceRating, setHoveredPriceRating] = useState(0);
  const [hoveredServiceRating, setHoveredServiceRating] = useState(0);
  const [hoveredQualityRating, setHoveredQualityRating] = useState(0);
  const [hoveredOverallRating, setHoveredOverallRating] = useState(0);
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

    if (priceRating === 0 || serviceRating === 0 || qualityRating === 0 || overallRating === 0) {
      setError('Completa tutte le valutazioni');
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

      const avgRating = Math.round((priceRating + serviceRating + qualityRating + overallRating) / 4);

      const { error: insertError } = await supabase
        .from('reviews')
        .insert({
          business_id: businessId,
          customer_id: profile.id,
          rating: avgRating,
          price_rating: priceRating,
          service_rating: serviceRating,
          quality_rating: qualityRating,
          overall_rating: overallRating,
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

          <div className="mb-6 space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Prezzo *
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setPriceRating(star)}
                    onMouseEnter={() => setHoveredPriceRating(star)}
                    onMouseLeave={() => setHoveredPriceRating(0)}
                    className="focus:outline-none transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-10 h-10 transition-colors ${
                        star <= (hoveredPriceRating || priceRating)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
              {priceRating > 0 && (
                <p className="text-sm text-gray-600 mt-2">
                  {priceRating === 1 && 'Pessimo'}
                  {priceRating === 2 && 'Discreto'}
                  {priceRating === 3 && 'Buono'}
                  {priceRating === 4 && 'Eccellente'}
                  {priceRating === 5 && 'Ottimo'}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Servizio *
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setServiceRating(star)}
                    onMouseEnter={() => setHoveredServiceRating(star)}
                    onMouseLeave={() => setHoveredServiceRating(0)}
                    className="focus:outline-none transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-10 h-10 transition-colors ${
                        star <= (hoveredServiceRating || serviceRating)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
              {serviceRating > 0 && (
                <p className="text-sm text-gray-600 mt-2">
                  {serviceRating === 1 && 'Pessimo'}
                  {serviceRating === 2 && 'Discreto'}
                  {serviceRating === 3 && 'Buono'}
                  {serviceRating === 4 && 'Eccellente'}
                  {serviceRating === 5 && 'Ottimo'}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Qualità *
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setQualityRating(star)}
                    onMouseEnter={() => setHoveredQualityRating(star)}
                    onMouseLeave={() => setHoveredQualityRating(0)}
                    className="focus:outline-none transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-10 h-10 transition-colors ${
                        star <= (hoveredQualityRating || qualityRating)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
              {qualityRating > 0 && (
                <p className="text-sm text-gray-600 mt-2">
                  {qualityRating === 1 && 'Pessimo'}
                  {qualityRating === 2 && 'Discreto'}
                  {qualityRating === 3 && 'Buono'}
                  {qualityRating === 4 && 'Eccellente'}
                  {qualityRating === 5 && 'Ottimo'}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Voto Finale *
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setOverallRating(star)}
                    onMouseEnter={() => setHoveredOverallRating(star)}
                    onMouseLeave={() => setHoveredOverallRating(0)}
                    className="focus:outline-none transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-10 h-10 transition-colors ${
                        star <= (hoveredOverallRating || overallRating)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
              {overallRating > 0 && (
                <p className="text-sm text-gray-600 mt-2">
                  {overallRating === 1 && 'Pessimo'}
                  {overallRating === 2 && 'Discreto'}
                  {overallRating === 3 && 'Buono'}
                  {overallRating === 4 && 'Eccellente'}
                  {overallRating === 5 && 'Ottimo'}
                </p>
              )}
            </div>
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
              Descrizione della tua esperienza *
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Racconta la tua esperienza in dettaglio: cosa ti è piaciuto, cosa potrebbe essere migliorato, consiglieresti questa attività ad altri..."
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
              disabled={loading || priceRating === 0 || serviceRating === 0 || qualityRating === 0 || overallRating === 0}
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
