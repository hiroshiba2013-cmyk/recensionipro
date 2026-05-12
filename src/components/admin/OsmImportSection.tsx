import { useState } from 'react';
import { Download, Search, RefreshCw, CheckCircle, XCircle, AlertCircle, MapPin, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../common/Toast';

interface Comune {
  city: string;
  province: string;
  region: string;
  business_count: number;
}

interface ImportResult {
  city: string;
  imported: number;
  skipped: number;
  error?: string;
}

const BATCH_SIZE = 10;

export function OsmImportSection() {
  const { showToast } = useToast();
  const [comuni, setComuni] = useState<Comune[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState<ImportResult[]>([]);
  const [maxCount, setMaxCount] = useState(5);
  const [listLimit, setListLimit] = useState(100);
  const [expandedRegion, setExpandedRegion] = useState<string | null>(null);

  const loadComuni = async () => {
    setLoading(true);
    setResults([]);
    setSelected(new Set());
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fill-empty-comuni`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({ mode: 'list', min_count: maxCount, limit: listLimit }),
        }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Errore nel caricamento');
      setComuni(json.comuni ?? []);
    } catch (e: any) {
      showToast(e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const toggleComune = (key: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const selectAll = () => setSelected(new Set(comuni.map(c => `${c.city}|${c.province}`)));
  const selectNone = () => setSelected(new Set());

  const runImport = async () => {
    const toImport = comuni.filter(c => selected.has(`${c.city}|${c.province}`));
    if (toImport.length === 0) {
      showToast('Seleziona almeno un comune', 'error');
      return;
    }
    setImporting(true);
    setResults([]);
    const allResults: ImportResult[] = [];

    // Process in batches of BATCH_SIZE to avoid edge function timeout
    for (let i = 0; i < toImport.length; i += BATCH_SIZE) {
      const batch = toImport.slice(i, i + BATCH_SIZE);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fill-empty-comuni`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session?.access_token}`,
            },
            body: JSON.stringify({ mode: 'import', comuni: batch }),
          }
        );
        const json = await res.json();
        if (json.results) allResults.push(...json.results);
        else if (!res.ok) {
          batch.forEach(c => allResults.push({ city: c.city, imported: 0, skipped: 0, error: json.error }));
        }
      } catch (e: any) {
        batch.forEach(c => allResults.push({ city: c.city, imported: 0, skipped: 0, error: e.message }));
      }
      setResults([...allResults]);
    }

    const total = allResults.reduce((s, r) => s + r.imported, 0);
    const errors = allResults.filter(r => r.error).length;
    showToast(`Import completato: ${total} attività importate${errors ? `, ${errors} errori` : ''}`, errors ? 'info' : 'success');
    setImporting(false);
  };

  // Group comuni by region for display
  const byRegion = comuni.reduce<Record<string, Comune[]>>((acc, c) => {
    const r = c.region || 'Sconosciuta';
    if (!acc[r]) acc[r] = [];
    acc[r].push(c);
    return acc;
  }, {});

  const totalSelected = selected.size;
  const totalImported = results.reduce((s, r) => s + r.imported, 0);
  const resultErrors = results.filter(r => r.error);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
            <Download className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Import da OpenStreetMap</h2>
            <p className="text-sm text-gray-500">Arricchisci i comuni con poche attività importando da OSM</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Mostra comuni con meno di</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={100}
                value={maxCount}
                onChange={e => setMaxCount(Number(e.target.value))}
                className="w-20 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
              <span className="text-sm text-gray-500">attività</span>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Max comuni da mostrare</label>
            <input
              type="number"
              min={10}
              max={500}
              value={listLimit}
              onChange={e => setListLimit(Number(e.target.value))}
              className="w-24 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={loadComuni}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 disabled:opacity-60 transition-colors"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              {loading ? 'Caricamento...' : 'Trova comuni vuoti'}
            </button>
          </div>
        </div>
      </div>

      {/* Comuni list */}
      {comuni.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-gray-400" />
              <span className="font-semibold text-gray-900">{comuni.length} comuni trovati</span>
              {totalSelected > 0 && (
                <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-0.5 rounded-full">
                  {totalSelected} selezionati
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={selectAll} className="text-xs text-emerald-600 hover:text-emerald-700 font-medium px-2 py-1 rounded hover:bg-emerald-50 transition-colors">
                Seleziona tutti
              </button>
              <button onClick={selectNone} className="text-xs text-gray-500 hover:text-gray-700 font-medium px-2 py-1 rounded hover:bg-gray-50 transition-colors">
                Deseleziona
              </button>
              <button
                onClick={runImport}
                disabled={importing || totalSelected === 0}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 transition-colors"
              >
                {importing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                {importing ? 'Importazione...' : `Importa ${totalSelected > 0 ? totalSelected : ''}`}
              </button>
            </div>
          </div>

          <div className="divide-y divide-gray-50 max-h-[500px] overflow-y-auto">
            {Object.entries(byRegion).sort(([a], [b]) => a.localeCompare(b)).map(([region, regionComuni]) => {
              const isOpen = expandedRegion === region;
              const selectedInRegion = regionComuni.filter(c => selected.has(`${c.city}|${c.province}`)).length;
              return (
                <div key={region}>
                  <button
                    onClick={() => setExpandedRegion(isOpen ? null : region)}
                    className="w-full flex items-center justify-between px-6 py-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-gray-800 text-sm">{region}</span>
                      <span className="text-xs text-gray-400">{regionComuni.length} comuni</span>
                      {selectedInRegion > 0 && (
                        <span className="bg-blue-100 text-blue-700 text-xs font-bold px-1.5 py-0.5 rounded-full">{selectedInRegion}</span>
                      )}
                    </div>
                    {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                      {regionComuni.map(c => {
                        const key = `${c.city}|${c.province}`;
                        const isSel = selected.has(key);
                        const result = results.find(r => r.city === c.city);
                        return (
                          <button
                            key={key}
                            onClick={() => !result && toggleComune(key)}
                            className={`text-left px-3 py-2 rounded-lg border text-xs transition-all ${
                              result
                                ? result.error
                                  ? 'bg-red-50 border-red-200 text-red-700'
                                  : 'bg-green-50 border-green-200 text-green-700'
                                : isSel
                                ? 'bg-blue-50 border-blue-300 text-blue-800 font-medium'
                                : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            <div className="font-medium truncate">{c.city}</div>
                            <div className="text-gray-400 mt-0.5">
                              {result
                                ? result.error
                                  ? `Errore`
                                  : `+${result.imported}`
                                : `${c.business_count} att.`}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Import progress/results */}
      {importing && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 flex items-center gap-3">
          <RefreshCw className="w-5 h-5 text-blue-600 animate-spin flex-shrink-0" />
          <div>
            <p className="font-semibold text-blue-800 text-sm">Importazione in corso...</p>
            <p className="text-xs text-blue-600 mt-0.5">
              {results.length} / {totalSelected} comuni processati — {totalImported} attività importate finora
            </p>
          </div>
        </div>
      )}

      {results.length > 0 && !importing && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            Risultati import
          </h3>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="bg-green-50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-green-700">{totalImported}</p>
              <p className="text-xs text-green-600 mt-1">Attività importate</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-gray-700">{results.reduce((s, r) => s + r.skipped, 0)}</p>
              <p className="text-xs text-gray-600 mt-1">Già presenti (skip)</p>
            </div>
            <div className="bg-red-50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-red-700">{resultErrors.length}</p>
              <p className="text-xs text-red-600 mt-1">Errori</p>
            </div>
          </div>
          {resultErrors.length > 0 && (
            <div className="space-y-2">
              {resultErrors.map(r => (
                <div key={r.city} className="flex items-center gap-2 text-sm text-red-700 bg-red-50 rounded-lg px-3 py-2">
                  <XCircle className="w-4 h-4 flex-shrink-0" />
                  <span className="font-medium">{r.city}:</span>
                  <span>{r.error}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {comuni.length === 0 && !loading && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <AlertCircle className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Clicca "Trova comuni vuoti" per iniziare</p>
          <p className="text-xs text-gray-400 mt-1">Verranno mostrati i comuni con meno attività registrate</p>
        </div>
      )}
    </div>
  );
}
