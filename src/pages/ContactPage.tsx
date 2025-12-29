import { Mail, Phone, MapPin, Clock } from 'lucide-react';

export function ContactPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Contattaci
          </h1>
          <p className="text-xl text-gray-600">
            Siamo qui per aiutarti. Inviaci un messaggio e ti risponderemo il prima possibile.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Informazioni di Contatto</h2>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Mail className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Email</h3>
                  <p className="text-gray-600">info@trovafacile.it</p>
                  <p className="text-gray-600">supporto@trovafacile.it</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Phone className="w-6 h-6 text-green-600" />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Telefono</h3>
                  <p className="text-gray-600">+39 02 1234 5678</p>
                  <p className="text-sm text-gray-500">Lun-Ven: 9:00 - 18:00</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Sede</h3>
                  <p className="text-gray-600">Via Roma, 123</p>
                  <p className="text-gray-600">20100 Milano, Italia</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Orari di Apertura</h3>
                  <p className="text-gray-600">Lunedì - Venerdì: 9:00 - 18:00</p>
                  <p className="text-gray-600">Sabato: 9:00 - 13:00</p>
                  <p className="text-gray-600">Domenica: Chiuso</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Inviaci un Messaggio</h2>

            <form className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Nome Completo
                </label>
                <input
                  type="text"
                  id="name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Mario Rossi"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="mario.rossi@email.com"
                />
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                  Oggetto
                </label>
                <input
                  type="text"
                  id="subject"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Come possiamo aiutarti?"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                  Messaggio
                </label>
                <textarea
                  id="message"
                  rows={5}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Scrivi il tuo messaggio qui..."
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              >
                Invia Messaggio
              </button>
            </form>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-green-50 border-2 border-blue-200 rounded-xl shadow-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Domande Frequenti
          </h2>
          <p className="text-gray-700 mb-6">
            Prima di contattarci, dai un'occhiata alle nostre FAQ per trovare risposte immediate alle domande più comuni.
          </p>
          <button className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold">
            Vai alle FAQ
          </button>
        </div>
      </div>
    </div>
  );
}
