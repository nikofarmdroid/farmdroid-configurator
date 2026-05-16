import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getDealerFromRequest } from "../auth/helpers";
import crypto from "crypto";

/**
 * GET /api/dealer/quotes
 * List quotes for the authenticated dealer's company.
 * Query params: ?status=draft|sent|viewed|accepted|declined|expired
 */
export async function GET(request: NextRequest) {
  const auth = await getDealerFromRequest(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { dealer } = auth;
  const supabase = createServerSupabaseClient();
  const url = new URL(request.url);
  const statusFilter = url.searchParams.get("status");

  // Build query: all quotes with the same dealer_code
  let query = (supabase.from("dealer_quotes") as any)
    .select("*")
    .eq("dealer_code", dealer.dealer_code)
    .order("created_at", { ascending: false });

  if (statusFilter && statusFilter !== "all") {
    query = query.eq("status", statusFilter);
  }

  const { data: quotes, error } = await query;

  if (error) {
    console.error("[dealer/quotes] List error:", error);
    return NextResponse.json(
      { error: "Failed to fetch quotes" },
      { status: 500 }
    );
  }

  return NextResponse.json({ quotes: quotes || [] });
}

/**
 * POST /api/dealer/quotes
 * Create a new dealer quote.
 */
export async function POST(request: NextRequest) {
  const auth = await getDealerFromRequest(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { dealer } = auth;
  const supabase = createServerSupabaseClient();

  try {
    const body = await request.json();
    const {
      customerName,
      customerEmail,
      customerPhone,
      customerCompany,
      customerCountry,
      customerNotes,
      config,
      customizations,
      locale,
      totalPrice,
      currency,
    } = body;

    if (!customerName || !config || totalPrice === undefined || !currency) {
      return NextResponse.json(
        { error: "Missing required fields: customerName, config, totalPrice, currency" },
        { status: 400 }
      );
    }

    // Generate reference
    const ref = `FD-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const quoteData = {
      id: crypto.randomUUID(),
      dealer_id: dealer.id,
      dealer_code: dealer.dealer_code,
      dealer_name: dealer.name,
      dealer_company: dealer.company_name,
      reference: ref,
      customer_name: customerName,
      customer_email: customerEmail || null,
      customer_phone: customerPhone || null,
      customer_company: customerCompany || null,
      customer_country: customerCountry || null,
      customer_notes: customerNotes || null,
      config: config,
      customizations: customizations || {},
      status: "draft",
      share_token: null,
      valid_until: customizations?.validUntil || null,
      locale: locale || "en",
      total_price: totalPrice,
      currency: currency,
      view_count: 0,
      last_viewed_at: null,
      hubspot_deal_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const insertResult = await (supabase
      .from("dealer_quotes") as any)
      .insert(quoteData);

    if (insertResult.error || !insertResult.data || insertResult.data.length === 0) {
      console.error("[dealer/quotes] Create error:", insertResult.error);
      return NextResponse.json(
        { error: "Failed to create quote" },
        { status: 500 }
      );
    }

    const created = insertResult.data[0];

    return NextResponse.json({ quote: created }, { status: 201 });
  } catch (error) {
    console.error("[dealer/quotes] Parse error:", error);
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}
