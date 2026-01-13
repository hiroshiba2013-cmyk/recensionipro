import { useState, useEffect } from 'react';
import { Plus, X, Award } from 'lucide-react';
import { supabase, BusinessCategory } from '../../lib/supabase';
import { CITIES_BY_PROVINCE, PROVINCE_TO_CODE, PROVINCES_BY_REGION } from '../../lib/cities';

interface AddUnclaimedBusinessFormProps {
  customerId: string;
  onSuccess: () => void;
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

export function AddUnclaimedBusinessForm({ customerId, onSuccess }: AddUnclaimedBusinessFormProps) {
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<BusinessCategory[]>([]);
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
  }, []);

  const loadCategories = async () => {
    const { data } = await supabase
      .from('business_categories')
      .select('*')
      .order('name');

    if (data) {
      setCategories(data);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
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
        })
        .select()
        .single();

      if (businessError) throw businessError;

      await supabase.rpc('award_points', {
        p_user_id: customerId,
        p_points: 20,
        p_activity_type: 'business_submission',
        p_description: `Aggiunta attività: ${formData.name}`
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
      alert('Attività aggiunta con successo! Hai guadagnato 20 punti!');
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

  return (
    <div className="bg-white rounded-xl shadow-md p-8 mb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Plus className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">Aggiungi Attività</h2>
          </div>
          <p className="text-gray-600">
            Aggiungi un'attività che conosci e guadagna <span className="font-bold text-blue-600">20 punti</span> per la classifica!
          </p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow-md"
          >
            <Plus className="w-5 h-5" />
            Aggiungi
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gradient-to-br from-blue-50 to-white rounded-lg p-6 border-2 border-blue-200">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 text-blue-600">
              <Award className="w-5 h-5" />
              <span className="font-semibold">Guadagna 20 punti!</span>
            </div>
            <button
              type="button"
              onClick={() => setShowForm(false)}
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

          <div className="bg-blue-100 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-blue-800">
              <strong>Nota:</strong> L'attività verrà aggiunta al database e potrà essere rivendicata dal proprietario in futuro. Riceverai 20 punti per questo contributo!
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Invio in corso...' : 'Aggiungi Attività e Guadagna 20 Punti'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-6 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
            >
              Annulla
            </button>
          </div>
        </form>
      )}

      {!showForm && (
        <div className="bg-gradient-to-r from-blue-50 to-white border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-3">Come funziona?</h3>
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">1.</span>
              <span>Inserisci i dati di un'attività che conosci (nome, indirizzo, sito web)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">2.</span>
              <span>L'attività viene aggiunta al nostro database</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">3.</span>
              <span>Guadagni <strong>20 punti</strong> per la classifica premi!</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">4.</span>
              <span>Il proprietario dell'attività potrà rivendicarla in futuro</span>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
