import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Report {
  id: string;
  reason: string;
  description: string;
  status: string;
  created_at: string;
  reporter: {
    full_name: string;
    email: string;
  };
  content_type: string;
}

interface ReportsSectionProps {
  reports: Report[];
  onReload: () => Promise<void>;
}

export function ReportsSection({ reports, onReload }: ReportsSectionProps) {
  const handleResolveReport = async (reportId: string) => {
    try {
      const { error } = await supabase
        .from('reports')
        .update({ status: 'resolved' })
        .eq('id', reportId);

      if (error) throw error;

      alert('Segnalazione risolta');
      await onReload();
    } catch (error: any) {
      console.error('Error resolving report:', error);
      alert(`Errore: ${error.message}`);
    }
  };

  const handleRejectReport = async (reportId: string) => {
    try {
      const { error } = await supabase
        .from('reports')
        .update({ status: 'rejected' })
        .eq('id', reportId);

      if (error) throw error;

      alert('Segnalazione respinta');
      await onReload();
    } catch (error: any) {
      console.error('Error rejecting report:', error);
      alert(`Errore: ${error.message}`);
    }
  };

  const pendingReports = reports.filter(r => r.status === 'pending');
  const resolvedReports = reports.filter(r => r.status === 'resolved');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Segnalazioni in Sospeso ({pendingReports.length})
        </h2>

        {pendingReports.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <AlertTriangle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Nessuna segnalazione in sospeso</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingReports.map((report) => (
              <div key={report.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                        {report.content_type}
                      </span>
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                        {report.reason}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Segnalato da {report.reporter.full_name} ({report.reporter.email})
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(report.created_at).toLocaleDateString('it-IT', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>

                <p className="text-gray-700 mb-4">{report.description}</p>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleResolveReport(report.id)}
                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Risolvi
                  </button>
                  <button
                    onClick={() => handleRejectReport(report.id)}
                    className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <XCircle className="w-5 h-5" />
                    Respingi
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {resolvedReports.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Segnalazioni Risolte ({resolvedReports.length})
          </h2>
          <div className="space-y-4">
            {resolvedReports.slice(0, 10).map((report) => (
              <div key={report.id} className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs">
                        {report.content_type}
                      </span>
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                        Risolta
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{report.description}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(report.created_at).toLocaleDateString('it-IT')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
