import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * Get the authenticated dealer from the request cookie.
 * Returns { dealer } or { error, status } for error responses.
 */
export async function getDealerFromRequest(request: NextRequest) {
  const cookieToken = request.cookies.get("dealer_token")?.value;
  if (!cookieToken) {
    return { error: "Not authenticated", status: 401 };
  }

  const supabase = createServerSupabaseClient();

  const { data: session, error: sessionError } = await (supabase
    .from("dealer_sessions") as any)
    .select("id, dealer_id, expires_at")
    .eq("token", cookieToken)
    .single();

  if (sessionError || !session) {
    return { error: "Invalid session", status: 401 };
  }

  if (new Date(session.expires_at) < new Date()) {
    await (supabase.from("dealer_sessions") as any)
      .delete()
      .eq("id", session.id);
    return { error: "Session expired", status: 401 };
  }

  const { data: dealer, error: dealerError } = await (supabase
    .from("dealers") as any)
    .select("id, email, name, company_name, dealer_code, role, is_active")
    .eq("id", session.dealer_id)
    .single();

  if (dealerError || !dealer || !dealer.is_active) {
    return { error: "Dealer not found", status: 401 };
  }

  return { dealer };
}
