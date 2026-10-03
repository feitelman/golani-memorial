import { createClient, SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** True when real Supabase credentials are present. */
export const supabaseEnabled = Boolean(url && anon);

/** Cache tag for battle data on the server; admin saves revalidate it. */
export const BATTLES_TAG = "battles";
/** Seconds a server-rendered page may serve cached battle data. */
export const BATTLES_REVALIDATE = 300;

/** Fetch that never caches — used in the browser and wherever freshness is required. */
const noStoreFetch = (input: RequestInfo | URL, init?: RequestInit) =>
  fetch(input, { ...init, cache: "no-store" });

/**
 * Shared anon client.
 * - In the browser: every read bypasses the HTTP cache (Supabase sends no
 *   cache-control, so browsers would otherwise cache heuristically).
 * - On the server: reads go through Next's data cache for up to
 *   BATTLES_REVALIDATE seconds, tagged BATTLES_TAG — so page views don't each
 *   hit the database; an admin save calls revalidateTag() for instant refresh.
 * Null when not configured (the app then serves lib/snapshot.json).
 */
export const supabase: SupabaseClient | null = supabaseEnabled
  ? createClient(url!, anon!, {
      global: {
        fetch: (input: RequestInfo | URL, init?: RequestInit) =>
          typeof window === "undefined"
            ? fetch(input, { ...init, next: { revalidate: BATTLES_REVALIDATE, tags: [BATTLES_TAG] } })
            : noStoreFetch(input, init),
      },
    })
  : null;

/** Server-side anon client that always reads live data (admin dashboard). */
export function freshClient(): SupabaseClient | null {
  if (!supabaseEnabled) return null;
  return createClient(url!, anon!, {
    global: { fetch: noStoreFetch },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Server-side admin client — uses the service role key. Never import in client code. */
export function getAdminClient(): SupabaseClient | null {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
