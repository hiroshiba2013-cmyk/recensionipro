import { useState, useEffect } from 'react';
import { Building2, CheckCircle, UserPlus, Plus, MapPin, Eye, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface BusinessActivity {
  id: string;
  name: string;
  city: string;
  province: string;
  address?: string;
  type: 'claimed' | 'user_added' | 'imported' | 'registered';
  created_at: string;
  verified?: boolean;
  owner?: {
    full_name: string;
    email: string;
  };
  added_by?: {
    full_name: string;
    email: string;
  };
  category?: {
    name: string;
  };
}

interface BusinessTrackingSectionProps {
  onReload: () => void;
}

export function BusinessTrackingSection({ onReload }: BusinessTrackingSectionProps) {
  const [activities, setActivities] = useState<BusinessActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<'all' | 'claimed' | 'user_added' | 'imported' | 'registered'>('all');
  const [selectedBusiness, setSelectedBusiness] = useState<BusinessActivity | null>(null);

  useEffect(() => {
    loadActivities();
  }, [typeFilter]);

  const loadActivities = async () => {
    setLoading(true);
    try {
      const allActivities: BusinessActivity[] = [];

      if (typeFilter === 'all' || typeFilter === 'registered') {
        const { data: registered } = await supabase
          .from('registered_businesses')
          .select(`
            id,
            name,
            verified,
            created_at,
            owner:profiles!registered_businesses_owner_id_fkey(full_name, email),
            category:business_categories(name)
          `)
          .order('created_at', { ascending: false })
          .limit(50);

        if (registered) {
          for (const biz of registered) {
            const { data: location } = await supabase
              .from('registered_business_locations')
              .select('city, province, address')
              .eq('business_id', biz.id)
              .limit(1)
              .maybeSingle();

            allActivities.push({
              id: biz.id,
              name: biz.name,
              city: location?.city || 'N/A',
              province: location?.province || 'N/A',
              address: location?.address,
              type: 'registered',
              created_at: biz.created_at,
              verified: biz.verified,
              owner: biz.owner,
              category: biz.category,
            });
          }
        }
      }

      if (typeFilter === 'all' || typeFilter === 'user_added') {
        const { data: userAdded } = await supabase
          .from('unclaimed_business_locations')
          .select(`
            id,
            name,
            city,
            province,
            address,
            created_at,
            added_by,
            family_member_id,
            category:business_categories(name)
          `)
          .not('added_by', 'is', null)
          .is('claimed_by', null)
          .order('created_at', { ascending: false })
          .limit(50);

        if (userAdded) {
          for (const biz of userAdded) {
            let adder = null;
            if (biz.added_by) {
              const { data: user } = await supabase
                .from('profiles')
                .select('full_name, email')
                .eq('id', biz.added_by)
                .maybeSingle();
              adder = user;
            }

            allActivities.push({
              id: biz.id,
              name: biz.name,
              city: biz.city,
              province: biz.province,
              address: biz.address || undefined,
              type: 'user_added',
              created_at: biz.created_at,
              added_by: adder || undefined,
              category: biz.category,
            });
          }
        }
      }

      if (typeFilter === 'all' || typeFilter === 'imported') {
        const { data: imported } = await supabase
          .from('unclaimed_business_locations')
          .select(`
            id,
            name,
            city,
            province,
            address,
            created_at,
            category:business_categories(name)
          `)
          .is('added_by', null)
          .is('claimed_by', null)
          .order('created_at', { ascending: false })
          .limit(50);

        if (imported) {
          allActivities.push(...imported.map(biz => ({
            id: biz.id,
            name: biz.name,
            city: biz.city,
            province: biz.province,
            address: biz.address || undefined,
            type: 'imported' as const,
            created_at: biz.created_at,
            category: biz.category,
          })));
        }
      }

      if (typeFilter === 'all' || typeFilter === 'claimed') {
        // Unclaimed businesses che sono state rivendicate
        const { data: claimed } = await supabase
          .from('unclaimed_business_locations')
          .select(`
            id,
            name,
            city,
            province,
            address,
            created_at,
            claimed_by,
            category:business_categories(name)
          `)
          .not('claimed_by', 'is', null)
          .order('created_at', { ascending: false })
          .limit(50);

        if (claimed) {
          for (const biz of claimed) {
            let claimer = null;
            if (biz.claimed_by) {
              const { data: user } = await supabase
                .from('profiles')
                .select('full_name, email')
                .eq('id', biz.claimed_by)
                .maybeSingle();
              claimer = user;
            }

            allActivities.push({
              id: biz.id,
              name: biz.name,
              city: biz.city,
              province: biz.province,
              address: biz.address || undefined,
              type: 'claimed',
              created_at: biz.created_at,
              owner: claimer || undefined,
              category: biz.category,
            });
          }
        }

        // Aggiungi anche le attività registrate come rivendicate
        const { data: registered } = await supabase
          .from('registered_businesses')
          .select(`
            id,
            name,
            verified,
            created_at,
            owner:profiles!registered_businesses_owner_id_fkey(full_name, email),
            category:business_categories(name)
          `)
          .order('created_at', { ascending: false })
          .limit(50);

        if (registered) {
          for (const biz of registered) {
            const { data: location } = await supabase
              .from('registered_business_locations')
              .select('city, province, address')
              .eq('business_id', biz.id)
              .limit(1)
              .maybeSingle();

            allActivities.push({
              id: `reg-${biz.id}`,
              name: biz.name,
              city: location?.city || 'N/A',
              province: location?.province || 'N/A',
              address: location?.address,
              type: 'claimed',
              created_at: biz.created_at,
              verified: biz.verified,
              owner: biz.owner,
              category: biz.category,
            });
          }
        }
      }

      allActivities.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setActivities(allActivities);
    } catch (error) {
      console.error('Error loading activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'registered':
        return { bg: 'bg-blue-100 text-blue-700', label: 'Registrata', icon: <Building2 className="w-3.5 h-3.5" /> };
      case 'claimed':
        return { bg: 'bg-green-100 text-green-700', label: 'Rivendicata', icon: <CheckCircle className="w-3.5 h-3.5" /> };
      case 'user_added':
        return { bg: 'bg-purple-100 text-purple-700', label: 'Aggiunta Utente', icon: <UserPlus className="w-3.5 h-3.5" /> };
      case 'imported':
        return { bg: 'bg-gray-100 text-gray-700', label: 'Importata', icon: <MapPin className="w-3.5 h-3.5" /> };
      default:
        return { bg: 'bg-gray-100 text-gray-700', label: type, icon: null };
    }
  };

  const deleteBusiness = async (business: BusinessActivity) => {
    if (!confirm(`Eliminare "${business.name}"?`)) return;

    try {
      // Se l'ID inizia con "reg-", è un'attività registrata mostrata come rivendicata
      if (business.id.startsWith('reg-')) {
        const realId = business.id.replace('reg-', '');
        const { error } = await supabase
          .from('registered_businesses')
          .delete()
          .eq('id', realId);
        if (error) throw error;
      } else if (business.type === 'registered') {
        const { error } = await supabase
          .from('registered_businesses')
          .delete()
          .eq('id', business.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('unclaimed_business_locations')
          .delete()
          .eq('id', business.id);
        if (error) throw error;
      }

      alert('Attività eliminata');
      loadActivities();
      onReload();
      setSelectedBusiness(null);
    } catch (error: any) {
      console.error('Error deleting business:', error);
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
      <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-amber-100">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500 rounded-lg">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Tracking Attività</h2>
              <p className="text-sm text-gray-600">{activities.length} attività trovate</p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setTypeFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                typeFilter === 'all'
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Tutte
            </button>
            <button
              onClick={() => setTypeFilter('registered')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                typeFilter === 'registered'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Building2 className="w-4 h-4" />
              Registrate
            </button>
            <button
              onClick={() => setTypeFilter('claimed')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                typeFilter === 'claimed'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <CheckCircle className="w-4 h-4" />
              Rivendicate
            </button>
            <button
              onClick={() => setTypeFilter('user_added')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                typeFilter === 'user_added'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              Aggiunte
            </button>
            <button
              onClick={() => setTypeFilter('imported')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                typeFilter === 'imported'
                  ? 'bg-gray-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <MapPin className="w-4 h-4" />
              Importate
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                Attività
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                Tipo
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                Categoria
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                Luogo
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                Proprietario/Aggiunto da
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                Data
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                Azioni
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {activities.map((activity) => {
              const badge = getTypeBadge(activity.type);
              return (
                <tr key={`${activity.type}-${activity.id}`} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {activity.verified && (
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      )}
                      <div>
                        <div className="text-sm font-medium text-gray-900">{activity.name}</div>
                        {activity.address && (
                          <div className="text-xs text-gray-500 mt-0.5">{activity.address}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full ${badge.bg}`}>
                      {badge.icon}
                      {badge.label}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-600">
                      {activity.category?.name || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{activity.city}</div>
                    <div className="text-xs text-gray-500">{activity.province}</div>
                  </td>
                  <td className="px-6 py-4">
                    {activity.owner ? (
                      <div>
                        <div className="text-sm font-medium text-gray-900">{activity.owner.full_name}</div>
                        <div className="text-xs text-gray-500">{activity.owner.email}</div>
                      </div>
                    ) : activity.added_by ? (
                      <div>
                        <div className="text-sm font-medium text-gray-900">{activity.added_by.full_name}</div>
                        <div className="text-xs text-gray-500">{activity.added_by.email}</div>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">Sistema</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {new Date(activity.created_at).toLocaleDateString('it-IT')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedBusiness(activity)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        title="Dettagli"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteBusiness(activity)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        title="Elimina"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {selectedBusiness && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Dettagli Attività</h3>
                <button
                  onClick={() => setSelectedBusiness(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-gray-700">Nome</label>
                  <p className="text-gray-900">{selectedBusiness.name}</p>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700">Tipo</label>
                  <div className="mt-1">
                    {(() => {
                      const badge = getTypeBadge(selectedBusiness.type);
                      return (
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full ${badge.bg}`}>
                          {badge.icon}
                          {badge.label}
                        </span>
                      );
                    })()}
                  </div>
                </div>

                {selectedBusiness.category && (
                  <div>
                    <label className="text-sm font-semibold text-gray-700">Categoria</label>
                    <p className="text-gray-900">{selectedBusiness.category.name}</p>
                  </div>
                )}

                <div>
                  <label className="text-sm font-semibold text-gray-700">Località</label>
                  <p className="text-gray-900">{selectedBusiness.city}, {selectedBusiness.province}</p>
                  {selectedBusiness.address && (
                    <p className="text-sm text-gray-600 mt-1">{selectedBusiness.address}</p>
                  )}
                </div>

                {selectedBusiness.owner && (
                  <div>
                    <label className="text-sm font-semibold text-gray-700">Proprietario</label>
                    <p className="text-gray-900">{selectedBusiness.owner.full_name}</p>
                    <p className="text-sm text-gray-600">{selectedBusiness.owner.email}</p>
                  </div>
                )}

                {selectedBusiness.added_by && (
                  <div>
                    <label className="text-sm font-semibold text-gray-700">Aggiunto da</label>
                    <p className="text-gray-900">{selectedBusiness.added_by.full_name}</p>
                    <p className="text-sm text-gray-600">{selectedBusiness.added_by.email}</p>
                  </div>
                )}

                {selectedBusiness.verified !== undefined && (
                  <div>
                    <label className="text-sm font-semibold text-gray-700">Verificato</label>
                    <p className={`font-medium ${selectedBusiness.verified ? 'text-green-600' : 'text-gray-600'}`}>
                      {selectedBusiness.verified ? 'Sì' : 'No'}
                    </p>
                  </div>
                )}

                <div>
                  <label className="text-sm font-semibold text-gray-700">Data Creazione</label>
                  <p className="text-gray-900">
                    {new Date(selectedBusiness.created_at).toLocaleString('it-IT')}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => deleteBusiness(selectedBusiness)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                >
                  Elimina
                </button>
                <button
                  onClick={() => setSelectedBusiness(null)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
                >
                  Chiudi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activities.length === 0 && (
        <div className="text-center py-12">
          <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg font-medium">Nessuna attività trovata</p>
        </div>
      )}
    </div>
  );
}
