import { useState } from 'react';
import { Building, X, Save, Search, PlusCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { SearchableSelect } from '../common/SearchableSelect';
import { CITIES_BY_PROVINCE } from '../../lib/cities';
import { ClaimBusinessLocationsForm } from './ClaimBusinessLocationsForm';

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

interface UnclaimedLocation {
  id: string;
  name: string;
  street: string;
  city: string;
  province: string;
  region: string;
  postal_code: string;
  phone: string;
  email: string;
  website: string;
  category_id: string;
}

interface CreateBusinessFormProps {
  ownerId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function CreateBusinessForm({ ownerId, onSuccess, onCancel }: CreateBusinessFormProps) {
  const [step, setStep] = useState<'choice' | 'claim' | 'form'>('choice');
  const [claimedLocations, setClaimedLocations] = useState<UnclaimedLocation[]>([]);
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

  const handleLocationsSelected = (locations: UnclaimedLocation[]) => {
    setClaimedLocations(locations);

    if (locations.length > 0) {
      const firstLocation = locations[0];
      setFormData({
        name: firstLocation.name,
        category: '',
        city: firstLocation.city,
        province: firstLocation.province,
        address: firstLocation.street,
        postal_code: firstLocation.postal_code || '',
        phone: firstLocation.phone || '',
        email: firstLocation.email || '',
        website: firstLocation.website || '',
        vat_number: '',
        ateco_code: '',
        description: '',
      });
    }

    setStep('form');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { data: business, error: businessError } = await supabase
        .from('businesses')
        .insert({
          owner_id: ownerId,
          name: formData.name,
          category_id: claimedLocations[0]?.category_id || null,
          city: formData.city,
          province: formData.province,
          address: formData.address,
          phone: formData.phone,
          email: formData.email,
          website: formData.website || null,
          vat_number: formData.vat_number,
          ateco_code: formData.ateco_code || null,
          description: formData.description || null,
          verified: false,
          is_claimed: claimedLocations.length > 0,
        })
        .select()
        .single();

      if (businessError) throw businessError;

      if (claimedLocations.length > 0) {
        const locationInserts = claimedLocations.map(location => ({
          business_id: business.id,
          name: location.name,
          address: location.street,
          city: location.city,
          province: location.province,
          region: location.region,
          postal_code: location.postal_code,
          phone: location.phone,
          email: location.email,
          website: location.website,
          country: 'Italia',
          is_primary: claimedLocations[0].id === location.id,
        }));

        const { error: locationsError } = await supabase
          .from('business_locations')
          .insert(locationInserts);

        if (locationsError) throw locationsError;

        const locationIds = claimedLocations.map(l => l.id);
        const { error: claimError } = await supabase
          .from('unclaimed_business_locations')
          .update({
            is_claimed: true,
            claimed_by: ownerId,
            claimed_at: new Date().toISOString(),
          })
          .in('id', locationIds);

        if (claimError) throw claimError;
      }

      onSuccess();
    } catch (error) {
      console.error('Error creating business:', error);
      alert('Errore durante la creazione dell\'attività');
    } finally {
      setSaving(false);
    }
  };

  if (step === 'claim') {
    return (
      <ClaimBusinessLocationsForm
        onLocationsSelected={handleLocationsSelected}
        onCancel={() => setStep('choice')}
      />
    );
  }

  if (step === 'choice') {
    return (
      <div className="bg-white rounded-xl shadow-md p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Building className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">Registra la tua Attività</h2>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-600 hover:text-gray-800"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <p className="text-gray-600 mb-6">
          Scegli come vuoi procedere con la registrazione della tua attività:
        </p>

        <div className="grid md:grid-cols-2 gap-4">
          <button
            onClick={() => setStep('claim')}
            className="group bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 border-2 border-blue-300 rounded-xl p-6 text-left transition-all"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-blue-600 text-white p-3 rounded-lg group-hover:scale-110 transition-transform">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                Rivendica Sedi Esistenti
              </h3>
            </div>
            <p className="text-gray-700 mb-4">
              La tua attività è già presente nel database? Cercala e rivendicala. Puoi selezionare più sedi se ne hai diverse.
            </p>
            <div className="flex items-center gap-2 text-blue-600 font-semibold">
              <span>Cerca e rivendica</span>
              <Search className="w-4 h-4" />
            </div>
          </button>

          <button
            onClick={() => setStep('form')}
            className="group bg-gradient-to-br from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 border-2 border-green-300 rounded-xl p-6 text-left transition-all"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-green-600 text-white p-3 rounded-lg group-hover:scale-110 transition-transform">
                <PlusCircle className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                Crea Nuova Attività
              </h3>
            </div>
            <p className="text-gray-700 mb-4">
              La tua attività non è ancora nel database? Inserisci manualmente tutti i dati della tua attività.
            </p>
            <div className="flex items-center gap-2 text-green-600 font-semibold">
              <span>Crea da zero</span>
              <PlusCircle className="w-4 h-4" />
            </div>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Building className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">
            {claimedLocations.length > 0 ? 'Completa i Dati dell\'Attività' : 'Registra Nuova Attività'}
          </h2>
        </div>
        <button
          onClick={onCancel}
          className="text-gray-600 hover:text-gray-800"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {claimedLocations.length > 0 && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="font-semibold text-green-900 mb-2">
            Sedi selezionate ({claimedLocations.length})
          </h3>
          <ul className="space-y-1 text-sm text-green-800">
            {claimedLocations.map((location, index) => (
              <li key={location.id}>
                {index + 1}. {location.name} - {location.city} ({location.province})
              </li>
            ))}
          </ul>
        </div>
      )}

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
