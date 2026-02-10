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
      let allLocations: BusinessLocation[] = [];
      const QUERY_LIMIT = 2000;

      // Query 1: registered_business_locations (attività registrate e verificate)
      console.log('Query 1: registered_business_locations...');
      let registeredQuery = supabase
        .from('registered_business_locations')
        .select(`
          id,
          business_id,
          internal_name,
          street,
          street_number,
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
          description,
          services,
          is_primary,
          business:registered_businesses(
            id,
            name,
            category_id,
            description,
            verification_badge,
            category:business_categories(*)
          )
        `)
        .limit(QUERY_LIMIT);

      if (filters.city) {
        registeredQuery = registeredQuery.eq('city', filters.city);
      } else if (filters.province) {
        const provinceCode = PROVINCE_TO_CODE[filters.province];
        if (provinceCode) {
          registeredQuery = registeredQuery.eq('province', provinceCode);
        }
      } else if (filters.region) {
        registeredQuery = registeredQuery.eq('region', filters.region);
      }

      const registeredResult = await registeredQuery;
      console.log('  Risultati Q1:', registeredResult.data?.length || 0);
      if (registeredResult.error) console.error('  Errore Q1:', registeredResult.error);

      if (registeredResult.data) {
        const registeredLocations = registeredResult.data
          .filter((loc: any) => loc.business)
          .filter((loc: any) => {
            const biz = loc.business;
            if (filters.category && biz.category_id !== filters.category) return false;
            if (filters.businessName) {
              const nameMatch = biz.name.toLowerCase().includes(filters.businessName.toLowerCase());
              const internalMatch = loc.internal_name && loc.internal_name.toLowerCase().includes(filters.businessName.toLowerCase());
              if (!nameMatch && !internalMatch) return false;
            }
            return true;
          })
          .map((loc: any) => ({
            id: loc.id,
            business_id: loc.business_id,
            name: loc.internal_name || loc.business.name,
            address: `${loc.street}${loc.street_number ? ', ' + loc.street_number : ''}`,
            city: loc.city,
            province: loc.province,
            region: loc.region,
            postal_code: loc.postal_code,
            phone: loc.phone,
            email: loc.email,
            website: loc.website,
            business_hours: loc.business_hours,
            avatar_url: null,
            is_claimed: true,
            verification_badge: loc.business.verification_badge === 'verified',
            description: loc.description,
            business_type: 'registered' as const,
            business: {
              id: loc.business.id,
              name: loc.business.name,
              category_id: loc.business.category_id,
              verified: loc.business.verification_badge === 'verified',
              category: loc.business.category
            }
          }));

        console.log('  Aggiunte Q1:', registeredLocations.length);
        allLocations.push(...registeredLocations);
      }

      // Query 2: imported_businesses (da OSM)
      console.log('Query 2: imported_businesses...');
      let importedQuery = supabase
        .from('imported_businesses')
        .select(`
          id,
          name,
          category_id,
          description,
          street,
          street_number,
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
        importedQuery = importedQuery.eq('category_id', filters.category);
      }

      if (filters.businessName) {
        importedQuery = importedQuery.ilike('name', `%${filters.businessName}%`);
      }

      if (filters.city) {
        importedQuery = importedQuery.eq('city', filters.city);
      } else if (filters.province) {
        const provinceCode = PROVINCE_TO_CODE[filters.province];
        if (provinceCode) {
          importedQuery = importedQuery.eq('province', provinceCode);
        }
      } else if (filters.region) {
        importedQuery = importedQuery.eq('region', filters.region);
      }

      const importedResult = await importedQuery;
      console.log('  Risultati Q2:', importedResult.data?.length || 0);
      if (importedResult.error) console.error('  Errore Q2:', importedResult.error);

      if (importedResult.data) {
        const importedLocations: BusinessLocation[] = importedResult.data.map((ib: any) => ({
          id: ib.id,
          business_id: ib.id,
          name: ib.name,
          address: `${ib.street}${ib.street_number ? ', ' + ib.street_number : ''}`,
          city: ib.city,
          province: ib.province,
          region: ib.region,
          postal_code: ib.postal_code,
          phone: ib.phone,
          email: ib.email,
          website: ib.website,
          business_hours: ib.business_hours,
          avatar_url: null,
          is_claimed: false,
          verification_badge: false,
          description: ib.description,
          business_type: 'imported' as const,
          business: ib.category ? {
            id: ib.id,
            name: ib.name,
            category_id: ib.category_id,
            verified: false,
            category: ib.category
          } : undefined
        }));

        console.log('  Aggiunte Q2:', importedLocations.length);
        allLocations.push(...importedLocations);
      }

      // Query 3: user_added_businesses (aggiunte da utenti)
      console.log('Query 3: user_added_businesses...');
      let userAddedQuery = supabase
        .from('user_added_businesses')
        .select(`
          id,
          name,
          category_id,
          description,
          street,
          street_number,
          city,
          province,
          region,
          postal_code,
          latitude,
          longitude,
          phone,
          email,
          website,
          category:business_categories(*)
        `)
        .limit(QUERY_LIMIT);

      if (filters.category) {
        userAddedQuery = userAddedQuery.eq('category_id', filters.category);
      }

      if (filters.businessName) {
        userAddedQuery = userAddedQuery.ilike('name', `%${filters.businessName}%`);
      }

      if (filters.city) {
        userAddedQuery = userAddedQuery.eq('city', filters.city);
      } else if (filters.province) {
        const provinceCode = PROVINCE_TO_CODE[filters.province];
        if (provinceCode) {
          userAddedQuery = userAddedQuery.eq('province', provinceCode);
        }
      } else if (filters.region) {
        userAddedQuery = userAddedQuery.eq('region', filters.region);
      }

      const userAddedResult = await userAddedQuery;
      console.log('  Risultati Q3:', userAddedResult.data?.length || 0);
      if (userAddedResult.error) console.error('  Errore Q3:', userAddedResult.error);

      if (userAddedResult.data) {
        const userAddedLocations: BusinessLocation[] = userAddedResult.data.map((ub: any) => ({
          id: ub.id,
          business_id: ub.id,
          name: ub.name,
          address: `${ub.street}${ub.street_number ? ', ' + ub.street_number : ''}`,
          city: ub.city,
          province: ub.province,
          region: ub.region,
          postal_code: ub.postal_code,
          phone: ub.phone,
          email: ub.email,
          website: ub.website,
          business_hours: null,
          avatar_url: null,
          is_claimed: false,
          verification_badge: false,
          description: ub.description,
          business_type: 'user_added' as const,
          business: ub.category ? {
            id: ub.id,
            name: ub.name,
            category_id: ub.category_id,
            verified: false,
            category: ub.category
          } : undefined
        }));

        console.log('  Aggiunte Q3:', userAddedLocations.length);
        allLocations.push(...userAddedLocations);
      }

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
