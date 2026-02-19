import { useState, useEffect } from 'react';
import { Star, TrendingUp, ShieldCheck, Search, Award, Package, Tag, Briefcase, Heart, Users, Building2, Gift, MapPin, Clock, Euro, ArrowRight, Percent } from 'lucide-react';
import { AdvancedSearch } from '../components/search/AdvancedSearch';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../lib/supabase';
import { useNavigate } from '../components/Router';
import TopBusinessesBanner from '../components/business/TopBusinessesBanner';

export function HomePage() {
  const { user } = useAuth();

  if (!user) {
    return <LandingPage />;
  }

  return <AuthenticatedHomePage />;
}

function LandingPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <div className="text-center">
            <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight">
              {t('home.welcomeTo')}<br />
              <span className="text-yellow-300">{t('home.platformName')}</span>
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 mb-4 max-w-3xl mx-auto leading-relaxed">
              {t('home.tagline')} {t('home.subtitle')}
            </p>
            <p className="text-lg text-blue-200 mb-8 max-w-2xl mx-auto">
              {t('home.trialInfo')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => window.location.href = '/?register=user'}
                className="bg-yellow-400 text-gray-900 px-8 py-4 rounded-lg text-lg font-bold hover:bg-yellow-300 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                {t('home.startFree')}
              </button>
              <button
                onClick={() => window.location.href = '/subscription'}
                className="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-bold hover:bg-gray-100 transition-all shadow-lg"
              >
                {t('home.viewPlans')}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-green-50 to-blue-50 border-y border-green-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 border-2 border-green-200">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="flex-shrink-0">
                <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Building2 className="w-10 h-10 text-white" />
                </div>
              </div>
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                  Sei un'Attività Commerciale?
                </h2>
                <p className="text-lg text-gray-600 mb-6">
                  Verifica se la tua attività è già presente nel nostro database e rivendicala gratuitamente per gestirla
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                  <button
                    onClick={() => navigate('/claim-business')}
                    className="inline-flex items-center justify-center gap-2 bg-green-600 text-white px-8 py-4 rounded-lg text-lg font-bold hover:bg-green-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    <Search className="w-5 h-5" />
                    Verifica la Tua Attività
                  </button>
                  <button
                    onClick={() => navigate('/subscription')}
                    className="inline-flex items-center justify-center gap-2 bg-white text-green-600 px-8 py-4 rounded-lg text-lg font-bold hover:bg-gray-50 transition-all shadow border-2 border-green-600"
                  >
                    <ShieldCheck className="w-5 h-5" />
                    Vedi i Vantaggi
                  </button>
                </div>
              </div>
            </div>
            <div className="mt-8 pt-8 border-t border-gray-200">
              <div className="grid sm:grid-cols-3 gap-4 text-center">
                <div className="flex items-center justify-center gap-2 text-gray-700">
                  <ShieldCheck className="w-5 h-5 text-green-600" />
                  <span className="font-semibold">Badge Verificato</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-gray-700">
                  <Star className="w-5 h-5 text-green-600" />
                  <span className="font-semibold">Gestisci Recensioni</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-gray-700">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  <span className="font-semibold">Crea Promozioni</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            {t('home.whatCanYouDo')}
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {t('home.completeDescription')}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <FeatureCard
            icon={<Search className="w-12 h-12 text-blue-600" />}
            title={t('home.feature.search.title')}
            description={t('home.feature.search.description')}
            gradient="from-blue-50 to-blue-100"
          />
          <FeatureCard
            icon={<Star className="w-12 h-12 text-yellow-500" />}
            title={t('home.feature.reviews.title')}
            description={t('home.feature.reviews.description')}
            gradient="from-yellow-50 to-yellow-100"
          />
          <FeatureCard
            icon={<Award className="w-12 h-12 text-purple-600" />}
            title={t('home.feature.prizes.title')}
            description={t('home.feature.prizes.description')}
            gradient="from-purple-50 to-purple-100"
          />
          <FeatureCard
            icon={<Package className="w-12 h-12 text-green-600" />}
            title={t('home.feature.products.title')}
            description={t('home.feature.products.description')}
            gradient="from-green-50 to-green-100"
          />
          <FeatureCard
            icon={<Tag className="w-12 h-12 text-orange-600" />}
            title={t('home.feature.classifieds.title')}
            description={t('home.feature.classifieds.description')}
            gradient="from-orange-50 to-orange-100"
          />
          <FeatureCard
            icon={<Briefcase className="w-12 h-12 text-indigo-600" />}
            title={t('home.feature.jobs.title')}
            description={t('home.feature.jobs.description')}
            gradient="from-indigo-50 to-indigo-100"
          />
        </div>

        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-2xl shadow-xl p-8 md:p-12 mb-16">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="bg-yellow-400 p-6 rounded-full flex-shrink-0">
              <Award className="w-16 h-16 text-white" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                {t('home.leaderboard.title')}
              </h3>
              <p className="text-lg text-gray-700 leading-relaxed">
                {t('home.leaderboard.description')}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-2xl shadow-xl p-8 md:p-12 mb-16">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="bg-gradient-to-br from-green-500 to-blue-500 p-6 rounded-full flex-shrink-0">
              <Heart className="w-16 h-16 text-white" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                {t('home.solidarity.title')}
              </h3>
              <p className="text-lg text-gray-700 leading-relaxed mb-3">
                {t('home.solidarity.description1')} <span className="font-bold text-green-600">{t('home.solidarity.percentage')}</span> {t('home.solidarity.description2')}
              </p>
              <p className="text-base text-gray-600">
                {t('home.solidarity.transparency')}
              </p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl shadow-xl p-8 text-white">
            <Users className="w-16 h-16 mb-4" />
            <h3 className="text-3xl font-bold mb-4">{t('home.forIndividuals')}</h3>
            <div className="mb-4">
              <p className="text-2xl font-bold text-yellow-300">{t('home.startingFrom')} €0.49{t('home.perMonth')}</p>
              <p className="text-sm text-blue-100">{t('home.trialFree')}</p>
            </div>
            <ul className="space-y-3 text-lg">
              <li className="flex items-start gap-2">
                <span className="text-yellow-300 font-bold text-xl">✓</span>
                <span>{t('home.feature.findBusinesses')}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-300 font-bold text-xl">✓</span>
                <span>{t('home.feature.findProducts')}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-300 font-bold text-xl">✓</span>
                <span>{t('home.feature.writeReviews')}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-300 font-bold text-xl">✓</span>
                <span>{t('home.feature.freeAds')}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-300 font-bold text-xl">✓</span>
                <span>{t('home.feature.jobSearch')}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-300 font-bold text-xl">✓</span>
                <span>{t('home.feature.charity')}</span>
              </li>
            </ul>
            <button
              onClick={() => window.location.href = '/?register=user'}
              className="w-full bg-yellow-400 text-gray-900 px-6 py-3 rounded-lg text-lg font-bold hover:bg-yellow-300 transition-all mt-6"
            >
              {t('home.startNow')}
            </button>
          </div>

          <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-2xl shadow-xl p-8 text-white">
            <Building2 className="w-16 h-16 mb-4" />
            <h3 className="text-3xl font-bold mb-4">{t('home.forBusiness')}</h3>
            <div className="mb-4">
              <p className="text-2xl font-bold text-yellow-300">{t('home.startingFrom')} €2.49{t('home.perMonth')}</p>
              <p className="text-sm text-green-100">{t('home.plusVAT')} - {t('home.trialFree')}</p>
            </div>
            <ul className="space-y-3 text-lg">
              <li className="flex items-start gap-2">
                <span className="text-yellow-300 font-bold text-xl">✓</span>
                <span>{t('home.feature.increaseVisibility')}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-300 font-bold text-xl">✓</span>
                <span>{t('home.feature.multipleLocations')}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-300 font-bold text-xl">✓</span>
                <span>{t('home.feature.addProducts')}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-300 font-bold text-xl">✓</span>
                <span>{t('home.feature.publishJobs')}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-300 font-bold text-xl">✓</span>
                <span>{t('home.feature.manageReviews')}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-300 font-bold text-xl">✓</span>
                <span>{t('home.feature.charity')}</span>
              </li>
            </ul>
            <button
              onClick={() => window.location.href = '/?register=business'}
              className="w-full bg-yellow-400 text-gray-900 px-6 py-3 rounded-lg text-lg font-bold hover:bg-yellow-300 transition-all mt-6"
            >
              {t('home.startNow')}
            </button>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-100 via-purple-100 to-pink-100 rounded-2xl shadow-xl p-8 md:p-12 text-center">
          <Gift className="w-20 h-20 text-purple-600 mx-auto mb-6" />
          <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Perché scegliere Trovafacile?
          </h3>
          <div className="grid md:grid-cols-3 gap-6 mt-8">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <ShieldCheck className="w-12 h-12 text-blue-600 mx-auto mb-3" />
              <h4 className="font-bold text-xl text-gray-900 mb-2">Verificato</h4>
              <p className="text-gray-600">Tutte le attività e le recensioni sono verificate dal nostro team</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <TrendingUp className="w-12 h-12 text-green-600 mx-auto mb-3" />
              <h4 className="font-bold text-xl text-gray-900 mb-2">Locale</h4>
              <p className="text-gray-600">Supporta le attività della tua zona e contribuisci all'economia locale</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <Heart className="w-12 h-12 text-red-600 mx-auto mb-3" />
              <h4 className="font-bold text-xl text-gray-900 mb-2">Solidale</h4>
              <p className="text-gray-600">Il 10% del fatturato viene donato ad associazioni benefiche</p>
            </div>
          </div>
        </div>

        <div className="text-center mt-16 pt-16 border-t border-gray-200">
          <h3 className="text-3xl font-bold text-gray-900 mb-4">
            Pronto a iniziare?
          </h3>
          <p className="text-xl text-gray-600 mb-2">
            Unisciti alla community di Trovafacile e scopri tutto quello che il tuo territorio ha da offrire
          </p>
          <p className="text-lg text-green-600 font-semibold mb-8">
            Un mese di prova gratuito - Nessuna carta di credito richiesta
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => window.location.href = '/?register=user'}
              className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-bold hover:bg-blue-700 transition-all shadow-lg"
            >
              Inizia Gratis
            </button>
            <button
              onClick={() => window.location.href = '/?login=true'}
              className="bg-gray-200 text-gray-900 px-8 py-4 rounded-lg text-lg font-bold hover:bg-gray-300 transition-all"
            >
              Accedi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AuthenticatedHomePage() {
  const { user, selectedBusinessLocationId } = useAuth();
  const navigate = useNavigate();
  const [jobPostings, setJobPostings] = useState<any[]>([]);
  const [jobSeekers, setJobSeekers] = useState<any[]>([]);
  const [featuredSellAds, setFeaturedSellAds] = useState<any[]>([]);
  const [featuredBuyAds, setFeaturedBuyAds] = useState<any[]>([]);
  const [featuredGiftAds, setFeaturedGiftAds] = useState<any[]>([]);
  const [topBusinesses, setTopBusinesses] = useState<any[]>([]);
  const [userType, setUserType] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviewCity, setReviewCity] = useState('');

  useEffect(() => {
    loadHomeData();
  }, [user, selectedBusinessLocationId, reviewCity]);

  const loadHomeData = async () => {
    try {
      setLoading(true);

      const profileResult = await supabase
        .from('profiles')
        .select('user_type')
        .eq('id', user?.id)
        .single();

      if (profileResult.data) {
        setUserType(profileResult.data.user_type);
      }

      const [jobsResult, jobSeekersResult, sellAdsResult, buyAdsResult, giftAdsResult, topBusinessesResult] = await Promise.all([
        (async () => {
          let query = supabase
            .from('job_postings')
            .select(`
              *,
              business:business_id(id, name, business_locations(city, province))
            `)
            .eq('status', 'active')
            .gt('expires_at', new Date().toISOString());

          if (selectedBusinessLocationId) {
            query = query.eq('business_location_id', selectedBusinessLocationId);
          }

          const { data } = await query;

          if (data) {
            const businessIds = [...new Set(data.map(job => job.business?.id).filter(Boolean))];

            const reviewCounts = await Promise.all(
              businessIds.map(async (businessId) => {
                const { count } = await supabase
                  .from('reviews')
                  .select('id', { count: 'exact', head: true })
                  .eq('business_id', businessId)
                  .eq('status', 'approved');

                return { businessId, count: count || 0 };
              })
            );

            const reviewCountMap = Object.fromEntries(
              reviewCounts.map(({ businessId, count }) => [businessId, count])
            );

            const sortedJobs = [...data].sort((a, b) => {
              const countA = reviewCountMap[a.business?.id || ''] || 0;
              const countB = reviewCountMap[b.business?.id || ''] || 0;

              if (countB !== countA) {
                return countB - countA;
              }

              return new Date(b.published_at).getTime() - new Date(a.published_at).getTime();
            });

            return sortedJobs.slice(0, 6);
          }
          return [];
        })(),

        (async () => {
          const { data: seekersData } = await supabase
            .from('job_seekers')
            .select(`
              *,
              profiles!inner(id, full_name, nickname),
              business_categories(name)
            `)
            .eq('status', 'active');

          if (seekersData && seekersData.length > 0) {
            const userIds = [...new Set(seekersData.map(js => js.user_id))];

            const activityCounts = await Promise.all(
              userIds.map(async (userId) => {
                const { data: activityData } = await supabase
                  .from('user_activity')
                  .select('total_points, reviews_count')
                  .eq('user_id', userId)
                  .single();

                return {
                  userId,
                  totalPoints: activityData?.total_points || 0,
                  reviewsCount: activityData?.reviews_count || 0
                };
              })
            );

            const activityMap = Object.fromEntries(
              activityCounts.map(({ userId, totalPoints, reviewsCount }) => [
                userId,
                { totalPoints, reviewsCount }
              ])
            );

            const sortedSeekers = [...seekersData].sort((a, b) => {
              const activityA = activityMap[a.user_id] || { totalPoints: 0, reviewsCount: 0 };
              const activityB = activityMap[b.user_id] || { totalPoints: 0, reviewsCount: 0 };

              if (activityB.totalPoints !== activityA.totalPoints) {
                return activityB.totalPoints - activityA.totalPoints;
              }

              if (activityB.reviewsCount !== activityA.reviewsCount) {
                return activityB.reviewsCount - activityA.reviewsCount;
              }

              return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            });

            return sortedSeekers.slice(0, 6);
          }
          return [];
        })(),

        supabase.rpc('get_featured_classified_ads', { ad_type_filter: 'sell', limit_count: 6 }),
        supabase.rpc('get_featured_classified_ads', { ad_type_filter: 'buy', limit_count: 6 }),
        supabase.rpc('get_featured_classified_ads', { ad_type_filter: 'gift', limit_count: 6 }),

        supabase.rpc('get_top_businesses_by_positive_reviews', { limit_count: 8 })
      ]);

      if (jobsResult) {
        console.log('Job postings loaded:', jobsResult.length);
        setJobPostings(jobsResult);
      }
      if (jobSeekersResult) {
        console.log('Job seekers loaded:', jobSeekersResult.length);
        setJobSeekers(jobSeekersResult);
      }

      console.log('Sell ads result:', sellAdsResult);
      console.log('Buy ads result:', buyAdsResult);
      console.log('Gift ads result:', giftAdsResult);

      if (sellAdsResult.data && sellAdsResult.data.length > 0) {
        const adsWithProfiles = sellAdsResult.data.map((ad: any) => ({
          ...ad,
          profiles: {
            id: ad.user_id,
            full_name: ad.user_full_name,
            nickname: ad.user_nickname,
            avatar_url: ad.user_avatar_url
          }
        }));
        console.log('Featured sell ads:', adsWithProfiles);
        setFeaturedSellAds(adsWithProfiles);
      } else {
        setFeaturedSellAds([]);
      }

      if (buyAdsResult.data && buyAdsResult.data.length > 0) {
        const adsWithProfiles = buyAdsResult.data.map((ad: any) => ({
          ...ad,
          profiles: {
            id: ad.user_id,
            full_name: ad.user_full_name,
            nickname: ad.user_nickname,
            avatar_url: ad.user_avatar_url
          }
        }));
        console.log('Featured buy ads:', adsWithProfiles);
        setFeaturedBuyAds(adsWithProfiles);
      } else {
        setFeaturedBuyAds([]);
      }

      if (giftAdsResult.data && giftAdsResult.data.length > 0) {
        const adsWithProfiles = giftAdsResult.data.map((ad: any) => ({
          ...ad,
          profiles: {
            id: ad.user_id,
            full_name: ad.user_full_name,
            nickname: ad.user_nickname,
            avatar_url: ad.user_avatar_url
          }
        }));
        console.log('Featured gift ads:', adsWithProfiles);
        setFeaturedGiftAds(adsWithProfiles);
      } else {
        setFeaturedGiftAds([]);
      }

      if (topBusinessesResult.data && topBusinessesResult.data.length > 0) {
        let normalizedBusinesses = topBusinessesResult.data.map((business: any) => ({
          id: business.business_id,
          name: business.business_name,
          business_categories: business.category_name ? {
            id: business.category_id,
            name: business.category_name
          } : null,
          business_locations: [{
            city: business.city,
            province: business.province,
            region: business.region,
            address: business.address || '',
            avatar_url: business.avatar_url
          }],
          avg_rating: parseFloat(business.avg_rating) || 0,
          review_count: parseInt(business.total_review_count) || 0,
          positive_review_count: parseInt(business.positive_review_count) || 0
        }));

        if (reviewCity) {
          normalizedBusinesses = normalizedBusinesses.filter((business: any) =>
            business.business_locations.some((loc: any) =>
              loc.city.toLowerCase().includes(reviewCity.toLowerCase())
            )
          );
        }

        setTopBusinesses(normalizedBusinesses);
      } else {
        const fallbackBusinesses = await supabase
          .from('unclaimed_business_locations')
          .select('id, name, category_id, city, province, region, street')
          .order('created_at', { ascending: false })
          .limit(8);

        if (fallbackBusinesses.data && fallbackBusinesses.data.length > 0) {
          const normalizedBusinesses = fallbackBusinesses.data.map((business: any) => ({
            id: business.id,
            name: business.name,
            business_categories: business.category_id ? { id: business.category_id } : null,
            business_locations: [{
              city: business.city,
              province: business.province,
              region: business.region,
              address: business.street || '',
              avatar_url: null
            }],
            avg_rating: 0,
            review_count: 0,
            positive_review_count: 0
          }));

          setTopBusinesses(normalizedBusinesses);
        }
      }
    } catch (error) {
      console.error('Error loading home data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-purple-50">
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 text-white py-20 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-extrabold mb-6 leading-tight tracking-tight drop-shadow-lg">
              Trova quello che cerchi
            </h1>
            <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto leading-relaxed">
              Attività locali, prodotti, offerte di lavoro e annunci nella tua zona
            </p>

            <AdvancedSearch
              onSearch={() => {}}
              isLoading={false}
              navigateToSearchPage={true}
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <div
            onClick={() => navigate('/search')}
            className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-3 mb-3">
              <Star className="w-8 h-8" />
              <h3 className="text-2xl font-bold">Recensioni</h3>
            </div>
            <p className="text-blue-100 text-sm leading-relaxed">
              Leggi e scrivi recensioni verificate sulle attività locali. Condividi la tua esperienza e guadagna punti per ogni recensione approvata.
            </p>
          </div>

          {userType !== 'business' && (
            <div
              onClick={() => navigate('/classified-ads')}
              className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3 mb-3">
                <Tag className="w-8 h-8" />
                <h3 className="text-2xl font-bold">Annunci</h3>
              </div>
              <p className="text-green-100 text-sm leading-relaxed">
                Compra, vendi o scambia oggetti usati nella tua zona. Pubblica annunci gratuiti e trova occasioni vicino a casa tua.
              </p>
            </div>
          )}

          <div
            onClick={() => navigate('/jobs')}
            className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-3 mb-3">
              <Briefcase className="w-8 h-8" />
              <h3 className="text-2xl font-bold">Lavoro</h3>
            </div>
            <p className="text-indigo-100 text-sm leading-relaxed">
              Cerca opportunità di lavoro nella tua zona o pubblica annunci se sei un'attività. Connetti talenti locali con le aziende.
            </p>
          </div>

          <div
            onClick={() => navigate('/solidarity')}
            className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-3 mb-3">
              <Heart className="w-8 h-8" />
              <h3 className="text-2xl font-bold">Solidarietà</h3>
            </div>
            <p className="text-pink-100 text-sm leading-relaxed">
              Aiuta chi è in difficoltà nella tua comunità. Richiedi o offri supporto solidale documentato e verificato dalla piattaforma.
            </p>
          </div>

          <div
            onClick={() => navigate('/leaderboard')}
            className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-3 mb-3">
              <Award className="w-8 h-8" />
              <h3 className="text-2xl font-bold">Classifica</h3>
            </div>
            <p className="text-yellow-100 text-sm leading-relaxed">
              Guadagna punti con le tue recensioni e scala la classifica. I primi 20 utenti dell'anno vincono gift card ricaricabili.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filtra Attività per Città
              </label>
              <input
                type="text"
                value={reviewCity}
                onChange={(e) => setReviewCity(e.target.value)}
                placeholder="Es: Milano, Roma, Napoli..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {topBusinesses.length > 0 && (
              <TopBusinessesBanner businesses={topBusinesses} />
            )}

            {userType !== 'business' && (
              <section className="mb-12 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl p-8 shadow-md border-2 border-purple-200">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-br from-purple-500 to-indigo-500 p-4 rounded-xl shadow-lg">
                      <Briefcase className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold text-gray-900">Trova Lavoro - Offerte in Evidenza</h2>
                      <p className="text-sm text-gray-600">Opportunità dalle aziende più recensite</p>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate('/jobs')}
                    className="flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 font-semibold shadow-md transition-all hover:scale-105"
                  >
                    Vedi tutte <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
                {jobPostings.length > 0 ? (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {jobPostings.map((job) => (
                      <JobOfferCard key={job.id} job={job} onClick={() => navigate('/jobs')} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Nessuna offerta di lavoro al momento</p>
                  </div>
                )}
              </section>
            )}

            {userType !== 'business' && (
              <section className="mb-12 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl p-8 shadow-md border-2 border-blue-200">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-br from-blue-500 to-cyan-500 p-4 rounded-xl shadow-lg">
                      <Users className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold text-gray-900">Cerco Lavoro - Candidati in Evidenza</h2>
                      <p className="text-sm text-gray-600">Profili degli utenti più attivi sulla piattaforma</p>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate('/jobs')}
                    className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold shadow-md transition-all hover:scale-105"
                  >
                    Vedi tutti <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
                {jobSeekers.length > 0 ? (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {jobSeekers.map((seeker) => (
                      <JobSeekerCard key={seeker.id} seeker={seeker} onClick={() => navigate('/jobs')} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Nessun candidato al momento</p>
                  </div>
                )}
              </section>
            )}

            {userType !== 'business' && (
              <>
                <section className="mb-8 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl p-8 shadow-md border-2 border-blue-200">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="bg-gradient-to-br from-blue-500 to-cyan-500 p-4 rounded-xl shadow-lg">
                        <Package className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <h2 className="text-3xl font-bold text-gray-900">Annunci in Evidenza - Vendo</h2>
                        <p className="text-sm text-gray-600">Dai utenti più attivi della piattaforma</p>
                      </div>
                    </div>
                    <button
                      onClick={() => navigate('/classified-ads?type=sell')}
                      className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold shadow-md transition-all hover:scale-105"
                    >
                      Vedi tutti <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                  {featuredSellAds.length > 0 ? (
                    <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-4">
                      {featuredSellAds.map((ad) => (
                        <ClassifiedAdCard key={ad.id} ad={ad} onClick={() => navigate(`/classified-ads/${ad.id}`)} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500">Nessun annuncio al momento. Pubblica il primo annuncio e ottieni visibilità!</p>
                    </div>
                  )}
                </section>

                <section className="mb-8 bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl p-8 shadow-md border-2 border-orange-200">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="bg-gradient-to-br from-orange-500 to-amber-500 p-4 rounded-xl shadow-lg">
                        <Search className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <h2 className="text-3xl font-bold text-gray-900">Annunci in Evidenza - Cerco</h2>
                        <p className="text-sm text-gray-600">Dai utenti più attivi della piattaforma</p>
                      </div>
                    </div>
                    <button
                      onClick={() => navigate('/classified-ads?type=buy')}
                      className="flex items-center gap-2 bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 font-semibold shadow-md transition-all hover:scale-105"
                    >
                      Vedi tutti <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                  {featuredBuyAds.length > 0 ? (
                    <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-4">
                      {featuredBuyAds.map((ad) => (
                        <ClassifiedAdCard key={ad.id} ad={ad} onClick={() => navigate(`/classified-ads/${ad.id}`)} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500">Nessun annuncio al momento. Pubblica il primo annuncio e ottieni visibilità!</p>
                    </div>
                  )}
                </section>

                <section className="mb-12 bg-gradient-to-r from-pink-50 to-rose-50 rounded-2xl p-8 shadow-md border-2 border-pink-200">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="bg-gradient-to-br from-pink-500 to-rose-500 p-4 rounded-xl shadow-lg">
                        <Gift className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <h2 className="text-3xl font-bold text-gray-900">Annunci in Evidenza - Regalo</h2>
                        <p className="text-sm text-gray-600">Dai utenti più attivi della piattaforma</p>
                      </div>
                    </div>
                    <button
                      onClick={() => navigate('/classified-ads?type=gift')}
                      className="flex items-center gap-2 bg-pink-600 text-white px-6 py-3 rounded-lg hover:bg-pink-700 font-semibold shadow-md transition-all hover:scale-105"
                    >
                      Vedi tutti <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                  {featuredGiftAds.length > 0 ? (
                    <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-4">
                      {featuredGiftAds.map((ad) => (
                        <ClassifiedAdCard key={ad.id} ad={ad} onClick={() => navigate(`/classified-ads/${ad.id}`)} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500">Nessun annuncio al momento. Pubblica il primo annuncio e ottieni visibilità!</p>
                    </div>
                  )}
                </section>
              </>
            )}
          </>
        )}

        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-2xl shadow-lg p-8 mb-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-yellow-400 p-4 rounded-full">
                <Award className="w-10 h-10 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">
                  Scrivi recensioni e vinci premi!
                </h3>
                <p className="text-gray-700">
                  I migliori 20 utenti dell'anno vincono gift card ricaricabili
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/leaderboard')}
              className="bg-yellow-400 text-gray-900 px-6 py-3 rounded-lg font-bold hover:bg-yellow-500 transition-colors whitespace-nowrap"
            >
              Vedi Classifica
            </button>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-blue-50 border-2 border-green-200 rounded-2xl shadow-lg p-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-gradient-to-br from-green-500 to-blue-500 p-4 rounded-full">
              <Heart className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">
              Il 10% del fatturato in beneficenza
            </h3>
          </div>
          <p className="text-gray-700 leading-relaxed">
            Trovafacile dona ogni anno il 10% del proprio fatturato ad associazioni no profit e progetti di beneficenza.
            Tutti i documenti sono pubblicati nella sezione Solidarietà per garantire massima trasparenza.
          </p>
          <button
            onClick={() => navigate('/solidarity')}
            className="mt-4 text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-2"
          >
            Scopri di più <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function QuickActionCard({ icon, title, description, color, onClick }: {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`bg-gradient-to-br ${color} text-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105 text-left`}
    >
      <div className="mb-3">{icon}</div>
      <h3 className="text-xl font-bold mb-1">{title}</h3>
      <p className="text-sm opacity-90">{description}</p>
    </button>
  );
}

function JobOfferCard({ job, onClick }: { job: any; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all p-6 cursor-pointer border-2 border-purple-100 hover:border-purple-300 transform hover:scale-105"
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-bold text-lg text-gray-900 line-clamp-2">{job.title}</h3>
        <div className="bg-purple-100 p-2 rounded-lg flex-shrink-0">
          <Briefcase className="w-5 h-5 text-purple-600" />
        </div>
      </div>
      <p className="text-sm text-gray-600 mb-3 font-medium line-clamp-1">{job.business?.name}</p>
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-2 bg-gray-50 p-2 rounded-lg">
        <MapPin className="w-4 h-4 text-blue-500" />
        <span className="line-clamp-1">{job.business?.business_locations?.[0]?.city}, {job.business?.business_locations?.[0]?.province}</span>
      </div>
      {job.gross_annual_salary && (
        <div className="flex items-center gap-2 text-sm text-green-600 font-semibold bg-green-50 p-2 rounded-lg mt-2">
          <Euro className="w-4 h-4" />
          <span>{job.gross_annual_salary.toLocaleString()} €/anno</span>
        </div>
      )}
      <div className="mt-3 flex items-center gap-2">
        <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded">
          {job.position_type}
        </span>
        <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded">
          {job.experience_level}
        </span>
      </div>
    </div>
  );
}

function JobSeekerCard({ seeker, onClick }: { seeker: any; onClick: () => void }) {
  const displayName = seeker.profiles?.nickname || seeker.profiles?.full_name || 'Utente';

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all p-6 cursor-pointer border-2 border-blue-100 hover:border-blue-300 transform hover:scale-105"
    >
      <div className="flex items-start gap-3 mb-3">
        <div className="bg-blue-100 p-3 rounded-full flex-shrink-0">
          <Users className="w-6 h-6 text-blue-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-lg text-gray-900 line-clamp-1">{displayName}</h3>
          <p className="text-sm text-gray-600 font-medium line-clamp-1">{seeker.title}</p>
        </div>
      </div>

      <p className="text-sm text-gray-700 mb-3 line-clamp-2">{seeker.description}</p>

      <div className="flex items-center gap-2 text-sm text-gray-500 mb-2 bg-gray-50 p-2 rounded-lg">
        <MapPin className="w-4 h-4 text-blue-500" />
        <span className="line-clamp-1">{seeker.city}, {seeker.province}</span>
      </div>

      {seeker.desired_salary_min && (
        <div className="flex items-center gap-2 text-sm text-green-600 font-semibold bg-green-50 p-2 rounded-lg mb-3">
          <Euro className="w-4 h-4" />
          <span>
            {seeker.desired_salary_min.toLocaleString()}
            {seeker.desired_salary_max ? ` - ${seeker.desired_salary_max.toLocaleString()}` : '+'} €/anno
          </span>
        </div>
      )}

      {seeker.skills && seeker.skills.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {seeker.skills.slice(0, 3).map((skill: string, index: number) => (
            <span key={index} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded">
              {skill}
            </span>
          ))}
          {seeker.skills.length > 3 && (
            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
              +{seeker.skills.length - 3}
            </span>
          )}
        </div>
      )}

      <div className="flex items-center gap-2">
        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
          {seeker.contract_type}
        </span>
        {seeker.experience_years !== undefined && (
          <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded">
            {seeker.experience_years} anni esp.
          </span>
        )}
      </div>
    </div>
  );
}

function ClassifiedAdCard({ ad, onClick }: { ad: any; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all cursor-pointer overflow-hidden border-2 border-green-100 hover:border-green-300 transform hover:scale-105"
    >
      {ad.images?.[0] ? (
        <img
          src={ad.images[0]}
          alt={ad.title}
          className="w-full h-32 object-cover"
        />
      ) : (
        <div className="w-full h-32 bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center">
          <Tag className="w-8 h-8 text-green-500" />
        </div>
      )}
      <div className="p-3">
        <h3 className="font-semibold text-sm text-gray-900 line-clamp-2 mb-2">{ad.title}</h3>
        {ad.price > 0 ? (
          <div className="bg-green-50 px-3 py-1.5 rounded-lg">
            <p className="text-green-700 font-bold text-center">€{ad.price.toFixed(2)}</p>
          </div>
        ) : (
          <div className="bg-blue-50 px-3 py-1.5 rounded-lg">
            <p className="text-blue-700 text-sm font-medium text-center">
              {ad.ad_type === 'gift' ? '🎁 Regalo' : ad.ad_type === 'exchange' ? '🔄 Scambio' : 'Vendita'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description, gradient }: {
  icon: React.ReactNode;
  title: string;
  description: string;
  gradient: string;
}) {
  return (
    <div className={`bg-gradient-to-br ${gradient} rounded-xl p-6 shadow-sm hover:shadow-lg transition-all transform hover:scale-105`}>
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
      <p className="text-gray-700 leading-relaxed">{description}</p>
    </div>
  );
}
