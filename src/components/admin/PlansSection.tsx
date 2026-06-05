import { useState, useEffect } from 'react';
import { CreditCard, FileEdit as Edit, Save, X, CheckCircle, Users, Clock, Plus, Trash2, AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../common/Toast';

interface FeatureDef {
  key: string;
  label: string;
  description: string;
  category: 'base' | 'social' | 'content' | 'business';
}

const ALL_FEATURES: FeatureDef[] = [
  // Base
  { key: 'search', label: 'Ricerca attività', description: 'Cerca attività per nome, categoria e città', category: 'base' },
  { key: 'map', label: 'Mappa interattiva', description: 'Visualizza attività su mappa', category: 'base' },
  { key: 'notifications', label: 'Notifiche', description: 'Ricevi notifiche in tempo reale', category: 'base' },
  { key: 'favorites', label: 'Preferiti', description: 'Salva attività nei preferiti', category: 'base' },
  { key: 'leaderboard', label: 'Classifica punti', description: 'Accedi alla classifica utenti', category: 'base' },
  // Social
  { key: 'reviews', label: 'Recensioni', description: 'Scrivi e leggi recensioni', category: 'social' },
  { key: 'messages', label: 'Messaggistica', description: 'Invia messaggi privati', category: 'social' },
  { key: 'reports', label: 'Segnalazioni', description: 'Segnala contenuti inappropriati', category: 'social' },
  // Content
  { key: 'classified_ads', label: 'Annunci', description: 'Pubblica e visualizza annunci', category: 'content' },
  { key: 'auctions', label: 'Aste', description: 'Partecipa e crea aste', category: 'content' },
  { key: 'job_postings', label: 'Offerte di lavoro', description: 'Pubblica e visualizza offerte', category: 'content' },
  { key: 'job_seeker', label: 'Cerca lavoro', description: 'Crea profilo cercasi lavoro', category: 'content' },
  { key: 'solidarity', label: 'Solidarietà', description: 'Accedi alla sezione solidarietà', category: 'content' },
  { key: 'discounts', label: 'Sconti', description: 'Accedi e pubblica sconti', category: 'content' },
  // Business / Profilo avanzato
  { key: 'family_members', label: 'Membri famiglia', description: 'Aggiungi profili familiari', category: 'business' },
  { key: 'professional_profile', label: 'Profilo professionale', description: 'Crea profilo professionale', category: 'business' },
  { key: 'add_business', label: 'Segnala attività', description: "Segnala nuove attività mancanti", category: 'business' },
  { key: 'claim_business', label: 'Reclama attività', description: 'Reclama la tua attività', category: 'business' },
  { key: 'business_dashboard', label: 'Pannello business', description: 'Dashboard gestione attività', category: 'business' },
  { key: 'multiple_locations', label: 'Sedi multiple', description: 'Gestisci più sedi', category: 'business' },
  { key: 'points', label: 'Sistema punti', description: 'Accumula e usa punti', category: 'base' },
];

const CATEGORY_LABELS: Record<string, string> = {
  base: 'Funzionalità Base',
  social: 'Funzionalità Social',
  content: 'Contenuti & Servizi',
  business: 'Business & Professionisti',
};

interface Plan {
  id: string;
  name: string;
  price: number;
  billing_period: string;
  max_persons: number;
  features: string[];
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
    features: [],
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
      setPlans((data || []).map(p => ({ ...p, features: Array.isArray(p.features) ? p.features : [] })));
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

  const toggleFeature = (key: string) => {
    if (!editingPlan) return;
    const current = editingPlan.features || [];
    const updated = current.includes(key)
      ? current.filter(f => f !== key)
      : [...current, key];
    setEditingPlan({ ...editingPlan, features: updated });
  };

  const toggleAllInCategory = (category: string) => {
    if (!editingPlan) return;
    const catKeys = ALL_FEATURES.filter(f => f.category === category).map(f => f.key);
    const allSelected = catKeys.every(k => (editingPlan.features || []).includes(k));
    const current = editingPlan.features || [];
    const updated = allSelected
      ? current.filter(k => !catKeys.includes(k))
      : [...new Set([...current, ...catKeys])];
    setEditingPlan({ ...editingPlan, features: updated });
  };

  const savePlan = async () => {
    if (!editingPlan) return;

    try {
      setSaving(true);

      const payload = {
        name: editingPlan.name,
        price: editingPlan.price,
        billing_period: editingPlan.billing_period,
        max_persons: editingPlan.max_persons,
        features: editingPlan.features || [],
      };

      if (isCreating) {
        const { error } = await supabase.from('subscription_plans').insert(payload);
        if (error) throw error;
        showToast('Piano creato con successo!', 'success');
      } else {
        const { error } = await supabase
          .from('subscription_plans')
          .update(payload)
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
      case 'monthly': return 'Mensile';
      case 'yearly': return 'Annuale';
      case 'trial': return 'Prova Gratuita';
      default: return period;
    }
  };

  const getPlanType = (name: string) => name.toLowerCase().includes('business') ? 'Business' : 'Privato';

  const getPlanColor = (plan: Plan) => {
    const isBusiness = getPlanType(plan.name) === 'Business';
    const isYearly = plan.billing_period === 'yearly';
    if (!isBusiness && !isYearly) return 'from-blue-600 to-blue-700';
    if (!isBusiness && isYearly) return 'from-green-600 to-green-700';
    if (isBusiness && !isYearly) return 'from-orange-600 to-orange-700';
    return 'from-violet-600 to-violet-700';
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
      { title: 'Piani Business Annuali', plans: businessYearly, borderColor: 'border-violet-600', bgColor: 'bg-violet-50' },
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
    return new Date(dateString).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const isExpiringSoon = (endDate: string) => {
    const daysLeft = Math.ceil((new Date(endDate).getTime() - Date.now()) / 86400000);
    return daysLeft <= 7 && daysLeft > 0;
  };

  const isExpired = (endDate: string) => new Date(endDate) < new Date();

  const activeSubscriptions = subscriptions.filter(s => s.status === 'active' || s.status === 'trial');

  const categories = ['base', 'social', 'content', 'business'] as const;

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl p-6 mb-6">
        <div
          className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '24px 24px' }}
        />
        <div className="relative flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Abbonamenti</p>
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

      {/* Tab Navigation */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('plans')}
          className={`rounded-xl px-5 py-2 text-sm font-semibold transition-colors ${activeTab === 'plans' ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
        >
          <span className="flex items-center gap-2"><CreditCard className="w-4 h-4" />Piani ({plans.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('subscriptions')}
          className={`rounded-xl px-5 py-2 text-sm font-semibold transition-colors ${activeTab === 'subscriptions' ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
        >
          <span className="flex items-center gap-2"><Users className="w-4 h-4" />Abbonamenti ({subscriptions.length})</span>
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
                    const enabledFeatures = (plan.features || [])
                      .map(k => ALL_FEATURES.find(f => f.key === k))
                      .filter(Boolean) as FeatureDef[];
                    const visibleFeatures = enabledFeatures.slice(0, 5);
                    const extraCount = enabledFeatures.length - visibleFeatures.length;

                    return (
                      <div key={plan.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex flex-col">
                        {/* Card header */}
                        <div className={`p-5 rounded-t-2xl text-white bg-gradient-to-r ${colorClass}`}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="bg-white/20 text-white text-xs px-3 py-1 rounded-full font-semibold">{planType}</span>
                            <span className="bg-white/20 text-white text-xs px-3 py-1 rounded-full font-semibold">{getPeriodLabel(plan.billing_period)}</span>
                          </div>
                          <h3 className="text-base font-bold mb-2 line-clamp-2">{plan.name}</h3>
                          <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-bold">€{parseFloat(plan.price.toString()).toFixed(2)}</span>
                            <span className="text-white/70 text-sm">/{plan.billing_period === 'monthly' ? 'mese' : 'anno'}</span>
                          </div>
                        </div>

                        {/* Card body */}
                        <div className="p-5 flex-1 flex flex-col gap-4">
                          {/* Capacity */}
                          <div className="flex items-center gap-2 text-sm text-gray-700">
                            <Users className="w-4 h-4 text-blue-500 flex-shrink-0" />
                            <span className="font-medium">
                              {isBusiness
                                ? (plan.max_persons === 999 ? 'Sedi illimitate' : `Fino a ${plan.max_persons} ${plan.max_persons === 1 ? 'sede' : 'sedi'}`)
                                : `Fino a ${plan.max_persons} ${plan.max_persons === 1 ? 'persona' : 'persone'}`}
                            </span>
                          </div>

                          {/* Features */}
                          <div className="flex-1">
                            {enabledFeatures.length === 0 ? (
                              <p className="text-xs text-gray-400 italic">Nessuna funzionalità configurata</p>
                            ) : (
                              <div className="space-y-1.5">
                                {visibleFeatures.map(f => (
                                  <div key={f.key} className="flex items-center gap-1.5 text-xs text-gray-700">
                                    <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                                    <span>{f.label}</span>
                                  </div>
                                ))}
                                {extraCount > 0 && (
                                  <div className="text-xs text-gray-500 pl-5">+{extraCount} altre funzionalità</div>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex gap-2 pt-2 border-t border-gray-100">
                            <button
                              onClick={() => { setEditingPlan(plan); setIsCreating(false); }}
                              className="flex-1 flex items-center justify-center gap-1.5 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                            >
                              <Edit className="w-3.5 h-3.5" />
                              Modifica
                            </button>
                            <button
                              onClick={() => setDeletingPlanId(plan.id)}
                              className="flex items-center justify-center bg-red-50 text-red-600 border border-red-200 px-3 py-2 rounded-lg hover:bg-red-100 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
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
                            {sub.customer.nickname && <div className="text-xs text-gray-400">@{sub.customer.nickname}</div>}
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
                            {isTrial ? <><Clock className="w-3 h-3" />In Prova</> : expired ? 'Scaduto' : expiringSoon ? 'In scadenza' : 'Attivo'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">{formatDate(sub.start_date)}</td>
                        <td className="px-6 py-4 text-sm">
                          <div className={expired ? 'text-red-600 font-semibold' : expiringSoon ? 'text-orange-600 font-semibold' : 'text-gray-700'}>
                            {formatDate(expiryDate)}
                          </div>
                          {isTrial && <div className="text-xs text-gray-400 mt-0.5">fine prova</div>}
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

      {/* Create / Edit Modal */}
      {editingPlan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between z-10">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">{isCreating ? 'Nuovo Piano' : 'Modifica Piano'}</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {isCreating ? 'Crea un nuovo piano di abbonamento' : 'Aggiorna le informazioni del piano di abbonamento'}
                </p>
              </div>
              <button onClick={() => { setEditingPlan(null); setIsCreating(false); }} className="text-gray-500 hover:text-gray-700 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Nome Piano *</label>
                <input
                  type="text"
                  value={editingPlan.name}
                  onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  placeholder="Es: Piano Mensile - 2 Persone"
                />
              </div>

              {/* Price + Period */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Prezzo (€) *</label>
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
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Periodo di Fatturazione *</label>
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

              {/* Max persons */}
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
                  {getPlanType(editingPlan.name) === 'Business' ? 'Per sedi illimitate, usa 999' : 'Numero di membri famiglia inclusi nel piano'}
                </p>
              </div>

              {/* Features */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-semibold text-gray-700">
                    Funzionalità incluse
                    <span className="ml-2 text-xs font-normal text-gray-500">
                      ({(editingPlan.features || []).length}/{ALL_FEATURES.length} selezionate)
                    </span>
                  </label>
                </div>

                <div className="space-y-4">
                  {categories.map(cat => {
                    const catFeatures = ALL_FEATURES.filter(f => f.category === cat);
                    const selectedCount = catFeatures.filter(f => (editingPlan.features || []).includes(f.key)).length;
                    const allSelected = selectedCount === catFeatures.length;

                    return (
                      <div key={cat} className="border border-gray-200 rounded-xl overflow-hidden">
                        <button
                          type="button"
                          onClick={() => toggleAllInCategory(cat)}
                          className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                        >
                          <span className="text-sm font-semibold text-gray-800">{CATEGORY_LABELS[cat]}</span>
                          <span className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">{selectedCount}/{catFeatures.length}</span>
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${allSelected ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                              {allSelected ? 'Tutte' : 'Seleziona tutte'}
                            </span>
                          </span>
                        </button>
                        <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {catFeatures.map(feature => {
                            const checked = (editingPlan.features || []).includes(feature.key);
                            return (
                              <label
                                key={feature.key}
                                className={`flex items-start gap-3 p-2.5 rounded-lg cursor-pointer transition-colors ${checked ? 'bg-blue-50 border border-blue-200' : 'bg-white border border-gray-200 hover:bg-gray-50'}`}
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => toggleFeature(feature.key)}
                                  className="mt-0.5 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <div className="min-w-0">
                                  <div className={`text-sm font-medium ${checked ? 'text-blue-800' : 'text-gray-800'}`}>{feature.label}</div>
                                  <div className="text-xs text-gray-500 mt-0.5 leading-tight">{feature.description}</div>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t">
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

      {/* Delete confirmation */}
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
