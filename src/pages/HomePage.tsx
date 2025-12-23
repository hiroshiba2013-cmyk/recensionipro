import { Star, TrendingUp, ShieldCheck } from 'lucide-react';
import { AdvancedSearch } from '../components/search/AdvancedSearch';

export function HomePage() {

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
