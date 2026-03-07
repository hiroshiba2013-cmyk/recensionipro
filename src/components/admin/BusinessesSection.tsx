import { useState, useEffect } from 'react';
import { Building2, CheckCircle, MapPin, Mail, Phone, FileEdit as Edit2, Search, Filter, Download, Upload, UserPlus, X, Clock, FileText, Briefcase } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { ITALIAN_REGIONS, PROVINCES_BY_REGION, CITIES_BY_PROVINCE } from '../../lib/cities';

interface BusinessLocation {
  id: string;
  business_id: string | null;
  unclaimed_business_id: string | null;
  name: string;
  address: string;
  city: string;
  province: string;
  region: string;
  postal_code: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  vat_number: string | null;
  is_verified: boolean;
  is_main: boolean;
  created_at: string;
  description?: string | null;
  business_hours?: any;
  services?: string[] | null;
  category: {
    name: string;
  } | null;
  business?: {
    owner_id: string;
    owner: {
      full_name: string;
      email: string;
    };
  };
  unclaimed_business?: {
    added_by: string | null;
    added_by_profile?: {
      full_name: string;
      email: string;
    };
  };
  source: 'imported' | 'user_added' | 'claimed' | 'self_registered';
}

interface BusinessesSectionProps {
  onReload: () => Promise<void>;
}

type TabType = 'imported' | 'user_added' | 'claimed' | 'self_registered';

export function BusinessesSection({ onReload }: BusinessesSectionProps) {
  const [activeTab, setActiveTab] = useState<TabType>('imported');
  const [businesses, setBusinesses] = useState<BusinessLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBusiness, setSelectedBusiness] = useState<BusinessLocation | null>(null);
  const [editingBusiness, setEditingBusiness] = useState<BusinessLocation | null>(null);
  const [allLocations, setAllLocations] = useState<BusinessLocation[]>([]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 50;

  // Advanced filters
  const [filters, setFilters] = useState({
    city: '',
    province: '',
    region: '',
    category: '',
    verified: 'all' as 'all' | 'verified' | 'unverified'
  });

  useEffect(() => {
    setCurrentPage(1);
    loadBusinesses();
  }, [activeTab, filters]);

  useEffect(() => {
    loadBusinesses();
  }, [currentPage]);

  const loadBusinesses = async () => {
    setLoading(true);
    try {
      let allBusinesses: BusinessLocation[] = [];
      let count = 0;

      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;

      if (activeTab === 'imported' || activeTab === 'user_added') {
        // Build query for unclaimed_business_locations
        let query = supabase
          .from('unclaimed_business_locations')
          .select(`
            *,
            category:category_id(name)
          `, { count: 'exact' });

        // Filter by source (imported vs user_added)
        if (activeTab === 'imported') {
          query = query.is('added_by', null);
        } else {
          query = query.not('added_by', 'is', null);
        }

        // Apply advanced filters
        if (filters.city) {
          query = query.ilike('city', `%${filters.city}%`);
        }
        if (filters.province) {
          query = query.ilike('province', `%${filters.province}%`);
        }
        if (filters.region) {
          query = query.ilike('region', `%${filters.region}%`);
        }
        if (filters.verified === 'verified') {
          query = query.eq('verification_badge', 'verified');
        } else if (filters.verified === 'unverified') {
          query = query.is('verification_badge', null);
        }

        // Apply search
        if (searchTerm) {
          query = query.or(`name.ilike.%${searchTerm}%,city.ilike.%${searchTerm}%,street.ilike.%${searchTerm}%`);
        }

        const { data: unclaimedData, error: unclaimedError, count: totalCount } = await query
          .order('created_at', { ascending: false })
          .range(from, to);

        if (unclaimedError) throw unclaimedError;

        count = totalCount || 0;
        allBusinesses = (unclaimedData || []).map(business => ({
          id: business.id,
          business_id: null,
          unclaimed_business_id: business.id,
          name: business.name,
          address: business.street || '',
          city: business.city,
          province: business.province,
          region: business.region,
          postal_code: business.postal_code,
          phone: business.phone,
          email: business.email,
          website: business.website,
          vat_number: null,
          is_verified: business.verification_badge === 'verified',
          is_main: false,
          created_at: business.created_at,
          description: business.description,
          business_hours: business.business_hours,
          services: business.services,
          category: business.category,
          source: activeTab
        }));

      } else if (activeTab === 'claimed' || activeTab === 'self_registered') {
        // Build query for registered_businesses
        let query = supabase
          .from('registered_businesses')
          .select(`
            *,
            category:category_id(name),
            owner:owner_id(full_name, email),
            locations:registered_business_locations(*)
          `, { count: 'exact' });

        // Filter by source_type
        if (activeTab === 'claimed') {
          // Claimed: businesses that were originally unclaimed and then claimed
          query = query.eq('source_type', 'claimed');
        } else {
          // Self-registered: businesses registered directly by the owner
          query = query.eq('source_type', 'self_registered');
        }

        // Apply advanced filters
        if (filters.verified === 'verified') {
          query = query.eq('verified', true);
        } else if (filters.verified === 'unverified') {
          query = query.eq('verified', false);
        }

        // Apply search
        if (searchTerm) {
          query = query.or(`name.ilike.%${searchTerm}%`);
        }

        const { data: claimedData, error: claimedError, count: totalCount } = await query
          .order('created_at', { ascending: false })
          .range(from, to);

        if (claimedError) throw claimedError;

        count = totalCount || 0;
        // Flatten businesses with their locations
        allBusinesses = (claimedData || []).flatMap(business => {
          const primaryLocation = business.locations?.find((l: any) => l.is_primary) || business.locations?.[0];

          if (!primaryLocation) {
            return [{
              id: business.id,
              business_id: business.id,
              unclaimed_business_id: null,
              name: business.name,
              address: business.billing_street || '',
              city: business.billing_city || '',
              province: business.billing_province || '',
              region: '',
              postal_code: business.billing_postal_code,
              phone: null,
              email: null,
              website: business.website,
              vat_number: business.vat_number,
              is_verified: business.verified,
              is_main: true,
              created_at: business.created_at,
              description: business.description,
              business_hours: null,
              services: null,
              category: business.category,
              business: business.owner ? {
                owner_id: business.owner_id,
                owner: business.owner
              } : undefined,
              source: activeTab
            }];
          }

          return [{
            id: primaryLocation.id,
            business_id: business.id,
            unclaimed_business_id: null,
            name: primaryLocation.name || business.name,
            address: primaryLocation.street || '',
            city: primaryLocation.city,
            province: primaryLocation.province,
            region: primaryLocation.region,
            postal_code: primaryLocation.postal_code,
            phone: primaryLocation.phone,
            email: primaryLocation.email,
            website: primaryLocation.website || business.website,
            vat_number: business.vat_number,
            is_verified: business.verified,
            is_main: primaryLocation.is_primary || false,
            created_at: business.created_at,
            description: primaryLocation.description,
            business_hours: primaryLocation.business_hours,
            services: primaryLocation.services,
            category: business.category,
            business: business.owner ? {
              owner_id: business.owner_id,
              owner: business.owner
            } : undefined,
            source: activeTab
          }];
        });
      }

      setBusinesses(allBusinesses);
      setTotalCount(count);
    } catch (error) {
      console.error('Error loading businesses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleVerification = async (businessId: string, currentStatus: boolean) => {
    if (!confirm(`Sei sicuro di voler ${currentStatus ? 'rimuovere la verifica da' : 'verificare'} questa attività?`)) return;

    try {
      const tableName = activeTab === 'imported' || activeTab === 'user_added'
        ? 'unclaimed_business_locations'
        : 'registered_businesses';

      let updateData: any;
      if (tableName === 'unclaimed_business_locations') {
        updateData = { verification_badge: !currentStatus ? 'verified' : null };
      } else {
        updateData = { verified: !currentStatus };
      }

      const { error } = await supabase
        .from(tableName)
        .update(updateData)
        .eq('id', businessId);

      if (error) throw error;

      alert(`Verifica ${!currentStatus ? 'attivata' : 'rimossa'} con successo`);
      await loadBusinesses();
    } catch (error: any) {
      console.error('Error updating verification:', error);
      alert(`Errore: ${error.message}`);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingBusiness) return;

    try {
      const tableName = activeTab === 'imported' || activeTab === 'user_added'
        ? 'unclaimed_business_locations'
        : 'registered_businesses';

      let updateData: any = {
        city: editingBusiness.city,
        province: editingBusiness.province,
        region: editingBusiness.region,
        postal_code: editingBusiness.postal_code,
        phone: editingBusiness.phone,
        email: editingBusiness.email,
        website: editingBusiness.website,
        description: editingBusiness.description,
        business_hours: editingBusiness.business_hours,
        services: editingBusiness.services,
      };

      if (tableName === 'unclaimed_business_locations') {
        updateData.name = editingBusiness.name;
        updateData.street = editingBusiness.address;
      } else {
        updateData.business_name = editingBusiness.name;
        updateData.street = editingBusiness.address;
        updateData.vat_number = editingBusiness.vat_number;
      }

      const { error } = await supabase
        .from(tableName)
        .update(updateData)
        .eq('id', editingBusiness.id);

      if (error) throw error;

      alert('Attività aggiornata con successo');
      setEditingBusiness(null);
      await loadBusinesses();
    } catch (error: any) {
      console.error('Error updating business:', error);
      alert(`Errore: ${error.message}`);
    }
  };

  const handleDelete = async (businessId: string) => {
    if (!confirm('Sei sicuro di voler eliminare questa attività? Questa azione non può essere annullata.')) return;

    try {
      const tableName = activeTab === 'imported' || activeTab === 'user_added'
        ? 'unclaimed_business_locations'
        : 'registered_businesses';

      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', businessId);

      if (error) throw error;

      alert('Attività eliminata con successo');
      await loadBusinesses();
    } catch (error: any) {
      console.error('Error deleting business:', error);
      alert(`Errore: ${error.message}`);
    }
  };

  const loadAllLocations = async (business: BusinessLocation) => {
    if (!business.business_id) {
      setAllLocations([business]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('business_locations')
        .select(`
          *,
          category:business_category_id(name),
          business:business_id(
            owner_id,
            owner:owner_id(full_name, email)
          )
        `)
        .eq('business_id', business.business_id)
        .order('is_main', { ascending: false })
        .order('created_at', { ascending: true });

      if (error) throw error;

      const locations = (data || []).map(loc => ({
        id: loc.id,
        business_id: loc.business_id,
        unclaimed_business_id: null,
        name: loc.name,
        address: loc.address,
        city: loc.city,
        province: loc.province,
        region: loc.region,
        postal_code: loc.postal_code,
        phone: loc.phone,
        email: loc.email,
        website: loc.website,
        vat_number: loc.vat_number,
        is_verified: loc.is_verified,
        is_main: loc.is_main,
        created_at: loc.created_at,
        description: loc.description,
        business_hours: loc.business_hours,
        services: loc.services,
        category: loc.category,
        business: loc.business,
        source: activeTab
      }));

      setAllLocations(locations);
    } catch (error: any) {
      console.error('Error loading locations:', error);
      setAllLocations([business]);
    }
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const tabs = [
    { id: 'imported' as TabType, label: 'Importate', icon: Download },
    { id: 'user_added' as TabType, label: 'Aggiunte da Utenti', icon: UserPlus },
    { id: 'claimed' as TabType, label: 'Rivendicate', icon: CheckCircle },
    { id: 'self_registered' as TabType, label: 'Iscritte da Sole', icon: Building2 },
  ];

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                  {activeTab === tab.id && (
                    <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                      {totalCount.toLocaleString()}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Search Bar and Filters */}
        <div className="p-4 border-b border-gray-200 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Cerca per nome, città o indirizzo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Advanced Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Regione</label>
              <select
                value={filters.region}
                onChange={(e) => setFilters({ ...filters, region: e.target.value, province: '', city: '' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="">Tutte le regioni</option>
                {ITALIAN_REGIONS.map((region) => (
                  <option key={region} value={region}>{region}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Provincia</label>
              <select
                value={filters.province}
                onChange={(e) => setFilters({ ...filters, province: e.target.value, city: '' })}
                disabled={!filters.region}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">Tutte le province</option>
                {filters.region && PROVINCES_BY_REGION[filters.region]?.map((province) => (
                  <option key={province} value={province}>{province}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Città</label>
              <select
                value={filters.city}
                onChange={(e) => setFilters({ ...filters, city: e.target.value })}
                disabled={!filters.province}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">Tutte le città</option>
                {filters.province && CITIES_BY_PROVINCE[filters.province]?.map((city) => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stato Verifica</label>
              <select
                value={filters.verified}
                onChange={(e) => setFilters({ ...filters, verified: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="all">Tutte</option>
                <option value="verified">Solo Verificate</option>
                <option value="unverified">Solo Non Verificate</option>
              </select>
            </div>
          </div>

          {/* Stats and Reset */}
          <div className="flex items-center justify-between text-sm">
            <div className="text-gray-600">
              Visualizzazione {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, totalCount)} di {totalCount.toLocaleString()} attività
            </div>
            {(filters.city || filters.province || filters.region || filters.verified !== 'all') && (
              <button
                onClick={() => setFilters({ city: '', province: '', region: '', category: '', verified: 'all' })}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Ripristina filtri
              </button>
            )}
          </div>
        </div>

        {/* Business List */}
        <div className="p-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Caricamento...</p>
            </div>
          ) : businesses.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Nessuna attività trovata</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Attività
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Indirizzo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Contatti
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Categoria
                    </th>
                    {(activeTab === 'user_added' || activeTab === 'claimed' || activeTab === 'self_registered') && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        {activeTab === 'self_registered' ? 'Proprietario' : 'Aggiunto da'}
                      </th>
                    )}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Stato
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Azioni
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {businesses.map((business) => (
                    <tr key={business.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-5 h-5 text-gray-400 flex-shrink-0" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">{business.name}</div>
                            {business.vat_number && (
                              <div className="text-xs text-gray-500">P.IVA: {business.vat_number}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                          <div className="text-sm text-gray-900">
                            <div>{business.address}</div>
                            <div className="text-gray-500">
                              {business.city}, {business.province} {business.postal_code}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {business.phone && (
                            <div className="flex items-center gap-2 text-sm text-gray-900">
                              <Phone className="w-4 h-4 text-gray-400" />
                              {business.phone}
                            </div>
                          )}
                          {business.email && (
                            <div className="flex items-center gap-2 text-sm text-gray-900">
                              <Mail className="w-4 h-4 text-gray-400" />
                              {business.email}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{business.category?.name || 'N/A'}</div>
                      </td>
                      {(activeTab === 'user_added' || activeTab === 'claimed' || activeTab === 'self_registered') && (
                        <td className="px-6 py-4">
                          {activeTab === 'self_registered' && business.business?.owner ? (
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {business.business.owner.full_name}
                              </div>
                              <div className="text-xs text-gray-500">
                                {business.business.owner.email}
                              </div>
                            </div>
                          ) : activeTab === 'claimed' && business.business?.owner ? (
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {business.business.owner.full_name}
                              </div>
                              <div className="text-xs text-gray-500">
                                {business.business.owner.email}
                              </div>
                            </div>
                          ) : business.unclaimed_business?.added_by_profile ? (
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {business.unclaimed_business.added_by_profile.full_name}
                              </div>
                              <div className="text-xs text-gray-500">
                                {business.unclaimed_business.added_by_profile.email}
                              </div>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-500">N/A</span>
                          )}
                        </td>
                      )}
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            business.is_verified
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {business.is_verified ? 'Verificata' : 'Non verificata'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedBusiness(business);
                              loadAllLocations(business);
                            }}
                            className="text-blue-600 hover:text-blue-800 p-1"
                            title="Visualizza dettagli"
                          >
                            <Search className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingBusiness(business)}
                            className="text-gray-600 hover:text-gray-800 p-1"
                            title="Modifica"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleToggleVerification(business.id, business.is_verified)}
                            className={`px-2 py-1 text-xs rounded ${
                              business.is_verified
                                ? 'bg-red-100 text-red-800 hover:bg-red-200'
                                : 'bg-green-100 text-green-800 hover:bg-green-200'
                            }`}
                          >
                            {business.is_verified ? 'Rimuovi' : 'Verifica'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {!loading && businesses.length > 0 && totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                Pagina {currentPage} di {totalPages}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Prima
                </button>
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Precedente
                </button>

                {/* Page numbers */}
                <div className="flex gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-2 text-sm border rounded-lg ${
                          currentPage === pageNum
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Successiva
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Ultima
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* View Modal */}
      {selectedBusiness && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Dettagli Attività</h3>
                {allLocations.length > 1 && (
                  <p className="text-sm text-gray-600 mt-1">{allLocations.length} sedi totali</p>
                )}
              </div>
              <button
                onClick={() => {
                  setSelectedBusiness(null);
                  setAllLocations([]);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              {allLocations.length > 1 ? (
                <>
                  {/* Business Owner Info */}
                  {allLocations[0]?.business?.owner && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">Informazioni Proprietario</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Nome</label>
                          <p className="text-sm text-gray-900">{allLocations[0].business.owner.full_name}</p>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                          <p className="text-sm text-gray-900">{allLocations[0].business.owner.email}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Multiple locations */}
                  {allLocations.map((location, index) => (
                  <div key={location.id} className="border border-gray-200 rounded-lg p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                      <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-blue-600" />
                        Sede {index + 1}
                        {location.is_main && (
                          <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                            Principale
                          </span>
                        )}
                      </h4>
                      {location.is_verified && (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                      <p className="text-gray-900">{location.name}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Indirizzo</label>
                      <p className="text-gray-900">{location.address}</p>
                      <p className="text-gray-600">
                        {location.city}, {location.province} {location.postal_code}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Telefono</label>
                        <p className="text-gray-900">{location.phone || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <p className="text-gray-900">{location.email || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Sito Web</label>
                        <p className="text-gray-900">{location.website || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">P.IVA</label>
                        <p className="text-gray-900">{location.vat_number || 'N/A'}</p>
                      </div>
                    </div>
                    {location.category && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                        <p className="text-gray-900">{location.category.name}</p>
                      </div>
                    )}
                    {location.description && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Descrizione</label>
                        <p className="text-gray-900 whitespace-pre-wrap">{location.description}</p>
                      </div>
                    )}
                    {location.business_hours && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Orari di Apertura</label>
                        <p className="text-gray-900 whitespace-pre-wrap">{location.business_hours}</p>
                      </div>
                    )}
                    {location.services && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Servizi Offerti</label>
                        <p className="text-gray-900 whitespace-pre-wrap">{location.services}</p>
                      </div>
                    )}
                  </div>
                  ))}
                </>
              ) : (
                // Single location view
                <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                <p className="text-gray-900">{selectedBusiness.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Indirizzo</label>
                <p className="text-gray-900">{selectedBusiness.address}</p>
                <p className="text-gray-600">
                  {selectedBusiness.city}, {selectedBusiness.province} {selectedBusiness.postal_code}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefono</label>
                  <p className="text-gray-900">{selectedBusiness.phone || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <p className="text-gray-900">{selectedBusiness.email || 'N/A'}</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sito Web</label>
                <p className="text-gray-900">{selectedBusiness.website || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">P.IVA</label>
                <p className="text-gray-900">{selectedBusiness.vat_number || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                <p className="text-gray-900">{selectedBusiness.category?.name || 'N/A'}</p>
              </div>
              {selectedBusiness.description && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descrizione</label>
                  <p className="text-gray-900 whitespace-pre-wrap">{selectedBusiness.description}</p>
                </div>
              )}
              {selectedBusiness.business_hours && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Orari di Apertura</label>
                  <p className="text-gray-900 whitespace-pre-wrap">{selectedBusiness.business_hours}</p>
                </div>
              )}
              {selectedBusiness.services && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Servizi Offerti</label>
                  <p className="text-gray-900 whitespace-pre-wrap">{selectedBusiness.services}</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stato</label>
                <span
                  className={`inline-block px-2 py-1 text-xs rounded-full ${
                    selectedBusiness.is_verified
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {selectedBusiness.is_verified ? 'Verificata' : 'Non verificata'}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data Creazione</label>
                <p className="text-gray-900">{new Date(selectedBusiness.created_at).toLocaleString('it-IT')}</p>
              </div>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setSelectedBusiness(null);
                  setAllLocations([]);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Chiudi
              </button>
              {allLocations.length === 1 && (
                <button
                  onClick={() => {
                    setEditingBusiness(selectedBusiness);
                    setSelectedBusiness(null);
                    setAllLocations([]);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Modifica
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingBusiness && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10">
              <h3 className="text-xl font-bold text-gray-900">Modifica Attività</h3>
              <button
                onClick={() => setEditingBusiness(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* Informazioni Base */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Informazioni Base
                </h4>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome Attività</label>
                  <input
                    type="text"
                    value={editingBusiness.name}
                    onChange={(e) => setEditingBusiness({ ...editingBusiness, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <span className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Descrizione
                    </span>
                  </label>
                  <textarea
                    value={editingBusiness.description || ''}
                    onChange={(e) => setEditingBusiness({ ...editingBusiness, description: e.target.value })}
                    rows={4}
                    placeholder="Inserisci una descrizione dell'attività..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Indirizzo */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Indirizzo
                </h4>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Via e Numero</label>
                  <input
                    type="text"
                    value={editingBusiness.address}
                    onChange={(e) => setEditingBusiness({ ...editingBusiness, address: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Città</label>
                    <input
                      type="text"
                      value={editingBusiness.city}
                      onChange={(e) => setEditingBusiness({ ...editingBusiness, city: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Provincia</label>
                    <input
                      type="text"
                      value={editingBusiness.province}
                      onChange={(e) => setEditingBusiness({ ...editingBusiness, province: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">CAP</label>
                    <input
                      type="text"
                      value={editingBusiness.postal_code || ''}
                      onChange={(e) => setEditingBusiness({ ...editingBusiness, postal_code: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Regione</label>
                  <input
                    type="text"
                    value={editingBusiness.region}
                    onChange={(e) => setEditingBusiness({ ...editingBusiness, region: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Contatti */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Phone className="w-5 h-5" />
                  Contatti
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Telefono</label>
                    <input
                      type="text"
                      value={editingBusiness.phone || ''}
                      onChange={(e) => setEditingBusiness({ ...editingBusiness, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={editingBusiness.email || ''}
                      onChange={(e) => setEditingBusiness({ ...editingBusiness, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sito Web</label>
                    <input
                      type="url"
                      value={editingBusiness.website || ''}
                      onChange={(e) => setEditingBusiness({ ...editingBusiness, website: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">P.IVA</label>
                    <input
                      type="text"
                      value={editingBusiness.vat_number || ''}
                      onChange={(e) => setEditingBusiness({ ...editingBusiness, vat_number: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Orari */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Orari di Apertura
                </h4>
                <div className="space-y-2">
                  {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => {
                    const dayLabels: Record<string, string> = {
                      monday: 'Lunedì',
                      tuesday: 'Martedì',
                      wednesday: 'Mercoledì',
                      thursday: 'Giovedì',
                      friday: 'Venerdì',
                      saturday: 'Sabato',
                      sunday: 'Domenica'
                    };
                    const hours = editingBusiness.business_hours?.[day] || { open: '', close: '', closed: false };
                    return (
                      <div key={day} className="grid grid-cols-12 gap-4 items-center">
                        <div className="col-span-3">
                          <label className="text-sm font-medium text-gray-700">{dayLabels[day]}</label>
                        </div>
                        <div className="col-span-3">
                          <input
                            type="time"
                            value={hours.open || ''}
                            disabled={hours.closed}
                            onChange={(e) => {
                              const newHours = { ...editingBusiness.business_hours };
                              if (!newHours[day]) newHours[day] = { open: '', close: '', closed: false };
                              newHours[day].open = e.target.value;
                              setEditingBusiness({ ...editingBusiness, business_hours: newHours });
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm disabled:bg-gray-100"
                          />
                        </div>
                        <div className="col-span-3">
                          <input
                            type="time"
                            value={hours.close || ''}
                            disabled={hours.closed}
                            onChange={(e) => {
                              const newHours = { ...editingBusiness.business_hours };
                              if (!newHours[day]) newHours[day] = { open: '', close: '', closed: false };
                              newHours[day].close = e.target.value;
                              setEditingBusiness({ ...editingBusiness, business_hours: newHours });
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm disabled:bg-gray-100"
                          />
                        </div>
                        <div className="col-span-3">
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={hours.closed || false}
                              onChange={(e) => {
                                const newHours = { ...editingBusiness.business_hours };
                                if (!newHours[day]) newHours[day] = { open: '', close: '', closed: false };
                                newHours[day].closed = e.target.checked;
                                setEditingBusiness({ ...editingBusiness, business_hours: newHours });
                              }}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">Chiuso</span>
                          </label>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Servizi */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Briefcase className="w-5 h-5" />
                  Servizi Offerti
                </h4>
                <div>
                  <textarea
                    value={(editingBusiness.services || []).join(', ')}
                    onChange={(e) => {
                      const services = e.target.value.split(',').map(s => s.trim()).filter(s => s);
                      setEditingBusiness({ ...editingBusiness, services });
                    }}
                    rows={3}
                    placeholder="Inserisci i servizi separati da virgola (es: Consegna a domicilio, Wifi gratuito, Parcheggio)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Servizi attuali: {(editingBusiness.services || []).length > 0 ? (editingBusiness.services || []).join(', ') : 'Nessun servizio inserito'}
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-between sticky bottom-0 bg-white">
              <button
                onClick={() => handleDelete(editingBusiness.id)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
              >
                Elimina Attività
              </button>
              <div className="flex gap-3">
                <button
                  onClick={() => setEditingBusiness(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Annulla
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  Salva Modifiche
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
