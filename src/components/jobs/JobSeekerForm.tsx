import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { SearchableSelect } from '../common/SearchableSelect';
import { X } from 'lucide-react';

interface JobSeekerFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

interface Category {
  id: string;
  name: string;
}

export function JobSeekerForm({ onSuccess, onCancel }: JobSeekerFormProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    skills: '',
    contract_type: 'Full-time',
    desired_salary_min: '',
    desired_salary_max: '',
    location: '',
    available_from: '',
    experience_years: '',
    education_level: '',
    phone: '',
    email: '',
    category_id: '',
  });

  useEffect(() => {
    loadCategories();
  }, []);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const dataToInsert = {
        user_id: user.id,
        title: formData.title,
        description: formData.description,
        skills: formData.skills.split(',').map(s => s.trim()).filter(Boolean),
        contract_type: formData.contract_type,
        desired_salary_min: formData.desired_salary_min ? parseFloat(formData.desired_salary_min) : null,
        desired_salary_max: formData.desired_salary_max ? parseFloat(formData.desired_salary_max) : null,
        location: formData.location,
        available_from: formData.available_from || null,
        experience_years: formData.experience_years ? parseInt(formData.experience_years) : 0,
        education_level: formData.education_level || null,
        phone: formData.phone || null,
        email: formData.email || null,
        category_id: formData.category_id || null,
        status: 'active',
      };

      console.log('Inserting job seeker ad:', dataToInsert);

      const { data, error } = await supabase.from('job_seekers').insert(dataToInsert).select();

      console.log('Insert result:', { data, error });

      if (error) throw error;

      alert('Annuncio pubblicato con successo!');
      onSuccess();
    } catch (error: any) {
      console.error('Error creating job seeker ad:', error);
      alert(`Errore nella creazione dell'annuncio: ${error.message || 'Errore sconosciuto'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Crea Annuncio Cerco Lavoro</h2>
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
          <X className="w-6 h-6" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Titolo / Posizione Cercata *
          </label>
          <input
            type="text"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Es. Sviluppatore Frontend, Contabile, Cameriere..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Categoria Lavorativa
          </label>
          <SearchableSelect
            value={formData.category_id}
            onChange={(value) => setFormData({ ...formData, category_id: value })}
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
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Descrizione e Esperienza *
          </label>
          <textarea
            required
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Descrivi la tua esperienza, qualifiche e cosa stai cercando..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo Contratto Cercato *
            </label>
            <select
              required
              value={formData.contract_type}
              onChange={(e) => setFormData({ ...formData, contract_type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="Full-time">Full-time</option>
              <option value="Part-time">Part-time</option>
              <option value="Contract">Contratto</option>
              <option value="Freelance">Freelance</option>
              <option value="Internship">Tirocinio</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Città *
            </label>
            <input
              type="text"
              required
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Es. Milano, Roma..."
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Telefono (facoltativo)
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Es. +39 123 456 7890"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email (facoltativo)
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Es. nome@email.com"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Competenze (separate da virgola)
          </label>
          <input
            type="text"
            value={formData.skills}
            onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Es. JavaScript, Excel, Inglese..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Stipendio Desiderato Min (€/anno)
            </label>
            <input
              type="number"
              value={formData.desired_salary_min}
              onChange={(e) => setFormData({ ...formData, desired_salary_min: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Es. 25000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Stipendio Desiderato Max (€/anno)
            </label>
            <input
              type="number"
              value={formData.desired_salary_max}
              onChange={(e) => setFormData({ ...formData, desired_salary_max: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Es. 35000"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Anni di Esperienza
            </label>
            <input
              type="number"
              value={formData.experience_years}
              onChange={(e) => setFormData({ ...formData, experience_years: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Es. 3"
              min="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Disponibile dal
            </label>
            <input
              type="date"
              value={formData.available_from}
              onChange={(e) => setFormData({ ...formData, available_from: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Livello di Istruzione
          </label>
          <select
            value={formData.education_level}
            onChange={(e) => setFormData({ ...formData, education_level: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Seleziona...</option>
            <option value="Licenza Media">Licenza Media</option>
            <option value="Diploma">Diploma</option>
            <option value="Laurea Triennale">Laurea Triennale</option>
            <option value="Laurea Magistrale">Laurea Magistrale</option>
            <option value="Master">Master</option>
            <option value="Dottorato">Dottorato</option>
          </select>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 font-medium"
          >
            {loading ? 'Pubblicazione...' : 'Pubblica Annuncio'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Annulla
          </button>
        </div>
      </form>
    </div>
  );
}