import { useState } from 'react';
import { Star, X, Upload, FileText, ChevronRight, ChevronLeft } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface ReviewFormProps {
  businessId?: string;
  businessName?: string;
  businessLocationId?: string;
  unclaimedBusinessLocationId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

type ReviewType = 'service_used' | 'booking_not_completed' | 'quote_request' | 'customer_service' | 'problem_before_service';

export function ReviewForm({
  businessId,
  businessName,
  businessLocationId,
  unclaimedBusinessLocationId,
  onClose,
  onSuccess
}: ReviewFormProps) {
  const { profile, activeProfile } = useAuth();

  const [step, setStep] = useState(1);
  const [reviewType, setReviewType] = useState<ReviewType | null>(null);

  const [bookingManagementRating, setBookingManagementRating] = useState(0);
  const [reliabilityRating, setReliabilityRating] = useState(0);
  const [organizationRating, setOrganizationRating] = useState(0);
  const [experienceRating, setExperienceRating] = useState(0);
  const [priceRating, setPriceRating] = useState(0);
  const [overallRating, setOverallRating] = useState(0);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [proofDocuments, setProofDocuments] = useState<File[]>([]);
  const [proofDocumentPreviews, setProofDocumentPreviews] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const reviewTypeOptions = [
    { value: 'service_used', label: 'Ho usufruito del servizio', icon: '✓' },
    { value: 'booking_not_completed', label: 'Ho prenotato ma il servizio non si è svolto', icon: '✗' },
    { value: 'quote_request', label: 'Ho richiesto preventivo/informazioni', icon: '?' },
    { value: 'customer_service', label: 'Ho avuto un contatto con l\'assistenza', icon: '☎' },
    { value: 'problem_before_service', label: 'Ho avuto un problema prima dell\'erogazione', icon: '⚠' }
  ];

  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    const validFiles = files.filter(file => {
      if (file.size > 10 * 1024 * 1024) {
        setError('Ogni file deve essere massimo 10MB');
        return false;
      }
      return true;
    });

    if (validFiles.length > 0) {
      setProofDocuments(prev => [...prev, ...validFiles]);

      validFiles.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setProofDocumentPreviews(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeDocument = (index: number) => {
    setProofDocuments(prev => prev.filter((_, i) => i !== index));
    setProofDocumentPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const uploadDocuments = async (): Promise<string[]> => {
    if (proofDocuments.length === 0) return [];

    const uploadedUrls: string[] = [];

    for (const file of proofDocuments) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile?.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('review-proof-documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('review-proof-documents')
        .getPublicUrl(fileName);

      uploadedUrls.push(publicUrl);
    }

    return uploadedUrls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!reviewType) {
      setError('Seleziona il tipo di esperienza');
      return;
    }

    if (content.length < 100) {
      setError('La descrizione deve essere di almeno 100 caratteri');
      return;
    }

    if (reviewType === 'service_used') {
      if (!bookingManagementRating || !reliabilityRating || !organizationRating ||
          !experienceRating || !priceRating) {
        setError('Completa tutte le valutazioni');
        return;
      }
    } else {
      if (!overallRating) {
        setError('Inserisci una valutazione');
        return;
      }
      if (proofDocuments.length === 0) {
        setError('Carica almeno un documento di prova');
        return;
      }
    }

    setLoading(true);

    try {
      const documentUrls = await uploadDocuments();

      const reviewData: any = {
        user_id: profile?.id,
        family_member_id: activeProfile?.type === 'family_member' ? activeProfile.id : null,
        business_id: businessId || null,
        business_location_id: businessLocationId || null,
        unclaimed_business_location_id: unclaimedBusinessLocationId || null,
        review_type: reviewType,
        title,
        content,
        proof_documents: documentUrls.length > 0 ? documentUrls : null,
        status: 'pending'
      };

      if (reviewType === 'service_used') {
        reviewData.booking_management_rating = bookingManagementRating;
        reviewData.reliability_rating = reliabilityRating;
        reviewData.organization_rating = organizationRating;
        reviewData.experience_rating = experienceRating;
        reviewData.price_rating = priceRating;
      } else {
        reviewData.overall_rating = overallRating;
      }

      const { error: insertError } = await supabase
        .from('reviews')
        .insert([reviewData]);

      if (insertError) throw insertError;

      onSuccess();
    } catch (err: any) {
      console.error('Error submitting review:', err);
      setError(err.message || 'Errore durante l\'invio della recensione');
    } finally {
      setLoading(false);
    }
  };

  const renderStarRating = (rating: number, setRating: (r: number) => void, label: string) => (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            className="focus:outline-none transition-transform hover:scale-110"
          >
            <Star
              className={`w-8 h-8 ${
                star <= rating
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
        <span className="ml-2 text-sm text-gray-600 self-center">
          {rating > 0 ? `${rating}/5` : 'Nessuna valutazione'}
        </span>
      </div>
    </div>
  );

  const estimatedPoints = reviewType === 'service_used'
    ? (proofDocuments.length > 0 ? 50 : 25)
    : 25;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Scrivi una recensione</h2>
            {businessName && <p className="text-sm text-gray-600">{businessName}</p>}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="px-6 py-4">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    step >= s ? 'bg-orange-600 text-white' : 'bg-gray-200 text-gray-500'
                  }`}>
                    {s}
                  </div>
                  {s < 3 && <div className={`w-20 h-1 mx-2 ${step > s ? 'bg-orange-600' : 'bg-gray-200'}`} />}
                </div>
              ))}
            </div>
            <div className="flex justify-between text-xs text-gray-600">
              <span>Tipo esperienza</span>
              <span>Valutazione</span>
              <span>Descrizione</span>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {step === 1 && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg mb-4">Che tipo di esperienza hai avuto?</h3>
                {reviewTypeOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      setReviewType(option.value as ReviewType);
                      setStep(2);
                    }}
                    className={`w-full p-4 border-2 rounded-lg text-left transition-all hover:border-orange-500 hover:bg-orange-50 ${
                      reviewType === option.value
                        ? 'border-orange-600 bg-orange-50'
                        : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{option.icon}</span>
                      <span className="font-medium">{option.label}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {step === 2 && reviewType === 'service_used' && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg mb-4">Valuta il servizio ricevuto</h3>
                {renderStarRating(bookingManagementRating, setBookingManagementRating, 'Gestione Prenotazione')}
                {renderStarRating(reliabilityRating, setReliabilityRating, 'Affidabilità')}
                {renderStarRating(organizationRating, setOrganizationRating, 'Organizzazione')}
                {renderStarRating(experienceRating, setExperienceRating, 'Esperienza/Servizio')}
                {renderStarRating(priceRating, setPriceRating, 'Prezzo')}

                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-900">
                    <strong>Valutazione media:</strong>{' '}
                    {bookingManagementRating && reliabilityRating && organizationRating && experienceRating && priceRating
                      ? ((bookingManagementRating + reliabilityRating + organizationRating + experienceRating + priceRating) / 5).toFixed(1)
                      : '0.0'}{' '}
                    / 5.0
                  </p>
                </div>

                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Carica fattura o scontrino (facoltativo)
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      multiple
                      onChange={handleDocumentChange}
                      className="hidden"
                      id="proof-documents"
                    />
                    <label htmlFor="proof-documents" className="cursor-pointer flex flex-col items-center">
                      <Upload className="w-8 h-8 text-gray-400 mb-2" />
                      <span className="text-sm text-gray-600">Clicca per caricare documenti</span>
                      <span className="text-xs text-gray-500 mt-1">PDF, JPG, PNG (max 10MB ciascuno)</span>
                    </label>
                  </div>

                  {proofDocumentPreviews.length > 0 && (
                    <div className="mt-4 grid grid-cols-3 gap-2">
                      {proofDocumentPreviews.map((preview, index) => (
                        <div key={index} className="relative">
                          {proofDocuments[index].type.includes('image') ? (
                            <img src={preview} alt="Documento" className="w-full h-24 object-cover rounded" />
                          ) : (
                            <div className="w-full h-24 bg-gray-100 rounded flex items-center justify-center">
                              <FileText className="w-8 h-8 text-gray-400" />
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => removeDocument(index)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Indietro
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    disabled={!bookingManagementRating || !reliabilityRating || !organizationRating || !experienceRating || !priceRating}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    Avanti
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {step === 2 && reviewType !== 'service_used' && reviewType && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg mb-4">Valuta la tua esperienza</h3>
                {renderStarRating(overallRating, setOverallRating, 'Valutazione Complessiva')}

                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Carica documenti di prova <span className="text-red-500">*</span>
                  </label>
                  <p className="text-xs text-gray-600 mb-2">
                    Carica documenti che certificano la prenotazione, il preventivo o la comunicazione con l'attività
                  </p>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      multiple
                      onChange={handleDocumentChange}
                      className="hidden"
                      id="proof-documents-required"
                    />
                    <label htmlFor="proof-documents-required" className="cursor-pointer flex flex-col items-center">
                      <Upload className="w-8 h-8 text-gray-400 mb-2" />
                      <span className="text-sm text-gray-600">Clicca per caricare documenti</span>
                      <span className="text-xs text-gray-500 mt-1">PDF, JPG, PNG (max 10MB ciascuno)</span>
                    </label>
                  </div>

                  {proofDocumentPreviews.length > 0 && (
                    <div className="mt-4 grid grid-cols-3 gap-2">
                      {proofDocumentPreviews.map((preview, index) => (
                        <div key={index} className="relative">
                          {proofDocuments[index].type.includes('image') ? (
                            <img src={preview} alt="Documento" className="w-full h-24 object-cover rounded" />
                          ) : (
                            <div className="w-full h-24 bg-gray-100 rounded flex items-center justify-center">
                              <FileText className="w-8 h-8 text-gray-400" />
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => removeDocument(index)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Indietro
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    disabled={!overallRating || proofDocuments.length === 0}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    Avanti
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg mb-4">Descrivi la tua esperienza</h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Titolo (facoltativo)
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Es: Ottima esperienza"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    maxLength={100}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descrizione <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Racconta la tua esperienza... (minimo 100 caratteri)"
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    required
                    minLength={100}
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>{content.length} / 100 caratteri minimi</span>
                    <span className={content.length >= 100 ? 'text-green-600 font-medium' : ''}>
                      {content.length >= 100 ? '✓ Requisito soddisfatto' : ''}
                    </span>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                    <span className="font-semibold text-gray-900">Punti stimati da questa recensione</span>
                  </div>
                  <div className="text-2xl font-bold text-green-600">{estimatedPoints} punti</div>
                  <p className="text-xs text-gray-600 mt-1">
                    {reviewType === 'service_used' && proofDocuments.length > 0
                      ? 'Riceverai 50 punti con prova documentale'
                      : 'Riceverai 25 punti'}
                  </p>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {error}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Indietro
                  </button>
                  <button
                    type="submit"
                    disabled={loading || content.length < 100}
                    className="flex-1 bg-orange-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Invio in corso...' : 'Invia Recensione'}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
