import { useState } from 'react';
import { Briefcase, MapPin, Trash2, Filter, Calendar, Euro, Eye } from 'lucide-react';
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
  } | null;
}

interface JobPostingsSectionProps {
  jobPostings: JobPosting[];
  onReload: () => Promise<void>;
}

export function JobPostingsSection({ jobPostings, onReload }: JobPostingsSectionProps) {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);

  const filteredJobs = filterStatus === 'all'
    ? jobPostings
    : jobPostings.filter(job => job.status === filterStatus);

  const handleUpdateStatus = async (jobId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('job_postings')
        .update({ status: newStatus })
        .eq('id', jobId);

      if (error) throw error;

      alert('Stato offerta aggiornato');
      await onReload();
    } catch (error: any) {
      console.error('Error updating job posting:', error);
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
      await onReload();
    } catch (error: any) {
      console.error('Error deleting job posting:', error);
      alert(`Errore: ${error.message}`);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-900">
          Gestione Offerte di Lavoro
        </h2>
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-500" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2"
          >
            <option value="all">Tutte</option>
            <option value="active">Attive</option>
            <option value="closed">Chiuse</option>
            <option value="draft">Bozze</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4 mb-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-gray-900">{jobPostings.filter(j => j.status === 'active').length}</p>
            <p className="text-sm text-gray-600">Attive</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{jobPostings.filter(j => j.status === 'closed').length}</p>
            <p className="text-sm text-gray-600">Chiuse</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{jobPostings.filter(j => j.status === 'draft').length}</p>
            <p className="text-sm text-gray-600">Bozze</p>
          </div>
        </div>
      </div>

      {filteredJobs.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Nessuna offerta di lavoro trovata</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {filteredJobs.map((job) => (
            <div key={job.id} className="bg-white rounded-lg shadow p-6">
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
                    <p className="text-sm text-blue-600 mb-2 font-medium">
                      {job.business_location.name}
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
                  <span>Pubblicato: {new Date(job.published_at).toLocaleDateString('it-IT')}</span>
                </div>
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
                  onClick={() => setSelectedJob(job)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  Dettagli
                </button>
                <select
                  value={job.status}
                  onChange={(e) => handleUpdateStatus(job.id, e.target.value)}
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
          ))}
        </div>
      )}

      {selectedJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-2xl font-bold mb-2">{selectedJob.title}</h3>
                  {selectedJob.business && (
                    <p className="text-lg text-blue-600 mb-2">{selectedJob.business.name}</p>
                  )}
                  <span
                    className={`px-3 py-1 text-xs rounded-full font-medium ${
                      selectedJob.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : selectedJob.status === 'closed'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {selectedJob.status}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedJob(null)}
                  className="text-gray-500 hover:text-gray-700 text-3xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Descrizione:</h4>
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedJob.description}</p>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Informazioni:</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Località:</span>
                      <p className="font-medium">{selectedJob.location}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Tipo Posizione:</span>
                      <p className="font-medium">{selectedJob.position_type}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Livello Esperienza:</span>
                      <p className="font-medium">{selectedJob.experience_level}</p>
                    </div>
                    {selectedJob.gross_annual_salary && (
                      <div>
                        <span className="text-gray-600">Stipendio Annuo:</span>
                        <p className="font-medium text-green-600">€{selectedJob.gross_annual_salary.toLocaleString()}</p>
                      </div>
                    )}
                    <div>
                      <span className="text-gray-600">Pubblicato il:</span>
                      <p className="font-medium">{new Date(selectedJob.published_at).toLocaleDateString('it-IT')}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Scade il:</span>
                      <p className="font-medium">{new Date(selectedJob.expires_at).toLocaleDateString('it-IT')}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
