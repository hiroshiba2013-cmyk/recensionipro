import { useState, useEffect } from 'react';
import { Star, TrendingUp, ShieldCheck } from 'lucide-react';
import { supabase, Business } from '../lib/supabase';
import { BusinessCard } from '../components/business/BusinessCard';
import { AdvancedSearch } from '../components/search/AdvancedSearch';
import { useAuth } from '../contexts/AuthContext';

interface BusinessWithRating extends Business {
  avg_rating?: number;
  review_count?: number;
}

export function HomePage() {
  const [businesses, setBusinesses] = useState<BusinessWithRating[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    loadFeaturedBusinesses();
  }, []);

  const loadFeaturedBusinesses = async () => {
    setLoading(true);
    try {
      const { data: businessesData } = await supabase
        .from('businesses')
        .select(`
          *,
          category:business_categories(*)
        `)
        .order('created_at', { ascending: false });

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

        const sortedByReviews = businessesWithRatings
          .filter(b => b.review_count > 0)
          .sort((a, b) => b.review_count - a.review_count)
          .slice(0, 12);

        setBusinesses(sortedByReviews);
      }
    } catch (error) {
      console.error('Error loading featured businesses:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-6xl font-extrabold mb-8 leading-tight tracking-tight">
              La scelta di chi cerca.<br />L'opportunità di chi lavora.
            </h1>
            <p className="text-2xl text-blue-50 mb-12 max-w-4xl mx-auto leading-relaxed font-light">
              Tutto ciò che cerchi, recensioni verificate e scelte migliori. Più visibilità, più clienti, più crescita.
            </p>

            <AdvancedSearch
              onSearch={() => {}}
              isLoading={loading}
              navigateToSearchPage={true}
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-2xl shadow-lg p-8 mb-12">
          <div className="text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
              Scrivi recensioni e vinci premi esclusivi!
            </h2>
            <p className="text-lg text-gray-700 max-w-4xl mx-auto leading-relaxed">
              I migliori venti utenti che nel corso dell'anno scriveranno più recensioni saranno premiati con una gift card ricaricabile
            </p>
            <p className="text-base text-gray-600 mt-3 font-medium">
              (Premi e classifica visibili nella sezione CLASSIFICA UTENTI)
            </p>
          </div>
        </div>

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
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Attività in Evidenza</h2>
          <p className="text-gray-600 mb-6">Le attività con più recensioni</p>
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : businesses.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg">
              <p className="text-gray-600">Nessuna attività con recensioni al momento</p>
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

        <div className="bg-gradient-to-br from-green-50 to-blue-50 border-2 border-green-200 rounded-2xl shadow-lg p-12 mt-16 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
            Il tuo abbonamento vale il 10% di beneficenza
          </h2>
          <p className="text-lg text-gray-700 max-w-4xl mx-auto leading-relaxed">
            Trovafacile ogni anno donerà il 10% del proprio FATTURATO, che sarà visibile con documenti certificati, ad associazioni che voterete voi utenti
          </p>
        </div>
      </div>
    </div>
  );
}
