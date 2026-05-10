import { useState, useEffect, useRef } from 'react';
import { Building2, CheckCircle, UserPlus, MapPin, Eye, Trash2, X, Search } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { AdminLocationFilter, LocationFilterState } from './AdminLocationFilter';

interface BusinessActivity {
  id: string;
  name: string;
  city: string;
  province: string;
  street?: string;
  type: 'claimed' | 'user_added' | 'imported' | 'registered';
  created_at: string;
  verified?: boolean;
  approval_status?: string;
  owner?: { full_name: string; email: string };
  added_by?: { full_name: string; email: string };
  category?: { name: string };
}

interface Props { onReload: () => void; }

export function BusinessTrackingSection({ onReload }: Props) {
  const [activities, setActivities] = useState<BusinessActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<'all' | 'claimed' | 'user_added' | 'imported' | 'registered'>('all');
  const [locationFilter, setLocationFilter] = useState<LocationFilterState>({ region: '', province: '', provinceCode: '', city: '' });
  const [nameSearch, setNameSearch] = useState('');
  const [selectedBusiness, setSelectedBusiness] = useState<BusinessActivity | null>(null);
  const loadingRef = useRef(0);

  useEffect(() => { loadActivities(); }, [typeFilter, locationFilter, nameSearch]);

  const loadActivities = async () => {
    const req = ++loadingRef.current;
    setLoading(true);
    setActivities([]);
    try {
      const all: BusinessActivity[] = [];

      if (typeFilter === 'all' || typeFilter === 'registered') {
        let q = supabase
          .from('registered_businesses')
          .select(`id, name, verified, created_at, billing_city, billing_province, billing_street,
            owner:profiles!registered_businesses_owner_id_fkey(full_name, email),
            category:business_categories(name)`)
          .order('created_at', { ascending: false })
          .limit(200);

        if (nameSearch) q = q.ilike('name', `%${nameSearch}%`);
        if (locationFilter.provinceCode) q = q.eq('billing_province', locationFilter.provinceCode);
        if (locationFilter.city) q = q.ilike('billing_city', `%${locationFilter.city}%`);

        const { data: registered } = await q;
        if (registered) {
          for (const biz of registered) {
            // Try primary location for better address data
            const { data: loc } = await supabase
              .from('registered_business_locations')
              .select('city, province, street')
              .eq('business_id', biz.id)
              .order('is_primary', { ascending: false })
              .limit(1)
              .maybeSingle();

            const city = loc?.city || biz.billing_city || '';
            const province = loc?.province || biz.billing_province || '';

            // If city filter is set, check actual location too
            if (locationFilter.city) {
              const matches = city.toLowerCase().includes(locationFilter.city.toLowerCase())
                || (biz.billing_city || '').toLowerCase().includes(locationFilter.city.toLowerCase());
              if (!matches) continue;
            }

            if (locationFilter.region) {
              // region stored in registered_business_locations
              if (loc) {
                const { data: locFull } = await supabase
                  .from('registered_business_locations')
                  .select('region')
                  .eq('business_id', biz.id)
                  .limit(1)
                  .maybeSingle();
                if (locFull?.region && locFull.region !== locationFilter.region) continue;
              }
            }

            all.push({
              id: biz.id, name: biz.name,
              city, province,
              street: loc?.street || biz.billing_street || undefined,
              type: 'registered', created_at: biz.created_at,
              verified: biz.verified, owner: biz.owner, category: biz.category,
            });
          }
        }
      }

      if (typeFilter === 'all' || typeFilter === 'user_added') {
        let q = supabase
          .from('unclaimed_business_locations')
          .select(`id, name, city, province, region, street, created_at, added_by, approval_status,
            category:business_categories(name)`)
          .not('added_by', 'is', null)
          .is('claimed_by', null)
          .order('created_at', { ascending: false })
          .limit(200);

        if (nameSearch) q = q.ilike('name', `%${nameSearch}%`);
        if (locationFilter.city) q = q.ilike('city', `%${locationFilter.city}%`);
        if (locationFilter.provinceCode) q = q.eq('province', locationFilter.provinceCode);
        if (locationFilter.region) q = q.eq('region', locationFilter.region);

        const { data: userAdded } = await q;
        if (userAdded) {
          for (const biz of userAdded) {
            let adder = null;
            if (biz.added_by) {
              const { data: u } = await supabase.from('profiles').select('full_name, email').eq('id', biz.added_by).maybeSingle();
              adder = u;
            }
            all.push({
              id: biz.id, name: biz.name, city: biz.city, province: biz.province,
              street: biz.street || undefined, type: 'user_added', created_at: biz.created_at,
              approval_status: biz.approval_status, added_by: adder || undefined, category: biz.category,
            });
          }
        }
      }

      if (typeFilter === 'all' || typeFilter === 'imported') {
        let q = supabase
          .from('unclaimed_business_locations')
          .select(`id, name, city, province, region, street, created_at, approval_status,
            category:business_categories(name)`)
          .is('added_by', null)
          .is('claimed_by', null)
          .order('created_at', { ascending: false })
          .limit(200);

        if (nameSearch) q = q.ilike('name', `%${nameSearch}%`);
        if (locationFilter.city) q = q.ilike('city', `%${locationFilter.city}%`);
        if (locationFilter.provinceCode) q = q.eq('province', locationFilter.provinceCode);
        if (locationFilter.region) q = q.eq('region', locationFilter.region);

        const { data: imported } = await q;
        if (imported) {
          all.push(...imported.map(biz => ({
            id: biz.id, name: biz.name, city: biz.city, province: biz.province,
            street: biz.street || undefined, type: 'imported' as const, created_at: biz.created_at,
            approval_status: biz.approval_status, category: biz.category,
          })));
        }
      }

      if (typeFilter === 'all' || typeFilter === 'claimed') {
        let q = supabase
          .from('unclaimed_business_locations')
          .select(`id, name, city, province, region, street, created_at, claimed_by, approval_status,
            category:business_categories(name)`)
          .not('claimed_by', 'is', null)
          .order('created_at', { ascending: false })
          .limit(200);

        if (nameSearch) q = q.ilike('name', `%${nameSearch}%`);
        if (locationFilter.city) q = q.ilike('city', `%${locationFilter.city}%`);
        if (locationFilter.provinceCode) q = q.eq('province', locationFilter.provinceCode);
        if (locationFilter.region) q = q.eq('region', locationFilter.region);

        const { data: claimed } = await q;
        if (claimed) {
          for (const biz of claimed) {
            let claimer = null;
            if (biz.claimed_by) {
              const { data: u } = await supabase.from('profiles').select('full_name, email').eq('id', biz.claimed_by).maybeSingle();
              claimer = u;
            }
            all.push({
              id: biz.id, name: biz.name, city: biz.city, province: biz.province,
              street: biz.street || undefined, type: 'claimed', created_at: biz.created_at,
              approval_status: biz.approval_status, owner: claimer || undefined, category: biz.category,
            });
          }
        }
      }

      all.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      if (req !== loadingRef.current) return;
      setActivities(all);
    } catch (err) {
      console.error('Error loading activities:', err);
    } finally {
      if (req === loadingRef.current) setLoading(false);
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'registered': return { bg: 'bg-blue-100 text-blue-700', label: 'Registrata', icon: <Building2 className="w-3.5 h-3.5" /> };
      case 'claimed': return { bg: 'bg-green-100 text-green-700', label: 'Rivendicata', icon: <CheckCircle className="w-3.5 h-3.5" /> };
      case 'user_added': return { bg: 'bg-amber-100 text-amber-700', label: 'Aggiunta Utente', icon: <UserPlus className="w-3.5 h-3.5" /> };
      case 'imported': return { bg: 'bg-gray-100 text-gray-700', label: 'Importata', icon: <MapPin className="w-3.5 h-3.5" /> };
      default: return { bg: 'bg-gray-100 text-gray-700', label: type, icon: null };
    }
  };

  const deleteBusiness = async (business: BusinessActivity) => {
    if (!confirm(`Eliminare "${business.name}"?`)) return;
    try {
      if (business.type === 'registered') {
        await supabase.from('registered_businesses').delete().eq('id', business.id);
      } else {
        await supabase.from('unclaimed_business_locations').delete().eq('id', business.id);
      }
      loadActivities();
      onReload();
      setSelectedBusiness(null);
    } catch (err: any) {
      alert(`Errore: ${err.message}`);
    }
  };

  const hasActiveFilter = locationFilter.region || locationFilter.province || locationFilter.city || nameSearch;

  const resetFilters = () => {
    setLocationFilter({ region: '', province: '', provinceCode: '', city: '' });
    setNameSearch('');
  };

  return (
    <div>
      {/* Hero Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl p-6 mb-6">
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
        <div className="relative z-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">Monitoraggio</p>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-white">Attività Commerciali</h2>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-white border border-white/20">{activities.length}</span>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              {(['all', 'claimed', 'user_added', 'imported', 'registered'] as const).map(t => (
                <button key={t} onClick={() => setTypeFilter(t)}
                  className={`rounded-xl px-4 py-2 text-sm font-medium transition-all ${typeFilter === t ? 'bg-white text-gray-900 shadow' : 'bg-white/10 text-white hover:bg-white/20'}`}>
                  {{ all: 'Tutte', claimed: 'Rivendicate', user_added: 'Aggiunte', imported: 'Importate', registered: 'Registrate' }[t]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Filtri di ricerca</span>
          {hasActiveFilter && (
            <button onClick={resetFilters} className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700">
              <X className="w-3.5 h-3.5" /> Rimuovi tutti i filtri
            </button>
          )}
        </div>
        {/* Name search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Cerca per nome attività..."
            value={nameSearch}
            onChange={e => setNameSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        {/* Location dropdowns */}
        <AdminLocationFilter value={locationFilter} onChange={setLocationFilter} />
      </div>

      {/* Activity cards */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-700 mx-auto mb-3"></div>
          <p className="text-sm text-gray-500">Caricamento attività...</p>
        </div>
      ) : activities.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
          <Building2 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-600">Nessuna attività trovata</p>
          <p className="text-xs text-gray-400 mt-1">
            {hasActiveFilter ? 'Prova a modificare o rimuovere i filtri' : 'Non ci sono attività da visualizzare'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {activities.map(activity => {
            const badge = getTypeBadge(activity.type);
            return (
              <div key={`${activity.type}-${activity.id}`} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {activity.verified && <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />}
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-gray-900 truncate">{activity.name}</div>
                      {activity.category?.name && (
                        <div className="text-xs text-blue-600 font-medium mt-0.5">{activity.category.name}</div>
                      )}
                      {activity.street && <div className="text-xs text-gray-500 mt-0.5 truncate">{activity.street}</div>}
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full flex-shrink-0 ${badge.bg}`}>
                    {badge.icon}{badge.label}
                  </span>
                  <div className="flex-shrink-0 hidden md:block">
                    <div className="text-sm text-gray-900">{activity.city}</div>
                    <div className="text-xs text-gray-500">{activity.province}</div>
                  </div>
                  <div className="flex-shrink-0 hidden lg:block">
                    {activity.owner ? (
                      <div><div className="text-sm font-medium text-gray-900">{activity.owner.full_name}</div><div className="text-xs text-gray-500">{activity.owner.email}</div></div>
                    ) : activity.added_by ? (
                      <div><div className="text-sm font-medium text-gray-900">{activity.added_by.full_name}</div><div className="text-xs text-gray-500">{activity.added_by.email}</div></div>
                    ) : (
                      <span className="text-sm text-gray-400">Sistema</span>
                    )}
                  </div>
                  <span className="text-sm text-gray-500 flex-shrink-0 hidden sm:block">{new Date(activity.created_at).toLocaleDateString('it-IT')}</span>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => setSelectedBusiness(activity)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Dettagli"><Eye className="w-4 h-4" /></button>
                    <button onClick={() => deleteBusiness(activity)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Elimina"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail modal */}
      {selectedBusiness && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white px-6 py-5 rounded-t-2xl flex items-center justify-between">
              <h3 className="text-xl font-bold">Dettagli Attività</h3>
              <button onClick={() => setSelectedBusiness(null)} className="text-white/70 hover:text-white text-2xl font-bold leading-none">×</button>
            </div>
            <div className="p-6 space-y-4">
              <div><label className="text-sm font-semibold text-gray-700">Nome</label><p className="text-gray-900">{selectedBusiness.name}</p></div>
              <div>
                <label className="text-sm font-semibold text-gray-700">Tipo</label>
                <div className="mt-1">{(() => { const b = getTypeBadge(selectedBusiness.type); return <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full ${b.bg}`}>{b.icon}{b.label}</span>; })()}</div>
              </div>
              {selectedBusiness.category && <div><label className="text-sm font-semibold text-gray-700">Categoria</label><p className="text-gray-900">{selectedBusiness.category.name}</p></div>}
              <div>
                <label className="text-sm font-semibold text-gray-700">Località</label>
                <p className="text-gray-900">{selectedBusiness.city}, {selectedBusiness.province}</p>
                {selectedBusiness.street && <p className="text-sm text-gray-600 mt-1">{selectedBusiness.street}</p>}
              </div>
              {selectedBusiness.approval_status && (
                <div><label className="text-sm font-semibold text-gray-700">Stato approvazione</label>
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium mt-1 ${selectedBusiness.approval_status === 'approved' ? 'bg-green-100 text-green-700' : selectedBusiness.approval_status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {selectedBusiness.approval_status === 'approved' ? 'Approvata' : selectedBusiness.approval_status === 'rejected' ? 'Rifiutata' : 'In attesa'}
                  </span>
                </div>
              )}
              {selectedBusiness.owner && <div><label className="text-sm font-semibold text-gray-700">Proprietario</label><p className="text-gray-900">{selectedBusiness.owner.full_name}</p><p className="text-sm text-gray-600">{selectedBusiness.owner.email}</p></div>}
              {selectedBusiness.added_by && <div><label className="text-sm font-semibold text-gray-700">Aggiunto da</label><p className="text-gray-900">{selectedBusiness.added_by.full_name}</p><p className="text-sm text-gray-600">{selectedBusiness.added_by.email}</p></div>}
              {selectedBusiness.verified !== undefined && <div><label className="text-sm font-semibold text-gray-700">Verificato</label><p className={`font-medium ${selectedBusiness.verified ? 'text-green-600' : 'text-gray-600'}`}>{selectedBusiness.verified ? 'Sì' : 'No'}</p></div>}
              <div><label className="text-sm font-semibold text-gray-700">Data Creazione</label><p className="text-gray-900">{new Date(selectedBusiness.created_at).toLocaleString('it-IT')}</p></div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => deleteBusiness(selectedBusiness)} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium">Elimina</button>
                <button onClick={() => setSelectedBusiness(null)} className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium">Chiudi</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
