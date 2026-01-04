import { useState, useEffect } from 'react';
import { Heart, FileText, Download, Calendar, Euro } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface SolidarityDocument {
  id: string;
  document_type: 'revenue' | 'donation';
  title: string;
  description: string | null;
  file_url: string;
  year: number;
  amount: number | null;
  recipient: string | null;
  created_at: string;
  profiles: {
    full_name: string;
  };
}

export function SolidarityPage() {
  const [documents, setDocuments] = useState<SolidarityDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<number | 'all'>('all');

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('solidarity_documents')
        .select(`
          *,
          profiles:uploaded_by(full_name)
        `)
        .order('year', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const years = [...new Set(documents.map((d) => d.year))].sort((a, b) => b - a);

  const filteredDocuments =
    selectedYear === 'all'
      ? documents
      : documents.filter((d) => d.year === selectedYear);

  const revenueDocuments = filteredDocuments.filter((d) => d.document_type === 'revenue');
  const donationDocuments = filteredDocuments.filter((d) => d.document_type === 'donation');

  const totalDonations = donationDocuments.reduce(
    (sum, doc) => sum + (doc.amount || 0),
    0
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-white">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-gradient-to-r from-green-500 to-blue-500 p-4 rounded-full">
              <Heart className="w-12 h-12 text-white" />
            </div>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-center text-gray-900 mb-6">
            Solidarietà Trovafacile
          </h1>

          <div className="max-w-3xl mx-auto text-center space-y-6 text-lg text-gray-700">
            <p className="leading-relaxed">
              In <span className="font-bold text-blue-600">Trovafacile</span> crediamo fermamente nel valore della solidarietà
              e nel dare un contributo concreto alla nostra comunità.
            </p>

            <p className="leading-relaxed">
              Per questo motivo, ci impegniamo a donare{' '}
              <span className="font-bold text-green-600 text-2xl">il 10% del nostro fatturato annuale</span>{' '}
              a organizzazioni no profit, enti di beneficenza e progetti sociali che fanno la differenza.
            </p>

            <p className="leading-relaxed">
              La scelta dei destinatari viene effettuata dai nostri iscritti con un sondaggio, con attenzione e trasparenza,
              privilegiando realtà locali e progetti che abbiano un impatto positivo e misurabile sulla società.
            </p>

            <div className="bg-gradient-to-r from-green-100 to-blue-100 rounded-lg p-6 mt-8">
              <p className="font-bold text-xl text-gray-900 mb-2">
                Trasparenza Totale
              </p>
              <p className="text-gray-700">
                In questa pagina pubblichiamo regolarmente i documenti che attestano il nostro fatturato
                e le donazioni effettuate, perché crediamo che la trasparenza sia fondamentale per costruire fiducia.
              </p>
            </div>
          </div>
        </div>

        {/* Statistics */}
        {totalDonations > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Statistiche Donazioni
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  €{totalDonations.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                </div>
                <div className="text-gray-600 font-medium">Totale Donato</div>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {donationDocuments.length}
                </div>
                <div className="text-gray-600 font-medium">Donazioni Effettuate</div>
              </div>
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-6 text-center">
                <div className="text-3xl font-bold text-orange-600 mb-2">
                  {years.length}
                </div>
                <div className="text-gray-600 font-medium">
                  {years.length === 1 ? 'Anno' : 'Anni'} di Solidarietà
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Year Filter */}
        {years.length > 1 && (
          <div className="bg-white rounded-lg shadow-sm p-4 mb-8">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedYear('all')}
                className={`px-6 py-2 rounded-lg font-medium transition-all ${
                  selectedYear === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Tutti gli anni
              </button>
              {years.map((year) => (
                <button
                  key={year}
                  onClick={() => setSelectedYear(year)}
                  className={`px-6 py-2 rounded-lg font-medium transition-all ${
                    selectedYear === year
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {year}
                </button>
              ))}
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
            <p className="text-gray-600 mt-4">Caricamento documenti...</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Revenue Documents */}
            {revenueDocuments.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Documenti Fatturato
                  </h2>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {revenueDocuments.map((doc) => (
                    <DocumentCard key={doc.id} document={doc} />
                  ))}
                </div>
              </div>
            )}

            {/* Donation Documents */}
            {donationDocuments.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-green-100 p-3 rounded-lg">
                    <Heart className="w-6 h-6 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Donazioni Effettuate
                  </h2>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {donationDocuments.map((doc) => (
                    <DocumentCard key={doc.id} document={doc} />
                  ))}
                </div>
              </div>
            )}

            {filteredDocuments.length === 0 && (
              <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-xl text-gray-600">
                  {selectedYear === 'all'
                    ? 'Nessun documento ancora caricato'
                    : `Nessun documento per l'anno ${selectedYear}`}
                </p>
                <p className="text-gray-500 mt-2">
                  I documenti verranno pubblicati non appena disponibili
                </p>
              </div>
            )}
          </div>
        )}

        {/* Future Activities Section */}
        <div className="bg-gradient-to-r from-blue-100 to-green-100 rounded-xl shadow-lg p-8 mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">
            Prossimamente
          </h2>
          <p className="text-center text-gray-700 text-lg">
            In questa sezione pubblicheremo anche informazioni su attività no profit,
            eventi di beneficenza e iniziative solidali a cui partecipiamo o che sosteniamo.
          </p>
        </div>
      </div>
    </div>
  );
}

function DocumentCard({ document }: { document: SolidarityDocument }) {
  return (
    <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span
              className={`px-3 py-1 rounded-full text-sm font-bold ${
                document.document_type === 'revenue'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-green-100 text-green-700'
              }`}
            >
              {document.document_type === 'revenue' ? '📊 Fatturato' : '❤️ Donazione'}
            </span>
            <span className="flex items-center gap-1 text-sm text-gray-600">
              <Calendar className="w-4 h-4" />
              {document.year}
            </span>
          </div>

          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {document.title}
          </h3>

          {document.description && (
            <p className="text-gray-600 mb-3">{document.description}</p>
          )}

          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
            {document.amount && (
              <div className="flex items-center gap-1">
                <Euro className="w-4 h-4" />
                <span className="font-medium">
                  €{document.amount.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                </span>
              </div>
            )}
            {document.recipient && (
              <div>
                <span className="font-medium">Destinatario:</span> {document.recipient}
              </div>
            )}
          </div>

          <div className="text-xs text-gray-500 mt-3">
            Caricato da {document.profiles.full_name} il{' '}
            {new Date(document.created_at).toLocaleDateString('it-IT')}
          </div>
        </div>

        <a
          href={document.file_url}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-4 flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Download className="w-4 h-4" />
          Scarica
        </a>
      </div>
    </div>
  );
}
