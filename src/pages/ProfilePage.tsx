import { useState, useEffect } from 'react';
import { User, Star, Tag, Plus, Calendar, Percent, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { AvatarUpload } from '../components/profile/AvatarUpload';
import { EditProfileForm } from '../components/profile/EditProfileForm';
import { JobRequestForm } from '../components/profile/JobRequestForm';
import { EditFamilyMembersForm } from '../components/profile/EditFamilyMembersForm';
import { EditBusinessForm } from '../components/business/EditBusinessForm';
import { BusinessJobPostingForm } from '../components/business/BusinessJobPostingForm';
import { EditBusinessLocationsForm } from '../components/business/EditBusinessLocationsForm';
import { SubscriptionManagement } from '../components/subscription/SubscriptionManagement';

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

export function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [business, setBusiness] = useState<Business | null>(null);
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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-md p-8 mb-8">
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
        </div>

        <SubscriptionManagement
          userId={profile.id}
          userType={profile.user_type}
          currentSubscriptionStatus={profile.subscription_status}
          onUpdate={loadProfileData}
        />

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

            <JobRequestForm customerId={profile.id} />

            <div className="bg-white rounded-xl shadow-md p-8 mb-8">
              <div className="flex items-center gap-3 mb-6">
                <Star className="w-6 h-6 text-yellow-500" />
                <h2 className="text-2xl font-bold text-gray-900">Le Tue Recensioni</h2>
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

            <div className="bg-white rounded-xl shadow-md p-8">
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
          </>
        ) : (
          <>
            {business && (
              <>
                <EditBusinessForm
                  business={business}
                  onUpdate={loadBusinessData}
                />

                <EditBusinessLocationsForm
                  businessId={business.id}
                  onUpdate={loadBusinessData}
                />

                <BusinessJobPostingForm businessId={business.id} />
              </>
            )}

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
      </div>
    </div>
  );
}
