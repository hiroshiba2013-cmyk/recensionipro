import { useState, useEffect } from 'react';
import { Percent, Calendar, Tag as TagIcon, Store, MapPin, Clock, Search, Filter, CheckCircle2, Ticket, X, Copy } from 'lucide-react';
import { supabase, BusinessCategory } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ITALIAN_REGIONS, PROVINCES_BY_REGION, PROVINCE_TO_CODE } from '../lib/cities';

interface Discount {
  id: string;
  business_id: string;
  title: string;
  description: string;
  discount_percentage: number;
  code: string;
  valid_from: string;
  valid_until: string;
  active: boolean;
  created_at: string;
}

interface Business {
  id: string;
  business_name: string;
  category_id: string;
  locations?: {
    city: string;
    province: string;
    region: string;
  }[];
}

interface PendingRedemption {
  redemption_code: string;
  expires_at: string;
}

interface DiscountWithBusiness extends Discount {
  business: Business;
  is_redeemed?: boolean;
  redeemed_at?: string;
  pending_redemption?: PendingRedemption;
}

export function DiscountsPage() {
  const { user } = useAuth();
  const [discounts, setDiscounts] = useState<DiscountWithBusiness[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const [selectedProvince, setSelectedProvince] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [categories, setCategories] = useState<BusinessCategory[]>([]);
  const [provinces, setProvinces] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [redeemedDiscountIds, setRedeemedDiscountIds] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'available' | 'redeemed'>('available');
  const [generatingCode, setGeneratingCode] = useState<string | null>(null);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [generatedRedemption, setGeneratedRedemption] = useState<{
    code: string;
    expiresAt: string;
    discountTitle: string;
    discountPercentage: number;
  } | null>(null);

  useEffect(() => {
    if (user) {
      loadDiscounts();
      loadCategories();
      loadRedemptions();
    }
  }, [user]);

  useEffect(() => {
    if (selectedRegion) {
      setProvinces(PROVINCES_BY_REGION[selectedRegion] || []);
      setSelectedProvince('');
      setSelectedCity('');
      setCities([]);
    } else {
      setProvinces([]);
      setSelectedProvince('');
    }
  }, [selectedRegion]);

  useEffect(() => {
    if (selectedProvince) {
      loadCitiesForProvince();
    } else {
      setCities([]);
      setSelectedCity('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProvince]);

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('business_categories')
        .select('*')
        .order('name');

      if (error) throw error;
      if (data) setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadCitiesForProvince = async () => {
    try {
      const provinceCode = PROVINCE_TO_CODE[selectedProvince];
      if (!provinceCode) return;

      const { data, error } = await supabase
        .from('business_locations')
        .select('city')
        .eq('province', provinceCode)
        .not('city', 'is', null);

      if (error) throw error;

      if (data) {
        const uniqueCities = Array.from(new Set(data.map(d => d.city).filter(Boolean)));
        setCities(uniqueCities.sort());
      }
    } catch (error) {
      console.error('Error loading cities:', error);
    }
  };

  const loadRedemptions = async () => {
    try {
      const { data, error } = await supabase
        .from('discount_redemptions')
        .select('discount_id, redeemed_at, status, redemption_code, expires_at, confirmed_at')
        .eq('customer_id', user?.id);

      if (error) throw error;

      if (data) {
        const redemptionMap = new Map();
        const pendingMap = new Map();

        data.forEach(r => {
          if (r.status === 'confirmed') {
            redemptionMap.set(r.discount_id, r.confirmed_at || r.redeemed_at);
          } else if (r.status === 'pending' && r.expires_at && new Date(r.expires_at) > new Date()) {
            pendingMap.set(r.discount_id, {
              redemption_code: r.redemption_code,
              expires_at: r.expires_at
            });
          }
        });

        setRedeemedDiscountIds(new Set(redemptionMap.keys()));

        setDiscounts(prev => prev.map(d => ({
          ...d,
          is_redeemed: redemptionMap.has(d.id),
          redeemed_at: redemptionMap.get(d.id),
          pending_redemption: pendingMap.get(d.id)
        })));
      }
    } catch (error) {
      console.error('Error loading redemptions:', error);
    }
  };

  const loadDiscounts = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('discounts')
        .select(`
          *,
          business:businesses!inner(
            id,
            business_name,
            category_id,
            locations:business_locations(
              city,
              province,
              region
            )
          )
        `)
        .eq('active', true)
        .gte('valid_until', new Date().toISOString())
        .order('discount_percentage', { ascending: false });

      if (error) throw error;

      const typedData = data as unknown as DiscountWithBusiness[];

      const discountsWithRedemption = typedData.map(d => ({
        ...d,
        is_redeemed: redeemedDiscountIds.has(d.id)
      }));

      setDiscounts(discountsWithRedemption);
    } catch (error) {
      console.error('Error loading discounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateRedemptionCode = async (discount: DiscountWithBusiness) => {
    setGeneratingCode(discount.id);

    try {
      const { data, error } = await supabase.rpc('create_discount_redemption', {
        p_discount_id: discount.id,
        p_customer_id: user?.id
      });

      if (error) throw error;

      if (!data.success) {
        alert(data.error || 'Errore durante la generazione del codice');
        return;
      }

      setGeneratedRedemption({
        code: data.redemption_code,
        expiresAt: data.expires_at,
        discountTitle: discount.title,
        discountPercentage: discount.discount_percentage
      });
      setShowCodeModal(true);

      // Reload redemptions to show the new pending code
      await loadRedemptions();
    } catch (error) {
      console.error('Error generating redemption code:', error);
      alert('Errore durante la generazione del codice');
    } finally {
      setGeneratingCode(null);
    }
  };

  const copyCodeToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    alert('Codice copiato negli appunti!');
  };

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diffMs = expires.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 0) return 'Scaduto';
    if (diffMins < 60) return `Scade tra ${diffMins} minuti`;

    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `Scade tra ${hours}h ${mins}m`;
  };

  const filteredDiscounts = discounts.filter(discount => {
    const matchesTab = activeTab === 'available' ? !discount.is_redeemed : discount.is_redeemed;

    const matchesSearch =
      discount.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      discount.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      discount.business.business_name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = !selectedCategory || discount.business.category_id === selectedCategory;

    let matchesLocation = true;
    if (discount.business.locations && discount.business.locations.length > 0) {
      const locations = discount.business.locations;

      if (selectedCity) {
        matchesLocation = locations.some(loc => loc.city === selectedCity);
      } else if (selectedProvince) {
        const provinceCode = PROVINCE_TO_CODE[selectedProvince];
        matchesLocation = locations.some(loc => loc.province === provinceCode);
      } else if (selectedRegion) {
        matchesLocation = locations.some(loc => loc.region === selectedRegion);
      }
    } else if (selectedRegion || selectedProvince || selectedCity) {
      matchesLocation = false;
    }

    return matchesTab && matchesSearch && matchesCategory && matchesLocation;
  });

  const availableCount = discounts.filter(d => !d.is_redeemed).length;
  const redeemedCount = discounts.filter(d => d.is_redeemed).length;

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category?.name || 'Categoria sconosciuta';
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('it-IT', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const getDaysRemaining = (validUntil: string) => {
    const days = Math.ceil((new Date(validUntil).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Scade oggi';
    if (days === 1) return 'Scade domani';
    return `Scade tra ${days} giorni`;
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
          <Percent className="w-16 h-16 text-orange-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">Accedi per vedere gli sconti</h2>
          <p className="text-gray-600 mb-6">
            Devi effettuare l'accesso per visualizzare gli sconti disponibili dalle attività locali.
          </p>
          <a
            href="/?login=true"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Accedi ora
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Percent className="w-8 h-8 text-orange-500" />
              <h1 className="text-3xl font-bold text-gray-900">Sconti e Offerte</h1>
            </div>
            <p className="text-gray-600">
              Scopri le offerte esclusive delle attività locali
            </p>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setActiveTab('available')}
                className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-colors ${
                  activeTab === 'available'
                    ? 'bg-orange-600 text-white'
                    : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-orange-300'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Percent className="w-5 h-5" />
                  <span>Disponibili</span>
                  <span className="bg-white text-orange-600 px-2 py-1 rounded-full text-sm font-bold">
                    {availableCount}
                  </span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('redeemed')}
                className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-colors ${
                  activeTab === 'redeemed'
                    ? 'bg-green-600 text-white'
                    : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-green-300'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Utilizzati</span>
                  <span className="bg-white text-green-600 px-2 py-1 rounded-full text-sm font-bold">
                    {redeemedCount}
                  </span>
                </div>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-5 h-5 text-gray-600" />
              <h3 className="font-semibold text-gray-900">Filtra Sconti</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Cerca sconti..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="">Tutte le categorie</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>

              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="">Tutte le regioni</option>
                {ITALIAN_REGIONS.map((region) => (
                  <option key={region} value={region}>
                    {region}
                  </option>
                ))}
              </select>

              <select
                value={selectedProvince}
                onChange={(e) => setSelectedProvince(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                disabled={!selectedRegion}
              >
                <option value="">Tutte le province</option>
                {provinces.map((province) => (
                  <option key={province} value={province}>
                    {province}
                  </option>
                ))}
              </select>

              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                disabled={!selectedProvince || cities.length === 0}
              >
                <option value="">Tutte le città</option>
                {cities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>

            {(searchTerm || selectedCategory || selectedRegion || selectedProvince || selectedCity) && (
              <div className="mt-4 flex items-center gap-2">
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('');
                    setSelectedRegion('');
                    setSelectedProvince('');
                    setSelectedCity('');
                  }}
                  className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                >
                  Cancella tutti i filtri
                </button>
              </div>
            )}
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
              <p className="text-gray-600 mt-4">Caricamento sconti...</p>
            </div>
          ) : filteredDiscounts.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow-sm">
              <Percent className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {searchTerm || selectedCategory ? 'Nessuno sconto trovato' : 'Nessuno sconto disponibile'}
              </h3>
              <p className="text-gray-600">
                {searchTerm || selectedCategory
                  ? 'Prova a modificare i filtri di ricerca'
                  : 'Al momento non ci sono sconti attivi. Torna presto per nuove offerte!'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDiscounts.map((discount) => (
                <div
                  key={discount.id}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow"
                >
                  <div className="bg-gradient-to-r from-orange-500 to-red-500 p-6 text-white">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold mb-2">{discount.title}</h3>
                        <div className="flex items-center gap-2 text-sm opacity-90">
                          <Store className="w-4 h-4" />
                          <span>{discount.business.business_name}</span>
                        </div>
                      </div>
                      <div className="bg-white text-orange-600 rounded-full px-4 py-2 font-bold text-2xl">
                        -{discount.discount_percentage}%
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    <p className="text-gray-700 mb-4">{discount.description}</p>

                    <div className="bg-gray-50 border-2 border-dashed border-orange-300 rounded-lg p-4 mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600 font-medium">Codice sconto:</span>
                        <button
                          onClick={() => copyCodeToClipboard(discount.code)}
                          className="text-xs text-orange-600 hover:text-orange-700 font-medium"
                        >
                          Copia
                        </button>
                      </div>
                      <div className="font-mono text-xl font-bold text-orange-600 text-center bg-white rounded p-2">
                        {discount.code}
                      </div>
                    </div>

                    <div className="space-y-2 text-sm text-gray-600 mb-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span>Valido fino al {formatDate(discount.valid_until)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-orange-600">
                          {getDaysRemaining(discount.valid_until)}
                        </span>
                      </div>
                      {discount.business.category_id && (
                        <div className="flex items-center gap-2">
                          <TagIcon className="w-4 h-4 text-gray-400" />
                          <span>{getCategoryName(discount.business.category_id)}</span>
                        </div>
                      )}
                      {discount.business.locations && discount.business.locations.length > 0 && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span>
                            {discount.business.locations[0].city}, {discount.business.locations[0].region}
                          </span>
                        </div>
                      )}
                    </div>

                    {discount.is_redeemed ? (
                      <div className="space-y-2">
                        <div className="bg-green-50 border-2 border-green-300 rounded-lg p-3 flex items-center justify-center gap-2 text-green-700 font-semibold">
                          <CheckCircle2 className="w-5 h-5" />
                          <span>Sconto utilizzato e verificato</span>
                        </div>
                        {discount.redeemed_at && (
                          <p className="text-sm text-center text-gray-500">
                            Verificato il {new Date(discount.redeemed_at).toLocaleDateString('it-IT')}
                          </p>
                        )}
                        <a
                          href={`/business/${discount.business_id}`}
                          className="block w-full bg-gray-600 text-white text-center py-3 rounded-lg hover:bg-gray-700 transition-colors font-medium"
                        >
                          Vai all'attività
                        </a>
                      </div>
                    ) : discount.pending_redemption ? (
                      <div className="space-y-3">
                        <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4">
                          <p className="text-sm text-blue-800 font-medium mb-3 text-center">
                            Mostra questo codice all'attività
                          </p>
                          <div className="bg-white rounded-lg p-4 mb-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs text-gray-500 font-medium">CODICE RISCATTO</span>
                              <button
                                onClick={() => copyCodeToClipboard(discount.pending_redemption!.redemption_code)}
                                className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                              >
                                <Copy className="w-3 h-3" />
                                Copia
                              </button>
                            </div>
                            <div className="font-mono text-3xl font-bold text-blue-600 text-center tracking-wider">
                              {discount.pending_redemption.redemption_code}
                            </div>
                          </div>
                          <div className="flex items-center justify-center gap-2 text-sm text-orange-700">
                            <Clock className="w-4 h-4" />
                            <span className="font-medium">
                              {getTimeRemaining(discount.pending_redemption.expires_at)}
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-center text-gray-600 bg-gray-50 rounded p-3">
                          Il codice scadrà automaticamente se non verificato entro 2 ore. L'attività confermerà l'utilizzo.
                        </p>
                        <a
                          href={`/business/${discount.business_id}`}
                          className="block w-full bg-orange-600 text-white text-center py-3 rounded-lg hover:bg-orange-700 transition-colors font-medium"
                        >
                          Vai all'attività
                        </a>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <button
                          onClick={() => generateRedemptionCode(discount)}
                          disabled={generatingCode === discount.id}
                          className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {generatingCode === discount.id ? (
                            <>
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                              <span>Generazione...</span>
                            </>
                          ) : (
                            <>
                              <Ticket className="w-5 h-5" />
                              <span>Genera codice riscatto</span>
                            </>
                          )}
                        </button>
                        <a
                          href={`/business/${discount.business_id}`}
                          className="block w-full bg-orange-600 text-white text-center py-3 rounded-lg hover:bg-orange-700 transition-colors font-medium"
                        >
                          Vai all'attività
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {showCodeModal && generatedRedemption && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Codice Generato!</h3>
                <button
                  onClick={() => setShowCodeModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 mb-4 border-2 border-green-200">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-900">{generatedRedemption.discountTitle}</h4>
                  <div className="bg-green-600 text-white px-3 py-1 rounded-full text-lg font-bold">
                    -{generatedRedemption.discountPercentage}%
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4 mb-3">
                  <p className="text-sm text-gray-600 font-medium mb-2 text-center">
                    CODICE DI RISCATTO
                  </p>
                  <div className="font-mono text-3xl font-bold text-green-600 text-center tracking-wider mb-3">
                    {generatedRedemption.code}
                  </div>
                  <button
                    onClick={() => copyCodeToClipboard(generatedRedemption.code)}
                    className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    <Copy className="w-4 h-4" />
                    Copia codice
                  </button>
                </div>

                <div className="flex items-center justify-center gap-2 text-sm text-orange-700">
                  <Clock className="w-4 h-4" />
                  <span className="font-medium">
                    {getTimeRemaining(generatedRedemption.expiresAt)}
                  </span>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-900 font-medium mb-2">Come utilizzare lo sconto:</p>
                <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                  <li>Recati presso l'attività</li>
                  <li>Mostra questo codice al personale</li>
                  <li>L'attività verificherà il codice</li>
                  <li>Riceverai lo sconto sul tuo acquisto</li>
                </ol>
              </div>

              <p className="text-xs text-center text-gray-500 mb-4">
                Il codice scadrà automaticamente tra 2 ore se non viene utilizzato
              </p>

              <button
                onClick={() => setShowCodeModal(false)}
                className="w-full bg-gray-600 text-white py-3 rounded-lg hover:bg-gray-700 transition-colors font-medium"
              >
                Ho capito
              </button>
            </div>
          </div>
        )}
      </div>
  );
}
