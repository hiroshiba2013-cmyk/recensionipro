import { useState, useRef } from 'react';
import { Download, RefreshCw, CheckCircle, XCircle, Play, Square } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../common/Toast';

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

// Province → ISO 3166-2 code for Overpass area lookup
const PROVINCE_ISO: Record<string, string> = {
  AG:"IT-AG",AN:"IT-AN",AO:"IT-AO",AP:"IT-AP",AQ:"IT-AQ",AR:"IT-AR",AT:"IT-AT",
  AV:"IT-AV",BA:"IT-BA",BG:"IT-BG",BI:"IT-BI",BL:"IT-BL",BN:"IT-BN",BO:"IT-BO",
  BR:"IT-BR",BS:"IT-BS",BT:"IT-BT",BZ:"IT-BZ",CA:"IT-CA",CB:"IT-CB",CE:"IT-CE",
  CH:"IT-CH",CL:"IT-CL",CN:"IT-CN",CO:"IT-CO",CR:"IT-CR",CS:"IT-CS",CT:"IT-CT",
  CZ:"IT-CZ",EN:"IT-EN",FC:"IT-FC",FE:"IT-FE",FG:"IT-FG",FI:"IT-FI",FM:"IT-FM",
  FR:"IT-FR",GE:"IT-GE",GO:"IT-GO",GR:"IT-GR",IM:"IT-IM",IS:"IT-IS",KR:"IT-KR",
  LC:"IT-LC",LE:"IT-LE",LI:"IT-LI",LO:"IT-LO",LT:"IT-LT",LU:"IT-LU",MB:"IT-MB",
  MC:"IT-MC",ME:"IT-ME",MI:"IT-MI",MN:"IT-MN",MO:"IT-MO",MS:"IT-MS",MT:"IT-MT",
  NA:"IT-NA",NO:"IT-NO",NU:"IT-NU",OR:"IT-OR",OT:"IT-SS",PA:"IT-PA",PC:"IT-PC",
  PE:"IT-PE",PG:"IT-PG",PI:"IT-PI",PN:"IT-PN",PO:"IT-PO",PR:"IT-PR",PT:"IT-PT",
  PU:"IT-PU",PV:"IT-PV",PZ:"IT-PZ",RA:"IT-RA",RC:"IT-RC",RE:"IT-RE",RG:"IT-RG",
  RI:"IT-RI",RM:"IT-RM",RN:"IT-RN",RO:"IT-RO",SA:"IT-SA",SI:"IT-SI",SO:"IT-SO",
  SP:"IT-SP",SR:"IT-SR",SS:"IT-SS",SV:"IT-SV",TA:"IT-TA",TE:"IT-TE",TN:"IT-TN",
  TO:"IT-TO",TP:"IT-TP",TR:"IT-TR",TS:"IT-TS",TV:"IT-TV",UD:"IT-UD",VA:"IT-VA",
  VB:"IT-VB",VC:"IT-VC",VE:"IT-VE",VI:"IT-VI",VR:"IT-VR",VT:"IT-VT",VV:"IT-VV",
};

// OSM key for each tag
const OSM_KEY: Record<string, string> = {
  restaurant:"amenity",fast_food:"amenity",cafe:"amenity",bar:"amenity",pub:"amenity",
  biergarten:"amenity",food_court:"amenity",ice_cream:"amenity",pharmacy:"amenity",
  doctors:"amenity",dentist:"amenity",hospital:"amenity",clinic:"amenity",gym:"amenity",
  bank:"amenity",atm:"amenity",post_office:"amenity",library:"amenity",
  charging_station:"amenity",vending_machine:"amenity",parking:"amenity",
  nightclub:"amenity",taxi:"amenity",driving_school:"amenity",kindergarten:"amenity",
  university:"amenity",school:"amenity",funeral_directors:"amenity",sauna:"amenity",
  fuel:"amenity",
  supermarket:"shop",convenience:"shop",greengrocer:"shop",butcher:"shop",
  fishmonger:"shop",deli:"shop",dairy:"shop",bakery:"shop",pastry:"shop",
  confectionery:"shop",chocolate:"shop",cheese:"shop",wine:"shop",beverages:"shop",
  pasta:"shop",pizza:"shop",clothes:"shop",shoes:"shop",boutique:"shop",fashion:"shop",
  leather:"shop",electronics:"shop",computer:"shop",mobile_phone:"shop",hifi:"shop",
  camera:"shop",video_games:"shop",furniture:"shop",kitchen:"shop",bed:"shop",
  flooring:"shop",tiles:"shop",bathroom_furnishing:"shop",curtain:"shop",carpet:"shop",
  lighting:"shop",glaziery:"shop",books:"shop",newsagent:"shop",stationery:"shop",
  florist:"shop",jewelry:"shop",watches:"shop",toys:"shop",baby_goods:"shop",
  sports:"shop",outdoor:"shop",bicycle:"shop",motorcycle:"shop",music:"shop",
  musical_instrument:"shop",gift:"shop",antiques:"shop",second_hand:"shop",
  model:"shop",hobby:"shop",art:"shop",photo:"shop",tobacco:"shop",
  e_cigarette:"shop",erotic:"shop",weapons:"shop",hardware:"shop",doityourself:"shop",
  paint:"shop",building_materials:"shop",car_repair:"shop",car_wash:"shop",
  car_rental:"shop",car_parts:"shop",car_dealer:"shop",tyres:"shop",
  vehicle_inspection:"shop",pet:"shop",pet_grooming:"shop",coffee:"shop",
  spices:"shop",tea:"shop",department_store:"shop",mall:"shop",
  variety_store:"shop",general:"shop",hairdresser:"shop",hairdresser_supply:"shop",
  optician:"shop",hearing_aids:"shop",travel_agency:"shop",copyshop:"shop",
  laundry:"shop",dry_cleaning:"shop",swimming_pool:"shop",golf_course:"shop",
  lawyer:"office",notary:"office",accountant:"office",financial_advisor:"office",
  tax_advisor:"office",architect:"office",engineer:"office",surveyor:"office",
  estate_agent:"office",employment_agency:"office",advertising:"office",
  consultant:"office",insurance:"office",telecommunication:"office",
  blacksmith:"craft",carpenter:"craft",plumber:"craft",electrician:"craft",
  painter:"craft",shoemaker:"craft",key_cutter:"craft",roofing:"craft",
  stonemason:"craft",beekeeper:"craft",winery:"craft",distillery:"craft",
  tailor:"craft",bicycle_rental:"amenity",martial_arts:"leisure",yoga:"leisure",
  music_school:"amenity",dancing_school:"amenity",language_school:"amenity",
  guest_house:"tourism",hotel:"tourism",motel:"tourism",hostel:"tourism",
  camp_site:"tourism",caravan_site:"tourism",chalet:"tourism",
};

const OSM_TAGS: { tag: string; label: string }[] = [
  { tag: "restaurant", label: "Ristoranti" },
  { tag: "fast_food", label: "Fast Food" },
  { tag: "cafe", label: "Bar e Caffè" },
  { tag: "bar", label: "Bar" },
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
  { tag: "veterinary", label: "Veterinari" },
  { tag: "optician", label: "Ottici" },
  { tag: "hairdresser", label: "Parrucchieri" },
  { tag: "beauty", label: "Centri Estetici" },
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
  { tag: "fuel", label: "Distributori" },
  { tag: "tyres", label: "Pneumatici" },
  { tag: "gym", label: "Palestre" },
  { tag: "laundry", label: "Lavanderie" },
  { tag: "post_office", label: "Uffici Postali" },
  { tag: "funeral_directors", label: "Onoranze Funebri" },
  { tag: "tobacco", label: "Tabaccherie" },
  { tag: "newsagent", label: "Edicole" },
  { tag: "carpenter", label: "Falegnami" },
  { tag: "plumber", label: "Idraulici" },
  { tag: "electrician", label: "Elettricisti" },
  { tag: "winery", label: "Cantine" },
];

interface StepResult {
  tag: string;
  label: string;
  status: 'pending' | 'fetching' | 'inserting' | 'done' | 'error';
  found?: number;
  imported?: number;
  skipped?: number;
  error?: string;
}

// Query Overpass directly from the browser — no edge function timeout risk
async function queryOverpass(isoCode: string, osmKey: string, osmTag: string): Promise<any[]> {
  const query = `[out:json][timeout:180];
area["ISO3166-2"="${isoCode}"]["boundary"="administrative"]->.prov;
(
  node["name"]["${osmKey}"="${osmTag}"](area.prov);
  way["name"]["${osmKey}"="${osmTag}"](area.prov);
);
out center tags;`;

  const res = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `data=${encodeURIComponent(query)}`,
  });
  if (!res.ok) throw new Error(`Overpass ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.elements ?? [];
}

function parseElements(elements: any[]): any[] {
  return elements
    .filter(el => el.tags?.name)
    .map(el => {
      const tags = el.tags;
      return {
        name: tags.name,
        osm_id: `${el.type}/${el.id}`,
        city: tags['addr:city'] || tags['addr:municipality'] || null,
        street: tags['addr:street'] || null,
        postal_code: tags['addr:postcode'] || null,
        phone: tags.phone || tags['contact:phone'] || null,
        website: tags.website || tags['contact:website'] || null,
        email: tags.email || tags['contact:email'] || null,
        business_hours: tags.opening_hours || null,
        latitude: el.lat ?? el.center?.lat ?? null,
        longitude: el.lon ?? el.center?.lon ?? null,
      };
    });
}

export function OsmImportSection() {
  const { showToast } = useToast();
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set(OSM_TAGS.map(t => t.tag)));
  const [steps, setSteps] = useState<StepResult[]>([]);
  const [running, setRunning] = useState(false);
  const abortRef = useRef(false);

  const region = PROVINCES.find(p => p.code === selectedProvince)?.region ?? '';

  const updateStep = (i: number, patch: Partial<StepResult>) =>
    setSteps(prev => prev.map((s, idx) => idx === i ? { ...s, ...patch } : s));

  const startImport = async () => {
    if (!selectedProvince) { showToast('Seleziona una provincia', 'error'); return; }
    if (selectedTags.size === 0) { showToast('Seleziona almeno una categoria', 'error'); return; }

    abortRef.current = false;
    const tagList = OSM_TAGS.filter(t => selectedTags.has(t.tag));
    setSteps(tagList.map(t => ({ tag: t.tag, label: t.label, status: 'pending' })));
    setRunning(true);

    const isoCode = PROVINCE_ISO[selectedProvince];
    const { data: { session } } = await supabase.auth.getSession();

    for (let i = 0; i < tagList.length; i++) {
      if (abortRef.current) break;
      const { tag, label } = tagList[i];
      const osmKey = OSM_KEY[tag] ?? 'amenity';

      // Step 1: fetch from Overpass (browser, no timeout limit)
      updateStep(i, { status: 'fetching' });
      let elements: any[] = [];
      try {
        elements = await queryOverpass(isoCode, osmKey, tag);
      } catch (e: any) {
        updateStep(i, { status: 'error', error: `Overpass: ${e.message}` });
        await new Promise(r => setTimeout(r, 1000));
        continue;
      }

      if (abortRef.current) break;

      const businesses = parseElements(elements);

      if (businesses.length === 0) {
        updateStep(i, { status: 'done', found: 0, imported: 0, skipped: 0 });
        continue;
      }

      // Step 2: send to edge function for DB insert
      updateStep(i, { status: 'inserting', found: businesses.length });
      try {
        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fill-empty-comuni`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session?.access_token}`,
            },
            body: JSON.stringify({ province: selectedProvince, region, osm_tag: tag, businesses }),
          }
        );
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Errore insert');
        updateStep(i, { status: 'done', found: businesses.length, imported: json.imported, skipped: json.skipped });
      } catch (e: any) {
        updateStep(i, { status: 'error', found: businesses.length, error: `Insert: ${e.message}` });
      }

      // Brief pause between categories to avoid Overpass rate limiting
      if (i < tagList.length - 1 && !abortRef.current) {
        await new Promise(r => setTimeout(r, 800));
      }
    }

    setRunning(false);
    if (!abortRef.current) showToast(`Import completato per ${selectedProvince}`, 'success');
  };

  const stopImport = () => {
    abortRef.current = true;
    setRunning(false);
  };

  const done = steps.filter(s => s.status === 'done');
  const errors = steps.filter(s => s.status === 'error');
  const totalImported = done.reduce((s, r) => s + (r.imported ?? 0), 0);
  const totalFound = done.reduce((s, r) => s + (r.found ?? 0), 0);
  const progress = steps.length > 0 ? (done.length + errors.length) / steps.length : 0;

  const byRegion = PROVINCES.reduce<Record<string, string[]>>((acc, p) => {
    if (!acc[p.region]) acc[p.region] = [];
    acc[p.region].push(p.code);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Config */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
            <Download className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Import da OpenStreetMap</h2>
            <p className="text-sm text-gray-500">
              Seleziona una provincia — la query Overpass viene eseguita nel browser, poi i dati vengono salvati nel DB categoria per categoria
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-4 mb-6">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Provincia</label>
            <select
              value={selectedProvince}
              onChange={e => { setSelectedProvince(e.target.value); setSteps([]); }}
              disabled={running}
              className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white min-w-[160px] disabled:opacity-50"
            >
              <option value="">Seleziona...</option>
              {Object.entries(byRegion).sort(([a], [b]) => a.localeCompare(b)).map(([reg, codes]) => (
                <optgroup key={reg} label={reg}>
                  {codes.map(c => <option key={c} value={c}>{c} — {reg}</option>)}
                </optgroup>
              ))}
            </select>
          </div>

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

        {/* Tag chips */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-600">
              Categorie ({selectedTags.size}/{OSM_TAGS.length})
            </span>
            <div className="flex gap-3">
              <button onClick={() => setSelectedTags(new Set(OSM_TAGS.map(t => t.tag)))} className="text-xs text-emerald-600 hover:text-emerald-700 font-medium">Tutte</button>
              <button onClick={() => setSelectedTags(new Set())} className="text-xs text-gray-400 hover:text-gray-600 font-medium">Nessuna</button>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {OSM_TAGS.map(({ tag, label }) => {
              const step = steps.find(s => s.tag === tag);
              const isSel = selectedTags.has(tag);
              return (
                <button
                  key={tag}
                  onClick={() => {
                    if (running) return;
                    setSelectedTags(prev => {
                      const next = new Set(prev);
                      next.has(tag) ? next.delete(tag) : next.add(tag);
                      return next;
                    });
                  }}
                  disabled={running}
                  title={tag}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                    step?.status === 'done'
                      ? 'bg-green-100 border-green-300 text-green-700'
                      : step?.status === 'fetching' || step?.status === 'inserting'
                      ? 'bg-blue-100 border-blue-300 text-blue-700'
                      : step?.status === 'error'
                      ? 'bg-red-100 border-red-300 text-red-700'
                      : isSel
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                      : 'bg-gray-50 border-gray-200 text-gray-400'
                  }`}
                >
                  {(step?.status === 'fetching' || step?.status === 'inserting') && (
                    <RefreshCw className="inline w-2.5 h-2.5 mr-1 animate-spin" />
                  )}
                  {step?.status === 'done' && <CheckCircle className="inline w-2.5 h-2.5 mr-1" />}
                  {step?.status === 'error' && <XCircle className="inline w-2.5 h-2.5 mr-1" />}
                  {label}
                  {step?.status === 'done' && step.imported !== undefined && step.imported > 0 && (
                    <span className="ml-1 font-bold text-green-600">+{step.imported}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Progress list */}
      {steps.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <span className="font-semibold text-gray-900">
              {selectedProvince} — {region}
            </span>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-green-600 font-bold">{totalImported} importate</span>
              <span className="text-gray-400">{totalFound} trovate</span>
              {errors.length > 0 && <span className="text-red-500">{errors.length} errori</span>}
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-1 bg-gray-100">
            <div
              className="h-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${progress * 100}%` }}
            />
          </div>

          <div className="divide-y divide-gray-50 max-h-[480px] overflow-y-auto">
            {steps.map((step, i) => (
              <div
                key={i}
                className={`flex items-center justify-between px-5 py-2.5 text-sm ${
                  step.status === 'fetching' || step.status === 'inserting' ? 'bg-blue-50/60' :
                  step.status === 'done' ? 'bg-green-50/40' :
                  step.status === 'error' ? 'bg-red-50/40' : ''
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {(step.status === 'fetching' || step.status === 'inserting')
                    ? <RefreshCw className="w-3.5 h-3.5 text-blue-500 animate-spin flex-shrink-0" />
                    : step.status === 'done'
                    ? <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                    : step.status === 'error'
                    ? <XCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                    : <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-200 flex-shrink-0" />
                  }
                  <span className={`font-medium ${
                    step.status === 'fetching' || step.status === 'inserting' ? 'text-blue-700' :
                    step.status === 'done' ? 'text-green-700' :
                    step.status === 'error' ? 'text-red-700' : 'text-gray-400'
                  }`}>{step.label}</span>
                </div>
                <div className="text-xs text-right tabular-nums">
                  {step.status === 'fetching' && <span className="text-blue-500">ricerca in OSM...</span>}
                  {step.status === 'inserting' && <span className="text-blue-600">{step.found} trovate, salvataggio...</span>}
                  {step.status === 'done' && (
                    <span>
                      <span className="text-green-600 font-semibold">+{step.imported} nuove</span>
                      {(step.skipped ?? 0) > 0 && <span className="text-gray-400 ml-1">{step.skipped} già presenti</span>}
                      {(step.found ?? 0) > 0 && <span className="text-gray-300 ml-1">({step.found} in OSM)</span>}
                    </span>
                  )}
                  {step.status === 'error' && <span className="text-red-500 max-w-[240px] truncate block">{step.error}</span>}
                  {step.status === 'pending' && <span className="text-gray-200">—</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
