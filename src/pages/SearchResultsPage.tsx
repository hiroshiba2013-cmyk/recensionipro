import { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { supabase, BusinessCategory } from '../lib/supabase';
import { LocationCard } from '../components/business/LocationCard';
import { AdvancedSearch, SearchFilters } from '../components/search/AdvancedSearch';
import { PROVINCE_TO_CODE } from '../lib/cities';

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
  business_type?: 'imported' | 'user_added' | 'registered';
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
      verifiedOnly: params.get('verified') === 'true',
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
    console.log('=== INIZIO RICERCA ===');
    console.log('Filtri:', filters);
    setLoading(true);
    setHasSearched(true);
    try {
      const QUERY_LIMIT = 2000;

      const provinceCode = filters.province ? PROVINCE_TO_CODE[filters.province] : null;

      console.log('Usando search_all_businesses RPC function...');
      const { data: businessesData, error: businessesError } = await supabase
        .rpc('search_all_businesses', {
          search_query: filters.businessName || '',
          search_city: filters.city || null,
          search_province: provinceCode || null,
          search_region: filters.region || null,
          search_category_id: filters.category || null,
          verified_only: filters.verifiedOnly || false,
          limit_count: QUERY_LIMIT
        });

      if (businessesError) {
        console.error('Errore ricerca businesses:', businessesError);
        throw businessesError;
      }

      console.log('Risultati trovati:', businessesData?.length || 0);

      let allLocations: BusinessLocation[] = (businessesData || []).map((location: any) => ({
        id: location.id,
        business_id: location.business_id || location.id,
        name: location.name,
        address: location.address || '',
        city: location.city || '',
        province: location.province || '',
        region: location.region || '',
        postal_code: location.postal_code || null,
        phone: location.phone || null,
        email: location.email || null,
        website: location.website || null,
        business_hours: location.business_hours || null,
        avatar_url: null,
        is_claimed: location.is_claimed || false,
        verification_badge: location.is_verified || false,
        description: location.description || null,
        business_type: location.location_type === 'unclaimed' ? 'imported' :
                      location.location_type === 'claimed' ? 'registered' : 'user_added',
        business: {
          id: location.business_id || location.id,
          name: location.name,
          category_id: location.category_id,
          verified: location.is_verified || false
        },
        avg_rating: 0,
        review_count: 0
      }));

      console.log('TOTALE:', allLocations.length, 'locations');

      if (allLocations.length === 0) {
        console.log('Nessun risultato trovato!');
        setLocations([]);
        return;
      }

      // Per ora non calcoliamo i rating (troppo pesante)
      // I rating verranno calcolati in modo ottimizzato in futuro
      console.log('Preparazione risultati finali...');
      const locationsWithRatings = allLocations.map(loc => ({
        ...loc,
        avg_rating: 0,
        review_count: 0,
      }));

      console.log('Ordinamento...');

      // Ordina: claimed > rating > alfabetico
      locationsWithRatings.sort((a, b) => {
        const aIsClaimed = a.is_claimed ? 1 : 0;
        const bIsClaimed = b.is_claimed ? 1 : 0;
        if (aIsClaimed !== bIsClaimed) return bIsClaimed - aIsClaimed;

        const aRating = a.avg_rating || 0;
        const bRating = b.avg_rating || 0;
        if (aRating !== bRating) return bRating - aRating;

        const aName = a.name || a.business?.name || '';
        const bName = b.name || b.business?.name || '';
        return aName.localeCompare(bName);
      });

      console.log('=== FINE RICERCA ===');
      console.log('Mostro', locationsWithRatings.length, 'risultati');
      console.log('Primi 3 risultati:', locationsWithRatings.slice(0, 3));
      setLocations(locationsWithRatings);
      console.log('State aggiornato con', locationsWithRatings.length, 'locations');
    } catch (error) {
      console.error('ERRORE durante la ricerca:', error);
      setLocations([]);
    } finally {
      console.log('Impostazione loading = false');
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

        {hasSearched && !loading && (
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
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-700 text-lg font-medium">Ricerca in corso...</p>
            <p className="text-gray-500 text-sm mt-2">Stiamo cercando le migliori attività per te</p>
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
          <>
            {console.log('Renderizzando', locations.length, 'location cards')}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {locations.map((location) => (
                <LocationCard
                  key={location.id}
                  location={location}
                />
              ))}
            </div>
          </>
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
