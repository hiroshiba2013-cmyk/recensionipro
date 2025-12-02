import { useState, useEffect } from 'react';
import { Star, TrendingUp, ShieldCheck } from 'lucide-react';
import { supabase, Business, BusinessCategory } from '../lib/supabase';
import { BusinessCard } from '../components/business/BusinessCard';
import { AdvancedSearch, SearchFilters } from '../components/search/AdvancedSearch';
import { useAuth } from '../contexts/AuthContext';

interface BusinessWithRating extends Business {
  avg_rating?: number;
  review_count?: number;
}

export function HomePage() {
  const [businesses, setBusinesses] = useState<BusinessWithRating[]>([]);
  const [categories, setCategories] = useState<BusinessCategory[]>([]);
  const [filters, setFilters] = useState<SearchFilters>({
    category: '',
    city: '',
    businessName: '',
    minRating: 0,
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (categories.length > 0) {
      applyFilters();
    }
  }, [filters]);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: categoriesData } = await supabase
        .from('business_categories')
        .select('*')
        .order('name');

      if (categoriesData) {
        setCategories(categoriesData);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('businesses')
        .select(`
          *,
          category:business_categories(*)
        `)
        .eq('verified', true);

      if (filters.category) {
        query = query.eq('category_id', filters.category);
      }

      if (filters.city) {
        query = query.eq('city', filters.city);
      }

      if (filters.businessName) {
        query = query.ilike('name', `%${filters.businessName}%`);
      }

      const { data: businessesData } = await query.order('created_at', { ascending: false });

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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl font-bold mb-6">
              Scopri e Recensisci le Migliori Attività
            </h1>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Su TrovaFacile trovi le attività migliori nella tua zona, leggi le recensioni e accedi a sconti esclusivi
            </p>

            <AdvancedSearch onSearch={setFilters} isLoading={loading} />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <div className="bg-white p-6 rounded-xl shadow-sm text-center">
            <Star className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Recensioni Autentiche</h3>
            <p className="text-gray-600">Solo utenti verificati possono lasciare recensioni</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm text-center">
            <TrendingUp className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Sconti Esclusivi</h3>
            <p className="text-gray-600">Accedi a offerte speciali riservate agli iscritti</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm text-center">
            <ShieldCheck className="w-12 h-12 text-blue-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Attività Verificate</h3>
            <p className="text-gray-600">Tutte le attività sono verificate dal nostro team</p>
          </div>
        </div>


        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Attività in Evidenza</h2>
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : businesses.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg">
              <p className="text-gray-600">Nessuna attività trovata</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {businesses.map((business) => (
                <BusinessCard
                  key={business.id}
                  business={business}
                  onClick={() => {
                    if (user) {
                      window.location.href = `/business/${business.id}`;
                    } else {
                      alert('Effettua il login per visualizzare i dettagli');
                    }
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
