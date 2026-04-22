import { useState, useEffect } from 'react';
import { Gavel, Clock, TrendingUp, Eye, Plus, AlertCircle, Trophy, MapPin, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import AuctionForm from './AuctionForm';

interface Auction {
  id: string;
  title: string;
  base_price: number;
  current_price: number;
  images: string[];
  category: string;
  status: string;
  city: string;
  province: string;
  ends_at: string;
  created_at: string;
  bid_count?: number;
}

interface ParticipatingAuction extends Auction {
  my_highest_bid: number;
  is_winning: boolean;
}

export function UserAuctionsSection() {
  const { user, activeProfile } = useAuth();
  const [myAuctions, setMyAuctions] = useState<Auction[]>([]);
  const [participatingAuctions, setParticipatingAuctions] = useState<ParticipatingAuction[]>([]);
  const [activeTab, setActiveTab] = useState<'my' | 'participating'>('my');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const familyMemberId = activeProfile && !activeProfile.isOwner ? activeProfile.id : null;

  useEffect(() => {
    if (user) {
      loadAuctions();
    } else {
      setLoading(false);
    }
  }, [user, activeProfile]);

  const loadAuctions = async () => {
    if (!user) return;
    setLoading(true);

    try {
      let myQuery = supabase
        .from('auctions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (familyMemberId) {
        myQuery = myQuery.eq('family_member_id', familyMemberId);
      } else {
        myQuery = myQuery.is('family_member_id', null);
      }

      const { data: myData } = await myQuery;

      if (myData) {
        const withBids = await Promise.all(
          myData.map(async (auction) => {
            const { count } = await supabase
              .from('auction_bids')
              .select('id', { count: 'exact', head: true })
              .eq('auction_id', auction.id);
            return { ...auction, bid_count: count || 0 };
          })
        );
        setMyAuctions(withBids);
      }

      let bidsQuery = supabase
        .from('auction_bids')
        .select('auction_id, bid_amount')
        .eq('user_id', user.id);

      if (familyMemberId) {
        bidsQuery = bidsQuery.eq('family_member_id', familyMemberId);
      } else {
        bidsQuery = bidsQuery.is('family_member_id', null);
      }

      const { data: myBids } = await bidsQuery;

      if (myBids && myBids.length > 0) {
        const auctionBidMap = new Map<string, number>();
        myBids.forEach(bid => {
          const current = auctionBidMap.get(bid.auction_id) || 0;
          if (bid.bid_amount > current) {
            auctionBidMap.set(bid.auction_id, bid.bid_amount);
          }
        });

        const auctionIds = [...auctionBidMap.keys()];

        const { data: auctionsData } = await supabase
          .from('auctions')
          .select('*')
          .in('id', auctionIds)
          .order('ends_at', { ascending: true });

        if (auctionsData) {
          const enriched: ParticipatingAuction[] = await Promise.all(
            auctionsData.map(async (auction) => {
              const myHighest = auctionBidMap.get(auction.id) || 0;

              const { data: topBid } = await supabase
                .from('auction_bids')
                .select('bid_amount, user_id, family_member_id')
                .eq('auction_id', auction.id)
                .order('bid_amount', { ascending: false })
                .limit(1)
                .maybeSingle();

              const isWinning = topBid
                ? topBid.user_id === user.id &&
                  (familyMemberId ? topBid.family_member_id === familyMemberId : !topBid.family_member_id)
                : false;

              const { count } = await supabase
                .from('auction_bids')
                .select('id', { count: 'exact', head: true })
                .eq('auction_id', auction.id);

              return {
                ...auction,
                my_highest_bid: myHighest,
                is_winning: isWinning,
                bid_count: count || 0,
              };
            })
          );
          setParticipatingAuctions(enriched);
        }
      } else {
        setParticipatingAuctions([]);
      }
    } catch (error) {
      console.error('Error loading auctions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTimeRemaining = (endsAt: string) => {
    const now = new Date();
    const endDate = new Date(endsAt);
    const diff = endDate.getTime() - now.getTime();

    if (diff <= 0) return 'Terminata';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}g ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getStatusBadge = (status: string, endsAt: string) => {
    const isExpired = new Date(endsAt) < new Date();
    if (status === 'active' && !isExpired) {
      return <span className="px-2.5 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">Attiva</span>;
    }
    if (status === 'completed' || isExpired) {
      return <span className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded-full">Conclusa</span>;
    }
    return <span className="px-2.5 py-1 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-full">{status}</span>;
  };

  const myCount = myAuctions.length;
  const partCount = participatingAuctions.length;

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden border-2 border-orange-200">
      <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-3">
            <Gavel className="w-6 h-6" />
            Le Mie Aste
          </h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"
          >
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showForm ? 'Chiudi' : 'Crea Asta'}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="p-6 border-b border-gray-200 bg-orange-50/50">
          <AuctionForm
            onSuccess={() => {
              setShowForm(false);
              loadAuctions();
            }}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('my')}
          className={`flex-1 flex items-center justify-center gap-2 px-6 py-3.5 font-semibold text-sm transition-all ${
            activeTab === 'my'
              ? 'bg-orange-50 text-orange-700 border-b-2 border-orange-500'
              : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
          }`}
        >
          <Gavel className="w-4 h-4" />
          Le Mie Aste
          {myCount > 0 && (
            <span className={`min-w-[22px] h-[22px] flex items-center justify-center px-1.5 rounded-full text-xs font-bold ${
              activeTab === 'my' ? 'bg-orange-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              {myCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('participating')}
          className={`flex-1 flex items-center justify-center gap-2 px-6 py-3.5 font-semibold text-sm transition-all ${
            activeTab === 'participating'
              ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-500'
              : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          Partecipo
          {partCount > 0 && (
            <span className={`min-w-[22px] h-[22px] flex items-center justify-center px-1.5 rounded-full text-xs font-bold ${
              activeTab === 'participating' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              {partCount}
            </span>
          )}
        </button>
      </div>

      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
          </div>
        ) : activeTab === 'my' ? (
          myAuctions.length === 0 ? (
            <div className="text-center py-10">
              <Gavel className="w-14 h-14 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Nessuna asta creata</h3>
              <p className="text-gray-500 text-sm mb-6">Non hai ancora messo all'asta nessun oggetto.</p>
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-2 bg-orange-600 text-white px-6 py-3 rounded-xl hover:bg-orange-700 transition-colors font-semibold"
              >
                <Plus className="w-5 h-5" />
                Crea la tua prima asta
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {myAuctions.map((auction) => (
                <a
                  key={auction.id}
                  href={`/auctions/${auction.id}`}
                  className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:border-orange-300 hover:bg-orange-50/50 transition-all group"
                >
                  <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                    {auction.images && auction.images.length > 0 ? (
                      <img
                        src={auction.images[0]}
                        alt={auction.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-orange-50">
                        <Gavel className="w-8 h-8 text-orange-300" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900 truncate group-hover:text-orange-700 transition-colors">
                        {auction.title}
                      </h3>
                      {getStatusBadge(auction.status, auction.ends_at)}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {auction.city}
                      </span>
                      <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">{auction.category}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-sm">
                        <span className="text-gray-500">Base: </span>
                        <span className="font-semibold text-gray-800">{Number(auction.base_price).toFixed(2)} EUR</span>
                      </div>
                      {Number(auction.current_price) > 0 && (
                        <div className="text-sm">
                          <span className="text-gray-500">Attuale: </span>
                          <span className="font-bold text-orange-600">{Number(auction.current_price).toFixed(2)} EUR</span>
                        </div>
                      )}
                      {(auction.bid_count || 0) > 0 && (
                        <span className="text-xs text-gray-500">{auction.bid_count} offert{auction.bid_count === 1 ? 'a' : 'e'}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex-shrink-0 text-right hidden sm:block">
                    {auction.status === 'active' && new Date(auction.ends_at) > new Date() && (
                      <div className="flex items-center gap-1.5 text-sm text-green-700 bg-green-50 px-3 py-1.5 rounded-lg">
                        <Clock className="w-4 h-4" />
                        <span className="font-medium">{getTimeRemaining(auction.ends_at)}</span>
                      </div>
                    )}
                  </div>
                </a>
              ))}
            </div>
          )
        ) : (
          participatingAuctions.length === 0 ? (
            <div className="text-center py-10">
              <TrendingUp className="w-14 h-14 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Nessuna partecipazione</h3>
              <p className="text-gray-500 text-sm mb-6">Non stai partecipando a nessuna asta.</p>
              <a
                href="/auctions"
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors font-semibold"
              >
                <Eye className="w-5 h-5" />
                Esplora le aste
              </a>
            </div>
          ) : (
            <div className="space-y-3">
              {participatingAuctions.map((auction) => {
                const isActive = auction.status === 'active' && new Date(auction.ends_at) > new Date();
                const isEnded = !isActive;

                return (
                  <a
                    key={auction.id}
                    href={`/auctions/${auction.id}`}
                    className={`flex items-center gap-4 p-4 rounded-xl border transition-all group ${
                      auction.is_winning
                        ? 'border-green-300 bg-green-50/50 hover:bg-green-50'
                        : isEnded && !auction.is_winning
                        ? 'border-gray-200 bg-gray-50/50 hover:bg-gray-50'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/50'
                    }`}
                  >
                    <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                      {auction.images && auction.images.length > 0 ? (
                        <img
                          src={auction.images[0]}
                          alt={auction.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-blue-50">
                          <Gavel className="w-8 h-8 text-blue-300" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 truncate group-hover:text-blue-700 transition-colors">
                          {auction.title}
                        </h3>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {auction.is_winning ? (
                            <span className="flex items-center gap-1 px-2.5 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                              <Trophy className="w-3 h-3" />
                              {isEnded ? 'Vinto' : 'In testa'}
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 px-2.5 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full">
                              <AlertCircle className="w-3 h-3" />
                              Superato
                            </span>
                          )}
                          {getStatusBadge(auction.status, auction.ends_at)}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {auction.city}
                        </span>
                        <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">{auction.category}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-sm">
                          <span className="text-gray-500">La tua offerta: </span>
                          <span className="font-bold text-blue-600">{Number(auction.my_highest_bid).toFixed(2)} EUR</span>
                        </div>
                        {Number(auction.current_price) > 0 && (
                          <div className="text-sm">
                            <span className="text-gray-500">Miglior offerta: </span>
                            <span className="font-bold text-gray-800">{Number(auction.current_price).toFixed(2)} EUR</span>
                          </div>
                        )}
                        {(auction.bid_count || 0) > 0 && (
                          <span className="text-xs text-gray-500">{auction.bid_count} offert{auction.bid_count === 1 ? 'a' : 'e'}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex-shrink-0 text-right hidden sm:block">
                      {isActive && (
                        <div className="flex items-center gap-1.5 text-sm text-green-700 bg-green-50 px-3 py-1.5 rounded-lg">
                          <Clock className="w-4 h-4" />
                          <span className="font-medium">{getTimeRemaining(auction.ends_at)}</span>
                        </div>
                      )}
                    </div>
                  </a>
                );
              })}
            </div>
          )
        )}
      </div>
    </div>
  );
}