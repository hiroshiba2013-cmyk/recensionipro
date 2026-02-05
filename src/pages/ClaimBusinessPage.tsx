import { useState } from 'react';
import { Search, Building2, MapPin, CheckCircle, XCircle, ArrowRight, Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface LocationResult {
  id: string;
  business_id: string;
  name: string | null;
  street: string | null;
  city: string;
  province: string;
  phone: string | null;
  email: string | null;
  is_claimed: boolean;
  category_id: string | null;
  region: string | null;
  website: string | null;
}

interface GroupedBusiness {
  business_id: string;
  business_name: string;
  locations: LocationResult[];
  total_locations: number;
  unclaimed_count: number;
}

export function ClaimBusinessPage() {
  const [formData, setFormData] = useState({
    businessName: '',
    address: '',
    city: '',
    province: ''
  });
  const [groupedResults, setGroupedResults] = useState<GroupedBusiness[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<Set<string>>(new Set());
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.businessName && !formData.address && !formData.city) {
      alert('Inserisci almeno un campo per effettuare la ricerca');
      return;
    }

    setLoading(true);
    setSearched(true);
    setSelectedLocations(new Set());

    try {
      let unclaimedQuery = supabase
        .from('unclaimed_business_locations')
        .select(`
          id,
          business_id,
          name,
          street,
          city,
          province,
          region,
          phone,
          email,
          website,
          is_claimed,
          category_id
        `)
        .limit(200);

      let claimedQuery = supabase
        .from('business_locations')
        .select(`
          id,
          business_id,
          name,
          address,
          city,
          province,
          region,
          phone,
          email,
          website,
          is_claimed,
          business:businesses(name)
        `)
        .limit(200);

      if (formData.businessName && formData.businessName.trim()) {
        unclaimedQuery = unclaimedQuery.ilike('name', `%${formData.businessName.trim()}%`);
        claimedQuery = claimedQuery.ilike('name', `%${formData.businessName.trim()}%`);
      }

      if (formData.city && formData.city.trim()) {
        unclaimedQuery = unclaimedQuery.ilike('city', `%${formData.city.trim()}%`);
        claimedQuery = claimedQuery.ilike('city', `%${formData.city.trim()}%`);
      }

      if (formData.province && formData.province.trim()) {
        unclaimedQuery = unclaimedQuery.ilike('province', `%${formData.province.trim()}%`);
        claimedQuery = claimedQuery.ilike('province', `%${formData.province.trim()}%`);
      }

      if (formData.address && formData.address.trim()) {
        unclaimedQuery = unclaimedQuery.ilike('street', `%${formData.address.trim()}%`);
        claimedQuery = claimedQuery.ilike('address', `%${formData.address.trim()}%`);
      }

      const [unclaimedResult, claimedResult] = await Promise.all([
        unclaimedQuery,
        claimedQuery
      ]);

      if (unclaimedResult.error) throw unclaimedResult.error;
      if (claimedResult.error) throw claimedResult.error;

      const allLocations: LocationResult[] = [
        ...(unclaimedResult.data || []).map(loc => ({
          ...loc,
          street: loc.street
        })),
        ...(claimedResult.data || []).map(loc => ({
          ...loc,
          street: loc.address,
          name: loc.name || (loc.business as any)?.name,
          category_id: null
        }))
      ];

      const businessMap = new Map<string, GroupedBusiness>();

      allLocations.forEach(location => {
        const businessName = location.name || 'Attività senza nome';
        const key = `${location.business_id}_${businessName}`;

        if (!businessMap.has(key)) {
          businessMap.set(key, {
            business_id: location.business_id,
            business_name: businessName,
            locations: [],
            total_locations: 0,
            unclaimed_count: 0
          });
        }

        const group = businessMap.get(key)!;
        group.locations.push(location);
        group.total_locations++;
        if (!location.is_claimed) {
          group.unclaimed_count++;
        }
      });

      const grouped = Array.from(businessMap.values())
        .sort((a, b) => b.unclaimed_count - a.unclaimed_count || a.business_name.localeCompare(b.business_name));

      console.log('Search results:', grouped.length, 'businesses found with', allLocations.length, 'total locations');
      setGroupedResults(grouped);
    } catch (error: any) {
      console.error('Error searching businesses:', error);
      alert(`Errore durante la ricerca: ${error.message || 'Errore sconosciuto'}`);
    } finally {
      setLoading(false);
    }
  };

  const toggleLocationSelection = (locationId: string, isClaimed: boolean) => {
    if (isClaimed) return;

    const newSelection = new Set(selectedLocations);
    if (newSelection.has(locationId)) {
      newSelection.delete(locationId);
    } else {
      newSelection.add(locationId);
    }
    setSelectedLocations(newSelection);
  };

  const handleProceedWithSelection = (business: GroupedBusiness) => {
    if (selectedLocations.size === 0) {
      alert('Seleziona almeno una sede da rivendicare');
      return;
    }

    sessionStorage.setItem('claimLocationIds', JSON.stringify(Array.from(selectedLocations)));
    sessionStorage.setItem('claimBusinessName', business.business_name);
    sessionStorage.setItem('claimBusinessId', business.business_id);
    window.location.href = '/?register=business';
  };

  const handleRegisterNew = () => {
    sessionStorage.removeItem('claimLocationIds');
    sessionStorage.removeItem('claimBusinessId');
    sessionStorage.removeItem('claimBusinessName');
    window.location.href = '/?register=business';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <Building2 className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Verifica la Tua Attività
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Cerca la tua attività per nome, città o indirizzo. Se è già nel nostro database, puoi rivendicarla per gestirla
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
          <form onSubmit={handleSearch} className="space-y-6">
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

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Provincia
                </label>
                <input
                  type="text"
                  value={formData.province}
                  onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  placeholder="es. MI"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Indirizzo
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                placeholder="es. Via Roma"
              />
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
            {groupedResults.length === 0 ? (
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
                  onClick={handleRegisterNew}
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
                    {groupedResults.length} {groupedResults.length === 1 ? 'Attività Trovata' : 'Attività Trovate'}
                  </h3>
                  <p className="text-gray-600 mt-2">
                    Seleziona le sedi che vuoi rivendicare per la tua attività
                  </p>
                </div>

                <div className="grid gap-8">
                  {groupedResults.map((business) => {
                    const selectedCount = business.locations.filter(loc => selectedLocations.has(loc.id)).length;

                    return (
                      <div
                        key={`${business.business_id}_${business.business_name}`}
                        className="bg-white rounded-xl shadow-sm overflow-hidden border-2 border-blue-200"
                      >
                        <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 border-b-2 border-blue-200">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-400 rounded-lg flex items-center justify-center">
                                <Building2 className="w-8 h-8 text-white" />
                              </div>
                              <div>
                                <h4 className="text-2xl font-bold text-gray-900">
                                  {business.business_name}
                                </h4>
                                <p className="text-gray-600 mt-1">
                                  {business.total_locations} {business.total_locations === 1 ? 'sede' : 'sedi'} totali • {' '}
                                  {business.unclaimed_count} disponibili da rivendicare
                                </p>
                              </div>
                            </div>
                            {selectedCount > 0 && (
                              <div className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold">
                                {selectedCount} {selectedCount === 1 ? 'selezionata' : 'selezionate'}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="p-6 space-y-4">
                          {business.locations.map((location) => (
                            <div
                              key={location.id}
                              onClick={() => toggleLocationSelection(location.id, location.is_claimed)}
                              className={`p-4 rounded-lg border-2 transition-all ${
                                location.is_claimed
                                  ? 'border-gray-200 bg-gray-50 opacity-60'
                                  : selectedLocations.has(location.id)
                                  ? 'border-blue-500 bg-blue-50 cursor-pointer'
                                  : 'border-gray-300 hover:border-blue-300 cursor-pointer hover:bg-gray-50'
                              }`}
                            >
                              <div className="flex items-start gap-4">
                                <div className="flex-shrink-0 pt-1">
                                  <input
                                    type="checkbox"
                                    checked={selectedLocations.has(location.id)}
                                    disabled={location.is_claimed}
                                    onChange={() => {}}
                                    className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                  />
                                </div>

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-4 mb-2">
                                    <div className="flex items-center gap-2">
                                      <MapPin className="w-5 h-5 text-blue-600 flex-shrink-0" />
                                      <span className="font-semibold text-gray-900">
                                        {location.city} ({location.province})
                                      </span>
                                    </div>
                                    {location.is_claimed ? (
                                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-200 text-gray-700 rounded-lg text-sm font-semibold">
                                        <CheckCircle className="w-4 h-4" />
                                        Già Rivendicata
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm font-semibold">
                                        Disponibile
                                      </span>
                                    )}
                                  </div>

                                  <div className="space-y-1 text-sm text-gray-600">
                                    {location.street && (
                                      <div>{location.street}</div>
                                    )}
                                    {location.region && (
                                      <div className="text-gray-500">Regione: {location.region}</div>
                                    )}
                                    {location.phone && (
                                      <div><span className="font-semibold">Tel:</span> {location.phone}</div>
                                    )}
                                    {location.email && (
                                      <div><span className="font-semibold">Email:</span> {location.email}</div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {business.unclaimed_count > 0 && (
                          <div className="p-6 bg-gray-50 border-t-2 border-gray-200">
                            <button
                              onClick={() => handleProceedWithSelection(business)}
                              disabled={selectedCount === 0}
                              className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-4 rounded-lg hover:bg-blue-700 transition-colors font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {selectedCount > 0 ? (
                                <>
                                  Rivendica {selectedCount} {selectedCount === 1 ? 'sede' : 'sedi'} e Registrati
                                  <ArrowRight className="w-5 h-5" />
                                </>
                              ) : (
                                <>
                                  Seleziona almeno una sede per continuare
                                </>
                              )}
                            </button>
                            <p className="text-center text-sm text-gray-600 mt-3">
                              Dopo la registrazione potrai aggiungere altre sedi
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="mt-8 bg-blue-50 rounded-xl p-6 border-2 border-blue-200">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <Plus className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 mb-2">
                        Non vedi tutte le tue sedi?
                      </h3>
                      <p className="text-gray-700 mb-4">
                        Seleziona le sedi esistenti e dopo la registrazione potrai aggiungere le sedi mancanti tramite il pannello di gestione.
                      </p>
                      <button
                        onClick={handleRegisterNew}
                        className="inline-flex items-center gap-2 bg-white text-blue-600 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors font-semibold border-2 border-blue-200"
                      >
                        <Plus className="w-5 h-5" />
                        Oppure Registra Nuova Attività
                      </button>
                    </div>
                  </div>
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
