import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

// Maps OSM amenity/shop/office/craft tags → DB category names
const OSM_CATEGORY_MAP: Record<string, string> = {
  // Food & Drink
  restaurant: "Ristoranti",
  fast_food: "Fast Food",
  cafe: "Bar e Caffè",
  bar: "Bar e Caffè",
  pub: "Pub e Locali",
  biergarten: "Pub e Locali",
  food_court: "Food Court",
  ice_cream: "Gelaterie",
  confectionery: "Pasticcerie",
  pastry: "Pasticcerie",
  bakery: "Panetterie",
  pizza: "Pizzerie",
  // Grocery & Food shops
  supermarket: "Supermercati",
  convenience: "Alimentari",
  greengrocer: "Frutta e Verdura",
  butcher: "Macellerie",
  fishmonger: "Pescherie",
  deli: "Gastronomie",
  dairy: "Latterie",
  pasta: "Pastifici",
  chocolate: "Cioccolaterie",
  cheese: "Formaggerie",
  wine: "Enoteche",
  beverages: "Negozi di Bevande",
  // Health
  pharmacy: "Farmacie",
  optician: "Ottici",
  hearing_aids: "Apparecchi Acustici",
  doctors: "Medici",
  dentist: "Dentisti",
  hospital: "Ospedali",
  clinic: "Cliniche",
  physiotherapist: "Fisioterapisti",
  psychologist: "Psicologi",
  veterinary: "Veterinari",
  laboratory: "Laboratori Analisi",
  // Beauty & Wellness
  hairdresser: "Parrucchieri",
  hairdresser_supply: "Forniture Parrucchieri",
  beauty: "Centri Estetici",
  massage: "Centri Massaggi",
  tattoo: "Tatuatori",
  // Accommodation
  hotel: "Hotel",
  motel: "Motel",
  hostel: "Ostelli",
  guest_house: "B&B",
  camp_site: "Campeggi",
  caravan_site: "Aree Camper",
  chalet: "Chalet",
  // Finance
  bank: "Banche",
  atm: "Bancomat",
  insurance: "Assicurazioni",
  // Professional services
  lawyer: "Avvocati",
  notary: "Notai",
  accountant: "Commercialisti",
  financial_advisor: "Consulenti Finanziari",
  tax_advisor: "Consulenti Fiscali",
  architect: "Architetti",
  engineer: "Ingegneri",
  surveyor: "Geometri",
  estate_agent: "Agenzie Immobiliari",
  travel_agency: "Agenzie di Viaggio",
  employment_agency: "Agenzie del Lavoro",
  advertising: "Agenzie Pubblicitarie",
  consultant: "Consulenti",
  // Education
  school: "Scuole",
  university: "Università",
  kindergarten: "Asili",
  language_school: "Scuole di Lingue",
  music_school: "Scuole di Musica",
  dancing_school: "Scuole di Danza",
  driving_school: "Autoscuole",
  // Retail - Clothing
  clothes: "Abbigliamento",
  shoes: "Calzature",
  boutique: "Boutique",
  fashion: "Moda",
  leather: "Articoli in Pelle",
  tailor: "Sartorie",
  // Retail - Tech
  electronics: "Elettronica",
  computer: "Negozi di Computer",
  mobile_phone: "Negozi di Telefonia",
  hifi: "Hi-Fi",
  camera: "Fotocamere",
  video_games: "Videogiochi",
  telecommunication: "Telecomunicazioni",
  // Retail - Home
  furniture: "Arredamento",
  kitchen: "Cucine",
  bed: "Materassi e Letti",
  flooring: "Pavimenti",
  tiles: "Piastrelle",
  bathroom_furnishing: "Arredo Bagno",
  curtain: "Tendaggi",
  carpet: "Tappeti",
  lighting: "Illuminazione",
  glaziery: "Vetrai",
  // Retail - Other
  books: "Librerie",
  newsagent: "Edicole",
  stationery: "Cartolerie",
  florist: "Fioristi",
  jewelry: "Gioiellerie",
  watches: "Orologerie",
  toys: "Giocattoli",
  baby_goods: "Articoli per Bambini",
  sports: "Negozi di Sport",
  outdoor: "Outdoor e Camping",
  bicycle: "Negozi di Biciclette",
  motorcycle: "Moto",
  music: "Negozi di Musica",
  musical_instrument: "Strumenti Musicali",
  gift: "Regali",
  antiques: "Antiquari",
  second_hand: "Usato",
  model: "Modellismo",
  hobby: "Hobby e Bricolage",
  art: "Gallerie d'Arte",
  photo: "Fotografia",
  tobacco: "Tabaccherie",
  e_cigarette: "Sigarette Elettroniche",
  erotic: "Sexy Shop",
  weapons: "Armerie",
  // Hardware & Building
  hardware: "Ferramenta",
  doityourself: "Fai da Te",
  paint: "Colorifici",
  building_materials: "Imprese Edili",
  // Automotive
  car_repair: "Autofficine",
  car_wash: "Autolavaggi",
  car_rental: "Autonoleggi",
  car_parts: "Ricambi Auto",
  car_dealer: "Concessionarie Auto",
  tyres: "Pneumatici",
  vehicle_inspection: "Revisioni Auto",
  fuel: "Distributori di Carburante",
  // Sport & Fitness
  gym: "Palestre",
  sports_centre: "Centri Sportivi",
  swimming_pool: "Piscine",
  golf_course: "Golf",
  martial_arts: "Arti Marziali",
  yoga: "Centri Yoga",
  // Services
  laundry: "Lavanderie",
  dry_cleaning: "Lavanderie",
  post_office: "Uffici Postali",
  funeral_directors: "Onoranze Funebri",
  taxi: "Taxi",
  copyshop: "Tipografie",
  // Craft
  blacksmith: "Fabbri",
  carpenter: "Falegnami",
  plumber: "Idraulici",
  electrician: "Elettricisti",
  painter: "Imbianchini",
  shoemaker: "Calzolai",
  key_cutter: "Duplicazione Chiavi",
  roofing: "Lattonieri",
  stonemason: "Scalpellini",
  beekeeper: "Apicoltori",
  winery: "Cantine",
  distillery: "Distillerie",
  // Public & Other amenity
  library: "Biblioteche",
  charging_station: "Colonnine Ricarica",
  vending_machine: "Distributori Automatici",
  parking: "Parcheggi",
  bicycle_parking: "Parcheggi Biciclette",
  bicycle_rental: "Noleggio Biciclette",
  nightclub: "Discoteche",
  sauna: "Saune",
  pet: "Negozi per Animali",
  pet_grooming: "Toelettatura Animali",
  coffee: "Torrefazioni",
  spices: "Spezierie",
  tea: "Negozi di Tè",
  department_store: "Grandi Magazzini",
  mall: "Centri Commerciali",
  variety_store: "Bazar",
  general: "Alimentari",
};

interface ComuneInput {
  city: string;
  province: string;
  region: string;
}

interface ImportResult {
  city: string;
  imported: number;
  skipped: number;
  error?: string;
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchOverpass(query: string, retries = 3): Promise<any> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const res = await fetch("https://overpass-api.de/api/interpreter", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `data=${encodeURIComponent(query)}`,
        signal: AbortSignal.timeout(55000),
      });
      if (res.status === 429 || res.status === 504) {
        await sleep(10000 * (attempt + 1));
        continue;
      }
      if (!res.ok) throw new Error(`Overpass HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      if (attempt === retries - 1) throw e;
      await sleep(3000 * (attempt + 1));
    }
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization header");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Verify caller is admin
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) throw new Error("Unauthorized");

    const { data: adminRow } = await supabase
      .from("admins").select("user_id").eq("user_id", user.id).maybeSingle();
    if (!adminRow) throw new Error("Not an admin");

    const body = await req.json();

    // Load category map once
    const { data: cats } = await supabase.from("business_categories").select("id, name");
    const categoryMap = new Map<string, string>(cats?.map(c => [c.name, c.id]) ?? []);

    // Mode 1: get list of comuni with few businesses (for the admin to pick)
    if (body.mode === "list") {
      const minCount = body.min_count ?? 5;
      const limit = body.limit ?? 100;
      const { data } = await supabase.rpc("get_comuni_with_few_businesses", {
        p_max_count: minCount,
        p_limit: limit,
      }).throwOnError();
      return new Response(JSON.stringify({ comuni: data ?? [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Mode 2: import a batch of comuni
    const comuni: ComuneInput[] = body.comuni ?? [];
    if (comuni.length === 0) throw new Error("No comuni provided");
    if (comuni.length > 20) throw new Error("Max 20 comuni per call to avoid timeouts");

    const results: ImportResult[] = [];

    for (const comune of comuni) {
      const { city, province, region } = comune;
      try {
        // Build bbox-based Overpass query (faster than around:)
        // First geocode city to get approximate center
        const geoRes = await fetch(
          `https://nominatim.openstreetmap.org/search?city=${encodeURIComponent(city)}&state=${encodeURIComponent(region)}&country=Italy&format=json&limit=1`,
          { headers: { "User-Agent": "ItalianBizDirectory/2.0 import@localbiz.it" } }
        );
        const geoData = await geoRes.json();
        if (!geoData?.length) {
          results.push({ city, imported: 0, skipped: 0, error: "Geocode failed" });
          continue;
        }

        const lat = parseFloat(geoData[0].lat);
        const lon = parseFloat(geoData[0].lon);
        // radius: 5km for small comuni, sufficient for most italian municipalities
        const radius = 6000;

        const overpassQuery = `[out:json][timeout:50];
(
  node["name"]["amenity"](around:${radius},${lat},${lon});
  node["name"]["shop"](around:${radius},${lat},${lon});
  node["name"]["craft"](around:${radius},${lat},${lon});
  node["name"]["office"](around:${radius},${lat},${lon});
  way["name"]["amenity"](around:${radius},${lat},${lon});
  way["name"]["shop"](around:${radius},${lat},${lon});
);
out center tags;`;

        const osmData = await fetchOverpass(overpassQuery);
        const elements = osmData?.elements ?? [];

        // Get existing osm_ids for this city to avoid duplicates
        const { data: existingOsm } = await supabase
          .from("unclaimed_business_locations")
          .select("osm_id")
          .eq("city", city)
          .not("osm_id", "is", null);
        const existingOsmIds = new Set(existingOsm?.map(r => r.osm_id) ?? []);

        const toInsert: any[] = [];

        for (const el of elements) {
          if (!el.tags?.name) continue;
          const osmId = `${el.type}/${el.id}`;
          if (existingOsmIds.has(osmId)) continue;

          const tags = el.tags;
          const osmTag = tags.amenity || tags.shop || tags.craft || tags.office;
          if (!osmTag) continue;

          const catName = OSM_CATEGORY_MAP[osmTag];
          if (!catName) continue;
          const catId = categoryMap.get(catName);
          if (!catId) continue;

          const elLat = el.lat ?? el.center?.lat;
          const elLon = el.lon ?? el.center?.lon;

          const elCity = tags["addr:city"] || city;

          toInsert.push({
            name: tags.name,
            category_id: catId,
            city: elCity,
            province: province,
            region: region,
            street: tags["addr:street"] || null,
            postal_code: tags["addr:postcode"] || null,
            phone: tags.phone || tags["contact:phone"] || null,
            website: tags.website || tags["contact:website"] || null,
            email: tags.email || tags["contact:email"] || null,
            business_hours: tags.opening_hours || null,
            latitude: elLat ?? null,
            longitude: elLon ?? null,
            osm_id: osmId,
            is_claimed: false,
            added_by: null,
            approval_status: "approved",
          });
        }

        let imported = 0;
        const BATCH = 200;
        for (let i = 0; i < toInsert.length; i += BATCH) {
          const chunk = toInsert.slice(i, i + BATCH);
          const { error } = await supabase
            .from("unclaimed_business_locations")
            .insert(chunk);
          if (!error) imported += chunk.length;
        }

        results.push({
          city,
          imported,
          skipped: elements.length - toInsert.length,
        });

        // Rate-limit between comuni
        await sleep(1500);
      } catch (e: any) {
        results.push({ city, imported: 0, skipped: 0, error: e.message });
      }
    }

    const totalImported = results.reduce((s, r) => s + r.imported, 0);
    return new Response(
      JSON.stringify({ results, total_imported: totalImported }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
