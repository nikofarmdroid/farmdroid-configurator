import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * GET /api/dealer/auth/me
 * Returns the current dealer session info based on the session cookie.
 */
export async function GET(request: NextRequest) {
  try {
    const cookieToken = request.cookies.get("dealer_token")?.value;

    if (!cookieToken) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const supabase = createServerSupabaseClient();

    // Find session
    const { data: session, error: sessionError } = await (supabase
      .from("dealer_sessions") as any)
      .select("id, dealer_id, expires_at")
      .eq("token", cookieToken)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: "Invalid session" },
        { status: 401 }
      );
    }

    if (new Date(session.expires_at) < new Date()) {
      await (supabase.from("dealer_sessions") as any)
        .delete()
        .eq("id", session.id);
      return NextResponse.json(
        { error: "Session expired" },
        { status: 401 }
      );
    }

    // Get dealer
    const { data: dealer, error: dealerError } = await (supabase
      .from("dealers") as any)
      .select("id, email, name, company_name, dealer_code, role, is_active")
      .eq("id", session.dealer_id)
      .single();

    if (dealerError || !dealer || !dealer.is_active) {
      return NextResponse.json({ error: "Dealer not found" }, { status: 401 });
    }

    return NextResponse.json({
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
    console.error("[dealer/auth/me] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
