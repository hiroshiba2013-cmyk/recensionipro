import { useState, useEffect } from 'react';
import { Star, Search, Award, Tag, Briefcase, Heart, Users, MapPin, Euro, ArrowRight, Check, Building2 } from 'lucide-react';
import { AdvancedSearch } from '../components/search/AdvancedSearch';
import { useAuth } from '../contexts/AuthContext';
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
  const navigate = useNavigate();
  const [subscriptionPlans, setSubscriptionPlans] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    loadLandingData();
  }, []);

  const loadLandingData = async () => {
    try {
      setLoadingData(true);

      const { data: plansResult } = await supabase
        .from('subscription_plans')
        .select('*')
        .in('name', ['Base', 'Standard'])
        .order('monthly_price', { ascending: true });

      if (plansResult) {
        setSubscriptionPlans(plansResult);
      }
    } catch (error) {
      console.error('Error loading landing data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <div className="text-center">
            <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight">
              Benvenuto su<br />
              <span className="text-yellow-300">Trovafacile</span>
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 mb-4 max-w-3xl mx-auto leading-relaxed">
              La piattaforma che connette persone e attività locali in tutta Italia
            </p>
            <p className="text-lg text-blue-200 mb-8 max-w-2xl mx-auto">
              Prova gratuita di 30 giorni per utenti privati e aziende
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => window.location.href = '/?register=user'}
                className="bg-yellow-400 text-gray-900 px-8 py-4 rounded-lg text-lg font-bold hover:bg-yellow-300 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Inizia Gratis
              </button>
              <button
                onClick={() => navigate('/search-results')}
                className="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-bold hover:bg-gray-100 transition-all shadow-lg"
              >
                Esplora Attività
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <section className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Piani di Abbonamento
            </h2>
            <p className="text-xl text-gray-600">
              Scegli il piano più adatto alle tue esigenze
            </p>
          </div>

          {subscriptionPlans.length > 0 && (
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {subscriptionPlans.map((plan) => (
                <div
                  key={plan.id}
                  className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl shadow-xl border-2 border-green-200 p-8 hover:shadow-2xl transition-all"
                >
                  <div className="text-center mb-6">
                    <h3 className="text-3xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                    <div className="flex items-baseline justify-center gap-2">
                      <span className="text-5xl font-extrabold text-green-600">
                        {plan.monthly_price.toFixed(2)}€
                      </span>
                      <span className="text-gray-600">/mese</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      Per {plan.target_user_type === 'private' ? 'Utenti Privati' : 'Aziende'}
                    </p>
                  </div>

                  {plan.description && (
                    <p className="text-gray-700 mb-6 text-center">{plan.description}</p>
                  )}

                  <ul className="space-y-3 mb-8">
                    <li className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">Prova gratuita di 30 giorni</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">Cancellazione in qualsiasi momento</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">Supporto clienti dedicato</span>
                    </li>
                  </ul>

                  <button
                    onClick={() => navigate('/subscription')}
                    className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-all"
                  >
                    Inizia Ora
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="text-center mt-8">
            <button
              onClick={() => navigate('/subscription')}
              className="bg-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-700 transition-all inline-flex items-center gap-2"
            >
              Vedi Tutti i Piani <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </section>

        <section className="mb-16 bg-gradient-to-r from-pink-50 to-red-50 rounded-2xl p-12 border-2 border-pink-200">
          <div className="text-center mb-8">
            <div className="inline-block bg-gradient-to-br from-pink-500 to-red-500 p-4 rounded-full mb-4">
              <Heart className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Sezione Solidarietà
            </h2>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed">
              Il 10% del fatturato di Trovafacile viene devoluto in beneficenza per aiutare persone in difficoltà economica.
            </p>
          </div>

          <div className="bg-white rounded-xl p-8 shadow-lg max-w-3xl mx-auto">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Come Funziona</h3>
            <ul className="space-y-4 text-gray-700">
              <li className="flex items-start gap-3">
                <div className="bg-pink-100 rounded-full p-2 flex-shrink-0">
                  <Award className="w-5 h-5 text-pink-600" />
                </div>
                <p>Parte dei profitti viene destinata a famiglie e individui che necessitano di supporto economico</p>
              </li>
              <li className="flex items-start gap-3">
                <div className="bg-pink-100 rounded-full p-2 flex-shrink-0">
                  <Award className="w-5 h-5 text-pink-600" />
                </div>
                <p>Tutti i documenti contabili e le donazioni effettuate sono pubblicamente consultabili</p>
              </li>
              <li className="flex items-start gap-3">
                <div className="bg-pink-100 rounded-full p-2 flex-shrink-0">
                  <Award className="w-5 h-5 text-pink-600" />
                </div>
                <p>Gli utenti possono candidarsi per ricevere aiuto economico attraverso la piattaforma</p>
              </li>
            </ul>

            <div className="mt-6 text-center">
              <button
                onClick={() => navigate('/solidarity')}
                className="bg-pink-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-pink-700 transition-all inline-flex items-center gap-2"
              >
                Scopri di Più <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </section>

        <section>
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Cosa Puoi Fare con Trovafacile
            </h2>
            <p className="text-xl text-gray-600">
              Una piattaforma completa per connettere persone e attività
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all border-2 border-blue-100 hover:border-blue-300">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 w-16 h-16 rounded-xl flex items-center justify-center mb-4">
                <Search className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Cerca Attività</h3>
              <p className="text-gray-600 leading-relaxed">
                Trova attività commerciali verificate nella tua zona. Consulta recensioni autentiche e confronta servizi.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all border-2 border-yellow-100 hover:border-yellow-300">
              <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 w-16 h-16 rounded-xl flex items-center justify-center mb-4">
                <Star className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Scrivi Recensioni</h3>
              <p className="text-gray-600 leading-relaxed">
                Condividi la tua esperienza con foto. Guadagna punti per ogni recensione verificata.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all border-2 border-green-100 hover:border-green-300">
              <div className="bg-gradient-to-br from-green-500 to-green-600 w-16 h-16 rounded-xl flex items-center justify-center mb-4">
                <Tag className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Annunci Gratis</h3>
              <p className="text-gray-600 leading-relaxed">
                Compra, vendi o regala oggetti usati. Pubblica annunci senza costi.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all border-2 border-orange-100 hover:border-orange-300">
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 w-16 h-16 rounded-xl flex items-center justify-center mb-4">
                <Briefcase className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Trova Lavoro</h3>
              <p className="text-gray-600 leading-relaxed">
                Cerca opportunità nella tua zona o pubblica il tuo profilo per essere contattato.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all border-2 border-red-100 hover:border-red-300">
              <div className="bg-gradient-to-br from-red-500 to-red-600 w-16 h-16 rounded-xl flex items-center justify-center mb-4">
                <Award className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Vinci Premi</h3>
              <p className="text-gray-600 leading-relaxed">
                I migliori 20 utenti dell'anno vincono gift card ricaricabili.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all border-2 border-pink-100 hover:border-pink-300">
              <div className="bg-gradient-to-br from-pink-500 to-pink-600 w-16 h-16 rounded-xl flex items-center justify-center mb-4">
                <Heart className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Solidarietà</h3>
              <p className="text-gray-600 leading-relaxed">
                Il 10% del fatturato va in beneficenza. Consulta i documenti di trasparenza.
              </p>
            </div>
          </div>
        </section>
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

      <TopBusinessesBanner />

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
            <p className="text-green-700 font-bold text-center">{ad.price.toFixed(2)}€</p>
          </div>
        ) : (
          <div className="bg-blue-50 px-3 py-1.5 rounded-lg">
            <p className="text-blue-700 text-sm font-medium text-center">
              {ad.ad_type === 'gift' ? 'Regalo' : ad.ad_type === 'exchange' ? 'Scambio' : 'Vendita'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
