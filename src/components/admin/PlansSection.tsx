import { useState, useEffect } from 'react';
import { CreditCard, FileEdit as Edit, Save, X, CheckCircle, Users, Clock, Plus, Trash2, AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../common/Toast';

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
  payment_method_added: boolean;
  customer: {
    id: string;
    full_name: string;
    nickname: string | null;
    email: string;
    user_type: string;
  };
  plan: {
    id: string;
    name: string;
    price: number;
    billing_period: string;
    max_persons: number;
  };
}

interface PlansSectionProps {
  adminId: string;
}

export function PlansSection({ adminId }: PlansSectionProps) {
  const { showToast } = useToast();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deletingPlanId, setDeletingPlanId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'plans' | 'subscriptions'>('plans');

  const emptyPlan = (): Plan => ({
    id: '',
    name: '',
    price: 0,
    billing_period: 'monthly',
    max_persons: 1,
    created_at: '',
  });

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
      showToast('Errore nel caricamento dei piani', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadSubscriptions = async () => {
    try {
      const { data: subsData, error: subsError } = await supabase
        .from('subscriptions')
        .select(`
          id,
          customer_id,
          plan_id,
          status,
          start_date,
          end_date,
          trial_end_date,
          payment_method_added,
          plan:subscription_plans(
            id, name, price, billing_period, max_persons
          )
        `)
        .order('start_date', { ascending: false });

      if (subsError) throw subsError;
      if (!subsData || subsData.length === 0) {
        setSubscriptions([]);
        return;
      }

      const customerIds = [...new Set(subsData.map(s => s.customer_id))];
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, nickname, email, user_type')
        .in('id', customerIds);

      if (profilesError) throw profilesError;

      const profileMap = new Map((profilesData || []).map(p => [p.id, p]));

      const valid = subsData
        .filter(s => s.plan && profileMap.has(s.customer_id))
        .map(s => ({ ...s, customer: profileMap.get(s.customer_id) }));

      setSubscriptions(valid as any);
    } catch (error: any) {
      showToast(`Errore caricamento abbonamenti: ${error.message}`, 'error');
    }
  };

  const savePlan = async () => {
    if (!editingPlan) return;

    try {
      setSaving(true);

      if (isCreating) {
        const { error } = await supabase
          .from('subscription_plans')
          .insert({
            name: editingPlan.name,
            price: editingPlan.price,
            billing_period: editingPlan.billing_period,
            max_persons: editingPlan.max_persons,
          });
        if (error) throw error;
        showToast('Piano creato con successo!', 'success');
      } else {
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
        showToast('Piano aggiornato con successo!', 'success');
      }

      setEditingPlan(null);
      setIsCreating(false);
      loadPlans();
    } catch (error: any) {
      console.error('Error saving plan:', error);
      showToast(`Errore: ${error.message}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  const confirmDeletePlan = async () => {
    if (!deletingPlanId) return;
    try {
      const { error } = await supabase
        .from('subscription_plans')
        .delete()
        .eq('id', deletingPlanId);
      if (error) throw error;
      showToast('Piano eliminato con successo!', 'success');
      setDeletingPlanId(null);
      loadPlans();
      loadSubscriptions();
    } catch (error: any) {
      showToast(`Errore: ${error.message}`, 'error');
      setDeletingPlanId(null);
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

  const activeSubscriptions = subscriptions.filter(s => s.status === 'active' || s.status === 'trial');

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl p-6 mb-6">
        {/* Dot overlay */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />
        <div className="relative flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">
              Abbonamenti
            </p>
            <h2 className="text-2xl font-bold text-white mb-3">Piani e Sottoscrizioni</h2>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 bg-white/10 text-white text-xs font-semibold px-3 py-1 rounded-full">
                <CreditCard className="w-3.5 h-3.5" />
                {plans.length} {plans.length === 1 ? 'piano' : 'piani'}
              </span>
              <span className="inline-flex items-center gap-1.5 bg-white/10 text-white text-xs font-semibold px-3 py-1 rounded-full">
                <Users className="w-3.5 h-3.5" />
                {activeSubscriptions.length} abbonamenti attivi
              </span>
            </div>
          </div>
          <button
            onClick={() => { setEditingPlan(emptyPlan()); setIsCreating(true); }}
            className="flex items-center gap-2 bg-white text-gray-900 px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-gray-100 transition-colors shadow"
          >
            <Plus className="w-4 h-4" />
            Nuovo Piano
          </button>
        </div>
      </div>

      {/* Tab Navigation — outside banner */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('plans')}
          className={`rounded-xl px-5 py-2 text-sm font-semibold transition-colors ${
            activeTab === 'plans'
              ? 'bg-gray-900 text-white'
              : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          <span className="flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            Piani ({plans.length})
          </span>
        </button>
        <button
          onClick={() => setActiveTab('subscriptions')}
          className={`rounded-xl px-5 py-2 text-sm font-semibold transition-colors ${
            activeTab === 'subscriptions'
              ? 'bg-gray-900 text-white'
              : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          <span className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Abbonamenti ({subscriptions.length})
          </span>
        </button>
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
                        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow"
                      >
                        <div className={`-mx-6 -mt-6 mb-4 p-6 rounded-t-2xl text-white bg-gradient-to-r ${colorClass}`}>
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

                        <div className="flex gap-2 mt-4">
                          <button
                            onClick={() => { setEditingPlan(plan); setIsCreating(false); }}
                            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                          >
                            <Edit className="w-4 h-4" />
                            Modifica
                          </button>
                          <button
                            onClick={() => setDeletingPlanId(plan.id)}
                            className="flex items-center justify-center gap-1.5 bg-red-50 text-red-600 border border-red-200 px-3 py-2.5 rounded-lg hover:bg-red-100 transition-colors font-medium"
                          >
                            <Trash2 className="w-4 h-4" />
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
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-900">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Utente</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Piano</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Stato</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Inizio</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Scadenza</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Prezzo</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Pagamento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {subscriptions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      <Clock className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                      <p className="font-semibold">Nessun abbonamento trovato</p>
                      <p className="text-sm">Gli abbonamenti appariranno qui una volta attivati</p>
                    </td>
                  </tr>
                ) : (
                  subscriptions.map((sub) => {
                    const isTrial = sub.status === 'trial';
                    const expiryDate = isTrial && sub.trial_end_date ? sub.trial_end_date : sub.end_date;
                    const expired = isExpired(expiryDate);
                    const expiringSoon = !expired && isExpiringSoon(expiryDate);
                    const isBusiness = sub.customer.user_type === 'business';

                    return (
                      <tr key={sub.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-semibold text-gray-900 flex items-center gap-2">
                              {sub.customer.full_name}
                              <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${isBusiness ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                                {isBusiness ? 'Business' : 'Privato'}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5">{sub.customer.email}</div>
                            {sub.customer.nickname && (
                              <div className="text-xs text-gray-400">@{sub.customer.nickname}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900 text-sm">{sub.plan.name}</div>
                          <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1.5">
                            <span>{getPeriodLabel(sub.plan.billing_period)}</span>
                            <span className="text-gray-300">•</span>
                            <span>
                              {isBusiness
                                ? sub.plan.max_persons === 999 ? 'Sedi illimitate' : `${sub.plan.max_persons} ${sub.plan.max_persons === 1 ? 'sede' : 'sedi'}`
                                : `${sub.plan.max_persons} ${sub.plan.max_persons === 1 ? 'persona' : 'persone'}`}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                            isTrial ? 'bg-yellow-100 text-yellow-800' :
                            expired ? 'bg-red-100 text-red-700' :
                            expiringSoon ? 'bg-orange-100 text-orange-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {isTrial ? <><Clock className="w-3 h-3" />In Prova</> :
                             expired ? 'Scaduto' :
                             expiringSoon ? 'In scadenza' : 'Attivo'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">{formatDate(sub.start_date)}</td>
                        <td className="px-6 py-4 text-sm">
                          <div className={expired ? 'text-red-600 font-semibold' : expiringSoon ? 'text-orange-600 font-semibold' : 'text-gray-700'}>
                            {formatDate(expiryDate)}
                          </div>
                          {isTrial && (
                            <div className="text-xs text-gray-400 mt-0.5">fine prova</div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-semibold text-gray-900">
                            €{parseFloat(sub.plan.price.toString()).toFixed(2)}
                            <span className="text-xs text-gray-400 font-normal">/{sub.plan.billing_period === 'monthly' ? 'mese' : 'anno'}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${sub.payment_method_added ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                            {sub.payment_method_added ? <><CheckCircle className="w-3 h-3" />Aggiunto</> : 'Non aggiunto'}
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
                <h3 className="text-2xl font-bold text-gray-900">{isCreating ? 'Nuovo Piano' : 'Modifica Piano'}</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {isCreating ? 'Crea un nuovo piano di abbonamento' : 'Aggiorna le informazioni del piano di abbonamento'}
                </p>
              </div>
              <button
                onClick={() => { setEditingPlan(null); setIsCreating(false); }}
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
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
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
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Periodo di Fatturazione *
                  </label>
                  <select
                    value={editingPlan.billing_period}
                    onChange={(e) => setEditingPlan({ ...editingPlan, billing_period: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
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
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
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
                  onClick={() => { setEditingPlan(null); setIsCreating(false); }}
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
                  {saving ? 'Salvataggio...' : isCreating ? 'Crea Piano' : 'Salva Modifiche'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {deletingPlanId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Elimina Piano</h3>
                <p className="text-sm text-gray-600">Questa azione non può essere annullata.</p>
              </div>
            </div>
            <p className="text-sm text-gray-700 bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
              Se ci sono abbonamenti attivi associati a questo piano, l'eliminazione potrebbe fallire. Assicurati che nessun utente stia utilizzando questo piano prima di eliminarlo.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeletingPlanId(null)}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-semibold"
              >
                Annulla
              </button>
              <button
                onClick={confirmDeletePlan}
                className="flex-1 bg-red-600 text-white px-4 py-2.5 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2 font-semibold"
              >
                <Trash2 className="w-4 h-4" />
                Elimina Piano
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
