import { useState, useEffect } from 'react';
import { Users, Trash2, Eye, X as CloseIcon, FilterX, Save, FileEdit as Edit } from 'lucide-react';
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

export default function UsersManagementSection() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState<User | null>(null);
  const [saving, setSaving] = useState(false);
  const [subscriptionPlan, setSubscriptionPlan] = useState<SubscriptionPlan | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'customer' | 'business' | 'admin'>('all');

  useEffect(() => {
    loadUsers();
  }, [filterType]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      console.log('[UsersManagement] Loading users with filter:', filterType);

      // Carica tutti i profili con tutti i campi
      let query = supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      // Applica filtri
      if (filterType !== 'all') {
        if (filterType === 'admin') {
          query = query.eq('is_admin', true);
        } else {
          query = query.eq('user_type', filterType);
        }
      }

      query = query.limit(500);

      const { data, error } = await query;

      if (error) {
        console.error('[UsersManagement] Error loading profiles:', error);
        console.error('[UsersManagement] Error:', error.message);
        throw error;
      }

      console.log('[UsersManagement] Loaded profiles:', data?.length || 0);
      if (data && data.length > 0) {
        console.log('[UsersManagement] Sample user data:', data[0]);
      }
      setUsers(data || []);
    } catch (error) {
      console.error('[UsersManagement] Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSubscriptionPlan = async (userId: string, subscriptionType?: string) => {
    if (!subscriptionType) {
      setSubscriptionPlan(null);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('business_subscription_plans')
        .select('name, billing_period')
        .eq('name', subscriptionType)
        .single();

      if (error) throw error;

      setSubscriptionPlan(data);
    } catch (error) {
      console.error('[UsersManagement] Error loading subscription plan:', error);
      setSubscriptionPlan(null);
    }
  };

  const handleViewUser = async (user: User) => {
    setViewingUser(user);
    setEditedUser(user);
    setIsEditing(false);
    await loadSubscriptionPlan(user.id, user.subscription_type);
  };

  const handleSaveUser = async () => {
    if (!editedUser) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: editedUser.full_name,
          nickname: editedUser.nickname,
          email: editedUser.email,
          phone: editedUser.phone,
          fiscal_code: editedUser.fiscal_code,
          billing_address: editedUser.billing_address,
          billing_city: editedUser.billing_city,
          billing_province: editedUser.billing_province,
          billing_postal_code: editedUser.billing_postal_code,
          date_of_birth: editedUser.date_of_birth,
          relationship: editedUser.relationship,
          company_name: editedUser.company_name,
          vat_number: editedUser.vat_number,
          unique_code: editedUser.unique_code,
          ateco_code: editedUser.ateco_code,
          pec_email: editedUser.pec_email,
          website_url: editedUser.website_url,
          description: editedUser.description,
          office_address: editedUser.office_address,
          office_city: editedUser.office_city,
          office_province: editedUser.office_province,
          office_postal_code: editedUser.office_postal_code,
        })
        .eq('id', editedUser.id);

      if (error) throw error;

      alert('Utente aggiornato con successo!');
      setViewingUser(editedUser);
      setIsEditing(false);
      await loadUsers();
    } catch (error) {
      console.error('[UsersManagement] Error updating user:', error);
      alert('Errore durante l\'aggiornamento dell\'utente');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo utente? Questa azione è irreversibile.')) {
      return;
    }

    try {
      const { error } = await supabase.rpc('delete_user_account', {
        user_id_to_delete: userId
      });

      if (error) throw error;

      alert('Utente eliminato con successo!');
      setViewingUser(null);
      await loadUsers();
    } catch (error: any) {
      console.error('[UsersManagement] Error deleting user:', error);
      alert(`Errore durante l'eliminazione: ${error.message}`);
    }
  };

  const getUserTypeLabel = (type: string) => {
    switch (type) {
      case 'customer': return 'Privato';
      case 'business': return 'Business';
      case 'admin': return 'Admin';
      default: return type;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Attivo';
      case 'trial': return 'Prova';
      case 'expired': return 'Scaduto';
      case 'cancelled': return 'Annullato';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-300';
      case 'trial': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'expired': return 'bg-red-100 text-red-800 border-red-300';
      case 'cancelled': return 'bg-gray-100 text-gray-800 border-gray-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="w-8 h-8 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Gestione Utenti</h2>
            <p className="text-sm text-gray-600">
              {users.length} {users.length === 1 ? 'utente registrato' : 'utenti registrati'}
            </p>
          </div>
        </div>
      </div>

      {/* Filtri */}
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => setFilterType('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filterType === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Tutti ({users.length})
        </button>
        <button
          onClick={() => setFilterType('customer')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filterType === 'customer'
              ? 'bg-green-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Privati
        </button>
        <button
          onClick={() => setFilterType('business')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filterType === 'business'
              ? 'bg-orange-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Business
        </button>
        <button
          onClick={() => setFilterType('admin')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filterType === 'admin'
              ? 'bg-purple-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Admin
        </button>
        {filterType !== 'all' && (
          <button
            onClick={() => setFilterType('all')}
            className="px-4 py-2 rounded-lg font-medium bg-red-100 text-red-700 hover:bg-red-200 flex items-center gap-2"
          >
            <FilterX className="w-4 h-4" />
            Rimuovi Filtro
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Caricamento utenti...</p>
        </div>
      ) : users.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border-2 border-gray-200 p-12 text-center">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Nessun utente trovato</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border-2 border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b-2 border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Nome</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Email</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Tipo</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Stato</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Registrato</th>
                  <th className="px-6 py-4 text-right text-sm font-bold text-gray-900">Azioni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                          {user.full_name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{user.full_name}</p>
                          {user.nickname && (
                            <p className="text-sm text-gray-500">@{user.nickname}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-700">{user.email}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        user.user_type === 'customer' ? 'bg-green-100 text-green-800' :
                        user.user_type === 'business' ? 'bg-orange-100 text-orange-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {getUserTypeLabel(user.user_type)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(user.subscription_status)}`}>
                        {getStatusLabel(user.subscription_status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-700 text-sm">
                      {new Date(user.created_at).toLocaleDateString('it-IT')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleViewUser(user)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Visualizza dettagli"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Elimina utente"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Dettagli Utente */}
      {viewingUser && editedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-2xl flex items-center justify-between z-10">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-white bg-opacity-20 backdrop-blur-sm flex items-center justify-center text-2xl font-bold">
                  {viewingUser.full_name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div>
                  <h3 className="text-2xl font-bold">{viewingUser.full_name}</h3>
                  <p className="text-blue-100">{viewingUser.email}</p>
                  {viewingUser.nickname && (
                    <p className="text-blue-200 text-sm">@{viewingUser.nickname}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors flex items-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Modifica
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleSaveUser}
                      disabled={saving}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      {saving ? 'Salvataggio...' : 'Salva'}
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setEditedUser(viewingUser);
                      }}
                      className="px-4 py-2 bg-white bg-opacity-20 text-white rounded-lg font-semibold hover:bg-opacity-30 transition-colors"
                    >
                      Annulla
                    </button>
                  </>
                )}
                <button
                  onClick={() => {
                    setViewingUser(null);
                    setEditedUser(null);
                    setIsEditing(false);
                  }}
                  className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                >
                  <CloseIcon className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-6">
              {/* FORM PRIVATO */}
              {viewingUser.user_type === 'customer' && (
                <div className="space-y-6">
                  {/* Dati Personali */}
                  <div className="bg-green-50 rounded-xl p-6 border-2 border-green-200">
                    <h3 className="text-lg font-bold text-green-900 mb-4">Dati Personali</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Nome Completo</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editedUser.full_name}
                            onChange={(e) => setEditedUser({ ...editedUser, full_name: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        ) : (
                          <div className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-900">
                            {viewingUser.full_name}
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Nickname</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editedUser.nickname || ''}
                            onChange={(e) => setEditedUser({ ...editedUser, nickname: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        ) : (
                          <div className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-900">
                            {viewingUser.nickname || '—'}
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                        {isEditing ? (
                          <input
                            type="email"
                            value={editedUser.email}
                            onChange={(e) => setEditedUser({ ...editedUser, email: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        ) : (
                          <div className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-900">
                            {viewingUser.email}
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Telefono</label>
                        {isEditing ? (
                          <input
                            type="tel"
                            value={editedUser.phone || ''}
                            onChange={(e) => setEditedUser({ ...editedUser, phone: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        ) : (
                          <div className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-900">
                            {viewingUser.phone || '—'}
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Data di Nascita</label>
                        {isEditing ? (
                          <input
                            type="date"
                            value={editedUser.date_of_birth || ''}
                            onChange={(e) => setEditedUser({ ...editedUser, date_of_birth: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        ) : (
                          <div className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-900">
                            {viewingUser.date_of_birth ? new Date(viewingUser.date_of_birth).toLocaleDateString('it-IT') : '—'}
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Codice Fiscale</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editedUser.fiscal_code || ''}
                            onChange={(e) => setEditedUser({ ...editedUser, fiscal_code: e.target.value.toUpperCase() })}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
                            maxLength={16}
                          />
                        ) : (
                          <div className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-900 uppercase">
                            {viewingUser.fiscal_code || '—'}
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Relazione</label>
                        {isEditing ? (
                          <select
                            value={editedUser.relationship || ''}
                            onChange={(e) => setEditedUser({ ...editedUser, relationship: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="">Seleziona...</option>
                            <option value="single">Single</option>
                            <option value="married">Sposato/a</option>
                            <option value="divorced">Divorziato/a</option>
                            <option value="widowed">Vedovo/a</option>
                          </select>
                        ) : (
                          <div className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-900">
                            {viewingUser.relationship || '—'}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Indirizzo di Fatturazione */}
                  <div className="bg-blue-50 rounded-xl p-6 border-2 border-blue-200">
                    <h3 className="text-lg font-bold text-blue-900 mb-4">Indirizzo di Fatturazione</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Via e Numero Civico</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editedUser.billing_address || ''}
                            onChange={(e) => setEditedUser({ ...editedUser, billing_address: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        ) : (
                          <div className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-900">
                            {viewingUser.billing_address || '—'}
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">CAP</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editedUser.billing_postal_code || ''}
                            onChange={(e) => setEditedUser({ ...editedUser, billing_postal_code: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            maxLength={5}
                          />
                        ) : (
                          <div className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-900">
                            {viewingUser.billing_postal_code || '—'}
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Città</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editedUser.billing_city || ''}
                            onChange={(e) => setEditedUser({ ...editedUser, billing_city: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        ) : (
                          <div className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-900">
                            {viewingUser.billing_city || '—'}
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Provincia</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editedUser.billing_province || ''}
                            onChange={(e) => setEditedUser({ ...editedUser, billing_province: e.target.value.toUpperCase() })}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
                            maxLength={2}
                          />
                        ) : (
                          <div className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-900 uppercase">
                            {viewingUser.billing_province || '—'}
                          </div>
                        )}
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
                        {isEditing ? (
                          <input
                            type="text"
                            value={editedUser.company_name || ''}
                            onChange={(e) => setEditedUser({ ...editedUser, company_name: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        ) : (
                          <div className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-900">
                            {viewingUser.company_name || '—'}
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Partita IVA</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editedUser.vat_number || ''}
                            onChange={(e) => setEditedUser({ ...editedUser, vat_number: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            maxLength={11}
                          />
                        ) : (
                          <div className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-900">
                            {viewingUser.vat_number || '—'}
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Codice Univoco SDI</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editedUser.unique_code || ''}
                            onChange={(e) => setEditedUser({ ...editedUser, unique_code: e.target.value.toUpperCase() })}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
                            maxLength={7}
                          />
                        ) : (
                          <div className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-900 uppercase">
                            {viewingUser.unique_code || '—'}
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Codice ATECO</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editedUser.ateco_code || ''}
                            onChange={(e) => setEditedUser({ ...editedUser, ateco_code: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        ) : (
                          <div className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-900">
                            {viewingUser.ateco_code || '—'}
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Email PEC</label>
                        {isEditing ? (
                          <input
                            type="email"
                            value={editedUser.pec_email || ''}
                            onChange={(e) => setEditedUser({ ...editedUser, pec_email: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        ) : (
                          <div className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-900">
                            {viewingUser.pec_email || '—'}
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                        {isEditing ? (
                          <input
                            type="email"
                            value={editedUser.email}
                            onChange={(e) => setEditedUser({ ...editedUser, email: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        ) : (
                          <div className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-900">
                            {viewingUser.email}
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Telefono</label>
                        {isEditing ? (
                          <input
                            type="tel"
                            value={editedUser.phone || ''}
                            onChange={(e) => setEditedUser({ ...editedUser, phone: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        ) : (
                          <div className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-900">
                            {viewingUser.phone || '—'}
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Sito Web</label>
                        {isEditing ? (
                          <input
                            type="url"
                            value={editedUser.website_url || ''}
                            onChange={(e) => setEditedUser({ ...editedUser, website_url: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        ) : (
                          <div className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-900">
                            {viewingUser.website_url || '—'}
                          </div>
                        )}
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Descrizione</label>
                        {isEditing ? (
                          <textarea
                            value={editedUser.description || ''}
                            onChange={(e) => setEditedUser({ ...editedUser, description: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            rows={3}
                          />
                        ) : (
                          <div className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-900">
                            {viewingUser.description || '—'}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Sede Legale / Fatturazione */}
                  <div className="bg-blue-50 rounded-xl p-6 border-2 border-blue-200">
                    <h3 className="text-lg font-bold text-blue-900 mb-4">Sede Legale / Fatturazione</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Via e Numero Civico</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editedUser.billing_address || ''}
                            onChange={(e) => setEditedUser({ ...editedUser, billing_address: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        ) : (
                          <div className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-900">
                            {viewingUser.billing_address || '—'}
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">CAP</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editedUser.billing_postal_code || ''}
                            onChange={(e) => setEditedUser({ ...editedUser, billing_postal_code: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            maxLength={5}
                          />
                        ) : (
                          <div className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-900">
                            {viewingUser.billing_postal_code || '—'}
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Città</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editedUser.billing_city || ''}
                            onChange={(e) => setEditedUser({ ...editedUser, billing_city: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        ) : (
                          <div className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-900">
                            {viewingUser.billing_city || '—'}
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Provincia</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editedUser.billing_province || ''}
                            onChange={(e) => setEditedUser({ ...editedUser, billing_province: e.target.value.toUpperCase() })}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
                            maxLength={2}
                          />
                        ) : (
                          <div className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-900 uppercase">
                            {viewingUser.billing_province || '—'}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Sede Operativa */}
                  <div className="bg-teal-50 rounded-xl p-6 border-2 border-teal-200">
                    <h3 className="text-lg font-bold text-teal-900 mb-4">Sede Operativa (Opzionale)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Via e Numero Civico</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editedUser.office_address || ''}
                            onChange={(e) => setEditedUser({ ...editedUser, office_address: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        ) : (
                          <div className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-900">
                            {viewingUser.office_address || '—'}
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">CAP</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editedUser.office_postal_code || ''}
                            onChange={(e) => setEditedUser({ ...editedUser, office_postal_code: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            maxLength={5}
                          />
                        ) : (
                          <div className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-900">
                            {viewingUser.office_postal_code || '—'}
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Città</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editedUser.office_city || ''}
                            onChange={(e) => setEditedUser({ ...editedUser, office_city: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        ) : (
                          <div className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-900">
                            {viewingUser.office_city || '—'}
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Provincia</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editedUser.office_province || ''}
                            onChange={(e) => setEditedUser({ ...editedUser, office_province: e.target.value.toUpperCase() })}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
                            maxLength={2}
                          />
                        ) : (
                          <div className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-900 uppercase">
                            {viewingUser.office_province || '—'}
                          </div>
                        )}
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

              {/* FORM ADMIN */}
              {viewingUser.is_admin && (
                <div className="space-y-6">
                  <div className="bg-red-50 rounded-xl p-6 border-2 border-red-200">
                    <h3 className="text-lg font-bold text-red-900 mb-4">Dati Admin</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Nome Completo</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editedUser.full_name}
                            onChange={(e) => setEditedUser({ ...editedUser, full_name: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        ) : (
                          <div className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-900">
                            {viewingUser.full_name}
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                        {isEditing ? (
                          <input
                            type="email"
                            value={editedUser.email}
                            onChange={(e) => setEditedUser({ ...editedUser, email: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        ) : (
                          <div className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-900">
                            {viewingUser.email}
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Nickname</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editedUser.nickname || ''}
                            onChange={(e) => setEditedUser({ ...editedUser, nickname: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        ) : (
                          <div className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-900">
                            {viewingUser.nickname || '—'}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
