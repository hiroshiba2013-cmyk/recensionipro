import { useState, useEffect } from 'react';
import { MapPin, Edit, Save, X, Plus, Trash2, Building2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { SearchableSelect } from '../common/SearchableSelect';
import { CITIES_BY_PROVINCE, PROVINCE_TO_CODE } from '../../lib/cities';
import { BusinessLocationAvatarUpload } from './BusinessLocationAvatarUpload';

const italianCities = Object.entries(CITIES_BY_PROVINCE).flatMap(([province, cities]) =>
  cities.map(city => ({ city, province }))
);

interface DayHours {
  open: string;
  close: string;
  closed: boolean;
}

interface BusinessHours {
  monday: DayHours;
  tuesday: DayHours;
  wednesday: DayHours;
  thursday: DayHours;
  friday: DayHours;
  saturday: DayHours;
  sunday: DayHours;
}

interface BusinessLocation {
  id: string;
  name: string | null;
  internal_name: string | null;
  address: string | null;
  city: string | null;
  province: string | null;
  postal_code: string | null;
  phone: string | null;
  email: string | null;
  avatar_url: string | null;
  business_hours: BusinessHours | null;
  is_primary: boolean;
  description?: string | null;
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
  const [maxLocations, setMaxLocations] = useState<number>(1);
  const [subscriptionPlan, setSubscriptionPlan] = useState<string>('');

  useEffect(() => {
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

      const { data: businessData } = await supabase
        .from('businesses')
        .select('owner_id')
        .eq('id', businessId)
        .maybeSingle();

      if (businessData) {
        const { data: subscriptionData, error: subError } = await supabase
          .from('subscriptions')
          .select(`
            plan_id,
            subscription_plans (
              name,
              max_persons
            )
          `)
          .eq('customer_id', businessData.owner_id)
          .eq('status', 'active')
          .maybeSingle();

        if (subscriptionData?.subscription_plans) {
          const plan = Array.isArray(subscriptionData.subscription_plans)
            ? subscriptionData.subscription_plans[0]
            : subscriptionData.subscription_plans;

          if (plan) {
            setMaxLocations(plan.max_persons || 1);
            setSubscriptionPlan(plan.name || '');
          }
        }
      }

      setLoading(false);
    };

    loadLocations();
  }, [businessId]);

  const handleAddLocation = () => {
    if (locations.length >= maxLocations) {
      alert(`Hai raggiunto il limite massimo di ${maxLocations} ${maxLocations === 1 ? 'sede' : 'sedi'} per il tuo piano "${subscriptionPlan}". Per aggiungere più sedi, aggiorna il tuo abbonamento.`);
      return;
    }

    const defaultHours: DayHours = { open: '09:00', close: '18:00', closed: false };
    setLocations([
      ...locations,
      {
        id: `new-${Date.now()}`,
        name: '',
        internal_name: `Sede ${locations.length + 1}`,
        address: '',
        city: '',
        province: '',
        postal_code: '',
        phone: '',
        email: '',
        avatar_url: null,
        description: '',
        business_hours: {
          monday: defaultHours,
          tuesday: defaultHours,
          wednesday: defaultHours,
          thursday: defaultHours,
          friday: defaultHours,
          saturday: { ...defaultHours, closed: true },
          sunday: { ...defaultHours, closed: true },
        },
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
      setLocations(locations.map(location => {
        if (location.id === id) {
          const provinceCode = selectedCity?.province ? PROVINCE_TO_CODE[selectedCity.province] : location.province;
          return {
            ...location,
            city: value as string,
            province: provinceCode || location.province || '',
          };
        }
        return location;
      }));
    } else {
      setLocations(locations.map(location =>
        location.id === id ? { ...location, [field]: value } : location
      ));
    }
  };

  const handleHoursChange = (id: string, day: keyof BusinessHours, field: keyof DayHours, value: string | boolean) => {
    setLocations(locations.map(location => {
      if (location.id === id && location.business_hours) {
        return {
          ...location,
          business_hours: {
            ...location.business_hours,
            [day]: {
              ...location.business_hours[day],
              [field]: value,
            },
          },
        };
      }
      return location;
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();

    const { data: businessCheck } = await supabase
      .from('businesses')
      .select('id, owner_id')
      .eq('id', businessId)
      .maybeSingle();

    if (!businessCheck || businessCheck.owner_id !== user?.id) {
      alert('Non hai i permessi per modificare questa attività');
      setSaving(false);
      return;
    }

    try {
      for (const location of locations) {
        const address = location.address ?? '';
        const city = location.city ?? '';
        const province = location.province ?? '';
        const postalCode = location.postal_code ?? '';
        const name = location.name ?? '';
        const phone = location.phone ?? '';
        const email = location.email ?? '';

        if (!address.trim()) {
          alert('Compila l\'indirizzo per tutte le sedi');
          setSaving(false);
          return;
        }
        if (!city.trim()) {
          alert('Seleziona la città per tutte le sedi');
          setSaving(false);
          return;
        }
        if (!province.trim()) {
          alert('Seleziona la provincia per tutte le sedi');
          setSaving(false);
          return;
        }
        if (!/^[A-Z]{2}$/.test(province.trim())) {
          alert('Formato provincia non valido. Seleziona la città dal menu per impostare automaticamente la provincia.');
          setSaving(false);
          return;
        }
        if (!postalCode.trim()) {
          alert('Compila il CAP per tutte le sedi');
          setSaving(false);
          return;
        }

        if (location.id.startsWith('new-')) {
          const { error } = await supabase
            .from('business_locations')
            .insert({
              business_id: businessId,
              name: name.trim() || 'Sede',
              internal_name: location.internal_name?.trim() || null,
              address: address.trim(),
              city: city.trim(),
              province: province.trim(),
              postal_code: postalCode.trim(),
              phone: phone.trim() || null,
              email: email.trim() || null,
              business_hours: location.business_hours,
              is_primary: location.is_primary,
              description: location.description?.trim() || null,
            });

          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('business_locations')
            .update({
              name: name.trim() || 'Sede',
              internal_name: location.internal_name?.trim() || null,
              address: address.trim(),
              city: city.trim(),
              province: province.trim(),
              postal_code: postalCode.trim(),
              phone: phone.trim() || null,
              email: email.trim() || null,
              business_hours: location.business_hours,
              is_primary: location.is_primary,
              description: location.description?.trim() || null,
            })
            .eq('id', location.id);

          if (error) throw error;
        }
      }

      setIsEditing(false);

      const { data: updatedData } = await supabase
        .from('business_locations')
        .select('*')
        .eq('business_id', businessId)
        .order('is_primary', { ascending: false });

      if (updatedData) {
        setLocations(updatedData);
      }

      onUpdate();
    } catch (error: any) {
      console.error('Error updating locations:', error);
      const errorMessage = error?.message || 'Errore durante il salvataggio';
      alert(`Errore durante il salvataggio: ${errorMessage}\n\nAssicurati di aver compilato tutti i campi obbligatori (indirizzo, città, CAP).`);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async () => {
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
                <div className="flex items-start gap-6 mb-4">
                  {!location.id.startsWith('new-') && (
                    <BusinessLocationAvatarUpload
                      locationId={location.id}
                      currentAvatarUrl={location.avatar_url}
                      onAvatarUpdate={(url) => {
                        setLocations(locations.map(loc =>
                          loc.id === location.id ? { ...loc, avatar_url: url } : loc
                        ));
                      }}
                    />
                  )}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-bold text-lg text-gray-900">{location.internal_name || `Sede ${index + 1}`}</h3>
                        <p className="text-sm text-gray-500 font-medium">{location.name}</p>
                      </div>
                      {location.is_primary && (
                        <span className="bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                          PRINCIPALE
                        </span>
                      )}
                    </div>
                    {location.description && (
                      <p className="text-sm text-gray-600 mb-4 italic">{location.description}</p>
                    )}
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
                      {location.email && (
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Email</p>
                          <p className="text-lg font-semibold text-gray-900">{location.email}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                {location.business_hours && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-600 mb-2 font-bold">Orari di Apertura</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const).map(day => {
                        const dayNames = {
                          monday: 'Lunedì',
                          tuesday: 'Martedì',
                          wednesday: 'Mercoledì',
                          thursday: 'Giovedì',
                          friday: 'Venerdì',
                          saturday: 'Sabato',
                          sunday: 'Domenica',
                        };
                        const hours = location.business_hours![day];
                        return (
                          <div key={day} className="flex justify-between">
                            <span className="font-medium">{dayNames[day]}:</span>
                            <span className={hours.closed ? 'text-gray-500 italic' : 'text-gray-900'}>
                              {hours.closed ? 'Chiuso' : `${hours.open} - ${hours.close}`}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
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

      <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <span className="font-semibold">Nota:</span> I campi contrassegnati con * sono obbligatori.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6 mb-6">
          {locations.map((location, index) => (
            <div key={location.id} className={`border-2 rounded-lg p-6 ${
              location.is_primary ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-gray-50'
            }`}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4 flex-1">
                  {!location.id.startsWith('new-') && (
                    <BusinessLocationAvatarUpload
                      locationId={location.id}
                      currentAvatarUrl={location.avatar_url}
                      onAvatarUpdate={(url) => {
                        setLocations(locations.map(loc =>
                          loc.id === location.id ? { ...loc, avatar_url: url } : loc
                        ));
                      }}
                    />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <input
                        type="text"
                        value={location.internal_name || ''}
                        onChange={(e) => handleChange(location.id, 'internal_name', e.target.value)}
                        placeholder="Es. Sede 1, Sede 2..."
                        className="flex-1 px-3 py-1.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-semibold text-base text-gray-700"
                      />
                      {location.is_primary && (
                        <span className="bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap">
                          PRINCIPALE
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      Etichetta privata per riconoscere questa sede nel tuo profilo
                    </p>
                    {location.id.startsWith('new-') && (
                      <p className="text-xs text-orange-600 mt-1">Salva per caricare l'immagine della sede</p>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveLocation(location.id)}
                  className="text-red-600 hover:text-red-700 flex items-center gap-1 ml-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Rimuovi
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div className="md:col-span-2 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <label className="block text-base font-bold text-blue-900 mb-2 flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    Nome Ufficiale Attività *
                  </label>
                  <input
                    type="text"
                    value={location.name || ''}
                    onChange={(e) => handleChange(location.id, 'name', e.target.value)}
                    required
                    placeholder="Es. Ristorante Da Mario, Farmacia Centrale, Parrucchiere Stile..."
                    className="w-full px-4 py-3 border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium text-lg"
                  />
                  <p className="text-sm text-blue-700 mt-2 flex items-start gap-1">
                    <span className="font-semibold">ℹ️</span>
                    <span>Questo è il nome che vedranno gli utenti quando cercano la tua attività</span>
                  </p>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Descrizione
                  </label>
                  <textarea
                    value={location.description || ''}
                    onChange={(e) => handleChange(location.id, 'description', e.target.value)}
                    placeholder="Breve descrizione della sede (es. 'Negozio nel centro storico con ampio parcheggio')"
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">Questa descrizione aiuta i clienti a trovare e riconoscere la sede</p>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Indirizzo *
                  </label>
                  <input
                    type="text"
                    value={location.address || ''}
                    onChange={(e) => handleChange(location.id, 'address', e.target.value)}
                    required
                    placeholder="Via, numero civico"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Città *
                  </label>
                  <SearchableSelect
                    value={location.city || ''}
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
                    CAP *
                  </label>
                  <input
                    type="text"
                    value={location.postal_code || ''}
                    onChange={(e) => handleChange(location.id, 'postal_code', e.target.value)}
                    required
                    maxLength={5}
                    placeholder="00000"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Telefono (opzionale)
                  </label>
                  <input
                    type="tel"
                    value={location.phone || ''}
                    onChange={(e) => handleChange(location.id, 'phone', e.target.value)}
                    placeholder="Es. +39 123 456789"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email Sede (opzionale)
                  </label>
                  <input
                    type="email"
                    value={location.email || ''}
                    onChange={(e) => handleChange(location.id, 'email', e.target.value)}
                    placeholder="Es. sede@azienda.it"
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

              {location.business_hours && (
                <div className="mt-4">
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Orari di Apertura
                  </label>
                  <div className="space-y-2 bg-gray-50 p-4 rounded-lg">
                    {(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const).map(day => {
                      const dayNames = {
                        monday: 'Lunedì',
                        tuesday: 'Martedì',
                        wednesday: 'Mercoledì',
                        thursday: 'Giovedì',
                        friday: 'Venerdì',
                        saturday: 'Sabato',
                        sunday: 'Domenica',
                      };
                      const dayHours = location.business_hours![day];

                      return (
                        <div key={day} className="flex items-center gap-3 text-sm">
                          <label className="flex items-center gap-2 w-32">
                            <input
                              type="checkbox"
                              checked={!dayHours.closed}
                              onChange={(e) => handleHoursChange(location.id, day, 'closed', !e.target.checked)}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                            />
                            <span className="font-medium">{dayNames[day]}</span>
                          </label>
                          {!dayHours.closed && (
                            <>
                              <input
                                type="time"
                                value={dayHours.open}
                                onChange={(e) => handleHoursChange(location.id, day, 'open', e.target.value)}
                                className="px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                              <span>-</span>
                              <input
                                type="time"
                                value={dayHours.close}
                                onChange={(e) => handleHoursChange(location.id, day, 'close', e.target.value)}
                                className="px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </>
                          )}
                          {dayHours.closed && (
                            <span className="text-gray-500 italic">Chiuso</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mb-6">
          <button
            type="button"
            onClick={handleAddLocation}
            disabled={locations.length >= maxLocations}
            className="flex items-center gap-2 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors font-semibold w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-5 h-5" />
            Aggiungi Sede
          </button>
          <p className="text-sm text-gray-600 mt-2 text-center">
            {locations.length >= maxLocations ? (
              <span className="text-red-600 font-semibold">
                Limite raggiunto: {locations.length}/{maxLocations} {maxLocations === 1 ? 'sede' : 'sedi'}. Aggiorna l'abbonamento per aggiungere più sedi.
              </span>
            ) : (
              <span>
                Sedi utilizzate: {locations.length}/{maxLocations} - Piano: {subscriptionPlan}
              </span>
            )}
          </p>
        </div>

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
