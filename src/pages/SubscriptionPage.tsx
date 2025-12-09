import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { SubscriptionCard, BUSINESS_PLANS } from '../components/subscription/SubscriptionCard';

interface Subscription {
  id: string;
  plan: {
    id: string;
    name: string;
    price: number;
    billing_period: 'monthly' | 'yearly';
    max_persons: number;
  };
  status: string;
  start_date: string;
  end_date: string;
}

export function SubscriptionPage() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null);
  const [familyMembersCount, setFamilyMembersCount] = useState(0);
  const [businessLocationsCount, setBusinessLocationsCount] = useState(0);

  useEffect(() => {
    if (profile?.user_type === 'customer') {
      loadSubscription();
      loadFamilyMembers();
    } else if (profile?.user_type === 'business') {
      loadSubscription();
      loadBusinessLocations();
    }
  }, [profile]);

  const loadSubscription = async () => {
    if (!profile) return;

    const { data, error } = await supabase
      .from('subscriptions')
      .select('id, status, start_date, end_date, plan:subscription_plans(id, name, price, billing_period, max_persons)')
      .eq('customer_id', profile.id)
      .eq('status', 'active')
      .single();

    if (!error && data) {
      setCurrentSubscription(data as any);
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

  const plans = profile?.user_type === 'business' ? BUSINESS_PLANS : [];

  const handleSelectPlan = async (type: 'monthly' | 'annual') => {
    if (!profile) return;

    setLoading(true);
    setMessage('');

    try {
      const expiresAt = new Date();
      if (type === 'monthly') {
        expiresAt.setMonth(expiresAt.getMonth() + 1);
      } else {
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          subscription_type: type,
          subscription_status: 'active',
          subscription_expires_at: expiresAt.toISOString(),
        })
        .eq('id', profile.id);

      if (error) throw error;

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

          <div className="mt-12 text-center text-gray-600">
            <p className="text-sm">
              Per modificare il tuo abbonamento, contatta il supporto clienti.
            </p>
          </div>
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
                    {currentSubscription.plan.price.toFixed(2)}€
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
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    Profilo aziendale completo
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    Visualizza e rispondi alle recensioni
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    Crea sconti illimitati
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    Statistiche sulle recensioni
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    Badge di verifica
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
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

        <div className="mt-12 text-center text-gray-600">
          <p className="text-sm">
            Per modificare il tuo abbonamento, contatta il supporto clienti.
          </p>
        </div>
      </div>
    </div>
  );
}
