/**
 * Supabase auth client for Server Components and API Routes.
 * Uses real Supabase in production, or mock auth in local dev.
 */
import { seedDevData } from "../local-backend";
import type { AdminUserRow } from "../admin/types";
import type { User } from "@supabase/supabase-js";

const USE_LOCAL = process.env.USE_LOCAL_BACKEND === "true";

const DEV_USER: User = {
  id: "00000000-0000-0000-0000-000000000001",
  email: "dev@farmdroid.local",
  user_metadata: { name: "Dev User" },
  app_metadata: {},
  aud: "authenticated",
  created_at: new Date().toISOString(),
} as User;

const DEV_ADMIN: AdminUserRow = {
  id: "00000000-0000-0000-0000-000000000001",
  email: "dev@farmdroid.local",
  name: "Dev Admin",
  role: "super_admin",
  avatar_url: null,
  notify_on_new_config: true,
  last_login_at: new Date().toISOString(),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export async function createClient() {
  if (USE_LOCAL) {
    seedDevData();
    return {
      auth: {
        async getUser() {
          return { data: { user: DEV_USER }, error: null };
        },
        async signOut() {
          return { error: null };
        },
        async signInWithOtp(_: { email: string }) {
          return { data: {}, error: null };
        },
        async exchangeCodeForSession(_: string) {
          return { data: { user: DEV_USER, session: {} }, error: null };
        },
        async verifyOtp(_: { email: string; token: string; type: string }) {
          return { data: { user: DEV_USER, session: {} }, error: null };
        },
      },
      from(table: string) {
        // Minimal query builder for auth-server usage (admin check, etc.)
        const { createLocalClient } = require("../local-backend");
        return createLocalClient().from(table);
      },
    } as any;
  }

  // Real Supabase
  const { createServerClient } = require("@supabase/ssr");
  const { cookies } = require("next/headers");
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: any[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }: any) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // ignore — Server Component
          }
        },
      },
    }
  );
}

interface AdminUserResult {
  auth: User;
  admin: AdminUserRow;
}

export async function getAdminUser(): Promise<AdminUserResult | null> {
  if (USE_LOCAL) {
    seedDevData();
    return { auth: DEV_USER, admin: DEV_ADMIN };
  }

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return null;

  const { data: adminUser, error: adminError } = await supabase
    .from("admin_users")
    .select("*")
    .eq("email", user.email!)
    .single();

  if (adminError || !adminUser) return null;
  return { auth: user, admin: adminUser as AdminUserRow };
}
