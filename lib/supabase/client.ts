/**
 * Supabase client for browser/client-side use.
 * Uses Supabase in production, or local JSON backend in dev.
 */
import { createLocalClient, seedDevData } from "../local-backend";

const USE_LOCAL = process.env.USE_LOCAL_BACKEND === "true";

let _localClient: ReturnType<typeof createLocalClient> | null = null;

function getLocalClient() {
  if (!_localClient) {
    seedDevData();
    _localClient = createLocalClient();
  }
  return _localClient;
}

export const supabase = USE_LOCAL
  ? (getLocalClient() as any)
  : (() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { createClient } = require("@supabase/supabase-js");
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
      return createClient(supabaseUrl, supabaseAnonKey);
    })();
