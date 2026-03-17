import { useState, useEffect } from 'react';
import { Users, Trash2, Eye, X as CloseIcon, FilterX } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface User {
  id: string;
  full_name: string;
  nickname?: string;
  email: string;
  user_type: string;
  subscription_status: string;
  subscription_type?: string;
  created_at: string;
  is_admin: boolean;
  phone?: string;
  fiscal_code?: string;
  billing_address?: string;
  billing_city?: string;
  billing_province?: string;
  billing_postal_code?: string;
  date_of_birth?: string;
  relationship?: string;
  company_name?: string;
  vat_number?: string;
  unique_code?: string;
  ateco_code?: string;
  pec_email?: string;
  website_url?: string;
  description?: string;
  office_address?: string;
  office_city?: string;
  office_province?: string;
  office_postal_code?: string;
}

interface SubscriptionPlan {
  name: string;
  billing_period: string;
}

interface UsersManagementSectionProps {
  onReload: () => void;
}

export function UsersManagementSection({ onReload }: UsersManagementSectionProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'customer' | 'business' | 'admin' | 'trial'>('all');
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [subscriptionPlan, setSubscriptionPlan] = useState<SubscriptionPlan | null>(null);
  const [searchEmail, setSearchEmail] = useState('');

  useEffect(() => {
    loadUsers();
  }, [filterType, searchEmail]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      console.log('[UsersManagement] Loading users with filter:', filterType);

      // Carica tutti i profili
      let query = supabase
        .from('profiles')
        .select('id, full_name, nickname, email, user_type, subscription_status, subscription_type, created_at, is_admin, phone, fiscal_code, billing_address, billing_city, billing_province, billing_postal_code, date_of_birth, relationship, company_name, vat_number, unique_code, ateco_code, pec_email, website_url, description, office_address, office_city, office_province, office_postal_code')
        .order('created_at', { ascending: false });

      // Applica filtri
      if (filterType !== 'all') {
        if (filterType === 'admin') {
          query = query.eq('is_admin', true);
        } else if (filterType === 'trial') {
          query = query.eq('subscription_status', 'trial');
        } else {
          query = query.eq('user_type', filterType);
        }
      }

      if (searchEmail) {
        query = query.ilike('email', `%${searchEmail}%`);
      }

      const { data, error } = await query.limit(500);

      if (error) {
        console.error('[UsersManagement] Error loading profiles:', error);
        throw error;
      }

      console.log('[UsersManagement] Loaded users:', {
        count: data?.length || 0,
        filter: filterType,
        searchEmail
      });

      setUsers(data || []);
    } catch (error) {
      console.error('[UsersManagement] Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const viewUserDetails = async (user: User) => {
    setViewingUser(user);

    try {
      const { data: subData } = await supabase
        .from('subscriptions')
        .select('plan:subscription_plans(name, billing_period)')
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (subData && subData.plan) {
        setSubscriptionPlan(subData.plan as any);
      } else {
        setSubscriptionPlan(null);
      }
    } catch (error) {
      console.error('Error loading subscription:', error);
      setSubscriptionPlan(null);
    }
  };

  const closeUserDetails = () => {
    setViewingUser(null);
    setSubscriptionPlan(null);
  };

  const deleteUser = async (userId: string) => {
    if (!confirm('Eliminare questo utente? Azione irreversibile.')) return;

    try {
      const { error } = await supabase.rpc('delete_user_account', {
        user_id_to_delete: userId,
      });

      if (error) throw error;

      alert('Utente eliminato');
      closeUserDetails();
      loadUsers();
      onReload();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      alert(`Errore: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-blue-100">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500 rounded-lg">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Gestione Utenti</h2>
              <p className="text-sm text-gray-600">{users.length} utenti trovati</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFilterType('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filterType === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Tutti
            </button>
            <button
              onClick={() => setFilterType('customer')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filterType === 'customer'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Privati
            </button>
            <button
              onClick={() => setFilterType('business')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filterType === 'business'
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Business
            </button>
            <button
              onClick={() => setFilterType('admin')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filterType === 'admin'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Admin
            </button>
            <button
              onClick={() => setFilterType('trial')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filterType === 'trial'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              In Prova
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Cerca per Email
            </label>
            <input
              type="email"
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              placeholder="Inserisci email..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          {searchEmail && (
            <button
              onClick={() => setSearchEmail('')}
              className="flex items-center gap-1.5 px-3 py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg text-xs font-semibold transition-colors mt-5"
            >
              <FilterX className="w-3.5 h-3.5" />
              Cancella
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                Nome
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                Tipo
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                Abbonamento
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                Stato
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                Registrazione
              </th>
              <th className="px-6 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                Azioni
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold text-sm">
                      {user.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900">
                        {user.user_type === 'business' && user.company_name ? user.company_name : user.full_name}
                      </div>
                      {user.is_admin && (
                        <span className="text-xs font-bold text-red-600">ADMIN</span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {user.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    user.user_type === 'business'
                      ? 'bg-orange-100 text-orange-700'
                      : user.user_type === 'customer'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {user.user_type === 'business' ? 'Business' : user.user_type === 'customer' ? 'Privato' : 'Admin'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {subscriptionPlan ? `${subscriptionPlan.name} (${subscriptionPlan.billing_period === 'monthly' ? 'Mensile' : 'Annuale'})` : user.subscription_type || '—'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    user.subscription_status === 'active'
                      ? 'bg-green-100 text-green-700'
                      : user.subscription_status === 'trial'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {user.subscription_status === 'active'
                      ? 'Attivo'
                      : user.subscription_status === 'trial'
                      ? 'Prova'
                      : user.subscription_status || 'N/A'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {new Date(user.created_at).toLocaleDateString('it-IT')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => viewUserDetails(user)}
                      className="p-2 bg-blue-100 text-blue-600 hover:bg-blue-200 rounded-lg transition-all"
                      title="Visualizza dettagli"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteUser(user.id)}
                      className="p-2 bg-red-100 text-red-600 hover:bg-red-200 rounded-lg transition-all"
                      title="Elimina utente"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Visualizzazione Utente */}
      {viewingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between z-10">
              <div>
                <h3 className="text-xl font-bold text-white">Form di Registrazione Compilato</h3>
                <p className="text-sm text-blue-100 mt-1">Tutti i dati inseriti dall'utente durante la registrazione</p>
              </div>
              <button
                onClick={closeUserDetails}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <CloseIcon className="w-5 h-5 text-white" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* FORM PRIVATO */}
              {viewingUser.user_type === 'customer' && (
                <div className="space-y-6">
                  {/* Dati Personali */}
                  <div className="bg-green-50 rounded-xl p-6 border-2 border-green-200">
                    <h3 className="text-lg font-bold text-green-900 mb-4">Dati Personali</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Nome e Cognome</label>
                        <div className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-900">
                          {viewingUser.full_name || '—'}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Nickname</label>
                        <div className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-900">
                          {viewingUser.nickname || '—'}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                        <div className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-900">
                          {viewingUser.email}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Telefono</label>
                        <div className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-900">
                          {viewingUser.phone || '—'}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Data di Nascita</label>
                        <div className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-900">
                          {viewingUser.date_of_birth ? new Date(viewingUser.date_of_birth).toLocaleDateString('it-IT') : '—'}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Codice Fiscale</label>
                        <div className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-900 uppercase">
                          {viewingUser.fiscal_code || '—'}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Relazione</label>
                        <div className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-900">
                          {viewingUser.relationship || '—'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Indirizzo di Fatturazione */}
                  <div className="bg-blue-50 rounded-xl p-6 border-2 border-blue-200">
                    <h3 className="text-lg font-bold text-blue-900 mb-4">Indirizzo di Fatturazione</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Via e Numero Civico</label>
                        <div className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-900">
                          {viewingUser.billing_address || '—'}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">CAP</label>
                        <div className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-900">
                          {viewingUser.billing_postal_code || '—'}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Città</label>
                        <div className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-900">
                          {viewingUser.billing_city || '—'}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Provincia</label>
                        <div className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-900 uppercase">
                          {viewingUser.billing_province || '—'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Piano Abbonamento */}
                  {subscriptionPlan && (
                    <div className="bg-yellow-50 rounded-xl p-6 border-2 border-yellow-200">
                      <h3 className="text-lg font-bold text-yellow-900 mb-4">Piano Selezionato</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Piano</label>
                          <div className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-900">
                            {subscriptionPlan.name}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Fatturazione</label>
                          <div className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-900">
                            {subscriptionPlan.billing_period === 'monthly' ? 'Mensile' : 'Annuale'}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* FORM BUSINESS */}
              {viewingUser.user_type === 'business' && (
                <div className="space-y-6">
                  {/* Dati Aziendali */}
                  <div className="bg-orange-50 rounded-xl p-6 border-2 border-orange-200">
                    <h3 className="text-lg font-bold text-orange-900 mb-4">Dati Aziendali</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Ragione Sociale</label>
                        <div className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-900">
                          {viewingUser.company_name || '—'}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Partita IVA</label>
                        <div className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-900">
                          {viewingUser.vat_number || '—'}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Codice Univoco SDI</label>
                        <div className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-900 uppercase">
                          {viewingUser.unique_code || '—'}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Codice ATECO</label>
                        <div className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-900">
                          {viewingUser.ateco_code || '—'}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Email PEC</label>
                        <div className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-900">
                          {viewingUser.pec_email || '—'}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                        <div className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-900">
                          {viewingUser.email}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Telefono</label>
                        <div className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-900">
                          {viewingUser.phone || '—'}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Sito Web</label>
                        <div className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-900">
                          {viewingUser.website_url || '—'}
                        </div>
                      </div>
                      {viewingUser.description && (
                        <div className="md:col-span-2">
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Descrizione</label>
                          <div className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-900">
                            {viewingUser.description}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Sede Legale / Fatturazione */}
                  <div className="bg-blue-50 rounded-xl p-6 border-2 border-blue-200">
                    <h3 className="text-lg font-bold text-blue-900 mb-4">Sede Legale / Fatturazione</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Via e Numero Civico</label>
                        <div className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-900">
                          {viewingUser.billing_address || '—'}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">CAP</label>
                        <div className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-900">
                          {viewingUser.billing_postal_code || '—'}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Città</label>
                        <div className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-900">
                          {viewingUser.billing_city || '—'}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Provincia</label>
                        <div className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-900 uppercase">
                          {viewingUser.billing_province || '—'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sede Operativa */}
                  {(viewingUser.office_address || viewingUser.office_city) && (
                    <div className="bg-purple-50 rounded-xl p-6 border-2 border-purple-200">
                      <h3 className="text-lg font-bold text-purple-900 mb-4">Sede Operativa</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Via e Numero Civico</label>
                          <div className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-900">
                            {viewingUser.office_address || '—'}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">CAP</label>
                          <div className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-900">
                            {viewingUser.office_postal_code || '—'}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Città</label>
                          <div className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-900">
                            {viewingUser.office_city || '—'}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Provincia</label>
                          <div className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-900 uppercase">
                            {viewingUser.office_province || '—'}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Piano Abbonamento */}
                  {subscriptionPlan && (
                    <div className="bg-yellow-50 rounded-xl p-6 border-2 border-yellow-200">
                      <h3 className="text-lg font-bold text-yellow-900 mb-4">Piano Selezionato</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Piano</label>
                          <div className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-900">
                            {subscriptionPlan.name}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Fatturazione</label>
                          <div className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-900">
                            {subscriptionPlan.billing_period === 'monthly' ? 'Mensile' : 'Annuale'}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Info Registrazione */}
              <div className="bg-gray-50 rounded-xl p-6 border-2 border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Informazioni Registrazione</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Stato Abbonamento</label>
                    <div className="bg-white border border-gray-300 rounded-lg px-4 py-2">
                      <span className={`text-sm font-bold ${
                        viewingUser.subscription_status === 'active'
                          ? 'text-green-700'
                          : viewingUser.subscription_status === 'trial'
                          ? 'text-yellow-700'
                          : 'text-gray-700'
                      }`}>
                        {viewingUser.subscription_status === 'active'
                          ? 'Attivo'
                          : viewingUser.subscription_status === 'trial'
                          ? 'In Prova'
                          : viewingUser.subscription_status || 'N/A'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Admin</label>
                    <div className="bg-white border border-gray-300 rounded-lg px-4 py-2">
                      <span className={`text-sm font-bold ${viewingUser.is_admin ? 'text-red-600' : 'text-gray-600'}`}>
                        {viewingUser.is_admin ? 'SÌ' : 'NO'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Data Registrazione</label>
                    <div className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-900">
                      {new Date(viewingUser.created_at).toLocaleDateString('it-IT', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t border-gray-200">
              <button
                onClick={closeUserDetails}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
              >
                Chiudi
              </button>
              <button
                onClick={() => deleteUser(viewingUser.id)}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Elimina Utente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
