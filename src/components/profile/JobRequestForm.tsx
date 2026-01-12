import { useState, useEffect } from 'react';
import { Briefcase, Plus, X, Edit, Trash2, User, Users } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { SearchableSelect } from '../common/SearchableSelect';

interface JobRequest {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  employment_type: string;
  experience_years: number;
  active: boolean;
  created_at: string;
  family_member_id: string | null;
}

interface FamilyMember {
  id: string;
  first_name: string;
  last_name: string;
  nickname: string;
  avatar_url: string | null;
}

interface JobRequestFormProps {
  customerId: string;
  familyMemberId?: string;
}

export function JobRequestForm({ customerId, familyMemberId }: JobRequestFormProps) {
  const [jobRequests, setJobRequests] = useState<JobRequest[]>([]);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    location: '',
    employment_type: 'full-time',
    experience_years: 0,
    active: true,
  });

  useEffect(() => {
    loadData();
  }, [customerId]);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([loadJobRequests(), loadFamilyMembers()]);
    setLoading(false);
  };

  const loadJobRequests = async () => {
    try {
      let query = supabase
        .from('job_requests')
        .select('*')
        .eq('customer_id', customerId);

      if (familyMemberId) {
        query = query.eq('family_member_id', familyMemberId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setJobRequests(data || []);
    } catch (error) {
      console.error('Error loading job requests:', error);
    }
  };

  const loadFamilyMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('customer_family_members')
        .select('id, first_name, last_name, nickname, avatar_url')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setFamilyMembers(data || []);
    } catch (error) {
      console.error('Error loading family members:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingId) {
        const { error } = await supabase
          .from('job_requests')
          .update(formData)
          .eq('id', editingId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('job_requests')
          .insert({
            customer_id: customerId,
            family_member_id: familyMemberId || (showForm === 'main' ? null : showForm),
            ...formData,
          });

        if (error) throw error;
      }

      resetForm();
      loadJobRequests();
    } catch (error) {
      console.error('Error saving job request:', error);
      alert('Errore durante il salvataggio');
    }
  };

  const handleEdit = (jobRequest: JobRequest) => {
    setFormData({
      title: jobRequest.title,
      description: jobRequest.description,
      category: jobRequest.category,
      location: jobRequest.location,
      employment_type: jobRequest.employment_type,
      experience_years: jobRequest.experience_years,
      active: jobRequest.active,
    });
    setEditingId(jobRequest.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo annuncio?')) return;

    try {
      const { error } = await supabase
        .from('job_requests')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadJobRequests();
    } catch (error) {
      console.error('Error deleting job request:', error);
    }
  };

  const toggleActive = async (id: string, currentActive: boolean) => {
    try {
      const { error } = await supabase
        .from('job_requests')
        .update({ active: !currentActive })
        .eq('id', id);

      if (error) throw error;
      loadJobRequests();
    } catch (error) {
      console.error('Error toggling job request:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: '',
      location: '',
      employment_type: 'full-time',
      experience_years: 0,
      active: true,
    });
    setEditingId(null);
    setShowForm(null);
  };

  const renderJobRequestSection = (memberId: string | null, memberName: string, avatar?: string | null) => {
    const memberRequests = jobRequests.filter(
      req => (memberId === null && req.family_member_id === null) || req.family_member_id === memberId
    );
    const isFormOpen = showForm === (memberId || 'main');

    return (
      <div key={memberId || 'main'} className="bg-white rounded-xl shadow-md p-8 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            {avatar ? (
              <img src={avatar} alt={memberName} className="w-12 h-12 rounded-full object-cover" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                {memberId ? (
                  <Users className="w-6 h-6 text-blue-600" />
                ) : (
                  <User className="w-6 h-6 text-blue-600" />
                )}
              </div>
            )}
            <div>
              <h3 className="text-xl font-bold text-gray-900">{memberName}</h3>
              <p className="text-sm text-gray-600">
                {memberRequests.length} {memberRequests.length === 1 ? 'annuncio' : 'annunci'}
              </p>
            </div>
          </div>
          {!isFormOpen && (
            <button
              onClick={() => setShowForm(memberId || 'main')}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              <Plus className="w-5 h-5" />
              Nuovo Annuncio
            </button>
          )}
        </div>

      {isFormOpen && (
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
                placeholder="Es. Sviluppatore Web, Designer, ecc."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Categoria
              </label>
              <input
                type="text"
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                placeholder="Es. Tecnologia, Marketing, ecc."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Descrizione
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows={4}
              placeholder="Descrivi le tue competenze, esperienza e cosa stai cercando..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Localita
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
                Tipo Contratto
              </label>
              <SearchableSelect
                name="employment_type"
                value={formData.employment_type}
                onChange={(value) => setFormData(prev => ({ ...prev, employment_type: value }))}
                required
                options={[
                  { value: 'full-time', label: 'Full-time' },
                  { value: 'part-time', label: 'Part-time' },
                  { value: 'contract', label: 'Contratto' },
                  { value: 'freelance', label: 'Freelance' },
                  { value: 'internship', label: 'Stage' },
                ]}
                placeholder="Seleziona tipo contratto"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Anni di Esperienza
              </label>
              <input
                type="number"
                name="experience_years"
                value={formData.experience_years}
                onChange={handleChange}
                required
                min="0"
                max="50"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              {editingId ? 'Aggiorna Annuncio' : 'Crea Annuncio'}
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

      {memberRequests.length === 0 ? (
        <p className="text-gray-600 text-center py-8">Nessun annuncio creato</p>
      ) : (
        <div className="space-y-4">
          {memberRequests.map((jobRequest) => (
            <div
              key={jobRequest.id}
              className={`border-2 rounded-lg p-6 transition-colors ${
                jobRequest.active
                  ? 'border-blue-200 bg-blue-50'
                  : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-bold text-xl text-gray-900">{jobRequest.title}</h3>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        jobRequest.active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {jobRequest.active ? 'Attivo' : 'Non attivo'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">
                    {jobRequest.category} • {jobRequest.location} • {jobRequest.employment_type}
                  </p>
                  <p className="text-sm text-gray-600">
                    {jobRequest.experience_years} {jobRequest.experience_years === 1 ? 'anno' : 'anni'} di esperienza
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(jobRequest)}
                    className="text-blue-600 hover:text-blue-700 p-2"
                    title="Modifica"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(jobRequest.id)}
                    className="text-red-600 hover:text-red-700 p-2"
                    title="Elimina"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <p className="text-gray-700 leading-relaxed mb-4">{jobRequest.description}</p>

              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                  Creato il {new Date(jobRequest.created_at).toLocaleDateString('it-IT')}
                </p>
                <button
                  onClick={() => toggleActive(jobRequest.id, jobRequest.active)}
                  className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                    jobRequest.active
                      ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {jobRequest.active ? 'Disattiva' : 'Attiva'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-md p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    );
  }

  if (familyMemberId) {
    const selectedMember = familyMembers.find(m => m.id === familyMemberId);
    if (!selectedMember) return null;

    return (
      <div>
        <div className="border-t-4 border-blue-500 bg-gradient-to-r from-blue-50 to-white rounded-lg p-4 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Briefcase className="w-7 h-7 text-blue-600" />
            Annunci "Cerco Lavoro"
          </h2>
          <p className="text-sm text-gray-600 mt-1">Gestisci gli annunci di ricerca lavoro</p>
        </div>

        {renderJobRequestSection(selectedMember.id, selectedMember.nickname, selectedMember.avatar_url)}
      </div>
    );
  }

  return (
    <div>
      <div className="border-t-4 border-blue-500 bg-gradient-to-r from-blue-50 to-white rounded-lg p-4 mb-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Briefcase className="w-7 h-7 text-blue-600" />
          Annunci "Cerco Lavoro"
        </h2>
        <p className="text-sm text-gray-600 mt-1">Gestisci gli annunci per te e i tuoi familiari</p>
      </div>

      {renderJobRequestSection(null, 'Account Principale')}

      {familyMembers.map((member) =>
        renderJobRequestSection(member.id, member.nickname, member.avatar_url)
      )}
    </div>
  );
}
