import { useState, useEffect } from 'react';
import {
  MapPin, Phone, Mail, Globe, Star, Tag, Briefcase,
  Building2, Clock, AlertCircle, CheckCircle, ArrowLeft
} from 'lucide-react';
import { supabase, Business, Review, Discount, JobPosting, BusinessLocation } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ReviewForm } from '../components/reviews/ReviewForm';
import { ReviewCard } from '../components/reviews/ReviewCard';
import { DiscountCard } from '../components/discount/DiscountCard';

interface BusinessDetailPageProps {
  businessId: string;
}

interface BusinessWithRating extends Business {
  avg_rating?: number;
  review_count?: number;
}

export function BusinessDetailPage({ businessId }: BusinessDetailPageProps) {
  const { user, profile } = useAuth();
  const [business, setBusiness] = useState<BusinessWithRating | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([]);
  const [locations, setLocations] = useState<BusinessLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [claimingBusiness, setClaimingBusiness] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    loadBusinessData();
  }, [businessId]);

  const loadBusinessData = async () => {
    setLoading(true);
    try {
      let businessData: any = null;

      // Prima cerca in businesses (attività reclamate)
      const { data: claimedData } = await supabase
        .from('businesses')
        .select(`
          *,
          category:business_categories(*)
        `)
        .eq('id', businessId)
        .maybeSingle();

      if (claimedData) {
        businessData = claimedData;
      } else {
        // Se non trovata, cerca in unclaimed_business_locations
        const { data: unclaimedData } = await supabase
          .from('unclaimed_business_locations')
          .select(`
            *,
            category:business_categories(*)
          `)
          .eq('id', businessId)
          .maybeSingle();

        if (unclaimedData) {
          // Trasforma in formato business
          businessData = {
            id: unclaimedData.id,
            name: unclaimedData.name,
            category_id: unclaimedData.category_id,
            category: unclaimedData.category,
            is_claimed: false,
            owner_id: null,
            verified: false,
            created_at: unclaimedData.created_at,
            address: unclaimedData.street,
            city: unclaimedData.city,
            phone: unclaimedData.phone,
            email: unclaimedData.email,
            website: unclaimedData.website,
            website_url: unclaimedData.website,
          };
        }
      }

      if (businessData) {
        const { data: reviewsData } = await supabase
          .from('reviews')
          .select('overall_rating')
          .eq('business_id', businessId);

        const avg_rating = reviewsData && reviewsData.length > 0
          ? reviewsData.reduce((sum, r) => sum + r.overall_rating, 0) / reviewsData.length
          : 0;

        setBusiness({
          ...businessData,
          avg_rating,
          review_count: reviewsData?.length || 0,
        });

        const { data: fullReviewsData } = await supabase
          .from('reviews')
          .select(`
            *,
            customer:profiles(full_name),
            responses:review_responses(*),
            family_member:customer_family_members(first_name, last_name, nickname)
          `)
          .eq('business_id', businessId)
          .order('created_at', { ascending: false });

        if (fullReviewsData) {
          setReviews(fullReviewsData);
        }

        const { data: discountsData } = await supabase
          .from('discounts')
          .select('*')
          .eq('business_id', businessId)
          .eq('status', 'active');

        if (discountsData) {
          setDiscounts(discountsData);
        }

        const { data: jobsData } = await supabase
          .from('job_postings')
          .select('*')
          .eq('business_id', businessId)
          .eq('status', 'active');

        if (jobsData) {
          setJobPostings(jobsData);
        }

        const { data: locationsData } = await supabase
          .from('business_locations')
          .select('*')
          .eq('business_id', businessId);

        if (locationsData) {
          setLocations(locationsData);
        }
      }
    } catch (error) {
      console.error('Error loading business data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClaimBusiness = async () => {
    if (!profile || profile.user_type !== 'business') {
      alert('Solo gli utenti business possono rivendicare un\'attività');
      return;
    }

    if (!business) return;

    if (business.is_claimed || business.owner_id) {
      alert('Questa attività è già stata rivendicata');
      return;
    }

    const confirmed = confirm(
      `Vuoi rivendicare l'attività "${business.name}"?\n\n` +
      'Una volta rivendicata, dovrai fornire la documentazione necessaria per la verifica.\n\n' +
      'Confermi di essere il proprietario legittimo di questa attività?'
    );

    if (!confirmed) return;

    setClaimingBusiness(true);
    try {
      // Recupera i dati dall'unclaimed_business_locations
      const { data: unclaimedData, error: fetchError } = await supabase
        .from('unclaimed_business_locations')
        .select('*')
        .eq('id', businessId)
        .maybeSingle();

      if (fetchError || !unclaimedData) {
        throw new Error('Attività non trovata');
      }

      // Crea la nuova business
      const { data: newBusiness, error: insertError } = await supabase
        .from('businesses')
        .insert({
          name: unclaimedData.name,
          category_id: unclaimedData.category_id,
          owner_id: profile.id,
          is_claimed: true,
          verified: false,
        })
        .select()
        .single();

      if (insertError || !newBusiness) {
        throw insertError || new Error('Errore creazione business');
      }

      // Crea la business_location
      const { error: locationError } = await supabase
        .from('business_locations')
        .insert({
          business_id: newBusiness.id,
          address: unclaimedData.street,
          city: unclaimedData.city,
          province: unclaimedData.province,
          region: unclaimedData.region,
          postal_code: unclaimedData.postal_code,
          latitude: unclaimedData.latitude,
          longitude: unclaimedData.longitude,
          phone: unclaimedData.phone,
          email: unclaimedData.email,
          website: unclaimedData.website,
          business_hours: unclaimedData.business_hours,
        });

      if (locationError) throw locationError;

      // Elimina da unclaimed_business_locations
      const { error: deleteError } = await supabase
        .from('unclaimed_business_locations')
        .delete()
        .eq('id', businessId);

      if (deleteError) throw deleteError;

      alert(
        'Rivendicazione completata!\n\n' +
        'La tua richiesta è stata registrata. Il nostro team verificherà i tuoi dati e ' +
        'ti contatterà per completare il processo di verifica.\n\n' +
        'Nel frattempo, puoi gestire l\'attività dalla tua dashboard.'
      );

      window.location.href = '/dashboard';
    } catch (error) {
      console.error('Error claiming business:', error);
      alert('Errore durante la rivendicazione dell\'attività');
    } finally {
      setClaimingBusiness(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Attività non trovata</h2>
          <p className="text-gray-600 mb-6">L'attività che stai cercando non esiste.</p>
          <a
            href="/"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Torna alla Home
          </a>
        </div>
      </div>
    );
  }

  const canReview = profile?.user_type === 'customer' && profile?.subscription_status === 'active';
  const isOwner = profile && business.owner_id === profile.id;
  const canClaim = profile?.user_type === 'business' && !business.is_claimed && !business.owner_id;
  const canShowClaimButton = !business.is_claimed && !business.owner_id;
  const needsBusinessAccount = canShowClaimButton && profile?.user_type !== 'business';

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => window.history.back()}
          className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors font-medium"
        >
          <ArrowLeft className="w-5 h-5" />
          Torna indietro
        </button>

        {!business.is_claimed && (
          <div className="mb-6 bg-gradient-to-r from-blue-50 to-green-50 border-l-4 border-blue-600 rounded-lg p-4">
            <p className="text-sm text-gray-700">
              I dati di questa attività sono forniti da{' '}
              <a
                href="https://www.openstreetmap.org"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 font-semibold underline"
              >
                OpenStreetMap
              </a>
              {' '}e{' '}
              <a
                href="https://www.geofabrik.de"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 font-semibold underline"
              >
                Geofabrik
              </a>
              , rilasciati sotto licenza{' '}
              <a
                href="https://www.openstreetmap.org/copyright"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 font-semibold underline"
              >
                ODbL
              </a>
              .
            </p>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="relative h-64 bg-gradient-to-r from-blue-600 to-blue-800">
            {business.logo_url && (
              <img
                src={business.logo_url}
                alt={business.name}
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}
            <div className="absolute inset-0 bg-black bg-opacity-40"></div>
            <div className="absolute bottom-0 left-0 right-0 p-8">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h1 className="text-4xl font-bold text-white mb-2">{business.name}</h1>
                  <div className="flex items-center gap-4 text-white">
                    {business.avg_rating && business.avg_rating > 0 ? (
                      <div className="flex items-center gap-2">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-5 h-5 ${
                                i < Math.round(business.avg_rating!)
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-white'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="font-medium">
                          {business.avg_rating.toFixed(1)} ({business.review_count} recensioni)
                        </span>
                      </div>
                    ) : (
                      <span className="text-white text-sm">Nessuna recensione</span>
                    )}
                    {business.verified ? (
                      <span className="flex items-center gap-1 bg-green-500 px-3 py-1 rounded-full text-sm">
                        <CheckCircle className="w-4 h-4" />
                        Verificato
                      </span>
                    ) : (
                      <span className="bg-yellow-500 px-3 py-1 rounded-full text-sm">
                        In Verifica
                      </span>
                    )}
                  </div>
                </div>
                {canShowClaimButton && (
                  <button
                    onClick={needsBusinessAccount ? () => {
                      sessionStorage.setItem('claimBusinessId', businessId);
                      window.location.href = '/?register=business';
                    } : handleClaimBusiness}
                    disabled={claimingBusiness}
                    className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold disabled:opacity-50 flex items-center gap-2"
                  >
                    <Building2 className="w-5 h-5" />
                    {claimingBusiness ? 'Rivendicazione...' : 'Rivendica Attività'}
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="p-8">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="md:col-span-2 space-y-8">
                {business.description && (
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Descrizione</h2>
                    <p className="text-gray-700 leading-relaxed">{business.description}</p>
                  </div>
                )}

                {(() => {
                  const primaryLocation = locations.length > 0 ? locations[0] : null;
                  const displayAddress = business.address || primaryLocation?.address;
                  const displayCity = business.city || primaryLocation?.city;
                  const displayPhone = business.phone || primaryLocation?.phone;
                  const displayEmail = business.email || primaryLocation?.email;
                  const displayWebsite = business.website || business.website_url;

                  const hasContactInfo = displayAddress || displayPhone || displayEmail || displayWebsite;

                  if (!hasContactInfo) return null;

                  return (
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-4">Informazioni di Contatto</h2>
                      <div className="space-y-3">
                        {displayAddress && (
                          <div className="flex items-start gap-3">
                            <MapPin className="w-5 h-5 text-gray-400 mt-1" />
                            <div>
                              <p className="text-gray-900">
                                {business.address || (primaryLocation?.address && `${primaryLocation.address}${primaryLocation.street_number ? ', ' + primaryLocation.street_number : ''}`)}
                              </p>
                              <p className="text-gray-600">
                                {business.city || (primaryLocation?.postal_code && primaryLocation?.city ? `${primaryLocation.postal_code} ${primaryLocation.city} (${primaryLocation.province})` : primaryLocation?.city)}
                              </p>
                            </div>
                          </div>
                        )}
                        {displayPhone && (
                          <div className="flex items-center gap-3">
                            <Phone className="w-5 h-5 text-gray-400" />
                            <a href={`tel:${displayPhone}`} className="text-blue-600 hover:underline">
                              {displayPhone}
                            </a>
                          </div>
                        )}
                        {displayEmail && (
                          <div className="flex items-center gap-3">
                            <Mail className="w-5 h-5 text-gray-400" />
                            <a href={`mailto:${displayEmail}`} className="text-blue-600 hover:underline">
                              {displayEmail}
                            </a>
                          </div>
                        )}
                        {displayWebsite && (
                          <div className="flex items-center gap-3">
                            <Globe className="w-5 h-5 text-gray-400" />
                            <a
                              href={displayWebsite}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              {displayWebsite}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {locations.length > 1 && (
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Altre Sedi</h2>
                    <div className="space-y-4">
                      {locations.slice(1).map((location) => (
                        <div key={location.id} className="border border-gray-200 rounded-lg p-4">
                          <h3 className="font-semibold text-lg mb-2">{location.name || 'Sede'}</h3>
                          <div className="space-y-2 text-sm">
                            <p className="text-gray-700">
                              {location.address}{location.street_number ? ', ' + location.street_number : ''}, {location.postal_code} {location.city} ({location.province})
                            </p>
                            {location.phone && (
                              <div className="flex items-center gap-2">
                                <Phone className="w-4 h-4 text-gray-400" />
                                <a href={`tel:${location.phone}`} className="text-blue-600 hover:underline">
                                  {location.phone}
                                </a>
                              </div>
                            )}
                            {location.email && (
                              <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4 text-gray-400" />
                                <a href={`mailto:${location.email}`} className="text-blue-600 hover:underline">
                                  {location.email}
                                </a>
                              </div>
                            )}
                            {location.business_hours && (
                              <div className="flex items-start gap-2">
                                <Clock className="w-4 h-4 text-gray-400 mt-0.5" />
                                <p className="text-gray-600">{typeof location.business_hours === 'string' ? location.business_hours : JSON.stringify(location.business_hours)}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {discounts.length > 0 && (
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Tag className="w-6 h-6" />
                      Offerte Esclusive
                    </h2>
                    <div className="grid gap-4">
                      {discounts.map((discount) => (
                        <DiscountCard key={discount.id} discount={discount} />
                      ))}
                    </div>
                  </div>
                )}

                {jobPostings.length > 0 && (
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Briefcase className="w-6 h-6" />
                      Offerte di Lavoro
                    </h2>
                    <div className="space-y-4">
                      {jobPostings.map((job) => (
                        <div key={job.id} className="border border-gray-200 rounded-lg p-4">
                          <h3 className="font-semibold text-lg mb-2">{job.title}</h3>
                          <p className="text-gray-700 mb-3">{job.description}</p>
                          <div className="flex flex-wrap gap-2 text-sm text-gray-600">
                            <span className="bg-gray-100 px-3 py-1 rounded-full">
                              {job.employment_type}
                            </span>
                            <span className="bg-gray-100 px-3 py-1 rounded-full">
                              {job.location}
                            </span>
                            {job.salary_range && (
                              <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full">
                                {job.salary_range}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Recensioni</h2>
                    {canReview && !isOwner && (
                      <button
                        onClick={() => setShowReviewForm(true)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Scrivi Recensione
                      </button>
                    )}
                  </div>

                  {reviews.length === 0 ? (
                    <p className="text-gray-600 text-center py-8 bg-gray-50 rounded-lg">
                      Nessuna recensione ancora. Sii il primo a recensire!
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {reviews.map((review) => (
                        <ReviewCard key={review.id} review={review} />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                {business.category && (
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="font-semibold text-gray-900 mb-2">Categoria</h3>
                    <p className="text-gray-700">{business.category.name}</p>
                    {business.ateco_code && (
                      <p className="text-sm text-gray-500 mt-1">ATECO: {business.ateco_code}</p>
                    )}
                  </div>
                )}

                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-900 mb-3">
                    {canShowClaimButton ? 'Sei il proprietario?' : 'Informazioni'}
                  </h3>
                  {canShowClaimButton ? (
                    <>
                      <p className="text-sm text-gray-700 mb-4">
                        {needsBusinessAccount
                          ? 'Se sei il proprietario di questa attività, crea un account business per rivenindicarla e gestirla.'
                          : 'Se sei il proprietario di questa attività, puoi rivenindicarla per gestirla e rispondere alle recensioni.'}
                      </p>
                      <button
                        onClick={needsBusinessAccount ? () => {
                          sessionStorage.setItem('claimBusinessId', businessId);
                          window.location.href = '/?register=business';
                        } : handleClaimBusiness}
                        disabled={claimingBusiness}
                        className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
                      >
                        {claimingBusiness ? 'Rivendicazione...' : needsBusinessAccount ? 'Crea Account Business' : 'Rivendica Ora'}
                      </button>
                    </>
                  ) : (
                    <p className="text-sm text-gray-700">
                      {isOwner
                        ? 'Questa è la tua attività. Puoi gestirla dalla dashboard.'
                        : 'Attività verificata e gestita dal proprietario.'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {!business.is_claimed && (
          <div className="mt-8 bg-gradient-to-r from-blue-50 to-green-50 border-l-4 border-blue-600 rounded-lg p-4">
            <p className="text-sm text-gray-700">
              I dati di questa attività sono forniti da{' '}
              <a
                href="https://www.openstreetmap.org"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 font-semibold underline"
              >
                OpenStreetMap
              </a>
              {' '}e{' '}
              <a
                href="https://www.geofabrik.de"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 font-semibold underline"
              >
                Geofabrik
              </a>
              , rilasciati sotto licenza{' '}
              <a
                href="https://www.openstreetmap.org/copyright"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 font-semibold underline"
              >
                ODbL
              </a>
              .
            </p>
          </div>
        )}
      </div>

      {showReviewForm && (
        <ReviewForm
          businessId={businessId}
          businessName={business.name}
          onClose={() => setShowReviewForm(false)}
          onSuccess={() => {
            setShowReviewForm(false);
            loadBusinessData();
          }}
        />
      )}
    </div>
  );
}
