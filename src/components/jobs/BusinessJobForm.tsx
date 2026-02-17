import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { SearchableSelect } from '../common/SearchableSelect';

interface Business {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
}

interface JobFormData {
  businessId: string;
  categoryId: string;
  title: string;
  description: string;
  positionType: string;
  salaryMin: string;
  salaryMax: string;
  salaryCurrency: string;
  location: string;
  requiredSkills: string;
  experienceLevel: string;
  expiresAt: string;
}

interface BusinessJobFormProps {
  onSuccess?: () => void;
}

export function BusinessJobForm({ onSuccess }: BusinessJobFormProps) {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { user } = useAuth();

  const [formData, setFormData] = useState<JobFormData>({
    businessId: '',
    categoryId: '',
    title: '',
    description: '',
    positionType: 'Full-time',
    salaryMin: '',
    salaryMax: '',
    salaryCurrency: 'EUR',
    location: '',
    requiredSkills: '',
    experienceLevel: 'Mid',
    expiresAt: '',
  });

  useEffect(() => {
    loadBusinesses();
    loadCategories();
  }, [user]);

  const loadBusinesses = async () => {
    if (!user) return;

    try {
      const { data } = await supabase
        .from('businesses')
        .select('id, name')
        .eq('owner_id', user.id);

      if (data) {
        setBusinesses(data);
        if (data.length > 0) {
          setFormData(prev => ({ ...prev, businessId: data[0].id }));
        }
      }
    } catch (err) {
      console.error('Error loading businesses:', err);
    }
  };

  const loadCategories = async () => {
    try {
      const { data } = await supabase
        .from('business_categories')
        .select('id, name')
        .order('name');

      setCategories(data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.businessId) {
      setError('Seleziona un\'azienda');
      return;
    }

    if (!formData.title.trim()) {
      setError('Inserisci il titolo della posizione');
      return;
    }

    if (!formData.description.trim()) {
      setError('Inserisci la descrizione della posizione');
      return;
    }

    if (!formData.location.trim()) {
      setError('Inserisci la città/location');
      return;
    }

    if (!formData.expiresAt) {
      setError('Seleziona la data di scadenza');
      return;
    }

    setLoading(true);

    try {
      const skillsArray = formData.requiredSkills
        .split(',')
        .map(s => s.trim())
        .filter(s => s);

      const { error: insertError } = await supabase
        .from('job_postings')
        .insert({
          business_id: formData.businessId,
          category_id: formData.categoryId || null,
          title: formData.title.trim(),
          description: formData.description.trim(),
          position_type: formData.positionType,
          salary_min: formData.salaryMin ? parseFloat(formData.salaryMin) : null,
          salary_max: formData.salaryMax ? parseFloat(formData.salaryMax) : null,
          salary_currency: formData.salaryCurrency,
          location: formData.location.trim(),
          required_skills: skillsArray,
          experience_level: formData.experienceLevel,
          expires_at: new Date(formData.expiresAt).toISOString(),
        });

      if (insertError) throw insertError;

      setSuccess('Annuncio pubblicato con successo!');
      setFormData({
        businessId: formData.businessId,
        categoryId: '',
        title: '',
        description: '',
        positionType: 'Full-time',
        salaryMin: '',
        salaryMax: '',
        salaryCurrency: 'EUR',
        location: '',
        requiredSkills: '',
        experienceLevel: 'Mid',
        expiresAt: '',
      });

      onSuccess?.();
    } catch (err: any) {
      setError(err.message || 'Errore durante la pubblicazione');
    } finally {
      setLoading(false);
    }
  };

  if (businesses.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800">
        <p>Non hai ancora registrato un\'azienda. <a href="/dashboard" className="font-semibold underline">Vai al dashboard</a> per registrare la tua azienda.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6 max-w-2xl">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Azienda
        </label>
        <SearchableSelect
          name="businessId"
          value={formData.businessId}
          onChange={(value) => setFormData(prev => ({ ...prev, businessId: value }))}
          options={businesses.map(b => ({
            value: b.id,
            label: b.name,
          }))}
          placeholder="Seleziona azienda"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Categoria Lavorativa
        </label>
        <SearchableSelect
          value={formData.categoryId}
          onChange={(value) => setFormData(prev => ({ ...prev, categoryId: value }))}
          options={[
            { value: '', label: 'Seleziona una categoria...' },
            ...categories.map((cat) => ({
              value: cat.id,
              label: cat.name,
            }))
          ]}
          placeholder="Seleziona una categoria..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Titolo Posizione *
        </label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder="Es. Sviluppatore Full Stack"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Descrizione Posizione *
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Descrivi la posizione, le responsabilità e i requisiti..."
          rows={5}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tipo di Posizione
          </label>
          <SearchableSelect
            name="positionType"
            value={formData.positionType}
            onChange={(value) => setFormData(prev => ({ ...prev, positionType: value }))}
            options={[
              { value: 'Full-time', label: 'Full-time' },
              { value: 'Part-time', label: 'Part-time' },
              { value: 'Contract', label: 'Contract' },
              { value: 'Freelance', label: 'Freelance' },
              { value: 'Internship', label: 'Tirocinio' },
            ]}
            placeholder="Seleziona tipo posizione"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Livello di Esperienza
          </label>
          <SearchableSelect
            name="experienceLevel"
            value={formData.experienceLevel}
            onChange={(value) => setFormData(prev => ({ ...prev, experienceLevel: value }))}
            options={[
              { value: 'Junior', label: 'Junior' },
              { value: 'Mid', label: 'Mid' },
              { value: 'Senior', label: 'Senior' },
            ]}
            placeholder="Seleziona livello esperienza"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Stipendio Minimo
          </label>
          <input
            type="number"
            name="salaryMin"
            value={formData.salaryMin}
            onChange={handleChange}
            placeholder="Es. 20000"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Stipendio Massimo
          </label>
          <input
            type="number"
            name="salaryMax"
            value={formData.salaryMax}
            onChange={handleChange}
            placeholder="Es. 40000"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Valuta
          </label>
          <SearchableSelect
            name="salaryCurrency"
            value={formData.salaryCurrency}
            onChange={(value) => setFormData(prev => ({ ...prev, salaryCurrency: value }))}
            options={[
              { value: 'EUR', label: 'EUR' },
              { value: 'USD', label: 'USD' },
              { value: 'GBP', label: 'GBP' },
            ]}
            placeholder="Seleziona valuta"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Città/Location *
          </label>
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleChange}
            placeholder="Es. Milano"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Skills Richieste (separate da virgola)
        </label>
        <input
          type="text"
          name="requiredSkills"
          value={formData.requiredSkills}
          onChange={handleChange}
          placeholder="Es. React, Node.js, PostgreSQL"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Data di Scadenza *
        </label>
        <input
          type="date"
          name="expiresAt"
          value={formData.expiresAt}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          required
        />
      </div>

      {error && <div className="text-red-600 bg-red-50 p-3 rounded-lg text-sm">{error}</div>}
      {success && <div className="text-green-600 bg-green-50 p-3 rounded-lg text-sm">{success}</div>}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 font-medium"
      >
        {loading ? 'Pubblicazione...' : 'Pubblica Annuncio'}
      </button>
    </form>
  );
}
