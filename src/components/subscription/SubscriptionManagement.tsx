import { useState, useEffect } from 'react';
import { CreditCard, Check } from 'lucide-react';
import { supabase } from '../../lib/supabase';

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

interface SubscriptionManagementProps {
  userId: string;
  userType: 'customer' | 'business';
  currentSubscriptionStatus: string;
  onUpdate: () => void;
}

export function SubscriptionManagement({
  userId,
  userType,
  currentSubscriptionStatus,
  onUpdate
}: SubscriptionManagementProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null);
  const [availablePlans, setAvailablePlans] = useState<SubscriptionPlan[]>([]);
  const [showPlans, setShowPlans] = useState(false);

  useEffect(() => {
    loadSubscription();
    loadPlans();
  }, [userId, userType]);

  const loadSubscription = async () => {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('id, status, start_date, end_date, plan:subscription_plans(id, name, price, billing_period, max_persons)')
      .eq('customer_id', userId)
      .eq('status', 'active')
      .maybeSingle();

    if (!error && data) {
      setCurrentSubscription(data as any);
    }
  };

  const loadPlans = async () => {
    const filter = userType === 'customer' ? 'Piano %Persona%' : '%Business%';
    const { data } = await supabase
      .from('subscription_plans')
      .select('*')
      .like('name', filter)
      .order('billing_period')
      .order('max_persons');

    if (data) {
      setAvailablePlans(data);
    }
  };

  const handleSelectPlan = async (planId: string) => {
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
            customer_id: userId,
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
        .eq('id', userId);

      if (profileError) throw profileError;

      setMessage('Abbonamento attivato con successo!');
      setShowPlans(false);

      setTimeout(() => {
        onUpdate();
        setMessage('');
      }, 2000);
    } catch (error) {
      console.error('Error updating subscription:', error);
      setMessage('Errore durante l\'attivazione dell\'abbonamento');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-8 mb-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <CreditCard className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Abbonamento</h2>
        </div>
        {currentSubscription ? (
          <button
            onClick={() => setShowPlans(!showPlans)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            {showPlans ? 'Nascondi Piani' : 'Cambia Piano'}
          </button>
        ) : (
          <button
            onClick={() => setShowPlans(!showPlans)}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors font-semibold"
          >
            {showPlans ? 'Nascondi' : 'Attiva Abbonamento'}
          </button>
        )}
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-lg ${
          message.includes('successo') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {message}
        </div>
      )}

      {currentSubscription && (
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Piano Attuale</p>
              <p className="text-2xl font-bold text-gray-900">{currentSubscription.plan.name}</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-blue-600">
                €{Number(currentSubscription.plan.price).toFixed(2)}
              </p>
              <p className="text-sm text-gray-600">
                {currentSubscription.plan.billing_period === 'monthly' ? 'al mese' : 'all\'anno'}
              </p>
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

          <div className="mt-4 space-y-2">
            <h3 className="font-semibold text-gray-900">Incluso:</h3>
            <ul className="space-y-1 text-sm text-gray-700">
              {userType === 'customer' ? (
                <>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    Recensioni illimitate
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    Accesso a tutti gli sconti
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    Supporto prioritario
                  </li>
                </>
              ) : (
                <>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    Profilo aziendale completo
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    Gestione recensioni
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    Sconti illimitati
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>
      )}

      {!currentSubscription && !showPlans && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <p className="text-yellow-800 font-semibold mb-2">Nessun abbonamento attivo</p>
          <p className="text-yellow-700 text-sm">
            Attiva un abbonamento per accedere a tutte le funzionalità
          </p>
        </div>
      )}

      {showPlans && availablePlans.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            {currentSubscription ? 'Piani Disponibili' : 'Scegli il Tuo Piano'}
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {availablePlans.map((plan) => (
              <div
                key={plan.id}
                className={`border-2 rounded-lg p-4 transition-all ${
                  currentSubscription?.plan.id === plan.id
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-blue-500'
                }`}
              >
                <h4 className="font-bold text-gray-900 mb-2">{plan.name}</h4>
                <div className="mb-4">
                  <span className="text-3xl font-bold text-blue-600">
                    €{Number(plan.price).toFixed(2)}
                  </span>
                  <span className="text-sm text-gray-600">
                    /{plan.billing_period === 'monthly' ? 'mese' : 'anno'}
                  </span>
                </div>
                {currentSubscription?.plan.id === plan.id ? (
                  <div className="w-full bg-green-600 text-white py-2 px-4 rounded-lg font-semibold text-center text-sm">
                    Piano Attuale
                  </div>
                ) : (
                  <button
                    onClick={() => handleSelectPlan(plan.id)}
                    disabled={loading}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:bg-gray-400 text-sm"
                  >
                    {loading ? 'Attivazione...' : 'Seleziona'}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
