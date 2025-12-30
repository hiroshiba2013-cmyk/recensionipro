import { Package, Settings, Clock } from 'lucide-react';

export function ProductsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-4">
            <Package className="w-10 h-10" />
            <h1 className="text-5xl font-bold">Catalogo Prodotti</h1>
          </div>
          <p className="text-blue-100 text-lg">
            In arrivo: oltre 300.000 prodotti di ogni genere
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
          <div className="mb-8 relative">
            <div className="absolute inset-0 flex items-center justify-center opacity-10">
              <Settings className="w-64 h-64 text-blue-600 animate-pulse" />
            </div>
            <div className="relative">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full mb-6">
                <Settings className="w-12 h-12 text-blue-600 animate-spin" style={{ animationDuration: '3s' }} />
              </div>
            </div>
          </div>

          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Sezione in Allestimento
          </h2>

          <div className="max-w-2xl mx-auto space-y-4 mb-8">
            <p className="text-xl text-gray-700 leading-relaxed">
              Stiamo lavorando per portarti il <span className="font-semibold text-blue-600">catalogo prodotti più completo d'Italia</span>
            </p>
            <p className="text-lg text-gray-600">
              Il nostro team sta preparando un'esperienza di shopping eccezionale con centinaia di migliaia di prodotti selezionati,
              dalle migliori marche ai piccoli artigiani locali.
            </p>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-8 mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Clock className="w-6 h-6 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Cosa puoi aspettarti:</h3>
            </div>
            <ul className="space-y-3 text-left max-w-md mx-auto">
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
                <span className="text-gray-700 pt-0.5">Oltre <strong>300.000 prodotti</strong> in tutte le categorie</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
                <span className="text-gray-700 pt-0.5">Sistema di <strong>recensioni verificate</strong> e affidabili</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
                <span className="text-gray-700 pt-0.5">Filtri avanzati per <strong>trovare esattamente</strong> ciò che cerchi</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">4</span>
                <span className="text-gray-700 pt-0.5">Supporto ai <strong>produttori locali</strong> e alle piccole imprese</span>
              </li>
            </ul>
          </div>

          <div className="border-t border-gray-200 pt-8">
            <p className="text-gray-600 mb-4">
              Nel frattempo, esplora le altre sezioni della piattaforma:
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <a
                href="/"
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow-md"
              >
                Cerca Attività
              </a>
              <a
                href="/classified-ads"
                className="px-6 py-3 bg-white text-gray-700 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
              >
                Annunci
              </a>
              <a
                href="/jobs"
                className="px-6 py-3 bg-white text-gray-700 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
              >
                Offerte di Lavoro
              </a>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Hai suggerimenti o vuoi essere informato quando il catalogo sarà disponibile?
            </p>
            <a
              href="/contact"
              className="inline-block mt-3 text-blue-600 hover:text-blue-700 font-medium"
            >
              Contattaci →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
