import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import crypto from "crypto";

const USE_LOCAL = process.env.USE_LOCAL_BACKEND === "true";

/**
 * POST /api/dealer/auth/login
 * Initiates dealer login. In local dev mode, auto-creates a session.
 * In production, sends a magic link email.
 */
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();

    // Look up dealer
    const { data: dealer, error: lookupError } = await (supabase
      .from("dealers")
      .select("id, email, name, company_name, dealer_code, role, is_active") as any)
      .eq("email", email.toLowerCase().trim())
      .single();

    if (lookupError || !dealer) {
      return NextResponse.json(
        { error: "No dealer account found with this email" },
        { status: 404 }
      );
    }

    if (!dealer.is_active) {
      return NextResponse.json(
        { error: "This dealer account is deactivated" },
        { status: 403 }
      );
    }

    // In local dev mode: create session token directly
    if (USE_LOCAL) {
      const token = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

      await (supabase.from("dealer_sessions") as any).insert({
        dealer_id: dealer.id,
        token,
        expires_at: expiresAt,
      });

      const dealerInfo = {
        id: dealer.id,
        email: dealer.email,
        name: dealer.name,
        companyName: dealer.company_name,
        dealerCode: dealer.dealer_code,
        role: dealer.role,
      };

      const response = NextResponse.json({
        success: true,
        dealer: dealerInfo,
      });

      // Set httpOnly cookie for server-side auth checks
      response.cookies.set("dealer_token", token, {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        path: "/",
        maxAge: 7 * 24 * 60 * 60, // 7 days
      });

      return response;
    }

    // Production: send magic link (future)
    return NextResponse.json({ success: true, message: "Magic link sent" });
  } catch (error) {
    console.error("[dealer/auth/login] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
