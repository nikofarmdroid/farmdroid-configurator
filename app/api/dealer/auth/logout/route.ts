import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * POST /api/dealer/auth/logout
 * Clears the dealer session.
 */
export async function POST(request: NextRequest) {
  try {
    const cookieToken = request.cookies.get("dealer_token")?.value;

    if (cookieToken) {
      const supabase = createServerSupabaseClient();
      await (supabase.from("dealer_sessions") as any)
        .delete()
        .eq("token", cookieToken);
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set("dealer_token", "", {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    return response;
  } catch (error) {
    console.error("[dealer/auth/logout] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
