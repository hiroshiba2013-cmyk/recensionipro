/**
 * Importa le regioni ancora mancanti o con pochi dati
 */
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import https from 'https';

config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const MISSING_CITIES = [
  // === MOLISE (0 attivita') ===
  { name: 'Campobasso', region: 'Molise', province: 'CB', bbox: [41.55, 14.64, 41.63, 14.72] },
  { name: 'Isernia', region: 'Molise', province: 'IS', bbox: [41.59, 14.22, 41.67, 14.30] },
  { name: 'Termoli', region: 'Molise', province: 'CB', bbox: [42.00, 14.99, 42.08, 15.07] },
  { name: 'Venafro', region: 'Molise', province: 'IS', bbox: [41.48, 14.03, 41.56, 14.11] },
  { name: 'Bojano', region: 'Molise', province: 'CB', bbox: [41.48, 14.47, 41.56, 14.55] },
  { name: 'Larino', region: 'Molise', province: 'CB', bbox: [41.79, 14.90, 41.87, 14.98] },
  { name: 'Agnone', region: 'Molise', province: 'IS', bbox: [41.80, 14.35, 41.88, 14.43] },

  // === VALLE D'AOSTA (0 attivita') ===
  { name: 'Aosta', region: "Valle d'Aosta", province: 'AO', bbox: [45.72, 7.29, 45.80, 7.37] },
  { name: 'Courmayeur', region: "Valle d'Aosta", province: 'AO', bbox: [45.78, 6.97, 45.86, 7.05] },
  { name: 'Saint-Vincent', region: "Valle d'Aosta", province: 'AO', bbox: [45.74, 7.63, 45.82, 7.71] },
  { name: 'Chatillon', region: "Valle d'Aosta", province: 'AO', bbox: [45.74, 7.60, 45.82, 7.68] },
  { name: 'Pont-Saint-Martin', region: "Valle d'Aosta", province: 'AO', bbox: [45.59, 7.79, 45.67, 7.87] },
  { name: 'Morgex', region: "Valle d'Aosta", province: 'AO', bbox: [45.75, 7.02, 45.83, 7.10] },

  // === MARCHE extra (solo 2 citta' coperte) ===
  { name: 'Macerata', region: 'Marche', province: 'MC', bbox: [43.29, 13.45, 43.37, 13.53] },
  { name: 'Fermo', region: 'Marche', province: 'FM', bbox: [43.15, 13.71, 43.23, 13.79] },
  { name: 'Senigallia', region: 'Marche', province: 'AN', bbox: [43.70, 13.20, 43.78, 13.28] },
  { name: 'Civitanova Marche', region: 'Marche', province: 'MC', bbox: [43.29, 13.72, 43.37, 13.80] },
  { name: 'San Benedetto del Tronto', region: 'Marche', province: 'AP', bbox: [42.94, 13.86, 43.02, 13.94] },
  { name: 'Jesi', region: 'Marche', province: 'AN', bbox: [43.52, 13.24, 43.60, 13.32] },
  { name: 'Ascoli Piceno', region: 'Marche', province: 'AP', bbox: [42.84, 13.57, 42.92, 13.65] },
  { name: 'Fabriano', region: 'Marche', province: 'AN', bbox: [43.33, 12.89, 43.41, 12.97] },
  { name: 'Porto San Giorgio', region: 'Marche', province: 'FM', bbox: [43.18, 13.78, 43.26, 13.86] },
  { name: 'Osimo', region: 'Marche', province: 'AN', bbox: [43.47, 13.47, 43.55, 13.55] },
  { name: 'Tolentino', region: 'Marche', province: 'MC', bbox: [43.20, 13.27, 43.28, 13.35] },
  { name: 'Recanati', region: 'Marche', province: 'MC', bbox: [43.39, 13.54, 43.47, 13.62] },
  { name: 'Potenza Picena', region: 'Marche', province: 'MC', bbox: [43.36, 13.68, 43.44, 13.76] },

  // === UMBRIA extra (solo 4 citta') ===
  { name: 'Foligno', region: 'Umbria', province: 'PG', bbox: [42.94, 12.69, 43.02, 12.77] },
  { name: 'Spoleto', region: 'Umbria', province: 'PG', bbox: [42.73, 12.73, 42.81, 12.81] },
  { name: 'Citta di Castello', region: 'Umbria', province: 'PG', bbox: [43.45, 12.24, 43.53, 12.32] },
  { name: 'Gubbio', region: 'Umbria', province: 'PG', bbox: [43.35, 12.56, 43.43, 12.64] },
  { name: 'Orvieto', region: 'Umbria', province: 'TR', bbox: [42.71, 12.10, 42.79, 12.18] },
  { name: 'Narni', region: 'Umbria', province: 'TR', bbox: [42.51, 12.51, 42.59, 12.59] },
  { name: 'Corciano', region: 'Umbria', province: 'PG', bbox: [43.09, 12.28, 43.17, 12.36] },
  { name: 'Bastia Umbra', region: 'Umbria', province: 'PG', bbox: [43.06, 12.53, 43.14, 12.61] },
  { name: 'Assisi', region: 'Umbria', province: 'PG', bbox: [43.07, 12.61, 43.15, 12.69] },
  { name: 'Citta della Pieve', region: 'Umbria', province: 'PG', bbox: [42.95, 12.00, 43.03, 12.08] },

  // === BASILICATA extra (solo 3 citta') ===
  { name: 'Melfi', region: 'Basilicata', province: 'PZ', bbox: [40.99, 15.64, 41.07, 15.72] },
  { name: 'Pisticci', region: 'Basilicata', province: 'MT', bbox: [40.38, 16.55, 40.46, 16.63] },
  { name: 'Policoro', region: 'Basilicata', province: 'MT', bbox: [40.19, 16.66, 40.27, 16.74] },
  { name: 'Venosa', region: 'Basilicata', province: 'PZ', bbox: [40.95, 15.81, 41.03, 15.89] },
  { name: 'Lavello', region: 'Basilicata', province: 'PZ', bbox: [40.98, 15.78, 41.06, 15.86] },
  { name: 'Rionero in Vulture', region: 'Basilicata', province: 'PZ', bbox: [40.91, 15.66, 40.99, 15.74] },
  { name: 'Senise', region: 'Basilicata', province: 'PZ', bbox: [40.14, 16.27, 40.22, 16.35] },
  { name: 'Lauria', region: 'Basilicata', province: 'PZ', bbox: [40.04, 15.83, 40.12, 15.91] },
  { name: 'Lagonegro', region: 'Basilicata', province: 'PZ', bbox: [40.12, 15.76, 40.20, 15.84] },

  // === SARDEGNA extra ===
  { name: 'Nuoro', region: 'Sardegna', province: 'NU', bbox: [40.31, 9.32, 40.39, 9.40] },
  { name: 'Olbia', region: 'Sardegna', province: 'SS', bbox: [40.91, 9.49, 40.99, 9.57] },
  { name: 'Oristano', region: 'Sardegna', province: 'OR', bbox: [39.89, 8.58, 39.97, 8.66] },
  { name: 'Quartu Sant Elena', region: 'Sardegna', province: 'CA', bbox: [39.24, 9.17, 39.32, 9.25] },
  { name: 'Alghero', region: 'Sardegna', province: 'SS', bbox: [40.55, 8.29, 40.63, 8.37] },
  { name: 'Iglesias', region: 'Sardegna', province: 'SU', bbox: [39.30, 8.52, 39.38, 8.60] },
  { name: 'Carbonia', region: 'Sardegna', province: 'SU', bbox: [39.16, 8.51, 39.24, 8.59] },
  { name: 'Tempio Pausania', region: 'Sardegna', province: 'SS', bbox: [40.89, 9.09, 40.97, 9.17] },
  { name: 'Selargius', region: 'Sardegna', province: 'CA', bbox: [39.24, 9.13, 39.32, 9.21] },

  // === CALABRIA extra ===
  { name: 'Palmi', region: 'Calabria', province: 'RC', bbox: [38.35, 15.84, 38.43, 15.92] },
  { name: 'Gioia Tauro', region: 'Calabria', province: 'RC', bbox: [38.42, 15.89, 38.50, 15.97] },
  { name: 'Locri', region: 'Calabria', province: 'RC', bbox: [38.23, 16.25, 38.31, 16.33] },
  { name: 'Scalea', region: 'Calabria', province: 'CS', bbox: [39.81, 15.78, 39.89, 15.86] },
  { name: 'Soverato', region: 'Calabria', province: 'CZ', bbox: [38.68, 16.53, 38.76, 16.61] },
  { name: 'Cirò Marina', region: 'Calabria', province: 'KR', bbox: [39.36, 17.12, 39.44, 17.20] },
  { name: 'Trebisacce', region: 'Calabria', province: 'CS', bbox: [39.86, 16.52, 39.94, 16.60] },

  // === ABRUZZO extra ===
  { name: 'Chieti', region: 'Abruzzo', province: 'CH', bbox: [42.34, 14.14, 42.42, 14.22] },
  { name: 'Avezzano', region: 'Abruzzo', province: 'AQ', bbox: [42.02, 13.41, 42.10, 13.49] },
  { name: 'Sulmona', region: 'Abruzzo', province: 'AQ', bbox: [42.04, 13.92, 42.12, 14.00] },
  { name: 'Montesilvano', region: 'Abruzzo', province: 'PE', bbox: [42.50, 14.14, 42.58, 14.22] },
  { name: 'Francavilla al Mare', region: 'Abruzzo', province: 'CH', bbox: [42.41, 14.27, 42.49, 14.35] },
  { name: 'Ortona', region: 'Abruzzo', province: 'CH', bbox: [42.35, 14.40, 42.43, 14.48] },
  { name: 'Alba Adriatica', region: 'Abruzzo', province: 'TE', bbox: [42.82, 13.93, 42.90, 14.01] },
  { name: 'Giulianova', region: 'Abruzzo', province: 'TE', bbox: [42.75, 13.95, 42.83, 14.03] },
  { name: 'Roseto degli Abruzzi', region: 'Abruzzo', province: 'TE', bbox: [42.66, 14.01, 42.74, 14.09] },
  { name: 'Pineto', region: 'Abruzzo', province: 'TE', bbox: [42.60, 14.06, 42.68, 14.14] },
];

const BATCH_QUERY_TEMPLATE = (bboxStr) => `
[out:json][timeout:180];
(
  node["amenity"~"restaurant|cafe|bar|pub|fast_food|ice_cream|nightclub|bank|pharmacy|dentist|doctors|clinic|hospital|veterinary|fuel|post_office|car_wash|car_rental|laundry|driving_school|language_school|music_school|school|kindergarten|library"](${bboxStr});
  way["amenity"~"restaurant|cafe|bar|pub|fast_food|ice_cream|nightclub|bank|pharmacy|dentist|doctors|clinic|hospital|veterinary|fuel|post_office|car_wash|car_rental|laundry|driving_school|language_school|music_school|school|kindergarten|library"](${bboxStr});
  node["shop"~"supermarket|convenience|bakery|butcher|greengrocer|clothes|shoes|jewelry|hairdresser|beauty|cosmetics|hardware|furniture|florist|electronics|computer|mobile_phone|books|stationery|newsagent|pharmacy|optician|sports|bicycle|pet|car|car_repair|tobacco|alcohol|seafood|cheese|deli|gift|toys|antiques|second_hand|fabric|tailor|watches|bag|photo|music|art|medical_supply"](${bboxStr});
  way["shop"~"supermarket|convenience|bakery|butcher|greengrocer|clothes|shoes|jewelry|hairdresser|beauty|cosmetics|hardware|furniture|florist|electronics|computer|mobile_phone|books|stationery|newsagent|pharmacy|optician|sports|bicycle|pet|car|car_repair|tobacco|alcohol|seafood|cheese|deli|gift|toys|antiques|second_hand|fabric|tailor|watches|bag|photo|music|art|medical_supply"](${bboxStr});
  node["tourism"~"hotel|guest_house|hostel|motel|apartment|camp_site"](${bboxStr});
  way["tourism"~"hotel|guest_house|hostel|motel|apartment|camp_site"](${bboxStr});
  node["leisure"~"fitness_centre|sports_centre|swimming_pool|dance"](${bboxStr});
  node["office"~"lawyer|accountant|architect|engineer|estate_agent|insurance|notary|travel_agent|it"](${bboxStr});
  node["craft"~"carpenter|electrician|plumber|painter|shoemaker|bakery|jeweller|printing"](${bboxStr});
  node["healthcare"~"laboratory|physiotherapist|psychotherapist"](${bboxStr});
);
out center tags;
`;

const OSM_CATEGORY_MAP = {
  'restaurant':'Ristoranti','cafe':'Bar e Caffè','bar':'Bar e Caffè','pub':'Pub e Locali',
  'fast_food':'Fast Food','ice_cream':'Gelaterie','nightclub':'Discoteche','bank':'Banche',
  'pharmacy':'Farmacie','dentist':'Dentisti','doctors':'Medici','clinic':'Cliniche',
  'hospital':'Ospedali','veterinary':'Veterinari','fuel':'Benzinai','post_office':'Uffici Postali',
  'car_wash':'Autolavaggi','car_rental':'Autonoleggi','laundry':'Lavanderie',
  'driving_school':'Autoscuole','language_school':'Scuole di Lingue','music_school':'Scuole di Musica',
  'school':'Scuole','kindergarten':'Asili','library':'Biblioteche',
  'supermarket':'Supermercati','convenience':'Alimentari','bakery':'Panifici e Pasticcerie',
  'butcher':'Macellerie','greengrocer':'Frutta e Verdura','clothes':'Abbigliamento',
  'shoes':'Calzature','jewelry':'Gioiellerie','hairdresser':'Parrucchieri e Barbieri',
  'beauty':'Centri Estetici','cosmetics':'Profumerie','hardware':'Ferramenta',
  'furniture':'Arredamento','florist':'Fioristi','electronics':'Elettronica',
  'computer':'Negozi di Computer','mobile_phone':'Negozi di Telefonia','books':'Librerie',
  'stationery':'Cartolerie','newsagent':'Edicole','optician':'Ottici',
  'sports':'Negozi di Sport','bicycle':'Negozi di Biciclette','pet':'Negozi per Animali',
  'car':'Concessionarie Auto','car_repair':'Autofficine','tobacco':'Tabaccherie',
  'alcohol':'Enoteche','seafood':'Pescherie','cheese':'Formaggerie','deli':'Gastronomie',
  'gift':'Regali','toys':'Giocattoli','antiques':'Antiquari','second_hand':'Usato',
  'fabric':'Tessuti','tailor':'Sarti','watches':'Orologerie','bag':'Pelletterie',
  'photo':'Fotografia','music':'Negozi di Musica','art':"Gallerie d'Arte",'medical_supply':'Sanitaria',
  'hotel':'Hotel','guest_house':'B&B','hostel':'Ostelli','motel':'Motel',
  'apartment':'Appartamenti','camp_site':'Campeggi',
  'fitness_centre':'Palestre','sports_centre':'Centri Sportivi','swimming_pool':'Piscine','dance':'Scuole di Danza',
  'lawyer':'Avvocati','accountant':'Commercialisti','architect':'Architetti',
  'engineer':'Ingegneri','estate_agent':'Agenzie Immobiliari','insurance':'Assicurazioni',
  'notary':'Notai','travel_agent':'Agenzie di Viaggio','it':'Informatica',
  'carpenter':'Falegnami','electrician':'Elettricisti','plumber':'Idraulici',
  'painter':'Imbianchini','shoemaker':'Calzolai','jeweller':'Orefici','printing':'Tipografie',
  'laboratory':'Laboratori Analisi','physiotherapist':'Fisioterapisti','psychotherapist':'Psicologi',
};

let categoryCache = {};
let totalImported = 0;
let startTime = Date.now();

async function loadCategories() {
  const { data } = await supabase.from('business_categories').select('id, name');
  if (data) data.forEach(c => { categoryCache[c.name] = c.id; });
  console.log(`Caricate ${Object.keys(categoryCache).length} categorie`);
}

function getCategory(tags) {
  for (const f of ['amenity','shop','tourism','leisure','office','craft','healthcare']) {
    const v = tags[f];
    if (v && OSM_CATEGORY_MAP[v] && categoryCache[OSM_CATEGORY_MAP[v]])
      return categoryCache[OSM_CATEGORY_MAP[v]];
  }
  return null;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function fetchOverpass(query) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: 'overpass-api.de', path: '/api/interpreter', method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(query), 'User-Agent': 'ItalianBizDir/2.2' }
    };
    const req = https.request(opts, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        if (res.statusCode === 429) { reject(new Error('RATE_LIMIT')); return; }
        if (res.statusCode >= 400) { reject(new Error(`HTTP ${res.statusCode}`)); return; }
        try { resolve(JSON.parse(data)); } catch { reject(new Error('JSON')); }
      });
    });
    req.on('error', reject);
    req.setTimeout(150000, () => { req.destroy(); reject(new Error('Timeout')); });
    req.write(query); req.end();
  });
}

async function importCity(city, idx, total) {
  process.stdout.write(`[${idx}/${total}] ${city.name} (${city.region})... `);
  const bboxStr = `${city.bbox[0]},${city.bbox[1]},${city.bbox[2]},${city.bbox[3]}`;

  let elements = [];
  for (let retry = 0; retry < 3; retry++) {
    try {
      const data = await fetchOverpass(BATCH_QUERY_TEMPLATE(bboxStr));
      elements = data.elements || [];
      break;
    } catch (err) {
      if (err.message === 'RATE_LIMIT') { console.log('\n   Rate limit - attendo 90s...'); await sleep(90000); retry--; continue; }
      if (retry < 2) await sleep((retry + 1) * 20000);
    }
  }

  if (!elements.length) { console.log('0'); return 0; }

  const records = [];
  const seen = new Set();
  for (const el of elements) {
    const tags = el.tags || {};
    if (!tags.name) continue;
    const categoryId = getCategory(tags);
    if (!categoryId) continue;
    const lat = el.lat || el.center?.lat;
    const lon = el.lon || el.center?.lon;
    if (!lat || !lon) continue;
    const cityName = (tags['addr:city'] || tags['addr:town'] || city.name).substring(0, 100);
    const street = tags['addr:street'] || '';
    const houseNum = tags['addr:housenumber'] || '';
    const streetFull = street ? (houseNum ? `${street}, ${houseNum}` : street) : null;
    const key = `${tags.name}|${cityName}|${streetFull || ''}|${lat.toFixed(4)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    records.push({
      name: tags.name.substring(0, 200), category_id: categoryId,
      street: streetFull, city: cityName, province: city.province, region: city.region,
      postal_code: tags['addr:postcode'] || null, country: 'Italia',
      latitude: lat, longitude: lon,
      phone: (tags.phone || tags['contact:phone'] || '').replace(/\s+/g, '').substring(0, 50) || null,
      email: (tags.email || tags['contact:email'] || '').substring(0, 200) || null,
      website: (tags.website || tags['contact:website'] || '').substring(0, 500) || null,
      business_hours: tags.opening_hours || null,
      is_claimed: false, approval_status: 'approved',
    });
  }

  if (!records.length) { console.log('0 cat valide'); return 0; }

  let inserted = 0;
  for (let i = 0; i < records.length; i += 200) {
    const { error } = await supabase.from('unclaimed_business_locations').insert(records.slice(i, i + 200));
    if (!error) inserted += Math.min(200, records.length - i);
  }

  totalImported += inserted;
  const mins = ((Date.now() - startTime) / 60000).toFixed(1);
  console.log(`${inserted} inseriti | Totale sessione: ${totalImported.toLocaleString()} (${mins}min)`);
  return inserted;
}

async function main() {
  console.log(`\n=== IMPORTAZIONE REGIONI MANCANTI (${MISSING_CITIES.length} citta') ===\n`);
  await loadCategories();
  for (let i = 0; i < MISSING_CITIES.length; i++) {
    await importCity(MISSING_CITIES[i], i + 1, MISSING_CITIES.length);
    await sleep(4000);
  }
  const mins = ((Date.now() - startTime) / 60000).toFixed(0);
  console.log(`\n=== FINE: ${totalImported.toLocaleString()} attivita' aggiunte in ${mins} minuti ===\n`);
}

main().catch(console.error);
