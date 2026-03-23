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

      const { data: plansResult, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('billing_period', 'monthly')
        .order('price', { ascending: true });

      if (error) {
        console.error('Error loading subscription plans:', error);
      } else if (plansResult) {
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

            <div className="flex justify-center">
              <button
                onClick={() => window.location.href = '/?register=user'}
                className="bg-yellow-400 text-gray-900 px-8 py-4 rounded-lg text-lg font-bold hover:bg-yellow-300 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Inizia Gratis
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <section className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Scegli il Tuo Account
            </h2>
            <p className="text-xl text-gray-600">
              Unisciti a Trovafacile e scopri tutte le funzionalità della piattaforma
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <div className="bg-gradient-to-br from-blue-50 via-white to-cyan-50 rounded-2xl shadow-xl border-2 border-blue-200 p-8 hover:shadow-2xl transition-all transform hover:scale-105">
              <div className="text-center mb-6">
                <div className="inline-block bg-gradient-to-br from-blue-500 to-cyan-500 p-4 rounded-full mb-4">
                  <Users className="w-12 h-12 text-white" />
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-3">Utente Privato</h3>
                <p className="text-gray-600 text-lg leading-relaxed">
                  Perfetto per famiglie e persone che vogliono trovare attività locali, lasciare recensioni e accedere a vantaggi esclusivi
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 mb-6 shadow-sm">
                <h4 className="font-bold text-gray-900 mb-4 text-lg">Cosa puoi fare:</h4>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <div className="bg-blue-100 rounded-full p-1 flex-shrink-0 mt-0.5">
                      <Check className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="text-gray-700">Cerca e scopri attività locali verificate</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="bg-blue-100 rounded-full p-1 flex-shrink-0 mt-0.5">
                      <Check className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="text-gray-700">Scrivi recensioni e guadagna punti</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="bg-blue-100 rounded-full p-1 flex-shrink-0 mt-0.5">
                      <Check className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="text-gray-700">Pubblica annunci di compravendita e cerca lavoro</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="bg-blue-100 rounded-full p-1 flex-shrink-0 mt-0.5">
                      <Check className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="text-gray-700">Gestisci fino a 4 profili familiari</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="bg-blue-100 rounded-full p-1 flex-shrink-0 mt-0.5">
                      <Check className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="text-gray-700">Partecipa alla classifica e vinci gift card</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={() => window.location.href = '/?register=user'}
                className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-4 rounded-xl font-bold text-lg hover:from-blue-600 hover:to-cyan-600 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                Inizia Gratis <ArrowRight className="w-5 h-5" />
              </button>
              <p className="text-center text-sm text-gray-500 mt-3">30 giorni di prova gratuita</p>
            </div>

            <div className="bg-gradient-to-br from-green-50 via-white to-emerald-50 rounded-2xl shadow-xl border-2 border-green-200 p-8 hover:shadow-2xl transition-all transform hover:scale-105">
              <div className="text-center mb-6">
                <div className="inline-block bg-gradient-to-br from-green-500 to-emerald-500 p-4 rounded-full mb-4">
                  <Building2 className="w-12 h-12 text-white" />
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-3">Utente Business</h3>
                <p className="text-gray-600 text-lg leading-relaxed">
                  Ideale per aziende e attività commerciali che vogliono farsi trovare, gestire recensioni e pubblicare offerte di lavoro
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 mb-6 shadow-sm">
                <h4 className="font-bold text-gray-900 mb-4 text-lg">Cosa puoi fare:</h4>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <div className="bg-green-100 rounded-full p-1 flex-shrink-0 mt-0.5">
                      <Check className="w-4 h-4 text-green-600" />
                    </div>
                    <span className="text-gray-700">Rivendica o registra la tua attività</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="bg-green-100 rounded-full p-1 flex-shrink-0 mt-0.5">
                      <Check className="w-4 h-4 text-green-600" />
                    </div>
                    <span className="text-gray-700">Gestisci più sedi aziendali</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="bg-green-100 rounded-full p-1 flex-shrink-0 mt-0.5">
                      <Check className="w-4 h-4 text-green-600" />
                    </div>
                    <span className="text-gray-700">Rispondi alle recensioni dei clienti</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="bg-green-100 rounded-full p-1 flex-shrink-0 mt-0.5">
                      <Check className="w-4 h-4 text-green-600" />
                    </div>
                    <span className="text-gray-700">Pubblica offerte di lavoro e trova candidati</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="bg-green-100 rounded-full p-1 flex-shrink-0 mt-0.5">
                      <Check className="w-4 h-4 text-green-600" />
                    </div>
                    <span className="text-gray-700">Crea sconti e promozioni verificate</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={() => window.location.href = '/?register=business'}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-4 rounded-xl font-bold text-lg hover:from-green-600 hover:to-emerald-600 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                Inizia Gratis <ArrowRight className="w-5 h-5" />
              </button>
              <p className="text-center text-sm text-gray-500 mt-3">30 giorni di prova gratuita</p>
            </div>
          </div>
        </section>
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
              Il 10% del fatturato di Trovafacile viene devoluto in beneficenza ad associazioni e enti no profit che gli utenti sceglieranno attraverso un form dedicato.
            </p>
          </div>

          <div className="bg-white rounded-xl p-8 shadow-lg max-w-3xl mx-auto">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Come Funziona</h3>
            <ul className="space-y-4 text-gray-700">
              <li className="flex items-start gap-3">
                <div className="bg-pink-100 rounded-full p-2 flex-shrink-0">
                  <Award className="w-5 h-5 text-pink-600" />
                </div>
                <p>Tutti i documenti contabili e le donazioni effettuate sono pubblicamente consultabili</p>
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
  const { user, profile, activeProfile } = useAuth();
  const navigate = useNavigate();
  const [jobSeekers, setJobSeekers] = useState<any[]>([]);
  const [featuredSellAds, setFeaturedSellAds] = useState<any[]>([]);
  const [topUsers, setTopUsers] = useState<any[]>([]);
  const [topBusinesses, setTopBusinesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const isBusiness = profile?.user_type === 'business';

  // Determina il nome da mostrare nel benvenuto
  const displayName = activeProfile
    ? (activeProfile.nickname || activeProfile.name)
    : (profile?.full_name || 'Utente');

  useEffect(() => {
    loadHomeData();
  }, [user, profile?.user_type, profile?.business_id]);

  const loadHomeData = async () => {
    try {
      setLoading(true);

      const [jobSeekersResult, sellAdsResult, topDataResult] = await Promise.all([
        (async () => {
          let query = supabase
            .from('job_seekers')
            .select(`
              *,
              profiles:user_id(id, nickname, full_name, avatar_url),
              category:category_id(id, name)
            `)
            .eq('status', 'active')
            .order('created_at', { ascending: false });

          if (isBusiness && profile?.business_id) {
            const { data: businessData } = await supabase
              .from('businesses')
              .select('category_id')
              .eq('id', profile.business_id)
              .single();

            if (businessData?.category_id) {
              query = query.eq('category_id', businessData.category_id);
            }
          }

          const { data } = await query.limit(6);
          return data || [];
        })(),

        supabase.rpc('get_featured_classified_ads', { ad_type_filter: 'sell', limit_count: 6 }),

        isBusiness
          ? supabase.rpc('get_top_business_locations', { limit_count: 20 })
          : supabase
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

      if (jobSeekersResult) {
        setJobSeekers(jobSeekersResult);
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

      if (isBusiness && topDataResult.data) {
        setTopBusinesses(topDataResult.data);
      } else if (!isBusiness && topDataResult.data) {
        setTopUsers(topDataResult.data);
      }
    } catch (error) {
      console.error('Error loading home data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Determina il nome per il benvenuto nella hero section
  const heroDisplayName = activeProfile
    ? (activeProfile.nickname || activeProfile.name.split(' ')[0])
    : (profile?.nickname || profile?.full_name?.split(' ')[0] || 'Utente');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-cyan-600">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bS0yIDJ2Mmgydi0yaC0yem0wLTJ2Mmgydi0yaC0yem0yLTJ2Mmgydi0yaC0yem0wLTJ2Mmgydi0yaC0yem0tMiAydjJoMnYtMmgtMnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-10">
            <div className="inline-block mb-4">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-white text-sm font-medium">Online</span>
              </div>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold mb-3 text-white drop-shadow-lg">
              Ciao, {heroDisplayName}!
            </h1>
            <p className="text-blue-100 text-lg md:text-xl max-w-2xl mx-auto mb-8">
              Esplora attività locali, trova candidati, vendi e compra oggetti
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <AdvancedSearch
              onSearch={() => {}}
              isLoading={false}
              navigateToSearchPage={true}
            />
          </div>

          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <button
              onClick={() => navigate('/classified-ads')}
              className="group bg-white/10 backdrop-blur-sm hover:bg-white/20 rounded-xl p-4 transition-all hover:scale-105"
            >
              <Tag className="w-6 h-6 text-white mx-auto mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-white text-sm font-medium block">Annunci</span>
            </button>

            <button
              onClick={() => navigate('/jobs')}
              className="group bg-white/10 backdrop-blur-sm hover:bg-white/20 rounded-xl p-4 transition-all hover:scale-105"
            >
              <Briefcase className="w-6 h-6 text-white mx-auto mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-white text-sm font-medium block">Lavoro</span>
            </button>

            <button
              onClick={() => navigate('/leaderboard')}
              className="group bg-white/10 backdrop-blur-sm hover:bg-white/20 rounded-xl p-4 transition-all hover:scale-105"
            >
              <Award className="w-6 h-6 text-white mx-auto mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-white text-sm font-medium block">Classifica</span>
            </button>

            <button
              onClick={() => navigate('/solidarity')}
              className="group bg-white/10 backdrop-blur-sm hover:bg-white/20 rounded-xl p-4 transition-all hover:scale-105"
            >
              <Heart className="w-6 h-6 text-white mx-auto mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-white text-sm font-medium block">Solidarietà</span>
            </button>
          </div>
        </div>
      </div>

      <TopBusinessesBanner />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent"></div>
              <p className="mt-4 text-gray-600 font-medium">Caricamento contenuti...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-12">
            <section>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-br from-yellow-400 to-orange-500 p-3 rounded-xl shadow-lg">
                    {isBusiness ? <Building2 className="w-6 h-6 text-white" /> : <Award className="w-6 h-6 text-white" />}
                  </div>
                  <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                      {isBusiness ? 'Top 20 Aziende' : 'Top Utenti'}
                    </h2>
                    <p className="text-sm text-gray-600">
                      {isBusiness ? 'Le aziende più recensite' : 'I primi 20 vincono gift card'}
                    </p>
                  </div>
                </div>
                {!isBusiness && (
                  <button
                    onClick={() => navigate('/leaderboard')}
                    className="group flex items-center gap-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-5 py-2.5 rounded-xl hover:shadow-lg font-semibold transition-all hover:scale-105"
                  >
                    Vedi tutti
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                )}
              </div>

              {isBusiness ? (
                topBusinesses.length > 0 ? (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {topBusinesses.slice(0, 8).map((business: any, index: number) => (
                      <TopBusinessCard
                        key={business.location_id}
                        business={business}
                        rank={index + 1}
                        onClick={() => navigate(`/business/${business.location_id}`)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-white rounded-2xl">
                    <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Nessuna azienda disponibile</p>
                  </div>
                )
              ) : (
                topUsers.length > 0 ? (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {topUsers.slice(0, 8).map((userActivity: any, index: number) => (
                      <TopUserCard key={userActivity.user_id} userActivity={userActivity} rank={index + 1} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-white rounded-2xl">
                    <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Nessun utente in classifica</p>
                  </div>
                )
              )}
            </section>

            <section>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-br from-blue-500 to-cyan-500 p-3 rounded-xl shadow-lg">
                    <Briefcase className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Cerco Lavoro</h2>
                    <p className="text-sm text-gray-600">
                      {isBusiness ? 'Candidati nella tua categoria' : 'Annunci di chi cerca lavoro'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/jobs')}
                  className="group flex items-center gap-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-5 py-2.5 rounded-xl hover:shadow-lg font-semibold transition-all hover:scale-105"
                >
                  Vedi tutti
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>

              {jobSeekers.length > 0 ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {jobSeekers.map((seeker) => (
                    <JobSeekerCard key={seeker.id} seeker={seeker} onClick={() => navigate('/jobs')} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-white rounded-2xl">
                  <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">
                    {isBusiness ? 'Nessun candidato disponibile nella tua categoria' : 'Nessun annuncio disponibile'}
                  </p>
                </div>
              )}
            </section>

            <section>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-br from-green-500 to-emerald-500 p-3 rounded-xl shadow-lg">
                    <Tag className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Annunci in Evidenza</h2>
                    <p className="text-sm text-gray-600">Dagli utenti più attivi</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/classified-ads?type=sell')}
                  className="group flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-5 py-2.5 rounded-xl hover:shadow-lg font-semibold transition-all hover:scale-105"
                >
                  Vedi tutti
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>

              {featuredSellAds.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                  {featuredSellAds.map((ad) => (
                    <ClassifiedAdCard key={ad.id} ad={ad} onClick={() => navigate(`/classified-ads/${ad.id}`)} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-white rounded-2xl">
                  <Tag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Nessun annuncio disponibile</p>
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

function TopUserCard({ userActivity, rank }: { userActivity: any; rank: number }) {
  const displayName = userActivity.profiles?.nickname || userActivity.profiles?.full_name || 'Utente';
  const isTopThree = rank <= 3;

  return (
    <div className={`relative bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all p-5 border-2 ${
      isTopThree ? 'border-yellow-300 bg-gradient-to-br from-yellow-50 to-white' : 'border-gray-200'
    }`}>
      {isTopThree && (
        <div className="absolute -top-3 -right-3 w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
          <Award className="w-5 h-5 text-white" />
        </div>
      )}

      <div className="flex items-center gap-3 mb-4">
        <div className={`relative w-12 h-12 rounded-full flex items-center justify-center font-bold text-white shadow-md ${
          rank === 1 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' :
          rank === 2 ? 'bg-gradient-to-br from-gray-300 to-gray-500' :
          rank === 3 ? 'bg-gradient-to-br from-orange-400 to-orange-600' :
          'bg-gradient-to-br from-blue-400 to-blue-600'
        }`}>
          <span className="text-lg">{rank}</span>
        </div>

        {userActivity.profiles?.avatar_url ? (
          <img
            src={userActivity.profiles.avatar_url}
            alt={displayName}
            className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-md"
          />
        ) : (
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center border-2 border-white shadow-md">
            <Users className="w-7 h-7 text-gray-500" />
          </div>
        )}
      </div>

      <h3 className="font-bold text-gray-900 text-lg mb-4 truncate">{displayName}</h3>

      <div className="space-y-2">
        <div className="flex items-center justify-between bg-yellow-50 rounded-lg px-3 py-2">
          <span className="text-sm text-gray-700 font-medium">Punti</span>
          <span className="font-bold text-yellow-600 text-lg">{userActivity.total_points}</span>
        </div>
        <div className="flex items-center justify-between bg-blue-50 rounded-lg px-3 py-2">
          <span className="text-sm text-gray-700 font-medium">Recensioni</span>
          <span className="font-bold text-blue-600">{userActivity.reviews_count}</span>
        </div>
      </div>
    </div>
  );
}

function TopBusinessCard({ business, rank, onClick }: { business: any; rank: number; onClick: () => void }) {
  const isTopThree = rank <= 3;

  return (
    <div
      onClick={onClick}
      className={`relative bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all p-5 border-2 cursor-pointer ${
        isTopThree ? 'border-yellow-300 bg-gradient-to-br from-yellow-50 to-white' : 'border-gray-200'
      }`}
    >
      {isTopThree && (
        <div className="absolute -top-3 -right-3 w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
          <Award className="w-5 h-5 text-white" />
        </div>
      )}

      <div className="flex items-center gap-3 mb-4">
        <div className={`relative w-12 h-12 rounded-full flex items-center justify-center font-bold text-white shadow-md ${
          rank === 1 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' :
          rank === 2 ? 'bg-gradient-to-br from-gray-300 to-gray-500' :
          rank === 3 ? 'bg-gradient-to-br from-orange-400 to-orange-600' :
          'bg-gradient-to-br from-blue-400 to-blue-600'
        }`}>
          <span className="text-lg">{rank}</span>
        </div>

        {business.avatar_url ? (
          <img
            src={business.avatar_url}
            alt={business.name}
            className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-md"
          />
        ) : (
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-200 to-blue-300 flex items-center justify-center border-2 border-white shadow-md">
            <Building2 className="w-7 h-7 text-blue-600" />
          </div>
        )}
      </div>

      <h3 className="font-bold text-gray-900 text-lg mb-2 truncate">{business.name}</h3>
      <p className="text-sm text-gray-600 mb-4 flex items-center gap-1">
        <MapPin className="w-4 h-4" />
        <span className="truncate">{business.city}, {business.province}</span>
      </p>

      <div className="space-y-2">
        <div className="flex items-center justify-between bg-blue-50 rounded-lg px-3 py-2">
          <span className="text-sm text-gray-700 font-medium">Recensioni</span>
          <span className="font-bold text-blue-600 text-lg">{business.review_count}</span>
        </div>
        <div className="flex items-center justify-between bg-yellow-50 rounded-lg px-3 py-2">
          <span className="text-sm text-gray-700 font-medium">Valutazione</span>
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
            <span className="font-bold text-yellow-600">{business.avg_rating?.toFixed(1) || 'N/A'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function JobSeekerCard({ seeker, onClick }: { seeker: any; onClick: () => void }) {
  const displayName = seeker.profiles?.nickname || seeker.profiles?.full_name || 'Utente';

  return (
    <div
      onClick={onClick}
      className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all p-6 cursor-pointer border-2 border-blue-100 hover:border-blue-300 transform hover:-translate-y-1"
    >
      <div className="flex items-start gap-4 mb-4">
        {seeker.profiles?.avatar_url ? (
          <img
            src={seeker.profiles.avatar_url}
            alt={displayName}
            className="w-16 h-16 rounded-full object-cover border-2 border-blue-200"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center border-2 border-blue-200">
            <Users className="w-8 h-8 text-blue-600" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-lg text-gray-900 line-clamp-1 group-hover:text-blue-600 transition-colors mb-1">
            {seeker.title}
          </h3>
          <p className="text-sm text-gray-600 font-medium line-clamp-1">
            {displayName}
          </p>
        </div>
      </div>

      <p className="text-sm text-gray-600 line-clamp-2 mb-4">
        {seeker.description}
      </p>

      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
          <MapPin className="w-4 h-4 text-blue-500 flex-shrink-0" />
          <span className="line-clamp-1">{seeker.city || seeker.location}</span>
        </div>

        {seeker.desired_salary_min && (
          <div className="flex items-center gap-2 text-sm bg-gradient-to-r from-green-50 to-emerald-50 px-3 py-2 rounded-lg border border-green-200">
            <Euro className="w-4 h-4 text-green-600" />
            <span className="font-bold text-green-700">
              {seeker.desired_salary_min.toLocaleString()}
              {seeker.desired_salary_max && ` - ${seeker.desired_salary_max.toLocaleString()}`} €
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span className="px-3 py-1 bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 text-xs font-semibold rounded-full">
          {seeker.contract_type}
        </span>
        {seeker.experience_years > 0 && (
          <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
            {seeker.experience_years} {seeker.experience_years === 1 ? 'anno' : 'anni'}
          </span>
        )}
        {seeker.category?.name && (
          <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
            {seeker.category.name}
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
      className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all cursor-pointer overflow-hidden border-2 border-green-100 hover:border-green-300 transform hover:-translate-y-1"
    >
      <div className="relative overflow-hidden">
        {ad.images?.[0] ? (
          <img
            src={ad.images[0]}
            alt={ad.title}
            className="w-full h-40 object-cover group-hover:scale-110 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-40 bg-gradient-to-br from-green-100 via-emerald-100 to-green-200 flex items-center justify-center">
            <Tag className="w-12 h-12 text-green-500 group-hover:scale-110 transition-transform" />
          </div>
        )}
        <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-semibold text-gray-700">
          {ad.ad_type === 'gift' ? '🎁 Regalo' : ad.ad_type === 'exchange' ? '🔄 Scambio' : '💰 Vendita'}
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-bold text-sm text-gray-900 line-clamp-2 mb-3 group-hover:text-green-600 transition-colors min-h-[2.5rem]">
          {ad.title}
        </h3>

        {ad.price > 0 ? (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-4 py-2 rounded-xl border border-green-200">
            <p className="text-green-700 font-bold text-center text-lg">{ad.price.toFixed(2)}€</p>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 px-4 py-2 rounded-xl border border-blue-200">
            <p className="text-blue-700 text-sm font-semibold text-center">
              {ad.ad_type === 'gift' ? 'Gratis' : 'Scambio'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
