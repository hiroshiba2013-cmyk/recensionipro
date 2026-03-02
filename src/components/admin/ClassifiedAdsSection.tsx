import { useState } from 'react';
import { Trash2, Eye, Filter, Tag, Calendar, User, MapPin, Euro, Search, Edit, Save, X as CloseIcon } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface ClassifiedAd {
  id: string;
  title: string;
  description: string;
  price: number | null;
  status: string;
  ad_type: string;
  category: string;
  city: string;
  province: string;
  region: string;
  images: string[] | null;
  created_at: string;
  expires_at: string;
  user_id: string;
  user: {
    full_name: string;
    email: string;
    nickname?: string;
  };
  family_member_id?: string | null;
}

interface ClassifiedAdsSectionProps {
  ads: ClassifiedAd[];
  onReload: () => void;
}

export function ClassifiedAdsSection({ ads, onReload }: ClassifiedAdsSectionProps) {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterNickname, setFilterNickname] = useState<string>('');
  const [selectedAd, setSelectedAd] = useState<ClassifiedAd | null>(null);
  const [editingAd, setEditingAd] = useState<ClassifiedAd | null>(null);
  const [editForm, setEditForm] = useState<Partial<ClassifiedAd> | null>(null);

  const getUserNickname = (ad: ClassifiedAd) => {
    return ad.user.nickname || ad.user.full_name;
  };

  const filteredAds = ads.filter(ad => {
    const statusMatch = filterStatus === 'all' || ad.status === filterStatus;
    const typeMatch = filterType === 'all' || ad.ad_type === filterType;
    const nicknameMatch = !filterNickname.trim() ||
      getUserNickname(ad).toLowerCase().includes(filterNickname.toLowerCase());
    return statusMatch && typeMatch && nicknameMatch;
  });

  const updateAdStatus = async (adId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('classified_ads')
        .update({ status: newStatus })
        .eq('id', adId);

      if (error) throw error;

      alert('Stato annuncio aggiornato con successo');
      onReload();
    } catch (error: any) {
      console.error('Error updating ad:', error);
      alert(`Errore: ${error.message}`);
    }
  };

  const deleteAd = async (adId: string) => {
    if (!confirm('Sei sicuro di voler eliminare definitivamente questo annuncio? Questa azione è irreversibile.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('classified_ads')
        .delete()
        .eq('id', adId);

      if (error) throw error;

      alert('Annuncio eliminato con successo');
      onReload();
    } catch (error: any) {
      console.error('Error deleting ad:', error);
      alert(`Errore: ${error.message}`);
    }
  };

  const startEditAd = (ad: ClassifiedAd) => {
    setEditingAd(ad);
    setEditForm({
      title: ad.title,
      description: ad.description,
      price: ad.price,
      ad_type: ad.ad_type,
      category: ad.category,
      city: ad.city,
      province: ad.province,
      region: ad.region,
      status: ad.status,
    });
  };

  const cancelEditAd = () => {
    setEditingAd(null);
    setEditForm(null);
  };

  const saveAdEdit = async () => {
    if (!editingAd || !editForm) return;

    if (!editForm.title || !editForm.description || !editForm.category || !editForm.city) {
      alert('Compila tutti i campi obbligatori');
      return;
    }

    try {
      const { error } = await supabase
        .from('classified_ads')
        .update({
          title: editForm.title,
          description: editForm.description,
          price: editForm.price,
          ad_type: editForm.ad_type,
          category: editForm.category,
          city: editForm.city,
          province: editForm.province,
          region: editForm.region,
          status: editForm.status,
        })
        .eq('id', editingAd.id);

      if (error) throw error;

      alert('Annuncio aggiornato con successo');
      setEditingAd(null);
      setEditForm(null);
      onReload();
      if (selectedAd?.id === editingAd.id) {
        setSelectedAd(null);
      }
    } catch (error: any) {
      console.error('Error updating ad:', error);
      alert(`Errore: ${error.message}`);
    }
  };

  const getAdTypeLabel = (type: string) => {
    switch(type) {
      case 'sell': return 'Vendo';
      case 'buy': return 'Cerco';
      case 'gift': return 'Regalo';
      case 'exchange': return 'Scambio';
      default: return type;
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'sold': return 'bg-blue-100 text-blue-800';
      case 'expired': return 'bg-gray-100 text-gray-800';
      case 'deleted': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch(type) {
      case 'sell': return 'bg-blue-100 text-blue-800';
      case 'buy': return 'bg-orange-100 text-orange-800';
      case 'gift': return 'bg-pink-100 text-pink-800';
      case 'exchange': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-4 mb-4">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <h2 className="text-2xl font-bold text-gray-900">Gestione Annunci Classificati</h2>
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-500" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2"
            >
              <option value="all">Tutti gli stati</option>
              <option value="active">Attivi</option>
              <option value="sold">Venduti</option>
              <option value="expired">Scaduti</option>
              <option value="deleted">Eliminati</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-gray-500" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2"
            >
              <option value="all">Tutti i tipi</option>
              <option value="sell">Vendo</option>
              <option value="buy">Cerco</option>
              <option value="gift">Regalo</option>
              <option value="exchange">Scambio</option>
            </select>
          </div>

          <div className="flex items-center gap-2 flex-1 min-w-[250px]">
            <Search className="w-5 h-5 text-gray-500" />
            <input
              type="text"
              value={filterNickname}
              onChange={(e) => setFilterNickname(e.target.value)}
              placeholder="Cerca per nickname..."
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4 mb-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-gray-900">{ads.filter(a => a.status === 'active').length}</p>
            <p className="text-sm text-gray-600">Attivi</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{ads.filter(a => a.status === 'sold').length}</p>
            <p className="text-sm text-gray-600">Venduti</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{ads.filter(a => a.status === 'expired').length}</p>
            <p className="text-sm text-gray-600">Scaduti</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{ads.filter(a => a.status === 'deleted').length}</p>
            <p className="text-sm text-gray-600">Eliminati</p>
          </div>
        </div>
      </div>

      {filteredAds.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <Tag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Nessun annuncio trovato</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {filteredAds.map((ad) => (
            <div key={ad.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${getTypeColor(ad.ad_type)}`}>
                      {getAdTypeLabel(ad.ad_type)}
                    </span>
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${getStatusColor(ad.status)}`}>
                      {ad.status}
                    </span>
                  </div>
                  <h3 className="font-bold text-lg text-gray-900 mb-1">{ad.title}</h3>
                  {ad.price !== null && ad.price > 0 && (
                    <p className="text-xl font-bold text-green-600 mb-2">€{ad.price.toFixed(2)}</p>
                  )}
                </div>
                {ad.images && ad.images.length > 0 && (
                  <img
                    src={ad.images[0]}
                    alt={ad.title}
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                )}
              </div>

              <p className="text-gray-700 mb-3 line-clamp-2">{ad.description}</p>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <User className="w-4 h-4" />
                  <span>{ad.user.nickname || ad.user.full_name}</span>
                  <span className="text-gray-400">•</span>
                  <span>{ad.user.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span>{ad.city}, {ad.province}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Tag className="w-4 h-4" />
                  <span>{ad.category}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>Creato: {new Date(ad.created_at).toLocaleDateString('it-IT')}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>Scade: {new Date(ad.expires_at).toLocaleDateString('it-IT')}</span>
                </div>
              </div>

              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => startEditAd(ad)}
                  className="bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors flex items-center gap-2"
                  title="Modifica annuncio"
                >
                  <Edit className="w-4 h-4" />
                  Modifica
                </button>
                {ad.images && ad.images.length > 0 && (
                  <button
                    onClick={() => setSelectedAd(ad)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    Vedi
                  </button>
                )}
                <select
                  value={ad.status}
                  onChange={(e) => updateAdStatus(ad.id, e.target.value)}
                  className="flex-1 min-w-[120px] border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="active">Attivo</option>
                  <option value="sold">Venduto</option>
                  <option value="expired">Scaduto</option>
                  <option value="deleted">Eliminato</option>
                </select>
                <button
                  onClick={() => deleteAd(ad.id)}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedAd && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-2xl font-bold mb-2">{selectedAd.title}</h3>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${getTypeColor(selectedAd.ad_type)}`}>
                      {getAdTypeLabel(selectedAd.ad_type)}
                    </span>
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${getStatusColor(selectedAd.status)}`}>
                      {selectedAd.status}
                    </span>
                  </div>
                  {selectedAd.price !== null && selectedAd.price > 0 && (
                    <p className="text-2xl font-bold text-green-600">€{selectedAd.price.toFixed(2)}</p>
                  )}
                </div>
                <button
                  onClick={() => setSelectedAd(null)}
                  className="text-gray-500 hover:text-gray-700 text-3xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Descrizione:</h4>
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedAd.description}</p>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Informazioni:</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Utente:</span>
                      <p className="font-medium">{selectedAd.user.nickname || selectedAd.user.full_name}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Email:</span>
                      <p className="font-medium">{selectedAd.user.email}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Località:</span>
                      <p className="font-medium">{selectedAd.city}, {selectedAd.province}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Categoria:</span>
                      <p className="font-medium">{selectedAd.category}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Creato il:</span>
                      <p className="font-medium">{new Date(selectedAd.created_at).toLocaleDateString('it-IT')}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Scade il:</span>
                      <p className="font-medium">{new Date(selectedAd.expires_at).toLocaleDateString('it-IT')}</p>
                    </div>
                  </div>
                </div>

                {selectedAd.images && selectedAd.images.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Immagini:</h4>
                    <div className="grid grid-cols-2 gap-4">
                      {selectedAd.images.map((image, index) => (
                        <img
                          key={index}
                          src={image}
                          alt={`${selectedAd.title} - ${index + 1}`}
                          className="w-full h-64 object-cover rounded-lg"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Modifica Annuncio */}
      {editingAd && editForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[70]">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-amber-600 to-amber-700 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">Modifica Annuncio</h3>
              <button
                onClick={cancelEditAd}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <CloseIcon className="w-5 h-5 text-white" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Info Utente (sola lettura) */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">Informazioni Inserzionista</h4>
                <div className="text-sm space-y-1">
                  <p>
                    <span className="text-gray-600">Nome:</span>
                    <span className="ml-2 font-medium">{getUserNickname(editingAd)}</span>
                  </p>
                  <p>
                    <span className="text-gray-600">Email:</span>
                    <span className="ml-2 font-medium">{editingAd.user.email}</span>
                  </p>
                  <p>
                    <span className="text-gray-600">Data creazione:</span>
                    <span className="ml-2 font-medium">{new Date(editingAd.created_at).toLocaleDateString('it-IT')}</span>
                  </p>
                  <p>
                    <span className="text-gray-600">Scadenza:</span>
                    <span className="ml-2 font-medium">{new Date(editingAd.expires_at).toLocaleDateString('it-IT')}</span>
                  </p>
                </div>
              </div>

              {/* Tipo Annuncio */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tipo Annuncio *
                </label>
                <select
                  value={editForm.ad_type || ''}
                  onChange={(e) => setEditForm({ ...editForm, ad_type: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                >
                  <option value="sell">Vendo</option>
                  <option value="buy">Cerco</option>
                  <option value="gift">Regalo</option>
                  <option value="exchange">Scambio</option>
                </select>
              </div>

              {/* Titolo */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Titolo *
                </label>
                <input
                  type="text"
                  value={editForm.title || ''}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  maxLength={100}
                />
              </div>

              {/* Descrizione */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Descrizione *
                </label>
                <textarea
                  value={editForm.description || ''}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  rows={6}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
                />
              </div>

              {/* Categoria e Prezzo */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Categoria *
                  </label>
                  <input
                    type="text"
                    value={editForm.category || ''}
                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Prezzo (€)
                  </label>
                  <input
                    type="number"
                    value={editForm.price || ''}
                    onChange={(e) => setEditForm({ ...editForm, price: e.target.value ? Number(e.target.value) : null })}
                    min="0"
                    step="0.01"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Località */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Città *
                  </label>
                  <input
                    type="text"
                    value={editForm.city || ''}
                    onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Provincia *
                  </label>
                  <input
                    type="text"
                    value={editForm.province || ''}
                    onChange={(e) => setEditForm({ ...editForm, province: e.target.value })}
                    maxLength={2}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-amber-500 focus:border-transparent uppercase"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Regione
                  </label>
                  <input
                    type="text"
                    value={editForm.region || ''}
                    onChange={(e) => setEditForm({ ...editForm, region: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Stato */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Stato Annuncio *
                </label>
                <select
                  value={editForm.status || ''}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                >
                  <option value="active">Attivo</option>
                  <option value="sold">Venduto</option>
                  <option value="expired">Scaduto</option>
                  <option value="deleted">Eliminato</option>
                </select>
              </div>

              {/* Immagini (sola lettura) */}
              {editingAd.images && editingAd.images.length > 0 && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Immagini (sola lettura)
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {editingAd.images.map((image, index) => (
                      <img
                        key={index}
                        src={image}
                        alt={`Immagine ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t border-gray-200">
              <button
                onClick={cancelEditAd}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
              >
                Annulla
              </button>
              <button
                onClick={saveAdEdit}
                disabled={!editForm.title || !editForm.description || !editForm.category || !editForm.city}
                className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium flex items-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                Salva Modifiche
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
