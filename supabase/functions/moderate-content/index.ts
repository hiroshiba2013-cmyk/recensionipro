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
}

interface ModerationResult {
  verdict: "approved" | "needs_review" | "rejected";
  confidence: number;
  reason: string;
  flags: string[];
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
    const { contentType, contentId, title, description, category, price } = body;

    const typeLabel = CONTENT_TYPE_LABELS[contentType] ?? contentType;
    const parts: string[] = [`Tipo di contenuto: ${typeLabel}`];
    if (category) parts.push(`Categoria: ${category}`);
    if (price !== undefined) parts.push(`Prezzo: €${price}`);
    if (title) parts.push(`Titolo: ${title}`);
    if (description) parts.push(`Descrizione: ${description}`);

    const contentText = parts.join("\n");
    const result = await callAnthropicAPI(contentText);

    // Log moderation decision to DB
    try {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      await supabase.from("content_moderation_logs").insert({
        content_type: contentType,
        content_id: contentId ?? null,
        verdict: result.verdict,
        confidence: result.confidence,
        reason: result.reason,
        flags: result.flags,
        content_snapshot: { title, description, category, price },
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
    // Safe fallback: send to manual review on any error
    return new Response(
      JSON.stringify({ verdict: "needs_review", confidence: 0.5, reason: "Errore interno", flags: [] }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
