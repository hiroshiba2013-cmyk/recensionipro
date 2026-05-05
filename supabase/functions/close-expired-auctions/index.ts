import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Find all active approved auctions whose end time has passed
    const { data: expiredAuctions, error: fetchError } = await supabase
      .from("auctions")
      .select("id, title, user_id, family_member_id, current_price, current_bidder_id")
      .eq("status", "active")
      .eq("approval_status", "approved")
      .lt("ends_at", new Date().toISOString());

    if (fetchError) throw fetchError;

    if (!expiredAuctions || expiredAuctions.length === 0) {
      return new Response(
        JSON.stringify({ message: "No expired auctions found", closed: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let closed = 0;

    for (const auction of expiredAuctions) {
      // Determine winner: the current highest bidder (if any)
      const { data: topBid } = await supabase
        .from("auction_bids")
        .select("user_id, family_member_id, bid_amount")
        .eq("auction_id", auction.id)
        .order("bid_amount", { ascending: false })
        .limit(1)
        .maybeSingle();

      const winnerId = topBid?.user_id ?? null;
      const winnerFamilyMemberId = topBid?.family_member_id ?? null;

      // Close the auction
      const { error: updateError } = await supabase
        .from("auctions")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
          winner_id: winnerId,
          winner_family_member_id: winnerFamilyMemberId,
        })
        .eq("id", auction.id);

      if (updateError) {
        console.error(`Failed to close auction ${auction.id}:`, updateError);
        continue;
      }

      // Notify the auction owner that it's concluded
      await supabase.from("notifications").insert({
        user_id: auction.user_id,
        family_member_id: auction.family_member_id,
        type: "auction_concluded",
        title: "Asta Conclusa",
        message: topBid
          ? `La tua asta "${auction.title}" è terminata. Prezzo finale: ${Number(topBid.bid_amount).toFixed(2)} EUR.`
          : `La tua asta "${auction.title}" è terminata senza offerte.`,
        data: {
          auction_id: auction.id,
          winner_id: winnerId,
          final_price: topBid?.bid_amount ?? null,
        },
      });

      // Notify the winner (if different from owner)
      if (winnerId && winnerId !== auction.user_id) {
        await supabase.from("notifications").insert({
          user_id: winnerId,
          family_member_id: winnerFamilyMemberId,
          type: "auction_won",
          title: "Hai Vinto l'Asta!",
          message: `Congratulazioni! Hai vinto l'asta "${auction.title}" con un'offerta di ${Number(topBid!.bid_amount).toFixed(2)} EUR.`,
          data: {
            auction_id: auction.id,
            final_price: topBid!.bid_amount,
          },
        });
      }

      closed++;
    }

    return new Response(
      JSON.stringify({ message: `Closed ${closed} expired auctions`, closed }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
