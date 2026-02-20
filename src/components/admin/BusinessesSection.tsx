import { Building2, CheckCircle, MapPin, Mail, Phone } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface RegisteredBusiness {
  id: string;
  name: string;
  vat_number: string | null;
  verified: boolean;
  created_at: string;
  owner: {
    full_name: string;
    email: string;
  };
  category: {
    name: string;
  } | null;
  locations_count: number;
}

interface BusinessesSectionProps {
  businesses: RegisteredBusiness[];
  onReload: () => Promise<void>;
}

export function BusinessesSection({ businesses, onReload }: BusinessesSectionProps) {
  const handleToggleVerification = async (businessId: string, currentStatus: boolean) => {
    const confirmMessage = currentStatus
      ? 'Sei sicuro di voler rimuovere la verifica a questa attività?'
      : 'Sei sicuro di voler verificare questa attività?';

    if (!confirm(confirmMessage)) return;

    try {
      const { error } = await supabase
        .from('registered_businesses')
        .update({
          verified: !currentStatus,
          verification_badge: !currentStatus ? 'verified' : null
        })
        .eq('id', businessId);

      if (error) throw error;

      alert(`Verifica ${!currentStatus ? 'attivata' : 'rimossa'} con successo`);
      await onReload();
    } catch (error: any) {
      console.error('Error updating verification:', error);
      alert(`Errore: ${error.message}`);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-900">
          Attività Registrate ({businesses.length})
        </h2>
      </div>

      {businesses.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Nessuna attività registrata</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Attività
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Proprietario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    P.IVA
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Categoria
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Sedi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Iscritto il
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Stato
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Azioni
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {businesses.map((business) => (
                  <tr key={business.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-gray-400" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{business.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{business.owner.full_name}</div>
                      <div className="text-sm text-gray-500">{business.owner.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{business.vat_number || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{business.category?.name || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1 text-sm text-gray-900">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        {business.locations_count}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(business.created_at).toLocaleDateString('it-IT')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          business.verified
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {business.verified ? 'Verificata' : 'Non verificata'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleVerification(business.id, business.verified)}
                        className={`px-3 py-1 text-xs rounded-lg ${
                          business.verified
                            ? 'bg-red-100 text-red-800 hover:bg-red-200'
                            : 'bg-green-100 text-green-800 hover:bg-green-200'
                        }`}
                      >
                        {business.verified ? 'Rimuovi Verifica' : 'Verifica'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
