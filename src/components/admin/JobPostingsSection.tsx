import { Briefcase, MapPin } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface JobPosting {
  id: string;
  title: string;
  description: string;
  salary_range: string | null;
  location: string;
  status: string;
  created_at: string;
  business: {
    name: string;
  } | null;
}

interface JobPostingsSectionProps {
  jobPostings: JobPosting[];
  onReload: () => Promise<void>;
}

export function JobPostingsSection({ jobPostings, onReload }: JobPostingsSectionProps) {
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

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        Offerte di Lavoro ({jobPostings.length})
      </h2>

      {jobPostings.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Nessuna offerta di lavoro pubblicata</p>
        </div>
      ) : (
        <div className="space-y-4">
          {jobPostings.map((job) => (
            <div key={job.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Briefcase className="w-5 h-5 text-blue-600" />
                    <h3 className="font-bold text-lg text-gray-900">{job.title}</h3>
                  </div>
                  {job.business && (
                    <p className="text-sm text-gray-600 mb-1">
                      Azienda: {job.business.name}
                    </p>
                  )}
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <MapPin className="w-4 h-4" />
                    {job.location}
                  </div>
                  {job.salary_range && (
                    <p className="text-sm text-gray-600 mt-1">
                      Stipendio: {job.salary_range}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <span
                    className={`px-3 py-1 text-xs rounded-full ${
                      job.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : job.status === 'closed'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {job.status}
                  </span>
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(job.created_at).toLocaleDateString('it-IT')}
                  </p>
                </div>
              </div>

              <p className="text-gray-700 mb-4 line-clamp-2">{job.description}</p>

              <div className="flex items-center gap-2">
                <select
                  value={job.status}
                  onChange={(e) => handleUpdateStatus(job.id, e.target.value)}
                  className="border rounded px-3 py-2 text-sm"
                >
                  <option value="active">Attiva</option>
                  <option value="closed">Chiusa</option>
                  <option value="draft">Bozza</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
