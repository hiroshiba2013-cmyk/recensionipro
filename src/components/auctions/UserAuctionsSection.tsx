import { useState, useEffect } from 'react';
import { Gavel, Clock, TrendingUp, Eye, Plus, AlertCircle, Trophy, MapPin, X, CheckCircle } from 'lucide-react';
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
  approval_status: string;
  city: string;
  province: string;
  ends_at: string;
  completed_at: string | null;
  winner_id: string | null;
  winner_family_member_id: string | null;
  created_at: string;
  bid_count?: number;
  current_bidder_nickname?: string;
}

interface ParticipatingAuction extends Auction {
  my_highest_bid: number;
  is_winning: boolean;
}

interface Props {
  businessLocationId?: string | null;
  isRegisteredBusiness?: boolean;
}

type MainTab = 'my' | 'participating';
type SubTab = 'active' | 'concluded';

export function UserAuctionsSection({ businessLocationId, isRegisteredBusiness }: Props) {
  const { user, activeProfile, profile } = useAuth();
  const [myAuctions, setMyAuctions] = useState<Auction[]>([]);
  const [participatingAuctions, setParticipatingAuctions] = useState<ParticipatingAuction[]>([]);
  const [mainTab, setMainTab] = useState<MainTab>('my');
  const [mySubTab, setMySubTab] = useState<SubTab>('active');
  const [partSubTab, setPartSubTab] = useState<SubTab>('active');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Determine current profile identity
  // - business users: no family members, activeProfile is a location
  // - customer users: activeProfile can be owner (isOwner=true) or a family member
  const familyMemberId =
    profile?.user_type !== 'business' && activeProfile && !activeProfile.isOwner
      ? activeProfile.id
      : null;

  useEffect(() => {
    if (user) loadAuctions();
    else setLoading(false);
  }, [user, activeProfile, businessLocationId]);

  async function loadAuctions() {
    if (!user) return;
    setLoading(true);
    try {
      await Promise.all([loadMyAuctions(), loadParticipatingAuctions()]);
    } finally {
      setLoading(false);
    }
  }

  async function loadMyAuctions() {
    let query = supabase
      .from('auctions')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false });

    // Strict identity filter: owner sees only their own, family member sees only theirs
    if (familyMemberId) {
      query = query.eq('family_member_id', familyMemberId);
    } else {
      query = query.is('family_member_id', null);
    }

    if (businessLocationId) {
      const col = isRegisteredBusiness ? 'registered_business_location_id' : 'business_location_id';
      query = query.eq(col, businessLocationId);
    }

    const { data } = await query;
    if (!data) return;

    const withBids = await Promise.all(
      data.map(async (auction) => {
        const { count } = await supabase
          .from('auction_bids')
          .select('id', { count: 'exact', head: true })
          .eq('auction_id', auction.id);
        return { ...auction, bid_count: count || 0 };
      })
    );
    setMyAuctions(withBids);
  }

  async function loadParticipatingAuctions() {
    let bidsQuery = supabase
      .from('auction_bids')
      .select('auction_id, bid_amount')
      .eq('user_id', user!.id);

    if (familyMemberId) {
      bidsQuery = bidsQuery.eq('family_member_id', familyMemberId);
    } else {
      bidsQuery = bidsQuery.is('family_member_id', null);
    }

    const { data: myBids } = await bidsQuery;

    if (!myBids || myBids.length === 0) {
      setParticipatingAuctions([]);
      return;
    }

    const bidMap = new Map<string, number>();
    myBids.forEach(b => {
      const cur = bidMap.get(b.auction_id) || 0;
      if (b.bid_amount > cur) bidMap.set(b.auction_id, b.bid_amount);
    });

    const { data: auctionsData } = await supabase
      .from('auctions')
      .select('*')
      .in('id', [...bidMap.keys()])
      .neq('user_id', user!.id) // exclude own auctions from "participating"
      .order('ends_at', { ascending: true });

    if (!auctionsData) return;

    const enriched: ParticipatingAuction[] = await Promise.all(
      auctionsData.map(async (auction) => {
        const { data: topBid } = await supabase
          .from('auction_bids')
          .select('bid_amount, user_id, family_member_id')
          .eq('auction_id', auction.id)
          .order('bid_amount', { ascending: false })
          .limit(1)
          .maybeSingle();

        const isWinning = topBid
          ? topBid.user_id === user!.id &&
            (familyMemberId
              ? topBid.family_member_id === familyMemberId
              : !topBid.family_member_id)
          : false;

        const { count } = await supabase
          .from('auction_bids')
          .select('id', { count: 'exact', head: true })
          .eq('auction_id', auction.id);

        return {
          ...auction,
          my_highest_bid: bidMap.get(auction.id) || 0,
          is_winning: isWinning,
          bid_count: count || 0,
        };
      })
    );
    setParticipatingAuctions(enriched);
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  function isExpired(auction: Auction) {
    return auction.status === 'completed' || new Date(auction.ends_at) <= new Date();
  }

  function getTimeRemaining(endsAt: string) {
    const diff = new Date(endsAt).getTime() - Date.now();
    if (diff <= 0) return 'Terminata';
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    if (days > 0) return `${days}g ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  }

  function StatusBadge({ auction }: { auction: Auction }) {
    if (auction.approval_status === 'pending') {
      return <span className="px-2.5 py-1 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-full">In approvazione</span>;
    }
    if (auction.approval_status === 'rejected') {
      return <span className="px-2.5 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full">Non approvata</span>;
    }
    if (auction.status === 'completed' || new Date(auction.ends_at) <= new Date()) {
      return <span className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded-full">Conclusa</span>;
    }
    if (auction.status === 'cancelled') {
      return <span className="px-2.5 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full">Annullata</span>;
    }
    return <span className="px-2.5 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">Attiva</span>;
  }

  // ── Derived lists ─────────────────────────────────────────────────────────

  const myActive    = myAuctions.filter(a => !isExpired(a) && a.approval_status !== 'rejected');
  const myConcluded = myAuctions.filter(a => isExpired(a) || a.approval_status === 'rejected' || a.status === 'cancelled');
  const partActive    = participatingAuctions.filter(a => !isExpired(a));
  const partConcluded = participatingAuctions.filter(a => isExpired(a));

  const myList   = mySubTab === 'active' ? myActive : myConcluded;
  const partList = partSubTab === 'active' ? partActive : partConcluded;

  // ── Render ────────────────────────────────────────────────────────────────

  function SubTabs({
    active, concluded, value, onChange,
  }: { active: number; concluded: number; value: SubTab; onChange: (v: SubTab) => void }) {
    return (
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-4">
        <button
          onClick={() => onChange('active')}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
            value === 'active' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
          Attive ({active})
        </button>
        <button
          onClick={() => onChange('concluded')}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
            value === 'concluded' ? 'bg-white text-gray-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <CheckCircle className="w-3.5 h-3.5" />
          Concluse ({concluded})
        </button>
      </div>
    );
  }

  function AuctionRow({ auction }: { auction: Auction }) {
    const expired = isExpired(auction);
    return (
      <a
        href={`/auctions/${auction.id}`}
        className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:border-orange-300 hover:bg-orange-50/50 transition-all group"
      >
        <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
          {auction.images?.length > 0 ? (
            <img src={auction.images[0]} alt={auction.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-orange-50">
              <Gavel className="w-8 h-8 text-orange-300" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-semibold text-gray-900 truncate group-hover:text-orange-700 transition-colors">{auction.title}</h3>
            <StatusBadge auction={auction} />
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-500 mb-2">
            <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{auction.city}</span>
            <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">{auction.category}</span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span><span className="text-gray-500">Base: </span><span className="font-semibold text-gray-800">{Number(auction.base_price).toFixed(2)} EUR</span></span>
            {Number(auction.current_price) > 0 && (
              <span>
                <span className="text-gray-500">Attuale: </span>
                <span className="font-bold text-orange-600">{Number(auction.current_price).toFixed(2)} EUR</span>
                {auction.current_bidder_nickname && (
                  <span className="text-xs text-gray-500 ml-1">di <span className="font-semibold text-gray-700">{auction.current_bidder_nickname}</span></span>
                )}
              </span>
            )}
            {(auction.bid_count || 0) > 0 && (
              <span className="text-xs text-gray-500">{auction.bid_count} offert{auction.bid_count === 1 ? 'a' : 'e'}</span>
            )}
          </div>
        </div>

        <div className="flex-shrink-0 hidden sm:block">
          {!expired && auction.status === 'active' && (
            <div className="flex items-center gap-1.5 text-sm text-green-700 bg-green-50 px-3 py-1.5 rounded-lg">
              <Clock className="w-4 h-4" />
              <span className="font-medium">{getTimeRemaining(auction.ends_at)}</span>
            </div>
          )}
        </div>
      </a>
    );
  }

  function PartRow({ auction }: { auction: ParticipatingAuction }) {
    const expired = isExpired(auction);
    return (
      <a
        href={`/auctions/${auction.id}`}
        className={`flex items-center gap-4 p-4 rounded-xl border transition-all group ${
          auction.is_winning && expired
            ? 'border-yellow-300 bg-yellow-50/50 hover:bg-yellow-50'
            : auction.is_winning
            ? 'border-green-300 bg-green-50/50 hover:bg-green-50'
            : expired
            ? 'border-gray-200 bg-gray-50/50 hover:bg-gray-50'
            : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/50'
        }`}
      >
        <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
          {auction.images?.length > 0 ? (
            <img src={auction.images[0]} alt={auction.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-blue-50">
              <Gavel className="w-8 h-8 text-blue-300" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-semibold text-gray-900 truncate group-hover:text-blue-700 transition-colors">{auction.title}</h3>
            <div className="flex items-center gap-2 flex-shrink-0">
              {auction.is_winning ? (
                <span className="flex items-center gap-1 px-2.5 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                  <Trophy className="w-3 h-3" />
                  {expired ? 'Vinto' : 'In testa'}
                </span>
              ) : (
                <span className="flex items-center gap-1 px-2.5 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full">
                  <AlertCircle className="w-3 h-3" />
                  {expired ? 'Non vinto' : 'Superato'}
                </span>
              )}
              <StatusBadge auction={auction} />
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-500 mb-2">
            <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{auction.city}</span>
            <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">{auction.category}</span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span><span className="text-gray-500">La tua offerta: </span><span className="font-bold text-blue-600">{Number(auction.my_highest_bid).toFixed(2)} EUR</span></span>
            {Number(auction.current_price) > 0 && (
              <span>
                <span className="text-gray-500">Miglior offerta: </span>
                <span className="font-bold text-gray-800">{Number(auction.current_price).toFixed(2)} EUR</span>
                {auction.current_bidder_nickname && (
                  <span className="text-xs text-gray-500 ml-1">di <span className="font-semibold text-gray-700">{auction.current_bidder_nickname}</span></span>
                )}
              </span>
            )}
            {(auction.bid_count || 0) > 0 && (
              <span className="text-xs text-gray-500">{auction.bid_count} offert{auction.bid_count === 1 ? 'a' : 'e'}</span>
            )}
          </div>
        </div>

        <div className="flex-shrink-0 hidden sm:block">
          {!expired && (
            <div className="flex items-center gap-1.5 text-sm text-green-700 bg-green-50 px-3 py-1.5 rounded-lg">
              <Clock className="w-4 h-4" />
              <span className="font-medium">{getTimeRemaining(auction.ends_at)}</span>
            </div>
          )}
        </div>
      </a>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden border-2 border-orange-200">
      {/* Header */}
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

      {/* Create form */}
      {showForm && (
        <div className="p-6 border-b border-gray-200 bg-orange-50/50">
          <AuctionForm
            businessLocationId={businessLocationId}
            isRegisteredBusiness={isRegisteredBusiness}
            onSuccess={() => { setShowForm(false); loadAuctions(); }}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {/* Main tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setMainTab('my')}
          className={`flex-1 flex items-center justify-center gap-2 px-6 py-3.5 font-semibold text-sm transition-all ${
            mainTab === 'my'
              ? 'bg-orange-50 text-orange-700 border-b-2 border-orange-500'
              : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
          }`}
        >
          <Gavel className="w-4 h-4" />
          Le Mie Aste
          {myAuctions.length > 0 && (
            <span className={`min-w-[22px] h-[22px] flex items-center justify-center px-1.5 rounded-full text-xs font-bold ${
              mainTab === 'my' ? 'bg-orange-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}>{myAuctions.length}</span>
          )}
        </button>
        <button
          onClick={() => setMainTab('participating')}
          className={`flex-1 flex items-center justify-center gap-2 px-6 py-3.5 font-semibold text-sm transition-all ${
            mainTab === 'participating'
              ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-500'
              : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          Partecipo
          {participatingAuctions.length > 0 && (
            <span className={`min-w-[22px] h-[22px] flex items-center justify-center px-1.5 rounded-full text-xs font-bold ${
              mainTab === 'participating' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}>{participatingAuctions.length}</span>
          )}
        </button>
      </div>

      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
          </div>
        ) : mainTab === 'my' ? (
          <>
            <SubTabs
              active={myActive.length}
              concluded={myConcluded.length}
              value={mySubTab}
              onChange={setMySubTab}
            />
            {myList.length === 0 ? (
              <div className="text-center py-10">
                {mySubTab === 'active' ? (
                  <>
                    <Gavel className="w-14 h-14 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">Nessuna asta attiva</h3>
                    <p className="text-gray-500 text-sm mb-6">Non hai aste attive al momento.</p>
                    <button
                      onClick={() => setShowForm(true)}
                      className="inline-flex items-center gap-2 bg-orange-600 text-white px-6 py-3 rounded-xl hover:bg-orange-700 transition-colors font-semibold"
                    >
                      <Plus className="w-5 h-5" />
                      Crea la tua prima asta
                    </button>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-14 h-14 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">Nessuna asta conclusa</h3>
                    <p className="text-gray-500 text-sm">Le aste terminate appariranno qui.</p>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {myList.map(a => <AuctionRow key={a.id} auction={a} />)}
              </div>
            )}
          </>
        ) : (
          <>
            <SubTabs
              active={partActive.length}
              concluded={partConcluded.length}
              value={partSubTab}
              onChange={setPartSubTab}
            />
            {partList.length === 0 ? (
              <div className="text-center py-10">
                {partSubTab === 'active' ? (
                  <>
                    <TrendingUp className="w-14 h-14 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">Nessuna partecipazione attiva</h3>
                    <p className="text-gray-500 text-sm mb-6">Non stai partecipando a nessuna asta.</p>
                    <a
                      href="/auctions"
                      className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors font-semibold"
                    >
                      <Eye className="w-5 h-5" />
                      Esplora le aste
                    </a>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-14 h-14 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">Nessuna asta conclusa</h3>
                    <p className="text-gray-500 text-sm">Le aste a cui hai partecipato e che sono terminate appariranno qui.</p>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {partList.map(a => <PartRow key={a.id} auction={a} />)}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
