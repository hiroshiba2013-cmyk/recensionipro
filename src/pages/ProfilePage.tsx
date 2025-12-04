import { useState, useEffect } from 'react';
import { User, Star, CreditCard, Tag, Plus, Calendar, Percent, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { AvatarUpload } from '../components/profile/AvatarUpload';
import { EditProfileForm } from '../components/profile/EditProfileForm';
import { JobRequestForm } from '../components/profile/JobRequestForm';
import { ResumeUpload } from '../components/profile/ResumeUpload';
import { EditBusinessForm } from '../components/business/EditBusinessForm';
import { BusinessJobPostingForm } from '../components/business/BusinessJobPostingForm';

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
  business?: {
    name: string;
  };
  customer?: {
    full_name: string;
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
        business:businesses(name)
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
          customer:profiles(full_name)
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

        <div className="bg-white rounded-xl shadow-md p-8 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <CreditCard className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">Piano di Abbonamento</h2>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Stato Abbonamento</p>
                <p className="text-2xl font-bold text-gray-900 capitalize">
                  {profile.subscription_status === 'active' ? 'Attivo' :
                   profile.subscription_status === 'expired' ? 'Scaduto' : 'Cancellato'}
                </p>
              </div>
              {profile.subscription_type && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Piano</p>
                  <p className="text-xl font-semibold text-gray-900 capitalize">
                    {profile.subscription_type === 'monthly' ? 'Mensile' : 'Annuale'}
                  </p>
                </div>
              )}
            </div>
            {profile.subscription_expires_at && (
              <div className="mt-4 pt-4 border-t border-blue-200">
                <p className="text-sm text-gray-600">
                  Scadenza: {new Date(profile.subscription_expires_at).toLocaleDateString('it-IT')}
                </p>
              </div>
            )}
          </div>
        </div>

        {profile.user_type === 'customer' ? (
          <>
            <EditProfileForm
              profile={profile}
              onUpdate={loadProfileData}
            />

            <JobRequestForm customerId={profile.id} />

            <ResumeUpload
              userId={profile.id}
              currentResumeUrl={profile.resume_url}
              onUpdate={loadProfileData}
            />

            <div className="bg-white rounded-xl shadow-md p-8 mb-8">
              <div className="flex items-center gap-3 mb-6">
                <Star className="w-6 h-6 text-yellow-500" />
                <h2 className="text-2xl font-bold text-gray-900">Le Tue Recensioni</h2>
              </div>

              {reviews.length === 0 ? (
                <p className="text-gray-600 text-center py-8">Non hai ancora scritto recensioni</p>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="border border-gray-200 rounded-lg p-6 hover:border-blue-300 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-lg text-gray-900">{review.title}</h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {review.business?.name}
                          </p>
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

                <BusinessJobPostingForm businessId={business.id} />
              </>
            )}

            <div className="bg-white rounded-xl shadow-md p-8 mb-8">
              <div className="flex items-center gap-3 mb-6">
                <Star className="w-6 h-6 text-yellow-500" />
                <h2 className="text-2xl font-bold text-gray-900">Recensioni Ricevute</h2>
              </div>

              {reviews.length === 0 ? (
                <p className="text-gray-600 text-center py-8">Nessuna recensione ricevuta</p>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="border border-gray-200 rounded-lg p-6 hover:border-blue-300 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-lg text-gray-900">{review.title}</h3>
                          <p className="text-sm text-gray-600 mt-1">
                            Da: {review.customer?.full_name}
                          </p>
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
