import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const SYSTEM_PROMPT = `Sei un moderatore automatico per una piattaforma italiana di recensioni e annunci locali chiamata TrovaFacile.
Il tuo compito è analizzare i contenuti inviati dagli utenti e verificare che rispettino le linee guida della piattaforma.

LINEE GUIDA DA VERIFICARE:
1. Nessun linguaggio offensivo, insulti, discriminazioni, odio o molestie
2. Nessuno spam, testo senza senso, contenuto ripetitivo o artificialmente gonfiato
3. Nessun contenuto illegale: truffa, frode, materiale proibito, droghe, armi, contraffazione
4. Nessuna informazione personale sensibile esposta: numeri carta di credito, password, IBAN, coordinate bancarie
5. Nessuna pubblicità esterna non pertinente o link sospetti
6. Il contenuto deve essere pertinente alla categoria/tipo indicato
7. Nessun contenuto sessuale esplicito o violento
8. Prezzi e descrizioni plausibili, non palesemente ingannevoli
9. Le recensioni devono riferirsi a esperienze reali con l'attività
10. Gli annunci di lavoro devono descrivere posizioni reali e legali

RILEVAMENTO RECENSIONI FALSE (solo per contenuti di tipo "recensione"):
Valuta i segnali comportamentali insieme al testo per identificare recensioni potenzialmente false:
- Account molto nuovo (< 7 giorni) che lascia la prima recensione = alto rischio
- Account nuovo (< 30 giorni) senza prove allegate = rischio medio
- Voto estremo (1 o 5 stelle) da account nuovo senza dettagli specifici = sospetto
- Testo generico, vago, privo di dettagli sull'esperienza concreta = sospetto
- Più recensioni dello stesso utente per la stessa attività = possibile abuso
- Testo innaturalmente formale o eccessivamente entusiastico/negativo senza sostanza = sospetto
- Recensione positiva esagerata senza dettagli reali ("Perfetti in tutto!!!") = sospetta
- Recensione negativa senza alcun dettaglio su cosa è andato male = sospetta
IMPORTANTE: i segnali comportamentali da soli non bastano per "rejected". Usa "needs_review" se il testo è nella norma ma i segnali di contesto sono sospetti.

VERDETTI POSSIBILI:
- "approved": contenuto chiaramente conforme alle linee guida
- "needs_review": contenuto ambiguo, potenzialmente problematico o che richiede verifica umana
- "rejected": contenuto che viola chiaramente le linee guida

Rispondi ESCLUSIVAMENTE con un oggetto JSON valido, senza markdown, senza spiegazioni extra:
{
  "verdict": "approved" | "needs_review" | "rejected",
  "confidence": numero da 0.0 a 1.0,
  "reason": "spiegazione breve in italiano (max 150 caratteri), vuota se approved",
  "flags": ["lista", "di", "problemi", "specifici", "trovati"]
}`;

interface ModerationRequest {
  contentType: string;
  contentId?: string;
  title?: string;
  description?: string;
  category?: string;
  price?: number;
  location?: string;
  // Review anti-fake signals
  userId?: string;
  rating?: number;
  hasProofDocuments?: boolean;
  targetBusinessId?: string;
}

interface ModerationResult {
  verdict: "approved" | "needs_review" | "rejected";
  confidence: number;
  reason: string;
  flags: string[];
}

interface ReviewUserStats {
  accountAgeDays: number;
  totalReviews: number;
  reviewsForThisBusiness: number;
}

async function getReviewUserStats(
  supabaseAdmin: ReturnType<typeof createClient>,
  userId: string,
  targetBusinessId?: string
): Promise<ReviewUserStats> {
  try {
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id, created_at")
      .eq("user_id", userId)
      .maybeSingle();

    const accountAgeDays = profile?.created_at
      ? Math.floor((Date.now() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24))
      : 999;

    const profileId = profile?.id;

    const { count: totalReviews } = await supabaseAdmin
      .from("reviews")
      .select("id", { count: "exact", head: true })
      .eq("customer_id", profileId ?? userId);

    let reviewsForThisBusiness = 0;
    if (targetBusinessId && profileId) {
      const queries = await Promise.all([
        supabaseAdmin.from("reviews").select("id", { count: "exact", head: true })
          .eq("customer_id", profileId).eq("business_location_id", targetBusinessId),
        supabaseAdmin.from("reviews").select("id", { count: "exact", head: true })
          .eq("customer_id", profileId).eq("unclaimed_business_location_id", targetBusinessId),
        supabaseAdmin.from("reviews").select("id", { count: "exact", head: true })
          .eq("customer_id", profileId).eq("registered_business_location_id", targetBusinessId),
        supabaseAdmin.from("reviews").select("id", { count: "exact", head: true })
          .eq("customer_id", profileId).eq("registered_business_id", targetBusinessId),
      ]);
      reviewsForThisBusiness = queries.reduce((sum, q) => sum + (q.count ?? 0), 0);
    }

    return { accountAgeDays, totalReviews: totalReviews ?? 0, reviewsForThisBusiness };
  } catch {
    return { accountAgeDays: 999, totalReviews: 0, reviewsForThisBusiness: 0 };
  }
}

async function callAnthropicAPI(content: string): Promise<ModerationResult> {
  if (!ANTHROPIC_API_KEY) {
    return { verdict: "needs_review", confidence: 0.5, reason: "Moderazione AI non configurata", flags: [] };
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5",
      max_tokens: 256,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error("Anthropic API error:", err);
    return { verdict: "needs_review", confidence: 0.5, reason: "Errore analisi AI", flags: [] };
  }

  const data = await response.json();
  const text = data.content?.[0]?.text ?? "{}";

  try {
    const parsed = JSON.parse(text);
    return {
      verdict: parsed.verdict ?? "needs_review",
      confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0.5,
      reason: parsed.reason ?? "",
      flags: Array.isArray(parsed.flags) ? parsed.flags : [],
    };
  } catch {
    console.error("Failed to parse AI response:", text);
    return { verdict: "needs_review", confidence: 0.5, reason: "Risposta AI non valida", flags: [] };
  }
}

const CONTENT_TYPE_LABELS: Record<string, string> = {
  review: "recensione",
  classified_ad: "annuncio",
  auction: "asta",
  job_posting: "offerta di lavoro",
  job_seeker: "profilo cercalavoro",
  business: "attività commerciale",
  professional_profile: "profilo professionale",
  report: "segnalazione",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body: ModerationRequest = await req.json();
    const { contentType, contentId, title, description, category, price, userId, rating, hasProofDocuments, targetBusinessId } = body;

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const typeLabel = CONTENT_TYPE_LABELS[contentType] ?? contentType;
    const parts: string[] = [`Tipo di contenuto: ${typeLabel}`];
    if (category) parts.push(`Categoria: ${category}`);
    if (price !== undefined) parts.push(`Prezzo: €${price}`);
    if (title) parts.push(`Titolo: ${title}`);
    if (description) parts.push(`Descrizione: ${description}`);

    // For reviews, enrich with behavioral signals fetched from DB
    if (contentType === "review" && userId) {
      const stats = await getReviewUserStats(supabaseAdmin, userId, targetBusinessId);

      parts.push("\n--- SEGNALI COMPORTAMENTALI UTENTE ---");

      if (stats.accountAgeDays < 7) {
        parts.push(`Età account: ${stats.accountAgeDays} giorni (ACCOUNT MOLTO NUOVO - alto rischio)`);
      } else if (stats.accountAgeDays < 30) {
        parts.push(`Età account: ${stats.accountAgeDays} giorni (account recente)`);
      } else {
        parts.push(`Età account: ${stats.accountAgeDays} giorni (account consolidato)`);
      }

      if (stats.totalReviews === 0) {
        parts.push("Recensioni totali dell'utente: 0 (PRIMA RECENSIONE IN ASSOLUTO)");
      } else {
        parts.push(`Recensioni totali dell'utente: ${stats.totalReviews}`);
      }

      if (stats.reviewsForThisBusiness > 0) {
        parts.push(`Recensioni già scritte per questa stessa attività: ${stats.reviewsForThisBusiness} (ATTENZIONE: possibile duplicato)`);
      } else {
        parts.push("Recensioni già scritte per questa attività: 0 (prima recensione per questa attività)");
      }

      if (rating !== undefined) {
        const extremeNote = rating === 1 || rating === 5 ? " (voto estremo)" : "";
        parts.push(`Valutazione data: ${rating}/5 stelle${extremeNote}`);
      }

      parts.push(`Prove documentali allegate: ${hasProofDocuments ? "SÌ (aumenta credibilità)" : "NO"}`);
    }

    const contentText = parts.join("\n");
    const result = await callAnthropicAPI(contentText);

    // Log moderation decision to DB
    try {
      await supabaseAdmin.from("content_moderation_logs").insert({
        content_type: contentType,
        content_id: contentId ?? null,
        verdict: result.verdict,
        confidence: result.confidence,
        reason: result.reason,
        flags: result.flags,
        content_snapshot: { title, description, category, price, rating, hasProofDocuments },
      });
    } catch (logErr) {
      console.error("Failed to log moderation:", logErr);
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Moderation error:", err);
    return new Response(
      JSON.stringify({ verdict: "needs_review", confidence: 0.5, reason: "Errore interno", flags: [] }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
