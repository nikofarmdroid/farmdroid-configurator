import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

// Create the internationalization middleware
const intlMiddleware = createIntlMiddleware(routing);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Handle dealer portal routes. API routes validate sessions server-side.
  if (pathname.startsWith("/dealer")) {
    if (pathname === "/dealer/login" || pathname === "/dealer/register") {
      return NextResponse.next();
    }

    const hasDealerSession = request.cookies.has("farmdroid_dealer_session");
    if (!hasDealerSession) {
      const loginUrl = new URL("/dealer/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  }

  // Handle admin routes
  if (pathname.startsWith("/admin")) {
    // Allow access to login page and auth callback without authentication
    if (pathname === "/admin/login" || pathname.startsWith("/admin/auth")) {
      return NextResponse.next();
    }

    // Skip auth in local backend mode
    if (process.env.USE_LOCAL_BACKEND === "true") {
      return NextResponse.next();
    }

    // Create Supabase client with cookie handling
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
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
            response = NextResponse.next({
              request,
            });
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    // Check if user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Check if user is an admin
    const { data: adminUser, error: adminError } = await supabase
      .from("admin_users")
      .select("id, role")
      .eq("email", user.email!)
      .single();

    if (adminError || !adminUser) {
      // User is authenticated but not an admin - redirect to login with error
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("error", "unauthorized");
      return NextResponse.redirect(loginUrl);
    }

    // User is authenticated and is an admin - allow access
    return response;
  }

  // For all other routes, use the internationalization middleware
  return intlMiddleware(request);
}

export const config = {
  // Match admin routes and locale routes
  matcher: ["/", "/(da|de|en|fr|nl)/:path*", "/admin/:path*", "/dealer/:path*"],
};
