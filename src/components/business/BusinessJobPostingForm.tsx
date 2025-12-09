import { useState, useEffect } from 'react';
import { Briefcase, Plus, X, Edit, Trash2, Users } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface JobPosting {
  id: string;
  title: string;
  description: string;
  position_type: string;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string;
  location: string;
  required_skills: string[];
  experience_level: string;
  education_level: string | null;
  expires_at: string;
  status: string;
  created_at: string;
}

interface BusinessJobPostingFormProps {
  businessId: string;
}

export function BusinessJobPostingForm({ businessId }: BusinessJobPostingFormProps) {
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    position_type: 'Full-time',
    salary_min: '',
    salary_max: '',
    salary_currency: 'EUR',
    location: '',
    required_skills: '',
    experience_level: 'Mid',
    education_level: '',
    expires_at: '',
    status: 'active',
  });

  useEffect(() => {
    loadJobPostings();
  }, [businessId]);

  const loadJobPostings = async () => {
    try {
      const { data, error } = await supabase
        .from('job_postings')
        .select('*')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setJobPostings(data || []);
    } catch (error) {
      console.error('Error loading job postings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const postingData = {
        title: formData.title,
        description: formData.description,
        position_type: formData.position_type,
        salary_min: formData.salary_min ? parseFloat(formData.salary_min) : null,
        salary_max: formData.salary_max ? parseFloat(formData.salary_max) : null,
        salary_currency: formData.salary_currency,
        location: formData.location,
        required_skills: formData.required_skills.split(',').map(s => s.trim()).filter(s => s),
        experience_level: formData.experience_level,
        education_level: formData.education_level || null,
        expires_at: formData.expires_at,
        status: formData.status,
      };

      if (editingId) {
        const { error } = await supabase
          .from('job_postings')
          .update(postingData)
          .eq('id', editingId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('job_postings')
          .insert({
            business_id: businessId,
            ...postingData,
          });

        if (error) throw error;
      }

      resetForm();
      loadJobPostings();
    } catch (error) {
      console.error('Error saving job posting:', error);
      alert('Errore durante il salvataggio');
    }
  };

  const handleEdit = (posting: JobPosting) => {
    setFormData({
      title: posting.title,
      description: posting.description,
      position_type: posting.position_type,
      salary_min: posting.salary_min?.toString() || '',
      salary_max: posting.salary_max?.toString() || '',
      salary_currency: posting.salary_currency,
      location: posting.location,
      required_skills: posting.required_skills.join(', '),
      experience_level: posting.experience_level,
      education_level: posting.education_level || '',
      expires_at: posting.expires_at.split('T')[0],
      status: posting.status,
    });
    setEditingId(posting.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo annuncio?')) return;

    try {
      const { error } = await supabase
        .from('job_postings')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadJobPostings();
    } catch (error) {
      console.error('Error deleting job posting:', error);
    }
  };

  const toggleStatus = async (id: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'closed' : 'active';
      const { error } = await supabase
        .from('job_postings')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      loadJobPostings();
    } catch (error) {
      console.error('Error toggling job posting:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      position_type: 'Full-time',
      salary_min: '',
      salary_max: '',
      salary_currency: 'EUR',
      location: '',
      required_skills: '',
      experience_level: 'Mid',
      education_level: '',
      expires_at: '',
      status: 'active',
    });
    setEditingId(null);
    setShowForm(false);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-md p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Briefcase className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Annunci di Ricerca Personale</h2>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow-md"
          >
            <Plus className="w-5 h-5" />
            Nuovo Annuncio
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {editingId ? 'Modifica Annuncio' : 'Nuovo Annuncio'}
            </h3>
            <button
              type="button"
              onClick={resetForm}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Titolo Posizione
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                placeholder="Es. Sviluppatore Full Stack"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Tipo Contratto
              </label>
              <select
                name="position_type"
                value={formData.position_type}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Contract">Contratto</option>
                <option value="Freelance">Freelance</option>
                <option value="Internship">Stage</option>
              </select>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Descrizione e Requisiti
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows={6}
              placeholder="Descrivi la posizione, responsabilità, requisiti..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="grid md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Salario Min (€)
              </label>
              <input
                type="number"
                name="salary_min"
                value={formData.salary_min}
                onChange={handleChange}
                min="0"
                step="1000"
                placeholder="30000"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Salario Max (€)
              </label>
              <input
                type="number"
                name="salary_max"
                value={formData.salary_max}
                onChange={handleChange}
                min="0"
                step="1000"
                placeholder="50000"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Livello Esperienza
              </label>
              <select
                name="experience_level"
                value={formData.experience_level}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="Junior">Junior</option>
                <option value="Mid">Mid</option>
                <option value="Senior">Senior</option>
                <option value="Lead">Lead</option>
              </select>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Titolo di Studio
            </label>
            <select
              name="education_level"
              value={formData.education_level}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Non specificato</option>
              <option value="Nessuno">Nessun titolo richiesto</option>
              <option value="Licenza Media">Licenza Media</option>
              <option value="Diploma">Diploma</option>
              <option value="Laurea Triennale">Laurea Triennale</option>
              <option value="Laurea Magistrale">Laurea Magistrale</option>
              <option value="Master/Dottorato">Master/Dottorato</option>
            </select>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Località
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                required
                placeholder="Es. Milano, Remoto"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Data Scadenza
              </label>
              <input
                type="date"
                name="expires_at"
                value={formData.expires_at}
                onChange={handleChange}
                required
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Competenze Richieste (separate da virgola)
              </label>
              <input
                type="text"
                name="required_skills"
                value={formData.required_skills}
                onChange={handleChange}
                placeholder="Es. React, Node.js, PostgreSQL"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              {editingId ? 'Aggiorna Annuncio' : 'Pubblica Annuncio'}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="px-6 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
            >
              Annulla
            </button>
          </div>
        </form>
      )}

      {jobPostings.length === 0 ? (
        <p className="text-gray-600 text-center py-8">Nessun annuncio pubblicato</p>
      ) : (
        <div className="space-y-4">
          {jobPostings.map((posting) => (
            <div
              key={posting.id}
              className={`border-2 rounded-lg p-6 transition-colors ${
                posting.status === 'active'
                  ? 'border-green-200 bg-green-50'
                  : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-bold text-xl text-gray-900">{posting.title}</h3>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        posting.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {posting.status === 'active' ? 'Attivo' : 'Chiuso'}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 text-sm text-gray-600 mb-2">
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
                      {posting.position_type}
                    </span>
                    <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full font-medium">
                      {posting.experience_level}
                    </span>
                    {posting.education_level && (
                      <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full font-medium">
                        {posting.education_level}
                      </span>
                    )}
                    <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full font-medium">
                      {posting.location}
                    </span>
                  </div>
                  {(posting.salary_min || posting.salary_max) && (
                    <p className="text-sm font-semibold text-green-700">
                      Salario: {posting.salary_min?.toLocaleString()} - {posting.salary_max?.toLocaleString()} {posting.salary_currency}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(posting)}
                    className="text-blue-600 hover:text-blue-700 p-2"
                    title="Modifica"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(posting.id)}
                    className="text-red-600 hover:text-red-700 p-2"
                    title="Elimina"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <p className="text-gray-700 leading-relaxed mb-3 whitespace-pre-line">
                {posting.description}
              </p>

              {posting.required_skills.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-semibold text-gray-700 mb-2">Competenze richieste:</p>
                  <div className="flex flex-wrap gap-2">
                    {posting.required_skills.map((skill, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>Scadenza: {new Date(posting.expires_at).toLocaleDateString('it-IT')}</span>
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    Candidature
                  </span>
                </div>
                <button
                  onClick={() => toggleStatus(posting.id, posting.status)}
                  className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                    posting.status === 'active'
                      ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {posting.status === 'active' ? 'Chiudi' : 'Riattiva'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
