import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../lib/supabase';
import { Check, Heart, Star, Shield, TrendingUp, Users, Gift } from 'lucide-react';

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
  payment_method_added?: boolean;
  reminder_sent?: boolean;
}

export function SubscriptionPage() {
  const { profile, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null);
  const [availablePlans, setAvailablePlans] = useState<SubscriptionPlan[]>([]);
  const [customerPlans, setCustomerPlans] = useState<SubscriptionPlan[]>([]);
  const [businessPlans, setBusinessPlans] = useState<SubscriptionPlan[]>([]);
  const [familyMembersCount, setFamilyMembersCount] = useState(0);
  const [businessLocationsCount, setBusinessLocationsCount] = useState(0);

  const calculateSavings = (plan: SubscriptionPlan) => {
    if (plan.billing_period !== 'yearly') return null;

    const allPlans = [...availablePlans, ...customerPlans, ...businessPlans];
    const monthlyPlan = allPlans.find(
      p => p.max_persons === plan.max_persons && p.billing_period === 'monthly' && p.name.includes('Business') === plan.name.includes('Business')
    );

    if (!monthlyPlan) return null;

    const yearlyIfMonthly = monthlyPlan.price * 12;
    return yearlyIfMonthly - plan.price;
  };

  useEffect(() => {
    if (!profile) {
      loadAllPlansForGuest();
      return;
    }

    if (profile.user_type === 'customer') {
      loadSubscription();
      loadFamilyMembers();
      loadCustomerPlans();
    } else if (profile.user_type === 'business') {
      loadSubscription();
      loadBusinessLocations();
      loadBusinessPlans();
    }
  }, [profile]);

  const loadSubscription = async () => {
    if (!profile) return;

    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('id, status, start_date, end_date, trial_end_date, payment_method_added, reminder_sent, plan:subscription_plans(id, name, price, billing_period, max_persons)')
        .eq('customer_id', profile.id)
        .in('status', ['active', 'trial'])
        .maybeSingle();

      if (error) {
        console.error('Error loading subscription:', error);
        return;
      }

      if (data) {
        setCurrentSubscription(data as any);
      }
    } catch (error) {
      console.error('Error in loadSubscription:', error);
    }
  };

  const loadAllPlansForGuest = async () => {
    const { data: customerData, error: customerError } = await supabase
      .from('subscription_plans')
      .select('*')
      .not('name', 'like', '%Business%')
      .order('max_persons')
      .order('billing_period');

    const { data: businessData, error: businessError } = await supabase
      .from('subscription_plans')
      .select('*')
      .like('name', '%Business%')
      .order('max_persons')
      .order('billing_period');

    if (customerError) {
      console.error('Error loading customer plans:', customerError);
    } else if (customerData) {
      setCustomerPlans(customerData);
    }

    if (businessError) {
      console.error('Error loading business plans:', businessError);
    } else if (businessData) {
      setBusinessPlans(businessData);
    }
  };

  const loadCustomerPlans = async () => {
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .not('name', 'like', '%Business%')
      .order('max_persons')
      .order('billing_period');

    if (error) {
      console.error('Error loading customer plans:', error);
      return;
    }

    if (data) {
      setAvailablePlans(data);
    }
  };

  const loadBusinessPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .like('name', '%Business%')
        .order('billing_period')
        .order('max_persons');

      if (error) {
        console.error('Error loading business plans:', error);
        return;
      }

      if (data) {
        setAvailablePlans(data);
      }
    } catch (error) {
      console.error('Error in loadBusinessPlans:', error);
    }
  };

  const loadFamilyMembers = async () => {
    if (!profile) return;

    try {
      const { data, error } = await supabase
        .from('customer_family_members')
        .select('id')
        .eq('customer_id', profile.id);

      if (error) {
        console.error('Error loading family members:', error);
        setFamilyMembersCount(1);
        return;
      }

      setFamilyMembersCount((data?.length || 0) + 1);
    } catch (error) {
      console.error('Error in loadFamilyMembers:', error);
      setFamilyMembersCount(1);
    }
  };

  const loadBusinessLocations = async () => {
    if (!profile) return;

    try {
      const { data: businesses, error: businessError } = await supabase
        .from('businesses')
        .select('id')
        .eq('owner_id', profile.id)
        .maybeSingle();

      if (businessError) {
        console.error('Error loading business:', businessError);
        setBusinessLocationsCount(0);
        return;
      }

      if (businesses) {
        const { data, error: locationsError } = await supabase
          .from('business_locations')
          .select('id')
          .eq('business_id', businesses.id);

        if (locationsError) {
          console.error('Error loading business locations:', locationsError);
          setBusinessLocationsCount(0);
          return;
        }

        setBusinessLocationsCount(data?.length || 0);
      }
    } catch (error) {
      console.error('Error in loadBusinessLocations:', error);
      setBusinessLocationsCount(0);
    }
  };

  const handleSelectPlan = async (planId: string) => {
    if (!profile) {
      localStorage.setItem('selectedPlanId', planId);
      window.location.href = '/';
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const selectedPlan = availablePlans.find(p => p.id === planId);
      if (!selectedPlan) throw new Error('Piano non trovato');

      const endDate = new Date();
      if (selectedPlan.billing_period === 'monthly') {
        endDate.setMonth(endDate.getMonth() + 1);
      } else {
        endDate.setFullYear(endDate.getFullYear() + 1);
      }

      if (currentSubscription) {
        const { error: updateError } = await supabase
          .from('subscriptions')
          .update({
            plan_id: planId,
            end_date: endDate.toISOString(),
            status: 'active',
          })
          .eq('id', currentSubscription.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('subscriptions')
          .insert({
            customer_id: profile.id,
            plan_id: planId,
            status: 'active',
            end_date: endDate.toISOString(),
          });

        if (insertError) throw insertError;
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          subscription_type: selectedPlan.billing_period === 'monthly' ? 'monthly' : 'annual',
          subscription_status: 'active',
          subscription_expires_at: endDate.toISOString(),
        })
        .eq('id', profile.id);

      if (profileError) throw profileError;

      setMessage('Abbonamento attivato con successo! In un ambiente di produzione, qui si integrerebbe un sistema di pagamento come Stripe.');

      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error('Error updating subscription:', error);
      setMessage('Errore durante l\'attivazione dell\'abbonamento');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Caricamento...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Piani e Prezzi
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-4">
              Scegli il piano perfetto per te o per la tua attività
            </p>
            <p className="text-lg text-gray-700 max-w-3xl mx-auto">
              I primi 3 mesi di abbonamento sono gratuiti e dopo scegli se abbonarti o cancellare il profilo
            </p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-blue-50 border-2 border-green-400 rounded-2xl shadow-xl p-12 mb-12">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mr-4">
                <Heart className="w-8 h-8 text-white" fill="currentColor" />
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
                10% di Beneficenza
              </h2>
            </div>
            <p className="text-xl text-gray-800 max-w-4xl mx-auto leading-relaxed text-center mb-6">
              Il tuo abbonamento fa la differenza! Ogni anno Trovafacile donerà il <strong>10% del fatturato totale</strong> ad associazioni di beneficenza.
            </p>
            <div className="grid md:grid-cols-3 gap-4 max-w-5xl mx-auto mt-8">
              <div className="bg-white/80 backdrop-blur rounded-xl p-4 text-center">
                <Gift className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <p className="text-sm font-semibold text-gray-900">Trasparenza Totale</p>
                <p className="text-xs text-gray-600 mt-1">Documenti certificati pubblici</p>
              </div>
              <div className="bg-white/80 backdrop-blur rounded-xl p-4 text-center">
                <Users className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <p className="text-sm font-semibold text-gray-900">Voti degli Utenti</p>
                <p className="text-xs text-gray-600 mt-1">Tu scegli le associazioni</p>
              </div>
              <div className="bg-white/80 backdrop-blur rounded-xl p-4 text-center">
                <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <p className="text-sm font-semibold text-gray-900">Impatto Reale</p>
                <p className="text-xs text-gray-600 mt-1">Aiuto concreto ogni anno</p>
              </div>
            </div>
          </div>

          <div className="max-w-3xl mx-auto mb-12 bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                  <Check className="w-6 h-6 text-white" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  Accedi per sottoscrivere un abbonamento
                </h3>
                <p className="text-gray-600">
                  Registrati o accedi per attivare il tuo abbonamento e iniziare a usufruire degli sconti esclusivi.
                </p>
              </div>
            </div>
          </div>

          {message && (
            <div className={`max-w-2xl mx-auto mb-8 p-4 rounded-lg ${
              message.includes('successo') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {message}
            </div>
          )}

          <div className="space-y-16">
            <div>
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Piani per Privati</h2>
                <p className="text-gray-600">Perfetto per te e la tua famiglia</p>
              </div>
              {customerPlans.length === 0 ? (
                <div className="max-w-2xl mx-auto p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-yellow-800 text-center">Caricamento piani in corso...</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {customerPlans.map((plan) => {
                    const savings = calculateSavings(plan);
                    const isAnnual = plan.billing_period === 'yearly';
                    return (
                      <div
                        key={plan.id}
                        className={`bg-white rounded-xl shadow-lg p-6 border-2 transition-all relative ${
                          isAnnual ? 'border-green-400 ring-2 ring-green-200' : 'border-gray-200 hover:border-blue-500'
                        }`}
                      >
                        {isAnnual && (
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
                        <button
                          onClick={() => handleSelectPlan(plan.id)}
                          disabled={loading}
                          className={`w-full py-3 px-6 rounded-lg transition-colors font-semibold disabled:bg-gray-400 ${
                            isAnnual
                              ? 'bg-green-600 text-white hover:bg-green-700'
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                          }`}
                        >
                          {loading ? 'Attivazione...' : 'Seleziona Piano'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div>
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Piani per Professionisti</h2>
                <p className="text-gray-600">Ideale per attività commerciali e professionisti</p>
              </div>
              {businessPlans.length === 0 ? (
                <div className="max-w-2xl mx-auto p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-yellow-800 text-center">Caricamento piani in corso...</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {businessPlans.map((plan) => {
                    const monthlyEquivalent = businessPlans.find(
                      p => p.max_persons === plan.max_persons && p.billing_period === 'monthly'
                    );
                    const isAnnual = plan.billing_period === 'yearly';
                    const savings = isAnnual && monthlyEquivalent
                      ? (monthlyEquivalent.price * 12) - plan.price
                      : null;

                    return (
                      <div
                        key={plan.id}
                        className={`bg-white rounded-xl shadow-lg p-6 border-2 transition-all relative ${
                          isAnnual ? 'border-green-400 ring-2 ring-green-200' : 'border-gray-200 hover:border-blue-500'
                        }`}
                      >
                        {isAnnual && (
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
                            <span className="font-semibold">Priorità visibilità</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-700">
                            <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                            <span>Inserire annunci di lavoro</span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleSelectPlan(plan.id)}
                          disabled={loading}
                          className={`w-full py-3 px-6 rounded-lg transition-colors font-semibold disabled:bg-gray-400 ${
                            isAnnual
                              ? 'bg-green-600 text-white hover:bg-green-700'
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                          }`}
                        >
                          {loading ? 'Attivazione...' : 'Seleziona Piano'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (profile?.user_type === 'customer') {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Prezzi Abbonamento
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Gestisci il tuo abbonamento e accedi a sconti esclusivi
            </p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-blue-50 border-2 border-green-400 rounded-2xl shadow-xl p-12 mb-12">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mr-4">
                <Heart className="w-8 h-8 text-white" fill="currentColor" />
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
                10% di Beneficenza
              </h2>
            </div>
            <p className="text-xl text-gray-800 max-w-4xl mx-auto leading-relaxed text-center mb-6">
              Il tuo abbonamento fa la differenza! Ogni anno Trovafacile donerà il <strong>10% del fatturato totale</strong> ad associazioni di beneficenza.
            </p>
            <div className="grid md:grid-cols-3 gap-4 max-w-5xl mx-auto mt-8">
              <div className="bg-white/80 backdrop-blur rounded-xl p-4 text-center">
                <Gift className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <p className="text-sm font-semibold text-gray-900">Trasparenza Totale</p>
                <p className="text-xs text-gray-600 mt-1">Documenti certificati pubblici</p>
              </div>
              <div className="bg-white/80 backdrop-blur rounded-xl p-4 text-center">
                <Users className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <p className="text-sm font-semibold text-gray-900">Voti degli Utenti</p>
                <p className="text-xs text-gray-600 mt-1">Tu scegli le associazioni</p>
              </div>
              <div className="bg-white/80 backdrop-blur rounded-xl p-4 text-center">
                <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <p className="text-sm font-semibold text-gray-900">Impatto Reale</p>
                <p className="text-xs text-gray-600 mt-1">Aiuto concreto ogni anno</p>
              </div>
            </div>
          </div>

          {currentSubscription && (
            <div className="max-w-3xl mx-auto mb-12">
              <div className="bg-white rounded-xl shadow-lg p-8 border-2 border-green-500">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      {currentSubscription.plan.name}
                    </h2>
                    <p className="text-gray-600">
                      Per {familyMembersCount} {familyMembersCount === 1 ? 'persona' : 'persone'}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-blue-600">
                      {currentSubscription.status === 'trial' ? 'GRATIS' : `${currentSubscription.plan.price.toFixed(2)}€`}
                    </div>
                    <div className="text-sm text-gray-600">
                      {currentSubscription.status === 'trial' ? 'per 3 mesi' : currentSubscription.plan.billing_period === 'monthly' ? 'al mese' : 'all\'anno'}
                    </div>
                  </div>
                </div>

                {currentSubscription.status === 'trial' ? (
                  <div>
                    <div className="bg-gradient-to-r from-blue-50 to-green-50 border-2 border-blue-300 rounded-lg p-5 mb-4">
                      <div className="flex items-center gap-2 mb-3">
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="font-semibold text-blue-900">Periodo di Prova Gratuita Attivo</p>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">
                        Il tuo periodo di prova scade il <span className="font-bold">{new Date(currentSubscription.trial_end_date!).toLocaleDateString('it-IT')}</span>
                      </p>
                      <p className="text-xs text-gray-600 mb-4">
                        Riceverai un promemoria 7 giorni prima della scadenza. Nessuna carta di credito richiesta ora.
                      </p>
                      {!currentSubscription.payment_method_added && (
                        <button
                          onClick={() => setMessage('La funzionalità di pagamento sarà disponibile a breve. L\'addebito avverrà solo alla fine del periodo di prova.')}
                          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                        >
                          Aggiungi Metodo di Pagamento
                        </button>
                      )}
                      {currentSubscription.payment_method_added && (
                        <div className="flex items-center gap-2 text-green-700 text-sm">
                          <Check className="w-5 h-5" />
                          <span>Metodo di pagamento aggiunto - L'addebito avverrà il {new Date(currentSubscription.trial_end_date!).toLocaleDateString('it-IT')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-green-800">Abbonamento Attivo</p>
                        <p className="text-sm text-green-700">
                          Scade il {new Date(currentSubscription.end_date).toLocaleDateString('it-IT')}
                        </p>
                      </div>
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    </div>
                  </div>
                )}

                <div className="mt-6 space-y-3">
                  <h3 className="font-semibold text-gray-900 mb-3">Incluso nel tuo piano:</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      Recensioni illimitate per tutti i membri della famiglia
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      Accesso a tutti gli sconti disponibili
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      Salva le tue attività preferite
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      Pubblicare annunci
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      Ricerca offerte di lavoro
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      Ricerca prodotti di ogni genere
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {message && (
            <div className={`max-w-2xl mx-auto mb-8 p-4 rounded-lg ${
              message.includes('successo') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {message}
            </div>
          )}

          {!currentSubscription && availablePlans.length === 0 && (
            <div className="max-w-2xl mx-auto mb-8 p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800">Caricamento dei piani in corso...</p>
            </div>
          )}

          {!currentSubscription && availablePlans.length > 0 && (
            <div className="mt-12">
              <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">
                Scegli il Tuo Piano
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {availablePlans.map((plan) => {
                  const savings = calculateSavings(plan);
                  const isAnnual = plan.billing_period === 'yearly';
                  return (
                    <div
                      key={plan.id}
                      className={`bg-white rounded-xl shadow-lg p-6 border-2 transition-all relative ${
                        isAnnual ? 'border-green-400 ring-2 ring-green-200' : 'border-gray-200 hover:border-blue-500'
                      }`}
                    >
                      {isAnnual && (
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
                        {plan.name.includes('Business') ? (
                          <>
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
                          </>
                        ) : (
                          <>
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
                          </>
                        )}
                      </div>
                      <button
                        onClick={() => handleSelectPlan(plan.id)}
                        disabled={loading}
                        className={`w-full py-3 px-6 rounded-lg transition-colors font-semibold disabled:bg-gray-400 ${
                          isAnnual
                            ? 'bg-green-600 text-white hover:bg-green-700'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        {loading ? 'Attivazione...' : 'Seleziona Piano'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {currentSubscription && availablePlans.length > 0 && (
            <div className="mt-12">
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
                        {plan.name.includes('Business') ? (
                          <>
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
                          </>
                        ) : (
                          <>
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
                          </>
                        )}
                      </div>
                      {isCurrent ? (
                        <div className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold text-center">
                          Piano Attuale
                        </div>
                      ) : (
                        <button
                          onClick={() => handleSelectPlan(plan.id)}
                          disabled={loading}
                          className={`w-full py-3 px-6 rounded-lg transition-colors font-semibold disabled:bg-gray-400 ${
                            isAnnual
                              ? 'bg-green-600 text-white hover:bg-green-700'
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                          }`}
                        >
                          {loading ? 'Cambio...' : 'Cambia Piano'}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Il Tuo Abbonamento Business
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Gestisci la tua attività, rispondi alle recensioni e offri sconti ai tuoi clienti
          </p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-blue-50 border-2 border-green-200 rounded-2xl shadow-lg p-12 mb-12 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
            Il tuo abbonamento vale il 10% di beneficenza
          </h2>
          <p className="text-lg text-gray-700 max-w-4xl mx-auto leading-relaxed">
            Trovafacile ogni anno donerà il 10% del proprio FATTURATO, che sarà visibile con documenti certificati, ad associazioni che voterete voi utenti
          </p>
        </div>

        {currentSubscription && (
          <div className="max-w-3xl mx-auto mb-12">
            <div className="bg-white rounded-xl shadow-lg p-8 border-2 border-green-500">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {currentSubscription.plan.name}
                  </h2>
                  <p className="text-gray-600">
                    Per {businessLocationsCount} {businessLocationsCount === 1 ? 'punto vendita' : 'punti vendita'}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-blue-600">
                    {currentSubscription.status === 'trial' ? 'GRATIS' : `${Number(currentSubscription.plan.price).toFixed(2)}€`}
                  </div>
                  <div className="text-sm text-gray-600">
                    {currentSubscription.status === 'trial' ? 'per 3 mesi' : `${currentSubscription.plan.billing_period === 'monthly' ? 'al mese' : 'all\'anno'} + IVA`}
                  </div>
                </div>
              </div>

              {currentSubscription.status === 'trial' ? (
                <div>
                  <div className="bg-gradient-to-r from-blue-50 to-green-50 border-2 border-blue-300 rounded-lg p-5 mb-4">
                    <div className="flex items-center gap-2 mb-3">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="font-semibold text-blue-900">Periodo di Prova Gratuita Attivo</p>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">
                      Il tuo periodo di prova scade il <span className="font-bold">{new Date(currentSubscription.trial_end_date!).toLocaleDateString('it-IT')}</span>
                    </p>
                    <p className="text-xs text-gray-600 mb-4">
                      Riceverai un promemoria 7 giorni prima della scadenza. Nessuna carta di credito richiesta ora.
                    </p>
                    {!currentSubscription.payment_method_added && (
                      <button
                        onClick={() => setMessage('La funzionalità di pagamento sarà disponibile a breve. L\'addebito avverrà solo alla fine del periodo di prova.')}
                        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                      >
                        Aggiungi Metodo di Pagamento
                      </button>
                    )}
                    {currentSubscription.payment_method_added && (
                      <div className="flex items-center gap-2 text-green-700 text-sm">
                        <Check className="w-5 h-5" />
                        <span>Metodo di pagamento aggiunto - L'addebito avverrà il {new Date(currentSubscription.trial_end_date!).toLocaleDateString('it-IT')}</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-green-800">Abbonamento Attivo</p>
                      <p className="text-sm text-green-700">
                        Scade il {new Date(currentSubscription.end_date).toLocaleDateString('it-IT')}
                      </p>
                    </div>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  </div>
                </div>
              )}

              <div className="mt-6 space-y-3">
                <h3 className="font-semibold text-gray-900 mb-3">Incluso nel tuo piano:</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-600" />
                    Profilo aziendale completo
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-600" />
                    Visualizza e rispondi alle recensioni
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-600" />
                    Crea sconti illimitati
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-600" />
                    Statistiche sulle recensioni
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-600" />
                    Badge di verifica
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-600" />
                    Supporto dedicato
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {message && (
          <div className={`max-w-2xl mx-auto mb-8 p-4 rounded-lg ${
            message.includes('successo') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {message}
          </div>
        )}

        {!currentSubscription && availablePlans.length === 0 && (
          <div className="max-w-2xl mx-auto mb-8 p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800">Caricamento dei piani in corso...</p>
          </div>
        )}

        {!currentSubscription && availablePlans.length > 0 && (
          <div className="mt-12">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">
              Scegli il Tuo Piano
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

                return (
                  <div
                    key={plan.id}
                    className={`bg-white rounded-xl shadow-lg p-6 border-2 transition-all relative ${
                      isAnnual ? 'border-green-400 ring-2 ring-green-200' : 'border-gray-200 hover:border-blue-500'
                    }`}
                  >
                    {isAnnual && (
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
                    <button
                      onClick={() => handleSelectPlan(plan.id)}
                      disabled={loading}
                      className={`w-full py-3 px-6 rounded-lg transition-colors font-semibold disabled:bg-gray-400 ${
                        isAnnual
                          ? 'bg-green-600 text-white hover:bg-green-700'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {loading ? 'Attivazione...' : 'Seleziona Piano'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {currentSubscription && availablePlans.length > 0 && (
          <div className="mt-12">
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
                        onClick={() => handleSelectPlan(plan.id)}
                        disabled={loading}
                        className={`w-full py-3 px-6 rounded-lg transition-colors font-semibold disabled:bg-gray-400 ${
                          isAnnual
                            ? 'bg-green-600 text-white hover:bg-green-700'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        {loading ? 'Cambio...' : 'Cambia Piano'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
