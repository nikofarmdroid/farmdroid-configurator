import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const USE_LOCAL = process.env.USE_LOCAL_BACKEND === "true";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);

  // Get redirect destination
  const cookieStore = await cookies();
  const redirectCookie = cookieStore.get("admin_redirect")?.value;
  const redirect = redirectCookie
    ? decodeURIComponent(redirectCookie)
    : searchParams.get("redirect") || "/admin";

  // ---- LOCAL DEV MODE ----
  if (USE_LOCAL) {
    const response = NextResponse.redirect(`${origin}${redirect}`);
    response.cookies.set("admin_redirect", "", { path: "/", maxAge: 0 });
    return response;
  }

  // ---- REAL SUPABASE ----
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");

  const { createServerClient } = require("@supabase/ssr");

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: any) {
          try {
            cookiesToSet.forEach(({ name, value, options }: any) =>
              cookieStore.set(name, value, options)
            );
          } catch { /* Server Component */ }
        },
      },
    }
  );

  // Handle magic link (OTP) verification
  if (token_hash && type === "magiclink") {
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash,
      type: "magiclink",
    });

    if (error || !data.user) {
      console.error("Magic link verification error:", error);
      return NextResponse.redirect(`${origin}/admin/login?error=auth_failed`);
    }

    const { data: adminUser, error: adminError } = await supabase
      .from("admin_users")
      .select("id, role")
      .eq("email", data.user.email!)
      .single();

    if (adminError || !adminUser) {
      await supabase.auth.signOut();
      return NextResponse.redirect(`${origin}/admin/login?error=unauthorized`);
    }

    await supabase
      .from("admin_users")
      .update({ last_login_at: new Date().toISOString() })
      .eq("id", adminUser.id);

    const response = NextResponse.redirect(`${origin}${redirect}`);
    response.cookies.set("admin_redirect", "", { path: "/", maxAge: 0 });
    return response;
  }

  // Handle OAuth code exchange
  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error || !data.user) {
      console.error("Auth callback error:", error);
      return NextResponse.redirect(`${origin}/admin/login?error=auth_failed`);
    }

    const { data: adminUser, error: adminError } = await supabase
      .from("admin_users")
      .select("id, role")
      .eq("email", data.user.email!)
      .single();

    if (adminError || !adminUser) {
      await supabase.auth.signOut();
      return NextResponse.redirect(`${origin}/admin/login?error=unauthorized`);
    }

    await supabase
      .from("admin_users")
      .update({ last_login_at: new Date().toISOString() })
      .eq("id", adminUser.id);

    const response = NextResponse.redirect(`${origin}${redirect}`);
    response.cookies.set("admin_redirect", "", { path: "/", maxAge: 0 });
    return response;
  }

  return NextResponse.redirect(`${origin}/admin/login?error=no_code`);
}
