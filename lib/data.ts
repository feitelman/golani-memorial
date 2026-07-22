import { Battle, toMinutes } from "./types";
import { BATTLES as SEED } from "./seed-data";
import { supabase, supabaseEnabled } from "./supabase";

// Single source of truth for reading battles. If Supabase is configured
// it joins the relational tables back into the nested Battle shape the UI
// expects; otherwise it serves the bundled seed data.

/** Where the returned battles came from — so callers can warn instead of lying. */
export type BattlesSource = "db" | "seed" | "error";

export interface BattlesResult {
  battles: Battle[];
  source: BattlesSource;
  error?: string;
}

export async function fetchBattlesResult(): Promise<BattlesResult> {
  // Not configured at all → bundled demo content is the honest answer.
  if (!supabaseEnabled || !supabase) return { battles: SEED, source: "seed" };

  const { data, error } = await supabase
    .from("battles")
    .select(
      `id, slug, title, kind, date, time, lng, lat, location_name, unit, summary, description,
       media ( id, kind, url, thumb, caption ),
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
      media: row.media ?? [],
      timeline,
      fallen: (row.soldiers ?? []).map((s: any) => ({
        id: s.id,
        fullName: s.full_name,
        rank: s.rank,
        age: s.age,
        photo: s.photo,
        hometown: s.hometown,
        memorial: s.memorial,
        affiliation: s.affiliation,
      })),
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
