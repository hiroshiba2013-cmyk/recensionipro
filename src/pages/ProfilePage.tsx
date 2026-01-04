import { useState, useEffect } from 'react';
import { User, Star, Tag, Plus, Calendar, Percent, X, Package, LogOut, Trophy, TrendingUp, Briefcase } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ClassifiedAdCard } from '../components/classifieds/ClassifiedAdCard';
import { AvatarUpload } from '../components/profile/AvatarUpload';
import { EditProfileForm } from '../components/profile/EditProfileForm';
import { JobRequestForm } from '../components/profile/JobRequestForm';
import { EditFamilyMembersForm } from '../components/profile/EditFamilyMembersForm';
import { AddUnclaimedBusinessForm } from '../components/profile/AddUnclaimedBusinessForm';
import { CreateBusinessForm } from '../components/business/CreateBusinessForm';
import { EditBusinessForm } from '../components/business/EditBusinessForm';
import { BusinessJobPostingForm } from '../components/business/BusinessJobPostingForm';
import { EditBusinessLocationsForm } from '../components/business/EditBusinessLocationsForm';
import { SubscriptionManagement } from '../components/subscription/SubscriptionManagement';
import { DeleteAccountButton } from '../components/profile/DeleteAccountButton';

interface Profile {
  id: string;
  email: string;
  full_name: string;
  first_name: string;
  last_name: string;
  nickname: string;
  date_of_birth: string;
  tax_code: string;
  phone: string;
  billing_address: string;
  avatar_url: string | null;
  resume_url: string | null;
  user_type: 'customer' | 'business';
  subscription_type: string | null;
  subscription_status: string;
  subscription_expires_at: string | null;
}

interface Review {
  id: string;
  rating: number;
  title: string;
  content: string;
  created_at: string;
  business_id: string;
  family_member_id?: string;
  business?: {
    name: string;
  };
  customer?: {
    full_name: string;
  };
  family_member?: {
    nickname: string;
  };
}

interface Discount {
  id: string;
  title: string;
  description: string;
  discount_percentage: number;
  code: string;
  valid_from: string;
  valid_until: string;
  active: boolean;
  business?: {
    name: string;
  };
}

interface Business {
  id: string;
  name: string;
  vat_number: string;
  unique_code: string;
  ateco_code: string;
  pec_email: string;
  phone: string;
  billing_address: string;
  office_address: string;
  website_url: string;
}

interface ClassifiedAd {
  id: string;
  title: string;
  description: string;
  price: number | null;
  location: string;
  city: string;
  province: string;
  images: string[] | null;
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

interface UserRank {
  rank: number;
  total_points: number;
  reviews_count: number;
}

interface FamilyMember {
  id: string;
  first_name: string;
  last_name: string;
  nickname: string;
  avatar_url: string | null;
  reviews_count: number;
  total_points: number;
  rank: number;
}

export function ProfilePage() {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [business, setBusiness] = useState<Business | null>(null);
  const [classifiedAds, setClassifiedAds] = useState<ClassifiedAd[]>([]);
  const [userRank, setUserRank] = useState<UserRank | null>(null);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDiscountForm, setShowDiscountForm] = useState(false);
  const [newDiscount, setNewDiscount] = useState({
    title: '',
    description: '',
    discount_percentage: 10,
    code: '',
    valid_until: '',
  });
  const [reviewFilters, setReviewFilters] = useState({
    nickname: '',
    rating: '',
    businessName: '',
  });

  useEffect(() => {
    if (user) {
      loadProfileData();
    }
  }, [user]);

  const loadProfileData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (profileData) {
        setProfile(profileData);

        if (profileData.user_type === 'customer') {
          await loadCustomerData();
        } else {
          await loadBusinessData();
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCustomerData = async () => {
    const { data: reviewsData } = await supabase
      .from('reviews')
      .select(`
        *,
        business:businesses(name),
        family_member:customer_family_members(nickname)
      `)
      .eq('customer_id', user?.id)
      .order('created_at', { ascending: false });

    if (reviewsData) {
      setReviews(reviewsData);
    }

    const { data: discountsData } = await supabase
      .from('discounts')
      .select(`
        *,
        business:businesses(name)
      `)
      .eq('active', true)
      .gte('valid_until', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (discountsData) {
      setDiscounts(discountsData);
    }

    await loadClassifiedAds();
    await loadLeaderboardData();
    await loadFamilyMembersData();
  };

  const loadLeaderboardData = async () => {
    if (!user) return;

    const { data: userActivity } = await supabase
      .from('user_activity')
      .select('total_points, reviews_count')
      .eq('user_id', user.id)
      .maybeSingle();

    if (userActivity) {
      const { count } = await supabase
        .from('user_activity')
        .select('user_id', { count: 'exact', head: true })
        .gt('total_points', userActivity.total_points || 0);

      setUserRank({
        rank: (count || 0) + 1,
        total_points: userActivity.total_points || 0,
        reviews_count: userActivity.reviews_count || 0,
      });
    }
  };

  const loadFamilyMembersData = async () => {
    if (!user) return;

    const { data: membersData } = await supabase
      .from('customer_family_members')
      .select('id, first_name, last_name, nickname, avatar_url')
      .eq('customer_id', user.id);

    if (membersData) {
      const membersWithStats = await Promise.all(
        membersData.map(async (member) => {
          const { data: reviewsData } = await supabase
            .from('reviews')
            .select('id, proof_image_url')
            .eq('family_member_id', member.id);

          const reviews_count = reviewsData?.length || 0;
          const total_points = (reviewsData || []).reduce((sum, review) => {
            return sum + (review.proof_image_url ? 50 : 15);
          }, 0);

          const { count: betterUsersCount } = await supabase
            .from('user_activity')
            .select('user_id', { count: 'exact', head: true })
            .gt('total_points', total_points);

          const rank = (betterUsersCount || 0) + 1;

          return {
            ...member,
            reviews_count,
            total_points,
            rank,
          };
        })
      );

      setFamilyMembers(membersWithStats);
    }
  };

  const loadClassifiedAds = async () => {
    const { data: adsData } = await supabase
      .from('classified_ads')
      .select(`
        *,
        profiles!classified_ads_user_id_fkey(full_name, avatar_url),
        classified_categories!classified_ads_category_id_fkey(name, icon)
      `)
      .eq('user_id', user?.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (adsData) {
      setClassifiedAds(adsData);
    }
  };

  const loadBusinessData = async () => {
    const { data: businessData } = await supabase
      .from('businesses')
      .select('*')
      .eq('owner_id', user?.id)
      .maybeSingle();

    if (businessData) {
      setBusiness(businessData);

      const { data: reviewsData } = await supabase
        .from('reviews')
        .select(`
          *,
          customer:profiles(full_name),
          family_member:customer_family_members(nickname)
        `)
        .eq('business_id', businessData.id)
        .order('created_at', { ascending: false });

      if (reviewsData) {
        setReviews(reviewsData);
      }

      const { data: discountsData } = await supabase
        .from('discounts')
        .select('*')
        .eq('business_id', businessData.id)
        .order('created_at', { ascending: false });

      if (discountsData) {
        setDiscounts(discountsData);
      }
    }
  };

  const handleCreateDiscount = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!business) return;

    try {
      const { error } = await supabase.from('discounts').insert({
        business_id: business.id,
        ...newDiscount,
      });

      if (error) throw error;

      setShowDiscountForm(false);
      setNewDiscount({
        title: '',
        description: '',
        discount_percentage: 10,
        code: '',
        valid_until: '',
      });

      loadBusinessData();
    } catch (error) {
      console.error('Error creating discount:', error);
      alert('Errore nella creazione dello sconto');
    }
  };

  const handleDeleteDiscount = async (discountId: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo sconto?')) return;

    try {
      const { error } = await supabase
        .from('discounts')
        .delete()
        .eq('id', discountId);

      if (error) throw error;

      loadBusinessData();
    } catch (error) {
      console.error('Error deleting discount:', error);
    }
  };

  const filteredReviews = reviews.filter((review) => {
    const nicknameMatch = !reviewFilters.nickname ||
      review.family_member?.nickname?.toLowerCase().includes(reviewFilters.nickname.toLowerCase());

    const ratingMatch = !reviewFilters.rating ||
      review.rating === Number(reviewFilters.rating);

    const businessNameMatch = !reviewFilters.businessName ||
      review.business?.name?.toLowerCase().includes(reviewFilters.businessName.toLowerCase()) ||
      review.customer?.full_name?.toLowerCase().includes(reviewFilters.businessName.toLowerCase());

    return nicknameMatch && ratingMatch && businessNameMatch;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Profilo non trovato</p>
      </div>
    );
  }

  const handleSignOut = async () => {
    try {
      await signOut();
      window.location.href = '/';
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleAccountDeleted = async () => {
    await signOut();
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-md p-8 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <AvatarUpload
                userId={profile.id}
                currentAvatarUrl={profile.avatar_url}
                onAvatarUpdate={() => loadProfileData()}
              />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{profile.full_name}</h1>
                <p className="text-gray-600 mt-1">{profile.email}</p>
                <span className="inline-block mt-2 px-4 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                  {profile.user_type === 'customer' ? 'Cliente' : 'Azienda'}
                </span>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors font-semibold shadow-md"
              title="Esci"
            >
              <LogOut className="w-5 h-5" />
              Esci
            </button>
          </div>
        </div>

        <SubscriptionManagement
          userId={profile.id}
          userType={profile.user_type}
          currentSubscriptionStatus={profile.subscription_status}
          onUpdate={loadProfileData}
        />

        {profile.user_type === 'customer' && userRank && (
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl shadow-md p-6 mb-8 border-2 border-yellow-200">
            <div className="flex items-center gap-3 mb-4">
              <Trophy className="w-7 h-7 text-yellow-600" />
              <h2 className="text-2xl font-bold text-gray-900">La Tua Posizione in Classifica</h2>
            </div>

            <div className="bg-white rounded-lg p-6 mb-4">
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-yellow-600 mb-2">#{userRank.rank}</div>
                  <p className="text-gray-600 font-medium">Posizione</p>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-blue-600 mb-2">{userRank.total_points}</div>
                  <p className="text-gray-600 font-medium">Punti Totali</p>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-green-600 mb-2">{userRank.reviews_count}</div>
                  <p className="text-gray-600 font-medium">Recensioni</p>
                </div>
              </div>
            </div>

            {familyMembers.length > 0 && (
              <>
                <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" />
                  Attività dei Membri della Famiglia
                </h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {familyMembers.map((member) => (
                    <div
                      key={member.id}
                      className="bg-white rounded-lg p-5 border-2 border-gray-200 hover:border-blue-300 transition-colors shadow-sm"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        {member.avatar_url ? (
                          <img
                            src={member.avatar_url}
                            alt={member.nickname || `${member.first_name} ${member.last_name}`}
                            className="w-14 h-14 rounded-full border-2 border-blue-200"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl font-bold border-2 border-blue-200">
                            {member.first_name.charAt(0)}
                          </div>
                        )}
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-900">
                            {member.nickname || `${member.first_name} ${member.last_name}`}
                          </h4>
                          <p className="text-xs text-gray-600">
                            {member.first_name} {member.last_name}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between bg-yellow-50 rounded-lg px-3 py-2">
                          <span className="text-sm text-gray-700 font-medium">Posizione</span>
                          <span className="text-lg font-bold text-yellow-600">#{member.rank}</span>
                        </div>
                        <div className="flex items-center justify-between bg-blue-50 rounded-lg px-3 py-2">
                          <span className="text-sm text-gray-700 font-medium">Punti</span>
                          <span className="text-lg font-bold text-blue-600">{member.total_points}</span>
                        </div>
                        <div className="flex items-center justify-between bg-green-50 rounded-lg px-3 py-2">
                          <span className="text-sm text-gray-700 font-medium">Recensioni</span>
                          <span className="text-lg font-bold text-green-600">{member.reviews_count}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            <div className="mt-4 text-center">
              <a
                href="/leaderboard"
                className="inline-flex items-center gap-2 bg-yellow-600 text-white px-6 py-3 rounded-lg hover:bg-yellow-700 transition-colors font-semibold shadow-md"
              >
                <Trophy className="w-5 h-5" />
                Vedi Classifica Completa
              </a>
            </div>
          </div>
        )}

        {profile.user_type === 'customer' ? (
          <>
            <div className="border-t-4 border-blue-500 bg-gradient-to-r from-blue-50 to-white rounded-lg p-4 mb-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <User className="w-6 h-6 text-blue-600" />
                Dati Personali Account Principale
              </h2>
              <p className="text-sm text-gray-600 mt-1">Informazioni del titolare dell'account</p>
            </div>

            <EditProfileForm
              profile={profile}
              onUpdate={loadProfileData}
            />

            <div className="border-t-4 border-green-500 bg-gradient-to-r from-green-50 to-white rounded-lg p-4 mb-6 mt-8">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <User className="w-6 h-6 text-green-600" />
                Membri della Famiglia
              </h2>
              <p className="text-sm text-gray-600 mt-1">Gestisci i membri collegati al tuo account</p>
            </div>

            <EditFamilyMembersForm
              customerId={profile.id}
              onUpdate={loadProfileData}
            />

            <AddUnclaimedBusinessForm
              customerId={profile.id}
              onSuccess={loadProfileData}
            />

            <JobRequestForm customerId={profile.id} />

            <div className="bg-white rounded-xl shadow-md p-8 mb-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Star className="w-6 h-6 text-yellow-500" />
                  <h2 className="text-2xl font-bold text-gray-900">Le Tue Recensioni</h2>
                </div>
                <a
                  href="/"
                  className="flex items-center gap-2 bg-yellow-600 text-white px-6 py-3 rounded-lg hover:bg-yellow-700 transition-colors font-semibold shadow-md"
                >
                  <Star className="w-5 h-5" />
                  Scrivi Recensioni
                </a>
              </div>

              <div className="mb-6 bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Trophy className="w-6 h-6 text-yellow-600" />
                  <p className="text-gray-800 font-semibold text-lg">Guadagna Punti Scrivendo Recensioni!</p>
                </div>
                <div className="grid md:grid-cols-2 gap-3">
                  <div className="bg-white rounded-lg p-3 border border-yellow-300">
                    <div className="flex items-center gap-2">
                      <Star className="w-5 h-5 text-yellow-600" />
                      <span className="text-gray-700 font-medium">Recensione Base:</span>
                      <span className="text-yellow-600 font-bold text-lg">25 punti</span>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-orange-300">
                    <div className="flex items-center gap-2">
                      <Star className="w-5 h-5 text-orange-600 fill-orange-600" />
                      <span className="text-gray-700 font-medium">Recensione Completa:</span>
                      <span className="text-orange-600 font-bold text-lg">50 punti</span>
                    </div>
                  </div>
                </div>
              </div>

              {reviews.length > 0 && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Filtra Recensioni</h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Nickname</label>
                      <input
                        type="text"
                        value={reviewFilters.nickname}
                        onChange={(e) => setReviewFilters({ ...reviewFilters, nickname: e.target.value })}
                        placeholder="Cerca per nickname"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Valutazione</label>
                      <select
                        value={reviewFilters.rating}
                        onChange={(e) => setReviewFilters({ ...reviewFilters, rating: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Tutte le valutazioni</option>
                        <option value="5">5 stelle</option>
                        <option value="4">4 stelle</option>
                        <option value="3">3 stelle</option>
                        <option value="2">2 stelle</option>
                        <option value="1">1 stella</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Nome Azienda</label>
                      <input
                        type="text"
                        value={reviewFilters.businessName}
                        onChange={(e) => setReviewFilters({ ...reviewFilters, businessName: e.target.value })}
                        placeholder="Cerca per azienda"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  {(reviewFilters.nickname || reviewFilters.rating || reviewFilters.businessName) && (
                    <button
                      onClick={() => setReviewFilters({ nickname: '', rating: '', businessName: '' })}
                      className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-semibold"
                    >
                      Resetta Filtri
                    </button>
                  )}
                </div>
              )}

              {reviews.length === 0 ? (
                <p className="text-gray-600 text-center py-8">Non hai ancora scritto recensioni</p>
              ) : filteredReviews.length === 0 ? (
                <p className="text-gray-600 text-center py-8">Nessuna recensione trovata con questi filtri</p>
              ) : (
                <div className="space-y-4">
                  {filteredReviews.map((review) => (
                    <div key={review.id} className="border border-gray-200 rounded-lg p-6 hover:border-blue-300 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-lg text-gray-900">{review.title}</h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {review.business?.name}
                          </p>
                          {review.family_member?.nickname && (
                            <p className="text-xs text-blue-600 mt-1">
                              Scritta da: {review.family_member.nickname}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`w-5 h-5 ${
                                i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-gray-700 leading-relaxed">{review.content}</p>
                      <p className="text-sm text-gray-500 mt-3">
                        {new Date(review.created_at).toLocaleDateString('it-IT')}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-md p-8 mb-8">
              <div className="flex items-center gap-3 mb-6">
                <Tag className="w-6 h-6 text-green-600" />
                <h2 className="text-2xl font-bold text-gray-900">Sconti Disponibili</h2>
              </div>

              {discounts.length === 0 ? (
                <p className="text-gray-600 text-center py-8">Nessuno sconto disponibile al momento</p>
              ) : (
                <div className="grid md:grid-cols-2 gap-6">
                  {discounts.map((discount) => (
                    <div key={discount.id} className="border-2 border-green-200 rounded-lg p-6 bg-green-50">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-bold text-lg text-gray-900">{discount.title}</h3>
                        <span className="bg-green-600 text-white px-4 py-2 rounded-full font-bold text-lg">
                          -{discount.discount_percentage}%
                        </span>
                      </div>
                      <p className="text-gray-700 mb-4">{discount.description}</p>
                      <div className="bg-white rounded-lg p-3 border border-green-300">
                        <p className="text-xs text-gray-600 mb-1">Codice Sconto</p>
                        <p className="font-mono font-bold text-lg text-green-700">{discount.code}</p>
                      </div>
                      <div className="mt-4 flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>Valido fino al {new Date(discount.valid_until).toLocaleDateString('it-IT')}</span>
                        </div>
                      </div>
                      {discount.business?.name && (
                        <p className="mt-3 text-sm font-semibold text-gray-800">
                          {discount.business.name}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-md p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Package className="w-6 h-6 text-blue-600" />
                  <h2 className="text-2xl font-bold text-gray-900">I Tuoi Annunci</h2>
                </div>
                <a
                  href="/classified"
                  className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow-md"
                >
                  <Plus className="w-5 h-5" />
                  Crea Annuncio
                </a>
              </div>

              <div className="mb-6 bg-gradient-to-r from-blue-50 to-green-50 border-2 border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                  <p className="text-gray-800 font-semibold">
                    Guadagna <span className="text-green-600 font-bold">5 punti</span> in classifica per ogni annuncio pubblicato!
                  </p>
                </div>
              </div>

              {classifiedAds.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">Non hai ancora pubblicato annunci</p>
                  <a
                    href="/classified"
                    className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Pubblica il tuo primo annuncio
                  </a>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {classifiedAds.map((ad) => (
                    <ClassifiedAdCard key={ad.id} ad={ad} />
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            {!business && user && (
              <div className="bg-yellow-50 border-2 border-yellow-400 rounded-xl p-8 mb-8">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Completa la Registrazione Aziendale</h3>
                <p className="text-gray-700 mb-6">
                  Per accedere a tutte le funzionalità business (gestione sedi, annunci di lavoro, sconti, ecc.)
                  devi prima completare i dati della tua azienda.
                </p>
                <div className="border-t-4 border-green-500 bg-gradient-to-r from-green-50 to-white rounded-lg p-4 mb-6">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <User className="w-6 h-6 text-green-600" />
                    Crea la Tua Azienda
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">Inserisci i dati della tua azienda per iniziare</p>
                </div>
                <CreateBusinessForm
                  ownerId={user.id}
                  onSuccess={loadBusinessData}
                  onCancel={() => {}}
                />
              </div>
            )}

            {business && (
              <>
                <div className="border-t-4 border-green-500 bg-gradient-to-r from-green-50 to-white rounded-lg p-4 mb-6 mt-8">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <User className="w-6 h-6 text-green-600" />
                    Dati Aziendali
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">Informazioni generali dell'azienda</p>
                </div>

                <EditBusinessForm
                  businessId={business.id}
                  onUpdate={loadBusinessData}
                />

                <div className="border-t-4 border-orange-500 bg-gradient-to-r from-orange-50 to-white rounded-lg p-4 mb-6 mt-8">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <User className="w-6 h-6 text-orange-600" />
                    Punti Vendita
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">Gestisci i punti vendita dell'azienda</p>
                </div>

                <EditBusinessLocationsForm
                  businessId={business.id}
                  onUpdate={loadBusinessData}
                />

                <div className="border-t-4 border-slate-500 bg-gradient-to-r from-slate-50 to-white rounded-lg p-4 mb-6 mt-8">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Briefcase className="w-6 h-6 text-slate-600" />
                    Annunci di Lavoro
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">Pubblica e gestisci i tuoi annunci di ricerca personale</p>
                </div>

                <BusinessJobPostingForm businessId={business.id} />
              </>
            )}

            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl shadow-md p-6 mb-8 border-2 border-yellow-200">
              <div className="flex items-center gap-3 mb-4">
                <Trophy className="w-7 h-7 text-yellow-600" />
                <h2 className="text-2xl font-bold text-gray-900">Premi e Riconoscimenti</h2>
              </div>
              <div className="bg-white rounded-lg p-6">
                <p className="text-lg text-gray-700 leading-relaxed mb-4">
                  Ricevi recensioni positive e scala la classifica per vincere premi
                </p>
                <a
                  href="/leaderboard"
                  className="inline-flex items-center gap-2 bg-yellow-600 text-white px-6 py-3 rounded-lg hover:bg-yellow-700 transition-colors font-semibold shadow-md"
                >
                  <Trophy className="w-5 h-5" />
                  Vedi Classifica
                </a>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-8 mb-8">
              <div className="flex items-center gap-3 mb-6">
                <Star className="w-6 h-6 text-yellow-500" />
                <h2 className="text-2xl font-bold text-gray-900">Recensioni Ricevute</h2>
              </div>

              {reviews.length > 0 && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Filtra Recensioni</h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Nickname</label>
                      <input
                        type="text"
                        value={reviewFilters.nickname}
                        onChange={(e) => setReviewFilters({ ...reviewFilters, nickname: e.target.value })}
                        placeholder="Cerca per nickname"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Valutazione</label>
                      <select
                        value={reviewFilters.rating}
                        onChange={(e) => setReviewFilters({ ...reviewFilters, rating: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Tutte le valutazioni</option>
                        <option value="5">5 stelle</option>
                        <option value="4">4 stelle</option>
                        <option value="3">3 stelle</option>
                        <option value="2">2 stelle</option>
                        <option value="1">1 stella</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Nome Cliente</label>
                      <input
                        type="text"
                        value={reviewFilters.businessName}
                        onChange={(e) => setReviewFilters({ ...reviewFilters, businessName: e.target.value })}
                        placeholder="Cerca per cliente"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  {(reviewFilters.nickname || reviewFilters.rating || reviewFilters.businessName) && (
                    <button
                      onClick={() => setReviewFilters({ nickname: '', rating: '', businessName: '' })}
                      className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-semibold"
                    >
                      Resetta Filtri
                    </button>
                  )}
                </div>
              )}

              {reviews.length === 0 ? (
                <p className="text-gray-600 text-center py-8">Nessuna recensione ricevuta</p>
              ) : filteredReviews.length === 0 ? (
                <p className="text-gray-600 text-center py-8">Nessuna recensione trovata con questi filtri</p>
              ) : (
                <div className="space-y-4">
                  {filteredReviews.map((review) => (
                    <div key={review.id} className="border border-gray-200 rounded-lg p-6 hover:border-blue-300 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-lg text-gray-900">{review.title}</h3>
                          <p className="text-sm text-gray-600 mt-1">
                            Da: {review.customer?.full_name}
                          </p>
                          {review.family_member?.nickname && (
                            <p className="text-xs text-blue-600 mt-1">
                              Scritta da: {review.family_member.nickname}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`w-5 h-5 ${
                                i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-gray-700 leading-relaxed">{review.content}</p>
                      <p className="text-sm text-gray-500 mt-3">
                        {new Date(review.created_at).toLocaleDateString('it-IT')}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-md p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Tag className="w-6 h-6 text-green-600" />
                  <h2 className="text-2xl font-bold text-gray-900">Gestisci Sconti</h2>
                </div>
                {profile.subscription_status === 'active' && (
                  <button
                    onClick={() => setShowDiscountForm(true)}
                    className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold shadow-md"
                  >
                    <Plus className="w-5 h-5" />
                    Crea Sconto
                  </button>
                )}
              </div>

              {profile.subscription_status !== 'active' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <p className="text-yellow-800">
                    Attiva un abbonamento per creare e gestire sconti
                  </p>
                </div>
              )}

              {showDiscountForm && (
                <form onSubmit={handleCreateDiscount} className="bg-gray-50 rounded-lg p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Nuovo Sconto</h3>
                    <button
                      type="button"
                      onClick={() => setShowDiscountForm(false)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Titolo
                      </label>
                      <input
                        type="text"
                        value={newDiscount.title}
                        onChange={(e) => setNewDiscount({ ...newDiscount, title: e.target.value })}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Codice Sconto
                      </label>
                      <input
                        type="text"
                        value={newDiscount.code}
                        onChange={(e) => setNewDiscount({ ...newDiscount, code: e.target.value.toUpperCase() })}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent font-mono"
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Descrizione
                    </label>
                    <textarea
                      value={newDiscount.description}
                      onChange={(e) => setNewDiscount({ ...newDiscount, description: e.target.value })}
                      required
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 mb-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Percentuale Sconto
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={newDiscount.discount_percentage}
                          onChange={(e) => setNewDiscount({ ...newDiscount, discount_percentage: Number(e.target.value) })}
                          required
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                        <Percent className="w-5 h-5 text-gray-500" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Valido Fino a
                      </label>
                      <input
                        type="date"
                        value={newDiscount.valid_until}
                        onChange={(e) => setNewDiscount({ ...newDiscount, valid_until: e.target.value })}
                        required
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="submit"
                      className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors font-semibold"
                    >
                      Crea Sconto
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDiscountForm(false)}
                      className="px-6 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
                    >
                      Annulla
                    </button>
                  </div>
                </form>
              )}

              {discounts.length === 0 ? (
                <p className="text-gray-600 text-center py-8">Nessuno sconto creato</p>
              ) : (
                <div className="grid md:grid-cols-2 gap-6">
                  {discounts.map((discount) => (
                    <div key={discount.id} className={`border-2 rounded-lg p-6 ${
                      discount.active ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'
                    }`}>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-bold text-lg text-gray-900">{discount.title}</h3>
                        <span className={`px-4 py-2 rounded-full font-bold text-lg ${
                          discount.active ? 'bg-green-600 text-white' : 'bg-gray-400 text-white'
                        }`}>
                          -{discount.discount_percentage}%
                        </span>
                      </div>
                      <p className="text-gray-700 mb-4">{discount.description}</p>
                      <div className="bg-white rounded-lg p-3 border border-gray-300 mb-4">
                        <p className="text-xs text-gray-600 mb-1">Codice Sconto</p>
                        <p className="font-mono font-bold text-lg text-gray-900">{discount.code}</p>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-1 text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span>Fino al {new Date(discount.valid_until).toLocaleDateString('it-IT')}</span>
                        </div>
                        <button
                          onClick={() => handleDeleteDiscount(discount.id)}
                          className="text-red-600 hover:text-red-700 font-semibold"
                        >
                          Elimina
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        <DeleteAccountButton onAccountDeleted={handleAccountDeleted} />
      </div>
    </div>
  );
}
