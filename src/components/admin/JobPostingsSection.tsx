import { useState, useEffect } from 'react';
import { Briefcase, MapPin, Trash2, Filter, Calendar, Euro, Eye, Search, Users, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface JobPosting {
  id: string;
  title: string;
  description: string;
  salary_range: string | null;
  gross_annual_salary: number | null;
  location: string;
  status: string;
  position_type: string;
  experience_level: string;
  created_at: string;
  expires_at: string;
  published_at: string;
  business_location: {
    name: string;
    business: {
      profile: {
        full_name: string;
        nickname: string | null;
        email: string;
      } | null;
    } | null;
  } | null;
}

interface JobSeeker {
  id: string;
  title: string;
  description: string;
  desired_salary_min: number | null;
  desired_salary_max: number | null;
  location: string;
  status: string;
  contract_type: string;
  experience_years: number;
  education_level: string | null;
  created_at: string;
  profile: {
    full_name: string;
    nickname: string | null;
    email: string;
  } | null;
  family_member: {
    nickname: string;
  } | null;
  category: {
    name: string;
  } | null;
}

interface JobPostingsSectionProps {
  jobPostings: JobPosting[];
  onReload: () => Promise<void>;
}

type JobType = 'all' | 'trova' | 'cerca';
type StatusFilter = 'all' | 'active' | 'closed' | 'draft';

export function JobPostingsSection({ jobPostings: initialJobPostings, onReload }: JobPostingsSectionProps) {
  const [jobType, setJobType] = useState<JobType>('all');
  const [filterStatus, setFilterStatus] = useState<StatusFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedJobPosting, setSelectedJobPosting] = useState<JobPosting | null>(null);
  const [selectedJobSeeker, setSelectedJobSeeker] = useState<JobSeeker | null>(null);
  const [jobSeekers, setJobSeekers] = useState<JobSeeker[]>([]);
  const [jobPostings, setJobPostings] = useState<JobPosting[]>(initialJobPostings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await Promise.all([loadJobSeekers(), loadJobPostings()]);
  };

  const loadJobPostings = async () => {
    try {
      const { data, error } = await supabase
        .from('job_postings')
        .select(`
          id,
          title,
          description,
          salary_range,
          gross_annual_salary,
          location,
          status,
          position_type,
          experience_level,
          created_at,
          expires_at,
          published_at,
          business_location:business_locations!job_postings_business_location_id_fkey(
            name,
            business:businesses(
              profile:profiles(full_name, nickname, email)
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setJobPostings(data || []);
    } catch (error: any) {
      console.error('Error loading job postings:', error);
    }
  };

  const loadJobSeekers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('job_seekers')
        .select(`
          id,
          title,
          description,
          desired_salary_min,
          desired_salary_max,
          location,
          status,
          contract_type,
          experience_years,
          education_level,
          created_at,
          user_id,
          family_member_id,
          category_id
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Load related data manually
      const enrichedData = await Promise.all((data || []).map(async (seeker) => {
        let profile = null;
        let family_member = null;
        let category = null;

        // Load profile
        if (seeker.user_id) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name, nickname, email')
            .eq('id', seeker.user_id)
            .maybeSingle();
          profile = profileData;
        }

        // Load family member
        if (seeker.family_member_id) {
          const { data: familyData } = await supabase
            .from('customer_family_members')
            .select('nickname')
            .eq('id', seeker.family_member_id)
            .maybeSingle();
          family_member = familyData;
        }

        // Load category
        if (seeker.category_id) {
          const { data: categoryData } = await supabase
            .from('business_categories')
            .select('name')
            .eq('id', seeker.category_id)
            .maybeSingle();
          category = categoryData;
        }

        return { ...seeker, profile, family_member, category };
      }));

      setJobSeekers(enrichedData);
    } catch (error: any) {
      console.error('Error loading job seekers:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredJobPostings = jobPostings.filter(job => {
    const matchesStatus = filterStatus === 'all' || job.status === filterStatus;
    const matchesSearch = searchTerm === '' ||
      job.business_location?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.title.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const filteredJobSeekers = jobSeekers.filter(seeker => {
    const matchesStatus = filterStatus === 'all' || seeker.status === filterStatus;
    const username = seeker.family_member?.nickname || seeker.profile?.nickname || seeker.profile?.full_name || '';
    const matchesSearch = searchTerm === '' ||
      username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      seeker.title.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleUpdateJobPostingStatus = async (jobId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('job_postings')
        .update({ status: newStatus })
        .eq('id', jobId);

      if (error) throw error;

      alert('Stato offerta aggiornato');
      await loadJobPostings();
    } catch (error: any) {
      console.error('Error updating job posting:', error);
      alert(`Errore: ${error.message}`);
    }
  };

  const handleUpdateJobSeekerStatus = async (seekerId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('job_seekers')
        .update({ status: newStatus })
        .eq('id', seekerId);

      if (error) throw error;

      alert('Stato annuncio cerca lavoro aggiornato');
      await loadJobSeekers();
    } catch (error: any) {
      console.error('Error updating job seeker:', error);
      alert(`Errore: ${error.message}`);
    }
  };

  const deleteJobPosting = async (jobId: string) => {
    if (!confirm('Sei sicuro di voler eliminare definitivamente questa offerta di lavoro? Questa azione è irreversibile.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('job_postings')
        .delete()
        .eq('id', jobId);

      if (error) throw error;

      alert('Offerta di lavoro eliminata con successo');
      await loadJobPostings();
    } catch (error: any) {
      console.error('Error deleting job posting:', error);
      alert(`Errore: ${error.message}`);
    }
  };

  const deleteJobSeeker = async (seekerId: string) => {
    if (!confirm('Sei sicuro di voler eliminare definitivamente questo annuncio cerca lavoro? Questa azione è irreversibile.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('job_seekers')
        .delete()
        .eq('id', seekerId);

      if (error) throw error;

      alert('Annuncio cerca lavoro eliminato con successo');
      await loadJobSeekers();
    } catch (error: any) {
      console.error('Error deleting job seeker:', error);
      alert(`Errore: ${error.message}`);
    }
  };

  const displayedJobPostings = jobType === 'cerca' ? [] : filteredJobPostings;
  const displayedJobSeekers = jobType === 'trova' ? [] : filteredJobSeekers;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Gestione Lavoro</h2>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Cerca per nome azienda o utente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-gray-600" />
            <select
              value={jobType}
              onChange={(e) => setJobType(e.target.value as JobType)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tutti gli annunci</option>
              <option value="trova">Solo trova lavoro (aziende)</option>
              <option value="cerca">Solo cerca lavoro (utenti)</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-600" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as StatusFilter)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tutti gli stati</option>
              <option value="active">Attivi</option>
              <option value="closed">Chiusi</option>
              <option value="draft">Bozze</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-2xl font-bold text-blue-600">{jobPostings.filter(j => j.status === 'active').length}</p>
            <p className="text-sm text-gray-600">Trova Lavoro Attive</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-2xl font-bold text-green-600">{jobSeekers.filter(s => s.status === 'active').length}</p>
            <p className="text-sm text-gray-600">Cerca Lavoro Attivi</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-2xl font-bold text-gray-600">{jobPostings.filter(j => j.status === 'closed').length}</p>
            <p className="text-sm text-gray-600">Trova Lavoro Chiuse</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-2xl font-bold text-gray-600">{jobSeekers.filter(s => s.status === 'closed').length}</p>
            <p className="text-sm text-gray-600">Cerca Lavoro Chiusi</p>
          </div>
        </div>
      </div>

      {jobType !== 'cerca' && (
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-blue-600" />
            Trova Lavoro - Annunci Aziende ({displayedJobPostings.length})
          </h3>

          {displayedJobPostings.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Nessuna offerta di lavoro trovata</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {displayedJobPostings.map((job) => {
                const businessOwner = job.business_location?.business?.profile;
                const ownerName = businessOwner?.nickname || businessOwner?.full_name || 'Azienda';

                return (
                  <div key={job.id} className="bg-white rounded-lg shadow border border-blue-200 p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span
                            className={`px-3 py-1 text-xs rounded-full font-medium ${
                              job.status === 'active'
                                ? 'bg-green-100 text-green-800'
                                : job.status === 'closed'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {job.status}
                          </span>
                        </div>
                        <h3 className="font-bold text-lg text-gray-900 mb-2">{job.title}</h3>
                        {job.business_location && (
                          <p className="text-sm text-blue-600 mb-2 font-medium flex items-center gap-1">
                            <Briefcase className="w-4 h-4" />
                            {job.business_location.name}
                          </p>
                        )}
                        {businessOwner && (
                          <p className="text-xs text-gray-600 mb-2">
                            Creato da: <span className="font-bold text-gray-900">{ownerName}</span>
                            {businessOwner.email && <span className="text-gray-500"> • {businessOwner.email}</span>}
                          </p>
                        )}
                      </div>
                    </div>

                  <p className="text-gray-700 mb-4 line-clamp-3">{job.description}</p>

                  <div className="space-y-2 mb-4 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span>{job.location}</span>
                    </div>
                    {job.gross_annual_salary && (
                      <div className="flex items-center gap-2 text-green-600 font-semibold">
                        <Euro className="w-4 h-4" />
                        <span>€{job.gross_annual_salary.toLocaleString()}/anno</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>Scade: {new Date(job.expires_at).toLocaleDateString('it-IT')}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 mb-3">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                      {job.position_type}
                    </span>
                    <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                      {job.experience_level}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedJobPosting(job)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm"
                    >
                      <Eye className="w-4 h-4" />
                      Dettagli
                    </button>
                    <select
                      value={job.status}
                      onChange={(e) => handleUpdateJobPostingStatus(job.id, e.target.value)}
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    >
                      <option value="active">Attiva</option>
                      <option value="closed">Chiusa</option>
                      <option value="draft">Bozza</option>
                    </select>
                    <button
                      onClick={() => deleteJobPosting(job.id)}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {jobType !== 'trova' && (
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="w-6 h-6 text-green-600" />
            Cerca Lavoro - Annunci Utenti ({displayedJobSeekers.length})
          </h3>

          {loading ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">Caricamento...</p>
            </div>
          ) : displayedJobSeekers.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Nessun annuncio cerca lavoro trovato</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {displayedJobSeekers.map((seeker) => {
                const displayName = seeker.family_member?.nickname || seeker.profile?.nickname || seeker.profile?.full_name || 'Utente';

                return (
                  <div key={seeker.id} className="bg-white rounded-lg shadow border border-green-200 p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span
                            className={`px-3 py-1 text-xs rounded-full font-medium ${
                              seeker.status === 'active'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {seeker.status}
                          </span>
                        </div>
                        <h3 className="font-bold text-lg text-gray-900 mb-2">{seeker.title}</h3>
                        <p className="text-sm text-green-600 mb-2 font-medium flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span className="font-bold text-gray-900">{displayName}</span>
                        </p>
                        {seeker.profile?.email && (
                          <p className="text-xs text-gray-600 mb-2">{seeker.profile.email}</p>
                        )}
                        {seeker.category && (
                          <p className="text-xs text-gray-500">{seeker.category.name}</p>
                        )}
                      </div>
                    </div>

                    <p className="text-gray-700 mb-4 line-clamp-3">{seeker.description}</p>

                    <div className="space-y-2 mb-4 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span>{seeker.location}</span>
                      </div>
                      {(seeker.desired_salary_min || seeker.desired_salary_max) && (
                        <div className="flex items-center gap-2 text-green-600 font-semibold">
                          <Euro className="w-4 h-4" />
                          <span>
                            {seeker.desired_salary_min && seeker.desired_salary_max
                              ? `€${seeker.desired_salary_min.toLocaleString()} - €${seeker.desired_salary_max.toLocaleString()}`
                              : seeker.desired_salary_min
                              ? `Da €${seeker.desired_salary_min.toLocaleString()}`
                              : `Fino a €${seeker.desired_salary_max?.toLocaleString()}`}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>Pubblicato: {new Date(seeker.created_at).toLocaleDateString('it-IT')}</span>
                      </div>
                    </div>

                    <div className="flex gap-2 mb-3">
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                        {seeker.contract_type}
                      </span>
                      <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                        {seeker.experience_years} {seeker.experience_years === 1 ? 'anno' : 'anni'} exp.
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedJobSeeker(seeker)}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 text-sm"
                      >
                        <Eye className="w-4 h-4" />
                        Dettagli
                      </button>
                      <select
                        value={seeker.status}
                        onChange={(e) => handleUpdateJobSeekerStatus(seeker.id, e.target.value)}
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      >
                        <option value="active">Attivo</option>
                        <option value="closed">Chiuso</option>
                      </select>
                      <button
                        onClick={() => deleteJobSeeker(seeker.id)}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {selectedJobPosting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">Dettagli Offerta Lavoro</h3>
              <button
                onClick={() => setSelectedJobPosting(null)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <h4 className="text-2xl font-bold mb-2">{selectedJobPosting.title}</h4>
                {selectedJobPosting.business_location && (
                  <p className="text-lg text-blue-600 mb-2 font-medium">
                    {selectedJobPosting.business_location.name}
                  </p>
                )}
                {selectedJobPosting.business_location?.business?.profile && (
                  <p className="text-sm text-gray-600 mb-2">
                    Creato da: <span className="font-bold text-gray-900">
                      {selectedJobPosting.business_location.business.profile.nickname ||
                       selectedJobPosting.business_location.business.profile.full_name}
                    </span>
                    {selectedJobPosting.business_location.business.profile.email && (
                      <span className="text-gray-500"> • {selectedJobPosting.business_location.business.profile.email}</span>
                    )}
                  </p>
                )}
                <span
                  className={`px-3 py-1 text-xs rounded-full font-medium ${
                    selectedJobPosting.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : selectedJobPosting.status === 'closed'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {selectedJobPosting.status}
                </span>
              </div>

              <div>
                <h5 className="font-semibold text-gray-900 mb-2">Descrizione:</h5>
                <p className="text-gray-700 whitespace-pre-wrap">{selectedJobPosting.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Località:</span>
                  <p className="font-medium">{selectedJobPosting.location}</p>
                </div>
                <div>
                  <span className="text-gray-600">Tipo Posizione:</span>
                  <p className="font-medium">{selectedJobPosting.position_type}</p>
                </div>
                <div>
                  <span className="text-gray-600">Livello Esperienza:</span>
                  <p className="font-medium">{selectedJobPosting.experience_level}</p>
                </div>
                {selectedJobPosting.gross_annual_salary && (
                  <div>
                    <span className="text-gray-600">Stipendio Annuo:</span>
                    <p className="font-medium text-green-600">€{selectedJobPosting.gross_annual_salary.toLocaleString()}</p>
                  </div>
                )}
                <div>
                  <span className="text-gray-600">Pubblicato il:</span>
                  <p className="font-medium">{new Date(selectedJobPosting.published_at).toLocaleDateString('it-IT')}</p>
                </div>
                <div>
                  <span className="text-gray-600">Scade il:</span>
                  <p className="font-medium">{new Date(selectedJobPosting.expires_at).toLocaleDateString('it-IT')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedJobSeeker && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-green-600 to-green-700 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">Dettagli Cerca Lavoro</h3>
              <button
                onClick={() => setSelectedJobSeeker(null)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <h4 className="text-2xl font-bold mb-2">{selectedJobSeeker.title}</h4>
                <p className="text-lg text-green-600 mb-2 font-medium">
                  {selectedJobSeeker.family_member?.nickname || selectedJobSeeker.profile?.nickname || selectedJobSeeker.profile?.full_name}
                </p>
                {selectedJobSeeker.profile?.email && (
                  <p className="text-sm text-gray-600 mb-2">{selectedJobSeeker.profile.email}</p>
                )}
                <span
                  className={`px-3 py-1 text-xs rounded-full font-medium ${
                    selectedJobSeeker.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {selectedJobSeeker.status}
                </span>
              </div>

              <div>
                <h5 className="font-semibold text-gray-900 mb-2">Descrizione:</h5>
                <p className="text-gray-700 whitespace-pre-wrap">{selectedJobSeeker.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Località:</span>
                  <p className="font-medium">{selectedJobSeeker.location}</p>
                </div>
                <div>
                  <span className="text-gray-600">Tipo Contratto:</span>
                  <p className="font-medium">{selectedJobSeeker.contract_type}</p>
                </div>
                <div>
                  <span className="text-gray-600">Anni Esperienza:</span>
                  <p className="font-medium">{selectedJobSeeker.experience_years} {selectedJobSeeker.experience_years === 1 ? 'anno' : 'anni'}</p>
                </div>
                {selectedJobSeeker.education_level && (
                  <div>
                    <span className="text-gray-600">Titolo di Studio:</span>
                    <p className="font-medium">{selectedJobSeeker.education_level}</p>
                  </div>
                )}
                {selectedJobSeeker.category && (
                  <div>
                    <span className="text-gray-600">Categoria:</span>
                    <p className="font-medium">{selectedJobSeeker.category.name}</p>
                  </div>
                )}
                {(selectedJobSeeker.desired_salary_min || selectedJobSeeker.desired_salary_max) && (
                  <div>
                    <span className="text-gray-600">Stipendio Desiderato:</span>
                    <p className="font-medium text-green-600">
                      {selectedJobSeeker.desired_salary_min && selectedJobSeeker.desired_salary_max
                        ? `€${selectedJobSeeker.desired_salary_min.toLocaleString()} - €${selectedJobSeeker.desired_salary_max.toLocaleString()}`
                        : selectedJobSeeker.desired_salary_min
                        ? `Da €${selectedJobSeeker.desired_salary_min.toLocaleString()}`
                        : `Fino a €${selectedJobSeeker.desired_salary_max?.toLocaleString()}`}
                    </p>
                  </div>
                )}
                <div>
                  <span className="text-gray-600">Pubblicato il:</span>
                  <p className="font-medium">{new Date(selectedJobSeeker.created_at).toLocaleDateString('it-IT')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
