import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * GET /api/quotes/[token]
 * Public endpoint to fetch a quote by share token.
 * No authentication required. Increments view count.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const supabase = createServerSupabaseClient();

  const { data: quote, error } = await (supabase
    .from("dealer_quotes") as any)
    .select(
      "id, reference, customer_name, customer_company, customer_country, config, customizations, status, valid_until, locale, total_price, currency, dealer_company, dealer_name, view_count, created_at"
    )
    .eq("share_token", token)
    .single();

  if (error || !quote) {
    return NextResponse.json({ error: "Quote not found" }, { status: 404 });
  }

  // Check if expired
  if (quote.valid_until && new Date(quote.valid_until) < new Date()) {
    return NextResponse.json(
      {
        error: "This quote has expired",
        quote: { ...quote, status: "expired" },
      },
      { status: 410 }
    );
  }

  // Increment view count (fire-and-forget)
  void (async () => {
    try {
      await (supabase.from("dealer_quotes") as any)
        .update({
          view_count: (quote.view_count || 0) + 1,
          last_viewed_at: new Date().toISOString(),
          status: quote.status === "sent" ? "viewed" : quote.status,
        })
        .eq("id", quote.id);
    } catch (e) {
      console.error("[quotes/token] View increment error:", e);
    }
  })();

  return NextResponse.json({ quote });
}
