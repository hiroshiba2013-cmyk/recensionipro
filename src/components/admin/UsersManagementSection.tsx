import { useState, useEffect } from 'react';
import { Users, ChevronDown, ChevronRight, Trash2, Shield, Building2, User as UserIcon } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface User {
  id: string;
  full_name: string;
  email: string;
  user_type: string;
  subscription_status: string;
  created_at: string;
  is_admin: boolean;
}

interface FamilyMember {
  id: string;
  first_name: string;
  last_name: string;
  nickname?: string;
  date_of_birth: string;
  relationship: string;
}

interface BusinessLocation {
  id: string;
  name: string;
  internal_name?: string;
  address: string;
  city: string;
  province: string;
}

interface ExpandedUserData {
  familyMembers?: FamilyMember[];
  businessLocations?: BusinessLocation[];
  subscription?: {
    plan_name: string;
    status: string;
    end_date: string;
  };
}

interface UsersManagementSectionProps {
  onReload: () => void;
}

export function UsersManagementSection({ onReload }: UsersManagementSectionProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());
  const [userData, setUserData] = useState<Map<string, ExpandedUserData>>(new Map());
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'customer' | 'business' | 'admin'>('all');

  useEffect(() => {
    loadUsers();
  }, [filterType]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('profiles')
        .select('id, full_name, email, user_type, subscription_status, created_at, is_admin')
        .order('created_at', { ascending: false });

      if (filterType !== 'all') {
        if (filterType === 'admin') {
          query = query.eq('is_admin', true);
        } else {
          query = query.eq('user_type', filterType);
        }
      }

      const { data, error } = await query.limit(200);

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleUserExpansion = async (userId: string, userType: string) => {
    const newExpanded = new Set(expandedUsers);

    if (expandedUsers.has(userId)) {
      newExpanded.delete(userId);
    } else {
      newExpanded.add(userId);
      if (!userData.has(userId)) {
        await loadUserDetails(userId, userType);
      }
    }

    setExpandedUsers(newExpanded);
  };

  const loadUserDetails = async (userId: string, userType: string) => {
    try {
      const details: ExpandedUserData = {};

      const { data: subData } = await supabase
        .from('subscriptions')
        .select('status, end_date, plan:subscription_plans(name)')
        .eq('customer_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (subData) {
        details.subscription = {
          plan_name: (subData.plan as any)?.name || 'N/A',
          status: subData.status,
          end_date: subData.end_date,
        };
      }

      if (userType === 'customer') {
        const { data: familyData } = await supabase
          .from('customer_family_members')
          .select('id, first_name, last_name, nickname, date_of_birth, relationship')
          .eq('customer_id', userId);

        details.familyMembers = familyData || [];
      } else if (userType === 'business') {
        const { data: businessData } = await supabase
          .from('businesses')
          .select('id')
          .eq('owner_id', userId)
          .maybeSingle();

        if (businessData) {
          const { data: locationsData } = await supabase
            .from('business_locations')
            .select('id, name, internal_name, address, city, province')
            .eq('business_id', businessData.id);

          details.businessLocations = locationsData || [];
        }
      }

      setUserData(new Map(userData.set(userId, details)));
    } catch (error) {
      console.error('Error loading user details:', error);
    }
  };

  const toggleAdmin = async (userId: string, currentStatus: boolean) => {
    const confirmMessage = currentStatus
      ? 'Rimuovere privilegi admin?'
      : 'Concedere privilegi admin?';

    if (!confirm(confirmMessage)) return;

    try {
      if (currentStatus) {
        const { error } = await supabase
          .from('admins')
          .delete()
          .eq('user_id', userId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('admins')
          .insert({ user_id: userId });

        if (error) throw error;
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .update({ is_admin: !currentStatus, user_type: !currentStatus ? 'admin' : 'customer' })
        .eq('id', userId);

      if (profileError) throw profileError;

      alert('Stato admin aggiornato');
      loadUsers();
      onReload();
    } catch (error: any) {
      console.error('Error updating admin status:', error);
      alert(`Errore: ${error.message}`);
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm('Eliminare questo utente? Azione irreversibile.')) return;

    try {
      const { error } = await supabase.rpc('delete_user_account', {
        user_id_to_delete: userId,
      });

      if (error) throw error;

      alert('Utente eliminato');
      loadUsers();
      onReload();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      alert(`Errore: ${error.message}`);
    }
  };

  const deleteFamilyMember = async (memberId: string, userId: string) => {
    if (!confirm('Eliminare questo membro della famiglia?')) return;

    try {
      const { error } = await supabase
        .from('customer_family_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      alert('Membro eliminato');
      await loadUserDetails(userId, 'customer');
    } catch (error: any) {
      console.error('Error deleting family member:', error);
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
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500 rounded-lg">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Gestione Utenti Completa</h2>
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
              Attività
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
          </div>
        </div>
      </div>

      <div className="divide-y divide-gray-200">
        {users.map((user) => {
          const isExpanded = expandedUsers.has(user.id);
          const details = userData.get(user.id);

          return (
            <div key={user.id} className="hover:bg-gray-50 transition-colors">
              <div className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <button
                    onClick={() => toggleUserExpansion(user.id, user.user_type)}
                    className="p-1 hover:bg-gray-200 rounded"
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5 text-gray-600" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-600" />
                    )}
                  </button>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold">
                    {user.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900">{user.full_name}</span>
                      {user.is_admin && (
                        <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded">
                          ADMIN
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-3 py-1 text-xs font-semibold rounded-full ${
                        user.user_type === 'business'
                          ? 'bg-orange-100 text-orange-700'
                          : user.user_type === 'customer'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-purple-100 text-purple-700'
                      }`}
                    >
                      {user.user_type === 'business' ? 'Attività' : user.user_type === 'customer' ? 'Privato' : 'Admin'}
                    </span>
                    <span
                      className={`px-3 py-1 text-xs font-semibold rounded-full ${
                        user.subscription_status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : user.subscription_status === 'trial'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {user.subscription_status === 'active'
                        ? 'Attivo'
                        : user.subscription_status === 'trial'
                        ? 'Prova'
                        : 'Scaduto'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => toggleAdmin(user.id, user.is_admin)}
                    className={`p-2 rounded-lg transition-all ${
                      user.is_admin
                        ? 'bg-red-100 text-red-600 hover:bg-red-200'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                    title={user.is_admin ? 'Rimuovi admin' : 'Rendi admin'}
                  >
                    <Shield className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteUser(user.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                    title="Elimina utente"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {isExpanded && details && (
                <div className="px-6 pb-4 pl-20 space-y-4">
                  {details.subscription && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <UserIcon className="w-4 h-4" />
                        Abbonamento
                      </h4>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Piano:</span>
                          <span className="ml-2 font-medium">{details.subscription.plan_name}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Stato:</span>
                          <span className="ml-2 font-medium capitalize">{details.subscription.status}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Scadenza:</span>
                          <span className="ml-2 font-medium">
                            {new Date(details.subscription.end_date).toLocaleDateString('it-IT')}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {details.familyMembers && details.familyMembers.length > 0 && (
                    <div className="bg-green-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Membri della Famiglia ({details.familyMembers.length})
                      </h4>
                      <div className="space-y-2">
                        {details.familyMembers.map((member) => (
                          <div
                            key={member.id}
                            className="flex items-center justify-between bg-white rounded-lg p-3"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-semibold text-sm">
                                {member.first_name.charAt(0)}
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {member.first_name} {member.last_name}
                                  {member.nickname && (
                                    <span className="ml-2 text-gray-500 text-xs">({member.nickname})</span>
                                  )}
                                </div>
                                <div className="text-xs text-gray-600">
                                  {member.relationship} - {new Date(member.date_of_birth).toLocaleDateString('it-IT')}
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={() => deleteFamilyMember(member.id, user.id)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-all"
                              title="Elimina membro"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {details.businessLocations && details.businessLocations.length > 0 && (
                    <div className="bg-orange-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        Sedi Attività ({details.businessLocations.length})
                      </h4>
                      <div className="space-y-2">
                        {details.businessLocations.map((location) => (
                          <div
                            key={location.id}
                            className="bg-white rounded-lg p-3"
                          >
                            <div className="font-medium text-gray-900 text-sm">{location.name}</div>
                            {location.internal_name && (
                              <div className="text-xs text-gray-500 mt-1">
                                Nome interno: {location.internal_name}
                              </div>
                            )}
                            <div className="text-xs text-gray-600 mt-1">
                              {location.address}, {location.city} ({location.province})
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="text-xs text-gray-500">
                    Registrato il {new Date(user.created_at).toLocaleDateString('it-IT')} alle{' '}
                    {new Date(user.created_at).toLocaleTimeString('it-IT')}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
