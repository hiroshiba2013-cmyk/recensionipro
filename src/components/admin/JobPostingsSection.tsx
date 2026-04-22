import { useState, useEffect } from 'react';
import { Briefcase, MapPin, Trash2, Filter, Calendar, Euro, Eye, Search, Users, X, ShieldCheck, XCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface JobPosting {
  id: string;
  title: string;
  description: string;
  salary_range: string | null;
  gross_annual_salary: number | null;
  location: string;
  status: string;
  approval_status: string;
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
type ApprovalFilter = 'pending' | 'approved' | 'rejected' | 'all';

export function JobPostingsSection({ jobPostings: initialJobPostings, onReload }: JobPostingsSectionProps) {
  const { user } = useAuth();
  const [jobType, setJobType] = useState<JobType>('all');
  const [approvalFilter, setApprovalFilter] = useState<ApprovalFilter>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedJobPosting, setSelectedJobPosting] = useState<JobPosting | null>(null);
  const [selectedJobSeeker, setSelectedJobSeeker] = useState<JobSeeker | null>(null);
  const [jobSeekers, setJobSeekers] = useState<JobSeeker[]>([]);
  const [jobPostings, setJobPostings] = useState<JobPosting[]>(initialJobPostings);
  const [loading, setLoading] = useState(true);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState<string | null>(null);

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
          id, title, description, salary_range, gross_annual_salary,
          location, status, approval_status, position_type, experience_level,
          created_at, expires_at, published_at,
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
          id, title, description, desired_salary_min, desired_salary_max,
          location, status, contract_type, experience_years, education_level,
          created_at, user_id, family_member_id, category_id
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const enrichedData = await Promise.all((data || []).map(async (seeker) => {
        let profile = null;
        let family_member = null;
        let category = null;

        if (seeker.user_id) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name, nickname, email')
            .eq('id', seeker.user_id)
            .maybeSingle();
          profile = profileData;
        }

        if (seeker.family_member_id) {
          const { data: familyData } = await supabase
            .from('customer_family_members')
            .select('nickname')
            .eq('id', seeker.family_member_id)
            .maybeSingle();
          family_member = familyData;
        }

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

  const handleApprove = async (jobId: string) => {
    if (!user) return;
    setProcessing(jobId);
    try {
      const { error } = await supabase.rpc('approve_job_posting', {
        p_job_id: jobId,
        p_admin_id: user.id
      });
      if (error) throw error;
      await loadJobPostings();
    } catch (err: any) {
      alert('Errore durante l\'approvazione: ' + err.message);
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async () => {
    if (!rejectingId || !user) return;
    setProcessing(rejectingId);
    try {
      const { error } = await supabase.rpc('reject_job_posting', {
        p_job_id: rejectingId,
        p_admin_id: user.id,
        p_reason: rejectReason
      });
      if (error) throw error;
      setRejectingId(null);
      setRejectReason('');
      await loadJobPostings();
    } catch (err: any) {
      alert('Errore durante il rifiuto: ' + err.message);
    } finally {
      setProcessing(null);
    }
  };

  const deleteJobPosting = async (jobId: string) => {
    if (!confirm('Sei sicuro di voler eliminare questa offerta di lavoro?')) return;
    try {
      const { error } = await supabase.from('job_postings').delete().eq('id', jobId);
      if (error) throw error;
      await loadJobPostings();
    } catch (error: any) {
      alert(`Errore: ${error.message}`);
    }
  };

  const handleUpdateJobSeekerStatus = async (seekerId: string, newStatus: string) => {
    try {
      const { error } = await supabase.from('job_seekers').update({ status: newStatus }).eq('id', seekerId);
      if (error) throw error;
      await loadJobSeekers();
    } catch (error: any) {
      alert(`Errore: ${error.message}`);
    }
  };

  const deleteJobSeeker = async (seekerId: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo annuncio cerca lavoro?')) return;
    try {
      const { error } = await supabase.from('job_seekers').delete().eq('id', seekerId);
      if (error) throw error;
      await loadJobSeekers();
    } catch (error: any) {
      alert(`Errore: ${error.message}`);
    }
  };

  const filteredJobPostings = jobPostings.filter(job => {
    const matchesApproval = approvalFilter === 'all' || job.approval_status === approvalFilter;
    const matchesSearch = searchTerm === '' ||
      job.business_location?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.title.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesApproval && matchesSearch;
  });

  const filteredJobSeekers = jobSeekers.filter(seeker => {
    const username = seeker.family_member?.nickname || seeker.profile?.nickname || seeker.profile?.full_name || '';
    const matchesSearch = searchTerm === '' ||
      username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      seeker.title.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const pendingCount = jobPostings.filter(j => j.approval_status === 'pending').length;
  const approvedCount = jobPostings.filter(j => j.approval_status === 'approved').length;
  const rejectedCount = jobPostings.filter(j => j.approval_status === 'rejected').length;

  const displayedJobPostings = jobType === 'cerca' ? [] : filteredJobPostings;
  const displayedJobSeekers = jobType === 'trova' ? [] : filteredJobSeekers;

  const getApprovalBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string; label: string }> = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'In attesa' },
      approved: { bg: 'bg-green-100', text: 'text-green-800', label: 'Approvata' },
      rejected: { bg: 'bg-red-100', text: 'text-red-800', label: 'Rifiutata' }
    };
    const badge = badges[status] || badges.pending;
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <Briefcase className="w-7 h-7 text-cyan-600" />
          Gestione Lavoro
        </h2>

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
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center mb-6">
          <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
            <p className="text-2xl font-bold text-yellow-700">{pendingCount}</p>
            <p className="text-sm text-gray-600">Da Approvare</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <p className="text-2xl font-bold text-green-600">{approvedCount}</p>
            <p className="text-sm text-gray-600">Approvate</p>
          </div>
          <div className="bg-red-50 rounded-lg p-4 border border-red-200">
            <p className="text-2xl font-bold text-red-600">{rejectedCount}</p>
            <p className="text-sm text-gray-600">Rifiutate</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <p className="text-2xl font-bold text-blue-600">{jobSeekers.filter(s => s.status === 'active').length}</p>
            <p className="text-sm text-gray-600">Cerca Lavoro Attivi</p>
          </div>
        </div>

        {jobType !== 'cerca' && (
          <div className="flex gap-2 overflow-x-auto pb-2">
            {[
              { key: 'pending' as ApprovalFilter, label: 'Da Approvare', count: pendingCount },
              { key: 'approved' as ApprovalFilter, label: 'Approvate', count: approvedCount },
              { key: 'rejected' as ApprovalFilter, label: 'Rifiutate', count: rejectedCount },
              { key: 'all' as ApprovalFilter, label: 'Tutte', count: jobPostings.length },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setApprovalFilter(tab.key)}
                className={`relative px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                  approvalFilter === tab.key
                    ? tab.key === 'pending' ? 'bg-yellow-600 text-white'
                    : tab.key === 'approved' ? 'bg-green-600 text-white'
                    : tab.key === 'rejected' ? 'bg-red-600 text-white'
                    : 'bg-cyan-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {tab.label}
                {tab.key === 'pending' && tab.count > 0 && approvalFilter !== 'pending' && (
                  <span className="absolute -top-2 -right-2 min-w-[20px] h-[20px] flex items-center justify-center px-1 bg-red-600 text-white text-xs font-bold rounded-full">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
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
              <p className="text-gray-600">
                {approvalFilter === 'pending' ? 'Nessuna offerta da approvare' : 'Nessuna offerta trovata'}
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {displayedJobPostings.map((job) => {
                const businessOwner = job.business_location?.business?.profile;
                const ownerName = businessOwner?.nickname || businessOwner?.full_name || 'Azienda';

                return (
                  <div
                    key={job.id}
                    className={`bg-white rounded-lg shadow border p-6 ${
                      job.approval_status === 'pending' ? 'border-yellow-300 bg-yellow-50/30' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getApprovalBadge(job.approval_status)}
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
                            {businessOwner.email && <span className="text-gray-500"> - {businessOwner.email}</span>}
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
                          <span>{job.gross_annual_salary.toLocaleString()} EUR/anno</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>Scade: {new Date(job.expires_at).toLocaleDateString('it-IT')}</span>
                      </div>
                    </div>

                    <div className="flex gap-2 mb-3">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">{job.position_type}</span>
                      <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">{job.experience_level}</span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {job.approval_status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApprove(job.id)}
                            disabled={processing === job.id}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 font-medium"
                          >
                            <ShieldCheck className="w-4 h-4" />
                            {processing === job.id ? 'Approvando...' : 'Approva'}
                          </button>
                          <button
                            onClick={() => setRejectingId(job.id)}
                            disabled={processing === job.id}
                            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 font-medium"
                          >
                            <XCircle className="w-4 h-4" />
                            Rifiuta
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => setSelectedJobPosting(job)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm"
                      >
                        <Eye className="w-4 h-4" />
                        Dettagli
                      </button>
                      <button
                        onClick={() => deleteJobPosting(job.id)}
                        className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2 ml-auto"
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
                          <span className={`px-3 py-1 text-xs rounded-full font-medium ${
                            seeker.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
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
                              ? `${seeker.desired_salary_min.toLocaleString()} - ${seeker.desired_salary_max.toLocaleString()} EUR`
                              : seeker.desired_salary_min
                              ? `Da ${seeker.desired_salary_min.toLocaleString()} EUR`
                              : `Fino a ${seeker.desired_salary_max?.toLocaleString()} EUR`}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 mb-3">
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">{seeker.contract_type}</span>
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
              <button onClick={() => setSelectedJobPosting(null)} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <h4 className="text-2xl font-bold mb-2">{selectedJobPosting.title}</h4>
                {selectedJobPosting.business_location && (
                  <p className="text-lg text-blue-600 mb-2 font-medium">{selectedJobPosting.business_location.name}</p>
                )}
                <div className="flex gap-2">
                  {getApprovalBadge(selectedJobPosting.approval_status)}
                </div>
              </div>
              <div>
                <h5 className="font-semibold text-gray-900 mb-2">Descrizione:</h5>
                <p className="text-gray-700 whitespace-pre-wrap">{selectedJobPosting.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Localita:</span>
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
                    <p className="font-medium text-green-600">{selectedJobPosting.gross_annual_salary.toLocaleString()} EUR</p>
                  </div>
                )}
              </div>

              {selectedJobPosting.approval_status === 'pending' && (
                <div className="flex gap-3 pt-4 border-t">
                  <button
                    onClick={() => { handleApprove(selectedJobPosting.id); setSelectedJobPosting(null); }}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                  >
                    <ShieldCheck className="w-5 h-5" />
                    Approva
                  </button>
                  <button
                    onClick={() => { setRejectingId(selectedJobPosting.id); setSelectedJobPosting(null); }}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                  >
                    <XCircle className="w-5 h-5" />
                    Rifiuta
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {selectedJobSeeker && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-green-600 to-green-700 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">Dettagli Cerca Lavoro</h3>
              <button onClick={() => setSelectedJobSeeker(null)} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <h4 className="text-2xl font-bold mb-2">{selectedJobSeeker.title}</h4>
                <p className="text-lg text-green-600 mb-2 font-medium">
                  {selectedJobSeeker.family_member?.nickname || selectedJobSeeker.profile?.nickname || selectedJobSeeker.profile?.full_name}
                </p>
              </div>
              <div>
                <h5 className="font-semibold text-gray-900 mb-2">Descrizione:</h5>
                <p className="text-gray-700 whitespace-pre-wrap">{selectedJobSeeker.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Localita:</span>
                  <p className="font-medium">{selectedJobSeeker.location}</p>
                </div>
                <div>
                  <span className="text-gray-600">Tipo Contratto:</span>
                  <p className="font-medium">{selectedJobSeeker.contract_type}</p>
                </div>
                <div>
                  <span className="text-gray-600">Anni Esperienza:</span>
                  <p className="font-medium">{selectedJobSeeker.experience_years}</p>
                </div>
                {selectedJobSeeker.category && (
                  <div>
                    <span className="text-gray-600">Categoria:</span>
                    <p className="font-medium">{selectedJobSeeker.category.name}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {rejectingId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Rifiuta Offerta di Lavoro</h3>
            <p className="text-sm text-gray-600 mb-4">
              Inserisci il motivo del rifiuto (opzionale). L'utente ricevera una notifica.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Motivo del rifiuto..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
              rows={3}
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleReject}
                disabled={processing !== null}
                className="flex-1 bg-red-600 text-white py-2.5 rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50"
              >
                {processing ? 'Rifiutando...' : 'Conferma Rifiuto'}
              </button>
              <button
                onClick={() => { setRejectingId(null); setRejectReason(''); }}
                className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Annulla
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
