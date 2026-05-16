/**
 * Supabase client for server-side use (API routes, server components).
 * Uses the service role key in production, or local JSON backend in dev.
 */
import { createLocalClient, seedDevData, seedDealerData } from "../local-backend";

const USE_LOCAL = process.env.USE_LOCAL_BACKEND === "true";

let _localClient: ReturnType<typeof createLocalClient> | null = null;

function getLocalClient() {
  if (!_localClient) {
    seedDevData();
    seedDealerData();
    _localClient = createLocalClient();
  }
  return _localClient;
}

export function createServerSupabaseClient() {
  if (USE_LOCAL) {
    return getLocalClient() as any;
  }

  // Real Supabase — dynamic import so local mode doesn't need the module
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { createClient } = require("@supabase/supabase-js");
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
