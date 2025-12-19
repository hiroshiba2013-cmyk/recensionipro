import { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { supabase, Business, BusinessCategory } from '../lib/supabase';
import { BusinessCard } from '../components/business/BusinessCard';
import { AdvancedSearch, SearchFilters } from '../components/search/AdvancedSearch';
import { PROVINCE_TO_CODE, PROVINCES_BY_REGION } from '../lib/cities';

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
      const businessIds = new Set<string>();

      if (filters.region || filters.province || filters.city) {
        let locationQuery = supabase
          .from('business_locations')
          .select('business_id, province, city');

        if (filters.region) {
          const provincesInRegion = PROVINCES_BY_REGION[filters.region] || [];
          if (provincesInRegion.length > 0) {
            locationQuery = locationQuery.in('province', provincesInRegion);
          }
        }

        if (filters.province) {
          locationQuery = locationQuery.eq('province', filters.province);
        }

        if (filters.city) {
          locationQuery = locationQuery.eq('city', filters.city);
        }

        const { data: locationsData } = await locationQuery;

        if (locationsData) {
          locationsData.forEach((loc) => businessIds.add(loc.business_id));
        }
      }

      let businessQuery = supabase
        .from('businesses')
        .select(`
          *,
          category:business_categories(*)
        `);

      if (filters.category) {
        businessQuery = businessQuery.eq('category_id', filters.category);
      }

      if (filters.businessName) {
        businessQuery = businessQuery.ilike('name', `%${filters.businessName}%`);
      }

      if (businessIds.size > 0) {
        businessQuery = businessQuery.in('id', Array.from(businessIds));
      }

      const { data: businessesData } = await businessQuery.order('created_at', { ascending: false });

      if (businessesData) {
        const businessesWithRatings = await Promise.all(
          businessesData.map(async (business) => {
            const { data: reviews } = await supabase
              .from('reviews')
              .select('rating')
              .eq('business_id', business.id);

            const avg_rating = reviews && reviews.length > 0
              ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
              : 0;

            const review_count = reviews?.length || 0;

            return {
              ...business,
              avg_rating,
              review_count,
            };
          })
        );

        let filtered = businessesWithRatings;

        if (filters.minRating > 0) {
          filtered = filtered.filter(b => (b.avg_rating || 0) >= filters.minRating);
        }

        filtered.sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0));

        setBusinesses(filtered);
      }
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
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Risultati della Ricerca
            {hasSearched && (
              <span className="ml-3 text-lg font-normal text-gray-600">
                ({businesses.length} {businesses.length === 1 ? 'attività trovata' : 'attività trovate'})
              </span>
            )}
          </h2>
        </div>

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
