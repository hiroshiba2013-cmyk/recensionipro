import { useState, useEffect } from 'react';
import {
  MapPin, Phone, Mail, Globe, Star, Briefcase,
  Building2, Clock, AlertCircle, CheckCircle, ArrowLeft
} from 'lucide-react';
import { supabase, Business, Review, JobPosting, BusinessLocation } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ReviewForm } from '../components/reviews/ReviewForm';
import { ReviewCard } from '../components/reviews/ReviewCard';
import BusinessMap from '../components/map/BusinessMap';
import ReportButton from '../components/moderation/ReportButton';
import { FavoriteButton } from '../components/favorites/FavoriteButton';
import { VerificationBadge } from '../components/business/VerificationBadge';

interface BusinessDetailPageProps {
  businessId: string;
}

interface BusinessWithRating extends Business {
  avg_rating?: number;
  review_count?: number;
}

export function BusinessDetailPage({ businessId }: BusinessDetailPageProps) {
  const { user, profile, activeProfile } = useAuth();
  const [business, setBusiness] = useState<BusinessWithRating | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([]);
  const [locations, setLocations] = useState<BusinessLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [claimingBusiness, setClaimingBusiness] = useState(false);
  const [filterLocationId, setFilterLocationId] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);

    // Leggi il parametro locationId dall'URL
    const params = new URLSearchParams(window.location.search);
    const locationId = params.get('locationId');
    setFilterLocationId(locationId);

    loadBusinessData(locationId);
  }, [businessId]);

  const loadBusinessData = async (locationId: string | null = null) => {
    setLoading(true);
    try {
      let businessData: any = null;
      let businessType: 'imported' | 'user_added' | 'registered' | null = null;

      // Cerca in businesses (attività rivendicate)
      const { data: claimedData } = await supabase
        .from('businesses')
        .select(`
          *,
          category:business_categories(*),
          locations:business_locations(*)
        `)
        .eq('id', businessId)
        .maybeSingle();

      if (claimedData) {
        businessData = {
          ...claimedData,
          is_claimed: true,
          owner_id: claimedData.owner_id,
          verified: claimedData.verification_badge === 'verified',
        };
        businessType = 'registered';
        if (claimedData.locations) {
          let allLocations = claimedData.locations.map((loc: any) => ({
            ...loc,
            name: loc.internal_name || loc.name,
          }));

          // Filtra per location specifica se locationId è presente
          if (locationId) {
            allLocations = allLocations.filter((loc: any) => loc.id === locationId);
          }

          setLocations(allLocations);
        }
      }

      // Se non trovata, cerca in unclaimed_business_locations
      if (!businessData) {
        const { data: unclaimedData } = await supabase
          .from('unclaimed_business_locations')
          .select(`
            *,
            category:business_categories(*)
          `)
          .eq('id', businessId)
          .maybeSingle();

        if (unclaimedData) {
          businessData = {
            id: unclaimedData.id,
            name: unclaimedData.name,
            category_id: unclaimedData.category_id,
            category: unclaimedData.category,
            description: unclaimedData.description,
            is_claimed: unclaimedData.is_claimed || false,
            owner_id: unclaimedData.claimed_by || null,
            verified: false,
            created_at: unclaimedData.created_at,
            address: `${unclaimedData.street}${unclaimedData.street_number ? ', ' + unclaimedData.street_number : ''}`,
            city: unclaimedData.city,
            phone: unclaimedData.phone,
            email: unclaimedData.email,
            website: unclaimedData.website,
            website_url: unclaimedData.website,
          };
          businessType = 'imported';
        }
      }

      // Se non trovata, cerca in imported_businesses
      if (!businessData) {
        const { data: importedData } = await supabase
          .from('imported_businesses')
          .select(`
            *,
            category:business_categories(*)
          `)
          .eq('id', businessId)
          .maybeSingle();

        if (importedData) {
          businessData = {
            id: importedData.id,
            name: importedData.name,
            category_id: importedData.category_id,
            category: importedData.category,
            description: importedData.description,
            is_claimed: false,
            owner_id: null,
            verified: false,
            created_at: importedData.created_at,
            address: `${importedData.street}${importedData.street_number ? ', ' + importedData.street_number : ''}`,
            city: importedData.city,
            phone: importedData.phone,
            email: importedData.email,
            website: importedData.website,
            website_url: importedData.website,
          };
          businessType = 'imported';
        }
      }

      // Se non trovata, cerca in user_added_businesses
      if (!businessData) {
        const { data: userAddedData } = await supabase
          .from('user_added_businesses')
          .select(`
            *,
            category:business_categories(*)
          `)
          .eq('id', businessId)
          .maybeSingle();

        if (userAddedData) {
          businessData = {
            id: userAddedData.id,
            name: userAddedData.name,
            category_id: userAddedData.category_id,
            category: userAddedData.category,
            description: userAddedData.description,
            is_claimed: false,
            owner_id: null,
            verified: false,
            created_at: userAddedData.created_at,
            address: `${userAddedData.street}${userAddedData.street_number ? ', ' + userAddedData.street_number : ''}`,
            city: userAddedData.city,
            phone: userAddedData.phone,
            email: userAddedData.email,
            website: userAddedData.website,
            website_url: userAddedData.website,
          };
          businessType = 'user_added';
        }
      }

      // Se non trovata, cerca nella vecchia tabella businesses (per attività rivendicate prima della migrazione)
      if (!businessData) {
        const { data: oldBusinessData } = await supabase
          .from('businesses')
          .select(`
            *,
            category:business_categories(*),
            locations:business_locations(*)
          `)
          .eq('id', businessId)
          .maybeSingle();

        if (oldBusinessData) {
          businessData = {
            ...oldBusinessData,
            verified: oldBusinessData.is_claimed,
          };
          businessType = 'registered';
          if (oldBusinessData.locations) {
            let allLocations = oldBusinessData.locations;

            // Filtra per location specifica se locationId è presente
            if (locationId) {
              allLocations = allLocations.filter((loc: any) => loc.id === locationId);
            }

            setLocations(allLocations);
          }
        }
      }

      if (businessData && businessType) {
        // Query per le recensioni
        let reviewsQuery = supabase
          .from('reviews')
          .select('overall_rating')
          .eq('review_status', 'approved');

        if (businessType === 'imported') {
          reviewsQuery = reviewsQuery.or(`imported_business_id.eq.${businessId},unclaimed_business_location_id.eq.${businessId}`);
        } else if (businessType === 'user_added') {
          reviewsQuery = reviewsQuery.eq('user_added_business_id', businessId);
        } else if (businessType === 'registered') {
          reviewsQuery = reviewsQuery.or(`registered_business_id.eq.${businessId},business_id.eq.${businessId}`);
        }

        const { data: reviewsData } = await reviewsQuery;

        const avg_rating = reviewsData && reviewsData.length > 0
          ? reviewsData.reduce((sum, r) => sum + r.overall_rating, 0) / reviewsData.length
          : 0;

        setBusiness({
          ...businessData,
          avg_rating,
          review_count: reviewsData?.length || 0,
          business_type: businessType,
        });

        // Query per le recensioni complete
        let fullReviewsQuery = supabase
          .from('reviews')
          .select(`
            *,
            customer:profiles!customer_id(full_name, nickname),
            responses:review_responses(*),
            family_member:customer_family_members(first_name, last_name, nickname)
          `)
          .eq('review_status', 'approved')
          .order('created_at', { ascending: false });

        if (businessType === 'imported') {
          fullReviewsQuery = fullReviewsQuery.or(`imported_business_id.eq.${businessId},unclaimed_business_location_id.eq.${businessId}`);
        } else if (businessType === 'user_added') {
          fullReviewsQuery = fullReviewsQuery.eq('user_added_business_id', businessId);
        } else if (businessType === 'registered') {
          fullReviewsQuery = fullReviewsQuery.or(`registered_business_id.eq.${businessId},business_id.eq.${businessId}`);
        }

        const { data: fullReviewsData } = await fullReviewsQuery;

        if (fullReviewsData) {
          setReviews(fullReviewsData);
        }

        // Job postings solo per registered businesses
        if (businessType === 'registered') {
          const { data: jobsData } = await supabase
            .from('job_postings')
            .select('*')
            .eq('business_id', businessId)
            .eq('status', 'active');

          if (jobsData) {
            setJobPostings(jobsData);
          }
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
      const businessType = (business as any).business_type;

      if (businessType === 'imported') {
        // Recupera i dati dall'imported_businesses
        const { data: importedData, error: fetchError } = await supabase
          .from('imported_businesses')
          .select('*')
          .eq('id', businessId)
          .maybeSingle();

        if (fetchError || !importedData) {
          throw new Error('Attività non trovata');
        }

        // Crea la nuova business registrata
        const { data: newBusiness, error: insertError } = await supabase
          .from('registered_businesses')
          .insert({
            owner_id: profile.id,
            name: importedData.name,
            category_id: importedData.category_id,
            description: importedData.description,
            source_type: 'claimed_imported',
            source_id: businessId,
            verification_badge: 'claimed',
          })
          .select()
          .single();

        if (insertError || !newBusiness) {
          throw insertError || new Error('Errore creazione business');
        }

        // Crea la location registrata
        const { error: locationError } = await supabase
          .from('registered_business_locations')
          .insert({
            business_id: newBusiness.id,
            street: importedData.street,
            street_number: importedData.street_number,
            city: importedData.city,
            province: importedData.province,
            region: importedData.region,
            postal_code: importedData.postal_code,
            latitude: importedData.latitude,
            longitude: importedData.longitude,
            phone: importedData.phone,
            email: importedData.email,
            website: importedData.website,
            business_hours: importedData.business_hours,
            is_primary: true,
          });

        if (locationError) throw locationError;

        // Sposta le recensioni
        await supabase
          .from('reviews')
          .update({
            business_type: 'registered',
            business_id: newBusiness.id,
            imported_business_id: null,
          })
          .eq('imported_business_id', businessId);

        // Elimina da imported_businesses
        await supabase
          .from('imported_businesses')
          .delete()
          .eq('id', businessId);

      } else if (businessType === 'user_added') {
        // Recupera i dati dall'user_added_businesses
        const { data: userAddedData, error: fetchError } = await supabase
          .from('user_added_businesses')
          .select('*')
          .eq('id', businessId)
          .maybeSingle();

        if (fetchError || !userAddedData) {
          throw new Error('Attività non trovata');
        }

        // Crea la nuova business registrata
        const { data: newBusiness, error: insertError } = await supabase
          .from('registered_businesses')
          .insert({
            owner_id: profile.id,
            name: userAddedData.name,
            category_id: userAddedData.category_id,
            description: userAddedData.description,
            source_type: 'claimed_user_added',
            source_id: businessId,
            verification_badge: 'claimed',
          })
          .select()
          .single();

        if (insertError || !newBusiness) {
          throw insertError || new Error('Errore creazione business');
        }

        // Crea la location registrata
        const { error: locationError } = await supabase
          .from('registered_business_locations')
          .insert({
            business_id: newBusiness.id,
            street: userAddedData.street,
            street_number: userAddedData.street_number,
            city: userAddedData.city,
            province: userAddedData.province,
            region: userAddedData.region,
            postal_code: userAddedData.postal_code,
            latitude: userAddedData.latitude,
            longitude: userAddedData.longitude,
            phone: userAddedData.phone,
            email: userAddedData.email,
            website: userAddedData.website,
            is_primary: true,
          });

        if (locationError) throw locationError;

        // Sposta le recensioni
        await supabase
          .from('reviews')
          .update({
            business_type: 'registered',
            business_id: newBusiness.id,
            user_added_business_id: null,
          })
          .eq('user_added_business_id', businessId);

        // Elimina da user_added_businesses
        await supabase
          .from('user_added_businesses')
          .delete()
          .eq('id', businessId);
      }

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

  const canReview = profile?.user_type === 'customer' && (profile?.subscription_status === 'active' || profile?.subscription_status === 'trial');
  const isOwner = profile && business.owner_id === profile.id;
  const canClaim = profile?.user_type === 'business' && !business.is_claimed && !business.owner_id;
  const canShowClaimButton = !business.is_claimed && !business.owner_id && profile?.user_type !== 'customer';
  const needsBusinessAccount = canShowClaimButton && profile?.user_type !== 'business';

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => {
            const returnUrl = sessionStorage.getItem('searchReturnUrl');
            const scrollPosition = sessionStorage.getItem('searchScrollPosition');
            if (returnUrl) {
              sessionStorage.removeItem('searchReturnUrl');
              sessionStorage.setItem('shouldRestoreScroll', 'true');
              if (scrollPosition) {
                sessionStorage.setItem('targetScrollPosition', scrollPosition);
                sessionStorage.removeItem('searchScrollPosition');
              }
              window.history.pushState({}, '', returnUrl);
              window.dispatchEvent(new PopStateEvent('popstate'));
            } else {
              window.history.back();
            }
          }}
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

        <div className="bg-white rounded-xl shadow-xl overflow-hidden">
          <div className="relative h-72 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800">
            {business.logo_url && (
              <img
                src={business.logo_url}
                alt={business.name}
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent"></div>
            <div className="absolute bottom-0 left-0 right-0 p-8">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h1 className="text-5xl font-extrabold text-white mb-3 drop-shadow-lg">{business.name}</h1>
                  <div className="flex flex-wrap items-center gap-4">
                    {business.avg_rating && business.avg_rating > 0 ? (
                      <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-5 h-5 ${
                                i < Math.round(business.avg_rating!)
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-white/50'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="font-semibold text-white">
                          {business.avg_rating.toFixed(1)}
                        </span>
                        <span className="text-white/80 text-sm">
                          ({business.review_count} {business.review_count === 1 ? 'recensione' : 'recensioni'})
                        </span>
                      </div>
                    ) : (
                      <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-full">
                        <span className="text-white text-sm font-medium">Nessuna recensione</span>
                      </div>
                    )}
                    <div className="bg-white/10 backdrop-blur-md rounded-full p-1">
                      <VerificationBadge isClaimed={!!business.is_claimed} size="md" />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {user && !isOwner && (
                    <>
                      <div className="bg-white/20 backdrop-blur-md rounded-lg hover:bg-white/30 transition-colors">
                        <FavoriteButton
                          type="business"
                          itemId={businessId}
                          familyMemberId={activeProfile && !activeProfile.isOwner ? activeProfile.id : null}
                        />
                      </div>
                      <div className="bg-white/20 backdrop-blur-md rounded-lg px-3 py-2 hover:bg-white/30 transition-colors">
                        <ReportButton entityType="business" entityId={businessId} compact />
                      </div>
                    </>
                  )}
                  {canShowClaimButton && (
                    <button
                      onClick={needsBusinessAccount ? () => {
                        sessionStorage.setItem('claimBusinessId', businessId);
                        window.location.href = '/?register=business';
                      } : handleClaimBusiness}
                      disabled={claimingBusiness}
                      className="bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 transition-all shadow-lg hover:shadow-xl font-bold disabled:opacity-50 flex items-center gap-2"
                    >
                      <Building2 className="w-5 h-5" />
                      {claimingBusiness ? 'Rivendicazione...' : 'Rivendica Attività'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="p-8">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="md:col-span-2 space-y-8">
                {filterLocationId && (
                  <div className="bg-blue-50 border-l-4 border-blue-600 rounded-r-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <MapPin className="w-5 h-5 text-blue-600" />
                        <div>
                          <p className="text-sm font-semibold text-blue-900">
                            Stai visualizzando una sede specifica
                          </p>
                          <p className="text-xs text-blue-700">
                            {locations.length > 0 && locations[0].city ? `Sede di ${locations[0].city}` : 'Sede selezionata dalla ricerca'}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          window.history.pushState({}, '', `/business/${businessId}`);
                          window.location.reload();
                        }}
                        className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                      >
                        Vedi tutte le sedi
                      </button>
                    </div>
                  </div>
                )}

                {business.description && (
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border-l-4 border-blue-600">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <div className="w-2 h-8 bg-blue-600 rounded-full"></div>
                      Descrizione
                    </h2>
                    <p className="text-gray-700 leading-relaxed text-lg">{business.description}</p>
                  </div>
                )}

                {(() => {
                  const primaryLocation = locations.length > 0 ? locations[0] : null;
                  const displayAddress = business.address || primaryLocation?.address;
                  const displayCity = business.city || primaryLocation?.city;
                  const displayPhone = business.phone || primaryLocation?.phone;
                  const displayEmail = business.email || primaryLocation?.email;
                  const displayWebsite = business.website || business.website_url;
                  const displayBusinessHours = primaryLocation?.business_hours;
                  const displayDescription = primaryLocation?.description;
                  const displayServices = primaryLocation?.services;

                  const hasContactInfo = displayAddress || displayPhone || displayEmail || displayWebsite || displayBusinessHours || displayDescription || displayServices;

                  if (!hasContactInfo) return null;

                  return (
                    <div className="bg-white rounded-xl border-2 border-gray-200 p-6 shadow-sm">
                      <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <div className="w-2 h-8 bg-green-600 rounded-full"></div>
                        Informazioni di Contatto
                      </h2>
                      {displayDescription && (
                        <div className="mb-4 bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                          <p className="text-sm text-gray-700 italic">{displayDescription}</p>
                        </div>
                      )}
                      <div className="space-y-3">
                        {displayAddress && (
                          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                            <MapPin className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                            <div>
                              <p className="text-gray-900 font-medium">
                                {business.address || (primaryLocation?.address && `${primaryLocation.address}${primaryLocation.street_number ? ', ' + primaryLocation.street_number : ''}`)}
                              </p>
                              <p className="text-gray-600 text-sm">
                                {business.city || (primaryLocation?.postal_code && primaryLocation?.city ? `${primaryLocation.postal_code} ${primaryLocation.city} (${primaryLocation.province})` : primaryLocation?.city)}
                              </p>
                            </div>
                          </div>
                        )}
                        {displayPhone && (
                          <a href={`tel:${displayPhone}`} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-green-50 transition-colors group">
                            <Phone className="w-5 h-5 text-green-600 group-hover:scale-110 transition-transform" />
                            <span className="text-gray-900 font-medium group-hover:text-green-600">
                              {displayPhone}
                            </span>
                          </a>
                        )}
                        {displayEmail && (
                          <a href={`mailto:${displayEmail}`} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-blue-50 transition-colors group">
                            <Mail className="w-5 h-5 text-blue-600 group-hover:scale-110 transition-transform" />
                            <span className="text-gray-900 font-medium group-hover:text-blue-600">
                              {displayEmail}
                            </span>
                          </a>
                        )}
                        {displayWebsite && (
                          <a
                            href={displayWebsite}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-indigo-50 transition-colors group"
                          >
                            <Globe className="w-5 h-5 text-indigo-600 group-hover:scale-110 transition-transform" />
                            <span className="text-gray-900 font-medium group-hover:text-indigo-600 truncate">
                              {displayWebsite}
                            </span>
                          </a>
                        )}
                        {displayServices && displayServices.length > 0 && (
                          <div className="border-t-2 border-gray-200 pt-4 mt-4">
                            <div className="flex items-center gap-2 mb-3">
                              <CheckCircle className="w-5 h-5 text-green-600" />
                              <h3 className="text-base font-semibold text-gray-900">Servizi Disponibili</h3>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {displayServices.map((service: string, idx: number) => (
                                <span key={idx} className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 text-sm font-medium px-4 py-2 rounded-full border border-green-200 hover:shadow-md transition-shadow">
                                  {service}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {displayBusinessHours && (
                          <div className="border-t-2 border-gray-200 pt-4 mt-4">
                            <div className="flex items-center gap-2 mb-4">
                              <Clock className="w-6 h-6 text-blue-600" />
                              <h3 className="text-lg font-bold text-gray-900">Orari di Apertura</h3>
                            </div>
                            {typeof displayBusinessHours === 'string' ? (
                              <p className="text-gray-700">{displayBusinessHours}</p>
                            ) : (
                              <div className="grid gap-2">
                                {(() => {
                                  const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
                                  const dayNames: Record<string, string> = {
                                    monday: 'Lunedì',
                                    tuesday: 'Martedì',
                                    wednesday: 'Mercoledì',
                                    thursday: 'Giovedì',
                                    friday: 'Venerdì',
                                    saturday: 'Sabato',
                                    sunday: 'Domenica'
                                  };
                                  const entries = Object.entries(displayBusinessHours as Record<string, any>);
                                  const sortedEntries = entries.sort(([dayA], [dayB]) => {
                                    return dayOrder.indexOf(dayA) - dayOrder.indexOf(dayB);
                                  });

                                  return sortedEntries.map(([day, hours]: [string, any]) => {
                                    const today = new Date().toLocaleDateString('it-IT', { weekday: 'long' }).toLowerCase();
                                    const isToday = dayNames[day]?.toLowerCase() === today;
                                    const isClosed = hours.closed === true || hours.closed === 'true';

                                    return (
                                      <div
                                        key={day}
                                        className={`flex justify-between items-center px-4 py-3 rounded-lg ${
                                          isToday ? 'bg-blue-50 border-2 border-blue-500' : 'bg-gray-50'
                                        }`}
                                      >
                                        <span className={`font-medium ${isToday ? 'text-blue-900' : 'text-gray-900'}`}>
                                          {dayNames[day] || day}
                                          {isToday && <span className="ml-2 text-xs bg-blue-600 text-white px-2 py-1 rounded-full">Oggi</span>}
                                        </span>
                                        <span className={`text-sm font-medium ${
                                          isClosed
                                            ? 'text-red-600'
                                            : isToday
                                              ? 'text-green-700'
                                              : 'text-gray-700'
                                        }`}>
                                          {isClosed ? 'Chiuso' : `${hours.open || ''} - ${hours.close || ''}`}
                                        </span>
                                      </div>
                                    );
                                  });
                                })()}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {(() => {
                  const hasValidLocation = locations.some(loc => loc.latitude && loc.longitude);
                  if (!hasValidLocation) return null;

                  return (
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-4">Posizione</h2>
                      <BusinessMap businessId={businessId} height="400px" />
                    </div>
                  );
                })()}

                {locations.length > 1 && (
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Altre Sedi</h2>
                    <div className="space-y-6">
                      {locations.slice(1).map((location) => (
                        <div key={location.id} className="border-2 border-gray-200 rounded-xl p-6 bg-white shadow-sm hover:shadow-md transition-shadow">
                          <h3 className="font-bold text-xl mb-3 text-gray-900">{location.name || 'Sede'}</h3>
                          {location.description && (
                            <p className="text-sm text-gray-600 mb-4 italic border-l-4 border-blue-500 pl-3 py-1">{location.description}</p>
                          )}
                          <div className="space-y-3">
                            <div className="flex items-start gap-3">
                              <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                              <p className="text-gray-700">
                                {location.address}{location.street_number ? ', ' + location.street_number : ''}, {location.postal_code} {location.city} ({location.province})
                              </p>
                            </div>
                            {location.phone && (
                              <div className="flex items-center gap-3">
                                <Phone className="w-5 h-5 text-gray-400" />
                                <a href={`tel:${location.phone}`} className="text-blue-600 hover:underline font-medium">
                                  {location.phone}
                                </a>
                              </div>
                            )}
                            {location.email && (
                              <div className="flex items-center gap-3">
                                <Mail className="w-5 h-5 text-gray-400" />
                                <a href={`mailto:${location.email}`} className="text-blue-600 hover:underline">
                                  {location.email}
                                </a>
                              </div>
                            )}
                            {location.services && location.services.length > 0 && (
                              <div className="border-t pt-3 mt-3">
                                <p className="text-sm text-gray-700 mb-2 font-semibold">Servizi disponibili:</p>
                                <div className="flex flex-wrap gap-2">
                                  {location.services.map((service: string, idx: number) => (
                                    <span key={idx} className="bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded-full">
                                      {service}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            {location.business_hours && (
                              <div className="border-t pt-4 mt-4">
                                <div className="flex items-center gap-2 mb-3">
                                  <Clock className="w-5 h-5 text-blue-600" />
                                  <h4 className="text-base font-semibold text-gray-900">Orari di Apertura</h4>
                                </div>
                                {typeof location.business_hours === 'string' ? (
                                  <p className="text-gray-700">{location.business_hours}</p>
                                ) : (
                                  <div className="grid gap-2">
                                    {(() => {
                                      const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
                                      const dayNames: Record<string, string> = {
                                        monday: 'Lunedì',
                                        tuesday: 'Martedì',
                                        wednesday: 'Mercoledì',
                                        thursday: 'Giovedì',
                                        friday: 'Venerdì',
                                        saturday: 'Sabato',
                                        sunday: 'Domenica'
                                      };
                                      const entries = Object.entries(location.business_hours as Record<string, any>);
                                      const sortedEntries = entries.sort(([dayA], [dayB]) => {
                                        return dayOrder.indexOf(dayA) - dayOrder.indexOf(dayB);
                                      });

                                      return sortedEntries.map(([day, hours]: [string, any]) => {
                                        const today = new Date().toLocaleDateString('it-IT', { weekday: 'long' }).toLowerCase();
                                        const isToday = dayNames[day]?.toLowerCase() === today;
                                        const isClosed = hours.closed === true || hours.closed === 'true';

                                        return (
                                          <div
                                            key={day}
                                            className={`flex justify-between items-center px-3 py-2 rounded-lg ${
                                              isToday ? 'bg-blue-50 border-2 border-blue-500' : 'bg-gray-50'
                                            }`}
                                          >
                                            <span className={`text-sm font-medium ${isToday ? 'text-blue-900' : 'text-gray-900'}`}>
                                              {dayNames[day] || day}
                                              {isToday && <span className="ml-2 text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">Oggi</span>}
                                            </span>
                                            <span className={`text-sm font-medium ${
                                              isClosed
                                                ? 'text-red-600'
                                                : isToday
                                                  ? 'text-green-700'
                                                  : 'text-gray-700'
                                            }`}>
                                              {isClosed ? 'Chiuso' : `${hours.open || ''} - ${hours.close || ''}`}
                                            </span>
                                          </div>
                                        );
                                      });
                                    })()}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
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
                      {profile?.user_type === 'business'
                        ? 'Nessuna recensione ancora.'
                        : 'Nessuna recensione ancora. Sii il primo a recensire!'}
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
                    Stato Attività
                  </h3>
                  {!business.is_claimed ? (
                    <>
                      <div className="mb-4 flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                        <p className="text-sm font-medium text-amber-900">
                          Attività non ancora rivendicata
                        </p>
                      </div>
                      <p className="text-sm text-gray-700 mb-4">
                        Questa attività non è ancora stata rivendicata dal proprietario. I dati sono forniti da OpenStreetMap.
                      </p>
                      {canShowClaimButton && (
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
                      )}
                    </>
                  ) : (
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm font-medium text-green-900">
                        {isOwner
                          ? 'Questa è la tua attività. Puoi gestirla dalla dashboard.'
                          : 'Attività verificata e gestita dal proprietario'}
                      </p>
                    </div>
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
