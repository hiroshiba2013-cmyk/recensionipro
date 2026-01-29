import { useState } from 'react';
import { Search, Building2, MapPin, CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Header } from '../components/layout/Header';
import { useNavigate } from '../components/Router';

interface BusinessResult {
  id: string;
  business_id: string;
  name: string | null;
  address: string;
  city: string;
  province: string;
  phone: string | null;
  email: string | null;
  vat_number: string | null;
  is_claimed: boolean;
  avatar_url: string | null;
  business?: {
    name: string;
    category_id: string;
  };
}

export function ClaimBusinessPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    businessName: '',
    vatNumber: '',
    address: '',
    city: ''
  });
  const [results, setResults] = useState<BusinessResult[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.businessName && !formData.vatNumber && !formData.address) {
      alert('Inserisci almeno un campo per effettuare la ricerca');
      return;
    }

    setLoading(true);
    setSearched(true);

    try {
      let query = supabase
        .from('business_locations')
        .select(`
          id,
          business_id,
          name,
          address,
          city,
          province,
          phone,
          email,
          vat_number,
          is_claimed,
          avatar_url,
          businesses(
            name,
            category_id
          )
        `)
        .limit(20);

      // Ricerca per P.IVA (prioritaria)
      if (formData.vatNumber) {
        query = query.ilike('vat_number', `%${formData.vatNumber.replace(/\s/g, '')}%`);
      } else {
        // Ricerca per nome
        if (formData.businessName) {
          query = query.or(`name.ilike.%${formData.businessName}%,businesses.name.ilike.%${formData.businessName}%`);
        }

        // Filtro per città
        if (formData.city) {
          query = query.ilike('city', `%${formData.city}%`);
        }

        // Filtro per indirizzo
        if (formData.address) {
          query = query.ilike('address', `%${formData.address}%`);
        }
      }

      const { data, error } = await query;

      if (error) throw error;

      setResults(data || []);
    } catch (error) {
      console.error('Error searching businesses:', error);
      alert('Errore durante la ricerca');
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = (businessId: string) => {
    sessionStorage.setItem('claimBusinessId', businessId);
    window.location.href = '/?register=business';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <Building2 className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Verifica la Tua Attività
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Controlla se la tua attività è già presente nel nostro database e rivendicala per gestirla
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
          <form onSubmit={handleSearch} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Partita IVA
              </label>
              <input
                type="text"
                value={formData.vatNumber}
                onChange={(e) => setFormData({ ...formData, vatNumber: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                placeholder="es. 12345678901"
              />
              <p className="mt-2 text-sm text-gray-500">
                La ricerca per P.IVA è il metodo più preciso
              </p>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">oppure</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nome Attività
              </label>
              <input
                type="text"
                value={formData.businessName}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                placeholder="es. Bar Centrale"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Indirizzo
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  placeholder="es. Via Roma 1"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Città
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  placeholder="es. Milano"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-4 rounded-lg hover:bg-blue-700 transition-colors font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Ricerca in corso...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  Cerca Attività
                </>
              )}
            </button>
          </form>
        </div>

        {searched && !loading && (
          <div className="space-y-6">
            {results.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-4">
                  <XCircle className="w-8 h-8 text-orange-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Nessuna Attività Trovata
                </h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  Non abbiamo trovato la tua attività nel database. Registrati per aggiungerla!
                </p>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                >
                  Registrati e Aggiungi Attività
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <>
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900">
                    {results.length} {results.length === 1 ? 'Attività Trovata' : 'Attività Trovate'}
                  </h3>
                  <p className="text-gray-600 mt-2">
                    Clicca su "Rivendica" per gestire la tua attività
                  </p>
                </div>

                <div className="grid gap-6">
                  {results.map((business) => (
                    <div
                      key={business.id}
                      className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200"
                    >
                      <div className="p-6">
                        <div className="flex items-start gap-6">
                          <div className="flex-shrink-0">
                            {business.avatar_url ? (
                              <img
                                src={business.avatar_url}
                                alt={business.name || business.business?.name}
                                className="w-24 h-24 rounded-lg object-cover"
                              />
                            ) : (
                              <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-blue-50 rounded-lg flex items-center justify-center">
                                <Building2 className="w-12 h-12 text-blue-600" />
                              </div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4 mb-3">
                              <div>
                                <h4 className="text-xl font-bold text-gray-900">
                                  {business.name || business.business?.name || 'Attività'}
                                </h4>
                                {business.name && business.business?.name && (
                                  <p className="text-sm text-gray-600 mt-1">
                                    {business.business.name}
                                  </p>
                                )}
                              </div>

                              {business.is_claimed ? (
                                <span className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold">
                                  <CheckCircle className="w-5 h-5" />
                                  Già Rivendicata
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg font-semibold">
                                  <CheckCircle className="w-5 h-5" />
                                  Disponibile
                                </span>
                              )}
                            </div>

                            <div className="space-y-2 mb-4">
                              <div className="flex items-start gap-2 text-gray-700">
                                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-600" />
                                <span className="text-sm">
                                  {business.address}, {business.city} ({business.province})
                                </span>
                              </div>

                              {business.vat_number && (
                                <div className="text-sm text-gray-600">
                                  <span className="font-semibold">P.IVA:</span> {business.vat_number}
                                </div>
                              )}

                              {business.phone && (
                                <div className="text-sm text-gray-600">
                                  <span className="font-semibold">Tel:</span> {business.phone}
                                </div>
                              )}

                              {business.email && (
                                <div className="text-sm text-gray-600">
                                  <span className="font-semibold">Email:</span> {business.email}
                                </div>
                              )}
                            </div>

                            {!business.is_claimed ? (
                              <button
                                onClick={() => handleClaim(business.business_id)}
                                className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                              >
                                <Building2 className="w-5 h-5" />
                                Rivendica questa Attività
                              </button>
                            ) : (
                              <p className="text-gray-600 italic">
                                Questa attività è già stata rivendicata. Se pensi si tratti di un errore, contattaci.
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        <div className="mt-12 bg-blue-50 rounded-xl p-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4">
            Perché Rivendicare la Tua Attività?
          </h3>
          <ul className="space-y-3 text-gray-700">
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <span>Gestisci le informazioni della tua attività</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <span>Rispondi alle recensioni dei clienti</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <span>Pubblica offerte di lavoro</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <span>Crea promozioni e sconti esclusivi</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <span>Ottieni il badge di verifica</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
