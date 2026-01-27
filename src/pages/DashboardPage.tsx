import { useState, useEffect } from 'react';
import { Plus, Star, Tag, Building, MessageSquare, User, Check, Shield, TrendingUp, Heart, Gift, Users as UsersIcon, Package, Briefcase } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Business, Review, Discount, FamilyMember } from '../lib/supabase';
import { BusinessJobPostingForm } from '../components/business/BusinessJobPostingForm';
import { EditBusinessLocationsForm } from '../components/business/EditBusinessLocationsForm';
import { EditBusinessForm } from '../components/business/EditBusinessForm';
import { CreateBusinessForm } from '../components/business/CreateBusinessForm';
import { DiscountForm } from '../components/discount/DiscountForm';
import { DiscountVerification } from '../components/discount/DiscountVerification';
import { ReviewResponseForm } from '../components/reviews/ReviewResponseForm';
import { ImportBusinessesForm } from '../components/business/ImportBusinessesForm';
import { FavoritesSection } from '../components/favorites/FavoritesSection';

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

export function DashboardPage() {
  const { profile, selectedBusinessLocationId } = useAuth();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([]);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateBusinessForm, setShowCreateBusinessForm] = useState(false);
  const [showDiscountForm, setShowDiscountForm] = useState(false);
  const [showResponseForm, setShowResponseForm] = useState<string | null>(null);
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null);
  const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null);
  const [availablePlans, setAvailablePlans] = useState<SubscriptionPlan[]>([]);
  const [upgradeMessage, setUpgradeMessage] = useState('');

  useEffect(() => {
    if (profile) {
      loadDashboardData();
      loadSubscriptionData();
    }
  }, [profile, selectedBusinessLocationId]);

  const loadDashboardData = async () => {
    if (!profile) return;

    console.log('🔄 Caricamento dati dashboard per sede:', selectedBusinessLocationId || 'TUTTE');

    setLoading(true);

    // Reset dei dati quando cambia la sede
    setReviews([]);
    setDiscounts([]);
    setProducts([]);
    setJobPostings([]);

    try {
      if (profile.user_type === 'business') {
        const { data: businessesData } = await supabase
          .from('businesses')
          .select('*')
          .eq('owner_id', profile.id);

        if (businessesData) {
          setBusinesses(businessesData);

          if (businessesData.length > 0 && !selectedBusinessId) {
            setSelectedBusinessId(businessesData[0].id);
          }

          if (businessesData.length > 0) {
            const businessIds = businessesData.map(b => b.id);

            // Filtra recensioni per sede se una sede è selezionata
            let reviewsQuery = supabase
              .from('reviews')
              .select(`
                *,
                customer:profiles(full_name),
                responses:review_responses(*),
                business_location:business_locations(internal_name, address)
              `)
              .in('business_id', businessIds)
              .order('created_at', { ascending: false });

            if (selectedBusinessLocationId) {
              reviewsQuery = reviewsQuery.eq('business_location_id', selectedBusinessLocationId);
            }

            const { data: reviewsData } = await reviewsQuery;

            console.log('📊 Recensioni caricate:', reviewsData?.length || 0, 'per sede:', selectedBusinessLocationId || 'TUTTE');

            if (reviewsData) {
              setReviews(reviewsData);
            }

            // Filtra sconti per sede se una sede è selezionata
            let discountsQuery = supabase
              .from('discounts')
              .select('*')
              .in('business_id', businessIds)
              .order('created_at', { ascending: false });

            if (selectedBusinessLocationId) {
              discountsQuery = discountsQuery.eq('location_id', selectedBusinessLocationId);
            }

            const { data: discountsData } = await discountsQuery;

            console.log('🏷️ Sconti caricati:', discountsData?.length || 0, 'per sede:', selectedBusinessLocationId || 'TUTTE');

            if (discountsData) {
              setDiscounts(discountsData);
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

            // Filtra offerte di lavoro per sede se una sede è selezionata
            let jobPostingsQuery = supabase
              .from('job_postings')
              .select('*')
              .in('business_id', businessIds)
              .order('created_at', { ascending: false });

            if (selectedBusinessLocationId) {
              jobPostingsQuery = jobPostingsQuery.eq('location_id', selectedBusinessLocationId);
            }

            const { data: jobPostingsData } = await jobPostingsQuery;

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
      const { data: subscriptionData } = await supabase
        .from('subscriptions')
        .select('id, status, start_date, end_date, trial_end_date, plan:subscription_plans(id, name, price, billing_period, max_persons)')
        .eq('customer_id', profile.id)
        .in('status', ['active', 'trial'])
        .maybeSingle();

      if (subscriptionData) {
        setCurrentSubscription(subscriptionData as any);
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
        <p className="text-gray-600">Caricamento...</p>
      </div>
    );
  }

  if (profile.subscription_status !== 'active') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-md">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Abbonamento Necessario
          </h2>
          <p className="text-gray-600 mb-6">
            Per accedere alla dashboard e utilizzare tutte le funzionalità, attiva un abbonamento.
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Dashboard {profile.user_type === 'business' ? 'Attività' : 'Cliente'}
          </h1>
          <p className="text-gray-600">
            Benvenuto, {profile.full_name}
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="space-y-8">
            {profile.user_type === 'business' ? (
              <>
                {selectedBusinessLocationId && (
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow-sm p-6 mb-6 border-2 border-blue-300">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-blue-600" />
                      Statistiche Sede Selezionata
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-white rounded-lg p-4 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                          <Star className="w-5 h-5 text-yellow-500" />
                          <span className="text-sm font-medium text-gray-600">Recensioni</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{reviews.length}</p>
                      </div>
                      <div className="bg-white rounded-lg p-4 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                          <Tag className="w-5 h-5 text-green-600" />
                          <span className="text-sm font-medium text-gray-600">Sconti</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{discounts.length}</p>
                      </div>
                      <div className="bg-white rounded-lg p-4 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                          <Package className="w-5 h-5 text-purple-600" />
                          <span className="text-sm font-medium text-gray-600">Prodotti</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{products.length}</p>
                      </div>
                      <div className="bg-white rounded-lg p-4 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                          <Briefcase className="w-5 h-5 text-orange-600" />
                          <span className="text-sm font-medium text-gray-600">Offerte Lavoro</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{jobPostings.length}</p>
                      </div>
                    </div>
                  </div>
                )}

                {showCreateBusinessForm ? (
                  <CreateBusinessForm
                    ownerId={profile.id}
                    onSuccess={() => {
                      setShowCreateBusinessForm(false);
                      loadDashboardData();
                    }}
                    onCancel={() => setShowCreateBusinessForm(false)}
                  />
                ) : (
                  <>
                    <div className="bg-white rounded-lg shadow-sm p-6">
                      <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
                          <Building className="w-6 h-6" />
                          Le Mie Attività
                        </h2>
                        <button
                          onClick={() => setShowCreateBusinessForm(true)}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                        >
                          <Plus className="w-5 h-5" />
                          Aggiungi Attività
                        </button>
                      </div>

                      {businesses.length === 0 ? (
                        <p className="text-gray-600 text-center py-8">
                          Non hai ancora registrato nessuna attività
                        </p>
                      ) : (
                        <div className="grid gap-4">
                          {businesses.map((business) => (
                            <div
                              key={business.id}
                              onClick={() => setSelectedBusinessId(business.id)}
                              className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                                selectedBusinessId === business.id
                                  ? 'border-blue-500 bg-blue-50'
                                  : 'border-gray-200 hover:border-blue-300'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <h3 className="font-semibold text-lg">{business.name}</h3>
                                  <p className="text-gray-600 text-sm">{business.city}</p>
                                  {selectedBusinessId === business.id && (
                                    <p className="text-blue-600 text-sm mt-1 font-medium">
                                      Selezionata per la modifica
                                    </p>
                                  )}
                                </div>
                                {business.verified ? (
                                  <span className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full">
                                    Verificato
                                  </span>
                                ) : (
                                  <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-sm rounded-full">
                                    In Attesa
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {selectedBusinessId && (
                      <>
                        <EditBusinessForm businessId={selectedBusinessId} onUpdate={loadDashboardData} />
                        <EditBusinessLocationsForm
                          businessId={selectedBusinessId}
                          selectedLocationId={selectedBusinessLocationId}
                          onUpdate={loadDashboardData}
                        />
                      </>
                    )}
                  </>
                )}

                <ImportBusinessesForm onImportComplete={loadDashboardData} />

                <FavoritesSection />

                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
                      <Star className="w-6 h-6" />
                      {selectedBusinessLocationId ? 'Recensioni Sede Selezionata' : 'Recensioni Ricevute'}
                    </h2>
                  </div>

                  {reviews.length === 0 ? (
                    <p className="text-gray-600 text-center py-8">
                      {selectedBusinessLocationId
                        ? 'Questa sede non ha ancora ricevuto recensioni'
                        : 'Non hai ancora ricevuto recensioni'}
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {reviews.map((review) => (
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
                          {!review.responses || review.responses.length === 0 ? (
                            <button
                              onClick={() => setShowResponseForm(review.id)}
                              className="mt-3 text-blue-600 text-sm hover:text-blue-700 flex items-center gap-1"
                            >
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

                {selectedBusinessId && <BusinessJobPostingForm businessId={selectedBusinessId} />}

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
                        const monthlyEquivalent = availablePlans.find(
                          p => p.max_persons === plan.max_persons && p.billing_period === 'monthly'
                        );
                        const isAnnual = plan.billing_period === 'yearly';
                        const savings = isAnnual && monthlyEquivalent
                          ? (monthlyEquivalent.price * 12) - plan.price
                          : null;
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
                            <p className="text-xs text-gray-500 mb-4">Fino a {plan.max_persons} {plan.max_persons === 1 ? 'sede' : 'sedi'}</p>
                            <div className="mb-6">
                              <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-bold text-blue-600">€{Number(plan.price).toFixed(2)}</span>
                                <span className="text-gray-600">/{plan.billing_period === 'monthly' ? 'mese' : 'anno'}</span>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">+ IVA</p>
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
                                <Shield className="w-4 h-4 text-blue-600 flex-shrink-0" />
                                <span>Profilo verificato</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-700">
                                <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                                <span>Sconti illimitati</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-700">
                                <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                                <span>Risposte recensioni</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-700">
                                <TrendingUp className="w-4 h-4 text-blue-600 flex-shrink-0" />
                                <span>Statistiche avanzate</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-700">
                                <Star className="w-4 h-4 text-yellow-500 flex-shrink-0" fill="currentColor" />
                                <span>Priorità visibilità</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-700">
                                <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                                <span>Inserire annunci di lavoro</span>
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

                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
                      <Tag className="w-6 h-6" />
                      {selectedBusinessLocationId ? 'Sconti Sede Selezionata' : 'Sconti Attivi'}
                    </h2>
                    <button
                      onClick={() => setShowDiscountForm(true)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                      <Plus className="w-5 h-5" />
                      Crea Sconto
                    </button>
                  </div>

                  {discounts.length === 0 ? (
                    <p className="text-gray-600 text-center py-8">
                      {selectedBusinessLocationId
                        ? 'Questa sede non ha ancora sconti attivi'
                        : 'Non hai ancora creato sconti'}
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {discounts.map((discount) => (
                        <div key={discount.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-semibold">{discount.title}</h4>
                              <p className="text-gray-600 text-sm mt-1">{discount.description}</p>
                              <div className="flex items-center gap-4 mt-2">
                                <span className="text-green-600 font-bold">-{discount.discount_percentage}%</span>
                                <span className="text-sm text-gray-500">Codice: {discount.code}</span>
                              </div>
                            </div>
                            <span className={`px-3 py-1 text-sm rounded-full ${
                              discount.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                            }`}>
                              {discount.active ? 'Attivo' : 'Non attivo'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {selectedBusinessId && (
                  <div className="mt-6">
                    <DiscountVerification businessId={selectedBusinessId} />
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-6">
                <FavoritesSection />

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
                            <p className="text-xs text-gray-500 mb-4">Fino a {plan.max_persons} {plan.max_persons === 1 ? 'persona' : 'persone'}</p>
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
                                <span>Sconti esclusivi</span>
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

        {showDiscountForm && selectedBusinessId && (
          <DiscountForm
            businessId={selectedBusinessId}
            locationId={selectedBusinessLocationId}
            onClose={() => setShowDiscountForm(false)}
            onSuccess={() => {
              setShowDiscountForm(false);
              loadDashboardData();
            }}
          />
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
