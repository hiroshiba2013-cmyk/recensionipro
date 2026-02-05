import { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { supabase, Business, BusinessCategory } from '../lib/supabase';
import { LocationCard } from '../components/business/LocationCard';
import { AdvancedSearch, SearchFilters } from '../components/search/AdvancedSearch';
import { PROVINCE_TO_CODE, PROVINCES_BY_REGION, CITY_TO_PROVINCE } from '../lib/cities';

interface BusinessLocation {
  id: string;
  business_id: string;
  name: string | null;
  address: string;
  city: string;
  province: string;
  region: string;
  postal_code: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  business_hours: any;
  avatar_url: string | null;
  is_claimed: boolean;
  verification_badge: boolean;
  description?: string | null;
  business?: {
    id: string;
    name: string;
    category_id: string;
    verified: boolean;
    category?: BusinessCategory;
  };
  avg_rating?: number;
  review_count?: number;
}

export function SearchResultsPage() {
  const [locations, setLocations] = useState<BusinessLocation[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [initialFilters, setInitialFilters] = useState<SearchFilters | null>(null);
  const [currentSearch, setCurrentSearch] = useState(window.location.search);

  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentSearch(window.location.search);
    };

    window.addEventListener('popstate', handleLocationChange);

    const originalPushState = window.history.pushState;
    window.history.pushState = function(...args) {
      originalPushState.apply(window.history, args);
      handleLocationChange();
    };

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(currentSearch);
    const filters: SearchFilters = {
      category: params.get('category') || '',
      region: params.get('region') || '',
      province: params.get('province') || '',
      city: params.get('city') || '',
      businessName: params.get('name') || '',
      minRating: Number(params.get('rating')) || 0,
    };

    setInitialFilters(filters);
    applyFilters(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSearch]);

  useEffect(() => {
    const shouldRestore = sessionStorage.getItem('shouldRestoreScroll');
    const targetPosition = sessionStorage.getItem('targetScrollPosition');

    if (shouldRestore === 'true' && targetPosition && !loading && locations.length > 0) {
      const position = parseInt(targetPosition, 10);
      setTimeout(() => {
        window.scrollTo(0, position);
        sessionStorage.removeItem('shouldRestoreScroll');
        sessionStorage.removeItem('targetScrollPosition');
      }, 100);
    }
  }, [loading, locations]);

  const applyFilters = async (filters: SearchFilters) => {
    setLoading(true);
    setHasSearched(true);
    try {
      let allLocations: BusinessLocation[] = [];

      // Limite di risultati per evitare sovraccarico
      const QUERY_LIMIT = 2000;

      // Query 1: business_locations (sedi di attività reclamate da professionisti)
      let claimedQuery = supabase
        .from('business_locations')
        .select(`
          id,
          business_id,
          name,
          address,
          city,
          province,
          region,
          postal_code,
          latitude,
          longitude,
          phone,
          email,
          website,
          business_hours,
          avatar_url,
          is_claimed,
          claimed_at,
          verification_badge,
          description,
          business:businesses(
            id,
            name,
            category_id,
            verified,
            created_at,
            is_claimed,
            verification_badge,
            category:business_categories(*)
          )
        `)
        .limit(QUERY_LIMIT);

      // Applica filtri geografici per business_locations
      if (filters.city) {
        claimedQuery = claimedQuery.eq('city', filters.city);
      } else if (filters.province) {
        const provinceCode = PROVINCE_TO_CODE[filters.province];
        if (provinceCode) {
          claimedQuery = claimedQuery.eq('province', provinceCode);
        }
      } else if (filters.region) {
        claimedQuery = claimedQuery.eq('region', filters.region);
      }

      const claimedResult = await claimedQuery;

      if (claimedResult.data) {
        // Filtra e trasforma business_locations
        const claimedLocations = claimedResult.data
          .filter((loc: any) => loc.business)
          .filter((loc: any) => {
            const biz = loc.business;
            // Applica filtri aggiuntivi
            if (filters.category && biz.category_id !== filters.category) return false;
            if (filters.businessName && !biz.name.toLowerCase().includes(filters.businessName.toLowerCase()) &&
                !(loc.name && loc.name.toLowerCase().includes(filters.businessName.toLowerCase()))) return false;
            return true;
          })
          .map((loc: any) => ({
            id: loc.id,
            business_id: loc.business_id,
            name: loc.name,
            address: loc.address,
            city: loc.city,
            province: loc.province,
            region: loc.region,
            postal_code: loc.postal_code,
            phone: loc.phone,
            email: loc.email,
            website: loc.website,
            business_hours: loc.business_hours,
            avatar_url: loc.avatar_url,
            is_claimed: loc.is_claimed || false,
            verification_badge: loc.verification_badge || false,
            description: loc.description,
            business: loc.business ? {
              id: loc.business.id,
              name: loc.business.name,
              category_id: loc.business.category_id,
              verified: loc.business.verified,
              category: loc.business.category
            } : undefined
          }));

        allLocations.push(...claimedLocations);
      }

      // Query 2: unclaimed_business_locations (attività aggiunte da utenti privati)
      let unclaimedQuery = supabase
        .from('unclaimed_business_locations')
        .select(`
          id,
          name,
          category_id,
          street,
          city,
          province,
          region,
          postal_code,
          latitude,
          longitude,
          phone,
          email,
          website,
          business_hours,
          is_claimed,
          verification_badge,
          category:business_categories(*)
        `)
        .eq('is_claimed', false)
        .limit(QUERY_LIMIT);

      if (filters.category) {
        unclaimedQuery = unclaimedQuery.eq('category_id', filters.category);
      }

      if (filters.businessName) {
        unclaimedQuery = unclaimedQuery.ilike('name', `%${filters.businessName}%`);
      }

      // Applica filtri geografici
      if (filters.city) {
        unclaimedQuery = unclaimedQuery.eq('city', filters.city);
      } else if (filters.province) {
        const provinceCode = PROVINCE_TO_CODE[filters.province];
        if (provinceCode) {
          unclaimedQuery = unclaimedQuery.eq('province', provinceCode);
        }
      } else if (filters.region) {
        unclaimedQuery = unclaimedQuery.eq('region', filters.region);
      }

      const unclaimedResult = await unclaimedQuery;

      if (unclaimedResult.data) {
        // Trasforma unclaimed_business_locations in formato Location
        const unclaimedLocations: BusinessLocation[] = unclaimedResult.data.map((ub: any) => ({
          id: ub.id,
          business_id: ub.id,
          name: ub.name,
          address: ub.street,
          city: ub.city,
          province: ub.province,
          region: ub.region,
          postal_code: ub.postal_code,
          phone: ub.phone,
          email: ub.email,
          website: ub.website,
          business_hours: ub.business_hours,
          avatar_url: null,
          is_claimed: false,
          verification_badge: false,
          business: ub.category ? {
            id: ub.id,
            name: ub.name,
            category_id: ub.category_id,
            verified: false,
            category: ub.category
          } : undefined
        }));

        allLocations.push(...unclaimedLocations);
      }

      if (allLocations.length === 0) {
        setLocations([]);
        return;
      }

      // Calcola rating per ogni location
      const locationIds = allLocations.map(loc => loc.id);
      const { data: reviewsData } = await supabase
        .from('reviews')
        .select('business_location_id, overall_rating')
        .in('business_location_id', locationIds);

      const ratingsMap = new Map<string, { avg_rating: number; review_count: number }>();

      if (reviewsData) {
        const groupedReviews = reviewsData.reduce((acc: any, review: any) => {
          if (!review.business_location_id) return acc;
          if (!acc[review.business_location_id]) {
            acc[review.business_location_id] = [];
          }
          acc[review.business_location_id].push(review);
          return acc;
        }, {});

        Object.entries(groupedReviews).forEach(([locationId, reviews]: [string, any]) => {
          const avgRating = reviews.reduce((sum: number, r: any) => sum + r.overall_rating, 0) / reviews.length;
          ratingsMap.set(locationId, {
            avg_rating: avgRating,
            review_count: reviews.length
          });
        });
      }

      let locationsWithRatings = allLocations.map(location => {
        const ratings = ratingsMap.get(location.id) || { avg_rating: 0, review_count: 0 };
        return {
          ...location,
          avg_rating: ratings.avg_rating,
          review_count: ratings.review_count,
        };
      });

      // Applica filtro rating se richiesto
      if (filters.minRating > 0) {
        locationsWithRatings = locationsWithRatings.filter(
          loc => (loc.avg_rating || 0) >= filters.minRating
        );
      }

      // Ordina con priorità: claimed > rating > alfabetico
      locationsWithRatings.sort((a, b) => {
        // Priorità 1: Sedi rivendicate prima
        const aIsClaimed = a.is_claimed ? 1 : 0;
        const bIsClaimed = b.is_claimed ? 1 : 0;
        if (aIsClaimed !== bIsClaimed) return bIsClaimed - aIsClaimed;

        // Priorità 2: Rating
        const aRating = a.avg_rating || 0;
        const bRating = b.avg_rating || 0;
        if (aRating !== bRating) return bRating - aRating;

        // Priorità 3: Alfabetico
        const aName = a.name || a.business?.name || '';
        const bName = b.name || b.business?.name || '';
        return aName.localeCompare(bName);
      });

      setLocations(locationsWithRatings);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToHome = () => {
    window.history.pushState({}, '', '/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <button
            onClick={handleBackToHome}
            className="flex items-center gap-2 text-white hover:text-blue-100 transition-colors mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Torna alla home</span>
          </button>

          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4">Cerca Attività</h1>
            <p className="text-xl text-blue-50">
              Trova le migliori attività della tua zona
            </p>
          </div>

          <AdvancedSearch
            onSearch={applyFilters}
            isLoading={loading}
            initialFilters={initialFilters || undefined}
          />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-6 bg-gradient-to-r from-blue-50 to-green-50 border-l-4 border-blue-600 rounded-lg p-4">
          <p className="text-sm text-gray-700">
            I dati delle attività sono forniti da{' '}
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

        {hasSearched && (
          <>
            <div className="mb-4 flex items-center justify-between bg-white rounded-lg shadow-sm p-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Risultati della Ricerca</h2>
                <p className="text-gray-600 mt-1">Trova le sedi delle attività che corrispondono ai tuoi criteri</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="bg-blue-50 px-6 py-3 rounded-lg border-2 border-blue-200">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">{locations.length}</div>
                    <div className="text-sm text-blue-800 font-medium mt-1">
                      {locations.length === 1 ? 'Sede Trovata' : 'Sedi Trovate'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {locations.some(loc => loc.is_claimed) && (
              <div className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 rounded-lg p-4">
                <p className="text-sm text-green-900 font-medium flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Le attività rivendicate dai proprietari sono mostrate in cima ai risultati
                </p>
              </div>
            )}
          </>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : !hasSearched ? (
          <div className="text-center py-12 bg-white rounded-lg">
            <p className="text-gray-600 text-lg">Usa i filtri sopra per cercare sedi delle attività</p>
          </div>
        ) : locations.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg">
            <p className="text-gray-600 text-lg">Nessuna sede trovata</p>
            <p className="text-gray-500 mt-2">Prova a modificare i filtri di ricerca</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {locations.map((location) => (
              <LocationCard
                key={location.id}
                location={location}
              />
            ))}
          </div>
        )}

        {hasSearched && locations.length > 0 && (
          <div className="mt-8 bg-gradient-to-r from-blue-50 to-green-50 border-l-4 border-blue-600 rounded-lg p-4">
            <p className="text-sm text-gray-700">
              I dati delle attività sono forniti da{' '}
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
    </div>
  );
}
