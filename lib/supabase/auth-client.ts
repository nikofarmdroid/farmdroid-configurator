/**
 * Supabase auth client for browser-side use.
 * Uses real Supabase in production, or mock auth in local dev.
 */
import type { Database } from "@/lib/database-types";

const USE_LOCAL = process.env.USE_LOCAL_BACKEND === "true";

const DEV_USER = {
  id: "00000000-0000-0000-0000-000000000001",
  email: "dev@farmdroid.local",
  user_metadata: { name: "Dev User" },
  app_metadata: {},
  aud: "authenticated",
  created_at: new Date().toISOString(),
};

export function createClient() {
  if (USE_LOCAL) {
    return {
      auth: {
        async getUser() {
          return { data: { user: DEV_USER }, error: null };
        },
        async signInWithOtp(_: { email: string }) {
          return { data: {}, error: null };
        },
        async signOut() {
          return { error: null };
        },
        async exchangeCodeForSession(_: string) {
          return { data: { user: DEV_USER, session: {} }, error: null };
        },
        async verifyOtp(_: { email: string; token: string; type: string }) {
          return { data: { user: DEV_USER, session: {} }, error: null };
        },
      },
    } as any;
  }

  // Real Supabase
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { createBrowserClient } = require("@supabase/ssr");
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
