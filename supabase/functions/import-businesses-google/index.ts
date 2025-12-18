import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ImportRequest {
  city: string;
  province: string;
  apiKey: string;
  categories?: string[];
  radius?: number;
}

interface GooglePlace {
  place_id: string;
  name: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  types: string[];
  formatted_phone_number?: string;
  website?: string;
  opening_hours?: {
    weekday_text?: string[];
  };
  business_status?: string;
}

// Map Google Place types to our categories
const categoryMapping: Record<string, string> = {
  restaurant: "Ristoranti",
  cafe: "Bar e Caffetterie",
  bar: "Bar e Caffetterie",
  bakery: "Alimentari e Gastronomia",
  supermarket: "Alimentari e Gastronomia",
  pharmacy: "Farmacie e Salute",
  doctor: "Farmacie e Salute",
  dentist: "Farmacie e Salute",
  hospital: "Farmacie e Salute",
  hair_care: "Parrucchieri e Centri Estetici",
  beauty_salon: "Parrucchieri e Centri Estetici",
  spa: "Parrucchieri e Centri Estetici",
  lodging: "Hotel e Alloggi",
  car_repair: "Officine e Autofficine",
  gym: "Palestre e Fitness",
  bank: "Servizi Finanziari",
  lawyer: "Servizi Professionali",
  accounting: "Servizi Professionali",
  real_estate_agency: "Immobiliare",
  clothing_store: "Abbigliamento e Moda",
  shoe_store: "Abbigliamento e Moda",
  furniture_store: "Arredamento",
  electronics_store: "Elettronica",
  book_store: "Librerie ed Edicole",
  florist: "Fioristi",
  jewelry_store: "Gioiellerie",
  pet_store: "Animali",
  veterinary_care: "Animali",
};

function getCategoryFromGoogle(types: string[]): string | null {
  for (const type of types) {
    if (categoryMapping[type]) {
      return categoryMapping[type];
    }
  }
  return null;
}

function parseAddress(formattedAddress: string, city: string): { street: string; streetNumber: string; postalCode: string | null } {
  // Try to extract street, number, and postal code from formatted address
  const parts = formattedAddress.split(",");
  
  if (parts.length > 0) {
    const streetPart = parts[0].trim();
    const match = streetPart.match(/^(.+?)\s+(\d+[A-Za-z]?)$/);
    
    if (match) {
      return {
        street: match[1],
        streetNumber: match[2],
        postalCode: null, // Could be extracted from other parts if needed
      };
    }
    
    return {
      street: streetPart,
      streetNumber: "s.n.",
      postalCode: null,
    };
  }
  
  return {
    street: "Via non specificata",
    streetNumber: "s.n.",
    postalCode: null,
  };
}

function generateVAT(): string {
  const random = Math.floor(Math.random() * 100000000000);
  return random.toString().padStart(11, "0");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    const { city, province, apiKey, radius = 5000 }: ImportRequest = await req.json();

    if (!city || !province || !apiKey) {
      throw new Error("City, province, and API key are required");
    }

    // Get city coordinates using Google Geocoding API
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(city + ", Italy")}&key=${apiKey}`;
    const geocodeResponse = await fetch(geocodeUrl);
    const geocodeData = await geocodeResponse.json();

    if (!geocodeData.results || geocodeData.results.length === 0) {
      throw new Error(`City ${city} not found`);
    }

    const location = geocodeData.results[0].geometry.location;

    // Search for places using Google Places API Nearby Search
    const allPlaces: GooglePlace[] = [];
    const placeTypes = Object.keys(categoryMapping);

    // Make requests for different types (Google limits results per request)
    for (const type of placeTypes.slice(0, 10)) { // Limit to first 10 types to avoid too many requests
      const placesUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${location.lat},${location.lng}&radius=${radius}&type=${type}&key=${apiKey}`;
      const placesResponse = await fetch(placesUrl);
      const placesData = await placesResponse.json();

      if (placesData.results && placesData.results.length > 0) {
        allPlaces.push(...placesData.results);
      }

      // Respect rate limits
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Remove duplicates by place_id
    const uniquePlaces = Array.from(
      new Map(allPlaces.map(place => [place.place_id, place])).values()
    );

    // Get existing category IDs
    const { data: categoriesData } = await supabase
      .from("business_categories")
      .select("id, name");

    const categoryMap = new Map(
      categoriesData?.map(cat => [cat.name, cat.id]) || []
    );

    // Process and insert businesses
    const businesses = [];
    const locations = [];

    for (const place of uniquePlaces) {
      if (place.business_status !== "OPERATIONAL") continue;

      const category = getCategoryFromGoogle(place.types);
      if (!category) continue;

      const categoryId = categoryMap.get(category);
      if (!categoryId) continue;

      businesses.push({
        name: place.name,
        category_id: categoryId,
        is_claimed: false,
        vat_number: generateVAT(),
      });

      const addressParts = parseAddress(place.formatted_address, city);

      locations.push({
        city,
        province,
        postal_code: addressParts.postalCode,
        street_address: `${addressParts.street}, ${addressParts.streetNumber}`,
        street_number: addressParts.streetNumber,
        latitude: place.geometry.location.lat,
        longitude: place.geometry.location.lng,
        phone_number: place.formatted_phone_number || null,
        email: null,
        business_hours: place.opening_hours?.weekday_text?.join("; ") || null,
      });
    }

    if (businesses.length === 0) {
      return new Response(
        JSON.stringify({ message: "No businesses found", imported: 0 }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Insert businesses
    const { data: insertedBusinesses, error: businessError } = await supabase
      .from("businesses")
      .insert(businesses)
      .select("id");

    if (businessError) {
      throw businessError;
    }

    // Add business_id to locations
    const locationsWithBusinessId = locations.map((loc, index) => ({
      ...loc,
      business_id: insertedBusinesses![index].id,
    }));

    // Insert locations
    const { error: locationError } = await supabase
      .from("business_locations")
      .insert(locationsWithBusinessId);

    if (locationError) {
      throw locationError;
    }

    return new Response(
      JSON.stringify({
        message: "Businesses imported successfully from Google Places",
        imported: businesses.length,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});