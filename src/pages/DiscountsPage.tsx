import { useState, useEffect } from 'react';
import { Percent, Calendar, Tag as TagIcon, Store, MapPin, Clock, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Header } from '../components/layout/Header';

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
  category: string;
}

interface DiscountWithBusiness extends Discount {
  business: Business;
}

export function DiscountsPage() {
  const { user } = useAuth();
  const [discounts, setDiscounts] = useState<DiscountWithBusiness[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    loadDiscounts();
  }, []);

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
            category
          )
        `)
        .eq('active', true)
        .gte('valid_until', new Date().toISOString())
        .order('discount_percentage', { ascending: false });

      if (error) throw error;

      const typedData = data as unknown as DiscountWithBusiness[];
      setDiscounts(typedData);

      const uniqueCategories = Array.from(
        new Set(typedData.map(d => d.business.category).filter(Boolean))
      );
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Error loading discounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredDiscounts = discounts.filter(discount => {
    const matchesSearch =
      discount.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      discount.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      discount.business.business_name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = !selectedCategory || discount.business.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

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

  const copyCodeToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
  };

  if (!user) {
    return (
      <>
        <Header />
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
      </>
    );
  }

  return (
    <>
      <Header />
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
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
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
                      {discount.business.category && (
                        <div className="flex items-center gap-2">
                          <TagIcon className="w-4 h-4 text-gray-400" />
                          <span>{discount.business.category}</span>
                        </div>
                      )}
                    </div>

                    <a
                      href={`/business/${discount.business_id}`}
                      className="block w-full bg-orange-600 text-white text-center py-3 rounded-lg hover:bg-orange-700 transition-colors font-medium"
                    >
                      Vai all'attività
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
