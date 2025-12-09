import { useState, useEffect } from 'react';
import { MapPin, Edit, Save, X, Plus, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { SearchableSelect } from '../common/SearchableSelect';
import { CITIES_BY_PROVINCE } from '../../lib/cities';

const italianCities = Object.entries(CITIES_BY_PROVINCE).flatMap(([province, cities]) =>
  cities.map(city => ({ city, province }))
);

interface BusinessLocation {
  id: string;
  name: string;
  address: string;
  city: string;
  province: string;
  postal_code: string;
  phone: string;
  is_primary: boolean;
}

interface EditBusinessLocationsFormProps {
  businessId: string;
  onUpdate: () => void;
}

export function EditBusinessLocationsForm({ businessId, onUpdate }: EditBusinessLocationsFormProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [locations, setLocations] = useState<BusinessLocation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLocations();
  }, [businessId]);

  const loadLocations = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('business_locations')
      .select('*')
      .eq('business_id', businessId)
      .order('is_primary', { ascending: false });

    if (data) {
      setLocations(data);
    }
    setLoading(false);
  };

  const handleAddLocation = () => {
    setLocations([
      ...locations,
      {
        id: `new-${Date.now()}`,
        name: '',
        address: '',
        city: '',
        province: '',
        postal_code: '',
        phone: '',
        is_primary: locations.length === 0,
      },
    ]);
  };

  const handleRemoveLocation = async (id: string) => {
    const location = locations.find(l => l.id === id);

    if (location?.is_primary && locations.length > 1) {
      alert('Non puoi rimuovere la sede principale. Imposta prima un\'altra sede come principale.');
      return;
    }

    if (id.startsWith('new-')) {
      setLocations(locations.filter(l => l.id !== id));
    } else {
      if (!confirm('Sei sicuro di voler rimuovere questa sede?')) return;

      const { error } = await supabase
        .from('business_locations')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting location:', error);
        alert('Errore durante l\'eliminazione');
      } else {
        setLocations(locations.filter(l => l.id !== id));
        onUpdate();
      }
    }
  };

  const handleChange = (id: string, field: keyof BusinessLocation, value: string | boolean) => {
    if (field === 'is_primary' && value === true) {
      setLocations(locations.map(location => ({
        ...location,
        is_primary: location.id === id,
      })));
    } else if (field === 'city') {
      const selectedCity = italianCities.find(c => c.city === value);
      setLocations(locations.map(location =>
        location.id === id
          ? {
              ...location,
              city: value,
              province: selectedCity?.province || location.province,
            }
          : location
      ));
    } else {
      setLocations(locations.map(location =>
        location.id === id ? { ...location, [field]: value } : location
      ));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      for (const location of locations) {
        if (location.id.startsWith('new-')) {
          const { error } = await supabase
            .from('business_locations')
            .insert({
              business_id: businessId,
              name: location.name,
              address: location.address,
              city: location.city,
              province: location.province,
              postal_code: location.postal_code,
              phone: location.phone,
              is_primary: location.is_primary,
            });

          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('business_locations')
            .update({
              name: location.name,
              address: location.address,
              city: location.city,
              province: location.province,
              postal_code: location.postal_code,
              phone: location.phone,
              is_primary: location.is_primary,
            })
            .eq('id', location.id);

          if (error) throw error;
        }
      }

      setIsEditing(false);
      await loadLocations();
      onUpdate();
    } catch (error) {
      console.error('Error updating locations:', error);
      alert('Errore durante il salvataggio');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    loadLocations();
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-md p-8 mb-8">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!isEditing) {
    return (
      <div className="bg-white rounded-xl shadow-md p-8 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <MapPin className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">Punti Vendita</h2>
          </div>
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Edit className="w-4 h-4" />
            Modifica
          </button>
        </div>

        {locations.length === 0 ? (
          <p className="text-gray-600 text-center py-8">Nessun punto vendita aggiunto</p>
        ) : (
          <div className="space-y-6">
            {locations.map((location, index) => (
              <div key={location.id} className={`border rounded-lg p-6 ${
                location.is_primary ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-gray-50'
              }`}>
                <div className="flex items-start justify-between mb-4">
                  <h3 className="font-bold text-lg text-gray-900">{location.name}</h3>
                  {location.is_primary && (
                    <span className="bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                      PRINCIPALE
                    </span>
                  )}
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Indirizzo</p>
                    <p className="text-lg font-semibold text-gray-900">{location.address}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Città</p>
                    <p className="text-lg font-semibold text-gray-900">{location.city} ({location.province})</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">CAP</p>
                    <p className="text-lg font-semibold text-gray-900">{location.postal_code}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Telefono</p>
                    <p className="text-lg font-semibold text-gray-900">{location.phone}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-8 mb-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <MapPin className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Modifica Punti Vendita</h2>
        </div>
        <button
          onClick={handleCancel}
          className="text-gray-600 hover:text-gray-800"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6 mb-6">
          {locations.map((location, index) => (
            <div key={location.id} className={`border-2 rounded-lg p-6 ${
              location.is_primary ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-gray-50'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <h3 className="font-bold text-lg text-gray-900">Sede {index + 1}</h3>
                  {location.is_primary && (
                    <span className="bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                      PRINCIPALE
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveLocation(location.id)}
                  className="text-red-600 hover:text-red-700 flex items-center gap-1"
                >
                  <Trash2 className="w-4 h-4" />
                  Rimuovi
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nome Sede
                  </label>
                  <input
                    type="text"
                    value={location.name}
                    onChange={(e) => handleChange(location.id, 'name', e.target.value)}
                    required
                    placeholder="Es. Sede Centrale, Negozio Centro..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Indirizzo
                  </label>
                  <input
                    type="text"
                    value={location.address}
                    onChange={(e) => handleChange(location.id, 'address', e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Città
                  </label>
                  <SearchableSelect
                    value={location.city}
                    onChange={(value) => handleChange(location.id, 'city', value)}
                    options={italianCities.map(city => ({
                      value: city.city,
                      label: `${city.city} (${city.province})`,
                    }))}
                    placeholder="Seleziona città"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    CAP
                  </label>
                  <input
                    type="text"
                    value={location.postal_code}
                    onChange={(e) => handleChange(location.id, 'postal_code', e.target.value)}
                    required
                    maxLength={5}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Telefono
                  </label>
                  <input
                    type="tel"
                    value={location.phone}
                    onChange={(e) => handleChange(location.id, 'phone', e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="flex items-center">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={location.is_primary}
                      onChange={(e) => handleChange(location.id, 'is_primary', e.target.checked)}
                      className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm font-semibold text-gray-700">
                      Sede Principale
                    </span>
                  </label>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={handleAddLocation}
          className="flex items-center gap-2 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors font-semibold mb-6 w-full"
        >
          <Plus className="w-5 h-5" />
          Aggiungi Sede
        </button>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Salvataggio...' : 'Salva Modifiche'}
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
          >
            Annulla
          </button>
        </div>
      </form>
    </div>
  );
}
