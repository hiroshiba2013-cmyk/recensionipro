import { useState } from 'react';
import { Edit, Save, X, Building2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface BusinessData {
  id: string;
  name: string;
  vat_number: string;
  unique_code: string;
  ateco_code: string;
  pec_email: string;
  phone: string;
  billing_street: string;
  billing_street_number: string;
  billing_postal_code: string;
  billing_city: string;
  billing_province: string;
  billing_address: string;
  office_street: string;
  office_street_number: string;
  office_postal_code: string;
  office_city: string;
  office_province: string;
  office_address: string;
  website_url: string;
}

interface EditBusinessFormProps {
  business: BusinessData;
  onUpdate: () => void;
}

export function EditBusinessForm({ business, onUpdate }: EditBusinessFormProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: business.name || '',
    vat_number: business.vat_number || '',
    unique_code: business.unique_code || '',
    ateco_code: business.ateco_code || '',
    pec_email: business.pec_email || '',
    phone: business.phone || '',
    billing_street: business.billing_street || '',
    billing_street_number: business.billing_street_number || '',
    billing_postal_code: business.billing_postal_code || '',
    billing_city: business.billing_city || '',
    billing_province: business.billing_province || '',
    office_street: business.office_street || '',
    office_street_number: business.office_street_number || '',
    office_postal_code: business.office_postal_code || '',
    office_city: business.office_city || '',
    office_province: business.office_province || '',
    website_url: business.website_url || '',
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
      const officeAddress = formData.office_street && formData.office_street_number && formData.office_postal_code && formData.office_city && formData.office_province
        ? `${formData.office_street} ${formData.office_street_number}, ${formData.office_postal_code} ${formData.office_city}, ${formData.office_province}`
        : '';

      const { error } = await supabase
        .from('businesses')
        .update({
          name: formData.name,
          vat_number: formData.vat_number,
          unique_code: formData.unique_code,
          ateco_code: formData.ateco_code,
          pec_email: formData.pec_email,
          phone: formData.phone,
          billing_street: formData.billing_street,
          billing_street_number: formData.billing_street_number,
          billing_postal_code: formData.billing_postal_code,
          billing_city: formData.billing_city,
          billing_province: formData.billing_province.toUpperCase(),
          billing_address: billingAddress,
          office_street: formData.office_street || null,
          office_street_number: formData.office_street_number || null,
          office_postal_code: formData.office_postal_code || null,
          office_city: formData.office_city || null,
          office_province: formData.office_province ? formData.office_province.toUpperCase() : null,
          office_address: officeAddress,
          website_url: formData.website_url,
        })
        .eq('id', business.id);

      if (error) throw error;

      setIsEditing(false);
      onUpdate();
    } catch (error) {
      console.error('Error updating business:', error);
      alert('Errore durante il salvataggio');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: business.name || '',
      vat_number: business.vat_number || '',
      unique_code: business.unique_code || '',
      ateco_code: business.ateco_code || '',
      pec_email: business.pec_email || '',
      phone: business.phone || '',
      billing_street: business.billing_street || '',
      billing_street_number: business.billing_street_number || '',
      billing_postal_code: business.billing_postal_code || '',
      billing_city: business.billing_city || '',
      billing_province: business.billing_province || '',
      office_street: business.office_street || '',
      office_street_number: business.office_street_number || '',
      office_postal_code: business.office_postal_code || '',
      office_city: business.office_city || '',
      office_province: business.office_province || '',
      website_url: business.website_url || '',
    });
    setIsEditing(false);
  };

  if (!isEditing) {
    return (
      <div className="bg-white rounded-xl shadow-md p-8 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Building2 className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">Informazioni Aziendali</h2>
          </div>
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
            <p className="text-sm text-gray-600 mb-1">Ragione Sociale</p>
            <p className="text-lg font-semibold text-gray-900">{business.name || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Partita IVA</p>
            <p className="text-lg font-semibold text-gray-900">{business.vat_number || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Codice Univoco</p>
            <p className="text-lg font-semibold text-gray-900">{business.unique_code || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Codice ATECO</p>
            <p className="text-lg font-semibold text-gray-900">{business.ateco_code || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">PEC</p>
            <p className="text-lg font-semibold text-gray-900">{business.pec_email || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Telefono</p>
            <p className="text-lg font-semibold text-gray-900">{business.phone || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Sito Web</p>
            {business.website_url ? (
              <a
                href={business.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-lg font-semibold text-blue-600 hover:text-blue-700 hover:underline"
              >
                {business.website_url}
              </a>
            ) : (
              <p className="text-lg font-semibold text-gray-900">-</p>
            )}
          </div>
          <div className="md:col-span-2">
            <p className="text-sm text-gray-600 mb-1">Indirizzo di Fatturazione</p>
            <p className="text-lg font-semibold text-gray-900">{business.billing_address || '-'}</p>
          </div>
          <div className="md:col-span-2">
            <p className="text-sm text-gray-600 mb-1">Indirizzo Sede</p>
            <p className="text-lg font-semibold text-gray-900">{business.office_address || '-'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-8 mb-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Building2 className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Modifica Informazioni Aziendali</h2>
        </div>
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
              Ragione Sociale
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Partita IVA
            </label>
            <input
              type="text"
              name="vat_number"
              value={formData.vat_number}
              onChange={handleChange}
              required
              maxLength={11}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Codice Univoco
            </label>
            <input
              type="text"
              name="unique_code"
              value={formData.unique_code}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Codice ATECO
            </label>
            <input
              type="text"
              name="ateco_code"
              value={formData.ateco_code}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              PEC
            </label>
            <input
              type="email"
              name="pec_email"
              value={formData.pec_email}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              Sito Web
            </label>
            <input
              type="url"
              name="website_url"
              value={formData.website_url}
              onChange={handleChange}
              placeholder="https://www.esempio.it"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="md:col-span-2">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 mt-4">Indirizzo di Fatturazione</h3>
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

          <div className="md:col-span-2">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 mt-4">Indirizzo Sede (opzionale)</h3>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Via/Piazza
            </label>
            <input
              type="text"
              name="office_street"
              value={formData.office_street}
              onChange={handleChange}
              placeholder="Es. Via Milano"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Numero
            </label>
            <input
              type="text"
              name="office_street_number"
              value={formData.office_street_number}
              onChange={handleChange}
              placeholder="Es. 10"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              CAP
            </label>
            <input
              type="text"
              name="office_postal_code"
              value={formData.office_postal_code}
              onChange={handleChange}
              placeholder="Es. 20100"
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
              name="office_city"
              value={formData.office_city}
              onChange={handleChange}
              placeholder="Es. Milano"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Provincia
            </label>
            <input
              type="text"
              name="office_province"
              value={formData.office_province}
              onChange={handleChange}
              placeholder="Es. MI"
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
