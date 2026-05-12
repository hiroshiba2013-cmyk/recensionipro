import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

// OSM tag → DB category name mapping
const OSM_CATEGORY_MAP: Record<string, string> = {
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
  hairdresser: "Parrucchieri",
  hairdresser_supply: "Forniture Parrucchieri",
  beauty: "Centri Estetici",
  massage: "Centri Massaggi",
  tattoo: "Tatuatori",
  hotel: "Hotel",
  motel: "Motel",
  hostel: "Ostelli",
  guest_house: "B&B",
  camp_site: "Campeggi",
  caravan_site: "Aree Camper",
  chalet: "Chalet",
  bank: "Banche",
  atm: "Bancomat",
  insurance: "Assicurazioni",
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
  school: "Scuole",
  university: "Università",
  kindergarten: "Asili",
  language_school: "Scuole di Lingue",
  music_school: "Scuole di Musica",
  dancing_school: "Scuole di Danza",
  driving_school: "Autoscuole",
  clothes: "Abbigliamento",
  shoes: "Calzature",
  boutique: "Boutique",
  fashion: "Moda",
  leather: "Articoli in Pelle",
  tailor: "Sartorie",
  electronics: "Elettronica",
  computer: "Negozi di Computer",
  mobile_phone: "Negozi di Telefonia",
  hifi: "Hi-Fi",
  camera: "Fotocamere",
  video_games: "Videogiochi",
  telecommunication: "Telecomunicazioni",
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
  hardware: "Ferramenta",
  doityourself: "Fai da Te",
  paint: "Colorifici",
  building_materials: "Imprese Edili",
  car_repair: "Autofficine",
  car_wash: "Autolavaggi",
  car_rental: "Autonoleggi",
  car_parts: "Ricambi Auto",
  car_dealer: "Concessionarie Auto",
  tyres: "Pneumatici",
  vehicle_inspection: "Revisioni Auto",
  fuel: "Distributori di Carburante",
  gym: "Palestre",
  sports_centre: "Centri Sportivi",
  swimming_pool: "Piscine",
  golf_course: "Golf",
  martial_arts: "Arti Marziali",
  yoga: "Centri Yoga",
  laundry: "Lavanderie",
  dry_cleaning: "Lavanderie",
  post_office: "Uffici Postali",
  funeral_directors: "Onoranze Funebri",
  taxi: "Taxi",
  copyshop: "Tipografie",
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
  library: "Biblioteche",
  charging_station: "Colonnine Ricarica",
  vending_machine: "Distributori Automatici",
  parking: "Parcheggi",
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

// Province → ISO 3166-2 area code for Overpass (it uses ISO codes for admin_level areas)
// We use the "ISO3166-2" relation tag to fetch the area
const PROVINCE_AREA: Record<string, string> = {
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

async function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms));
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
        await sleep(8000 * (attempt + 1));
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

    // Verify admin
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) throw new Error("Unauthorized");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );
    const { data: adminRow } = await supabase
      .from("admins").select("user_id").eq("user_id", user.id).maybeSingle();
    if (!adminRow) throw new Error("Not an admin");

    const body = await req.json();

    // ── MODE: province+category import ──────────────────────────────────────
    // body: { province, region, osm_tag }
    // Queries the entire province area for a single OSM tag, inserts new records
    const { province, region, osm_tag } = body;
    if (!province || !region || !osm_tag) {
      throw new Error("province, region and osm_tag are required");
    }

    const isoCode = PROVINCE_AREA[province.toUpperCase()];
    if (!isoCode) throw new Error(`Unknown province code: ${province}`);

    const catName = OSM_CATEGORY_MAP[osm_tag];
    if (!catName) throw new Error(`Unknown OSM tag: ${osm_tag}`);

    // Load category id
    const { data: catRow } = await supabase
      .from("business_categories").select("id").eq("name", catName).maybeSingle();
    if (!catRow) throw new Error(`Category not found in DB: ${catName}`);
    const catId = catRow.id;

    // Determine OSM key (amenity / shop / craft / office)
    // We try all keys since OSM tagging varies
    const osmKeyTag = osm_tag === "fuel" ? "amenity" :
      ["restaurant","fast_food","cafe","bar","pub","biergarten","food_court","ice_cream",
       "pharmacy","doctors","dentist","hospital","clinic","gym","bank","atm","post_office",
       "library","charging_station","vending_machine","parking","nightclub","taxi",
       "driving_school","kindergarten","university","school","funeral_directors","sauna"].includes(osm_tag)
      ? "amenity"
      : ["supermarket","convenience","greengrocer","butcher","fishmonger","deli","dairy",
         "bakery","pastry","confectionery","chocolate","cheese","wine","beverages","pasta",
         "clothes","shoes","boutique","fashion","leather","electronics","computer",
         "mobile_phone","hifi","camera","video_games","furniture","kitchen","bed",
         "flooring","tiles","bathroom_furnishing","curtain","carpet","lighting","glaziery",
         "books","newsagent","stationery","florist","jewelry","watches","toys","baby_goods",
         "sports","outdoor","bicycle","motorcycle","music","musical_instrument","gift",
         "antiques","second_hand","model","hobby","art","photo","tobacco","e_cigarette",
         "erotic","weapons","hardware","doityourself","paint","building_materials",
         "car_repair","car_wash","car_rental","car_parts","car_dealer","tyres",
         "vehicle_inspection","pet","pet_grooming","coffee","spices","tea",
         "department_store","mall","variety_store","general","hairdresser",
         "hairdresser_supply","optician","hearing_aids","travel_agency","copyshop",
         "laundry","dry_cleaning","swimming_pool","golf_course"].includes(osm_tag)
      ? "shop"
      : ["lawyer","notary","accountant","financial_advisor","tax_advisor","architect",
         "engineer","surveyor","estate_agent","employment_agency","advertising",
         "consultant","insurance","telecommunication"].includes(osm_tag)
      ? "office"
      : ["blacksmith","carpenter","plumber","electrician","painter","shoemaker",
         "key_cutter","roofing","stonemason","beekeeper","winery","distillery",
         "tailor","physiotherapist","psychologist","masseur","tattoo",
         "martial_arts","yoga","music_school","dancing_school","language_school"].includes(osm_tag)
      ? "craft"
      : "amenity";

    // Build Overpass query using area (province boundary)
    const overpassQuery = `[out:json][timeout:55];
area["ISO3166-2"="${isoCode}"]["boundary"="administrative"]->.prov;
(
  node["name"]["${osmKeyTag}"="${osm_tag}"](area.prov);
  way["name"]["${osmKeyTag}"="${osm_tag}"](area.prov);
);
out center tags;`;

    const osmData = await fetchOverpass(overpassQuery);
    const elements: any[] = osmData?.elements ?? [];

    if (elements.length === 0) {
      return new Response(
        JSON.stringify({ imported: 0, skipped: 0, total_found: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Load existing osm_ids for this province+category to skip duplicates
    const { data: existingRows } = await supabase
      .from("unclaimed_business_locations")
      .select("osm_id")
      .eq("province", province)
      .eq("category_id", catId)
      .not("osm_id", "is", null);
    const existingIds = new Set(existingRows?.map(r => r.osm_id) ?? []);

    const toInsert: any[] = [];
    for (const el of elements) {
      if (!el.tags?.name) continue;
      const osmId = `${el.type}/${el.id}`;
      if (existingIds.has(osmId)) continue;

      const elLat = el.lat ?? el.center?.lat ?? null;
      const elLon = el.lon ?? el.center?.lon ?? null;
      const tags = el.tags;

      toInsert.push({
        name: tags.name,
        category_id: catId,
        city: tags["addr:city"] || tags["addr:municipality"] || null,
        province,
        region,
        street: tags["addr:street"] || null,
        postal_code: tags["addr:postcode"] || null,
        phone: tags.phone || tags["contact:phone"] || null,
        website: tags.website || tags["contact:website"] || null,
        email: tags.email || tags["contact:email"] || null,
        business_hours: tags.opening_hours || null,
        latitude: elLat,
        longitude: elLon,
        osm_id: osmId,
        is_claimed: false,
        added_by: null,
        approval_status: "approved",
      });
    }

    // Filter out records without city (city is required by DB)
    // For items without addr:city we do a reverse geocode attempt — but that's slow,
    // so we accept null city here; the DB column is NOT NULL so skip those without city
    const withCity = toInsert.filter(r => r.city && r.city.trim() !== "");
    // For items without city but with coordinates, try to fill from province capital
    const withoutCity = toInsert.filter(r => !r.city || r.city.trim() === "");

    // Fallback: use province sigla as approximate city hint only when no addr:city
    // (better than dropping them — admin can fix later)
    // Actually the DB requires city NOT NULL, so we must provide one.
    // Use a dummy derived from the province name to not lose the data.
    const { data: capitalRow } = await supabase
      .from("unclaimed_business_locations")
      .select("city")
      .eq("province", province)
      .not("city", "is", null)
      .limit(1)
      .maybeSingle();
    const fallbackCity = capitalRow?.city ?? province;

    const allToInsert = [
      ...withCity,
      ...withoutCity.map(r => ({ ...r, city: fallbackCity })),
    ];

    let imported = 0;
    const BATCH = 200;
    for (let i = 0; i < allToInsert.length; i += BATCH) {
      const chunk = allToInsert.slice(i, i + BATCH);
      const { error } = await supabase
        .from("unclaimed_business_locations")
        .insert(chunk);
      if (!error) imported += chunk.length;
    }

    return new Response(
      JSON.stringify({
        imported,
        skipped: elements.length - allToInsert.length + (allToInsert.length - imported),
        total_found: elements.length,
        category: catName,
        province,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
