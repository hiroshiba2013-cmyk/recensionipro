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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const filters: SearchFilters = {
      category: params.get('category') || '',
      region: params.get('region') || '',
      province: params.get('province') || '',
      city: params.get('city') || '',
      businessName: params.get('name') || '',
      minRating: Number(params.get('rating')) || 0,
    };

    if (params.toString()) {
      setInitialFilters(filters);
      applyFilters(filters);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyFilters = async (filters: SearchFilters) => {
    setLoading(true);
    setHasSearched(true);
    try {
      let businessIdsFromLocations = new Set<string>();

      if (filters.region || filters.province || filters.city) {
        let locationQuery = supabase
          .from('business_locations')
          .select('business_id');

        if (filters.city) {
          locationQuery = locationQuery.eq('city', filters.city);
        } else if (filters.province) {
          const provinceCode = PROVINCE_TO_CODE[filters.province];
          if (provinceCode) {
            locationQuery = locationQuery.eq('province', provinceCode);
          }
        } else if (filters.region) {
          const provincesInRegion = PROVINCES_BY_REGION[filters.region] || [];
          const provinceCodes = provincesInRegion.map(p => PROVINCE_TO_CODE[p]).filter(Boolean);
          if (provinceCodes.length > 0) {
            locationQuery = locationQuery.in('province', provinceCodes);
          }
        }

        const { data: locationData } = await locationQuery;

        if (locationData) {
          locationData.forEach((loc: any) => {
            if (loc.business_id) businessIdsFromLocations.add(loc.business_id);
          });
        }
      }

      let query = supabase
        .from('businesses')
        .select(`
          *,
          category:business_categories(*)
        `);

      if (filters.category) {
        query = query.eq('category_id', filters.category);
      }

      if (filters.businessName) {
        query = query.ilike('name', `%${filters.businessName}%`);
      }

      const { data: businessData, error: businessError } = await query;

      if (businessError) throw businessError;
      if (!businessData || businessData.length === 0) {
        setBusinesses([]);
        return;
      }

      let filteredBusinesses = businessData;

      if (filters.city) {
        filteredBusinesses = businessData.filter(b => {
          if (businessIdsFromLocations.size > 0 && businessIdsFromLocations.has(b.id)) return true;
          if (b.city === filters.city) return true;
          if (b.office_city === filters.city) return true;
          if (b.billing_city === filters.city) return true;
          return false;
        });
      } else if (filters.province) {
        const provinceCode = PROVINCE_TO_CODE[filters.province];
        filteredBusinesses = businessData.filter(b => {
          if (businessIdsFromLocations.size > 0 && businessIdsFromLocations.has(b.id)) return true;
          if (b.office_province === provinceCode) return true;
          if (b.billing_province === provinceCode) return true;
          if (b.city && CITY_TO_PROVINCE[b.city] === filters.province) return true;
          if (b.office_city && CITY_TO_PROVINCE[b.office_city] === filters.province) return true;
          if (b.billing_city && CITY_TO_PROVINCE[b.billing_city] === filters.province) return true;
          return false;
        });
      } else if (filters.region) {
        const provincesInRegion = PROVINCES_BY_REGION[filters.region] || [];
        const provinceCodes = provincesInRegion.map(p => PROVINCE_TO_CODE[p]).filter(Boolean);
        filteredBusinesses = businessData.filter(b => {
          if (businessIdsFromLocations.size > 0 && businessIdsFromLocations.has(b.id)) return true;
          if (b.office_province && provinceCodes.includes(b.office_province)) return true;
          if (b.billing_province && provinceCodes.includes(b.billing_province)) return true;
          if (b.city && provincesInRegion.includes(CITY_TO_PROVINCE[b.city])) return true;
          if (b.office_city && provincesInRegion.includes(CITY_TO_PROVINCE[b.office_city])) return true;
          if (b.billing_city && provincesInRegion.includes(CITY_TO_PROVINCE[b.billing_city])) return true;
          return false;
        });
      }

      if (filteredBusinesses.length === 0) {
        setBusinesses([]);
        return;
      }

      const businessIdsList = filteredBusinesses.map(b => b.id);

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

      let businessesWithRatings = filteredBusinesses.map(business => {
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
