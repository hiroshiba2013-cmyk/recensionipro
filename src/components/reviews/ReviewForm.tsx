import { useState, useEffect } from 'react';
import { Star, X, Upload, Image as ImageIcon, Award, MapPin } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface ReviewFormProps {
  businessId: string;
  businessName?: string;
  businessLocationId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

interface BusinessLocation {
  id: string;
  name: string | null;
  internal_name: string | null;
  address: string;
  city: string;
  province: string;
}

export function ReviewForm({ businessId, businessName, businessLocationId, onClose, onSuccess }: ReviewFormProps) {
  const { profile, activeProfile } = useAuth();
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
  const [selectedLocationId, setSelectedLocationId] = useState<string>(businessLocationId || '');
  const [businessLocations, setBusinessLocations] = useState<BusinessLocation[]>([]);
  const [proofImage, setProofImage] = useState<File | null>(null);
  const [proofImagePreview, setProofImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const hasDetailedRatings = priceRating > 0 && serviceRating > 0 && qualityRating > 0;
  const estimatedPoints = hasDetailedRatings
    ? (proofImage ? 25 : 15)
    : (proofImage ? 10 : 5);

  useEffect(() => {
    loadBusinessLocations();
  }, [businessId]);

  useEffect(() => {
    if (businessLocationId) {
      setSelectedLocationId(businessLocationId);
    }
  }, [businessLocationId]);

  const loadBusinessLocations = async () => {
    const { data: locationsData } = await supabase
      .from('business_locations')
      .select('id, name, internal_name, address, city, province')
      .eq('business_id', businessId)
      .order('created_at', { ascending: true });

    if (locationsData && locationsData.length > 0) {
      setBusinessLocations(locationsData);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('L\'immagine deve essere massimo 5MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        setError('Seleziona un\'immagine valida');
        return;
      }
      setProofImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProofImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setError('');
    }
  };

  const removeImage = () => {
    setProofImage(null);
    setProofImagePreview(null);
  };

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

    if (profile.subscription_status !== 'active' && profile.subscription_status !== 'trial') {
      setError('È necessario un abbonamento attivo per lasciare recensioni');
      return;
    }

    if (overallRating === 0) {
      setError('Inserisci almeno il voto finale');
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

      let proofImageUrl = null;

      // Upload dell'immagine di prova se presente
      if (proofImage) {
        setUploadingImage(true);
        const fileExt = proofImage.name.split('.').pop();
        const fileName = `${profile.id}-${Date.now()}.${fileExt}`;
        const filePath = `review-proofs/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('review-proofs')
          .upload(filePath, proofImage);

        if (uploadError) {
          console.error('Error uploading proof:', uploadError);
          setError('Errore durante il caricamento dell\'immagine');
          setLoading(false);
          setUploadingImage(false);
          return;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('review-proofs')
          .getPublicUrl(filePath);

        proofImageUrl = publicUrl;
        setUploadingImage(false);
      }

      const avgRating = hasDetailedRatings
        ? Math.round((priceRating + serviceRating + qualityRating + overallRating) / 4)
        : overallRating;

      const reviewStatus = proofImage ? 'pending' : 'approved';
      const pointsAwarded = proofImage ? 0 : estimatedPoints;

      const { error: insertError } = await supabase
        .from('reviews')
        .insert({
          business_id: businessId,
          customer_id: profile.id,
          family_member_id: activeProfile?.isOwner === false ? activeProfile.id : null,
          business_location_id: selectedLocationId || null,
          rating: avgRating,
          price_rating: priceRating || null,
          service_rating: serviceRating || null,
          quality_rating: qualityRating || null,
          overall_rating: overallRating,
          title: title.trim(),
          content: content.trim(),
          proof_image_url: proofImageUrl,
          review_status: reviewStatus,
          points_awarded: pointsAwarded,
        });

      // Se la recensione è approvata automaticamente (senza prova), assegna i punti
      if (reviewStatus === 'approved' && pointsAwarded > 0) {
        await supabase.rpc('award_points', {
          p_user_id: profile.id,
          p_points: pointsAwarded,
          p_activity_type: 'review',
          p_description: `Recensione per ${businessName || 'attività'}`,
        });
      }

      if (insertError) throw insertError;

      // Mostra messaggio appropriato
      if (proofImage) {
        alert('✅ Recensione inviata con successo!\n\nLa tua recensione è in attesa di approvazione. Riceverai i punti dopo che lo staff avrà verificato la prova di acquisto.');
      }

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
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-5 h-5 text-blue-600" />
                <p className="font-semibold text-blue-900">Punti Stimati: {estimatedPoints} punti</p>
              </div>
              <p className="text-sm text-blue-700">
                {hasDetailedRatings && proofImage && "Recensione completa con prova: 25 punti"}
                {hasDetailedRatings && !proofImage && "Recensione completa: 15 punti"}
                {!hasDetailedRatings && proofImage && "Recensione con prova: 10 punti"}
                {!hasDetailedRatings && !proofImage && "Recensione base: 5 punti"}
              </p>
            </div>
          </div>

          {businessLocations.length > 0 && (
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <MapPin className="w-4 h-4 inline mr-1" />
                Sede (Opzionale)
              </label>
              <p className="text-xs text-gray-500 mb-3">
                Se vuoi recensire una sede specifica, selezionala qui. Altrimenti la recensione sarà generale per l'attività.
              </p>
              <select
                value={selectedLocationId}
                onChange={(e) => setSelectedLocationId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Recensione generale (tutte le sedi)</option>
                {businessLocations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name || `${location.address}, ${location.city} (${location.province})`}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Valutazioni Dettagliate (Opzionale)
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Completa tutte e tre le valutazioni per ottenere più punti
            </p>
          </div>

          <div className="mb-6 space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Prezzo
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
                Servizio
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
                Qualità
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
              Prova di Acquisto (Opzionale)
            </label>
            <p className="text-xs text-gray-500 mb-3">
              Carica uno scontrino o fattura per ottenere più punti. L'immagine sarà visibile solo allo staff e verrà cancellata dopo l'approvazione.
            </p>

            {!proofImagePreview ? (
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-8 h-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">
                    Clicca per caricare uno scontrino o fattura
                  </p>
                  <p className="text-xs text-gray-400 mt-1">PNG, JPG, JPEG (max 5MB)</p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            ) : (
              <div className="relative">
                <img
                  src={proofImagePreview}
                  alt="Preview"
                  className="w-full h-48 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                  <ImageIcon className="w-4 h-4" />
                  <span>Immagine caricata</span>
                </div>
              </div>
            )}
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
              disabled={loading || uploadingImage || overallRating === 0}
              className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {uploadingImage ? 'Caricamento immagine...' : loading ? 'Invio in corso...' : proofImage ? 'Invia per approvazione' : 'Pubblica recensione'}
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
