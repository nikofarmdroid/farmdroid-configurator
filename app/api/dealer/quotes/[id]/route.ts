import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getDealerFromRequest } from "../../auth/helpers";

/**
 * GET /api/dealer/quotes/[id]
 * Get a single quote (must belong to dealer's company).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getDealerFromRequest(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { dealer } = auth;
  const { id } = await params;
  const supabase = createServerSupabaseClient();

  const { data: quote, error } = await (supabase
    .from("dealer_quotes") as any)
    .select("*")
    .eq("id", id)
    .eq("dealer_code", dealer.dealer_code)
    .single();

  if (error || !quote) {
    return NextResponse.json({ error: "Quote not found" }, { status: 404 });
  }

  return NextResponse.json({ quote });
}

/**
 * PATCH /api/dealer/quotes/[id]
 * Update a quote (edit allowed regardless of status — creates new version implicitly).
 * Only draft/sent quotes can be fully edited. Viewed/accepted quotes get a revision note.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getDealerFromRequest(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { dealer } = auth;
  const { id } = await params;
  const supabase = createServerSupabaseClient();

  // Verify ownership
  const { data: existing, error: lookupError } = await (supabase
    .from("dealer_quotes") as any)
    .select("id, dealer_code, status")
    .eq("id", id)
    .eq("dealer_code", dealer.dealer_code)
    .single();

  if (lookupError || !existing) {
    return NextResponse.json({ error: "Quote not found" }, { status: 404 });
  }

  try {
    const body = await request.json();

    // If quote was already sent/viewed/accepted and we're changing config or price,
    // keep status but note it was revised
    const wasSent = ["sent", "viewed", "accepted"].includes(existing.status);

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    // Allow partial updates
    const updateableFields = [
      "customer_name",
      "customer_email",
      "customer_phone",
      "customer_company",
      "customer_country",
      "customer_notes",
      "config",
      "customizations",
      "total_price",
      "currency",
      "locale",
      "valid_until",
    ];

    for (const field of updateableFields) {
      if (field in body) {
        updates[field] = body[field];
      }
    }

    // If quote was sent and content changed, add revision flag
    if (wasSent && (body.config || body.customizations || body.total_price)) {
      updates["revised_at"] = new Date().toISOString();
    }

    const updateResult = await (supabase
      .from("dealer_quotes") as any)
      .update(updates)
      .eq("id", id)
      .eq("dealer_code", dealer.dealer_code);

    if (updateResult.error) {
      console.error("[dealer/quotes] Update error:", updateResult.error);
      return NextResponse.json(
        { error: "Failed to update quote" },
        { status: 500 }
      );
    }

    // Fetch the updated quote
    const { data: updated, error: fetchError } = await (supabase
      .from("dealer_quotes") as any)
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !updated) {
      console.error("[dealer/quotes] Fetch after update error:", fetchError);
      return NextResponse.json(
        { error: "Failed to update quote" },
        { status: 500 }
      );
    }

    return NextResponse.json({ quote: updated });
  } catch (error) {
    console.error("[dealer/quotes] Parse error:", error);
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}

/**
 * DELETE /api/dealer/quotes/[id]
 * Delete a draft quote. Sent quotes cannot be deleted (only archived).
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getDealerFromRequest(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { dealer } = auth;
  const { id } = await params;
  const supabase = createServerSupabaseClient();

  const { data: existing, error: lookupError } = await (supabase
    .from("dealer_quotes") as any)
    .select("id, dealer_code, status")
    .eq("id", id)
    .eq("dealer_code", dealer.dealer_code)
    .single();

  if (lookupError || !existing) {
    return NextResponse.json({ error: "Quote not found" }, { status: 404 });
  }

  if (existing.status !== "draft") {
    return NextResponse.json(
      { error: "Only draft quotes can be deleted. Sent quotes can be archived." },
      { status: 400 }
    );
  }

  const { error } = await (supabase.from("dealer_quotes") as any)
    .delete()
    .eq("id", id)
    .eq("dealer_code", dealer.dealer_code);

  if (error) {
    console.error("[dealer/quotes] Delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete quote" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
