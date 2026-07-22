import { createClient, SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** True when real Supabase credentials are present. */
export const supabaseEnabled = Boolean(url && anon);

/**
 * Browser client (anon key). Returns null when not configured so the
 * app can transparently fall back to bundled seed data.
 */
export const supabase: SupabaseClient | null = supabaseEnabled
  ? createClient(url!, anon!, {
      // Force every REST read to bypass the HTTP cache. Supabase's REST
      // responses carry no cache-control header, so browsers heuristically
      // cache them (and Next.js caches server-side fetches) — which made the
      // map show stale data until a restart. no-store keeps reads live.
      global: {
        fetch: (input: RequestInfo | URL, init?: RequestInit) =>
          fetch(input, { ...init, cache: "no-store" }),
      },
    })
  : null;

/** Server-side admin client — uses the service role key. Never import in client code. */
export function getAdminClient(): SupabaseClient | null {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
