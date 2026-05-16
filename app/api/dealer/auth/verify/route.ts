import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * POST /api/dealer/auth/verify
 * Verifies a session token and returns dealer info.
 */
export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();

    // Find the session
    const { data: session, error: sessionError } = await (supabase
      .from("dealer_sessions") as any)
      .select("id, dealer_id, token, expires_at")
      .eq("token", token)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    // Check expiration
    if (new Date(session.expires_at) < new Date()) {
      await (supabase.from("dealer_sessions") as any)
        .delete()
        .eq("id", session.id);
      return NextResponse.json({ error: "Session expired" }, { status: 401 });
    }

    // Get dealer info
    const { data: dealer, error: dealerError } = await (supabase
      .from("dealers") as any)
      .select("id, email, name, company_name, dealer_code, role, is_active")
      .eq("id", session.dealer_id)
      .single();

    if (dealerError || !dealer || !dealer.is_active) {
      return NextResponse.json({ error: "Dealer not found" }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      dealer: {
        id: dealer.id,
        email: dealer.email,
        name: dealer.name,
        companyName: dealer.company_name,
        dealerCode: dealer.dealer_code,
        role: dealer.role,
      },
    });
  } catch (error) {
    console.error("[dealer/auth/verify] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
