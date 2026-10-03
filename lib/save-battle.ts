import type { SupabaseClient } from "@supabase/supabase-js";
import type { ValidBattle } from "./battle-schema";

// Writes one battle and its children without ever risking data loss.
//
// The old approach deleted every timeline/soldier/media row first and then
// re-inserted — so a failed insert silently wiped a battle's fallen. Now:
//   1. refuse ids that already belong to a *different* battle;
//   2. upsert the battle row;
//   3. upsert every child row (each table is one atomic bulk request);
//   4. only then delete this battle's children that are no longer listed.
// If any step fails we stop and report it; nothing was deleted, and re-saving
// completes the update.

export type SaveResult = { ok: true; slug: string } | { ok: false; error: string };

const CHILD_TABLES = ["timeline_events", "soldiers", "media"] as const;
type ChildTable = (typeof CHILD_TABLES)[number];

export async function saveBattle(db: SupabaseClient, b: ValidBattle): Promise<SaveResult> {
  const rows: Record<ChildTable, Record<string, unknown>[]> = {
    timeline_events: b.timeline.map((t) => ({
      id: t.id,
      battle_id: b.id,
      time: t.time,
      end_time: t.endTime ?? null,
      title: t.title,
      detail: t.detail ?? null,
      path: t.path ?? null,
    })),
    soldiers: b.fallen.map((s) => ({
      id: s.id,
      battle_id: b.id,
      full_name: s.fullName,
      rank: s.rank,
      age: s.age,
      photo: s.photo ?? null,
      hometown: s.hometown ?? null,
      memorial: s.memorial,
      affiliation: s.affiliation ?? null,
    })),
    media: b.media.map((m) => ({
      id: m.id,
      battle_id: b.id,
      kind: m.kind,
      url: m.url,
      thumb: m.thumb ?? null,
      caption: m.caption ?? null,
    })),
  };

  // 1. An id that exists under another battle would be *moved* by the upsert.
  for (const table of CHILD_TABLES) {
    const ids = rows[table].map((r) => r.id as string);
    if (!ids.length) continue;
    const { data, error } = await db.from(table).select("id, battle_id").in("id", ids).neq("battle_id", b.id);
    if (error) return { ok: false, error: `בדיקת מזהים נכשלה (${table}): ${error.message}` };
    if (data?.length) {
      return {
        ok: false,
        error: `המזהים ${data.map((r) => r.id).join(", ")} כבר שייכים לקרב אחר (${table}). שנו את המזהה ונסו שוב.`,
      };
    }
  }

  // 2. Battle row. `slug` is UNIQUE — on a clash, retry once with a suffix.
  const battleRow = (slug: string) => ({
    id: b.id,
    slug,
    title: b.title,
    kind: b.kind,
    date: b.date,
    time: b.time,
    lng: b.coordinates[0],
    lat: b.coordinates[1],
    location_name: b.locationName,
    unit: b.unit,
    summary: b.summary ?? null,
    description: b.description ?? null,
    updated_at: new Date().toISOString(),
  });
  let slug = b.slug || b.id;
  let { error: bErr } = await db.from("battles").upsert(battleRow(slug));
  if (bErr && (bErr as { code?: string }).code === "23505") {
    slug = `${slug}-${b.id.slice(0, 5)}`;
    ({ error: bErr } = await db.from("battles").upsert(battleRow(slug)));
  }
  if (bErr) return { ok: false, error: `שמירת הקרב נכשלה: ${bErr.message}` };

  // 3. Upsert children. Nothing has been deleted yet.
  for (const table of CHILD_TABLES) {
    if (!rows[table].length) continue;
    const { error } = await db.from(table).upsert(rows[table]);
    if (error) {
      return { ok: false, error: `שמירה נכשלה (${table}): ${error.message}\nשום נתון לא נמחק — אפשר לנסות שוב.` };
    }
  }

  // 4. Prune children that were removed in the editor.
  for (const table of CHILD_TABLES) {
    const keep = rows[table].map((r) => r.id as string);
    let q = db.from(table).delete().eq("battle_id", b.id);
    if (keep.length) q = q.not("id", "in", `(${keep.join(",")})`);
    const { error } = await q;
    if (error) {
      return {
        ok: false,
        error: `הנתונים נשמרו, אבל ניקוי פריטים שהוסרו נכשל (${table}): ${error.message}. שמרו שוב כדי להשלים.`,
      };
    }
  }

  return { ok: true, slug };
}
