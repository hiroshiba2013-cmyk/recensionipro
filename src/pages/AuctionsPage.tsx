import { useState, useEffect } from 'react';
import { Plus, Search, Filter } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import AuctionCard from '../components/auctions/AuctionCard';
import AuctionForm from '../components/auctions/AuctionForm';

const categories = [
  'Tutte',
  'Elettronica',
  'Abbigliamento',
  'Casa e Giardino',
  'Sport',
  'Collezionismo',
  'Auto e Moto',
  'Libri',
  'Giocattoli',
  'Arte',
  'Altro'
];

export default function AuctionsPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [auctions, setAuctions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tutte');
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState({
    city: '',
    province: '',
    region: '',
    status: 'active'
  });

  useEffect(() => {
    loadAuctions();
  }, [filters, selectedCategory]);

  const loadAuctions = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('auctions')
        .select(`
          *,
          user:user_id(full_name, nickname),
          bid_count:auction_bids(count)
        `)
        .eq('status', filters.status)
        .eq('approval_status', 'approved')
        .order('created_at', { ascending: false });

      if (selectedCategory !== 'Tutte') {
        query = query.eq('category', selectedCategory);
      }

      if (filters.city) {
        query = query.ilike('city', `%${filters.city}%`);
      }

      if (filters.province) {
        query = query.ilike('province', `%${filters.province}%`);
      }

      if (filters.region) {
        query = query.ilike('region', `%${filters.region}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      const auctionsWithBidCount = (data || []).map(auction => ({
        ...auction,
        bid_count: auction.bid_count?.[0]?.count || 0
      }));

      setAuctions(auctionsWithBidCount);
    } catch (err: any) {
      console.error('Error loading auctions:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredAuctions = auctions.filter(auction =>
    auction.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    auction.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-orange-500 via-orange-600 to-red-600">
        <div className="absolute inset-0 opacity-[0.07]" style={{backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '24px 24px'}} />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>
              </div>
              <div>
                <h1 className="text-3xl md:text-5xl font-extrabold text-white drop-shadow-lg">Aste</h1>
                <p className="text-orange-100 text-base md:text-lg mt-1">Partecipa alle aste e trova occasioni uniche</p>
              </div>
            </div>
            {user && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="inline-flex items-center gap-2 bg-white text-orange-600 px-6 py-3 rounded-xl font-bold hover:bg-orange-50 transition-colors shadow-lg"
              >
                <Plus className="w-5 h-5" />
                Crea Asta
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">

        {showCreateForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-lg max-w-2xl w-full p-6 my-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Crea Nuova Asta</h2>
              <AuctionForm
                onSuccess={() => {
                  setShowCreateForm(false);
                  loadAuctions();
                }}
                onCancel={() => setShowCreateForm(false)}
              />
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cerca aste..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Filter className="w-5 h-5" />
              Filtri
            </button>
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Regione</label>
                  <input
                    type="text"
                    value={filters.region}
                    onChange={(e) => setFilters({ ...filters, region: e.target.value })}
                    placeholder="Tutte le regioni"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Provincia</label>
                  <input
                    type="text"
                    value={filters.province}
                    onChange={(e) => setFilters({ ...filters, province: e.target.value })}
                    placeholder="Tutte le province"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Città</label>
                  <input
                    type="text"
                    value={filters.city}
                    onChange={(e) => setFilters({ ...filters, city: e.target.value })}
                    placeholder="Tutte le città"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="mt-4 flex gap-4">
            <button
              onClick={() => setFilters({ ...filters, status: 'active' })}
              className={`px-4 py-2 rounded-lg font-medium ${
                filters.status === 'active'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Attive
            </button>
            <button
              onClick={() => setFilters({ ...filters, status: 'completed' })}
              className={`px-4 py-2 rounded-lg font-medium ${
                filters.status === 'completed'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Concluse
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredAuctions.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <p className="text-gray-600 text-lg">Nessuna asta trovata</p>
            {user && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="mt-4 text-blue-600 hover:underline"
              >
                Crea la prima asta
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAuctions.map(auction => (
              <AuctionCard key={auction.id} auction={auction} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
