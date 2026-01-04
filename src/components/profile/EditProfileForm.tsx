import { useState } from 'react';
import { Edit, Save, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { SearchableSelect } from '../common/SearchableSelect';

interface ProfileData {
  id: string;
  first_name: string;
  last_name: string;
  nickname: string;
  relationship: string;
  date_of_birth: string;
  tax_code: string;
  phone: string;
  billing_street: string;
  billing_street_number: string;
  billing_postal_code: string;
  billing_city: string;
  billing_province: string;
  billing_address: string;
  user_type?: 'customer' | 'business';
  company_name?: string;
  vat_number?: string;
  unique_code?: string;
  pec_email?: string;
}

interface EditProfileFormProps {
  profile: ProfileData;
  onUpdate: () => void;
}

export function EditProfileForm({ profile, onUpdate }: EditProfileFormProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    first_name: profile.first_name || '',
    last_name: profile.last_name || '',
    nickname: profile.nickname || '',
    relationship: profile.relationship || 'Titolare',
    date_of_birth: profile.date_of_birth || '',
    tax_code: profile.tax_code || '',
    phone: profile.phone || '',
    billing_street: profile.billing_street || '',
    billing_street_number: profile.billing_street_number || '',
    billing_postal_code: profile.billing_postal_code || '',
    billing_city: profile.billing_city || '',
    billing_province: profile.billing_province || '',
    company_name: profile.company_name || '',
    vat_number: profile.vat_number || '',
    unique_code: profile.unique_code || '',
    pec_email: profile.pec_email || '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const billingAddress = `${formData.billing_street} ${formData.billing_street_number}, ${formData.billing_postal_code} ${formData.billing_city}, ${formData.billing_province}`;

      const updateData: any = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        nickname: formData.nickname,
        relationship: formData.relationship,
        date_of_birth: formData.date_of_birth,
        tax_code: formData.tax_code,
        phone: formData.phone,
        billing_street: formData.billing_street,
        billing_street_number: formData.billing_street_number,
        billing_postal_code: formData.billing_postal_code,
        billing_city: formData.billing_city,
        billing_province: formData.billing_province.toUpperCase(),
        billing_address: billingAddress,
        full_name: `${formData.first_name} ${formData.last_name}`,
      };

      if (profile.user_type === 'business') {
        updateData.company_name = formData.company_name;
        updateData.vat_number = formData.vat_number;
        updateData.unique_code = formData.unique_code;
        updateData.pec_email = formData.pec_email;
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', profile.id);

      if (error) throw error;

      setIsEditing(false);
      onUpdate();
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Errore durante il salvataggio');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      first_name: profile.first_name || '',
      last_name: profile.last_name || '',
      nickname: profile.nickname || '',
      relationship: profile.relationship || 'Titolare',
      date_of_birth: profile.date_of_birth || '',
      tax_code: profile.tax_code || '',
      phone: profile.phone || '',
      billing_street: profile.billing_street || '',
      billing_street_number: profile.billing_street_number || '',
      billing_postal_code: profile.billing_postal_code || '',
      billing_city: profile.billing_city || '',
      billing_province: profile.billing_province || '',
      company_name: profile.company_name || '',
      vat_number: profile.vat_number || '',
      unique_code: profile.unique_code || '',
      pec_email: profile.pec_email || '',
    });
    setIsEditing(false);
  };

  if (!isEditing) {
    return (
      <div className="bg-white rounded-xl shadow-md p-8 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Informazioni Personali</h2>
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Edit className="w-4 h-4" />
            Modifica
          </button>
        </div>

        {profile.user_type === 'business' && (
          <>
            <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">Dati Aziendali</h3>
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div>
                <p className="text-sm text-gray-600 mb-1">Ragione Sociale</p>
                <p className="text-lg font-semibold text-gray-900">{profile.company_name || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Partita IVA</p>
                <p className="text-lg font-semibold text-gray-900">{profile.vat_number || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Codice Univoco (SDI)</p>
                <p className="text-lg font-semibold text-gray-900">{profile.unique_code || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">PEC</p>
                <p className="text-lg font-semibold text-gray-900">{profile.pec_email || '-'}</p>
              </div>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2 mt-6">Dati del Titolare</h3>
          </>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-gray-600 mb-1">Nome</p>
            <p className="text-lg font-semibold text-gray-900">{profile.first_name || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Cognome</p>
            <p className="text-lg font-semibold text-gray-900">{profile.last_name || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Nickname</p>
            <p className="text-lg font-semibold text-gray-900">{profile.nickname || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Relazione</p>
            <p className="text-lg font-semibold text-gray-900">{profile.relationship || 'Titolare'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Data di Nascita</p>
            <p className="text-lg font-semibold text-gray-900">
              {profile.date_of_birth ? new Date(profile.date_of_birth).toLocaleDateString('it-IT') : '-'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Codice Fiscale</p>
            <p className="text-lg font-semibold text-gray-900">{profile.tax_code || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Telefono</p>
            <p className="text-lg font-semibold text-gray-900">{profile.phone || '-'}</p>
          </div>
          <div className="md:col-span-2">
            <p className="text-sm text-gray-600 mb-1">Indirizzo di Fatturazione</p>
            <p className="text-lg font-semibold text-gray-900">{profile.billing_address || '-'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-8 mb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Modifica Informazioni</h2>
        <button
          onClick={handleCancel}
          className="text-gray-600 hover:text-gray-800"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {profile.user_type === 'business' && (
          <>
            <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">Dati Aziendali</h3>
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Ragione Sociale *
                </label>
                <input
                  type="text"
                  name="company_name"
                  value={formData.company_name}
                  onChange={handleChange}
                  required
                  placeholder="Es. Azienda S.r.l."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Partita IVA *
                </label>
                <input
                  type="text"
                  name="vat_number"
                  value={formData.vat_number}
                  onChange={handleChange}
                  required
                  maxLength={11}
                  placeholder="Es. 12345678901"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Codice Univoco (SDI) *
                </label>
                <input
                  type="text"
                  name="unique_code"
                  value={formData.unique_code}
                  onChange={handleChange}
                  required
                  maxLength={7}
                  placeholder="Es. ABCDEFG"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  PEC *
                </label>
                <input
                  type="email"
                  name="pec_email"
                  value={formData.pec_email}
                  onChange={handleChange}
                  required
                  placeholder="Es. azienda@pec.it"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2 mt-6">Dati del Titolare</h3>
          </>
        )}

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Nome
            </label>
            <input
              type="text"
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Cognome
            </label>
            <input
              type="text"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Nickname
            </label>
            <input
              type="text"
              name="nickname"
              value={formData.nickname}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Relazione
            </label>
            <SearchableSelect
              value={formData.relationship}
              onChange={(value) => setFormData(prev => ({ ...prev, relationship: value }))}
              options={[
                { value: 'Titolare', label: 'Titolare' },
                { value: 'Coniuge', label: 'Coniuge' },
                { value: 'Figlio/a', label: 'Figlio/a' },
                { value: 'Genitore', label: 'Genitore' },
                { value: 'Fratello/Sorella', label: 'Fratello/Sorella' },
                { value: 'Amico/a', label: 'Amico/a' },
                { value: 'Altro', label: 'Altro familiare' },
              ]}
              placeholder="Seleziona relazione"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Data di Nascita
            </label>
            <input
              type="date"
              name="date_of_birth"
              value={formData.date_of_birth}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Codice Fiscale
            </label>
            <input
              type="text"
              name="tax_code"
              value={formData.tax_code}
              onChange={handleChange}
              required
              maxLength={16}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Telefono
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Via/Piazza
            </label>
            <input
              type="text"
              name="billing_street"
              value={formData.billing_street}
              onChange={handleChange}
              required
              placeholder="Es. Via Roma"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Numero
            </label>
            <input
              type="text"
              name="billing_street_number"
              value={formData.billing_street_number}
              onChange={handleChange}
              required
              placeholder="Es. 42"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              CAP
            </label>
            <input
              type="text"
              name="billing_postal_code"
              value={formData.billing_postal_code}
              onChange={handleChange}
              required
              placeholder="Es. 00100"
              maxLength={5}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Città
            </label>
            <input
              type="text"
              name="billing_city"
              value={formData.billing_city}
              onChange={handleChange}
              required
              placeholder="Es. Roma"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Provincia
            </label>
            <input
              type="text"
              name="billing_province"
              value={formData.billing_province}
              onChange={handleChange}
              required
              placeholder="Es. RM"
              maxLength={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
            />
          </div>
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
