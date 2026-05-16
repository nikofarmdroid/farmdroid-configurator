import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getDealerFromRequest } from "../../../auth/helpers";
import crypto from "crypto";

const USE_LOCAL = process.env.USE_LOCAL_BACKEND === "true";

/**
 * POST /api/dealer/quotes/[id]/send
 * Sets the quote status to "sent", generates a share token, and
 * returns the share URL. Optionally sends email to customer.
 */
export async function POST(
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

  // Get the quote
  const { data: quote, error: lookupError } = await (supabase
    .from("dealer_quotes") as any)
    .select("*")
    .eq("id", id)
    .eq("dealer_code", dealer.dealer_code)
    .single();

  if (lookupError || !quote) {
    return NextResponse.json({ error: "Quote not found" }, { status: 404 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const sendEmail = body.sendEmail === true;

    // Generate or reuse share token
    const shareToken = quote.share_token || crypto.randomUUID();
    const baseUrl =
      (process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000")
        .trim()
        .replace(/\/+$/, "");
    const locale = quote.locale || "en";
    const shareUrl = `${baseUrl}/${locale}/quote?id=${quote.reference}&t=${shareToken}`;

    // Update quote status
    const updates: Record<string, unknown> = {
      status: "sent",
      share_token: shareToken,
      updated_at: new Date().toISOString(),
    };

    // Set valid_until if not already set
    if (!quote.valid_until) {
      const validity = new Date();
      validity.setDate(validity.getDate() + 30); // 30 days default
      updates.valid_until = validity.toISOString();
    }

    const updateResult = await (supabase
      .from("dealer_quotes") as any)
      .update(updates)
      .eq("id", id)
      .eq("dealer_code", dealer.dealer_code);

    if (updateResult.error) {
      console.error("[dealer/quotes/send] Update error:", updateResult.error);
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
      console.error("[dealer/quotes/send] Fetch error:", fetchError);
      return NextResponse.json(
        { error: "Failed to update quote" },
        { status: 500 }
      );
    }

    // Send email if requested
    let emailResult: { success: boolean; error?: string } | null = null;
    if (sendEmail && quote.customer_email) {
      try {
        if (!USE_LOCAL) {
          // Production: use SendGrid
          const { sendQuoteEmail } = await import("@/lib/emails/quote-email");
          await sendQuoteEmail({
            toEmail: quote.customer_email,
            toName: quote.customer_name,
            dealerCompany: dealer.company_name,
            dealerName: dealer.name,
            quoteReference: quote.reference,
            shareUrl,
            validUntil: (updates.valid_until as string) || null,
            locale: locale,
          });
          emailResult = { success: true };
        } else {
          // Local dev: log it
          console.log("[dealer/quotes/send] Would send email to:", quote.customer_email);
          console.log("[dealer/quotes/send] Share URL:", shareUrl);
          emailResult = { success: true };
        }
      } catch (emailError) {
        console.error("[dealer/quotes/send] Email error:", emailError);
        emailResult = {
          success: false,
          error: emailError instanceof Error ? emailError.message : "Email failed",
        };
      }
    }

    return NextResponse.json({
      success: true,
      quote: updated,
      shareUrl,
      shareToken,
      emailResult,
    });
  } catch (error) {
    console.error("[dealer/quotes/send] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
