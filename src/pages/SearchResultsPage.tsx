import { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { supabase, Business, BusinessCategory } from '../lib/supabase';
import { BusinessCard } from '../components/business/BusinessCard';
import { AdvancedSearch, SearchFilters } from '../components/search/AdvancedSearch';
import { PROVINCE_TO_CODE, PROVINCES_BY_REGION, CITY_TO_PROVINCE } from '../lib/cities';

interface BusinessWithRating extends Business {
  avg_rating?: number;
  review_count?: number;
}

export function SearchResultsPage() {
  const [businesses, setBusinesses] = useState<BusinessWithRating[]>([]);
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

    if (params.toString()) {
      applyFilters(filters);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSearch]);

  const applyFilters = async (filters: SearchFilters) => {
    setLoading(true);
    setHasSearched(true);
    try {
      let allBusinesses: any[] = [];

      // Limite di risultati per evitare sovraccarico
      const QUERY_LIMIT = 1000;

      // Query 1: businesses con business_locations
      // Se ci sono filtri geografici, prima troviamo i business_id dalle locations
      let businessIdsFromLocations: string[] = [];

      if (filters.region || filters.province || filters.city) {
        let locationQuery = supabase
          .from('business_locations')
          .select('business_id')
          .limit(QUERY_LIMIT);

        if (filters.city) {
          locationQuery = locationQuery.eq('city', filters.city);
        } else if (filters.province) {
          const provinceCode = PROVINCE_TO_CODE[filters.province];
          if (provinceCode) {
            locationQuery = locationQuery.eq('province', provinceCode);
          }
        } else if (filters.region) {
          locationQuery = locationQuery.eq('region', filters.region);
        }

        const { data: locationData, error: locationError } = await locationQuery;

        if (locationError) {
          console.error('Location query error:', locationError);
        } else if (locationData) {
          businessIdsFromLocations = locationData
            .map((loc: any) => loc.business_id)
            .filter((id: string) => id != null);
        }
      }

      let businessQuery = supabase
        .from('businesses')
        .select(`
          *,
          category:business_categories(*),
          locations:business_locations(*)
        `)
        .limit(QUERY_LIMIT);

      if (filters.category) {
        businessQuery = businessQuery.eq('category_id', filters.category);
      }

      if (filters.businessName) {
        businessQuery = businessQuery.ilike('name', `%${filters.businessName}%`);
      }

      // Se abbiamo filtri geografici e abbiamo trovato location IDs, filtra per business_id
      // Se abbiamo filtri geografici ma non abbiamo trovato location IDs, significa che non ci sono risultati
      if (filters.region || filters.province || filters.city) {
        if (businessIdsFromLocations.length > 0) {
          businessQuery = businessQuery.in('id', businessIdsFromLocations);
        } else {
          businessQuery = null;
        }
      }

      // Query 2: unclaimed_business_locations (importate da OSM direttamente)
      let unclaimedQuery = supabase
        .from('unclaimed_business_locations')
        .select(`
          id,
          name,
          category_id,
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
          category:business_categories(*)
        `)
        .limit(QUERY_LIMIT);

      if (filters.category) {
        unclaimedQuery = unclaimedQuery.eq('category_id', filters.category);
      }

      if (filters.businessName) {
        unclaimedQuery = unclaimedQuery.ilike('name', `%${filters.businessName}%`);
      }

      // Applica filtri geografici direttamente nella query per unclaimed
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
      // Esegui entrambe le query in parallelo
      const queries = [];
      if (businessQuery) {
        queries.push(businessQuery);
      } else {
        queries.push(Promise.resolve({ data: null, error: null }));
      }
      queries.push(unclaimedQuery);

      const [businessResult, unclaimedResult] = await Promise.all(queries);

      if (businessResult.error) {
        console.error('Business query error:', businessResult.error);
      } else if (businessResult.data) {
        allBusinesses.push(...businessResult.data);
      }

      if (unclaimedResult.error) {
        console.error('Unclaimed query error:', unclaimedResult.error);
      } else if (unclaimedResult.data) {
        // Trasforma unclaimed_business_locations in formato Business
        const unclaimedBusinesses = unclaimedResult.data.map((ub: any) => ({
          id: ub.id,
          name: ub.name,
          category_id: ub.category_id,
          category: ub.category,
          is_claimed: false,
          created_at: new Date().toISOString(),
          locations: [{
            id: ub.id,
            business_id: ub.id,
            address: ub.address,
            city: ub.city,
            province: ub.province,
            region: ub.region,
            postal_code: ub.postal_code,
            latitude: ub.latitude,
            longitude: ub.longitude,
            phone: ub.phone,
            email: ub.email,
            website: ub.website,
            business_hours: ub.business_hours,
          }]
        }));

        allBusinesses.push(...unclaimedBusinesses);
      }

      if (allBusinesses.length === 0) {
        setBusinesses([]);
        return;
      }

      const businessIdsList = allBusinesses.map(b => b.id);

      const { data: ratingsData } = await supabase
        .rpc('get_business_ratings', { business_ids: businessIdsList });

      const ratingsMap = new Map<string, { avg_rating: number; review_count: number }>();

      if (ratingsData) {
        ratingsData.forEach((r: any) => {
          ratingsMap.set(r.business_id, {
            avg_rating: r.avg_rating || 0,
            review_count: r.review_count || 0
          });
        });
      }

      let businessesWithRatings = allBusinesses.map(business => {
        const ratings = ratingsMap.get(business.id) || { avg_rating: 0, review_count: 0 };
        return {
          ...business,
          avg_rating: ratings.avg_rating,
          review_count: ratings.review_count,
        };
      });

      if (filters.minRating > 0) {
        businessesWithRatings = businessesWithRatings.filter(
          b => (b.avg_rating || 0) >= filters.minRating
        );
      }

      businessesWithRatings.sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0));

      setBusinesses(businessesWithRatings);
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
        {hasSearched && (
          <div className="mb-6 flex items-center justify-between bg-white rounded-lg shadow-sm p-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Risultati della Ricerca</h2>
              <p className="text-gray-600 mt-1">Trova le attività che corrispondono ai tuoi criteri</p>
            </div>
            <div className="bg-blue-50 px-6 py-3 rounded-lg border-2 border-blue-200">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{businesses.length}</div>
                <div className="text-sm text-blue-800 font-medium mt-1">
                  {businesses.length === 1 ? 'Attività Trovata' : 'Attività Trovate'}
                </div>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : !hasSearched ? (
          <div className="text-center py-12 bg-white rounded-lg">
            <p className="text-gray-600 text-lg">Usa i filtri sopra per cercare attività</p>
          </div>
        ) : businesses.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg">
            <p className="text-gray-600 text-lg">Nessuna attività trovata</p>
            <p className="text-gray-500 mt-2">Prova a modificare i filtri di ricerca</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {businesses.map((business) => (
              <BusinessCard
                key={business.id}
                business={business}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
