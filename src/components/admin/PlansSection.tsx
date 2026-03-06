import { useState, useEffect } from 'react';
import { CreditCard, FileEdit as Edit, Save, X, CheckCircle, Users, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Plan {
  id: string;
  name: string;
  price: number;
  billing_period: string;
  max_persons: number;
  created_at: string;
}

interface Subscription {
  id: string;
  customer_id: string;
  plan_id: string;
  status: string;
  start_date: string;
  end_date: string;
  trial_end_date: string | null;
  customer: {
    full_name: string;
    nickname: string | null;
    email: string;
    subscription_status: string;
  };
  plan: {
    name: string;
    price: number;
    billing_period: string;
  };
}

interface PlansSectionProps {
  adminId: string;
}

export function PlansSection({ adminId }: PlansSectionProps) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'plans' | 'subscriptions'>('plans');

  useEffect(() => {
    loadPlans();
    loadSubscriptions();
  }, []);

  const loadPlans = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('price', { ascending: true });

      if (error) throw error;
      setPlans(data || []);
    } catch (error: any) {
      console.error('Error loading plans:', error);
      alert('Errore nel caricamento dei piani');
    } finally {
      setLoading(false);
    }
  };

  const loadSubscriptions = async () => {
    try {
      // Carica abbonamenti dalla tabella subscriptions
      const { data: activeSubscriptions, error: subsError } = await supabase
        .from('subscriptions')
        .select(`
          id,
          customer_id,
          plan_id,
          status,
          start_date,
          end_date,
          trial_end_date,
          profiles!subscriptions_customer_id_fkey(
            full_name,
            nickname,
            email,
            subscription_status
          ),
          subscription_plans!subscriptions_plan_id_fkey(
            name,
            price,
            billing_period
          )
        `)
        .order('start_date', { ascending: false });

      if (subsError) {
        console.error('Supabase error loading subscriptions:', subsError);
      }

      // Carica utenti in prova che non hanno record in subscriptions
      const { data: trialUsers, error: trialError } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          nickname,
          email,
          subscription_status,
          subscription_type,
          created_at
        `)
        .eq('subscription_status', 'trial')
        .order('created_at', { ascending: false });

      if (trialError) {
        console.error('Supabase error loading trial users:', trialError);
      }

      // Trasforma i dati da subscriptions
      const transformedSubs = activeSubscriptions?.map(sub => ({
        ...sub,
        customer: Array.isArray(sub.profiles) ? sub.profiles[0] : sub.profiles,
        plan: Array.isArray(sub.subscription_plans) ? sub.subscription_plans[0] : sub.subscription_plans
      })) || [];

      // Trasforma gli utenti in prova in formato subscription
      const transformedTrials = trialUsers?.map(user => {
        const trialStartDate = user.created_at || new Date().toISOString();
        const trialEndDate = new Date(new Date(trialStartDate).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

        return {
          id: `trial-${user.id}`,
          customer_id: user.id,
          plan_id: null,
          status: 'trial',
          start_date: trialStartDate,
          end_date: trialEndDate,
          trial_end_date: trialEndDate,
          customer: {
            full_name: user.full_name,
            nickname: user.nickname,
            email: user.email,
            subscription_status: user.subscription_status
          },
          plan: {
            name: user.subscription_type === 'business' ? 'Piano Business Trial' : 'Piano Trial Gratuito',
            price: 0,
            billing_period: 'trial'
          }
        };
      }) || [];

      // Combina entrambi i risultati
      const allSubscriptions = [...transformedSubs, ...transformedTrials];
      console.log('Total subscriptions loaded:', allSubscriptions.length);
      console.log('Active subscriptions:', transformedSubs.length);
      console.log('Trial users:', transformedTrials.length);
      console.log('All subscriptions data:', allSubscriptions);
      setSubscriptions(allSubscriptions as any);
    } catch (error: any) {
      console.error('Error loading subscriptions:', error);
    }
  };

  const savePlan = async () => {
    if (!editingPlan) return;

    try {
      setSaving(true);
      const { error } = await supabase
        .from('subscription_plans')
        .update({
          name: editingPlan.name,
          price: editingPlan.price,
          billing_period: editingPlan.billing_period,
          max_persons: editingPlan.max_persons,
        })
        .eq('id', editingPlan.id);

      if (error) throw error;

      alert('Piano aggiornato con successo!');
      setEditingPlan(null);
      loadPlans();
    } catch (error: any) {
      console.error('Error saving plan:', error);
      alert(`Errore: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const getPeriodLabel = (period: string) => {
    switch (period) {
      case 'monthly':
        return 'Mensile';
      case 'yearly':
        return 'Annuale';
      case 'trial':
        return 'Prova Gratuita';
      default:
        return period;
    }
  };

  const getPlanType = (name: string) => {
    if (name.toLowerCase().includes('business')) {
      return 'Business';
    }
    return 'Privato';
  };

  const getPlanColor = (plan: Plan) => {
    const isBusiness = getPlanType(plan.name) === 'Business';
    const isYearly = plan.billing_period === 'yearly';

    if (!isBusiness && !isYearly) {
      return 'from-blue-600 to-blue-700';
    } else if (!isBusiness && isYearly) {
      return 'from-green-600 to-green-700';
    } else if (isBusiness && !isYearly) {
      return 'from-orange-600 to-orange-700';
    } else {
      return 'from-purple-600 to-purple-700';
    }
  };

  const organizePlans = () => {
    const privateMonthly = plans.filter(p => !p.name.toLowerCase().includes('business') && p.billing_period === 'monthly');
    const privateYearly = plans.filter(p => !p.name.toLowerCase().includes('business') && p.billing_period === 'yearly');
    const businessMonthly = plans.filter(p => p.name.toLowerCase().includes('business') && p.billing_period === 'monthly');
    const businessYearly = plans.filter(p => p.name.toLowerCase().includes('business') && p.billing_period === 'yearly');

    return [
      { title: 'Piani Privati Mensili', plans: privateMonthly, borderColor: 'border-blue-600', bgColor: 'bg-blue-50' },
      { title: 'Piani Privati Annuali', plans: privateYearly, borderColor: 'border-green-600', bgColor: 'bg-green-50' },
      { title: 'Piani Business Mensili', plans: businessMonthly, borderColor: 'border-orange-600', bgColor: 'bg-orange-50' },
      { title: 'Piani Business Annuali', plans: businessYearly, borderColor: 'border-purple-600', bgColor: 'bg-purple-50' },
    ];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const planGroups = organizePlans();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const isExpiringSoon = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const daysLeft = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysLeft <= 7 && daysLeft > 0;
  };

  const isExpired = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    return end < now;
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestione Abbonamenti</h2>
          <p className="text-sm text-gray-600 mt-1">
            Visualizza e modifica i piani di abbonamento della piattaforma
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex">
          <button
            onClick={() => setActiveTab('plans')}
            className={`flex-1 px-6 py-4 font-semibold transition-colors ${
              activeTab === 'plans'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <CreditCard className="w-5 h-5" />
              <span>Piani Disponibili ({plans.length})</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('subscriptions')}
            className={`flex-1 px-6 py-4 font-semibold transition-colors ${
              activeTab === 'subscriptions'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Users className="w-5 h-5" />
              <span>Abbonamenti Attivi ({subscriptions.length})</span>
            </div>
          </button>
        </div>
      </div>

      {/* Plans Tab */}
      {activeTab === 'plans' && (
        <>
          {planGroups.map((group, groupIndex) => (
            group.plans.length > 0 && (
              <div key={groupIndex} className="space-y-4">
                <div className={`border-l-4 ${group.borderColor} pl-4 py-2 ${group.bgColor} rounded-r-lg`}>
                  <h3 className="text-xl font-bold text-gray-900">{group.title}</h3>
                  <p className="text-sm text-gray-600">{group.plans.length} {group.plans.length === 1 ? 'piano disponibile' : 'piani disponibili'}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {group.plans.map((plan) => {
                    const planType = getPlanType(plan.name);
                    const isBusiness = planType === 'Business';
                    const colorClass = getPlanColor(plan);

                    return (
                      <div
                        key={plan.id}
                        className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
                      >
                        <div className={`p-6 text-white bg-gradient-to-r ${colorClass}`}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="bg-white/20 text-white text-xs px-3 py-1 rounded-full font-semibold">
                              {planType}
                            </span>
                            <span className="bg-white/20 text-white text-xs px-3 py-1 rounded-full font-semibold">
                              {getPeriodLabel(plan.billing_period)}
                            </span>
                          </div>
                          <h3 className="text-lg font-bold mb-3 line-clamp-2">{plan.name}</h3>
                          <div className="flex items-baseline gap-1">
                            <span className="text-4xl font-bold">€{parseFloat(plan.price.toString()).toFixed(2)}</span>
                            <span className="text-blue-100">/{plan.billing_period === 'monthly' ? 'mese' : 'anno'}</span>
                          </div>
                        </div>

                        <div className="p-6 space-y-4">
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 text-sm">
                              <Users className="w-5 h-5 text-blue-600" />
                              <span className="font-medium">
                                {isBusiness ? (
                                  plan.max_persons === 999 ? (
                                    'Sedi illimitate'
                                  ) : (
                                    `Fino a ${plan.max_persons} ${plan.max_persons === 1 ? 'sede' : 'sedi'}`
                                  )
                                ) : (
                                  `Fino a ${plan.max_persons} ${plan.max_persons === 1 ? 'persona' : 'persone'}`
                                )}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <CheckCircle className="w-5 h-5 text-green-600" />
                              <span>Tutte le funzionalità incluse</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <CheckCircle className="w-5 h-5 text-green-600" />
                              <span>{plan.billing_period === 'yearly' ? 'Risparmio annuale' : 'Flessibilità mensile'}</span>
                            </div>
                          </div>

                          <button
                            onClick={() => setEditingPlan(plan)}
                            className="w-full mt-4 flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                          >
                            <Edit className="w-4 h-4" />
                            Modifica Piano
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )
          ))}
        </>
      )}

      {/* Subscriptions Tab */}
      {activeTab === 'subscriptions' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Utente
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Piano
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Stato
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Inizio
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Scadenza
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Prezzo
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {subscriptions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      <Clock className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                      <p className="font-semibold">Nessun abbonamento attivo</p>
                      <p className="text-sm">Gli abbonamenti appariranno qui una volta attivati</p>
                    </td>
                  </tr>
                ) : (
                  subscriptions.map((sub) => {
                    if (!sub.customer || !sub.plan) {
                      console.error('Invalid subscription data:', sub);
                      return null;
                    }

                    const expired = isExpired(sub.end_date);
                    const expiringSoon = isExpiringSoon(sub.end_date);
                    const isTrial = sub.customer.subscription_status === 'trial';

                    return (
                      <tr key={sub.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-semibold text-gray-900">
                              {sub.customer.nickname || sub.customer.full_name}
                            </div>
                            <div className="text-sm text-gray-500">{sub.customer.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">{sub.plan.name}</div>
                          <div className="text-xs text-gray-500">
                            {getPeriodLabel(sub.plan.billing_period)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full ${
                              isTrial
                                ? 'bg-yellow-100 text-yellow-700'
                                : expired
                                ? 'bg-red-100 text-red-700'
                                : expiringSoon
                                ? 'bg-orange-100 text-orange-700'
                                : 'bg-green-100 text-green-700'
                            }`}
                          >
                            {isTrial ? (
                              <>
                                <Clock className="w-3.5 h-3.5" />
                                In Prova
                              </>
                            ) : expired ? (
                              'Scaduto'
                            ) : expiringSoon ? (
                              'In scadenza'
                            ) : (
                              'Attivo'
                            )}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {formatDate(sub.start_date)}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className={expired ? 'text-red-600 font-semibold' : expiringSoon ? 'text-orange-600 font-semibold' : 'text-gray-700'}>
                            {isTrial && sub.trial_end_date
                              ? formatDate(sub.trial_end_date)
                              : formatDate(sub.end_date)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-semibold text-gray-900">
                            €{parseFloat(sub.plan.price.toString()).toFixed(2)}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {editingPlan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Modifica Piano</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Aggiorna le informazioni del piano di abbonamento
                </p>
              </div>
              <button
                onClick={() => setEditingPlan(null)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nome Piano *
                </label>
                <input
                  type="text"
                  value={editingPlan.name}
                  onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Es: Piano Mensile - 2 Persone"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Prezzo (€) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editingPlan.price}
                    onChange={(e) => setEditingPlan({ ...editingPlan, price: parseFloat(e.target.value) || 0 })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Periodo di Fatturazione *
                  </label>
                  <select
                    value={editingPlan.billing_period}
                    onChange={(e) => setEditingPlan({ ...editingPlan, billing_period: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="monthly">Mensile</option>
                    <option value="yearly">Annuale</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {getPlanType(editingPlan.name) === 'Business' ? 'Numero Massimo Sedi *' : 'Numero Massimo Persone *'}
                </label>
                <input
                  type="number"
                  min="1"
                  value={editingPlan.max_persons}
                  onChange={(e) => setEditingPlan({ ...editingPlan, max_persons: parseInt(e.target.value) || 1 })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {getPlanType(editingPlan.name) === 'Business'
                    ? 'Per sedi illimitate, usa 999'
                    : 'Numero di membri famiglia inclusi nel piano'}
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">Anteprima</h4>
                <div className="space-y-1 text-sm text-blue-800">
                  <p><span className="font-medium">Nome:</span> {editingPlan.name}</p>
                  <p><span className="font-medium">Prezzo:</span> €{parseFloat(editingPlan.price.toString()).toFixed(2)}</p>
                  <p><span className="font-medium">Periodo:</span> {getPeriodLabel(editingPlan.billing_period)}</p>
                  <p>
                    <span className="font-medium">Capacità:</span>{' '}
                    {getPlanType(editingPlan.name) === 'Business'
                      ? editingPlan.max_persons === 999
                        ? 'Sedi illimitate'
                        : `${editingPlan.max_persons} ${editingPlan.max_persons === 1 ? 'sede' : 'sedi'}`
                      : `${editingPlan.max_persons} ${editingPlan.max_persons === 1 ? 'persona' : 'persone'}`}
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-6 border-t">
                <button
                  onClick={() => setEditingPlan(null)}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-semibold"
                >
                  Annulla
                </button>
                <button
                  onClick={savePlan}
                  disabled={saving || !editingPlan.name || editingPlan.price <= 0 || editingPlan.max_persons < 1}
                  className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  <Save className="w-5 h-5" />
                  {saving ? 'Salvataggio...' : 'Salva Modifiche'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
