import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Check } from 'lucide-react';

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
}

export function SubscriptionPage() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null);
  const [availablePlans, setAvailablePlans] = useState<SubscriptionPlan[]>([]);
  const [familyMembersCount, setFamilyMembersCount] = useState(0);
  const [businessLocationsCount, setBusinessLocationsCount] = useState(0);

  useEffect(() => {
    if (profile?.user_type === 'customer') {
      loadSubscription();
      loadFamilyMembers();
      loadCustomerPlans();
    } else if (profile?.user_type === 'business') {
      loadSubscription();
      loadBusinessLocations();
      loadBusinessPlans();
    }
  }, [profile]);

  const loadSubscription = async () => {
    if (!profile) return;

    const { data, error } = await supabase
      .from('subscriptions')
      .select('id, status, start_date, end_date, plan:subscription_plans(id, name, price, billing_period, max_persons)')
      .eq('customer_id', profile.id)
      .eq('status', 'active')
      .maybeSingle();

    if (!error && data) {
      setCurrentSubscription(data as any);
    }
  };

  const loadCustomerPlans = async () => {
    const { data } = await supabase
      .from('subscription_plans')
      .select('*')
      .like('name', 'Piano %Persona%')
      .order('billing_period')
      .order('max_persons');

    if (data) {
      setAvailablePlans(data);
    }
  };

  const loadBusinessPlans = async () => {
    const { data } = await supabase
      .from('subscription_plans')
      .select('*')
      .like('name', '%Business%')
      .order('billing_period')
      .order('max_persons');

    if (data) {
      setAvailablePlans(data);
    }
  };

  const loadFamilyMembers = async () => {
    if (!profile) return;

    const { data } = await supabase
      .from('customer_family_members')
      .select('id')
      .eq('customer_id', profile.id);

    setFamilyMembersCount((data?.length || 0) + 1);
  };

  const loadBusinessLocations = async () => {
    if (!profile) return;

    const { data: businesses } = await supabase
      .from('businesses')
      .select('id')
      .eq('owner_id', profile.id)
      .single();

    if (businesses) {
      const { data } = await supabase
        .from('business_locations')
        .select('id')
        .eq('business_id', businesses.id);

      setBusinessLocationsCount(data?.length || 0);
    }
  };

  const handleSelectPlan = async (planId: string) => {
    if (!profile) return;

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

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Caricamento...</p>
      </div>
    );
  }

  if (profile?.user_type === 'customer') {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Il Tuo Abbonamento
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Gestisci il tuo abbonamento e accedi a sconti esclusivi
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
                      Per {familyMembersCount} {familyMembersCount === 1 ? 'persona' : 'persone'}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-blue-600">
                      {currentSubscription.plan.price.toFixed(2)}€
                    </div>
                    <div className="text-sm text-gray-600">
                      {currentSubscription.plan.billing_period === 'monthly' ? 'al mese' : 'all\'anno'}
                    </div>
                  </div>
                </div>

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
                      Supporto clienti prioritario
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

          {!currentSubscription && availablePlans.length > 0 && (
            <div className="mt-12">
              <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">
                Scegli il Tuo Piano
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {availablePlans.map((plan) => (
                  <div
                    key={plan.id}
                    className="bg-white rounded-xl shadow-lg p-6 border-2 border-gray-200 hover:border-blue-500 transition-all"
                  >
                    <h3 className="text-xl font-bold text-gray-900 mb-4">
                      {plan.name}
                    </h3>
                    <div className="mb-6">
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-bold text-blue-600">€{Number(plan.price).toFixed(2)}</span>
                        <span className="text-gray-600">/{plan.billing_period === 'monthly' ? 'mese' : 'anno'}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleSelectPlan(plan.id)}
                      disabled={loading}
                      className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:bg-gray-400"
                    >
                      {loading ? 'Attivazione...' : 'Seleziona Piano'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentSubscription && availablePlans.length > 0 && (
            <div className="mt-12">
              <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">
                Cambia Piano
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {availablePlans.map((plan) => (
                  <div
                    key={plan.id}
                    className={`bg-white rounded-xl shadow-lg p-6 border-2 transition-all ${
                      currentSubscription.plan.id === plan.id
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-blue-500'
                    }`}
                  >
                    <h3 className="text-xl font-bold text-gray-900 mb-4">
                      {plan.name}
                    </h3>
                    <div className="mb-6">
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-bold text-blue-600">€{Number(plan.price).toFixed(2)}</span>
                        <span className="text-gray-600">/{plan.billing_period === 'monthly' ? 'mese' : 'anno'}</span>
                      </div>
                    </div>
                    {currentSubscription.plan.id === plan.id ? (
                      <div className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold text-center">
                        Piano Attuale
                      </div>
                    ) : (
                      <button
                        onClick={() => handleSelectPlan(plan.id)}
                        disabled={loading}
                        className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:bg-gray-400"
                      >
                        {loading ? 'Cambio...' : 'Cambia Piano'}
                      </button>
                    )}
                  </div>
                ))}
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
                    {Number(currentSubscription.plan.price).toFixed(2)}€
                  </div>
                  <div className="text-sm text-gray-600">
                    {currentSubscription.plan.billing_period === 'monthly' ? 'al mese' : 'all\'anno'} + IVA
                  </div>
                </div>
              </div>

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

        {!currentSubscription && availablePlans.length > 0 && (
          <div className="mt-12">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">
              Scegli il Tuo Piano
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {availablePlans.map((plan) => (
                <div
                  key={plan.id}
                  className="bg-white rounded-xl shadow-lg p-6 border-2 border-gray-200 hover:border-blue-500 transition-all"
                >
                  <h3 className="text-xl font-bold text-gray-900 mb-4">
                    {plan.name}
                  </h3>
                  <div className="mb-6">
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold text-blue-600">€{Number(plan.price).toFixed(2)}</span>
                      <span className="text-gray-600">/{plan.billing_period === 'monthly' ? 'mese' : 'anno'}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleSelectPlan(plan.id)}
                    disabled={loading}
                    className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:bg-gray-400"
                  >
                    {loading ? 'Attivazione...' : 'Seleziona Piano'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentSubscription && availablePlans.length > 0 && (
          <div className="mt-12">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">
              Cambia Piano
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {availablePlans.map((plan) => (
                <div
                  key={plan.id}
                  className={`bg-white rounded-xl shadow-lg p-6 border-2 transition-all ${
                    currentSubscription.plan.id === plan.id
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-blue-500'
                  }`}
                >
                  <h3 className="text-xl font-bold text-gray-900 mb-4">
                    {plan.name}
                  </h3>
                  <div className="mb-6">
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold text-blue-600">€{Number(plan.price).toFixed(2)}</span>
                      <span className="text-gray-600">/{plan.billing_period === 'monthly' ? 'mese' : 'anno'}</span>
                    </div>
                  </div>
                  {currentSubscription.plan.id === plan.id ? (
                    <div className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold text-center">
                      Piano Attuale
                    </div>
                  ) : (
                    <button
                      onClick={() => handleSelectPlan(plan.id)}
                      disabled={loading}
                      className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:bg-gray-400"
                    >
                      {loading ? 'Cambio...' : 'Cambia Piano'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
