import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { SubscriptionCard, CUSTOMER_PLANS, BUSINESS_PLANS } from '../components/subscription/SubscriptionCard';

export function SubscriptionPage() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const plans = profile?.user_type === 'business' ? BUSINESS_PLANS : CUSTOMER_PLANS;

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

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Scegli il Tuo Piano
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {profile.user_type === 'business'
              ? 'Gestisci la tua attività, rispondi alle recensioni e offri sconti ai tuoi clienti'
              : 'Scrivi recensioni illimitate e accedi a sconti esclusivi'}
          </p>

          {profile.subscription_status === 'active' && (
            <div className="mt-6 inline-block bg-green-100 text-green-800 px-6 py-3 rounded-lg">
              <p className="font-semibold">Abbonamento {profile.subscription_type === 'monthly' ? 'Mensile' : 'Annuale'} Attivo</p>
              <p className="text-sm">
                Scade il {new Date(profile.subscription_expires_at!).toLocaleDateString('it-IT')}
              </p>
            </div>
          )}
        </div>

        {message && (
          <div className={`max-w-2xl mx-auto mb-8 p-4 rounded-lg ${
            message.includes('successo') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {message}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <SubscriptionCard
              key={plan.type}
              plan={plan}
              userType={profile.user_type}
              onSelect={() => handleSelectPlan(plan.type)}
            />
          ))}
        </div>

        <div className="mt-12 text-center text-gray-600">
          <p className="text-sm">
            Nota: Questa è una demo. In produzione, qui si integrerebbe un sistema di pagamento come Stripe.
          </p>
        </div>
      </div>
    </div>
  );
}
