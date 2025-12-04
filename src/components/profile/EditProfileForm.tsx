import { useState } from 'react';
import { Edit, Save, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface ProfileData {
  id: string;
  first_name: string;
  last_name: string;
  nickname: string;
  date_of_birth: string;
  tax_code: string;
  phone: string;
  billing_address: string;
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
    date_of_birth: profile.date_of_birth || '',
    tax_code: profile.tax_code || '',
    phone: profile.phone || '',
    billing_address: profile.billing_address || '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          nickname: formData.nickname,
          date_of_birth: formData.date_of_birth,
          tax_code: formData.tax_code,
          phone: formData.phone,
          billing_address: formData.billing_address,
          full_name: `${formData.first_name} ${formData.last_name}`,
        })
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
      date_of_birth: profile.date_of_birth || '',
      tax_code: profile.tax_code || '',
      phone: profile.phone || '',
      billing_address: profile.billing_address || '',
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
              Indirizzo di Fatturazione
            </label>
            <textarea
              name="billing_address"
              value={formData.billing_address}
              onChange={handleChange}
              required
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
