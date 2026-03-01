import { useState, useEffect } from 'react';
import { Building2, CheckCircle, MapPin, Mail, Phone, Edit2, Search, Filter, Download, Upload, UserPlus, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';

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

  useEffect(() => {
    loadBusinesses();
  }, [activeTab]);

  const loadBusinesses = async () => {
    setLoading(true);
    try {
      let allBusinesses: BusinessLocation[] = [];

      if (activeTab === 'imported' || activeTab === 'user_added') {
        // Load from unclaimed_business_locations
        const { data: unclaimedData, error: unclaimedError } = await supabase
          .from('unclaimed_business_locations')
          .select(`
            *,
            category:category_id(name),
            added_by_profile:added_by(full_name, email)
          `)
          .order('created_at', { ascending: false });

        if (unclaimedError) throw unclaimedError;

        allBusinesses = (unclaimedData || []).map(business => {
          const source: 'imported' | 'user_added' = business.added_by ? 'user_added' : 'imported';
          return {
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
            category: business.category,
            unclaimed_business: {
              added_by: business.added_by,
              added_by_profile: business.added_by_profile
            },
            source
          };
        }).filter(b => b.source === activeTab);

      } else if (activeTab === 'claimed' || activeTab === 'self_registered') {
        // Load from business_locations
        const { data: claimedData, error: claimedError } = await supabase
          .from('business_locations')
          .select(`
            *,
            category:business_category_id(name),
            business:business_id(
              owner_id,
              owner:owner_id(full_name, email)
            )
          `)
          .order('created_at', { ascending: false });

        if (claimedError) throw claimedError;

        allBusinesses = (claimedData || []).map(business => {
          const source: 'claimed' | 'self_registered' = business.is_claimed ? 'claimed' : 'self_registered';
          return {
            ...business,
            unclaimed_business_id: null,
            is_main: business.is_primary || false,
            source
          };
        }).filter(b => b.source === activeTab);
      }

      setBusinesses(allBusinesses);
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
        : 'business_locations';

      let updateData: any;
      if (tableName === 'unclaimed_business_locations') {
        updateData = { verification_badge: !currentStatus ? 'verified' : null };
      } else {
        updateData = { is_verified: !currentStatus };
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
        : 'business_locations';

      let updateData: any = {
        name: editingBusiness.name,
        city: editingBusiness.city,
        province: editingBusiness.province,
        region: editingBusiness.region,
        postal_code: editingBusiness.postal_code,
        phone: editingBusiness.phone,
        email: editingBusiness.email,
        website: editingBusiness.website,
      };

      if (tableName === 'unclaimed_business_locations') {
        updateData.street = editingBusiness.address;
      } else {
        updateData.address = editingBusiness.address;
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
        : 'business_locations';

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

  const filteredBusinesses = businesses.filter(b =>
    b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
              const count = businesses.length;
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
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-gray-200">
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
        </div>

        {/* Business List */}
        <div className="p-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Caricamento...</p>
            </div>
          ) : filteredBusinesses.length === 0 ? (
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
                  {filteredBusinesses.map((business) => (
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
                            onClick={() => setSelectedBusiness(business)}
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
        </div>
      </div>

      {/* View Modal */}
      {selectedBusiness && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">Dettagli Attività</h3>
              <button
                onClick={() => setSelectedBusiness(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
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
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setSelectedBusiness(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Chiudi
              </button>
              <button
                onClick={() => {
                  setEditingBusiness(selectedBusiness);
                  setSelectedBusiness(null);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Modifica
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingBusiness && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">Modifica Attività</h3>
              <button
                onClick={() => setEditingBusiness(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                <input
                  type="text"
                  value={editingBusiness.name}
                  onChange={(e) => setEditingBusiness({ ...editingBusiness, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Indirizzo</label>
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
            <div className="p-6 border-t border-gray-200 flex justify-between">
              <button
                onClick={() => handleDelete(editingBusiness.id)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Elimina Attività
              </button>
              <div className="flex gap-3">
                <button
                  onClick={() => setEditingBusiness(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Annulla
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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
