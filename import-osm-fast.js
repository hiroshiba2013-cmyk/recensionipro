/**
 * Importazione mirata per categorie con 0 o pochi record
 * Tag OSM molto specifici per ogni categoria
 */
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import https from 'https';

config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

// Copertura nazionale: tutte le province italiane
const CITIES = [
  // NORD-OVEST
  { name: 'Torino', region: 'Piemonte', province: 'TO', bbox: [44.94, 7.56, 45.18, 7.80] },
  { name: 'Milano', region: 'Lombardia', province: 'MI', bbox: [45.34, 9.04, 45.58, 9.32] },
  { name: 'Genova', region: 'Liguria', province: 'GE', bbox: [44.32, 8.82, 44.52, 9.04] },
  { name: 'Aosta', region: "Valle d'Aosta", province: 'AO', bbox: [45.68, 7.25, 45.84, 7.41] },
  { name: 'Novara', region: 'Piemonte', province: 'NO', bbox: [45.40, 8.54, 45.56, 8.72] },
  { name: 'Cuneo', region: 'Piemonte', province: 'CN', bbox: [44.32, 7.48, 44.52, 7.68] },
  { name: 'Alessandria', region: 'Piemonte', province: 'AL', bbox: [44.84, 8.54, 45.04, 8.74] },
  { name: 'Asti', region: 'Piemonte', province: 'AT', bbox: [44.82, 8.12, 45.02, 8.32] },
  { name: 'Brescia', region: 'Lombardia', province: 'BS', bbox: [45.46, 10.14, 45.66, 10.34] },
  { name: 'Bergamo', region: 'Lombardia', province: 'BG', bbox: [45.62, 9.60, 45.82, 9.80] },
  { name: 'Como', region: 'Lombardia', province: 'CO', bbox: [45.74, 9.02, 45.94, 9.22] },
  { name: 'Varese', region: 'Lombardia', province: 'VA', bbox: [45.74, 8.74, 45.94, 8.94] },
  { name: 'Monza', region: 'Lombardia', province: 'MB', bbox: [45.52, 9.20, 45.72, 9.40] },
  { name: 'Pavia', region: 'Lombardia', province: 'PV', bbox: [45.12, 9.08, 45.32, 9.28] },
  { name: 'Cremona', region: 'Lombardia', province: 'CR', bbox: [45.06, 9.96, 45.26, 10.16] },
  { name: 'Mantova', region: 'Lombardia', province: 'MN', bbox: [45.10, 10.70, 45.30, 10.90] },
  { name: 'Lecco', region: 'Lombardia', province: 'LC', bbox: [45.78, 9.32, 45.98, 9.52] },
  { name: 'Lodi', region: 'Lombardia', province: 'LO', bbox: [45.26, 9.44, 45.46, 9.64] },
  { name: 'Sondrio', region: 'Lombardia', province: 'SO', bbox: [46.12, 9.80, 46.32, 10.00] },
  { name: 'La Spezia', region: 'Liguria', province: 'SP', bbox: [44.04, 9.74, 44.24, 9.94] },
  { name: 'Savona', region: 'Liguria', province: 'SV', bbox: [44.26, 8.42, 44.46, 8.62] },
  { name: 'Imperia', region: 'Liguria', province: 'IM', bbox: [43.86, 7.96, 44.06, 8.16] },
  // NORD-EST
  { name: 'Venezia', region: 'Veneto', province: 'VE', bbox: [45.34, 12.24, 45.54, 12.44] },
  { name: 'Verona', region: 'Veneto', province: 'VR', bbox: [45.34, 10.90, 45.54, 11.10] },
  { name: 'Padova', region: 'Veneto', province: 'PD', bbox: [45.32, 11.78, 45.52, 11.98] },
  { name: 'Vicenza', region: 'Veneto', province: 'VI', bbox: [45.48, 11.46, 45.68, 11.66] },
  { name: 'Treviso', region: 'Veneto', province: 'TV', bbox: [45.60, 12.18, 45.80, 12.38] },
  { name: 'Belluno', region: 'Veneto', province: 'BL', bbox: [46.08, 12.16, 46.28, 12.36] },
  { name: 'Rovigo', region: 'Veneto', province: 'RO', bbox: [44.94, 11.74, 45.14, 11.94] },
  { name: 'Trieste', region: 'Friuli-Venezia Giulia', province: 'TS', bbox: [45.56, 13.68, 45.76, 13.88] },
  { name: 'Udine', region: 'Friuli-Venezia Giulia', province: 'UD', bbox: [46.00, 13.16, 46.20, 13.36] },
  { name: 'Pordenone', region: 'Friuli-Venezia Giulia', province: 'PN', bbox: [45.90, 12.58, 46.10, 12.78] },
  { name: 'Gorizia', region: 'Friuli-Venezia Giulia', province: 'GO', bbox: [45.88, 13.56, 46.08, 13.76] },
  { name: 'Trento', region: 'Trentino-Alto Adige', province: 'TN', bbox: [46.00, 11.06, 46.20, 11.26] },
  { name: 'Bolzano', region: 'Trentino-Alto Adige', province: 'BZ', bbox: [46.42, 11.26, 46.62, 11.46] },
  { name: 'Bologna', region: 'Emilia-Romagna', province: 'BO', bbox: [44.40, 11.24, 44.60, 11.44] },
  { name: 'Modena', region: 'Emilia-Romagna', province: 'MO', bbox: [44.56, 10.84, 44.76, 11.04] },
  { name: 'Parma', region: 'Emilia-Romagna', province: 'PR', bbox: [44.70, 10.24, 44.90, 10.44] },
  { name: 'Reggio Emilia', region: 'Emilia-Romagna', province: 'RE', bbox: [44.60, 10.54, 44.80, 10.74] },
  { name: 'Ferrara', region: 'Emilia-Romagna', province: 'FE', bbox: [44.76, 11.54, 44.96, 11.74] },
  { name: 'Rimini', region: 'Emilia-Romagna', province: 'RN', bbox: [43.98, 12.48, 44.18, 12.68] },
  { name: 'Ravenna', region: 'Emilia-Romagna', province: 'RA', bbox: [44.32, 12.12, 44.52, 12.32] },
  { name: 'Piacenza', region: 'Emilia-Romagna', province: 'PC', bbox: [44.98, 9.62, 45.18, 9.82] },
  { name: 'Forlì', region: 'Emilia-Romagna', province: 'FC', bbox: [44.18, 12.00, 44.38, 12.20] },
  { name: 'Cesena', region: 'Emilia-Romagna', province: 'FC', bbox: [44.10, 12.20, 44.30, 12.40] },
  // CENTRO
  { name: 'Roma', region: 'Lazio', province: 'RM', bbox: [41.74, 12.34, 41.02, 12.62] },
  { name: 'Firenze', region: 'Toscana', province: 'FI', bbox: [43.68, 11.16, 43.88, 11.36] },
  { name: 'Ancona', region: 'Marche', province: 'AN', bbox: [43.52, 13.44, 43.72, 13.64] },
  { name: 'Perugia', region: 'Umbria', province: 'PG', bbox: [43.02, 12.30, 43.22, 12.50] },
  { name: 'Livorno', region: 'Toscana', province: 'LI', bbox: [43.46, 10.24, 43.66, 10.44] },
  { name: 'Pisa', region: 'Toscana', province: 'PI', bbox: [43.64, 10.32, 43.84, 10.52] },
  { name: 'Arezzo', region: 'Toscana', province: 'AR', bbox: [43.40, 11.80, 43.60, 12.00] },
  { name: 'Siena', region: 'Toscana', province: 'SI', bbox: [43.26, 11.24, 43.46, 11.44] },
  { name: 'Prato', region: 'Toscana', province: 'PO', bbox: [43.80, 11.00, 44.00, 11.20] },
  { name: 'Lucca', region: 'Toscana', province: 'LU', bbox: [43.76, 10.42, 43.96, 10.62] },
  { name: 'Pistoia', region: 'Toscana', province: 'PT', bbox: [43.86, 10.84, 44.06, 11.04] },
  { name: 'Massa', region: 'Toscana', province: 'MS', bbox: [43.96, 10.06, 44.16, 10.26] },
  { name: 'Grosseto', region: 'Toscana', province: 'GR', bbox: [42.70, 11.02, 42.90, 11.22] },
  { name: 'Latina', region: 'Lazio', province: 'LT', bbox: [41.38, 12.82, 41.58, 13.02] },
  { name: 'Frosinone', region: 'Lazio', province: 'FR', bbox: [41.57, 13.27, 41.77, 13.47] },
  { name: 'Viterbo', region: 'Lazio', province: 'VT', bbox: [42.34, 12.00, 42.54, 12.20] },
  { name: 'Rieti', region: 'Lazio', province: 'RI', bbox: [42.34, 12.78, 42.54, 12.98] },
  { name: 'Pesaro', region: 'Marche', province: 'PU', bbox: [43.84, 12.84, 44.04, 13.04] },
  { name: 'Macerata', region: 'Marche', province: 'MC', bbox: [43.23, 13.39, 43.43, 13.59] },
  { name: 'Ascoli Piceno', region: 'Marche', province: 'AP', bbox: [42.80, 13.53, 43.00, 13.73] },
  { name: 'Fermo', region: 'Marche', province: 'FM', bbox: [43.11, 13.67, 43.27, 13.83] },
  { name: 'Terni', region: 'Umbria', province: 'TR', bbox: [42.48, 12.56, 42.68, 12.76] },
  { name: "L'Aquila", region: 'Abruzzo', province: 'AQ', bbox: [42.29, 13.29, 42.49, 13.49] },
  { name: 'Pescara', region: 'Abruzzo', province: 'PE', bbox: [42.38, 14.14, 42.58, 14.34] },
  { name: 'Chieti', region: 'Abruzzo', province: 'CH', bbox: [42.30, 14.10, 42.50, 14.30] },
  { name: 'Teramo', region: 'Abruzzo', province: 'TE', bbox: [42.61, 13.66, 42.76, 13.82] },
  // SUD
  { name: 'Napoli', region: 'Campania', province: 'NA', bbox: [40.74, 14.14, 40.94, 14.34] },
  { name: 'Salerno', region: 'Campania', province: 'SA', bbox: [40.60, 14.68, 40.80, 14.88] },
  { name: 'Caserta', region: 'Campania', province: 'CE', bbox: [41.00, 14.26, 41.20, 14.46] },
  { name: 'Benevento', region: 'Campania', province: 'BN', bbox: [41.06, 14.72, 41.26, 14.92] },
  { name: 'Avellino', region: 'Campania', province: 'AV', bbox: [40.85, 14.73, 41.05, 14.93] },
  { name: 'Bari', region: 'Puglia', province: 'BA', bbox: [41.02, 16.78, 41.22, 16.98] },
  { name: 'Foggia', region: 'Puglia', province: 'FG', bbox: [41.38, 15.48, 41.58, 15.68] },
  { name: 'Lecce', region: 'Puglia', province: 'LE', bbox: [40.28, 18.10, 40.48, 18.30] },
  { name: 'Taranto', region: 'Puglia', province: 'TA', bbox: [40.38, 17.16, 40.58, 17.36] },
  { name: 'Brindisi', region: 'Puglia', province: 'BR', bbox: [40.56, 17.86, 40.76, 18.06] },
  { name: 'Potenza', region: 'Basilicata', province: 'PZ', bbox: [40.57, 15.73, 40.77, 15.93] },
  { name: 'Matera', region: 'Basilicata', province: 'MT', bbox: [40.58, 16.52, 40.78, 16.72] },
  { name: 'Cosenza', region: 'Calabria', province: 'CS', bbox: [39.22, 16.18, 39.42, 16.38] },
  { name: 'Reggio Calabria', region: 'Calabria', province: 'RC', bbox: [38.02, 15.56, 38.22, 15.76] },
  { name: 'Catanzaro', region: 'Calabria', province: 'CZ', bbox: [38.82, 16.52, 39.02, 16.72] },
  { name: 'Crotone', region: 'Calabria', province: 'KR', bbox: [38.93, 17.04, 39.13, 17.24] },
  { name: 'Vibo Valentia', region: 'Calabria', province: 'VV', bbox: [38.63, 16.04, 38.83, 16.24] },
  { name: 'Campobasso', region: 'Molise', province: 'CB', bbox: [41.49, 14.58, 41.69, 14.78] },
  { name: 'Isernia', region: 'Molise', province: 'IS', bbox: [41.55, 14.18, 41.65, 14.28] },
  // SICILIA
  { name: 'Palermo', region: 'Sicilia', province: 'PA', bbox: [38.02, 13.26, 38.22, 13.46] },
  { name: 'Catania', region: 'Sicilia', province: 'CT', bbox: [37.42, 15.00, 37.62, 15.20] },
  { name: 'Messina', region: 'Sicilia', province: 'ME', bbox: [38.10, 15.46, 38.30, 15.66] },
  { name: 'Siracusa', region: 'Sicilia', province: 'SR', bbox: [37.00, 15.22, 37.20, 15.42] },
  { name: 'Agrigento', region: 'Sicilia', province: 'AG', bbox: [37.24, 13.52, 37.44, 13.72] },
  { name: 'Ragusa', region: 'Sicilia', province: 'RG', bbox: [36.86, 14.66, 37.06, 14.86] },
  { name: 'Trapani', region: 'Sicilia', province: 'TP', bbox: [37.94, 12.46, 38.14, 12.66] },
  { name: 'Caltanissetta', region: 'Sicilia', province: 'CL', bbox: [37.42, 13.98, 37.62, 14.18] },
  { name: 'Enna', region: 'Sicilia', province: 'EN', bbox: [37.50, 14.22, 37.70, 14.42] },
  // SARDEGNA
  { name: 'Cagliari', region: 'Sardegna', province: 'CA', bbox: [39.14, 9.02, 39.34, 9.22] },
  { name: 'Sassari', region: 'Sardegna', province: 'SS', bbox: [40.66, 8.48, 40.86, 8.68] },
  { name: 'Nuoro', region: 'Sardegna', province: 'NU', bbox: [40.25, 9.26, 40.45, 9.46] },
  { name: 'Oristano', region: 'Sardegna', province: 'OR', bbox: [39.85, 8.54, 40.05, 8.74] },
  { name: 'Olbia', region: 'Sardegna', province: 'OT', bbox: [40.87, 9.45, 41.07, 9.65] },
];

// Tag OSM specifici per categorie mancanti/carenti
// Costruisce query separate per gruppi di tag
const BATCHES = [
  {
    label: 'Pizzerie, Panifici, Birrerie, Pastifici, Distillerie',
    tags: [
      // Pizzerie: amenity=restaurant + cuisine=pizza
      `node["amenity"="restaurant"]["cuisine"~"pizza|Pizza"](BBOX);`,
      `node["amenity"="fast_food"]["cuisine"~"pizza|Pizza"](BBOX);`,
      // Panifici/Pasticcerie con nomi comuni
      `node["shop"="bakery"](BBOX);`,
      `node["shop"="pastry"](BBOX);`,
      `node["craft"="bakery"](BBOX);`,
      `node["craft"="distillery"](BBOX);`,
      `node["craft"="brewery"](BBOX);`,
      `node["craft"="winery"](BBOX);`,
      `node["amenity"="pub"](BBOX);`,
      `node["amenity"="biergarten"](BBOX);`,
    ],
    catMap: {
      'restaurant_pizza': 'Pizzerie',
      'fast_food_pizza': 'Pizzerie',
      'bakery': 'Panifici',
      'pastry': 'Pasticcerie',
      'craft_bakery': 'Panifici',
      'craft_distillery': 'Distillerie',
      'craft_brewery': 'Birrifici',
      'craft_winery': 'Cantine',
      'pub': 'Pub e Locali',
      'biergarten': 'Pub e Locali',
    }
  },
  {
    label: 'Yoga, Massaggi, Saune, Sub, Golf, Arti Marziali',
    tags: [
      `node["leisure"="yoga"](BBOX);`,
      `node["sport"="yoga"](BBOX);`,
      `node["leisure"="sauna"](BBOX);`,
      `node["amenity"="sauna"](BBOX);`,
      `node["leisure"="golf_course"](BBOX);`,
      `node["sport"="golf"](BBOX);`,
      `node["sport"="9pin"](BBOX);`,
      `node["sport"="10pin"](BBOX);`,
      `node["leisure"="bowling_alley"](BBOX);`,
      `node["sport"="diving"](BBOX);`,
      `node["shop"="diving"](BBOX);`,
      `node["sport"="martial_arts"](BBOX);`,
      `node["sport"="judo"](BBOX);`,
      `node["sport"="karate"](BBOX);`,
      `node["sport"="taekwondo"](BBOX);`,
      `node["amenity"="massage"](BBOX);`,
      `node["shop"="massage"](BBOX);`,
      `node["leisure"="spa"](BBOX);`,
    ],
    catMap: {
      'yoga': 'Centri Yoga',
      'sauna': 'Saune',
      'golf_course': 'Golf',
      'golf': 'Golf',
      'bowling': 'Bowling',
      'diving': 'Sub e Diving',
      'martial_arts': 'Arti Marziali',
      'massage': 'Centri Massaggi',
      'spa': 'Centri Benessere',
    }
  },
  {
    label: 'Onoranze Funebri, Toelettatura, Taxi, Sartorie, Università',
    tags: [
      `node["amenity"="funeral_directors"](BBOX);`,
      `node["shop"="funeral_directors"](BBOX);`,
      `node["amenity"="veterinary"](BBOX);`,
      `node["shop"="pet_grooming"](BBOX);`,
      `node["shop"="pet"](BBOX);`,
      `node["amenity"="taxi"](BBOX);`,
      `node["shop"="tailor"](BBOX);`,
      `node["craft"="tailor"](BBOX);`,
      `node["amenity"="university"](BBOX);`,
      `node["amenity"="college"](BBOX);`,
      `node["shop"="hifi"](BBOX);`,
      `node["shop"="camera"](BBOX);`,
      `node["shop"="photo"](BBOX);`,
      `node["craft"="photographer"](BBOX);`,
    ],
    catMap: {
      'funeral_directors': 'Onoranze Funebri',
      'pet_grooming': 'Toelettatura Animali',
      'pet': 'Animali',
      'taxi': 'Taxi',
      'tailor': 'Sartorie',
      'university': 'Università',
      'college': 'Istituti Formativi',
      'hifi': 'Hi-Fi',
      'camera': 'Fotocamere',
      'photo': 'Fotografia',
      'photographer': 'Fotografi',
    }
  },
  {
    label: 'Pneumatici, Revisioni, Costruttori, Idraulici, Elettricisti',
    tags: [
      `node["shop"="tyres"](BBOX);`,
      `node["amenity"="vehicle_inspection"](BBOX);`,
      `node["craft"="plumber"](BBOX);`,
      `node["craft"="electrician"](BBOX);`,
      `node["craft"="builder"](BBOX);`,
      `node["craft"="construction"](BBOX);`,
      `node["craft"="hvac"](BBOX);`,
      `node["craft"="painter"](BBOX);`,
      `node["craft"="carpenter"](BBOX);`,
      `node["craft"="stonemason"](BBOX);`,
      `node["craft"="roofer"](BBOX);`,
      `node["craft"="scaffolder"](BBOX);`,
      `node["craft"="tiler"](BBOX);`,
      `node["craft"="floorer"](BBOX);`,
      `node["craft"="glazier"](BBOX);`,
      `node["craft"="locksmith"](BBOX);`,
      `node["craft"="blacksmith"](BBOX);`,
      `node["craft"="shoemaker"](BBOX);`,
      `node["craft"="jeweller"](BBOX);`,
      `node["craft"="watchmaker"](BBOX);`,
      `node["craft"="optician"](BBOX);`,
      `node["craft"="gardener"](BBOX);`,
      `node["craft"="beekeeper"](BBOX);`,
    ],
    catMap: {
      'tyres': 'Pneumatici',
      'vehicle_inspection': 'Revisioni Auto',
      'plumber': 'Idraulici',
      'electrician': 'Elettricisti',
      'builder': 'Costruttori',
      'construction': 'Imprese Edili',
      'hvac': 'Climatizzazione',
      'painter': 'Imbianchini',
      'carpenter': 'Falegnami',
      'stonemason': 'Scalpellini',
      'roofer': 'Costruttori',
      'scaffolder': 'Ponteggiatori',
      'tiler': 'Piastrellisti',
      'floorer': 'Posatori Parquet',
      'glazier': 'Vetrai',
      'locksmith': 'Duplicazione Chiavi',
      'blacksmith': 'Fabbri',
      'shoemaker': 'Calzolai',
      'jeweller': 'Orefici',
      'watchmaker': 'Orologiai',
      'optician': 'Ottici',
      'gardener': 'Giardinieri',
      'beekeeper': 'Apicoltori',
    }
  },
  {
    label: 'Moto, Infissi, Illuminazione, Materassi, Tendaggi, Bazar',
    tags: [
      `node["shop"="motorcycle"](BBOX);`,
      `node["shop"="windows"](BBOX);`,
      `node["shop"="door"](BBOX);`,
      `node["shop"="lighting"](BBOX);`,
      `node["shop"="bed"](BBOX);`,
      `node["shop"="curtain"](BBOX);`,
      `node["shop"="variety_store"](BBOX);`,
      `node["shop"="newsagent"](BBOX);`,
      `node["shop"="kiosk"](BBOX);`,
      `node["shop"="tobacco"](BBOX);`,
      `node["shop"="e-cigarette"](BBOX);`,
      `node["shop"="model"](BBOX);`,
      `node["shop"="garden_centre"](BBOX);`,
      `node["shop"="garden"](BBOX);`,
      `node["shop"="fishing"](BBOX);`,
      `node["shop"="hunting"](BBOX);`,
      `node["shop"="weapons"](BBOX);`,
      `node["shop"="frame"](BBOX);`,
    ],
    catMap: {
      'motorcycle': 'Moto',
      'windows': 'Infissi',
      'door': 'Infissi',
      'lighting': 'Illuminazione',
      'bed': 'Materassi e Letti',
      'curtain': 'Tendaggi',
      'variety_store': 'Bazar',
      'newsagent': 'Giornali',
      'kiosk': 'Edicole',
      'tobacco': 'Tabaccherie',
      'e-cigarette': 'Sigarette Elettroniche',
      'model': 'Modellismo',
      'garden_centre': 'Giardinaggio',
      'garden': 'Giardinaggio',
      'fishing': 'Pesca e Caccia',
      'hunting': 'Pesca e Caccia',
      'weapons': 'Armerie',
      'frame': 'Cornici',
    }
  },
  {
    label: 'Agenzie Lavoro, Pubblicità, Logistica, ONG, Associazioni',
    tags: [
      `node["office"="employment_agency"](BBOX);`,
      `node["office"="advertising_agency"](BBOX);`,
      `node["office"="logistics"](BBOX);`,
      `node["office"="ngo"](BBOX);`,
      `node"office"="association"](BBOX);`,
      `node["office"="foundation"](BBOX);`,
      `node["office"="company"](BBOX);`,
      `node["office"="graphic_design"](BBOX);`,
      `node["office"="signage"](BBOX);`,
      `node["office"="research"](BBOX);`,
      `node["amenity"="research_institute"](BBOX);`,
      `node["shop"="farm"](BBOX);`,
      `node["shop"="agrarian"](BBOX);`,
      `node["shop"="dairy"](BBOX);`,
      `node["craft"="pasta"](BBOX);`,
      `node["shop"="food_court"](BBOX);`,
      `node["amenity"="food_court"](BBOX);`,
    ],
    catMap: {
      'employment_agency': 'Agenzie del Lavoro',
      'advertising_agency': 'Agenzie Pubblicitarie',
      'logistics': 'Logistica',
      'ngo': 'ONG',
      'association': 'Associazioni',
      'foundation': 'Fondazioni',
      'company': 'Aziende',
      'graphic_design': 'Grafici',
      'signage': 'Insegne',
      'research': 'Centri di Ricerca',
      'research_institute': 'Centri di Ricerca',
      'farm': 'Prodotti Agricoli',
      'agrarian': 'Consorzi Agrari',
      'dairy': 'Latterie',
      'pasta': 'Pastifici',
      'food_court': 'Food Court',
    }
  },
  {
    label: 'Centri Commerciali, Sci, Boutique, Moda, Articoli Sportivi',
    tags: [
      `node["shop"="mall"](BBOX);`,
      `node["shop"="department_store"](BBOX);`,
      `node["shop"="fashion"](BBOX);`,
      `node["shop"="boutique"](BBOX);`,
      `node["shop"="ski"](BBOX);`,
      `node["shop"="sports"](BBOX);`,
      `node["shop"="outdoor"](BBOX);`,
      `node["shop"="golf"](BBOX);`,
      `node["shop"="diving"](BBOX);`,
      `node["shop"="surf"](BBOX);`,
      `node["shop"="erotic"](BBOX);`,
      `node["shop"="video_games"](BBOX);`,
      `node["shop"="video"](BBOX);`,
      `node["shop"="music"](BBOX);`,
      `node["shop"="musical_instrument"](BBOX);`,
      `node["shop"="beverages"](BBOX);`,
      `node["shop"="tea"](BBOX);`,
      `node["shop"="spices"](BBOX);`,
      `node["shop"="hairdresser_supply"](BBOX);`,
    ],
    catMap: {
      'mall': 'Centri Commerciali',
      'department_store': 'Grandi Magazzini',
      'fashion': 'Moda',
      'boutique': 'Boutique',
      'ski': 'Sci e Snowboard',
      'sports': 'Articoli Sportivi',
      'outdoor': 'Outdoor e Camping',
      'golf': 'Golf',
      'diving': 'Sub e Diving',
      'surf': 'Surf e Windsurf',
      'erotic': 'Sexy Shop',
      'video_games': 'Videogiochi',
      'video': 'Videonoleggi',
      'music': 'Negozi di Musica',
      'musical_instrument': 'Strumenti Musicali',
      'beverages': 'Negozi di Bevande',
      'tea': "Negozi di Tè",
      'spices': 'Spezierie',
      'hairdresser_supply': 'Forniture Parrucchieri',
    }
  },
];

let categoryCache = {};
let totalImported = 0;
const startTime = Date.now();

async function loadCategories() {
  const { data } = await supabase.from('business_categories').select('id, name');
  if (data) data.forEach(c => { categoryCache[c.name] = c.id; });
  console.log(`Caricate ${Object.keys(categoryCache).length} categorie`);
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

function fetchOverpass(query) {
  return new Promise((resolve, reject) => {
    const body = `data=${encodeURIComponent(query)}`;
    const opts = {
      hostname: 'overpass-api.de', path: '/api/interpreter', method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(body), 'User-Agent': 'ItalianBizDir/5.0' }
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
    req.write(body); req.end();
  });
}

function buildBatchQuery(batch, city) {
  const bboxStr = `${city.bbox[0]},${city.bbox[1]},${city.bbox[2]},${city.bbox[3]}`;
  const lines = batch.tags
    .filter(t => !t.includes('node"office"')) // fix typo guard
    .map(t => {
      const base = t.replace(/\(BBOX\)/g, `(${bboxStr})`);
      // also add way version
      return base + '\n  ' + base.replace(/^node/, 'way');
    });
  return `[out:json][timeout:120];\n(\n  ${lines.join('\n  ')}\n);\nout center tags;`;
}

function getCategory(tags, batch) {
  // Try amenity, shop, leisure, sport, craft, office
  const checkKeys = ['shop', 'craft', 'amenity', 'leisure', 'sport', 'office', 'tourism'];
  for (const k of checkKeys) {
    const v = tags[k];
    if (!v) continue;
    // direct match
    if (batch.catMap[v]) {
      const id = categoryCache[batch.catMap[v]];
      if (id) return id;
    }
    // prefix match (e.g. restaurant_pizza)
    if (tags.cuisine) {
      const cusineKey = `${v}_${tags.cuisine.split(';')[0].trim().toLowerCase()}`;
      if (batch.catMap[cusineKey]) {
        const id = categoryCache[batch.catMap[cusineKey]];
        if (id) return id;
      }
    }
  }
  return null;
}

async function importCityBatch(city, batch, batchIdx, cityIdx, totalCities) {
  const query = buildBatchQuery(batch, city);
  let elements = [];
  for (let retry = 0; retry < 3; retry++) {
    try {
      const data = await fetchOverpass(query);
      elements = data.elements || [];
      break;
    } catch (err) {
      if (err.message === 'RATE_LIMIT') { process.stdout.write(' [RL60s]'); await sleep(60000); retry--; continue; }
      if (retry < 2) await sleep((retry + 1) * 10000);
      else return 0;
    }
  }

  const records = [];
  const seen = new Set();

  for (const el of elements) {
    const tags = el.tags || {};
    if (!tags.name) continue;
    const categoryId = getCategory(tags, batch);
    if (!categoryId) continue;
    const lat = el.lat || el.center?.lat;
    const lon = el.lon || el.center?.lon;
    if (!lat || !lon) continue;

    const cityName = (tags['addr:city'] || tags['addr:town'] || tags['addr:village'] || city.name).substring(0, 100);
    const street = tags['addr:street'] || '';
    const houseNum = tags['addr:housenumber'] || '';
    const streetFull = street ? (houseNum ? `${street}, ${houseNum}` : street) : null;
    const key = `${tags.name}|${cityName}|${lat.toFixed(4)}|${lon.toFixed(4)}`;
    if (seen.has(key)) continue;
    seen.add(key);

    records.push({
      name: tags.name.substring(0, 200),
      category_id: categoryId,
      street: streetFull,
      city: cityName,
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

  if (!records.length) return 0;

  let inserted = 0;
  for (let i = 0; i < records.length; i += 200) {
    const { error } = await supabase.from('unclaimed_business_locations').insert(records.slice(i, i + 200));
    if (!error) inserted += Math.min(200, records.length - i);
  }
  totalImported += inserted;
  return inserted;
}

async function main() {
  console.log(`\n=== IMPORTAZIONE CATEGORIE MANCANTI ===`);
  console.log(`${CITIES.length} citta' x ${BATCHES.length} batch tematici\n`);
  await loadCategories();

  let batchTotal = 0;
  for (let b = 0; b < BATCHES.length; b++) {
    const batch = BATCHES[b];
    console.log(`\n--- Batch ${b+1}/${BATCHES.length}: ${batch.label} ---`);
    batchTotal = 0;

    for (let c = 0; c < CITIES.length; c++) {
      const city = CITIES[c];
      process.stdout.write(`  ${city.name}... `);
      const n = await importCityBatch(city, batch, b, c, CITIES.length);
      if (n > 0) process.stdout.write(`+${n} `);
      batchTotal += n;
      await sleep(3500);
    }

    const mins = ((Date.now() - startTime) / 60000).toFixed(1);
    console.log(`\n  Batch completato: +${batchTotal} | Totale sessione: ${totalImported.toLocaleString()} (${mins}min)`);
    await sleep(5000);
  }

  const { count } = await supabase.from('unclaimed_business_locations').select('*', { count: 'exact', head: true });
  console.log(`\n=== COMPLETATO === Sessione: ${totalImported.toLocaleString()} | DB: ${count?.toLocaleString()}`);
}

main().catch(console.error);
