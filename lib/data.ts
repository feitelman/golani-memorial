import { Battle, toMinutes } from "./types";
import { compareFallen } from "./ranks";
import { freshClient, supabase, supabaseEnabled } from "./supabase";

// Single source of truth for reading battles: the Supabase database. It joins
// the relational tables back into the nested Battle shape the UI expects.
// Only when Supabase isn't configured at all (demo/offline) does it serve
// lib/snapshot.json — a generated copy of the database (`npm run snapshot`),
// loaded lazily so it never ships in the client bundle.

/** Where the returned battles came from — so callers can warn instead of lying. */
export type BattlesSource = "db" | "seed" | "error";

export interface BattlesResult {
  battles: Battle[];
  source: BattlesSource;
  error?: string;
}

/**
 * @param opts.fresh bypass the server data cache (the admin editor must see live data).
 */
export async function fetchBattlesResult(opts: { fresh?: boolean } = {}): Promise<BattlesResult> {
  // Not configured at all → bundled demo content is the honest answer.
  if (!supabaseEnabled || !supabase) {
    const snapshot = (await import("./snapshot.json")).default as unknown as Battle[];
    return {
      battles: snapshot.map((b) => ({ ...b, fallen: [...b.fallen].sort(compareFallen) })),
      source: "seed",
    };
  }

  const client = (opts.fresh && freshClient()) || supabase;
  const { data, error } = await client
    .from("battles")
    .select(
      `id, slug, title, kind, date, time, lng, lat, location_name, unit, summary, description,
       media ( * ),
       timeline_events ( id, time, end_time, title, detail, path ),
       soldiers ( id, full_name, rank, age, photo, hometown, memorial, affiliation )`,
    )
    .order("time", { ascending: true });

  if (error || !data) {
    // Configured but unreachable. Do NOT substitute the bundled seed here — the
    // user's real battles would appear to have been replaced/deleted. Report the
    // failure so callers can warn (and block editing) instead.
    console.error("Supabase fetchBattles failed:", error?.message);
    return { battles: [], source: "error", error: error?.message ?? "fetch failed" };
  }

  const battles = data.map((row: any): Battle => {
    const timeline = (row.timeline_events ?? [])
      .map((t: any) => ({
        id: t.id,
        time: t.time,
        endTime: t.end_time ?? undefined,
        title: t.title,
        detail: t.detail,
        path: t.path ?? undefined,
      }))
      .sort((a: any, b: any) => toMinutes(a.time) - toMinutes(b.time));
    return {
      id: row.id,
      slug: row.slug,
      title: row.title,
      kind: row.kind,
      date: row.date,
      time: row.time,
      coordinates: [Number(row.lng), Number(row.lat)],
      locationName: row.location_name,
      unit: row.unit,
      summary: row.summary,
      description: row.description,
      media: (row.media ?? []).map((m: any) => ({
        id: m.id,
        kind: m.kind,
        url: m.url,
        thumb: m.thumb ?? undefined,
        caption: m.caption ?? undefined,
        atTime: m.at_time ?? undefined, // absent until the column is added
      })),
      timeline,
      fallen: (row.soldiers ?? [])
        .map((s: any) => ({
          id: s.id,
          fullName: s.full_name,
          rank: s.rank,
          age: s.age,
          photo: s.photo,
          hometown: s.hometown,
          memorial: s.memorial,
          affiliation: s.affiliation,
        }))
        .sort(compareFallen), // senior rank first — the DB has no row order
      startMinute: toMinutes(row.time),
      endMinute: toMinutes(timeline[timeline.length - 1]?.time ?? row.time),
    };
  });

  return { battles, source: "db" };
}

/** Convenience wrapper for callers that only need the list. */
export async function fetchBattles(): Promise<Battle[]> {
  return (await fetchBattlesResult()).battles;
}
