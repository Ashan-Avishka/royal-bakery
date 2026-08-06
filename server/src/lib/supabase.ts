import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import ws from "ws";
import { env } from "../config/env.js";

let adminClient: SupabaseClient | null = null;

/**
 * Supabase admin client (service-role key). Server only — bypasses RLS.
 * Throws until SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are configured.
 *
 * Passes `ws` as the realtime transport so this works on Node 20
 * (supabase-js 2.110+ expects a native WebSocket on Node 22+).
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "Supabase is not configured: set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in server/.env"
    );
  }
  if (!adminClient) {
    adminClient = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
      realtime: { transport: ws as unknown as typeof WebSocket },
    });
  }
  return adminClient;
}
