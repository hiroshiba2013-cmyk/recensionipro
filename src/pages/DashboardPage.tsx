import { useState, useEffect } from 'react';
import { Plus, Star, Building, MessageSquare, User, Check, Shield, TrendingUp, Heart, Gift, Users as UsersIcon, Package, Briefcase, Users, DollarSign, Trophy, Activity, Tag } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Business, Review, FamilyMember } from '../lib/supabase';
import { BusinessJobPostingForm } from '../components/business/BusinessJobPostingForm';
import { EditBusinessLocationsForm } from '../components/business/EditBusinessLocationsForm';
import { EditBusinessForm } from '../components/business/EditBusinessForm';
import { CreateBusinessForm } from '../components/business/CreateBusinessForm';
import { ReviewResponseForm } from '../components/reviews/ReviewResponseForm';
import { ImportBusinessesForm } from '../components/business/ImportBusinessesForm';
import { FavoritesSection } from '../components/favorites/FavoritesSection';
import TrialStatusBanner from '../components/subscription/TrialStatusBanner';
import TrialExpirationModal from '../components/subscription/TrialExpirationModal';
import { ActivityFeed } from '../components/activity/ActivityFeed';
import { UserAuctionsSection } from '../components/auctions/UserAuctionsSection';
import { ProfileClassifiedAdCard } from '../components/classifieds/ProfileClassifiedAdCard';
import { ClassifiedAdForm } from '../components/classifieds/ClassifiedAdForm';
import { useNavigate } from '../components/Router';

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  billing_period: 'monthly' | 'yearly';
  max_persons: number;
}

interface Subscription {
  id: string;
  plan: SubscriptionPlan;
  status: string;
  start_date: string;
  end_date: string;
  trial_end_date?: string;
}

interface Product {
  id: string;
  business_id: string;
  location_id: string | null;
  name: string;
  created_at: string;
}

interface JobPosting {
  id: string;
  business_id: string;
  location_id: string | null;
  title: string;
  created_at: string;
}

interface JobSeeker {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: string;
  city: string;
  province: string;
  created_at: string;
  profiles: {
    full_name: string;
    nickname: string | null;
    avatar_url: string | null;
  };
}

interface TopLocation {
  id: string;
  name: string;
  internal_name: string;
  city: string;
  province: string;
  avg_rating: number;
  review_count: number;
  business: {
    name: string;
  };
}

interface SolidarityStats {
  total_revenue: number;
  charity_amount: number;
}

export function DashboardPage() {
  const { profile, selectedBusinessLocationId, activeProfile } = useAuth();
  const navigate = useNavigate();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([]);
  const [jobSeekers, setJobSeekers] = useState<JobSeeker[]>([]);
  const [topLocations, setTopLocations] = useState<TopLocation[]>([]);
  const [solidarityStats, setSolidarityStats] = useState<SolidarityStats | null>(null);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);

  console.log('🔍 DASHBOARD DEBUG:', {
    jobSeekersCount: jobSeekers.length,
    topLocationsCount: topLocations.length,
    solidarityStats
  });
  const [showCreateBusinessForm, setShowCreateBusinessForm] = useState(false);
  const [showResponseForm, setShowResponseForm] = useState<string | null>(null);
  const [businessClassifiedAds, setBusinessClassifiedAds] = useState<any[]>([]);
  const [showClassifiedAdForm, setShowClassifiedAdForm] = useState(false);
  const [editingClassifiedAdId, setEditingClassifiedAdId] = useState<string | undefined>(undefined);
  const [customerClassifiedAds, setCustomerClassifiedAds] = useState<any[]>([]);
  const [showCustomerAdForm, setShowCustomerAdForm] = useState(false);
  const [editingCustomerAdId, setEditingCustomerAdId] = useState<string | undefined>(undefined);
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null);
  const [isRegisteredBusiness, setIsRegisteredBusiness] = useState(false);
  const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null);
  const [availablePlans, setAvailablePlans] = useState<SubscriptionPlan[]>([]);
  const [upgradeMessage, setUpgradeMessage] = useState('');
  const [leaderboardTab, setLeaderboardTab] = useState<'leaderboard' | 'my_activities'>('leaderboard');
  const [userRank, setUserRank] = useState<{ points: number; rank: number; reviews_count: number } | null>(null);

  const loadBusinessClassifiedAds = async () => {
    if (!profile) return;
    const { data, error } = await supabase
      .from('classified_ads')
      .select('*, classified_categories(name, icon)')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false });
    console.log('📢 Business classified ads:', data, 'error:', error, 'profile.id:', profile.id);
    if (data) setBusinessClassifiedAds(data);
  };

  const loadCustomerClassifiedAds = async () => {
    if (!profile) return;
    const familyMemberId = activeProfile && !activeProfile.isOwner ? activeProfile.id : null;
    let query = supabase
      .from('classified_ads')
      .select('*, classified_categories(name, icon)')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false });
    if (familyMemberId) {
      query = query.eq('family_member_id', familyMemberId);
    } else {
      query = query.is('family_member_id', null);
    }
    const { data } = await query;
    if (data) setCustomerClassifiedAds(data);
  };

  const deleteClassifiedAd = async (adId: string) => {
    await supabase.from('classified_ads').delete().eq('id', adId);
    if (profile?.user_type === 'business') {
      loadBusinessClassifiedAds();
    } else {
      loadCustomerClassifiedAds();
    }
  };

  useEffect(() => {
    if (!profile) return;
    loadDashboardData();
    loadSubscriptionData();

    // Load classified ads directly here to avoid closure issues
    const currentProfileId = profile.id;
    const currentUserType = profile.user_type;
    const currentFamilyMemberId = activeProfile && !activeProfile.isOwner ? activeProfile.id : null;

    if (currentUserType === 'business') {
      supabase
        .from('classified_ads')
        .select('*, classified_categories(name, icon)')
        .eq('user_id', currentProfileId)
        .order('created_at', { ascending: false })
        .then(({ data, error }) => {
          console.log('📢 Ads caricati:', data?.length, 'errore:', error);
          if (data) setBusinessClassifiedAds(data);
        });
    } else {
      let query = supabase
        .from('classified_ads')
        .select('*, classified_categories(name, icon)')
        .eq('user_id', currentProfileId)
        .order('created_at', { ascending: false });
      if (currentFamilyMemberId) {
        query = query.eq('family_member_id', currentFamilyMemberId);
      } else {
        query = query.is('family_member_id', null);
      }
      query.then(({ data }) => {
        if (data) setCustomerClassifiedAds(data);
      });
    }
  }, [profile, selectedBusinessLocationId, activeProfile]);

  const loadDashboardData = async () => {
    if (!profile) return;

    console.log('🔄 Caricamento dati dashboard per sede:', selectedBusinessLocationId || 'TUTTE');

    setLoading(true);

    // Reset dei dati quando cambia la sede
    setReviews([]);
    setProducts([]);
    setJobPostings([]);
    setJobSeekers([]);
    setTopLocations([]);

    try {
      if (profile.user_type === 'business') {
        console.log('🔄 Caricamento job seekers...');
        const { data: jobSeekersData, error: jobSeekersError } = await supabase
          .from('job_seekers')
          .select(`
            *,
            profiles!inner(full_name, nickname, avatar_url)
          `)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(10);

        if (jobSeekersError) {
          console.error('❌ Errore caricamento job seekers:', jobSeekersError);
        } else {
          console.log('✅ Job seekers caricati:', jobSeekersData?.length || 0);
          if (jobSeekersData) {
            setJobSeekers(jobSeekersData);
          }
        }

        console.log('🔄 Caricamento top locations...');
        const { data: topLocationsData, error: topLocationsError } = await supabase
          .rpc('get_top_business_locations', { limit_count: 10 });

        if (topLocationsError) {
          console.error('❌ Errore caricamento top locations:', topLocationsError);
        } else {
          console.log('✅ Top locations caricate:', topLocationsData?.length || 0);
          if (topLocationsData) {
            setTopLocations(topLocationsData);
          }
        }

        console.log('🔄 Caricamento statistiche solidarietà...');
        const { data: revenueData, error: revenueError } = await supabase
          .rpc('get_total_revenue');

        if (revenueError) {
          console.error('❌ Errore caricamento statistiche solidarietà:', revenueError);
        } else if (revenueData !== null) {
          console.log('✅ Statistiche solidarietà caricate:', revenueData);
          const totalRevenue = revenueData;
          const charityAmount = totalRevenue * 0.1;
          setSolidarityStats({
            total_revenue: totalRevenue,
            charity_amount: charityAmount,
          });
        }
        // Cerca prima in registered_businesses (nuovo sistema)
        let { data: registeredData } = await supabase
          .from('registered_businesses')
          .select('*')
          .eq('owner_id', profile.id);

        let isRegistered = false;
        let businessesData: any[] | null = registeredData;

        // Fallback a businesses (vecchio sistema)
        if (!businessesData || businessesData.length === 0) {
          const result = await supabase
            .from('businesses')
            .select('*')
            .eq('owner_id', profile.id);
          businessesData = result.data;
        } else {
          isRegistered = true;
        }

        setIsRegisteredBusiness(isRegistered);

        if (businessesData) {
          setBusinesses(businessesData);

          if (businessesData.length > 0) {
            setSelectedBusinessId(businessesData[0].id);
          }

          if (businessesData.length > 0) {
            const businessIds = businessesData.map(b => b.id);

            // Filtra recensioni per sede se una sede è selezionata
            let reviewsQuery = supabase
              .from('reviews')
              .select(`
                *,
                customer:profiles!customer_id(full_name),
                responses:review_responses(*),
                business_location:business_locations(internal_name, address),
                registered_location:registered_business_locations(internal_name, street, city)
              `)
              .in('business_id', businessIds)
              .eq('review_status', 'approved')
              .order('created_at', { ascending: false });

            if (selectedBusinessLocationId) {
              reviewsQuery = reviewsQuery.or(`business_location_id.eq.${selectedBusinessLocationId},registered_location_id.eq.${selectedBusinessLocationId}`);
            }

            const { data: reviewsData } = await reviewsQuery;

            console.log('📊 Recensioni caricate:', reviewsData?.length || 0, 'per sede:', selectedBusinessLocationId || 'TUTTE');

            if (reviewsData) {
              setReviews(reviewsData);
            }

            // Filtra prodotti per sede se una sede è selezionata
            let productsQuery = supabase
              .from('products')
              .select('*')
              .in('business_id', businessIds)
              .order('created_at', { ascending: false });

            if (selectedBusinessLocationId) {
              productsQuery = productsQuery.eq('location_id', selectedBusinessLocationId);
            }

            const { data: productsData } = await productsQuery;

            console.log('📦 Prodotti caricati:', productsData?.length || 0, 'per sede:', selectedBusinessLocationId || 'TUTTE');

            if (productsData) {
              setProducts(productsData);
            }

            // Filtra offerte di lavoro per sede - due query separate (vecchio e nuovo sistema)
            const [jpOld, jpNew] = await Promise.all([
              supabase
                .from('job_postings')
                .select('*')
                .in('business_id', businessIds)
                .is('registered_business_id', null)
                .then(r => r.data || []),
              supabase
                .from('job_postings')
                .select('*')
                .in('registered_business_id', businessIds)
                .then(r => r.data || []),
            ]);
            let allJobPostings = [...jpOld, ...jpNew];

            if (selectedBusinessLocationId) {
              allJobPostings = allJobPostings.filter(jp =>
                jp.business_location_id === selectedBusinessLocationId ||
                jp.registered_business_location_id === selectedBusinessLocationId
              );
            }

            allJobPostings.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            const jobPostingsData = allJobPostings;

            console.log('💼 Offerte lavoro caricate:', jobPostingsData?.length || 0, 'per sede:', selectedBusinessLocationId || 'TUTTE');

            if (jobPostingsData) {
              setJobPostings(jobPostingsData);
            }
          }
        }
      } else {
        const { data: familyMembersData } = await supabase
          .from('customer_family_members')
          .select('*')
          .eq('customer_id', profile.id)
          .order('created_at', { ascending: true });

        if (familyMembersData) {
          setFamilyMembers(familyMembersData);
        }

        const { data: reviewsData } = await supabase
          .from('reviews')
          .select(`
            *,
            business:businesses(name),
            family_member:customer_family_members(*)
          `)
          .eq('customer_id', profile.id)
          .order('created_at', { ascending: false });

        if (reviewsData) {
          setReviews(reviewsData);
        }

        // Load user ranking
        const familyMemberId = activeProfile?.isOwner === false ? activeProfile.id : null;
        const activityQuery = supabase
          .from('user_activity')
          .select('total_points, reviews_count')
          .eq('user_id', profile.id);

        if (familyMemberId) {
          activityQuery.eq('family_member_id', familyMemberId);
        } else {
          activityQuery.is('family_member_id', null);
        }

        const { data: activityData } = await activityQuery.maybeSingle();
        const totalPoints = activityData?.total_points || 0;

        const { count: higherCount } = await supabase
          .from('user_activity')
          .select('*', { count: 'exact', head: true })
          .gt('total_points', totalPoints);

        setUserRank({
          points: totalPoints,
          rank: (higherCount || 0) + 1,
          reviews_count: activityData?.reviews_count || 0,
        });
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSubscriptionData = async () => {
    if (!profile) return;

    try {
      // Get all active/trial subscriptions ordered by creation date (most recent first)
      const { data: subscriptionsData } = await supabase
        .from('subscriptions')
        .select('id, status, start_date, end_date, trial_end_date, plan:subscription_plans(id, name, price, billing_period, max_persons)')
        .eq('customer_id', profile.id)
        .in('status', ['active', 'trial'])
        .order('created_at', { ascending: false });

      // Use the most recent subscription
      if (subscriptionsData && subscriptionsData.length > 0) {
        setCurrentSubscription(subscriptionsData[0] as any);

        // If there are duplicate subscriptions, log a warning
        if (subscriptionsData.length > 1) {
          console.warn('⚠️ Trovate subscription duplicate per l\'utente:', profile.id, subscriptionsData.length);
        }
      }

      if (profile.user_type === 'business') {
        const { data: plansData } = await supabase
          .from('subscription_plans')
          .select('*')
          .like('name', '%Business%')
          .order('billing_period')
          .order('max_persons');

        if (plansData) {
          setAvailablePlans(plansData);
        }
      } else {
        const { data: plansData } = await supabase
          .from('subscription_plans')
          .select('*')
          .not('name', 'like', '%Business%')
          .order('max_persons')
          .order('billing_period');

        if (plansData) {
          setAvailablePlans(plansData);
        }
      }
    } catch (error) {
      console.error('Error loading subscription data:', error);
    }
  };

  const calculateSavings = (plan: SubscriptionPlan) => {
    if (plan.billing_period !== 'yearly') return null;

    const monthlyPlan = availablePlans.find(
      p => p.max_persons === plan.max_persons && p.billing_period === 'monthly'
    );

    if (!monthlyPlan) return null;

    const yearlyIfMonthly = monthlyPlan.price * 12;
    return yearlyIfMonthly - plan.price;
  };

  const handleChangePlan = async (planId: string) => {
    if (!profile || !currentSubscription) return;

    setUpgradeMessage('');

    try {
      const selectedPlan = availablePlans.find(p => p.id === planId);
      if (!selectedPlan) throw new Error('Piano non trovato');

      const endDate = new Date();
      if (selectedPlan.billing_period === 'monthly') {
        endDate.setMonth(endDate.getMonth() + 1);
      } else {
        endDate.setFullYear(endDate.getFullYear() + 1);
      }

      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({
          plan_id: planId,
          end_date: endDate.toISOString(),
          status: 'active',
        })
        .eq('id', currentSubscription.id);

      if (updateError) throw updateError;

      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          subscription_type: selectedPlan.billing_period === 'monthly' ? 'monthly' : 'annual',
          subscription_status: 'active',
          subscription_expires_at: endDate.toISOString(),
        })
        .eq('id', profile.id);

      if (profileError) throw profileError;

      setUpgradeMessage('Piano aggiornato con successo!');

      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error('Error changing plan:', error);
      setUpgradeMessage('Errore durante il cambio del piano');
    }
  };

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Caricamento profilo...</p>
      </div>
    );
  }

  console.log('Dashboard - Profile:', {
    user_type: profile.user_type,
    subscription_status: profile.subscription_status,
    subscription_type: profile.subscription_type,
  });

  if (profile.subscription_status !== 'active' && profile.subscription_status !== 'trial') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-md">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Abbonamento Necessario
          </h2>
          <p className="text-gray-600 mb-4">
            Per accedere alla dashboard e utilizzare tutte le funzionalità, attiva un abbonamento.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Stato attuale: {profile.subscription_status || 'nessuno'}
          </p>
          <a
            href="/subscription"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Vedi Piani
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-purple-50 py-8">
      <TrialExpirationModal />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 bg-gradient-to-r from-blue-100 to-purple-100 rounded-2xl p-8 shadow-lg border-4 border-blue-200">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Dashboard {profile.user_type === 'business' ? 'Attività' : 'Cliente'}
              </h1>
              <p className="text-gray-700 text-lg font-medium">
                Benvenuto, {activeProfile ? (activeProfile.nickname || activeProfile.name) : profile.full_name}!
              </p>
            </div>
            {currentSubscription && (
              <div className="bg-white rounded-xl p-4 shadow-md border-2 border-blue-300">
                <p className="text-xs text-gray-600 mb-1">Piano Attivo</p>
                <p className="text-lg font-bold text-gray-900">{currentSubscription.plan.name}</p>
                <p className="text-sm font-semibold text-blue-600">
                  {currentSubscription.plan.billing_period === 'monthly' ? 'Abbonamento Mensile' : 'Abbonamento Annuale'}
                </p>
                {currentSubscription.status === 'trial' && (
                  <p className="text-xs text-purple-600 font-semibold mt-1">Periodo di prova</p>
                )}
              </div>
            )}
          </div>
        </div>

        {profile.user_type === 'business' && (
          <TrialStatusBanner
            onUpgradeClick={() => navigate('/subscription')}
          />
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="space-y-8">
            {profile.user_type === 'business' ? (
              <>
                {/* Statistiche sede selezionata */}
                {selectedBusinessLocationId && (
                  <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-blue-600" />
                      Statistiche Sede
                    </h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-yellow-50 rounded-xl p-4 text-center border border-yellow-200">
                        <Star className="w-5 h-5 text-yellow-600 mx-auto mb-1" />
                        <p className="text-2xl font-bold text-yellow-600">{reviews.length}</p>
                        <p className="text-xs text-gray-600 font-medium">Recensioni</p>
                      </div>
                      <div className="bg-blue-50 rounded-xl p-4 text-center border border-blue-200">
                        <Package className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                        <p className="text-2xl font-bold text-blue-600">{products.length}</p>
                        <p className="text-xs text-gray-600 font-medium">Prodotti</p>
                      </div>
                      <div className="bg-orange-50 rounded-xl p-4 text-center border border-orange-200">
                        <Briefcase className="w-5 h-5 text-orange-600 mx-auto mb-1" />
                        <p className="text-2xl font-bold text-orange-600">{jobPostings.length}</p>
                        <p className="text-xs text-gray-600 font-medium">Offerte Lavoro</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Aste */}
                <UserAuctionsSection />

                {/* Annunci classificati */}
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden border-2 border-green-100">
                  <div className="bg-gradient-to-r from-green-600 to-teal-600 px-6 py-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-bold text-white flex items-center gap-3">
                        <Tag className="w-6 h-6" />
                        I Miei Annunci
                      </h2>
                      <button
                        onClick={() => { setEditingClassifiedAdId(undefined); setShowClassifiedAdForm(true); }}
                        className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Nuovo Annuncio
                      </button>
                    </div>
                  </div>

                  {showClassifiedAdForm && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <ClassifiedAdForm
                          adId={editingClassifiedAdId}
                          onSuccess={() => { setShowClassifiedAdForm(false); loadBusinessClassifiedAds(); }}
                          onCancel={() => setShowClassifiedAdForm(false)}
                        />
                      </div>
                    </div>
                  )}

                  <div className="p-6">
                    {businessClassifiedAds.length === 0 ? (
                      <div className="text-center py-10">
                        <Tag className="w-14 h-14 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">Nessun annuncio</h3>
                        <p className="text-gray-500 text-sm mb-6">Pubblica annunci di vendita, acquisto o regalo.</p>
                        <button
                          onClick={() => { setEditingClassifiedAdId(undefined); setShowClassifiedAdForm(true); }}
                          className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 transition-colors font-semibold"
                        >
                          <Plus className="w-5 h-5" />
                          Crea il primo annuncio
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {businessClassifiedAds.map(ad => (
                          <ProfileClassifiedAdCard
                            key={ad.id}
                            ad={{
                              ...ad,
                              price: ad.price ? parseFloat(ad.price) : null,
                              classified_categories: ad.classified_categories,
                              profiles: { full_name: profile?.nickname || profile?.full_name || 'Utente', avatar_url: null },
                            }}
                            onEdit={(ad) => { setEditingClassifiedAdId(ad.id); setShowClassifiedAdForm(true); }}
                            onDelete={deleteClassifiedAd}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Offerte di lavoro */}
                {!loading && (selectedBusinessId || businesses[0]?.id) && (
                  <BusinessJobPostingForm
                    key={`${selectedBusinessId || businesses[0]?.id}-${selectedBusinessLocationId || 'all'}`}
                    businessId={(selectedBusinessId || businesses[0]?.id)!}
                    isRegisteredBusiness={isRegisteredBusiness}
                    selectedLocationId={selectedBusinessLocationId || undefined}
                  />
                )}

                {/* Recensioni */}
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
                  <div className="bg-gradient-to-r from-yellow-500 to-amber-500 px-6 py-4">
                    <h2 className="text-xl font-bold text-white flex items-center gap-3">
                      <Star className="w-6 h-6" />
                      {selectedBusinessLocationId ? 'Recensioni Sede' : 'Recensioni Ricevute'}
                    </h2>
                  </div>
                  <div className="p-6">
                    {reviews.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">
                        {selectedBusinessLocationId ? 'Nessuna recensione per questa sede' : 'Nessuna recensione ricevuta'}
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {reviews.map((review) => (
                          <div key={review.id} className="border border-gray-200 rounded-xl p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex">
                                {[...Array(5)].map((_, i) => (
                                  <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                                ))}
                              </div>
                              <span className="text-sm text-gray-500">{new Date(review.created_at).toLocaleDateString('it-IT')}</span>
                            </div>
                            <h4 className="font-semibold mb-1">{review.title}</h4>
                            <p className="text-gray-700 text-sm">{review.content}</p>
                            {!review.responses || review.responses.length === 0 ? (
                              <button onClick={() => setShowResponseForm(review.id)} className="mt-3 text-blue-600 text-sm hover:text-blue-700 flex items-center gap-1">
                                <MessageSquare className="w-4 h-4" />
                                Rispondi
                              </button>
                            ) : (
                              <div className="mt-3 pl-4 border-l-2 border-blue-200">
                                <p className="text-sm font-medium text-gray-600 mb-1">La tua risposta:</p>
                                <p className="text-sm text-gray-700">{review.responses[0].content}</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Preferiti */}
                <FavoritesSection />

                {/* Gestione attività — solo su tutte le sedi */}
                {!selectedBusinessLocationId && (
                  <>
                    {showCreateBusinessForm ? (
                      <CreateBusinessForm
                        ownerId={profile.id}
                        onSuccess={() => { setShowCreateBusinessForm(false); loadDashboardData(); }}
                        onCancel={() => setShowCreateBusinessForm(false)}
                      />
                    ) : (
                      <>
                        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
                          <div className="bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-4">
                            <div className="flex items-center justify-between">
                              <h2 className="text-xl font-bold text-white flex items-center gap-3">
                                <Building className="w-6 h-6" />
                                Le Mie Attività
                              </h2>
                              <button
                                onClick={() => setShowCreateBusinessForm(true)}
                                className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"
                              >
                                <Plus className="w-4 h-4" />
                                Aggiungi
                              </button>
                            </div>
                          </div>
                          <div className="p-6">
                            {businesses.length === 0 ? (
                              <p className="text-gray-500 text-center py-6">Non hai ancora registrato nessuna attività</p>
                            ) : (
                              <div className="grid gap-3">
                                {businesses.map((business) => (
                                  <div
                                    key={business.id}
                                    onClick={() => setSelectedBusinessId(business.id)}
                                    className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${selectedBusinessId === business.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}
                                  >
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <h3 className="font-semibold text-gray-900">{business.name}</h3>
                                        <p className="text-gray-500 text-sm">{business.city}</p>
                                      </div>
                                      {business.verified ? (
                                        <span className="px-3 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">Verificato</span>
                                      ) : (
                                        <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full font-medium">In Attesa</span>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {selectedBusinessId && (
                          <>
                            <EditBusinessForm businessId={selectedBusinessId} selectedLocationId={selectedBusinessLocationId} onUpdate={loadDashboardData} />
                            <EditBusinessLocationsForm businessId={selectedBusinessId} selectedLocationId={selectedBusinessLocationId} onUpdate={loadDashboardData} />
                          </>
                        )}

                        <ImportBusinessesForm onImportComplete={loadDashboardData} />
                      </>
                    )}
                  </>
                )}

                {/* Cerco Lavoro */}
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
                  <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                    <h2 className="text-xl font-bold text-white flex items-center gap-3">
                      <Users className="w-6 h-6" />
                      Profili Cerco Lavoro
                    </h2>
                  </div>
                  <div className="p-6">
                    {jobSeekers.length === 0 ? (
                      <p className="text-gray-500 text-center py-6">Nessun profilo disponibile al momento</p>
                    ) : (
                      <div className="grid gap-3">
                        {jobSeekers.map((seeker) => (
                          <div key={seeker.id} className="border border-gray-200 rounded-xl p-4 hover:border-blue-300 transition-all">
                            <div className="flex items-start gap-3">
                              {seeker.profiles.avatar_url ? (
                                <img src={seeker.profiles.avatar_url} alt={seeker.profiles.full_name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold flex-shrink-0">
                                  {seeker.profiles.full_name.charAt(0)}
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <h3 className="font-semibold text-gray-900 truncate">{seeker.title}</h3>
                                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-medium flex-shrink-0">{seeker.category}</span>
                                </div>
                                <p className="text-sm text-gray-500">{seeker.profiles.nickname || seeker.profiles.full_name} · {seeker.city}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="mt-4 text-center">
                      <button onClick={() => navigate('/jobs')} className="text-blue-600 text-sm font-semibold hover:underline">
                        Vedi tutti i profili
                      </button>
                    </div>
                  </div>
                </div>

                {/* Solidarietà */}
                {solidarityStats && (
                  <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
                    <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4">
                      <h2 className="text-xl font-bold text-white flex items-center gap-3">
                        <Heart className="w-6 h-6" />
                        Solidarietà
                      </h2>
                    </div>
                    <div className="p-6">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                          <div className="flex items-center gap-2 mb-2">
                            <DollarSign className="w-5 h-5 text-green-600" />
                            <span className="text-sm font-semibold text-gray-700">Fatturato Totale</span>
                          </div>
                          <p className="text-2xl font-bold text-green-600">€{solidarityStats.total_revenue.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        </div>
                        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                          <div className="flex items-center gap-2 mb-2">
                            <Heart className="w-5 h-5 text-blue-600" />
                            <span className="text-sm font-semibold text-gray-700">Donato in Beneficenza</span>
                          </div>
                          <p className="text-2xl font-bold text-blue-600">€{solidarityStats.charity_amount.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        </div>
                      </div>
                      <div className="mt-4 text-center">
                        <button onClick={() => navigate('/solidarity')} className="text-green-600 text-sm font-semibold hover:underline">Scopri di più</button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Cambia Piano */}
                {currentSubscription && availablePlans.length > 0 && (
                  <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
                    <div className="bg-gradient-to-r from-gray-700 to-gray-800 px-6 py-4">
                      <h2 className="text-xl font-bold text-white">Cambia Piano</h2>
                    </div>
                    <div className="p-6">
                      {upgradeMessage && (
                        <div className={`mb-4 p-3 rounded-lg text-sm ${upgradeMessage.includes('successo') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {upgradeMessage}
                        </div>
                      )}
                      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {availablePlans.map((plan) => {
                          const monthlyEquivalent = availablePlans.find(p => p.max_persons === plan.max_persons && p.billing_period === 'monthly');
                          const isAnnual = plan.billing_period === 'yearly';
                          const savings = isAnnual && monthlyEquivalent ? (monthlyEquivalent.price * 12) - plan.price : null;
                          const isCurrent = currentSubscription.plan.id === plan.id;
                          return (
                            <div key={plan.id} className={`rounded-xl p-4 border-2 relative ${isCurrent ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}>
                              {isAnnual && !isCurrent && (
                                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-green-500 text-white text-xs font-bold px-2.5 py-0.5 rounded-full">RISPARMIO</span>
                              )}
                              <h3 className="font-bold text-gray-900 mb-1">{plan.name}</h3>
                              <p className="text-xs text-gray-500 mb-3">{plan.billing_period === 'monthly' ? 'Mensile' : 'Annuale'} · {plan.max_persons} {plan.max_persons === 1 ? 'sede' : 'sedi'}</p>
                              <p className="text-2xl font-bold text-blue-600 mb-1">€{Number(plan.price).toFixed(2)}</p>
                              <p className="text-xs text-gray-400 mb-3">+ IVA / {plan.billing_period === 'monthly' ? 'mese' : 'anno'}</p>
                              {savings && <p className="text-xs text-green-600 font-semibold mb-3">Risparmi €{savings.toFixed(2)}</p>}
                              {isCurrent ? (
                                <div className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-semibold text-center">Piano Attuale</div>
                              ) : (
                                <button onClick={() => handleChangePlan(plan.id)} className="w-full bg-gray-800 hover:bg-gray-900 text-white py-2 rounded-lg text-sm font-semibold transition-colors">Scegli Piano</button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-6">
                <UserAuctionsSection />

                {/* Sezione Annunci Classificati per utenti privati */}
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden border-2 border-green-100">
                  <div className="bg-gradient-to-r from-green-500 to-teal-500 px-6 py-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-bold text-white flex items-center gap-3">
                        <Tag className="w-6 h-6" />
                        I Miei Annunci
                      </h2>
                      <button
                        onClick={() => { setEditingCustomerAdId(undefined); setShowCustomerAdForm(true); }}
                        className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Nuovo Annuncio
                      </button>
                    </div>
                  </div>

                  {showCustomerAdForm && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <ClassifiedAdForm
                          adId={editingCustomerAdId}
                          onSuccess={() => { setShowCustomerAdForm(false); loadCustomerClassifiedAds(); }}
                          onCancel={() => setShowCustomerAdForm(false)}
                        />
                      </div>
                    </div>
                  )}

                  <div className="p-6">
                    {customerClassifiedAds.length === 0 ? (
                      <div className="text-center py-10">
                        <Tag className="w-14 h-14 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">Nessun annuncio</h3>
                        <p className="text-gray-500 text-sm mb-6">Pubblica annunci di vendita, acquisto o regalo.</p>
                        <button
                          onClick={() => { setEditingCustomerAdId(undefined); setShowCustomerAdForm(true); }}
                          className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 transition-colors font-semibold"
                        >
                          <Plus className="w-5 h-5" />
                          Crea il primo annuncio
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {customerClassifiedAds.map(ad => (
                          <ProfileClassifiedAdCard
                            key={ad.id}
                            ad={{
                              ...ad,
                              price: ad.price ? parseFloat(ad.price) : null,
                              classified_categories: ad.classified_categories,
                              profiles: { full_name: profile?.nickname || profile?.full_name || 'Utente', avatar_url: null },
                            }}
                            onEdit={(ad) => { setEditingCustomerAdId(ad.id); setShowCustomerAdForm(true); }}
                            onDelete={deleteClassifiedAd}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <FavoritesSection />

                {/* Sezione Classifica */}
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden border-2 border-gray-100">
                  <div className="bg-gradient-to-r from-yellow-500 to-orange-500 px-6 py-4">
                    <h2 className="text-xl font-bold text-white flex items-center gap-3">
                      <Trophy className="w-6 h-6" />
                      La Mia Classifica
                    </h2>
                  </div>

                  <div className="p-6">
                    {userRank && (
                      <div className="bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50 border-2 border-yellow-200 rounded-xl p-6 mb-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center font-bold text-2xl shadow-lg ${
                              userRank.rank === 1 ? 'bg-gradient-to-br from-yellow-400 to-amber-500 text-white' :
                              userRank.rank === 2 ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-white' :
                              userRank.rank === 3 ? 'bg-gradient-to-br from-orange-400 to-amber-600 text-white' :
                              'bg-gradient-to-br from-blue-400 to-blue-500 text-white'
                            }`}>
                              #{userRank.rank}
                            </div>
                            <div>
                              <p className="text-sm text-gray-500 font-medium">La tua posizione</p>
                              <p className="text-2xl font-bold text-gray-900">
                                {activeProfile?.isOwner === false
                                  ? activeProfile.name
                                  : profile?.nickname || profile?.full_name}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-2 justify-end">
                              <Trophy className="w-6 h-6 text-yellow-500" />
                              <span className="text-3xl font-bold text-gray-900">{userRank.points}</span>
                            </div>
                            <p className="text-sm text-gray-500">punti totali</p>
                            <p className="text-xs text-gray-400 mt-1">{userRank.reviews_count} recensioni</p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-3">
                      <button
                        onClick={() => navigate('/leaderboard')}
                        className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-6 py-3 rounded-xl hover:from-yellow-600 hover:to-orange-600 transition-all font-bold shadow-lg text-center"
                      >
                        Vedi Classifica Completa
                      </button>
                      <button
                        onClick={() => setLeaderboardTab(leaderboardTab === 'my_activities' ? 'leaderboard' : 'my_activities')}
                        className={`flex-1 px-6 py-3 rounded-xl font-bold shadow-lg transition-all text-center flex items-center justify-center gap-2 ${
                          leaderboardTab === 'my_activities'
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700'
                        }`}
                      >
                        <Activity className="w-5 h-5" />
                        Le Mie Attivita'
                      </button>
                    </div>
                  </div>
                </div>

                {/* Sezione Le Mie Attivita' (espandibile) */}
                {leaderboardTab === 'my_activities' && (
                  <div className="bg-white rounded-2xl shadow-lg overflow-hidden border-2 border-blue-200">
                    <ActivityFeed />
                  </div>
                )}

                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                    <User className="w-6 h-6" />
                    Le Tue Recensioni - {profile.full_name}
                  </h2>

                  {reviews.filter(r => !r.family_member_id).length === 0 ? (
                    <p className="text-gray-600 text-center py-8">
                      Non hai ancora scritto recensioni
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {reviews.filter(r => !r.family_member_id).map((review) => (
                        <div key={review.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${
                                    i < review.rating
                                      ? 'fill-yellow-400 text-yellow-400'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-sm text-gray-500">
                              {new Date(review.created_at).toLocaleDateString('it-IT')}
                            </span>
                          </div>
                          <h4 className="font-semibold mb-1">{review.title}</h4>
                          <p className="text-gray-700 text-sm">{review.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {familyMembers.map((member) => {
                  const memberReviews = reviews.filter(r => r.family_member_id === member.id);
                  return (
                    <div key={member.id} className="bg-white rounded-lg shadow-sm p-6">
                      <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                        <User className="w-6 h-6" />
                        Recensioni di {member.nickname || `${member.first_name} ${member.last_name}`}
                      </h2>

                      {memberReviews.length === 0 ? (
                        <p className="text-gray-600 text-center py-8">
                          Nessuna recensione ancora
                        </p>
                      ) : (
                        <div className="space-y-4">
                          {memberReviews.map((review) => (
                            <div key={review.id} className="border border-gray-200 rounded-lg p-4">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex">
                                  {[...Array(5)].map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`w-4 h-4 ${
                                        i < review.rating
                                          ? 'fill-yellow-400 text-yellow-400'
                                          : 'text-gray-300'
                                      }`}
                                    />
                                  ))}
                                </div>
                                <span className="text-sm text-gray-500">
                                  {new Date(review.created_at).toLocaleDateString('it-IT')}
                                </span>
                              </div>
                              <h4 className="font-semibold mb-1">{review.title}</h4>
                              <p className="text-gray-700 text-sm">{review.content}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}

                {currentSubscription && availablePlans.length > 0 && (
                  <div className="mt-12">
                    <div className="bg-gradient-to-br from-green-50 to-blue-50 border-2 border-green-400 rounded-2xl shadow-xl p-8 mb-8">
                      <div className="flex items-center justify-center mb-4">
                        <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mr-3">
                          <Heart className="w-6 h-6 text-white" fill="currentColor" />
                        </div>
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                          10% di Beneficenza
                        </h2>
                      </div>
                      <p className="text-lg text-gray-800 max-w-3xl mx-auto text-center mb-4">
                        Il tuo abbonamento fa la differenza! Ogni anno Trovafacile donerà il <strong>10% del fatturato totale</strong> ad associazioni di beneficenza.
                      </p>
                      <div className="grid md:grid-cols-3 gap-3 max-w-4xl mx-auto mt-6">
                        <div className="bg-white/80 backdrop-blur rounded-xl p-3 text-center">
                          <Gift className="w-6 h-6 text-green-600 mx-auto mb-2" />
                          <p className="text-sm font-semibold text-gray-900">Trasparenza Totale</p>
                          <p className="text-xs text-gray-600 mt-1">Documenti certificati pubblici</p>
                        </div>
                        <div className="bg-white/80 backdrop-blur rounded-xl p-3 text-center">
                          <UsersIcon className="w-6 h-6 text-green-600 mx-auto mb-2" />
                          <p className="text-sm font-semibold text-gray-900">Voti degli Utenti</p>
                          <p className="text-xs text-gray-600 mt-1">Tu scegli le associazioni</p>
                        </div>
                        <div className="bg-white/80 backdrop-blur rounded-xl p-3 text-center">
                          <TrendingUp className="w-6 h-6 text-green-600 mx-auto mb-2" />
                          <p className="text-sm font-semibold text-gray-900">Impatto Reale</p>
                          <p className="text-xs text-gray-600 mt-1">Aiuto concreto ogni anno</p>
                        </div>
                      </div>
                    </div>

                    {upgradeMessage && (
                      <div className={`mb-6 p-4 rounded-lg ${
                        upgradeMessage.includes('successo') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {upgradeMessage}
                      </div>
                    )}

                    <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">
                      Cambia Piano
                    </h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                      {availablePlans.map((plan) => {
                        const savings = calculateSavings(plan);
                        const isAnnual = plan.billing_period === 'yearly';
                        const isCurrent = currentSubscription.plan.id === plan.id;

                        return (
                          <div
                            key={plan.id}
                            className={`bg-white rounded-xl shadow-lg p-6 border-2 transition-all relative ${
                              isCurrent
                                ? 'border-yellow-500 bg-yellow-50'
                                : isAnnual
                                ? 'border-green-400 ring-2 ring-green-200'
                                : 'border-gray-200 hover:border-blue-500'
                            }`}
                          >
                            {isAnnual && !isCurrent && (
                              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                                <span className="inline-flex items-center gap-1 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                                  <Star className="w-3 h-3" fill="currentColor" />
                                  RISPARMIO
                                </span>
                              </div>
                            )}
                            <h3 className="text-xl font-bold text-gray-900 mb-2">
                              {plan.name}
                            </h3>
                            <p className="text-xs text-gray-500 mb-1">Fino a {plan.max_persons} {plan.max_persons === 1 ? 'persona' : 'persone'}</p>
                            <p className="text-xs font-semibold text-gray-700 mb-4">
                              Abbonamento {plan.billing_period === 'monthly' ? 'Mensile' : 'Annuale'}
                            </p>
                            <div className="mb-6">
                              <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-bold text-blue-600">€{Number(plan.price).toFixed(2)}</span>
                                <span className="text-gray-600">/{plan.billing_period === 'monthly' ? 'mese' : 'anno'}</span>
                              </div>
                              {savings && (
                                <div className="mt-3 bg-green-50 border border-green-200 rounded-lg p-3">
                                  <p className="text-lg font-bold text-green-700">Risparmi €{savings.toFixed(2)}</p>
                                  <p className="text-xs text-green-600">rispetto al piano mensile</p>
                                </div>
                              )}
                              {!isAnnual && (
                                <p className="text-xs text-gray-500 mt-2">€{(Number(plan.price) * 12).toFixed(2)} all'anno</p>
                              )}
                            </div>
                            <div className="mb-6 space-y-2">
                              <div className="flex items-center gap-2 text-sm text-gray-700">
                                <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                                <span>Recensioni illimitate</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-700">
                                <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                                <span>Salva preferiti</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-700">
                                <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                                <span>Pubblicare annunci</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-700">
                                <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                                <span>Ricerca offerte di lavoro</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-700">
                                <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                                <span>Ricerca prodotti di ogni genere</span>
                              </div>
                            </div>
                            {isCurrent ? (
                              <div className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold text-center">
                                Piano Attuale
                              </div>
                            ) : (
                              <button
                                onClick={() => handleChangePlan(plan.id)}
                                className={`w-full py-3 px-6 rounded-lg transition-colors font-semibold ${
                                  isAnnual
                                    ? 'bg-green-600 text-white hover:bg-green-700'
                                    : 'bg-blue-600 text-white hover:bg-blue-700'
                                }`}
                              >
                                Cambia Piano
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {showResponseForm && (
          <ReviewResponseForm
            reviewId={showResponseForm}
            onClose={() => setShowResponseForm(null)}
            onSuccess={() => {
              setShowResponseForm(null);
              loadDashboardData();
            }}
          />
        )}
      </div>
    </div>
  );
}
