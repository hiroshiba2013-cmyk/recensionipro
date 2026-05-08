/**
 * Import OSM businesses into unclaimed_business_locations
 * Uses Overpass API + Supabase service role for bulk inserts
 */
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import https from 'https';
import http from 'http';

config();

// Use the correct project URL and anon key
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ============================================================
// 130+ CITTÀ ITALIANE (>20k abitanti) con bbox ottimizzati
// ============================================================
const ITALIAN_CITIES = [
  { name: 'Roma', region: 'Lazio', province: 'RM', bbox: [41.80, 12.40, 41.96, 12.56] },
  { name: 'Milano', region: 'Lombardia', province: 'MI', bbox: [45.40, 9.10, 45.52, 9.26] },
  { name: 'Napoli', region: 'Campania', province: 'NA', bbox: [40.80, 14.20, 40.88, 14.30] },
  { name: 'Torino', region: 'Piemonte', province: 'TO', bbox: [45.00, 7.62, 45.12, 7.74] },
  { name: 'Palermo', region: 'Sicilia', province: 'PA', bbox: [38.08, 13.32, 38.16, 13.40] },
  { name: 'Genova', region: 'Liguria', province: 'GE', bbox: [44.38, 8.88, 44.46, 8.98] },
  { name: 'Bologna', region: 'Emilia-Romagna', province: 'BO', bbox: [44.46, 11.30, 44.54, 11.38] },
  { name: 'Firenze', region: 'Toscana', province: 'FI', bbox: [43.74, 11.22, 43.82, 11.30] },
  { name: 'Bari', region: 'Puglia', province: 'BA', bbox: [41.08, 16.84, 41.16, 16.92] },
  { name: 'Catania', region: 'Sicilia', province: 'CT', bbox: [37.48, 15.06, 37.56, 15.14] },
  { name: 'Verona', region: 'Veneto', province: 'VR', bbox: [45.40, 10.96, 45.48, 11.04] },
  { name: 'Venezia', region: 'Veneto', province: 'VE', bbox: [45.40, 12.30, 45.48, 12.38] },
  { name: 'Messina', region: 'Sicilia', province: 'ME', bbox: [38.16, 15.52, 38.24, 15.60] },
  { name: 'Padova', region: 'Veneto', province: 'PD', bbox: [45.38, 11.84, 45.46, 11.92] },
  { name: 'Trieste', region: 'Friuli-Venezia Giulia', province: 'TS', bbox: [45.62, 13.74, 45.70, 13.82] },
  { name: 'Brescia', region: 'Lombardia', province: 'BS', bbox: [45.52, 10.20, 45.60, 10.28] },
  { name: 'Taranto', region: 'Puglia', province: 'TA', bbox: [40.44, 17.22, 40.52, 17.30] },
  { name: 'Prato', region: 'Toscana', province: 'PO', bbox: [43.86, 11.06, 43.94, 11.14] },
  { name: 'Parma', region: 'Emilia-Romagna', province: 'PR', bbox: [44.76, 10.30, 44.84, 10.38] },
  { name: 'Modena', region: 'Emilia-Romagna', province: 'MO', bbox: [44.62, 10.90, 44.70, 10.98] },
  { name: 'Reggio Calabria', region: 'Calabria', province: 'RC', bbox: [38.08, 15.62, 38.16, 15.70] },
  { name: 'Reggio Emilia', region: 'Emilia-Romagna', province: 'RE', bbox: [44.66, 10.60, 44.74, 10.68] },
  { name: 'Perugia', region: 'Umbria', province: 'PG', bbox: [43.08, 12.36, 43.16, 12.44] },
  { name: 'Ravenna', region: 'Emilia-Romagna', province: 'RA', bbox: [44.38, 12.18, 44.46, 12.26] },
  { name: 'Livorno', region: 'Toscana', province: 'LI', bbox: [43.52, 10.30, 43.60, 10.38] },
  { name: 'Cagliari', region: 'Sardegna', province: 'CA', bbox: [39.20, 9.08, 39.28, 9.16] },
  { name: 'Foggia', region: 'Puglia', province: 'FG', bbox: [41.44, 15.54, 41.52, 15.62] },
  { name: 'Rimini', region: 'Emilia-Romagna', province: 'RN', bbox: [44.04, 12.54, 44.12, 12.62] },
  { name: 'Salerno', region: 'Campania', province: 'SA', bbox: [40.66, 14.74, 40.74, 14.82] },
  { name: 'Ferrara', region: 'Emilia-Romagna', province: 'FE', bbox: [44.82, 11.60, 44.90, 11.68] },
  { name: 'Sassari', region: 'Sardegna', province: 'SS', bbox: [40.72, 8.54, 40.80, 8.62] },
  { name: 'Latina', region: 'Lazio', province: 'LT', bbox: [41.44, 12.88, 41.52, 12.96] },
  { name: 'Monza', region: 'Lombardia', province: 'MB', bbox: [45.58, 9.26, 45.66, 9.34] },
  { name: 'Siracusa', region: 'Sicilia', province: 'SR', bbox: [37.06, 15.28, 37.14, 15.36] },
  { name: 'Pescara', region: 'Abruzzo', province: 'PE', bbox: [42.44, 14.20, 42.52, 14.28] },
  { name: 'Bergamo', region: 'Lombardia', province: 'BG', bbox: [45.68, 9.66, 45.76, 9.74] },
  { name: 'Forlì', region: 'Emilia-Romagna', province: 'FC', bbox: [44.20, 12.02, 44.28, 12.10] },
  { name: 'Trento', region: 'Trentino-Alto Adige', province: 'TN', bbox: [46.06, 11.12, 46.14, 11.20] },
  { name: 'Vicenza', region: 'Veneto', province: 'VI', bbox: [45.54, 11.52, 45.62, 11.60] },
  { name: 'Terni', region: 'Umbria', province: 'TR', bbox: [42.54, 12.62, 42.62, 12.70] },
  { name: 'Bolzano', region: 'Trentino-Alto Adige', province: 'BZ', bbox: [46.48, 11.32, 46.56, 11.40] },
  { name: 'Novara', region: 'Piemonte', province: 'NO', bbox: [45.44, 8.60, 45.52, 8.68] },
  { name: 'Piacenza', region: 'Emilia-Romagna', province: 'PC', bbox: [45.04, 9.68, 45.12, 9.76] },
  { name: 'Ancona', region: 'Marche', province: 'AN', bbox: [43.58, 13.50, 43.66, 13.58] },
  { name: 'Arezzo', region: 'Toscana', province: 'AR', bbox: [43.46, 11.86, 43.54, 11.94] },
  { name: 'Udine', region: 'Friuli-Venezia Giulia', province: 'UD', bbox: [46.06, 13.22, 46.14, 13.30] },
  { name: 'Cesena', region: 'Emilia-Romagna', province: 'FC', bbox: [44.12, 12.24, 44.20, 12.32] },
  { name: 'Lecce', region: 'Puglia', province: 'LE', bbox: [40.34, 18.16, 40.42, 18.24] },
  { name: 'Pesaro', region: 'Marche', province: 'PU', bbox: [43.90, 12.90, 43.98, 12.98] },
  { name: 'Alessandria', region: 'Piemonte', province: 'AL', bbox: [44.90, 8.60, 44.98, 8.68] },
  { name: 'La Spezia', region: 'Liguria', province: 'SP', bbox: [44.10, 9.80, 44.18, 9.88] },
  { name: 'Pisa', region: 'Toscana', province: 'PI', bbox: [43.70, 10.38, 43.78, 10.46] },
  { name: 'Catanzaro', region: 'Calabria', province: 'CZ', bbox: [38.88, 16.58, 38.96, 16.66] },
  { name: 'Pistoia', region: 'Toscana', province: 'PT', bbox: [43.92, 10.90, 44.00, 10.98] },
  { name: 'Lucca', region: 'Toscana', province: 'LU', bbox: [43.82, 10.48, 43.90, 10.56] },
  { name: 'Brindisi', region: 'Puglia', province: 'BR', bbox: [40.62, 17.92, 40.70, 18.00] },
  { name: 'Como', region: 'Lombardia', province: 'CO', bbox: [45.80, 9.08, 45.88, 9.16] },
  { name: 'Treviso', region: 'Veneto', province: 'TV', bbox: [45.66, 12.24, 45.74, 12.32] },
  { name: 'Varese', region: 'Lombardia', province: 'VA', bbox: [45.80, 8.80, 45.88, 8.88] },
  { name: 'Asti', region: 'Piemonte', province: 'AT', bbox: [44.88, 8.18, 44.96, 8.26] },
  { name: 'Caserta', region: 'Campania', province: 'CE', bbox: [41.06, 14.32, 41.14, 14.40] },
  { name: 'Ragusa', region: 'Sicilia', province: 'RG', bbox: [36.92, 14.72, 37.00, 14.80] },
  { name: 'Pavia', region: 'Lombardia', province: 'PV', bbox: [45.18, 9.14, 45.26, 9.22] },
  { name: 'Cosenza', region: 'Calabria', province: 'CS', bbox: [39.28, 16.24, 39.36, 16.32] },
  { name: 'Viterbo', region: 'Lazio', province: 'VT', bbox: [42.42, 12.10, 42.50, 12.18] },
  { name: 'Trapani', region: 'Sicilia', province: 'TP', bbox: [38.00, 12.50, 38.08, 12.58] },
  { name: 'Benevento', region: 'Campania', province: 'BN', bbox: [41.12, 14.76, 41.20, 14.84] },
  { name: 'Cremona', region: 'Lombardia', province: 'CR', bbox: [45.12, 10.02, 45.20, 10.10] },
  { name: 'Matera', region: 'Basilicata', province: 'MT', bbox: [40.64, 16.58, 40.72, 16.66] },
  { name: 'Mantova', region: 'Lombardia', province: 'MN', bbox: [45.14, 10.78, 45.22, 10.86] },
  { name: 'Grosseto', region: 'Toscana', province: 'GR', bbox: [42.76, 11.10, 42.84, 11.18] },
  { name: 'Savona', region: 'Liguria', province: 'SV', bbox: [44.30, 8.46, 44.38, 8.54] },
  { name: 'Cuneo', region: 'Piemonte', province: 'CN', bbox: [44.38, 7.54, 44.46, 7.62] },
  { name: 'Potenza', region: 'Basilicata', province: 'PZ', bbox: [40.63, 15.79, 40.71, 15.87] },
  { name: 'Crotone', region: 'Calabria', province: 'KR', bbox: [39.07, 17.11, 39.15, 17.19] },
  { name: 'Agrigento', region: 'Sicilia', province: 'AG', bbox: [37.30, 13.57, 37.38, 13.65] },
  { name: 'Siena', region: 'Toscana', province: 'SI', bbox: [43.31, 11.33, 43.39, 11.41] },
  { name: 'Guidonia Montecelio', region: 'Lazio', province: 'RM', bbox: [41.98, 12.70, 42.06, 12.78] },
  { name: 'Fiumicino', region: 'Lazio', province: 'RM', bbox: [41.76, 12.22, 41.84, 12.30] },
  { name: 'Altamura', region: 'Puglia', province: 'BA', bbox: [40.82, 16.54, 40.90, 16.62] },
  { name: 'Acireale', region: 'Sicilia', province: 'CT', bbox: [37.60, 15.14, 37.68, 15.22] },
  { name: 'Bagheria', region: 'Sicilia', province: 'PA', bbox: [38.08, 13.50, 38.16, 13.58] },
  { name: 'Marsala', region: 'Sicilia', province: 'TP', bbox: [37.78, 12.42, 37.86, 12.50] },
  { name: 'Vittoria', region: 'Sicilia', province: 'RG', bbox: [36.94, 14.52, 37.02, 14.60] },
  { name: 'Caltanissetta', region: 'Sicilia', province: 'CL', bbox: [37.48, 14.04, 37.56, 14.12] },
  { name: 'Lamezia Terme', region: 'Calabria', province: 'CZ', bbox: [38.96, 16.30, 39.04, 16.38] },
  { name: 'Corigliano-Rossano', region: 'Calabria', province: 'CS', bbox: [39.58, 16.50, 39.66, 16.58] },
  { name: 'Imola', region: 'Emilia-Romagna', province: 'BO', bbox: [44.34, 11.70, 44.42, 11.78] },
  { name: 'Andria', region: 'Puglia', province: 'BT', bbox: [41.22, 16.28, 41.30, 16.36] },
  { name: 'Barletta', region: 'Puglia', province: 'BT', bbox: [41.30, 16.28, 41.38, 16.36] },
  { name: 'Giugliano in Campania', region: 'Campania', province: 'NA', bbox: [40.92, 14.18, 41.00, 14.26] },
  { name: 'Lodi', region: 'Lombardia', province: 'LO', bbox: [45.30, 9.50, 45.38, 9.58] },
  { name: 'Vercelli', region: 'Piemonte', province: 'VC', bbox: [45.32, 8.40, 45.40, 8.48] },
];

// ============================================================
// QUERY BATCH: un'unica query per città con tutte le categorie
// Molto più efficiente: 1 query per città invece di 1 per categoria
// ============================================================
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
  way["leisure"~"fitness_centre|sports_centre|swimming_pool|dance"](${bboxStr});
  node["office"~"lawyer|accountant|architect|engineer|estate_agent|insurance|notary|travel_agent|it"](${bboxStr});
  way["office"~"lawyer|accountant|architect|engineer|estate_agent|insurance|notary|travel_agent|it"](${bboxStr});
  node["craft"~"carpenter|electrician|plumber|painter|shoemaker|tailor|bakery|jeweller|printing"](${bboxStr});
  way["craft"~"carpenter|electrician|plumber|painter|shoemaker|tailor|bakery|jeweller|printing"](${bboxStr});
  node["healthcare"~"laboratory|physiotherapist|psychotherapist"](${bboxStr});
  way["healthcare"~"laboratory|physiotherapist|psychotherapist"](${bboxStr});
);
out center tags;
`;

// Mapping OSM tag -> nome categoria DB
const OSM_CATEGORY_MAP = {
  // amenity
  'restaurant': 'Ristoranti',
  'cafe': 'Bar e Caffè',
  'bar': 'Bar e Caffè',
  'pub': 'Pub e Locali',
  'fast_food': 'Fast Food',
  'ice_cream': 'Gelaterie',
  'nightclub': 'Discoteche',
  'bank': 'Banche',
  'pharmacy': 'Farmacie',
  'dentist': 'Dentisti',
  'doctors': 'Medici',
  'clinic': 'Cliniche',
  'hospital': 'Ospedali',
  'veterinary': 'Veterinari',
  'fuel': 'Benzinai',
  'post_office': 'Uffici Postali',
  'car_wash': 'Autolavaggi',
  'car_rental': 'Autonoleggi',
  'laundry': 'Lavanderie',
  'driving_school': 'Autoscuole',
  'language_school': 'Scuole di Lingue',
  'music_school': 'Scuole di Musica',
  'school': 'Scuole',
  'kindergarten': 'Asili',
  'library': 'Biblioteche',
  // shop
  'supermarket': 'Supermercati',
  'convenience': 'Alimentari',
  'bakery': 'Panifici e Pasticcerie',
  'butcher': 'Macellerie',
  'greengrocer': 'Frutta e Verdura',
  'clothes': 'Abbigliamento',
  'shoes': 'Calzature',
  'jewelry': 'Gioiellerie',
  'hairdresser': 'Parrucchieri e Barbieri',
  'beauty': 'Centri Estetici',
  'cosmetics': 'Profumerie',
  'hardware': 'Ferramenta',
  'furniture': 'Arredamento',
  'florist': 'Fioristi',
  'electronics': 'Elettronica',
  'computer': 'Negozi di Computer',
  'mobile_phone': 'Negozi di Telefonia',
  'books': 'Librerie',
  'stationery': 'Cartolerie',
  'newsagent': 'Edicole',
  'optician': 'Ottici',
  'sports': 'Negozi di Sport',
  'bicycle': 'Negozi di Biciclette',
  'pet': 'Negozi per Animali',
  'car': 'Concessionarie Auto',
  'car_repair': 'Autofficine',
  'tobacco': 'Tabaccherie',
  'alcohol': 'Enoteche',
  'seafood': 'Pescherie',
  'cheese': 'Formaggerie',
  'deli': 'Gastronomie',
  'gift': 'Regali',
  'toys': 'Giocattoli',
  'antiques': 'Antiquari',
  'second_hand': 'Usato',
  'fabric': 'Tessuti',
  'tailor': 'Sarti',
  'watches': 'Orologerie',
  'bag': 'Pelletterie',
  'photo': 'Fotografia',
  'music': 'Negozi di Musica',
  'art': "Gallerie d'Arte",
  'medical_supply': 'Sanitaria',
  // tourism
  'hotel': 'Hotel',
  'guest_house': 'B&B',
  'hostel': 'Ostelli',
  'motel': 'Motel',
  'apartment': 'Appartamenti',
  'camp_site': 'Campeggi',
  // leisure
  'fitness_centre': 'Palestre',
  'sports_centre': 'Centri Sportivi',
  'swimming_pool': 'Piscine',
  'dance': 'Scuole di Danza',
  // office
  'lawyer': 'Avvocati',
  'accountant': 'Commercialisti',
  'architect': 'Architetti',
  'engineer': 'Ingegneri',
  'estate_agent': 'Agenzie Immobiliari',
  'insurance': 'Assicurazioni',
  'notary': 'Notai',
  'travel_agent': 'Agenzie di Viaggio',
  'it': 'Informatica',
  // craft
  'carpenter': 'Falegnami',
  'electrician': 'Elettricisti',
  'plumber': 'Idraulici',
  'painter': 'Imbianchini',
  'shoemaker': 'Calzolai',
  'jeweller': 'Orefici',
  'printing': 'Tipografie',
  // healthcare
  'laboratory': 'Laboratori Analisi',
  'physiotherapist': 'Fisioterapisti',
  'psychotherapist': 'Psicologi',
};

let categoryCache = {};
let totalImported = 0;
let totalErrors = 0;
let startTime = Date.now();

async function loadAllCategories() {
  const { data } = await supabase
    .from('business_categories')
    .select('id, name');

  if (data) {
    data.forEach(cat => { categoryCache[cat.name] = cat.id; });
    console.log(`Caricate ${data.length} categorie`);
  }
}

function getCategoryFromElement(tags) {
  const fields = ['amenity', 'shop', 'tourism', 'leisure', 'office', 'craft', 'healthcare'];
  for (const field of fields) {
    const val = tags[field];
    if (val && OSM_CATEGORY_MAP[val]) {
      const catName = OSM_CATEGORY_MAP[val];
      return categoryCache[catName] || null;
    }
  }
  return null;
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function fetchOverpass(query) {
  return new Promise((resolve, reject) => {
    const postData = query;
    const options = {
      hostname: 'overpass-api.de',
      path: '/api/interpreter',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData),
        'User-Agent': 'ItalianBusinessDirectory/2.0 (reimport)'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 429) {
          reject(new Error('RATE_LIMIT'));
          return;
        }
        if (res.statusCode >= 400) {
          reject(new Error(`HTTP ${res.statusCode}`));
          return;
        }
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error('JSON parse error'));
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(120000, () => { req.destroy(); reject(new Error('Timeout')); });
    req.write(postData);
    req.end();
  });
}

async function queryCity(city) {
  const bboxStr = `${city.bbox[0]},${city.bbox[1]},${city.bbox[2]},${city.bbox[3]}`;
  const query = BATCH_QUERY_TEMPLATE(bboxStr);

  let retries = 0;
  while (retries < 3) {
    try {
      const data = await fetchOverpass(query);
      return data.elements || [];
    } catch (err) {
      if (err.message === 'RATE_LIMIT') {
        console.log('   Rate limit - attendo 90s...');
        await sleep(90000);
        continue;
      }
      retries++;
      if (retries < 3) {
        console.log(`   Errore: ${err.message}, riprovo tra ${retries * 20}s...`);
        await sleep(retries * 20000);
      } else {
        console.log(`   Saltata dopo 3 tentativi`);
        return [];
      }
    }
  }
  return [];
}

async function importCity(city, idx, total) {
  process.stdout.write(`[${idx}/${total}] ${city.name} (${city.region})... `);

  const elements = await queryCity(city);
  if (elements.length === 0) {
    console.log('0 risultati OSM');
    return 0;
  }

  process.stdout.write(`${elements.length} elementi OSM -> `);

  // Build batch of records to insert
  const records = [];
  const seen = new Set();

  for (const el of elements) {
    const tags = el.tags || {};
    if (!tags.name) continue;

    const categoryId = getCategoryFromElement(tags);
    if (!categoryId) continue;

    const lat = el.lat || el.center?.lat;
    const lon = el.lon || el.center?.lon;
    if (!lat || !lon) continue;

    const city_name = tags['addr:city'] || tags['addr:town'] || tags['addr:village'] || city.name;
    const street = tags['addr:street'] || '';
    const houseNum = tags['addr:housenumber'] || '';
    const streetFull = street ? (houseNum ? `${street}, ${houseNum}` : street) : null;

    // Dedup by name+city+street
    const key = `${tags.name}|${city_name}|${streetFull || ''}`;
    if (seen.has(key)) continue;
    seen.add(key);

    records.push({
      name: tags.name.substring(0, 200),
      category_id: categoryId,
      street: streetFull,
      city: city_name.substring(0, 100),
      province: city.province,
      region: city.region,
      postal_code: tags['addr:postcode'] || null,
      country: 'Italia',
      latitude: lat,
      longitude: lon,
      phone: (tags.phone || tags['contact:phone'] || '').replace(/\s+/g, '').substring(0, 50) || null,
      email: (tags.email || tags['contact:email'] || '').substring(0, 200) || null,
      website: (tags.website || tags['contact:website'] || '').substring(0, 500) || null,
      business_hours: tags.opening_hours || null,
      is_claimed: false,
      approval_status: 'approved',
    });
  }

  if (records.length === 0) {
    console.log('0 inseriti (nessuna cat. valida)');
    return 0;
  }

  // Batch insert in chunks of 200
  let inserted = 0;
  const CHUNK = 200;
  for (let i = 0; i < records.length; i += CHUNK) {
    const chunk = records.slice(i, i + CHUNK);
    const { error, data } = await supabase
      .from('unclaimed_business_locations')
      .upsert(chunk, { onConflict: 'name,city,street', ignoreDuplicates: true })
      .select('id');

    if (error) {
      // Try insert without conflict handling
      const { error: err2, data: d2 } = await supabase
        .from('unclaimed_business_locations')
        .insert(chunk, { defaultToNull: true });

      if (!err2) {
        inserted += chunk.length;
      } else {
        totalErrors++;
      }
    } else {
      inserted += (data?.length || chunk.length);
    }
  }

  totalImported += inserted;
  const elapsed = Math.round((Date.now() - startTime) / 1000);
  const rate = Math.round(totalImported / (elapsed / 60));
  console.log(`${inserted} inseriti | Totale: ${totalImported.toLocaleString()} (${rate}/min)`);
  return inserted;
}

async function main() {
  console.log('\n============================================================');
  console.log(' IMPORTAZIONE OSM - TUTTE LE CITTÀ ITALIANE');
  console.log(`  Città: ${ITALIAN_CITIES.length}`);
  console.log(`  Avvio: ${new Date().toLocaleTimeString()}`);
  console.log('============================================================\n');

  await loadAllCategories();

  let cityCount = 0;
  for (const city of ITALIAN_CITIES) {
    cityCount++;
    await importCity(city, cityCount, ITALIAN_CITIES.length);

    // Pausa tra città per non sovraccaricare Overpass
    await sleep(4000);

    // Ogni 20 città stampa un riepilogo
    if (cityCount % 20 === 0) {
      const elapsed = Math.round((Date.now() - startTime) / 60000);
      console.log(`\n--- RIEPILOGO: ${totalImported.toLocaleString()} attività in ${elapsed} minuti ---\n`);
    }
  }

  const elapsed = Math.round((Date.now() - startTime) / 60000);
  console.log('\n============================================================');
  console.log(' IMPORTAZIONE COMPLETATA');
  console.log(`  Totale inserite: ${totalImported.toLocaleString()}`);
  console.log(`  Errori: ${totalErrors}`);
  console.log(`  Durata: ${elapsed} minuti`);
  console.log('============================================================\n');
}

main().catch(console.error);
