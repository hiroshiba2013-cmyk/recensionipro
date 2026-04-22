import { useState, useEffect } from 'react';
import { useNavigate } from '../components/Router';
import { Clock, MapPin, Tag, TrendingUp, User, AlertCircle, CheckCircle, Euro } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

interface Bid {
  id: string;
  user_id: string;
  bid_amount: number;
  created_at: string;
  user: {
    full_name?: string;
    nickname?: string;
  };
}

export default function AuctionDetailPage() {
  const navigate = useNavigate();
  const id = window.location.pathname.split('/auctions/')[1];
  const { user } = useAuth();
  const { t } = useLanguage();
  const [auction, setAuction] = useState<any>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [bidAmount, setBidAmount] = useState('');
  const [hasDeposit, setHasDeposit] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedImage, setSelectedImage] = useState(0);
  const [completion, setCompletion] = useState<any>(null);

  useEffect(() => {
    loadAuction();
    loadBids();
    checkDeposit();
    loadCompletion();
  }, [id]);

  const loadAuction = async () => {
    try {
      const { data, error } = await supabase
        .from('auctions')
        .select(`
          *,
          user:user_id(full_name, nickname)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setAuction(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadBids = async () => {
    try {
      const { data, error } = await supabase
        .from('auction_bids')
        .select(`
          *,
          user:user_id(full_name, nickname)
        `)
        .eq('auction_id', id)
        .order('bid_amount', { ascending: false });

      if (error) throw error;
      setBids(data || []);
    } catch (err: any) {
      console.error('Error loading bids:', err);
    }
  };

  const checkDeposit = async () => {
    if (!user) return;

    try {
      const { data } = await supabase
        .from('auction_deposits')
        .select('*')
        .eq('auction_id', id)
        .eq('user_id', user.id)
        .eq('refunded', false)
        .maybeSingle();

      setHasDeposit(!!data);
    } catch (err) {
      setHasDeposit(false);
    }
  };

  const loadCompletion = async () => {
    if (!user) return;

    try {
      const { data } = await supabase
        .from('auction_completions')
        .select('*')
        .eq('auction_id', id)
        .maybeSingle();

      setCompletion(data);
    } catch (err) {
      console.error('Error loading completion:', err);
    }
  };

  const handlePayDeposit = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const { error: depositError } = await supabase
        .from('auction_deposits')
        .insert({
          auction_id: id,
          user_id: user.id,
          amount: auction.deposit_amount
        });

      if (depositError) throw depositError;

      setSuccess('Deposito pagato con successo! Ora puoi fare offerte.');
      setHasDeposit(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePlaceBid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }

    if (!hasDeposit) {
      setError('Devi pagare il deposito prima di fare un\'offerta');
      return;
    }

    const amount = parseFloat(bidAmount);
    const minBid = auction.current_price > 0 ? auction.current_price + 1 : auction.base_price;

    if (amount < minBid) {
      setError(`L'offerta minima è ${minBid.toFixed(2)}€`);
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const { error: bidError } = await supabase
        .from('auction_bids')
        .insert({
          auction_id: id,
          user_id: user.id,
          bid_amount: amount
        });

      if (bidError) throw bidError;

      setSuccess('Offerta inviata con successo!');
      setBidAmount('');
      loadAuction();
      loadBids();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmCompletion = async () => {
    if (!user || !completion) return;

    setSubmitting(true);
    setError('');

    try {
      const isSeller = auction.user_id === user.id;
      const updates: any = {};

      if (isSeller) {
        updates.seller_confirmed = true;
        updates.seller_confirmed_at = new Date().toISOString();
      } else {
        updates.buyer_confirmed = true;
        updates.buyer_confirmed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('auction_completions')
        .update(updates)
        .eq('id', completion.id);

      if (error) throw error;

      setSuccess('Transazione confermata!');
      loadCompletion();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const getTimeRemaining = () => {
    if (!auction) return '';
    const now = new Date();
    const endDate = new Date(auction.ends_at);
    const diff = endDate.getTime() - now.getTime();

    if (diff <= 0) return 'Terminata';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days} giorni, ${hours} ore`;
    if (hours > 0) return `${hours} ore, ${minutes} minuti`;
    return `${minutes} minuti`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Caricamento...</p>
        </div>
      </div>
    );
  }

  if (!auction) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600">Asta non trovata</p>
          <button
            onClick={() => navigate('/auctions')}
            className="mt-4 text-blue-600 hover:underline"
          >
            Torna alle aste
          </button>
        </div>
      </div>
    );
  }

  const minBid = auction.current_price > 0 ? auction.current_price + 1 : auction.base_price;
  const isOwner = user?.id === auction.user_id;
  const isActive = auction.status === 'active';
  const highestBid = bids[0];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <button
          onClick={() => navigate('/auctions')}
          className="mb-6 text-blue-600 hover:underline"
        >
          ← Torna alle aste
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-4">
              <img
                src={auction.images[selectedImage] || 'https://via.placeholder.com/600x400'}
                alt={auction.title}
                className="w-full h-96 object-cover"
              />
            </div>

            {auction.images.length > 1 && (
              <div className="grid grid-cols-5 gap-2">
                {auction.images.map((img: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`rounded-lg overflow-hidden border-2 ${
                      selectedImage === idx ? 'border-blue-600' : 'border-transparent'
                    }`}
                  >
                    <img src={img} alt={`${auction.title} ${idx + 1}`} className="w-full h-20 object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-start justify-between mb-4">
                <h1 className="text-3xl font-bold text-gray-900">{auction.title}</h1>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  auction.status === 'active' ? 'bg-green-100 text-green-800' :
                  auction.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {auction.status === 'active' ? 'Attiva' :
                   auction.status === 'completed' ? 'Conclusa' :
                   auction.status === 'expired' ? 'Scaduta' : auction.status}
                </span>
              </div>

              <div className="flex items-center gap-2 text-gray-600 mb-4">
                <User className="w-5 h-5" />
                <span>Venditore: {auction.user?.nickname || auction.user?.full_name || 'Utente'}</span>
              </div>

              <p className="text-gray-700 mb-6">{auction.description}</p>

              <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                <div>
                  <div className="text-sm text-gray-600 mb-1">Base d'Asta</div>
                  <div className="text-2xl font-bold text-gray-900">{auction.base_price.toFixed(2)} €</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">Offerta Attuale</div>
                  {auction.current_price > 0 ? (
                    <>
                      <div className="text-2xl font-bold text-blue-600 flex items-center gap-2">
                        <TrendingUp className="w-6 h-6" />
                        {auction.current_price.toFixed(2)} €
                      </div>
                      {(auction.current_bidder_nickname || highestBid) && (
                        <div className="flex items-center gap-1.5 mt-1">
                          <User className="w-4 h-4 text-blue-500" />
                          <span className="text-sm font-semibold text-blue-700">
                            {auction.current_bidder_nickname || highestBid?.user?.nickname || highestBid?.user?.full_name || 'Utente'}
                          </span>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-2xl font-bold text-gray-400">Nessuna offerta</div>
                  )}
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-2 text-gray-700">
                  <Clock className="w-5 h-5" />
                  <span>Tempo rimanente: <strong>{getTimeRemaining()}</strong></span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <MapPin className="w-5 h-5" />
                  <span>{auction.city}, {auction.province}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <Tag className="w-5 h-5" />
                  <span>Categoria: {auction.category}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <Euro className="w-5 h-5" />
                  <span>Deposito richiesto: <strong>{auction.deposit_amount}€</strong></span>
                </div>
              </div>

              {error && (
                <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {success && (
                <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-green-700">{success}</p>
                </div>
              )}

              {isActive && !isOwner && user && !hasDeposit && (
                <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800 mb-3">
                    Per partecipare a questa asta devi pagare un deposito di {auction.deposit_amount}€.
                    Il deposito ti verrà restituito alla fine dell'asta.
                  </p>
                  <button
                    onClick={handlePayDeposit}
                    disabled={submitting}
                    className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
                  >
                    {submitting ? 'Elaborazione...' : `Paga Deposito (${auction.deposit_amount}€)`}
                  </button>
                </div>
              )}

              {isActive && !isOwner && user && hasDeposit && (
                <form onSubmit={handlePlaceBid} className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fai un'offerta (minimo {minBid.toFixed(2)}€)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      required
                      min={minBid}
                      step="0.01"
                      value={bidAmount}
                      onChange={(e) => setBidAmount(e.target.value)}
                      placeholder={minBid.toFixed(2)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
                    >
                      {submitting ? 'Invio...' : 'Offri'}
                    </button>
                  </div>
                </form>
              )}

              {isActive && !user && (
                <button
                  onClick={() => navigate('/login')}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700"
                >
                  Accedi per partecipare
                </button>
              )}

              {completion && (auction.user_id === user?.id || auction.winner_id === user?.id) && (
                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h3 className="font-semibold text-yellow-900 mb-2">Conferma Transazione</h3>
                  <p className="text-sm text-yellow-800 mb-3">
                    Hai 48 ore per confermare che la transazione è stata completata.
                  </p>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2">
                      {completion.seller_confirmed ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <div className="w-5 h-5 border-2 border-gray-300 rounded-full" />
                      )}
                      <span className="text-sm">Venditore confermato</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {completion.buyer_confirmed ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <div className="w-5 h-5 border-2 border-gray-300 rounded-full" />
                      )}
                      <span className="text-sm">Acquirente confermato</span>
                    </div>
                  </div>

                  {((auction.user_id === user?.id && !completion.seller_confirmed) ||
                    (auction.winner_id === user?.id && !completion.buyer_confirmed)) && (
                    <button
                      onClick={handleConfirmCompletion}
                      disabled={submitting}
                      className="w-full bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50"
                    >
                      {submitting ? 'Conferma...' : 'Conferma Transazione'}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Offerte ({bids.length})
          </h2>

          {bids.length === 0 ? (
            <p className="text-gray-600 text-center py-8">Nessuna offerta ancora</p>
          ) : (
            <div className="space-y-3">
              {bids.map((bid, index) => (
                <div
                  key={bid.id}
                  className={`flex items-center justify-between p-4 rounded-lg ${
                    index === 0 ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-gray-600" />
                    <span className={index === 0 ? 'font-bold text-blue-900' : 'text-gray-700'}>
                      {bid.user?.nickname || bid.user?.full_name || 'Utente'}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className={`text-xl font-bold ${
                      index === 0 ? 'text-blue-600' : 'text-gray-900'
                    }`}>
                      {bid.bid_amount.toFixed(2)} €
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(bid.created_at).toLocaleString('it-IT')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
