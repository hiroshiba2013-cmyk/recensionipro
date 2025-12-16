import { useState } from 'react';
import { Building, X, Save } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { SearchableSelect } from '../common/SearchableSelect';
import { CITIES_BY_PROVINCE } from '../../lib/cities';

const italianCities = Object.entries(CITIES_BY_PROVINCE).flatMap(([province, cities]) =>
  cities.map(city => ({ city, province }))
);

const businessCategories = [
  'Ristorante',
  'Bar/Caffetteria',
  'Hotel/B&B',
  'Negozio',
  'Parrucchiere/Barbiere',
  'Centro Estetico',
  'Palestra',
  'Supermercato',
  'Farmacia',
  'Officina',
  'Lavanderia',
  'Altro'
];

interface CreateBusinessFormProps {
  ownerId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function CreateBusinessForm({ ownerId, onSuccess, onCancel }: CreateBusinessFormProps) {
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    city: '',
    province: '',
    address: '',
    postal_code: '',
    phone: '',
    email: '',
    website: '',
    vat_number: '',
    ateco_code: '',
    description: '',
  });

  const handleCityChange = (city: string) => {
    const selectedCity = italianCities.find(c => c.city === city);
    setFormData({
      ...formData,
      city,
      province: selectedCity?.province || '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { error } = await supabase
        .from('businesses')
        .insert({
          owner_id: ownerId,
          name: formData.name,
          category: formData.category,
          city: formData.city,
          province: formData.province,
          address: formData.address,
          postal_code: formData.postal_code,
          phone: formData.phone,
          email: formData.email,
          website: formData.website || null,
          vat_number: formData.vat_number,
          ateco_code: formData.ateco_code || null,
          description: formData.description || null,
          verified: false,
        });

      if (error) throw error;

      onSuccess();
    } catch (error) {
      console.error('Error creating business:', error);
      alert('Errore durante la creazione dell\'attività');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Building className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Registra Nuova Attività</h2>
        </div>
        <button
          onClick={onCancel}
          className="text-gray-600 hover:text-gray-800"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Nome Attività *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            placeholder="Es. Ristorante Da Mario"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Categoria *
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Seleziona categoria</option>
              {businessCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Partita IVA *
            </label>
            <input
              type="text"
              value={formData.vat_number}
              onChange={(e) => setFormData({ ...formData, vat_number: e.target.value })}
              required
              maxLength={11}
              placeholder="Es. 12345678901"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Città *
            </label>
            <SearchableSelect
              value={formData.city}
              onChange={handleCityChange}
              options={italianCities.map(city => ({
                value: city.city,
                label: `${city.city} (${city.province})`,
              }))}
              placeholder="Seleziona città"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              CAP *
            </label>
            <input
              type="text"
              value={formData.postal_code}
              onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
              required
              maxLength={5}
              placeholder="Es. 00100"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Indirizzo Sede Legale *
          </label>
          <input
            type="text"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            required
            placeholder="Via, numero civico"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Telefono *
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
              placeholder="Es. +39 06 1234567"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Email *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              placeholder="Es. info@attivita.it"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
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
              Codice ATECO (opzionale)
            </label>
            <input
              type="text"
              value={formData.ateco_code}
              onChange={(e) => setFormData({ ...formData, ateco_code: e.target.value })}
              placeholder="Es. 56.10.11"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Descrizione (opzionale)
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={4}
            placeholder="Descrivi brevemente la tua attività..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Salvataggio...' : 'Registra Attività'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
          >
            Annulla
          </button>
        </div>
      </form>
    </div>
  );
}
