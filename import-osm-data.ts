import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface OSMElement {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  tags?: Record<string, string>;
  center?: { lat: number; lon: number };
}

interface OSMResponse {
  elements: OSMElement[];
}

// Mapping OSM tags to our categories
const categoryMapping: Record<string, string> = {
  restaurant: 'Ristoranti',
  cafe: 'Bar e Caffè',
  bar: 'Bar e Caffè',
  pub: 'Bar e Caffè',
  fast_food: 'Ristoranti',
  bakery: 'Panifici',
  supermarket: 'Supermercati',
  pharmacy: 'Farmacie',
  doctors: 'Studi Medici',
  dentist: 'Studi Dentistici',
  hospital: 'Studi Medici',
  hairdresser: 'Parrucchieri',
  beauty: 'Centri Estetici',
  hotel: 'Hotel e Alberghi',
  car_repair: 'Officine Auto',
  gym: 'Palestre',
  bank: 'Banche',
  post_office: 'Edicole',
  clothes: 'Abbigliamento',
  shoes: 'Calzature',
  furniture: 'Arredamento',
  electronics: 'Elettronica',
  books: 'Librerie',
  florist: 'Fioristi',
  jewelry: 'Gioiellerie',
  optician: 'Ottica',
  pet: 'Animali',
  butcher: 'Macellerie',
  convenience: 'Alimentari',
  kiosk: 'Edicole',
  stationery: 'Cartolerie',
  toys: 'Giocattoli',
  musical_instrument: 'Elettronica',
  paint: 'Materiali Edili',
  hardware: 'Ferramenta',
  dry_cleaning: 'Lavanderie',
};

function getCategoryFromOSM(tags: Record<string, string> | undefined): string | null {
  if (!tags) return null;

  const amenity = tags.amenity;
  const shop = tags.shop;

  if (amenity && categoryMapping[amenity]) {
    return categoryMapping[amenity];
  }

  if (shop && categoryMapping[shop]) {
    return categoryMapping[shop];
  }

  return null;
}

function generateVAT(): string {
  const random = Math.floor(Math.random() * 100000000000);
  return random.toString().padStart(11, '0');
}

async function getCityCoords(city: string): Promise<{ lat: number; lon: number } | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?city=${encodeURIComponent(city)}&country=Italy&format=json&limit=1`,
      {
        headers: {
          'User-Agent': 'ItalianBusinessDirectory/1.0',
        },
      }
    );
    const data = await response.json();
    if (data && data.length > 0) {
      return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
    }
  } catch (error) {
    console.error(`Error geocoding ${city}:`, error);
  }
  return null;
}

async function getBusinessesFromOSM(lat: number, lon: number, radius = 3000): Promise<OSMElement[]> {
  const query = `
[out:json][timeout:90];
(
  node["name"]["amenity"~"restaurant|cafe|bar|pub|pharmacy|bank|fuel"](around:${radius},${lat},${lon});
  way["name"]["amenity"~"restaurant|cafe|bar|pub|pharmacy|bank|fuel"](around:${radius},${lat},${lon});
  node["name"]["shop"~"supermarket|bakery|hairdresser|clothes|electronics|books|florist|butcher|convenience"](around:${radius},${lat},${lon});
  way["name"]["shop"~"supermarket|bakery|hairdresser|clothes|electronics|books|florist|butcher|convenience"](around:${radius},${lat},${lon});
);
out center;
  `.trim();

  try {
    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `data=${encodeURIComponent(query)}`,
    });

    if (!response.ok) {
      console.error(`HTTP error: ${response.status}`);
      return [];
    }

    const text = await response.text();
    if (text.startsWith('<?xml')) {
      console.error('Received XML instead of JSON (rate limited or error)');
      return [];
    }

    const data: OSMResponse = JSON.parse(text);
    return data.elements || [];
  } catch (error) {
    console.error('Error fetching OSM data:', error);
    return [];
  }
}

async function importBusinesses(city: string, province: string) {
  console.log(`\n🔍 Processing ${city}, ${province}...`);

  const coords = await getCityCoords(city);
  if (!coords) {
    console.log(`❌ Could not geocode ${city}`);
    return;
  }

  console.log(`📍 Coordinates: ${coords.lat}, ${coords.lon}`);

  const elements = await getBusinessesFromOSM(coords.lat, coords.lon);
  console.log(`📦 Found ${elements.length} OSM elements`);

  // Get categories
  const { data: categoriesData } = await supabase
    .from('business_categories')
    .select('id, name');

  const categoryMap = new Map(categoriesData?.map(cat => [cat.name, cat.id]) || []);

  const businesses = [];
  const locations = [];

  for (const element of elements) {
    if (!element.tags?.name) continue;

    const category = getCategoryFromOSM(element.tags);
    if (!category) continue;

    const categoryId = categoryMap.get(category);
    if (!categoryId) continue;

    const lat = element.lat || element.center?.lat;
    const lon = element.lon || element.center?.lon;
    if (!lat || !lon) continue;

    const street = element.tags['addr:street'] || 'Via non specificata';
    const streetNumber = element.tags['addr:housenumber'] || 's.n.';
    const phone = element.tags.phone || element.tags['contact:phone'] || null;
    const website = element.tags.website || element.tags['contact:website'] || null;

    businesses.push({
      name: element.tags.name,
      category_id: categoryId,
      is_claimed: false,
      vat_number: generateVAT(),
      verified: true,
    });

    locations.push({
      city: element.tags['addr:city'] || city,
      province,
      postal_code: element.tags['addr:postcode'] || null,
      street_address: `${street}, ${streetNumber}`,
      street_number: streetNumber,
      latitude: lat,
      longitude: lon,
      phone_number: phone,
      email: null,
      business_hours: element.tags.opening_hours || null,
    });
  }

  if (businesses.length === 0) {
    console.log(`⚠️  No valid businesses found for ${city}`);
    return;
  }

  console.log(`✅ Processed ${businesses.length} valid businesses`);

  // Insert businesses
  const { data: insertedBusinesses, error: businessError } = await supabase
    .from('businesses')
    .insert(businesses)
    .select('id');

  if (businessError) {
    console.error(`❌ Error inserting businesses for ${city}:`, businessError);
    return;
  }

  // Add business_id to locations
  const locationsWithBusinessId = locations.map((loc, index) => ({
    ...loc,
    business_id: insertedBusinesses![index].id,
  }));

  // Insert locations
  const { error: locationError } = await supabase
    .from('business_locations')
    .insert(locationsWithBusinessId);

  if (locationError) {
    console.error(`❌ Error inserting locations for ${city}:`, locationError);
    return;
  }

  console.log(`✅ Successfully imported ${businesses.length} businesses to ${city}`);
}

async function main() {
  const cities = [
    { name: 'Varese', province: 'VA' },
    { name: 'Como', province: 'CO' },
    { name: 'Busto Arsizio', province: 'VA' },
  ];

  console.log('🚀 Starting OSM data import...\n');

  for (const city of cities) {
    await importBusinesses(city.name, city.province);
    // Wait 5 seconds between requests to respect API rate limits
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  console.log('\n✅ Import completed!');
}

main();
