import { useState, useEffect } from 'react';
import { Gavel, Search, Filter, Eye, Trash2, CheckCircle, XCircle, Clock, TrendingUp, Users, ShieldCheck, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
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
  approval_status: string;
  current_bidder_nickname?: string;
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
  const { user } = useAuth();
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [approvalFilter, setApprovalFilter] = useState<string>('pending');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [priceRangeFilter, setPriceRangeFilter] = useState<string>('all');
  const [regionFilter, setRegionFilter] = useState<string>('all');
  const [provinceFilter, setProvinceFilter] = useState<string>('all');
  const [cityFilter, setCityFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    totalBids: 0,
    totalDeposits: 0
  });

  useEffect(() => {
    loadAuctions();
    loadStats();
  }, [approvalFilter]);

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

      if (approvalFilter !== 'all') {
        query = query.eq('approval_status', approvalFilter);
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
        .select('status, approval_status');

      const { data: allBids } = await supabase
        .from('auction_bids')
        .select('id');

      const { data: allDeposits } = await supabase
        .from('auction_deposits')
        .select('amount');

      const pending = allAuctions?.filter(a => a.approval_status === 'pending').length || 0;
      const approved = allAuctions?.filter(a => a.approval_status === 'approved').length || 0;
      const rejected = allAuctions?.filter(a => a.approval_status === 'rejected').length || 0;
      const totalDeposits = allDeposits?.reduce((sum, d) => sum + Number(d.amount), 0) || 0;

      setStats({
        total: allAuctions?.length || 0,
        pending,
        approved,
        rejected,
        totalBids: allBids?.length || 0,
        totalDeposits
      });
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  const handleApprove = async (auctionId: string) => {
    if (!user) return;
    setProcessing(auctionId);
    try {
      const { error } = await supabase.rpc('approve_auction', {
        p_auction_id: auctionId,
        p_admin_id: user.id
      });
      if (error) throw error;
      loadAuctions();
      loadStats();
    } catch (err: any) {
      alert('Errore durante l\'approvazione: ' + err.message);
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async () => {
    if (!rejectingId || !user) return;
    setProcessing(rejectingId);
    try {
      const { error } = await supabase.rpc('reject_auction', {
        p_auction_id: rejectingId,
        p_admin_id: user.id,
        p_reason: rejectReason
      });
      if (error) throw error;
      setRejectingId(null);
      setRejectReason('');
      loadAuctions();
      loadStats();
    } catch (err: any) {
      alert('Errore durante il rifiuto: ' + err.message);
    } finally {
      setProcessing(null);
    }
  };

  const handleDeleteAuction = async (auctionId: string) => {
    if (!confirm('Sei sicuro di voler eliminare questa asta? Questa azione è irreversibile.')) return;
    try {
      const { error } = await supabase.from('auctions').delete().eq('id', auctionId);
      if (error) throw error;
      loadAuctions();
      loadStats();
    } catch (err: any) {
      alert('Errore durante l\'eliminazione: ' + err.message);
    }
  };

  const filteredAuctions = auctions.filter(auction => {
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

  const getApprovalBadge = (approvalStatus: string) => {
    const badges: Record<string, { bg: string; text: string; label: string }> = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'In attesa' },
      approved: { bg: 'bg-green-100', text: 'text-green-800', label: 'Approvata' },
      rejected: { bg: 'bg-red-100', text: 'text-red-800', label: 'Rifiutata' }
    };
    const badge = badges[approvalStatus] || badges.pending;
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
        <p className="text-gray-600">Approva, monitora e gestisci tutte le aste della piattaforma</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-900">Totali</span>
            <Gavel className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-3xl font-bold text-blue-900">{stats.total}</div>
        </div>

        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4 border border-yellow-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-yellow-900">Da Approvare</span>
            <AlertCircle className="w-5 h-5 text-yellow-600" />
          </div>
          <div className="text-3xl font-bold text-yellow-900">{stats.pending}</div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-green-900">Approvate</span>
            <ShieldCheck className="w-5 h-5 text-green-600" />
          </div>
          <div className="text-3xl font-bold text-green-900">{stats.approved}</div>
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
                showFilters ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Filter className="w-4 h-4" />
              Filtri Avanzati
            </button>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2">
            {[
              { key: 'pending', label: 'Da Approvare', color: 'yellow', count: stats.pending },
              { key: 'approved', label: 'Approvate', color: 'green', count: stats.approved },
              { key: 'rejected', label: 'Rifiutate', color: 'red', count: stats.rejected },
              { key: 'all', label: 'Tutte', color: 'gray', count: stats.total },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setApprovalFilter(tab.key)}
                className={`relative px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                  approvalFilter === tab.key
                    ? tab.key === 'pending' ? 'bg-yellow-600 text-white'
                    : tab.key === 'approved' ? 'bg-green-600 text-white'
                    : tab.key === 'rejected' ? 'bg-red-600 text-white'
                    : 'bg-orange-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {tab.label}
                {tab.key === 'pending' && tab.count > 0 && approvalFilter !== 'pending' && (
                  <span className="absolute -top-2 -right-2 min-w-[20px] h-[20px] flex items-center justify-center px-1 bg-red-600 text-white text-xs font-bold rounded-full">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Categoria</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Fascia di Prezzo</label>
                <select
                  value={priceRangeFilter}
                  onChange={(e) => setPriceRangeFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="all">Tutti i prezzi</option>
                  <option value="0-100">0 - 100 EUR</option>
                  <option value="100-500">100 - 500 EUR</option>
                  <option value="500-1000">500 - 1.000 EUR</option>
                  <option value="1000-5000">1.000 - 5.000 EUR</option>
                  <option value="5000+">Oltre 5.000 EUR</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Regione</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Provincia</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Citta</label>
                <select
                  value={cityFilter}
                  onChange={(e) => setCityFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="all">Tutte le citta</option>
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
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
          </div>
        ) : filteredAuctions.length === 0 ? (
          <div className="text-center py-12 text-gray-600">
            {approvalFilter === 'pending' ? 'Nessuna asta da approvare' : 'Nessuna asta trovata'}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAuctions.map(auction => (
              <div
                key={auction.id}
                className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${
                  auction.approval_status === 'pending' ? 'border-yellow-300 bg-yellow-50/30' : 'border-gray-200'
                }`}
              >
                <div className="flex gap-4">
                  <img
                    src={auction.images?.[0] || 'https://images.pexels.com/photos/5632388/pexels-photo-5632388.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop'}
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
                      <div className="flex gap-2 flex-shrink-0">
                        {getApprovalBadge(auction.approval_status)}
                      </div>
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
                          {auction.base_price.toFixed(2)} EUR
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Offerta Attuale</div>
                        <div className="text-sm font-medium text-orange-600">
                          {auction.current_price > 0 ? `${auction.current_price.toFixed(2)} EUR` : 'Nessuna'}
                        </div>
                        {auction.current_bidder_nickname && (
                          <div className="text-xs text-gray-500 mt-0.5">
                            di <span className="font-semibold text-gray-700">{auction.current_bidder_nickname}</span>
                          </div>
                        )}
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
                        <div className="text-xs text-gray-500">Localita</div>
                        <div className="text-sm font-medium text-gray-900">
                          {auction.city}, {auction.province}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Scadenza</div>
                        <div className="text-sm font-medium text-gray-900">
                          {getTimeRemaining(auction.ends_at)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Deposito</div>
                        <div className="text-sm font-medium text-gray-900">
                          {auction.deposit_amount} EUR
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
                      {auction.approval_status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApprove(auction.id)}
                            disabled={processing === auction.id}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 font-medium"
                          >
                            <ShieldCheck className="w-4 h-4" />
                            {processing === auction.id ? 'Approvando...' : 'Approva'}
                          </button>
                          <button
                            onClick={() => setRejectingId(auction.id)}
                            disabled={processing === auction.id}
                            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 font-medium"
                          >
                            <XCircle className="w-4 h-4" />
                            Rifiuta
                          </button>
                        </>
                      )}

                      <a
                        href={`/auctions/${auction.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-1.5 bg-orange-600 text-white text-sm rounded-lg hover:bg-orange-700 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        Visualizza
                      </a>

                      <button
                        onClick={() => handleDeleteAuction(auction.id)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors ml-auto"
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

      {rejectingId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Rifiuta Asta</h3>
            <p className="text-sm text-gray-600 mb-4">
              Inserisci il motivo del rifiuto (opzionale). L'utente ricevera una notifica.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Motivo del rifiuto..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
              rows={3}
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleReject}
                disabled={processing !== null}
                className="flex-1 bg-red-600 text-white py-2.5 rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50"
              >
                {processing ? 'Rifiutando...' : 'Conferma Rifiuto'}
              </button>
              <button
                onClick={() => { setRejectingId(null); setRejectReason(''); }}
                className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Annulla
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
