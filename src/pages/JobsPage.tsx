import { useState, useEffect } from 'react';
import { Briefcase, MapPin, DollarSign, Filter, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface JobPosting {
  id: string;
  title: string;
  description: string;
  position_type: string;
  salary_min: number;
  salary_max: number;
  salary_currency: string;
  location: string;
  required_skills: string[];
  experience_level: string;
  published_at: string;
  expires_at: string;
  business: {
    id: string;
    name: string;
  };
}

interface SearchFilters {
  position_type: string;
  experience_level: string;
  location: string;
  searchTerm: string;
}

export function JobsPage() {
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [userApplications, setUserApplications] = useState<string[]>([]);
  const [appliedJobId, setAppliedJobId] = useState<string | null>(null);
  const { user, profile } = useAuth();

  const [filters, setFilters] = useState<SearchFilters>({
    position_type: '',
    experience_level: '',
    location: '',
    searchTerm: '',
  });

  useEffect(() => {
    loadJobs();
    if (user) {
      loadUserApplications();
    }
  }, [user]);

  useEffect(() => {
    loadJobs();
  }, [filters]);

  const loadJobs = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('job_postings')
        .select(`
          *,
          business:businesses(id, name)
        `)
        .eq('status', 'active')
        .gt('expires_at', new Date().toISOString())
        .order('published_at', { ascending: false });

      if (filters.position_type) {
        query = query.eq('position_type', filters.position_type);
      }

      if (filters.experience_level) {
        query = query.eq('experience_level', filters.experience_level);
      }

      if (filters.location) {
        query = query.ilike('location', `%${filters.location}%`);
      }

      if (filters.searchTerm) {
        query = query.or(`title.ilike.%${filters.searchTerm}%,description.ilike.%${filters.searchTerm}%`);
      }

      const { data } = await query;
      setJobs(data || []);
    } catch (error) {
      console.error('Error loading jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserApplications = async () => {
    try {
      const { data } = await supabase
        .from('job_applications')
        .select('job_posting_id')
        .eq('user_id', user?.id);

      setUserApplications(data?.map(a => a.job_posting_id) || []);
    } catch (error) {
      console.error('Error loading applications:', error);
    }
  };

  const handleApply = async (jobId: string) => {
    if (!user) {
      alert('Devi accedere per candidarti');
      return;
    }

    if (profile?.user_type === 'business') {
      alert('Solo gli utenti privati possono candidarsi');
      return;
    }

    try {
      setAppliedJobId(jobId);
      const { error } = await supabase
        .from('job_applications')
        .insert({
          job_posting_id: jobId,
          user_id: user.id,
        });

      if (error) throw error;

      setUserApplications([...userApplications, jobId]);
      alert('Candidatura inviata con successo!');
    } catch (error: any) {
      if (error.code === '23505') {
        alert('Ti sei già candidato a questo annuncio');
      } else {
        alert('Errore durante l\'invio della candidatura');
      }
    } finally {
      setAppliedJobId(null);
    }
  };

  const handleReset = () => {
    setFilters({
      position_type: '',
      experience_level: '',
      location: '',
      searchTerm: '',
    });
  };

  const hasActiveFilters = filters.position_type || filters.experience_level || filters.location || filters.searchTerm;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-green-600 to-green-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-4">
            <Briefcase className="w-10 h-10" />
            <h1 className="text-5xl font-bold">Opportunità di Lavoro</h1>
          </div>
          <p className="text-green-100 text-lg">
            Trova le migliori opportunità lavorative nelle aziende registrate
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <input
              type="text"
              placeholder="Cerca per titolo o descrizione..."
              value={filters.searchTerm}
              onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors mb-6 ${
              showFilters || hasActiveFilters
                ? 'bg-green-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            <Filter className="w-5 h-5" />
            <span>Filtri</span>
            {hasActiveFilters && (
              <span className="ml-2 px-2 py-0.5 bg-white text-green-600 text-xs rounded-full font-medium">
                {[filters.position_type, filters.experience_level, filters.location].filter(Boolean).length}
              </span>
            )}
          </button>

          {showFilters && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo di Posizione
                  </label>
                  <select
                    value={filters.position_type}
                    onChange={(e) => setFilters({ ...filters, position_type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="">Tutti</option>
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Contract">Contract</option>
                    <option value="Freelance">Freelance</option>
                    <option value="Internship">Tirocinio</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Livello di Esperienza
                  </label>
                  <select
                    value={filters.experience_level}
                    onChange={(e) => setFilters({ ...filters, experience_level: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="">Tutti</option>
                    <option value="Junior">Junior</option>
                    <option value="Mid">Mid</option>
                    <option value="Senior">Senior</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Città
                  </label>
                  <input
                    type="text"
                    placeholder="Es. Milano, Roma..."
                    value={filters.location}
                    onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>

              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <X className="w-4 h-4" />
                Azzera Filtri
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          </div>
        ) : jobs.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">Nessuna opportunità trovata</p>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => (
              <div key={job.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{job.title}</h3>
                    <p className="text-gray-600 font-medium">{job.business.name}</p>
                  </div>
                  <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                    {job.position_type}
                  </span>
                </div>

                <p className="text-gray-700 mb-4 line-clamp-2">{job.description}</p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">{job.location}</span>
                  </div>
                  {job.salary_min && job.salary_max && (
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        {job.salary_min} - {job.salary_max} {job.salary_currency}
                      </span>
                    </div>
                  )}
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Esperienza:</span> {job.experience_level}
                  </div>
                  {job.required_skills.length > 0 && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">{job.required_skills.length} skills</span>
                    </div>
                  )}
                </div>

                {job.required_skills.length > 0 && (
                  <div className="mb-4 flex flex-wrap gap-2">
                    {job.required_skills.map((skill) => (
                      <span key={skill} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                        {skill}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    Scade il {new Date(job.expires_at).toLocaleDateString('it-IT')}
                  </span>
                  <button
                    onClick={() => handleApply(job.id)}
                    disabled={userApplications.includes(job.id) || appliedJobId === job.id || !user || profile?.user_type === 'business'}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      userApplications.includes(job.id)
                        ? 'bg-gray-300 text-gray-700 cursor-not-allowed'
                        : 'bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-400'
                    }`}
                  >
                    {userApplications.includes(job.id) ? 'Già candidato' : appliedJobId === job.id ? 'Candidatura...' : 'Candidati'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
