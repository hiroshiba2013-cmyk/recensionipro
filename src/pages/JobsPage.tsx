import { useState, useEffect } from 'react';
import { Briefcase, MapPin, DollarSign, Filter, X, Check, MessageCircle, Plus, Building2, UserCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { SearchableSelect } from '../components/common/SearchableSelect';
import { JobSeekerForm } from '../components/jobs/JobSeekerForm';
import { JobSeekerCard } from '../components/jobs/JobSeekerCard';
import { JobConversation } from '../components/jobs/JobConversation';
import { FavoriteButton } from '../components/favorites/FavoriteButton';
import { LocationFilters } from '../components/common/LocationFilters';

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
  company_name: string | null;
  gross_annual_salary: number | null;
  benefits: string[];
  remote_work: boolean;
  business: {
    id: string;
    name: string;
    owner_id: string;
  } | null;
}

interface JobSeeker {
  id: string;
  user_id: string;
  title: string;
  description: string;
  skills: string[];
  contract_type: string;
  desired_salary_min: number | null;
  desired_salary_max: number | null;
  salary_currency: string;
  location: string;
  available_from: string | null;
  experience_years: number;
  education_level: string | null;
  phone: string | null;
  email: string | null;
  created_at: string;
  profiles: {
    full_name: string;
    nickname: string;
  };
  business_categories: {
    name: string;
  } | null;
}

interface SearchFilters {
  position_type: string;
  experience_level: string;
  region: string;
  province: string;
  city: string;
  searchTerm: string;
  salary_min: string;
  salary_max: string;
  remote_work: string;
  education_level: string;
  skill: string;
  category: string;
}

export function JobsPage() {
  const [activeTab, setActiveTab] = useState<'offers' | 'seekers'>('offers');
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [jobSeekers, setJobSeekers] = useState<JobSeeker[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [showJobSeekerForm, setShowJobSeekerForm] = useState(false);
  const [userApplications, setUserApplications] = useState<string[]>([]);
  const [viewedJobs, setViewedJobs] = useState<string[]>([]);
  const [appliedJobId, setAppliedJobId] = useState<string | null>(null);
  const [markingAsViewed, setMarkingAsViewed] = useState<string | null>(null);
  const [conversationData, setConversationData] = useState<{
    conversationId: string;
    type: 'job_seeker' | 'job_offer';
    otherUserName: string;
  } | null>(null);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const { user, profile, selectedBusinessLocationId, activeProfile } = useAuth();

  const [filters, setFilters] = useState<SearchFilters>({
    position_type: '',
    experience_level: '',
    region: '',
    province: '',
    city: '',
    searchTerm: '',
    salary_min: '',
    salary_max: '',
    remote_work: '',
    education_level: '',
    skill: '',
    category: '',
  });

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (activeTab === 'offers') {
      loadJobs();
      if (user) {
        loadUserApplications();
        loadViewedJobs();
      }
    } else {
      loadJobSeekers();
    }
  }, [activeTab, user, filters, selectedBusinessLocationId]);

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

  const loadJobs = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('job_postings')
        .select(`
          *,
          business:businesses(id, name, owner_id)
        `)
        .eq('status', 'active')
        .gt('expires_at', new Date().toISOString());

      if (selectedBusinessLocationId) {
        query = query.eq('business_location_id', selectedBusinessLocationId);
      }

      if (filters.position_type) {
        query = query.eq('position_type', filters.position_type);
      }

      if (filters.experience_level) {
        query = query.eq('experience_level', filters.experience_level);
      }

      if (filters.region) {
        query = query.ilike('region', `%${filters.region}%`);
      }

      if (filters.province) {
        query = query.ilike('province', `%${filters.province}%`);
      }

      if (filters.city) {
        query = query.ilike('city', `%${filters.city}%`);
      }

      if (filters.searchTerm) {
        query = query.or(`title.ilike.%${filters.searchTerm}%,description.ilike.%${filters.searchTerm}%`);
      }

      if (filters.salary_min) {
        query = query.gte('gross_annual_salary', parseInt(filters.salary_min));
      }

      if (filters.salary_max) {
        query = query.lte('gross_annual_salary', parseInt(filters.salary_max));
      }

      if (filters.remote_work) {
        query = query.eq('remote_work', filters.remote_work === 'true');
      }

      if (filters.skill) {
        query = query.contains('required_skills', [filters.skill]);
      }

      if (filters.category) {
        query = query.eq('category_id', filters.category);
      }

      const { data } = await query;

      if (data) {
        const businessIds = [...new Set(data.map(job => job.business?.id).filter(Boolean))];

        const reviewCounts = await Promise.all(
          businessIds.map(async (businessId) => {
            const { count } = await supabase
              .from('reviews')
              .select('id', { count: 'exact', head: true })
              .eq('business_id', businessId)
              .eq('status', 'approved');

            return { businessId, count: count || 0 };
          })
        );

        const reviewCountMap = Object.fromEntries(
          reviewCounts.map(({ businessId, count }) => [businessId, count])
        );

        const sortedJobs = [...data].sort((a, b) => {
          const countA = reviewCountMap[a.business?.id || ''] || 0;
          const countB = reviewCountMap[b.business?.id || ''] || 0;

          if (countB !== countA) {
            return countB - countA;
          }

          return new Date(b.published_at).getTime() - new Date(a.published_at).getTime();
        });

        setJobs(sortedJobs);
      } else {
        setJobs([]);
      }
    } catch (error) {
      console.error('Error loading jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadJobSeekers = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('job_seekers')
        .select(`
          *,
          profiles!inner(full_name, nickname),
          business_categories(name)
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (filters.position_type) {
        query = query.eq('contract_type', filters.position_type);
      }

      if (filters.region) {
        query = query.ilike('region', `%${filters.region}%`);
      }

      if (filters.province) {
        query = query.ilike('province', `%${filters.province}%`);
      }

      if (filters.city) {
        query = query.ilike('city', `%${filters.city}%`);
      }

      if (filters.searchTerm) {
        query = query.or(`title.ilike.%${filters.searchTerm}%,description.ilike.%${filters.searchTerm}%`);
      }

      if (filters.salary_min) {
        query = query.gte('desired_salary_min', parseInt(filters.salary_min));
      }

      if (filters.salary_max) {
        query = query.lte('desired_salary_max', parseInt(filters.salary_max));
      }

      if (filters.education_level) {
        query = query.eq('education_level', filters.education_level);
      }

      if (filters.skill) {
        query = query.contains('skills', [filters.skill]);
      }

      if (filters.category) {
        query = query.eq('category_id', filters.category);
      }

      const { data } = await query;
      setJobSeekers(data || []);
    } catch (error) {
      console.error('Error loading job seekers:', error);
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

  const loadViewedJobs = async () => {
    try {
      const { data } = await supabase
        .from('job_views')
        .select('job_posting_id')
        .eq('user_id', user?.id);

      setViewedJobs(data?.map(v => v.job_posting_id) || []);
    } catch (error) {
      console.error('Error loading viewed jobs:', error);
    }
  };

  const handleContactJobSeeker = async (jobSeekerId: string) => {
    if (!user) {
      alert('Devi accedere per contattare');
      return;
    }

    if (profile?.user_type !== 'business') {
      alert('Solo gli utenti professionali possono contattare chi cerca lavoro');
      return;
    }

    try {
      const jobSeeker = jobSeekers.find(js => js.id === jobSeekerId);
      if (!jobSeeker) return;

      const locationId = selectedBusinessLocationId || null;
      const familyMemberId = jobSeeker.family_member_id || null;

      const { data: conversationId, error: funcError } = await supabase
        .rpc('get_or_create_conversation', {
          p_user1_id: user.id,
          p_user2_id: jobSeeker.user_id,
          p_conversation_type: 'job_seeker',
          p_reference_id: jobSeekerId,
          p_user1_location_id: locationId,
          p_user2_family_member_id: familyMemberId,
        });

      if (funcError) throw funcError;

      window.location.href = `/messages?conversation=${conversationId}`;
    } catch (error) {
      console.error('Error creating conversation:', error);
      alert('Errore nell\'apertura della chat');
    }
  };

  const handleContactEmployer = async (jobId: string) => {
    if (!user) {
      alert('Devi accedere per contattare');
      return;
    }

    if (profile?.user_type === 'business') {
      alert('Solo gli utenti privati possono contattare per offerte di lavoro');
      return;
    }

    try {
      const job = jobs.find(j => j.id === jobId);
      if (!job || !job.business) {
        alert('Informazioni sul datore di lavoro non disponibili');
        return;
      }

      const familyMemberId = activeProfile && !activeProfile.isOwner ? activeProfile.id : null;
      const businessLocationId = job.business_location_id || null;

      const { data: conversationId, error: funcError } = await supabase
        .rpc('get_or_create_conversation', {
          p_user1_id: user.id,
          p_user2_id: job.business.owner_id,
          p_conversation_type: 'job_posting',
          p_reference_id: jobId,
          p_user1_family_member_id: familyMemberId,
          p_user2_location_id: businessLocationId,
        });

      if (funcError) throw funcError;

      window.location.href = `/messages?conversation=${conversationId}`;
    } catch (error) {
      console.error('Error creating conversation:', error);
      alert('Errore nell\'apertura della chat');
    }
  };

  const handleMarkAsViewed = async (jobId: string) => {
    if (!user) return;

    try {
      setMarkingAsViewed(jobId);
      const { error } = await supabase
        .from('job_views')
        .insert({
          job_posting_id: jobId,
          user_id: user.id,
        });

      if (error) throw error;
      setViewedJobs([...viewedJobs, jobId]);
    } catch (error: any) {
      if (error.code !== '23505') {
        console.error('Error marking as viewed:', error);
      }
    } finally {
      setMarkingAsViewed(null);
    }
  };

  const handleReset = () => {
    setFilters({
      position_type: '',
      experience_level: '',
      region: '',
      province: '',
      city: '',
      searchTerm: '',
      salary_min: '',
      salary_max: '',
      remote_work: '',
      education_level: '',
      skill: '',
      category: '',
    });
  };

  const hasActiveFilters =
    filters.position_type ||
    filters.experience_level ||
    filters.region ||
    filters.province ||
    filters.city ||
    filters.searchTerm ||
    filters.salary_min ||
    filters.salary_max ||
    filters.remote_work ||
    filters.education_level ||
    filters.skill ||
    filters.category;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-4">
            <Briefcase className="w-10 h-10" />
            <h1 className="text-5xl font-bold">Lavoro</h1>
          </div>
          <p className="text-green-100 text-lg">
            Trova opportunità di lavoro o trova i candidati ideali
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setActiveTab('offers')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                activeTab === 'offers'
                  ? 'bg-green-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Building2 className="w-5 h-5" />
              Trova Lavoro
            </button>
            <button
              onClick={() => setActiveTab('seekers')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                activeTab === 'seekers'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              <UserCircle className="w-5 h-5" />
              Cerco Lavoro
            </button>
          </div>

          {activeTab === 'seekers' && user && profile?.user_type !== 'business' && !showJobSeekerForm && (
            <button
              onClick={() => setShowJobSeekerForm(true)}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors mb-6"
            >
              <Plus className="w-5 h-5" />
              Crea Annuncio Cerco Lavoro
            </button>
          )}

          {showJobSeekerForm && (
            <div className="mb-6">
              <JobSeekerForm
                onSuccess={() => {
                  setShowJobSeekerForm(false);
                  loadJobSeekers();
                }}
                onCancel={() => setShowJobSeekerForm(false)}
              />
            </div>
          )}

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
                {[filters.category, filters.position_type, filters.experience_level, filters.region, filters.province, filters.city, filters.salary_min, filters.salary_max, filters.remote_work, filters.education_level, filters.skill].filter(Boolean).length}
              </span>
            )}
          </button>

          {showFilters && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Categoria Lavorativa
                  </label>
                  <SearchableSelect
                    value={filters.category}
                    onChange={(value) => setFilters({ ...filters, category: value })}
                    options={[
                      { value: '', label: 'Tutte le categorie' },
                      ...categories.map((cat) => ({
                        value: cat.id,
                        label: cat.name,
                      }))
                    ]}
                    placeholder="Tutte le categorie"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo di Contratto
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
              </div>

              <LocationFilters
                selectedRegion={filters.region}
                selectedProvince={filters.province}
                selectedCity={filters.city}
                onRegionChange={(region) => setFilters({ ...filters, region, province: '', city: '' })}
                onProvinceChange={(province) => setFilters({ ...filters, province, city: '' })}
                onCityChange={(city) => setFilters({ ...filters, city })}
                showAllOption={true}
                label="Filtra per Posizione"
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeTab === 'offers' && (
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
                )}

                {activeTab === 'seekers' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Livello di Istruzione
                    </label>
                    <select
                      value={filters.education_level}
                      onChange={(e) => setFilters({ ...filters, education_level: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="">Tutti</option>
                      <option value="Licenza Media">Licenza Media</option>
                      <option value="Diploma">Diploma</option>
                      <option value="Laurea Triennale">Laurea Triennale</option>
                      <option value="Laurea Magistrale">Laurea Magistrale</option>
                      <option value="Master/PhD">Master/PhD</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="border-t pt-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Fascia Salariale (€/anno)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Minimo
                    </label>
                    <input
                      type="number"
                      placeholder="Es. 20000"
                      value={filters.salary_min}
                      onChange={(e) => setFilters({ ...filters, salary_min: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Massimo
                    </label>
                    <input
                      type="number"
                      placeholder="Es. 50000"
                      value={filters.salary_max}
                      onChange={(e) => setFilters({ ...filters, salary_max: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {activeTab === 'offers' && (
                <div className="border-t pt-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Modalità di Lavoro</h4>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Lavoro Remoto
                    </label>
                    <select
                      value={filters.remote_work}
                      onChange={(e) => setFilters({ ...filters, remote_work: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="">Tutti</option>
                      <option value="true">Si</option>
                      <option value="false">No</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="border-t pt-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Competenze</h4>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cerca per competenza
                  </label>
                  <input
                    type="text"
                    placeholder="Es. Python, JavaScript, Marketing..."
                    value={filters.skill}
                    onChange={(e) => setFilters({ ...filters, skill: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {activeTab === 'offers' ? 'Cerca offerte che richiedono questa competenza' : 'Cerca candidati con questa competenza'}
                  </p>
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
        ) : activeTab === 'offers' ? (
          jobs.length === 0 ? (
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
                      <p className="text-gray-600 font-medium">{job.company_name || job.business?.name || 'Azienda'}</p>
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
                    {job.gross_annual_salary && (
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">
                          {job.gross_annual_salary.toLocaleString()} {job.salary_currency}/anno
                        </span>
                      </div>
                    )}
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Esperienza:</span> {job.experience_level}
                    </div>
                    {job.remote_work && (
                      <div className="text-sm text-green-600 font-medium">
                        Lavoro Remoto
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

                  {job.benefits.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">Benefit:</p>
                      <div className="flex flex-wrap gap-2">
                        {job.benefits.map((benefit, index) => (
                          <span key={index} className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded">
                            {benefit}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      Scade il {new Date(job.expires_at).toLocaleDateString('it-IT')}
                    </span>
                    <div className="flex items-center gap-3">
                      {user && profile?.user_type !== 'business' && (
                        <>
                          <FavoriteButton
                            type="job"
                            itemId={job.id}
                            familyMemberId={activeProfile && !activeProfile.isOwner ? activeProfile.id : null}
                          />
                          {viewedJobs.includes(job.id) ? (
                            <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg font-medium">
                              <Check className="w-4 h-4" />
                              <span>Visionato</span>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleMarkAsViewed(job.id)}
                              disabled={markingAsViewed === job.id}
                              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors disabled:bg-gray-100"
                            >
                              {markingAsViewed === job.id ? 'Salvataggio...' : 'Segna come visionato'}
                            </button>
                          )}
                          <button
                            onClick={() => handleContactEmployer(job.id)}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
                          >
                            <MessageCircle className="w-4 h-4" />
                            Contatta
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          jobSeekers.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <UserCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">Nessun annuncio trovato</p>
            </div>
          ) : (
            <div className="space-y-4">
              {jobSeekers.map((jobSeeker) => (
                <JobSeekerCard
                  key={jobSeeker.id}
                  jobSeeker={jobSeeker}
                  onContact={handleContactJobSeeker}
                  showContactButton={user ? profile?.user_type === 'business' : false}
                />
              ))}
            </div>
          )
        )}
      </div>

      {conversationData && (
        <JobConversation
          conversationId={conversationData.conversationId}
          conversationType={conversationData.type}
          otherUserName={conversationData.otherUserName}
          onClose={() => setConversationData(null)}
        />
      )}
    </div>
  );
}