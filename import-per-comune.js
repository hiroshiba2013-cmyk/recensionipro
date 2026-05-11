/**
 * Import per comune - query ultra-piccole su ogni comune italiano
 * Geocodifica il comune con Nominatim, poi query Overpass su bbox ~8km
 * Feedback immediato dopo ogni inserimento
 */
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import https from 'https';

config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

// Tag da cercare per ogni comune
const TAGS = [
  { key: 'amenity', val: 'restaurant', cat: 'Ristoranti' },
  { key: 'amenity', val: 'cafe', cat: 'Bar e Caffè' },
  { key: 'amenity', val: 'bar', cat: 'Bar e Caffè' },
  { key: 'amenity', val: 'fast_food', cat: 'Fast Food' },
  { key: 'amenity', val: 'pub', cat: 'Pub e Locali' },
  { key: 'amenity', val: 'ice_cream', cat: 'Gelaterie' },
  { key: 'shop', val: 'supermarket', cat: 'Supermercati' },
  { key: 'shop', val: 'convenience', cat: 'Alimentari' },
  { key: 'shop', val: 'bakery', cat: 'Panifici' },
  { key: 'shop', val: 'butcher', cat: 'Macellerie' },
  { key: 'shop', val: 'greengrocer', cat: 'Frutta e Verdura' },
  { key: 'shop', val: 'pastry', cat: 'Pasticcerie' },
  { key: 'shop', val: 'fishmonger', cat: 'Pescherie' },
  { key: 'shop', val: 'deli', cat: 'Gastronomie' },
  { key: 'shop', val: 'wine', cat: 'Enoteche' },
  { key: 'shop', val: 'tobacco', cat: 'Tabaccherie' },
  { key: 'amenity', val: 'pharmacy', cat: 'Farmacie' },
  { key: 'amenity', val: 'dentist', cat: 'Dentisti' },
  { key: 'amenity', val: 'doctors', cat: 'Medici' },
  { key: 'amenity', val: 'veterinary', cat: 'Veterinari' },
  { key: 'shop', val: 'hairdresser', cat: 'Parrucchieri' },
  { key: 'shop', val: 'beauty', cat: 'Estetisti' },
  { key: 'shop', val: 'optician', cat: 'Ottici' },
  { key: 'leisure', val: 'fitness_centre', cat: 'Palestre' },
  { key: 'shop', val: 'clothes', cat: 'Abbigliamento' },
  { key: 'shop', val: 'shoes', cat: 'Calzature' },
  { key: 'shop', val: 'jewelry', cat: 'Gioiellerie' },
  { key: 'shop', val: 'furniture', cat: 'Arredamento' },
  { key: 'shop', val: 'hardware', cat: 'Ferramenta' },
  { key: 'shop', val: 'florist', cat: 'Fiorai' },
  { key: 'shop', val: 'electronics', cat: 'Elettronica' },
  { key: 'shop', val: 'mobile_phone', cat: 'Telefonia' },
  { key: 'shop', val: 'car_repair', cat: 'Autofficine' },
  { key: 'amenity', val: 'fuel', cat: 'Distributori Carburante' },
  { key: 'amenity', val: 'bank', cat: 'Banche' },
  { key: 'amenity', val: 'post_office', cat: 'Poste' },
  { key: 'office', val: 'estate_agent', cat: 'Agenzie Immobiliari' },
  { key: 'office', val: 'insurance', cat: 'Assicurazioni' },
  { key: 'tourism', val: 'hotel', cat: 'Hotel' },
  { key: 'tourism', val: 'guest_house', cat: 'B&B' },
  { key: 'craft', val: 'plumber', cat: 'Idraulici' },
  { key: 'craft', val: 'electrician', cat: 'Elettricisti' },
  { key: 'amenity', val: 'driving_school', cat: 'Autoscuole' },
  { key: 'shop', val: 'books', cat: 'Librerie' },
  { key: 'shop', val: 'pet', cat: 'Negozi per Animali' },
];

let categoryCache = {};
let totalImported = 0;
let totalSkipped = 0;
const startTime = Date.now();

// Cache geocoding per evitare chiamate ripetute
const geoCache = {};

async function loadCategories() {
  const { data } = await supabase.from('business_categories').select('id, name');
  if (data) data.forEach(c => { categoryCache[c.name] = c.id; });
  console.log(`Caricate ${Object.keys(categoryCache).length} categorie`);
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

function httpGet(hostname, path) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname, path, method: 'GET',
      headers: { 'User-Agent': 'ItalianBizDir/12.0 (import per comune)' }
    };
    const req = https.request(opts, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        if (res.statusCode >= 400) { reject(new Error(`HTTP ${res.statusCode}`)); return; }
        try { resolve(JSON.parse(data)); } catch { reject(new Error('JSON')); }
      });
    });
    req.on('error', reject);
    req.setTimeout(10000, () => { req.destroy(); reject(new Error('Timeout')); });
    req.end();
  });
}

async function geocodeComune(comune, provincia) {
  const cacheKey = `${comune}|${provincia}`;
  if (geoCache[cacheKey]) return geoCache[cacheKey];

  try {
    const q = encodeURIComponent(`${comune}, ${provincia}, Italy`);
    const results = await httpGet('nominatim.openstreetmap.org', `/search?q=${q}&format=json&limit=1&countrycodes=it`);
    if (results && results.length > 0) {
      const lat = parseFloat(results[0].lat);
      const lon = parseFloat(results[0].lon);
      geoCache[cacheKey] = { lat, lon };
      return { lat, lon };
    }
  } catch {
    // ignore
  }
  return null;
}

function fetchOverpass(query) {
  return new Promise((resolve, reject) => {
    const body = `data=${encodeURIComponent(query)}`;
    const opts = {
      hostname: 'overpass-api.de', path: '/api/interpreter', method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(body),
        'User-Agent': 'ItalianBizDir/12.0'
      }
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
    req.setTimeout(25000, () => { req.destroy(); reject(new Error('Timeout')); });
    req.write(body); req.end();
  });
}

// Costruisce tutti i tag in una sola query per comune (query piccola = bbox ~8km)
function buildComuneQuery(tags, lat, lon, radiusKm = 5) {
  const deg = radiusKm / 111.0;
  const s = (lat - deg).toFixed(5);
  const n = (lat + deg).toFixed(5);
  const w = (lon - deg / Math.cos(lat * Math.PI / 180)).toFixed(5);
  const e = (lon + deg / Math.cos(lat * Math.PI / 180)).toFixed(5);
  const bbox = `${s},${w},${n},${e}`;
  const parts = tags.map(t =>
    `  node["${t.key}"="${t.val}"](${bbox});\n  way["${t.key}"="${t.val}"](${bbox});`
  ).join('\n');
  return `[out:json][timeout:20];\n(\n${parts}\n);\nout center tags;`;
}

async function runComune(comune) {
  const geo = await geocodeComune(comune.comune, comune.provincia);
  if (!geo) { totalSkipped++; return 0; }

  await sleep(200); // rispetta rate limit Nominatim

  const query = buildComuneQuery(TAGS, geo.lat, geo.lon);
  let elements = [];
  for (let retry = 0; retry < 2; retry++) {
    try {
      const data = await fetchOverpass(query);
      elements = data.elements || [];
      break;
    } catch (err) {
      if (err.message === 'RATE_LIMIT') { await sleep(60000); retry--; continue; }
      if (retry < 1) { await sleep(4000); continue; }
      return 0;
    }
  }

  if (!elements.length) return 0;

  // Mappa ogni elemento alla categoria giusta
  const records = [];
  const seen = new Set();
  for (const el of elements) {
    const tags = el.tags || {};
    if (!tags.name) continue;
    const lat = el.lat ?? el.center?.lat;
    const lon = el.lon ?? el.center?.lon;
    if (!lat || !lon) continue;

    const key = `${tags.name}|${comune.sigla}|${lat.toFixed(4)}|${lon.toFixed(4)}`;
    if (seen.has(key)) continue;
    seen.add(key);

    // Trova la categoria del tag
    const elKey = ['amenity','shop','craft','tourism','office','leisure'].find(k => tags[k]);
    const elVal = elKey ? tags[elKey] : null;
    const matchedTag = TAGS.find(t => t.key === elKey && t.val === elVal);
    if (!matchedTag) continue;
    const catId = categoryCache[matchedTag.cat];
    if (!catId) continue;

    const street = tags['addr:street'] || '';
    const hnum = tags['addr:housenumber'] || '';
    const city = tags['addr:city'] || tags['addr:town'] || tags['addr:village'] || tags['addr:municipality'] || comune.comune;
    records.push({
      name: tags.name.substring(0, 200),
      category_id: catId,
      street: street ? (hnum ? `${street}, ${hnum}` : street) : null,
      city: city.substring(0, 100),
      province: comune.sigla,
      region: comune.regione,
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

  if (!records.length) return 0;

  let inserted = 0;
  for (let i = 0; i < records.length; i += 100) {
    const batch = records.slice(i, i + 100);
    const { error } = await supabase.from('unclaimed_business_locations').insert(batch);
    if (!error) {
      inserted += batch.length;
    } else if (error.code === '23505') {
      for (const rec of batch) {
        const { error: e2 } = await supabase.from('unclaimed_business_locations').insert(rec);
        if (!e2) inserted++;
      }
    }
  }
  return inserted;
}

async function main() {
  console.log(`\n=== IMPORT PER COMUNE - ${TAGS.length} tag per comune ===\n`);
  await loadCategories();

  // Carica tutti i comuni dal DB
  const { data: comuni, error } = await supabase
    .from('comuni_italiani')
    .select('id, comune, provincia, sigla, regione')
    .order('regione', { ascending: true })
    .order('comune', { ascending: true });

  if (error || !comuni) {
    console.error('Errore caricamento comuni:', error);
    return;
  }
  console.log(`Comuni da processare: ${comuni.length}\n`);

  let idx = 0;
  for (const comune of comuni) {
    idx++;
    const n = await runComune(comune);
    if (n > 0) {
      totalImported += n;
      const elapsed = ((Date.now() - startTime) / 60000).toFixed(1);
      const pct = ((idx / comuni.length) * 100).toFixed(1);
      console.log(`[${idx}/${comuni.length}] ${comune.comune} (${comune.sigla}) +${n} | Totale: ${totalImported.toLocaleString()} | ${pct}% | ${elapsed}min`);
    }
    // Pausa minima tra comuni per non sovraccaricare Overpass
    await sleep(500);
  }

  console.log(`\n=== COMPLETATO ===`);
  console.log(`Importati: ${totalImported.toLocaleString()}`);
  console.log(`Comuni saltati (no geo): ${totalSkipped}`);
}

main().catch(console.error);
