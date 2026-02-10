import { useState, useEffect } from 'react';
import { Plus, Search, MapPin, Euro, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ClassifiedAdCard } from '../components/classifieds/ClassifiedAdCard';
import { ClassifiedAdForm } from '../components/classifieds/ClassifiedAdForm';

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
}

interface ClassifiedAd {
  id: string;
  title: string;
  description: string;
  price: number | null;
  location: string;
  city: string;
  province: string;
  region: string;
  images: string[] | null;
  category_id: string;
  user_id: string;
  views_count: number;
  created_at: string;
  profiles: {
    full_name: string;
    avatar_url: string | null;
  };
  classified_categories: {
    name: string;
    icon: string;
  };
}

export function ClassifiedAdsPage() {
  const { user, profile } = useAuth();
  const [ads, setAds] = useState<ClassifiedAd[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Filters
  const [adType, setAdType] = useState<'all' | 'sell' | 'buy' | 'gift'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  useEffect(() => {
    loadCategories();
    loadAds();
  }, [adType, selectedCategory, searchQuery, selectedCity, minPrice, maxPrice]);

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('classified_categories')
        .select('*')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadAds = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('classified_ads')
        .select(`
          *,
          profiles!user_id(full_name, avatar_url),
          classified_categories!category_id(name, icon)
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (adType !== 'all') {
        query = query.eq('ad_type', adType);
      }

      if (selectedCategory) {
        query = query.eq('category_id', selectedCategory);
      }

      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
      }

      if (selectedCity) {
        query = query.ilike('city', `%${selectedCity}%`);
      }

      if (minPrice) {
        query = query.gte('price', parseFloat(minPrice));
      }

      if (maxPrice) {
        query = query.lte('price', parseFloat(maxPrice));
      }

      const { data, error } = await query;

      if (error) throw error;
      setAds(data || []);
    } catch (error) {
      console.error('Error loading ads:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdCreated = () => {
    setShowCreateForm(false);
    loadAds();
  };

  if (profile?.user_type === 'business') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🏢</span>
          </div>
          <h2 className="text-2xl font-bold mb-4">Sezione non disponibile</h2>
          <p className="text-gray-600 mb-6">
            La sezione annunci è riservata ai clienti. Come attività puoi accedere a sconti, prodotti e pubblicare annunci di lavoro dalla tua dashboard.
          </p>
          <div className="flex flex-col gap-3">
            <a
              href="/dashboard"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Vai alla Dashboard
            </a>
            <a
              href="/"
              className="text-gray-600 hover:text-gray-800 transition-colors"
            >
              Torna alla Home
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Annunci</h1>
            <p className="text-gray-600 mt-2">
              Trova quello che cerchi o pubblica il tuo annuncio
            </p>
          </div>
          {user && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Pubblica Annuncio
            </button>
          )}
        </div>

        {/* Ad Type Tabs */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <button
              onClick={() => setAdType('all')}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                adType === 'all'
                  ? 'bg-gray-800 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Tutti gli annunci
            </button>
            <button
              onClick={() => setAdType('sell')}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                adType === 'sell'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              💰 Vendo
            </button>
            <button
              onClick={() => setAdType('buy')}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                adType === 'buy'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              🔍 Cerco
            </button>
            <button
              onClick={() => setAdType('gift')}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                adType === 'gift'
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              🎁 Regalo
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cerca
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cerca annunci..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoria
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Tutte</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* City */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Città
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  placeholder="Es. Milano"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Price Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prezzo
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  placeholder="Min"
                  className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="number"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  placeholder="Max"
                  className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Clear Filters */}
          {(adType !== 'all' || selectedCategory || searchQuery || selectedCity || minPrice || maxPrice) && (
            <button
              onClick={() => {
                setAdType('all');
                setSelectedCategory('');
                setSearchQuery('');
                setSelectedCity('');
                setMinPrice('');
                setMaxPrice('');
              }}
              className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
            >
              Cancella filtri
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-2 mb-8">
          <button
            onClick={() => setSelectedCategory('')}
            className={`px-4 py-2 rounded-full transition-colors ${
              !selectedCategory
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Tutte
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-2 rounded-full transition-colors ${
                selectedCategory === category.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>

        {/* Results Count */}
        <div className="mb-4 text-gray-600">
          {loading ? 'Caricamento...' : `${ads.length} annunci trovati`}
        </div>

        {/* Ads Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : ads.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Nessun annuncio trovato
            </h3>
            <p className="text-gray-600 mb-6">
              Prova a modificare i filtri o sii il primo a pubblicare un annuncio!
            </p>
            {user && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Pubblica Annuncio
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ads.map((ad) => (
              <ClassifiedAdCard key={ad.id} ad={ad} />
            ))}
          </div>
        )}
      </div>

      {/* Create Ad Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <ClassifiedAdForm
              onSuccess={handleAdCreated}
              onCancel={() => setShowCreateForm(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
