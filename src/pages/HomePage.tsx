import { useState, useEffect } from 'react';
import { Star, TrendingUp, ShieldCheck, Search, Award, Package, Tag, Briefcase, Heart, Users, Building2, Gift, MapPin, Clock, Euro, ArrowRight } from 'lucide-react';
import { AdvancedSearch } from '../components/search/AdvancedSearch';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useNavigate } from '../components/Router';

export function HomePage() {
  const { user } = useAuth();

  if (!user) {
    return <LandingPage />;
  }

  return <AuthenticatedHomePage />;
}

function LandingPage() {
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
              La piattaforma italiana che connette cittadini e attività locali.
              Recensioni verificate, prodotti, annunci, lavoro e solidarietà in un unico posto.
            </p>
            <p className="text-lg text-blue-200 mb-8 max-w-2xl mx-auto">
              Tre mesi di prova gratuiti per tutti! Poi a partire da €0.49/mese per privati e €2.49/mese + IVA per attività.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => window.location.href = '/?register=user'}
                className="bg-yellow-400 text-gray-900 px-8 py-4 rounded-lg text-lg font-bold hover:bg-yellow-300 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Inizia Gratis
              </button>
              <button
                onClick={() => window.location.href = '/subscription'}
                className="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-bold hover:bg-gray-100 transition-all shadow-lg"
              >
                Vedi i Piani
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Cosa puoi fare con Trovafacile
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Una piattaforma completa per tutte le tue esigenze quotidiane
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <FeatureCard
            icon={<Search className="w-12 h-12 text-blue-600" />}
            title="Cerca Attività"
            description="Trova facilmente attività commerciali nella tua zona. Cerca per categoria, città o nome e scopri i migliori servizi vicino a te."
            gradient="from-blue-50 to-blue-100"
          />
          <FeatureCard
            icon={<Star className="w-12 h-12 text-yellow-500" />}
            title="Recensioni Verificate"
            description="Leggi e scrivi recensioni autentiche. Solo utenti verificati possono lasciare feedback, garantendo massima trasparenza e affidabilità."
            gradient="from-yellow-50 to-yellow-100"
          />
          <FeatureCard
            icon={<Award className="w-12 h-12 text-purple-600" />}
            title="Vinci Premi"
            description="Scrivi recensioni e accumula punti! I migliori 20 utenti dell'anno vincono gift card ricaricabili. Più recensioni scrivi, più premi vinci!"
            gradient="from-purple-50 to-purple-100"
          />
          <FeatureCard
            icon={<Package className="w-12 h-12 text-green-600" />}
            title="Prodotti Locali"
            description="Scopri i prodotti delle attività locali. Confronta prezzi, leggi recensioni e trova esattamente quello che cerchi nel tuo territorio."
            gradient="from-green-50 to-green-100"
          />
          <FeatureCard
            icon={<Tag className="w-12 h-12 text-orange-600" />}
            title="Annunci Gratuiti"
            description="Pubblica e cerca annunci di compravendita, scambio o donazione. Connettiti con altri utenti e scambia oggetti nella tua comunità."
            gradient="from-orange-50 to-orange-100"
          />
          <FeatureCard
            icon={<Briefcase className="w-12 h-12 text-indigo-600" />}
            title="Offerte di Lavoro"
            description="Cerca lavoro o pubblica annunci. Le attività possono trovare candidati qualificati e i lavoratori possono scoprire opportunità locali."
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
                Classifica Utenti con Premi Esclusivi
              </h3>
              <p className="text-lg text-gray-700 leading-relaxed">
                Scrivi recensioni (utenti privati) e ricevi recensioni (professionisti) per scalare la classifica!
                I migliori 20 utenti dell'anno riceveranno gift card ricaricabili come premio per il loro contributo.
                Più recensioni scrivi con foto e dettagli, più punti guadagni!
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
                Solidarietà: Il 10% del Fatturato in Beneficenza
              </h3>
              <p className="text-lg text-gray-700 leading-relaxed mb-3">
                Trovafacile dona ogni anno il <span className="font-bold text-green-600">10% del proprio fatturato</span> ad
                associazioni no profit e progetti di beneficenza scelti dal nostro team.
              </p>
              <p className="text-base text-gray-600">
                Tutti i documenti che attestano il fatturato e le donazioni sono pubblicati nella sezione
                Solidarietà per garantire massima trasparenza.
              </p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl shadow-xl p-8 text-white">
            <Users className="w-16 h-16 mb-4" />
            <h3 className="text-3xl font-bold mb-4">Per i Privati</h3>
            <div className="mb-4">
              <p className="text-2xl font-bold text-yellow-300">A partire da €0.49/mese</p>
              <p className="text-sm text-blue-100">Tre mesi di prova gratuiti</p>
            </div>
            <ul className="space-y-3 text-lg">
              <li className="flex items-start gap-2">
                <span className="text-yellow-300 font-bold text-xl">✓</span>
                <span>Trova attività verificate nella tua zona</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-300 font-bold text-xl">✓</span>
                <span>Trova prodotti di ogni genere</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-300 font-bold text-xl">✓</span>
                <span>Scrivi recensioni e vinci premi</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-300 font-bold text-xl">✓</span>
                <span>Accedi a sconti esclusivi delle attività</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-300 font-bold text-xl">✓</span>
                <span>Pubblica annunci gratuiti</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-300 font-bold text-xl">✓</span>
                <span>Cerca offerte di lavoro locali</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-300 font-bold text-xl">✓</span>
                <span>Il 10% andrà in beneficenza</span>
              </li>
            </ul>
            <button
              onClick={() => window.location.href = '/?register=user'}
              className="w-full bg-yellow-400 text-gray-900 px-6 py-3 rounded-lg text-lg font-bold hover:bg-yellow-300 transition-all mt-6"
            >
              Inizia Ora
            </button>
          </div>

          <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-2xl shadow-xl p-8 text-white">
            <Building2 className="w-16 h-16 mb-4" />
            <h3 className="text-3xl font-bold mb-4">Per le Attività</h3>
            <div className="mb-4">
              <p className="text-2xl font-bold text-yellow-300">A partire da €2.49/mese</p>
              <p className="text-sm text-green-100">+ IVA - Tre mesi di prova gratuiti</p>
            </div>
            <ul className="space-y-3 text-lg">
              <li className="flex items-start gap-2">
                <span className="text-yellow-300 font-bold text-xl">✓</span>
                <span>Aumenta la visibilità della tua attività</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-300 font-bold text-xl">✓</span>
                <span>Gestisci sedi, orari e informazioni</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-300 font-bold text-xl">✓</span>
                <span>Pubblica prodotti e offerte speciali</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-300 font-bold text-xl">✓</span>
                <span>Crea annunci di lavoro</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-300 font-bold text-xl">✓</span>
                <span>Ricevi e rispondi alle recensioni</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-300 font-bold text-xl">✓</span>
                <span>Il 10% andrà in beneficenza</span>
              </li>
            </ul>
            <button
              onClick={() => window.location.href = '/?register=business'}
              className="w-full bg-yellow-400 text-gray-900 px-6 py-3 rounded-lg text-lg font-bold hover:bg-yellow-300 transition-all mt-6"
            >
              Inizia Ora
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
            Tre mesi di prova gratuiti - Nessuna carta di credito richiesta
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
  const navigate = useNavigate();
  const [jobPostings, setJobPostings] = useState<any[]>([]);
  const [classifiedAds, setClassifiedAds] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [topBusinesses, setTopBusinesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHomeData();
  }, []);

  const loadHomeData = async () => {
    try {
      setLoading(true);

      const [jobsResult, adsResult, productsResult, businessesResult] = await Promise.all([
        supabase
          .from('job_postings')
          .select(`
            *,
            business:business_id(
              name,
              business_locations(city, province)
            ),
            category:category_id(name)
          `)
          .eq('status', 'open')
          .order('created_at', { ascending: false })
          .limit(3),

        supabase
          .from('classified_ads')
          .select(`
            *,
            profiles:user_id(full_name)
          `)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(6),

        supabase
          .from('products')
          .select(`
            *,
            business:business_id(name),
            business_location:location_id(city, province)
          `)
          .eq('is_available', true)
          .order('created_at', { ascending: false })
          .limit(6),

        supabase
          .from('businesses')
          .select(`
            id,
            name,
            business_locations(city, province, address),
            business_categories(name)
          `)
          .limit(4)
      ]);

      if (jobsResult.data) setJobPostings(jobsResult.data);
      if (adsResult.data) setClassifiedAds(adsResult.data);
      if (productsResult.data) setProducts(productsResult.data);
      if (businessesResult.data) setTopBusinesses(businessesResult.data);
    } catch (error) {
      console.error('Error loading home data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-extrabold mb-6 leading-tight tracking-tight">
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
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          <QuickActionCard
            icon={<Search className="w-8 h-8" />}
            title="Cerca Attività"
            description="Trova negozi e servizi"
            color="from-blue-500 to-blue-600"
            onClick={() => navigate('/search')}
          />
          <QuickActionCard
            icon={<Briefcase className="w-8 h-8" />}
            title="Offerte Lavoro"
            description="Scopri opportunità"
            color="from-green-500 to-green-600"
            onClick={() => navigate('/jobs')}
          />
          <QuickActionCard
            icon={<Tag className="w-8 h-8" />}
            title="Annunci"
            description="Compra e vendi"
            color="from-orange-500 to-orange-600"
            onClick={() => navigate('/classified-ads')}
          />
          <QuickActionCard
            icon={<Package className="w-8 h-8" />}
            title="Prodotti"
            description="Sfoglia il catalogo"
            color="from-purple-500 to-purple-600"
            onClick={() => navigate('/products')}
          />
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
          </div>
        ) : (
          <>
            {jobPostings.length > 0 && (
              <section className="mb-12">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="bg-green-100 p-3 rounded-lg">
                      <Briefcase className="w-6 h-6 text-green-600" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900">Ultime Offerte di Lavoro</h2>
                  </div>
                  <button
                    onClick={() => navigate('/jobs')}
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold"
                  >
                    Vedi tutte <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid md:grid-cols-3 gap-6">
                  {jobPostings.map((job) => (
                    <JobCard key={job.id} job={job} onClick={() => navigate('/jobs')} />
                  ))}
                </div>
              </section>
            )}

            {classifiedAds.length > 0 && (
              <section className="mb-12">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="bg-orange-100 p-3 rounded-lg">
                      <Tag className="w-6 h-6 text-orange-600" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900">Ultimi Annunci</h2>
                  </div>
                  <button
                    onClick={() => navigate('/classified-ads')}
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold"
                  >
                    Vedi tutti <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {classifiedAds.map((ad) => (
                    <ClassifiedAdCard key={ad.id} ad={ad} onClick={() => navigate(`/classified-ads/${ad.id}`)} />
                  ))}
                </div>
              </section>
            )}

            {products.length > 0 && (
              <section className="mb-12">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="bg-purple-100 p-3 rounded-lg">
                      <Package className="w-6 h-6 text-purple-600" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900">Nuovi Prodotti</h2>
                  </div>
                  <button
                    onClick={() => navigate('/products')}
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold"
                  >
                    Vedi tutti <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} onClick={() => navigate(`/products/${product.id}`)} />
                  ))}
                </div>
              </section>
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

function JobCard({ job, onClick }: { job: any; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all p-6 cursor-pointer border border-gray-200"
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-bold text-lg text-gray-900 line-clamp-2">{job.title}</h3>
      </div>
      <p className="text-sm text-gray-600 mb-3">{job.business?.name}</p>
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
        <MapPin className="w-4 h-4" />
        <span>{job.business?.business_locations?.[0]?.city}</span>
      </div>
      {job.salary_range && (
        <div className="flex items-center gap-2 text-sm text-green-600 font-semibold">
          <Euro className="w-4 h-4" />
          <span>{job.salary_range}</span>
        </div>
      )}
    </div>
  );
}

function ClassifiedAdCard({ ad, onClick }: { ad: any; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden border border-gray-200"
    >
      {ad.images?.[0] ? (
        <img
          src={ad.images[0]}
          alt={ad.title}
          className="w-full h-32 object-cover"
        />
      ) : (
        <div className="w-full h-32 bg-gray-200 flex items-center justify-center">
          <Tag className="w-8 h-8 text-gray-400" />
        </div>
      )}
      <div className="p-3">
        <h3 className="font-semibold text-sm text-gray-900 line-clamp-2 mb-2">{ad.title}</h3>
        {ad.price > 0 ? (
          <p className="text-green-600 font-bold">€{ad.price.toFixed(2)}</p>
        ) : (
          <p className="text-gray-500 text-sm">
            {ad.ad_type === 'gift' ? 'Regalo' : ad.ad_type === 'exchange' ? 'Scambio' : 'Vendita'}
          </p>
        )}
      </div>
    </div>
  );
}

function ProductCard({ product, onClick }: { product: any; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden border border-gray-200"
    >
      {product.images?.[0] ? (
        <img
          src={product.images[0]}
          alt={product.name}
          className="w-full h-32 object-cover"
        />
      ) : (
        <div className="w-full h-32 bg-gray-200 flex items-center justify-center">
          <Package className="w-8 h-8 text-gray-400" />
        </div>
      )}
      <div className="p-3">
        <h3 className="font-semibold text-sm text-gray-900 line-clamp-2 mb-2">{product.name}</h3>
        <p className="text-green-600 font-bold">€{product.price.toFixed(2)}</p>
        <p className="text-xs text-gray-500 mt-1 line-clamp-1">{product.business?.name}</p>
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
