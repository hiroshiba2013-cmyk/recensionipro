import { useState, useEffect } from 'react';
import { Star, TrendingUp, ShieldCheck, Search, Award, Package, Tag, Briefcase, Heart, Users, Building2, Gift, MapPin, Clock, Euro, ArrowRight, Percent } from 'lucide-react';
import { AdvancedSearch } from '../components/search/AdvancedSearch';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../lib/supabase';
import { useNavigate } from '../components/Router';
import TopBusinessesBanner from '../components/business/TopBusinessesBanner';

export function HomePage() {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Caricamento...</p>
        </div>
      </div>
    );
  }

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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Cosa puoi fare con Trovafacile
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Una piattaforma completa per connettere persone e attività locali
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all border-2 border-blue-100 hover:border-blue-300">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 w-16 h-16 rounded-xl flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Cerca Attività</h3>
            <p className="text-gray-600 leading-relaxed">
              Trova attività commerciali verificate nella tua zona. Consulta recensioni autentiche e confronta servizi e prodotti.
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all border-2 border-yellow-100 hover:border-yellow-300">
            <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 w-16 h-16 rounded-xl flex items-center justify-center mb-4">
              <Star className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Scrivi Recensioni</h3>
            <p className="text-gray-600 leading-relaxed">
              Condividi la tua esperienza con foto e dettagli. Guadagna punti per ogni recensione verificata e scala la classifica.
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all border-2 border-green-100 hover:border-green-300">
            <div className="bg-gradient-to-br from-green-500 to-green-600 w-16 h-16 rounded-xl flex items-center justify-center mb-4">
              <Tag className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Annunci Gratis</h3>
            <p className="text-gray-600 leading-relaxed">
              Compra, vendi o regala oggetti usati nella tua zona. Pubblica annunci senza costi e trova occasioni vicino a te.
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all border-2 border-orange-100 hover:border-orange-300">
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 w-16 h-16 rounded-xl flex items-center justify-center mb-4">
              <Briefcase className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Trova Lavoro</h3>
            <p className="text-gray-600 leading-relaxed">
              Cerca opportunità di lavoro nella tua zona o pubblica il tuo profilo per essere contattato dalle aziende locali.
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all border-2 border-red-100 hover:border-red-300">
            <div className="bg-gradient-to-br from-red-500 to-red-600 w-16 h-16 rounded-xl flex items-center justify-center mb-4">
              <Award className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Vinci Premi</h3>
            <p className="text-gray-600 leading-relaxed">
              Guadagna punti con le tue recensioni. I migliori 20 utenti dell'anno vincono gift card ricaricabili.
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all border-2 border-pink-100 hover:border-pink-300">
            <div className="bg-gradient-to-br from-pink-500 to-pink-600 w-16 h-16 rounded-xl flex items-center justify-center mb-4">
              <Heart className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Solidarietà</h3>
            <p className="text-gray-600 leading-relaxed">
              Il 10% del fatturato va in beneficenza. Aiuta chi è in difficoltà e consulta i documenti di trasparenza.
            </p>
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

          <div className="mt-12 pt-8 border-t border-gray-200">
            <a
              href="/admin/login"
              className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors text-sm font-medium"
            >
              <Shield className="w-4 h-4" />
              Area Admin
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function AuthenticatedHomePage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [jobPostings, setJobPostings] = useState<any[]>([]);
  const [featuredSellAds, setFeaturedSellAds] = useState<any[]>([]);
  const [topUsers, setTopUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHomeData();
  }, [user]);

  const loadHomeData = async () => {
    try {
      setLoading(true);

      const [jobsResult, sellAdsResult, topUsersResult] = await Promise.all([
        (async () => {
          const { data } = await supabase
            .from('job_postings')
            .select(`
              *,
              business:business_id(id, name, business_locations(city, province))
            `)
            .eq('status', 'active')
            .gt('expires_at', new Date().toISOString());

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

        supabase.rpc('get_featured_classified_ads', { ad_type_filter: 'sell', limit_count: 6 }),

        supabase
          .from('user_activity')
          .select(`
            user_id,
            total_points,
            reviews_count,
            profiles:user_id(id, nickname, full_name, avatar_url)
          `)
          .order('total_points', { ascending: false })
          .limit(20)
      ]);

      if (jobsResult) {
        setJobPostings(jobsResult);
      }

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
        setFeaturedSellAds(adsWithProfiles);
      } else {
        setFeaturedSellAds([]);
      }

      if (topUsersResult.data) {
        setTopUsers(topUsersResult.data);
      }
    } catch (error) {
      console.error('Error loading home data:', error);
    } finally {
      setLoading(false);
    }
  };

  const displayName = profile?.nickname || profile?.full_name || 'Utente';

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-purple-50">
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 text-white py-12 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-extrabold mb-2 leading-tight tracking-tight drop-shadow-lg">
              Bentornato, {displayName}
            </h1>
          </div>

          <div className="max-w-4xl mx-auto">
            <AdvancedSearch
              onSearch={() => {}}
              isLoading={false}
              navigateToSearchPage={true}
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
          </div>
        ) : (
          <>
            <section className="mb-12 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl p-8 shadow-md border-2 border-yellow-200">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-br from-yellow-500 to-orange-500 p-4 rounded-xl shadow-lg">
                    <Award className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900">Classifica Utenti</h2>
                    <p className="text-sm text-gray-600">I migliori 20 utenti vincono gift card ricaricabili</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/leaderboard')}
                  className="flex items-center gap-2 bg-yellow-600 text-white px-6 py-3 rounded-lg hover:bg-yellow-700 font-semibold shadow-md transition-all hover:scale-105"
                >
                  Vedi tutti <ArrowRight className="w-4 h-4" />
                </button>
              </div>
              {topUsers.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {topUsers.slice(0, 8).map((userActivity: any, index: number) => (
                    <TopUserCard key={userActivity.user_id} userActivity={userActivity} rank={index + 1} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">Nessun utente in classifica al momento</p>
                </div>
              )}
            </section>

            <section className="mb-12 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl p-8 shadow-md border-2 border-blue-200">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-br from-blue-500 to-cyan-500 p-4 rounded-xl shadow-lg">
                    <Briefcase className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900">Migliori Offerte di Lavoro</h2>
                    <p className="text-sm text-gray-600">Dalle aziende più recensite</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/jobs')}
                  className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold shadow-md transition-all hover:scale-105"
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

            <section className="mb-12 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-8 shadow-md border-2 border-green-200">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-br from-green-500 to-emerald-500 p-4 rounded-xl shadow-lg">
                    <Tag className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900">Migliori Annunci di Vendita</h2>
                    <p className="text-sm text-gray-600">Dagli utenti più attivi</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/classified-ads?type=sell')}
                  className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-semibold shadow-md transition-all hover:scale-105"
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
                  <p className="text-gray-500">Nessun annuncio al momento</p>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}

function TopUserCard({ userActivity, rank }: { userActivity: any; rank: number }) {
  const displayName = userActivity.profiles?.nickname || userActivity.profiles?.full_name || 'Utente';

  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all p-6 border-2 border-yellow-100">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
          rank === 1 ? 'bg-yellow-500' : rank === 2 ? 'bg-gray-400' : rank === 3 ? 'bg-orange-600' : 'bg-blue-500'
        }`}>
          {rank}
        </div>
        {userActivity.profiles?.avatar_url ? (
          <img
            src={userActivity.profiles.avatar_url}
            alt={displayName}
            className="w-12 h-12 rounded-full object-cover"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
            <Users className="w-6 h-6 text-gray-400" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-900 truncate">{displayName}</h3>
        </div>
      </div>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Punti Totali</span>
          <span className="font-bold text-yellow-600">{userActivity.total_points}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Recensioni</span>
          <span className="font-semibold text-blue-600">{userActivity.reviews_count}</span>
        </div>
      </div>
    </div>
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

