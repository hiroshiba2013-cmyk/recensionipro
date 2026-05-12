import { useState } from 'react';
import { Download, RefreshCw, CheckCircle, XCircle, MapPin, Play, Square } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../common/Toast';

// All Italian provinces with region
const PROVINCES: { code: string; region: string }[] = [
  { code: "AQ", region: "Abruzzo" }, { code: "CH", region: "Abruzzo" },
  { code: "PE", region: "Abruzzo" }, { code: "TE", region: "Abruzzo" },
  { code: "MT", region: "Basilicata" }, { code: "PZ", region: "Basilicata" },
  { code: "CS", region: "Calabria" }, { code: "CZ", region: "Calabria" },
  { code: "KR", region: "Calabria" }, { code: "RC", region: "Calabria" }, { code: "VV", region: "Calabria" },
  { code: "AV", region: "Campania" }, { code: "BN", region: "Campania" },
  { code: "CE", region: "Campania" }, { code: "NA", region: "Campania" }, { code: "SA", region: "Campania" },
  { code: "BO", region: "Emilia-Romagna" }, { code: "FC", region: "Emilia-Romagna" },
  { code: "FE", region: "Emilia-Romagna" }, { code: "MO", region: "Emilia-Romagna" },
  { code: "PC", region: "Emilia-Romagna" }, { code: "PR", region: "Emilia-Romagna" },
  { code: "RA", region: "Emilia-Romagna" }, { code: "RE", region: "Emilia-Romagna" }, { code: "RN", region: "Emilia-Romagna" },
  { code: "GO", region: "Friuli-Venezia Giulia" }, { code: "PN", region: "Friuli-Venezia Giulia" },
  { code: "TS", region: "Friuli-Venezia Giulia" }, { code: "UD", region: "Friuli-Venezia Giulia" },
  { code: "FR", region: "Lazio" }, { code: "LT", region: "Lazio" },
  { code: "RI", region: "Lazio" }, { code: "RM", region: "Lazio" }, { code: "VT", region: "Lazio" },
  { code: "GE", region: "Liguria" }, { code: "IM", region: "Liguria" },
  { code: "SP", region: "Liguria" }, { code: "SV", region: "Liguria" },
  { code: "BG", region: "Lombardia" }, { code: "BS", region: "Lombardia" },
  { code: "CO", region: "Lombardia" }, { code: "CR", region: "Lombardia" },
  { code: "LC", region: "Lombardia" }, { code: "LO", region: "Lombardia" },
  { code: "MB", region: "Lombardia" }, { code: "MI", region: "Lombardia" },
  { code: "MN", region: "Lombardia" }, { code: "PV", region: "Lombardia" },
  { code: "SO", region: "Lombardia" }, { code: "VA", region: "Lombardia" },
  { code: "AN", region: "Marche" }, { code: "AP", region: "Marche" },
  { code: "FM", region: "Marche" }, { code: "MC", region: "Marche" }, { code: "PU", region: "Marche" },
  { code: "CB", region: "Molise" }, { code: "IS", region: "Molise" },
  { code: "AL", region: "Piemonte" }, { code: "AT", region: "Piemonte" },
  { code: "BI", region: "Piemonte" }, { code: "CN", region: "Piemonte" },
  { code: "NO", region: "Piemonte" }, { code: "TO", region: "Piemonte" },
  { code: "VB", region: "Piemonte" }, { code: "VC", region: "Piemonte" },
  { code: "BA", region: "Puglia" }, { code: "BR", region: "Puglia" },
  { code: "BT", region: "Puglia" }, { code: "FG", region: "Puglia" },
  { code: "LE", region: "Puglia" }, { code: "TA", region: "Puglia" },
  { code: "CA", region: "Sardegna" }, { code: "NU", region: "Sardegna" },
  { code: "OR", region: "Sardegna" }, { code: "OT", region: "Sardegna" }, { code: "SS", region: "Sardegna" },
  { code: "AG", region: "Sicilia" }, { code: "CL", region: "Sicilia" },
  { code: "CT", region: "Sicilia" }, { code: "EN", region: "Sicilia" },
  { code: "ME", region: "Sicilia" }, { code: "PA", region: "Sicilia" },
  { code: "RG", region: "Sicilia" }, { code: "SR", region: "Sicilia" }, { code: "TP", region: "Sicilia" },
  { code: "AR", region: "Toscana" }, { code: "FI", region: "Toscana" },
  { code: "GR", region: "Toscana" }, { code: "LI", region: "Toscana" },
  { code: "LU", region: "Toscana" }, { code: "MS", region: "Toscana" },
  { code: "PI", region: "Toscana" }, { code: "PO", region: "Toscana" },
  { code: "PT", region: "Toscana" }, { code: "SI", region: "Toscana" },
  { code: "BZ", region: "Trentino-Alto Adige" }, { code: "TN", region: "Trentino-Alto Adige" },
  { code: "PG", region: "Umbria" }, { code: "TR", region: "Umbria" },
  { code: "AO", region: "Valle d'Aosta" },
  { code: "BL", region: "Veneto" }, { code: "PD", region: "Veneto" },
  { code: "RO", region: "Veneto" }, { code: "TV", region: "Veneto" },
  { code: "VE", region: "Veneto" }, { code: "VI", region: "Veneto" }, { code: "VR", region: "Veneto" },
];

// OSM tags to import, with readable label
const OSM_TAGS: { tag: string; label: string }[] = [
  { tag: "restaurant", label: "Ristoranti" },
  { tag: "fast_food", label: "Fast Food" },
  { tag: "cafe", label: "Bar e Caffè" },
  { tag: "bar", label: "Bar (locali)" },
  { tag: "pub", label: "Pub" },
  { tag: "pizza", label: "Pizzerie" },
  { tag: "ice_cream", label: "Gelaterie" },
  { tag: "bakery", label: "Panetterie" },
  { tag: "pastry", label: "Pasticcerie" },
  { tag: "supermarket", label: "Supermercati" },
  { tag: "convenience", label: "Alimentari" },
  { tag: "butcher", label: "Macellerie" },
  { tag: "fishmonger", label: "Pescherie" },
  { tag: "greengrocer", label: "Frutta e Verdura" },
  { tag: "deli", label: "Gastronomie" },
  { tag: "wine", label: "Enoteche" },
  { tag: "pharmacy", label: "Farmacie" },
  { tag: "doctors", label: "Medici" },
  { tag: "dentist", label: "Dentisti" },
  { tag: "hospital", label: "Ospedali" },
  { tag: "clinic", label: "Cliniche" },
  { tag: "physiotherapist", label: "Fisioterapisti" },
  { tag: "veterinary", label: "Veterinari" },
  { tag: "optician", label: "Ottici" },
  { tag: "hairdresser", label: "Parrucchieri" },
  { tag: "beauty", label: "Centri Estetici" },
  { tag: "massage", label: "Centri Massaggi" },
  { tag: "tattoo", label: "Tatuatori" },
  { tag: "hotel", label: "Hotel" },
  { tag: "guest_house", label: "B&B" },
  { tag: "hostel", label: "Ostelli" },
  { tag: "camp_site", label: "Campeggi" },
  { tag: "bank", label: "Banche" },
  { tag: "atm", label: "Bancomat" },
  { tag: "insurance", label: "Assicurazioni" },
  { tag: "lawyer", label: "Avvocati" },
  { tag: "notary", label: "Notai" },
  { tag: "accountant", label: "Commercialisti" },
  { tag: "architect", label: "Architetti" },
  { tag: "estate_agent", label: "Agenzie Immobiliari" },
  { tag: "travel_agency", label: "Agenzie di Viaggio" },
  { tag: "school", label: "Scuole" },
  { tag: "kindergarten", label: "Asili" },
  { tag: "driving_school", label: "Autoscuole" },
  { tag: "clothes", label: "Abbigliamento" },
  { tag: "shoes", label: "Calzature" },
  { tag: "electronics", label: "Elettronica" },
  { tag: "mobile_phone", label: "Telefonia" },
  { tag: "furniture", label: "Arredamento" },
  { tag: "hardware", label: "Ferramenta" },
  { tag: "doityourself", label: "Fai da Te" },
  { tag: "books", label: "Librerie" },
  { tag: "florist", label: "Fioristi" },
  { tag: "jewelry", label: "Gioiellerie" },
  { tag: "toys", label: "Giocattoli" },
  { tag: "sports", label: "Negozi Sport" },
  { tag: "bicycle", label: "Biciclette" },
  { tag: "car_repair", label: "Autofficine" },
  { tag: "car_dealer", label: "Concessionarie Auto" },
  { tag: "fuel", label: "Distributori Carburante" },
  { tag: "tyres", label: "Pneumatici" },
  { tag: "gym", label: "Palestre" },
  { tag: "laundry", label: "Lavanderie" },
  { tag: "post_office", label: "Uffici Postali" },
  { tag: "funeral_directors", label: "Onoranze Funebri" },
  { tag: "tobacco", label: "Tabaccherie" },
  { tag: "newsagent", label: "Edicole" },
  { tag: "stationery", label: "Cartolerie" },
  { tag: "carpenter", label: "Falegnami" },
  { tag: "plumber", label: "Idraulici" },
  { tag: "electrician", label: "Elettricisti" },
  { tag: "winery", label: "Cantine" },
];

interface StepResult {
  province: string;
  tag: string;
  label: string;
  status: 'pending' | 'running' | 'done' | 'error';
  imported?: number;
  total_found?: number;
  error?: string;
}

export function OsmImportSection() {
  const { showToast } = useToast();
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set(OSM_TAGS.map(t => t.tag)));
  const [steps, setSteps] = useState<StepResult[]>([]);
  const [running, setRunning] = useState(false);
  const [abortRef] = useState({ current: false });

  const region = PROVINCES.find(p => p.code === selectedProvince)?.region ?? '';

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => {
      const next = new Set(prev);
      next.has(tag) ? next.delete(tag) : next.add(tag);
      return next;
    });
  };

  const startImport = async () => {
    if (!selectedProvince) { showToast('Seleziona una provincia', 'error'); return; }
    if (selectedTags.size === 0) { showToast('Seleziona almeno una categoria', 'error'); return; }

    abortRef.current = false;
    const tagList = OSM_TAGS.filter(t => selectedTags.has(t.tag));
    const initial: StepResult[] = tagList.map(t => ({
      province: selectedProvince, tag: t.tag, label: t.label,
      status: 'pending',
    }));
    setSteps(initial);
    setRunning(true);

    const { data: { session } } = await supabase.auth.getSession();

    for (let i = 0; i < tagList.length; i++) {
      if (abortRef.current) break;
      const { tag, label } = tagList[i];

      setSteps(prev => prev.map((s, idx) => idx === i ? { ...s, status: 'running' } : s));

      try {
        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fill-empty-comuni`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session?.access_token}`,
            },
            body: JSON.stringify({ province: selectedProvince, region, osm_tag: tag }),
          }
        );
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Errore');
        setSteps(prev => prev.map((s, idx) => idx === i
          ? { ...s, status: 'done', imported: json.imported, total_found: json.total_found }
          : s
        ));
      } catch (e: any) {
        setSteps(prev => prev.map((s, idx) => idx === i
          ? { ...s, status: 'error', error: e.message }
          : s
        ));
      }

      // Small delay between categories to be kind to Overpass
      if (i < tagList.length - 1 && !abortRef.current) {
        await new Promise(r => setTimeout(r, 1200));
      }
    }

    setRunning(false);
    if (!abortRef.current) {
      const total = steps.reduce((s, r) => s + (r.imported ?? 0), 0);
      showToast(`Import completato per ${selectedProvince}`, 'success');
    }
  };

  const stopImport = () => {
    abortRef.current = true;
    setRunning(false);
  };

  const doneSteps = steps.filter(s => s.status === 'done');
  const errorSteps = steps.filter(s => s.status === 'error');
  const totalImported = doneSteps.reduce((s, r) => s + (r.imported ?? 0), 0);
  const totalFound = doneSteps.reduce((s, r) => s + (r.total_found ?? 0), 0);

  // Group provinces by region for the select
  const byRegion = PROVINCES.reduce<Record<string, string[]>>((acc, p) => {
    if (!acc[p.region]) acc[p.region] = [];
    acc[p.region].push(p.code);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Config panel */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
            <Download className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Import da OpenStreetMap</h2>
            <p className="text-sm text-gray-500">Seleziona una provincia — importa categoria per categoria su tutta la provincia</p>
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-4 mb-6">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Provincia</label>
            <select
              value={selectedProvince}
              onChange={e => { setSelectedProvince(e.target.value); setSteps([]); }}
              disabled={running}
              className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white min-w-[140px] disabled:opacity-50"
            >
              <option value="">Seleziona...</option>
              {Object.entries(byRegion).sort(([a], [b]) => a.localeCompare(b)).map(([reg, codes]) => (
                <optgroup key={reg} label={reg}>
                  {codes.map(c => <option key={c} value={c}>{c}</option>)}
                </optgroup>
              ))}
            </select>
          </div>

          {selectedProvince && (
            <div className="text-sm text-gray-500">
              Regione: <span className="font-semibold text-gray-800">{region}</span>
            </div>
          )}

          <div className="flex gap-2 ml-auto">
            {running ? (
              <button
                onClick={stopImport}
                className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors"
              >
                <Square className="w-4 h-4" />
                Ferma
              </button>
            ) : (
              <button
                onClick={startImport}
                disabled={!selectedProvince || selectedTags.size === 0}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-colors"
              >
                <Play className="w-4 h-4" />
                Avvia Import
              </button>
            )}
          </div>
        </div>

        {/* Tag selection */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-gray-600">Categorie da importare ({selectedTags.size}/{OSM_TAGS.length})</label>
            <div className="flex gap-3">
              <button onClick={() => setSelectedTags(new Set(OSM_TAGS.map(t => t.tag)))} className="text-xs text-emerald-600 hover:text-emerald-700 font-medium">Tutte</button>
              <button onClick={() => setSelectedTags(new Set())} className="text-xs text-gray-400 hover:text-gray-600 font-medium">Nessuna</button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {OSM_TAGS.map(({ tag, label }) => {
              const step = steps.find(s => s.tag === tag);
              const isSel = selectedTags.has(tag);
              return (
                <button
                  key={tag}
                  onClick={() => !running && toggleTag(tag)}
                  disabled={running}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                    step?.status === 'done'
                      ? 'bg-green-100 border-green-300 text-green-700'
                      : step?.status === 'running'
                      ? 'bg-blue-100 border-blue-300 text-blue-700 animate-pulse'
                      : step?.status === 'error'
                      ? 'bg-red-100 border-red-300 text-red-700'
                      : isSel
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                      : 'bg-gray-50 border-gray-200 text-gray-400'
                  }`}
                >
                  {step?.status === 'running' && <RefreshCw className="inline w-2.5 h-2.5 mr-1 animate-spin" />}
                  {step?.status === 'done' && <CheckCircle className="inline w-2.5 h-2.5 mr-1" />}
                  {step?.status === 'error' && <XCircle className="inline w-2.5 h-2.5 mr-1" />}
                  {label}
                  {step?.status === 'done' && step.imported !== undefined && (
                    <span className="ml-1 text-green-600 font-bold">+{step.imported}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Live progress */}
      {steps.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-gray-400" />
              <span className="font-semibold text-gray-900">Provincia {selectedProvince} — {region}</span>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-green-600 font-bold">{totalImported} importate</span>
              <span className="text-gray-400">{totalFound} trovate in OSM</span>
              {errorSteps.length > 0 && <span className="text-red-500">{errorSteps.length} errori</span>}
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-1.5 bg-gray-100">
            <div
              className="h-full bg-emerald-500 transition-all duration-300"
              style={{ width: `${steps.length > 0 ? (doneSteps.length + errorSteps.length) / steps.length * 100 : 0}%` }}
            />
          </div>

          <div className="p-4 max-h-96 overflow-y-auto">
            <div className="space-y-1">
              {steps.map((step, i) => (
                <div
                  key={i}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm ${
                    step.status === 'running' ? 'bg-blue-50' :
                    step.status === 'done' ? 'bg-green-50' :
                    step.status === 'error' ? 'bg-red-50' :
                    'bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {step.status === 'running' && <RefreshCw className="w-3.5 h-3.5 text-blue-500 animate-spin" />}
                    {step.status === 'done' && <CheckCircle className="w-3.5 h-3.5 text-green-500" />}
                    {step.status === 'error' && <XCircle className="w-3.5 h-3.5 text-red-500" />}
                    {step.status === 'pending' && <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-300" />}
                    <span className={`font-medium ${
                      step.status === 'running' ? 'text-blue-700' :
                      step.status === 'done' ? 'text-green-700' :
                      step.status === 'error' ? 'text-red-700' :
                      'text-gray-500'
                    }`}>{step.label}</span>
                  </div>
                  <div className="text-xs text-right">
                    {step.status === 'done' && (
                      <span className="text-green-600 font-semibold">
                        +{step.imported} nuove
                        {step.total_found !== undefined && step.total_found > 0 && (
                          <span className="text-gray-400 font-normal ml-1">({step.total_found} in OSM)</span>
                        )}
                      </span>
                    )}
                    {step.status === 'error' && <span className="text-red-600">{step.error}</span>}
                    {step.status === 'running' && <span className="text-blue-500">in corso...</span>}
                    {step.status === 'pending' && <span className="text-gray-300">in attesa</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
