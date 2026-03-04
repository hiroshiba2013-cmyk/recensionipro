import { useState, useEffect } from 'react';
import { Plus, X, Award, MapPin, Phone, Mail, Globe, User, FileEdit as Edit2, Trash2, CheckCircle } from 'lucide-react';
import { supabase, BusinessCategory } from '../../lib/supabase';
import { CITIES_BY_PROVINCE, PROVINCE_TO_CODE, PROVINCES_BY_REGION } from '../../lib/cities';

interface AddUnclaimedBusinessFormProps {
  customerId: string;
  activeFamilyMemberId?: string | null;
  onSuccess: () => void;
}

interface UserAddedBusiness {
  id: string;
  name: string;
  category: string | null;
  street: string | null;
  city: string;
  province: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  created_at: string;
  source: 'unclaimed' | 'user_added';
}

const ALL_CITIES = Object.entries(CITIES_BY_PROVINCE).flatMap(([province, cities]) =>
  cities.map(city => ({
    name: city,
    province: province,
    region: Object.entries(PROVINCES_BY_REGION).find(([_, provinces]) =>
      provinces.includes(province)
    )?.[0] || ''
  }))
).sort((a, b) => a.name.localeCompare(b.name));

export function AddUnclaimedBusinessForm({ customerId, activeFamilyMemberId, onSuccess }: AddUnclaimedBusinessFormProps) {
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<BusinessCategory[]>([]);
  const [userAddedBusinesses, setUserAddedBusinesses] = useState<UserAddedBusiness[]>([]);
  const [loadingBusinesses, setLoadingBusinesses] = useState(true);
  const [editingBusinessId, setEditingBusinessId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    category_id: '',
    street: '',
    city: '',
    province: '',
    region: '',
    postal_code: '',
    website: '',
    email: '',
    phone: '',
  });

  useEffect(() => {
    loadCategories();
    loadUserAddedBusinesses();
  }, [customerId, activeFamilyMemberId]);

  const loadCategories = async () => {
    const { data } = await supabase
      .from('business_categories')
      .select('*')
      .order('name');

    if (data) {
      setCategories(data);
    }
  };

  const loadUserAddedBusinesses = async () => {
    try {
      setLoadingBusinesses(true);
      const allBusinesses: UserAddedBusiness[] = [];

      // Carica da unclaimed_business_locations in base al profilo attivo
      const unclaimedQuery = supabase
        .from('unclaimed_business_locations')
        .select(`
          id,
          name,
          street,
          city,
          province,
          phone,
          email,
          website,
          created_at,
          business_categories(name)
        `)
        .eq('added_by', customerId);

      // Se c'è un family member attivo, filtra per quello, altrimenti prendi solo quelli senza family member
      if (activeFamilyMemberId) {
        unclaimedQuery.eq('added_by_family_member_id', activeFamilyMemberId);
      } else {
        unclaimedQuery.is('added_by_family_member_id', null);
      }

      const { data: unclaimedData } = await unclaimedQuery.order('created_at', { ascending: false });

      if (unclaimedData) {
        unclaimedData.forEach((business: any) => {
          allBusinesses.push({
            id: business.id,
            name: business.name,
            category: business.business_categories?.name || null,
            street: business.street,
            city: business.city,
            province: business.province,
            phone: business.phone,
            email: business.email,
            website: business.website,
            created_at: business.created_at,
            source: 'unclaimed',
          });
        });
      }

      // Carica anche da user_added_businesses (vecchia tabella)
      const { data: userAddedData } = await supabase
        .from('user_added_businesses')
        .select(`
          id,
          name,
          street,
          city,
          province,
          phone,
          email,
          website,
          created_at,
          business_categories(name)
        `)
        .eq('added_by', customerId)
        .order('created_at', { ascending: false });

      if (userAddedData) {
        userAddedData.forEach((business: any) => {
          allBusinesses.push({
            id: business.id,
            name: business.name,
            category: business.business_categories?.name || null,
            street: business.street,
            city: business.city,
            province: business.province,
            phone: business.phone,
            email: business.email,
            website: business.website,
            created_at: business.created_at,
            source: 'user_added',
          });
        });
      }

      allBusinesses.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setUserAddedBusinesses(allBusinesses);
    } catch (error) {
      console.error('Error loading user added businesses:', error);
    } finally {
      setLoadingBusinesses(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Verifica se esiste già un'attività con lo stesso nome e indirizzo
      const { data: existingBusiness } = await supabase
        .from('unclaimed_business_locations')
        .select('id, name')
        .ilike('name', formData.name)
        .ilike('street', formData.street)
        .eq('city', formData.city)
        .maybeSingle();

      if (existingBusiness) {
        alert(`L'attività "${existingBusiness.name}" è già presente nel database!`);
        setLoading(false);
        return;
      }

      // Verifica anche se esiste in business_locations (già rivendicata)
      const { data: claimedBusiness } = await supabase
        .from('business_locations')
        .select('id, name')
        .ilike('name', formData.name)
        .ilike('address', formData.street)
        .eq('city', formData.city)
        .maybeSingle();

      if (claimedBusiness) {
        alert(`L'attività "${claimedBusiness.name}" è già stata rivendicata ed è presente nel sistema!`);
        setLoading(false);
        return;
      }

      const { data: business, error: businessError } = await supabase
        .from('unclaimed_business_locations')
        .insert({
          name: formData.name,
          category_id: formData.category_id || null,
          street: formData.street,
          city: formData.city,
          province: formData.province,
          region: formData.region,
          postal_code: formData.postal_code,
          website: formData.website,
          email: formData.email || null,
          phone: formData.phone || null,
          country: 'Italia',
          added_by: customerId,
          added_by_family_member_id: activeFamilyMemberId || null,
        })
        .select()
        .single();

      if (businessError) throw businessError;

      // Calcola i punti in base ai campi compilati
      const hasEmail = formData.email && formData.email.trim() !== '';
      const hasPhone = formData.phone && formData.phone.trim() !== '';
      const hasExtraInfo = hasEmail || hasPhone;
      const points = hasExtraInfo ? 25 : 10;

      await supabase.rpc('award_points', {
        p_user_id: customerId,
        p_points: points,
        p_activity_type: 'business_submission',
        p_description: `Aggiunta attività: ${formData.name}${isComplete ? ' (completa)' : ''}`
      });

      setFormData({
        name: '',
        category_id: '',
        street: '',
        city: '',
        province: '',
        region: '',
        postal_code: '',
        website: '',
        email: '',
        phone: '',
      });
      setShowForm(false);

      // Mostra messaggio di successo
      const message = `Attività "${formData.name}" aggiunta con successo! Hai guadagnato ${points} punti!${hasExtraInfo ? ' (Con informazioni extra)' : ''}`;
      setSuccessMessage(message);

      // Nascondi il messaggio dopo 5 secondi
      setTimeout(() => {
        setSuccessMessage('');
      }, 5000);

      loadUserAddedBusinesses();
      onSuccess();
    } catch (error) {
      console.error('Error adding business:', error);
      alert('Errore durante l\'aggiunta dell\'attività');
    } finally {
      setLoading(false);
    }
  };

  const handleCityChange = (cityName: string) => {
    const city = ALL_CITIES.find(c => c.name === cityName);
    if (city) {
      const provinceCode = PROVINCE_TO_CODE[city.province] || city.province;
      setFormData({
        ...formData,
        city: city.name,
        province: provinceCode,
        region: city.region,
      });
    }
  };

  const handleEdit = (business: UserAddedBusiness) => {
    const category = categories.find(c => c.name === business.category);
    setFormData({
      name: business.name,
      category_id: category?.id || '',
      street: business.street || '',
      city: business.city,
      province: business.province || '',
      region: '',
      postal_code: '',
      website: business.website || '',
      email: business.email || '',
      phone: business.phone || '',
    });
    setEditingBusinessId(business.id);
    setShowForm(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBusinessId) return;

    setLoading(true);

    try {
      const { error: updateError } = await supabase
        .from('unclaimed_business_locations')
        .update({
          name: formData.name,
          category_id: formData.category_id || null,
          street: formData.street,
          city: formData.city,
          province: formData.province,
          region: formData.region,
          postal_code: formData.postal_code,
          website: formData.website,
          email: formData.email || null,
          phone: formData.phone || null,
        })
        .eq('id', editingBusinessId);

      if (updateError) throw updateError;

      const businessName = formData.name;

      setFormData({
        name: '',
        category_id: '',
        street: '',
        city: '',
        province: '',
        region: '',
        postal_code: '',
        website: '',
        email: '',
        phone: '',
      });
      setShowForm(false);
      setEditingBusinessId(null);

      // Mostra messaggio di successo
      const message = `Attività "${businessName}" aggiornata con successo!`;
      setSuccessMessage(message);

      // Nascondi il messaggio dopo 5 secondi
      setTimeout(() => {
        setSuccessMessage('');
      }, 5000);

      loadUserAddedBusinesses();
      onSuccess();
    } catch (error) {
      console.error('Error updating business:', error);
      alert('Errore durante l\'aggiornamento dell\'attività');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (businessId: string, businessName: string) => {
    if (!confirm(`Sei sicuro di voler eliminare "${businessName}"?`)) {
      return;
    }

    try {
      // Elimina l'attività (i punti vengono sottratti automaticamente dal trigger del database)
      const { error: deleteError } = await supabase
        .from('unclaimed_business_locations')
        .delete()
        .eq('id', businessId);

      if (deleteError) throw deleteError;

      // Mostra messaggio di successo
      const message = `Attività "${businessName}" eliminata con successo! I punti sono stati sottratti dalla classifica.`;
      setSuccessMessage(message);

      // Nascondi il messaggio dopo 5 secondi
      setTimeout(() => {
        setSuccessMessage('');
      }, 5000);

      loadUserAddedBusinesses();
      onSuccess();
    } catch (error) {
      console.error('Error deleting business:', error);
      alert('Errore durante l\'eliminazione dell\'attività');
    }
  };

  const handleCancelEdit = () => {
    setFormData({
      name: '',
      category_id: '',
      street: '',
      city: '',
      province: '',
      region: '',
      postal_code: '',
      website: '',
      email: '',
      phone: '',
    });
    setShowForm(false);
    setEditingBusinessId(null);
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-gray-100 overflow-hidden relative">
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400"></div>

      {successMessage && (
        <div className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-5 flex items-start gap-3 shadow-md animate-fade-in">
          <CheckCircle className="w-7 h-7 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-green-900 text-lg">{successMessage}</p>
          </div>
          <button
            onClick={() => setSuccessMessage('')}
            className="ml-auto text-green-600 hover:text-green-800 text-2xl font-bold"
          >
            ×
          </button>
        </div>
      )}

      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="bg-gradient-to-br from-green-400 to-emerald-500 p-4 rounded-2xl shadow-lg">
            <MapPin className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              Attività Aggiunte
            </h2>
            <p className="text-gray-600 mt-1 font-medium">
              Guadagna <span className="font-bold text-orange-600">10 punti</span> o <span className="font-bold text-green-600">25 punti</span> con info extra!
            </p>
          </div>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-8 py-4 rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all font-bold shadow-xl transform hover:scale-105 hover:shadow-2xl"
          >
            <Plus className="w-5 h-5" />
            Aggiungi Attività
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={editingBusinessId ? handleUpdate : handleSubmit} className="bg-gradient-to-br from-blue-50 to-white rounded-lg p-6 border-2 border-blue-200">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 text-blue-600">
              {editingBusinessId ? (
                <>
                  <Edit2 className="w-5 h-5" />
                  <span className="font-semibold">Modifica Attività</span>
                </>
              ) : (
                <>
                  <Award className="w-5 h-5" />
                  <span className="font-semibold">Guadagna 10-25 punti!</span>
                </>
              )}
            </div>
            <button
              type="button"
              onClick={handleCancelEdit}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nome Attività *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="Es: Ristorante Da Mario"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Categoria *
              </label>
              <select
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Seleziona categoria</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Indirizzo *
              </label>
              <input
                type="text"
                value={formData.street}
                onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                required
                placeholder="Es: Via Roma 123"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Città *
              </label>
              <select
                value={formData.city}
                onChange={(e) => handleCityChange(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Seleziona città</option>
                {ALL_CITIES.map((city) => (
                  <option key={city.name} value={city.name}>
                    {city.name} ({city.province})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                CAP
              </label>
              <input
                type="text"
                value={formData.postal_code}
                onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                placeholder="Es: 00100"
                maxLength={5}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Sito Web (opzionale)
              </label>
              <input
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="https://www.esempio.it"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email (opzionale)
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="info@esempio.it"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Telefono (opzionale)
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+39 123 456 7890"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {!editingBusinessId && (
            <div className="bg-gradient-to-r from-blue-50 to-green-50 border-2 border-blue-300 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3">
                <Award className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-800 font-semibold mb-2">
                    Sistema di Punteggio:
                  </p>
                  <ul className="space-y-1 text-sm text-gray-700">
                    <li className="flex items-center gap-2">
                      <span className="text-orange-600 font-bold">•</span>
                      <span><strong>10 punti</strong> - Inserimento base (nome, categoria, indirizzo)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-600 font-bold">•</span>
                      <span><strong>25 punti</strong> - Con informazioni extra (+ email o telefono)</span>
                    </li>
                  </ul>
                  <p className="text-xs text-gray-600 mt-3">
                    L'attività verrà aggiunta al database e potrà essere rivendicata dal proprietario in futuro.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading
                ? (editingBusinessId ? 'Aggiornamento...' : 'Invio in corso...')
                : (editingBusinessId ? 'Aggiorna Attività' : 'Aggiungi Attività e Guadagna Punti')
              }
            </button>
            <button
              type="button"
              onClick={handleCancelEdit}
              className="px-6 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
            >
              Annulla
            </button>
          </div>
        </form>
      )}

      {!showForm && (
        <div className="bg-gradient-to-r from-blue-50 to-white border border-blue-200 rounded-lg p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-3">Come funziona?</h3>
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">1.</span>
              <span>Inserisci i dati di un'attività che conosci (nome, categoria e indirizzo sono obbligatori)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">2.</span>
              <span>L'attività viene aggiunta al nostro database</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-600 font-bold">3.</span>
              <span>Guadagni <strong>10 punti</strong> (inserimento base) o <strong>25 punti</strong> (se aggiungi anche email o telefono)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">4.</span>
              <span>Il proprietario dell'attività potrà rivendicarla in futuro</span>
            </li>
          </ul>
        </div>
      )}

      {!showForm && (
        <div className="mt-8">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-gray-100">
            <div className="bg-gradient-to-br from-green-100 to-emerald-100 p-2 rounded-lg">
              <User className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">
              Le Tue Attività Aggiunte
            </h3>
            {userAddedBusinesses.length > 0 && (
              <span className="bg-gradient-to-r from-green-500 to-emerald-500 text-white text-base font-bold px-4 py-2 rounded-full shadow-md">
                {userAddedBusinesses.length}
              </span>
            )}
          </div>

          {loadingBusinesses ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
              <p className="text-gray-500 mt-4 font-medium">Caricamento attività...</p>
            </div>
          ) : userAddedBusinesses.length === 0 ? (
            <div className="bg-gradient-to-br from-gray-50 to-white border-2 border-dashed border-gray-200 rounded-2xl p-12 text-center">
              <User className="w-20 h-20 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-700 text-lg font-semibold mb-2">
                Non hai ancora aggiunto nessuna attività
              </p>
              <p className="text-gray-500">
                Quando aggiungi un'attività, apparirà qui!
              </p>
            </div>
          ) : (
            <div className="grid gap-5">
              {userAddedBusinesses.map((business) => (
                <div
                  key={business.id}
                  className="bg-white border-2 border-green-200 rounded-2xl p-6 hover:shadow-xl hover:border-green-300 transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-bold text-gray-900 text-xl">
                          {business.name}
                        </h4>
                        <span className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1 shadow-sm">
                          <User className="w-3 h-3" />
                          Da te
                        </span>
                      </div>
                      {business.category && (
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <p className="text-sm text-gray-700 font-medium">
                            {business.category}
                          </p>
                        </div>
                      )}
                    </div>
                    {business.source === 'unclaimed' && (
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => handleEdit(business)}
                          className="p-3 text-blue-600 hover:bg-blue-50 rounded-xl transition-all shadow-sm hover:shadow-md"
                          title="Modifica attività"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(business.id, business.name)}
                          className="p-3 text-red-600 hover:bg-red-50 rounded-xl transition-all shadow-sm hover:shadow-md"
                          title="Elimina attività"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    {business.street && (
                      <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                        <MapPin className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700 font-medium">
                          {business.street}
                          {business.city && `, ${business.city}`}
                          {business.province && ` (${business.province})`}
                        </span>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-3">
                      {business.phone && (
                        <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg text-gray-700 font-medium">
                          <Phone className="w-4 h-4 text-blue-500" />
                          <span>{business.phone}</span>
                        </div>
                      )}
                      {business.email && (
                        <div className="flex items-center gap-2 px-3 py-2 bg-orange-50 rounded-lg text-gray-700 font-medium">
                          <Mail className="w-4 h-4 text-orange-500" />
                          <span>{business.email}</span>
                        </div>
                      )}
                      {business.website && (
                        <a
                          href={business.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-3 py-2 bg-green-50 rounded-lg text-green-700 hover:bg-green-100 font-medium transition-colors"
                        >
                          <Globe className="w-4 h-4" />
                          <span>Visita sito</span>
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-xs text-gray-500 font-medium">
                      Aggiunta il {new Date(business.created_at).toLocaleDateString('it-IT', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
