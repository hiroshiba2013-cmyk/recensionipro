import { Star, TrendingUp, ShieldCheck, Search, Award, Package, Tag, Briefcase, Heart, Users, Building2, Gift } from 'lucide-react';
import { AdvancedSearch } from '../components/search/AdvancedSearch';
import { useAuth } from '../contexts/AuthContext';

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
              Primi 6 mesi gratuiti per tutti! Poi a partire da €0.49/mese per privati e €2.49/mese + IVA per attività.
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
                Scrivi recensioni verificate e accumula punti per scalare la classifica!
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
            <h3 className="text-3xl font-bold mb-4">Per i Cittadini</h3>
            <div className="mb-4">
              <p className="text-2xl font-bold text-yellow-300">A partire da €0.49/mese</p>
              <p className="text-sm text-blue-100">Primi 6 mesi gratuiti</p>
            </div>
            <ul className="space-y-3 text-lg">
              <li className="flex items-start gap-2">
                <span className="text-yellow-300 font-bold text-xl">✓</span>
                <span>Trova attività verificate nella tua zona</span>
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
              <p className="text-sm text-green-100">+ IVA - Primi 6 mesi gratuiti</p>
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
            </ul>
            <button
              onClick={() => window.location.href = '/subscription'}
              className="w-full bg-yellow-400 text-gray-900 px-6 py-3 rounded-lg text-lg font-bold hover:bg-yellow-300 transition-all mt-6"
            >
              Scopri gli Abbonamenti
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
            Primi 6 mesi gratuiti - Nessuna carta di credito richiesta
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
              isLoading={false}
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
