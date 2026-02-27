import { useState, useEffect } from 'react';
import { Heart, CheckCircle, XCircle, Eye, FileText, Download } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface SolidarityRequest {
  id: string;
  request_type: string;
  title: string;
  description: string;
  status: string;
  proof_document_url: string | null;
  created_at: string;
  requester: {
    full_name: string;
    email: string;
  };
}

interface SolidaritySectionProps {
  onReload: () => void;
}

export function SolidaritySection({ onReload }: SolidaritySectionProps) {
  const [requests, setRequests] = useState<SolidarityRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<SolidarityRequest | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  useEffect(() => {
    loadRequests();
  }, [statusFilter]);

  const loadRequests = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('solidarity_requests')
        .select(`
          id,
          request_type,
          title,
          description,
          status,
          proof_document_url,
          created_at,
          requester:profiles!solidarity_requests_requester_id_fkey(full_name, email)
        `)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query.limit(200);

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error loading solidarity requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (requestId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('solidarity_requests')
        .update({ status: newStatus })
        .eq('id', requestId);

      if (error) throw error;

      alert(`Richiesta ${newStatus === 'approved' ? 'approvata' : 'rifiutata'} con successo`);
      setSelectedRequest(null);
      loadRequests();
      onReload();
    } catch (error: any) {
      console.error('Error updating request status:', error);
      alert(`Errore: ${error.message}`);
    }
  };

  const deleteRequest = async (requestId: string) => {
    if (!confirm('Eliminare questa richiesta?')) return;

    try {
      const { error } = await supabase
        .from('solidarity_requests')
        .delete()
        .eq('id', requestId);

      if (error) throw error;

      alert('Richiesta eliminata');
      setSelectedRequest(null);
      loadRequests();
      onReload();
    } catch (error: any) {
      console.error('Error deleting request:', error);
      alert(`Errore: ${error.message}`);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-700';
      case 'rejected':
        return 'bg-red-100 text-red-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Approvata';
      case 'rejected':
        return 'Rifiutata';
      case 'pending':
        return 'In attesa';
      default:
        return status;
    }
  };

  const getRequestTypeText = (type: string) => {
    switch (type) {
      case 'food':
        return 'Cibo';
      case 'medical':
        return 'Assistenza Medica';
      case 'housing':
        return 'Alloggio';
      case 'financial':
        return 'Supporto Finanziario';
      case 'other':
        return 'Altro';
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-pink-50 to-rose-100">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-pink-500 rounded-lg">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Gestione Solidarietà</h2>
              <p className="text-sm text-gray-600">{requests.length} richieste totali</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                statusFilter === 'all'
                  ? 'bg-pink-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Tutte
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                statusFilter === 'pending'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              In attesa
            </button>
            <button
              onClick={() => setStatusFilter('approved')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                statusFilter === 'approved'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Approvate
            </button>
            <button
              onClick={() => setStatusFilter('rejected')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                statusFilter === 'rejected'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Rifiutate
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                Richiedente
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                Tipo
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                Titolo
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                Stato
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                Data
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                Azioni
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {requests.map((request) => (
              <tr key={request.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {request.requester.full_name}
                  </div>
                  <div className="text-sm text-gray-500">{request.requester.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">
                    {getRequestTypeText(request.request_type)}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900 max-w-xs truncate">
                    {request.title}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusBadge(request.status)}`}>
                    {getStatusText(request.status)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {new Date(request.created_at).toLocaleDateString('it-IT')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedRequest(request)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                      title="Visualizza dettagli"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    {request.status === 'pending' && (
                      <>
                        <button
                          onClick={() => updateStatus(request.id, 'approved')}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-all"
                          title="Approva"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => updateStatus(request.id, 'rejected')}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          title="Rifiuta"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Dettagli Richiesta</h3>
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-gray-700">Richiedente</label>
                  <p className="text-gray-900">{selectedRequest.requester.full_name}</p>
                  <p className="text-sm text-gray-600">{selectedRequest.requester.email}</p>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700">Tipo</label>
                  <p className="text-gray-900">{getRequestTypeText(selectedRequest.request_type)}</p>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700">Titolo</label>
                  <p className="text-gray-900">{selectedRequest.title}</p>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700">Descrizione</label>
                  <p className="text-gray-900 whitespace-pre-wrap">{selectedRequest.description}</p>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700">Stato</label>
                  <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${getStatusBadge(selectedRequest.status)}`}>
                    {getStatusText(selectedRequest.status)}
                  </span>
                </div>

                {selectedRequest.proof_document_url && (
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-2 block">
                      Documento di Prova
                    </label>
                    <a
                      href={selectedRequest.proof_document_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
                    >
                      <Download className="w-4 h-4" />
                      Scarica Documento
                    </a>
                  </div>
                )}

                <div>
                  <label className="text-sm font-semibold text-gray-700">Data Richiesta</label>
                  <p className="text-gray-900">
                    {new Date(selectedRequest.created_at).toLocaleString('it-IT')}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                {selectedRequest.status === 'pending' && (
                  <>
                    <button
                      onClick={() => updateStatus(selectedRequest.id, 'approved')}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Approva
                    </button>
                    <button
                      onClick={() => updateStatus(selectedRequest.id, 'rejected')}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium flex items-center justify-center gap-2"
                    >
                      <XCircle className="w-4 h-4" />
                      Rifiuta
                    </button>
                  </>
                )}
                <button
                  onClick={() => deleteRequest(selectedRequest.id)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium"
                >
                  Elimina
                </button>
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
                >
                  Chiudi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
