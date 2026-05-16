import { NextResponse, type NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

// Create the internationalization middleware
const intlMiddleware = createIntlMiddleware(routing);

const USE_LOCAL = process.env.USE_LOCAL_BACKEND === "true";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Handle dealer routes
  if (pathname.startsWith("/dealer")) {
    // In local dev mode, skip all auth checks
    if (USE_LOCAL) {
      return NextResponse.next();
    }

    // Allow access to login page and auth endpoints without authentication
    if (
      pathname === "/dealer/login" ||
      pathname.startsWith("/api/dealer/auth")
    ) {
      return NextResponse.next();
    }

    // Real dealer auth check (future: validate dealer session cookie)
    const dealerToken = request.cookies.get("dealer_token")?.value;
    if (!dealerToken) {
      const loginUrl = new URL("/dealer/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Validate token against database (simplified for now — full impl in Phase 5)
    return NextResponse.next();
  }

  // Handle admin routes
  if (pathname.startsWith("/admin")) {
    // In local dev mode, skip all auth checks
    if (USE_LOCAL) {
      return NextResponse.next();
    }

    // Allow access to login page and auth callback without authentication
    if (pathname === "/admin/login" || pathname.startsWith("/admin/auth")) {
      return NextResponse.next();
    }

    // Real Supabase auth check
    const { createServerClient } = require("@supabase/ssr");
    let response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    });

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet: any) {
            cookiesToSet.forEach(({ name, value }: any) =>
              request.cookies.set(name, value)
            );
            response = NextResponse.next({ request });
            cookiesToSet.forEach(({ name, value, options }: any) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    const { data: adminUser, error: adminError } = await supabase
      .from("admin_users")
      .select("id, role")
      .eq("email", user.email!)
      .single();

    if (adminError || !adminUser) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("error", "unauthorized");
      return NextResponse.redirect(loginUrl);
    }

    return response;
  }

  // For API routes and static assets, skip i18n
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon") ||
    pathname === "/admin/login" ||
    pathname.startsWith("/admin/auth")
  ) {
    return NextResponse.next();
  }

  // For all other routes, use the internationalization middleware
  return intlMiddleware(request);
}

export const config = {
  matcher: [
    "/",
    "/(da|de|en|fr|nl)/:path*",
    "/admin/:path*",
    "/dealer/:path*",
    "/api/dealer/:path*",
  ],
};
