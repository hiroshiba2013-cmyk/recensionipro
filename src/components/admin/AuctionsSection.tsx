import { useState, useEffect } from 'react';
import { Gavel, Search, Filter, Eye, Trash2, CheckCircle, XCircle, Clock, TrendingUp, Users } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { ITALIAN_REGIONS, PROVINCES_BY_REGION, CITIES_BY_PROVINCE } from '../../lib/cities';

const AUCTION_CATEGORIES = [
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

interface Auction {
  id: string;
  title: string;
  description: string;
  base_price: number;
  current_price: number;
  deposit_amount: number;
  category: string;
  condition: string;
  city: string;
  province: string;
  region: string;
  status: string;
  ends_at: string;
  created_at: string;
  images: string[];
  user: {
    full_name?: string;
    nickname?: string;
    email?: string;
  };
  bid_count?: number;
  winner?: {
    full_name?: string;
    nickname?: string;
  };
}

export default function AuctionsSection() {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [priceRangeFilter, setPriceRangeFilter] = useState<string>('all');
  const [regionFilter, setRegionFilter] = useState<string>('all');
  const [provinceFilter, setProvinceFilter] = useState<string>('all');
  const [cityFilter, setCityFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    completed: 0,
    expired: 0,
    totalBids: 0,
    totalDeposits: 0
  });

  useEffect(() => {
    loadAuctions();
    loadStats();
  }, [statusFilter]);

  const loadAuctions = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('auctions')
        .select(`
          *,
          user:user_id(full_name, nickname, email),
          winner:winner_id(full_name, nickname),
          bid_count:auction_bids(count)
        `)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
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

  const loadStats = async () => {
    try {
      const { data: allAuctions } = await supabase
        .from('auctions')
        .select('status');

      const { data: allBids } = await supabase
        .from('auction_bids')
        .select('id');

      const { data: allDeposits } = await supabase
        .from('auction_deposits')
        .select('amount');

      const active = allAuctions?.filter(a => a.status === 'active').length || 0;
      const completed = allAuctions?.filter(a => a.status === 'completed').length || 0;
      const expired = allAuctions?.filter(a => a.status === 'expired').length || 0;
      const totalDeposits = allDeposits?.reduce((sum, d) => sum + Number(d.amount), 0) || 0;

      setStats({
        total: allAuctions?.length || 0,
        active,
        completed,
        expired,
        totalBids: allBids?.length || 0,
        totalDeposits
      });
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  const handleDeleteAuction = async (auctionId: string) => {
    if (!confirm('Sei sicuro di voler eliminare questa asta? Questa azione è irreversibile.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('auctions')
        .delete()
        .eq('id', auctionId);

      if (error) throw error;

      loadAuctions();
      loadStats();
    } catch (err: any) {
      alert('Errore durante l\'eliminazione: ' + err.message);
    }
  };

  const handleChangeStatus = async (auctionId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('auctions')
        .update({ status: newStatus })
        .eq('id', auctionId);

      if (error) throw error;

      loadAuctions();
      loadStats();
    } catch (err: any) {
      alert('Errore durante l\'aggiornamento: ' + err.message);
    }
  };

  const filteredAuctions = auctions.filter(auction => {
    if (!searchTerm && categoryFilter === 'all' && priceRangeFilter === 'all' &&
        regionFilter === 'all' && provinceFilter === 'all' && cityFilter === 'all') {
      return true;
    }

    const matchesSearch = !searchTerm ||
      auction.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      auction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      auction.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      auction.user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      auction.user?.nickname?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = categoryFilter === 'all' || auction.category === categoryFilter;

    const matchesPriceRange = priceRangeFilter === 'all' || (() => {
      const price = auction.current_price > 0 ? auction.current_price : auction.base_price;
      switch (priceRangeFilter) {
        case '0-100': return price <= 100;
        case '100-500': return price > 100 && price <= 500;
        case '500-1000': return price > 500 && price <= 1000;
        case '1000-5000': return price > 1000 && price <= 5000;
        case '5000+': return price > 5000;
        default: return true;
      }
    })();

    const matchesRegion = regionFilter === 'all' || auction.region === regionFilter;
    const matchesProvince = provinceFilter === 'all' || auction.province === provinceFilter;
    const matchesCity = cityFilter === 'all' || auction.city === cityFilter;

    return matchesSearch && matchesCategory && matchesPriceRange && matchesRegion && matchesProvince && matchesCity;
  });

  const provinces = regionFilter === 'all'
    ? Object.values(PROVINCES_BY_REGION).flat().sort()
    : (PROVINCES_BY_REGION[regionFilter] || []).sort();
  const cities = provinceFilter === 'all'
    ? (regionFilter === 'all'
        ? Object.values(CITIES_BY_PROVINCE).flat().sort()
        : (PROVINCES_BY_REGION[regionFilter] || []).flatMap(p => CITIES_BY_PROVINCE[p] || []).sort()
      )
    : (CITIES_BY_PROVINCE[provinceFilter] || []).sort();

  const getTimeRemaining = (endsAt: string) => {
    const now = new Date();
    const endDate = new Date(endsAt);
    const diff = endDate.getTime() - now.getTime();

    if (diff <= 0) return 'Terminata';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days}g ${hours}h`;
    return `${hours}h`;
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      active: { bg: 'bg-green-100', text: 'text-green-800', label: 'Attiva' },
      completed: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Conclusa' },
      expired: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Scaduta' },
      cancelled: { bg: 'bg-red-100', text: 'text-red-800', label: 'Annullata' }
    };
    const badge = badges[status as keyof typeof badges] || badges.expired;
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2 mb-2">
          <Gavel className="w-7 h-7 text-orange-600" />
          Gestione Aste
        </h2>
        <p className="text-gray-600">Monitora e gestisci tutte le aste della piattaforma</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-900">Aste Totali</span>
            <Gavel className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-3xl font-bold text-blue-900">{stats.total}</div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-green-900">Attive</span>
            <Clock className="w-5 h-5 text-green-600" />
          </div>
          <div className="text-3xl font-bold text-green-900">{stats.active}</div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-purple-900">Concluse</span>
            <CheckCircle className="w-5 h-5 text-purple-600" />
          </div>
          <div className="text-3xl font-bold text-purple-900">{stats.completed}</div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-orange-900">Offerte Totali</span>
            <TrendingUp className="w-5 h-5 text-orange-600" />
          </div>
          <div className="text-3xl font-bold text-orange-900">{stats.totalBids}</div>
        </div>

        <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-lg p-4 border border-cyan-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-cyan-900">Depositi</span>
            <Users className="w-5 h-5 text-cyan-600" />
          </div>
          <div className="text-2xl font-bold text-cyan-900">{stats.totalDeposits.toFixed(0)}€</div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cerca per titolo, descrizione, utente..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                showFilters
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Filter className="w-4 h-4" />
              Filtri Avanzati
            </button>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                statusFilter === 'all'
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Tutte
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                statusFilter === 'active'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Attive
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                statusFilter === 'completed'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Concluse
            </button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoria
                </label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="all">Tutte le categorie</option>
                  {AUCTION_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fascia di Prezzo
                </label>
                <select
                  value={priceRangeFilter}
                  onChange={(e) => setPriceRangeFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="all">Tutti i prezzi</option>
                  <option value="0-100">0 - 100 €</option>
                  <option value="100-500">100 - 500 €</option>
                  <option value="500-1000">500 - 1.000 €</option>
                  <option value="1000-5000">1.000 - 5.000 €</option>
                  <option value="5000+">Oltre 5.000 €</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Regione
                </label>
                <select
                  value={regionFilter}
                  onChange={(e) => { setRegionFilter(e.target.value); setProvinceFilter('all'); setCityFilter('all'); }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="all">Tutte le regioni</option>
                  {ITALIAN_REGIONS.map(reg => (
                    <option key={reg} value={reg}>{reg}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Provincia
                </label>
                <select
                  value={provinceFilter}
                  onChange={(e) => { setProvinceFilter(e.target.value); setCityFilter('all'); }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="all">Tutte le province</option>
                  {provinces.map(prov => (
                    <option key={prov} value={prov}>{prov}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Città
                </label>
                <select
                  value={cityFilter}
                  onChange={(e) => setCityFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="all">Tutte le città</option>
                  {cities.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={() => {
                    setCategoryFilter('all');
                    setPriceRangeFilter('all');
                    setRegionFilter('all');
                    setProvinceFilter('all');
                    setCityFilter('all');
                  }}
                  className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Cancella Filtri
                </button>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>
              Risultati: <strong className="text-gray-900">{filteredAuctions.length}</strong> di <strong className="text-gray-900">{auctions.length}</strong> aste
            </span>
            {(categoryFilter !== 'all' || priceRangeFilter !== 'all' || regionFilter !== 'all' || provinceFilter !== 'all' || cityFilter !== 'all') && (
              <span className="text-orange-600 font-medium">
                Filtri attivi
              </span>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
          </div>
        ) : filteredAuctions.length === 0 ? (
          <div className="text-center py-12 text-gray-600">
            Nessuna asta trovata
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAuctions.map(auction => (
              <div
                key={auction.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex gap-4">
                  <img
                    src={auction.images[0] || 'https://via.placeholder.com/150'}
                    alt={auction.title}
                    className="w-32 h-32 object-cover rounded-lg flex-shrink-0"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                          {auction.title}
                        </h3>
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {auction.description}
                        </p>
                      </div>
                      {getStatusBadge(auction.status)}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                      <div>
                        <div className="text-xs text-gray-500">Venditore</div>
                        <div className="text-sm font-medium text-gray-900">
                          {auction.user?.nickname || auction.user?.full_name || 'N/A'}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Base d'Asta</div>
                        <div className="text-sm font-medium text-gray-900">
                          {auction.base_price.toFixed(2)} €
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Offerta Attuale</div>
                        <div className="text-sm font-medium text-orange-600">
                          {auction.current_price > 0 ? `${auction.current_price.toFixed(2)} €` : 'Nessuna'}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Offerte</div>
                        <div className="text-sm font-medium text-gray-900">
                          {auction.bid_count || 0}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                      <div>
                        <div className="text-xs text-gray-500">Categoria</div>
                        <div className="text-sm font-medium text-gray-900">{auction.category}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Località</div>
                        <div className="text-sm font-medium text-gray-900">
                          {auction.city}, {auction.province}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Tempo Rimanente</div>
                        <div className="text-sm font-medium text-gray-900">
                          {getTimeRemaining(auction.ends_at)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Deposito</div>
                        <div className="text-sm font-medium text-gray-900">
                          {auction.deposit_amount} €
                        </div>
                      </div>
                    </div>

                    {auction.winner && (
                      <div className="mb-3 p-2 bg-blue-50 rounded border border-blue-200">
                        <span className="text-sm text-blue-900">
                          <strong>Vincitore:</strong> {auction.winner.nickname || auction.winner.full_name}
                        </span>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2">
                      <a
                        href={`/auctions/${auction.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-1.5 bg-orange-600 text-white text-sm rounded-lg hover:bg-orange-700 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        Visualizza
                      </a>

                      {auction.status === 'active' && (
                        <>
                          <button
                            onClick={() => handleChangeStatus(auction.id, 'completed')}
                            className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Completa
                          </button>
                          <button
                            onClick={() => handleChangeStatus(auction.id, 'cancelled')}
                            className="flex items-center gap-2 px-3 py-1.5 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors"
                          >
                            <XCircle className="w-4 h-4" />
                            Annulla
                          </button>
                        </>
                      )}

                      <button
                        onClick={() => handleDeleteAuction(auction.id)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors ml-auto"
                      >
                        <Trash2 className="w-4 h-4" />
                        Elimina
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
