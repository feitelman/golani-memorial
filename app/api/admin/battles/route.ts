import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase";
import { fetchBattlesResult } from "@/lib/data";
import { Battle } from "@/lib/types";

// Lightweight admin API. With a Supabase service-role key it persists to the
// relational tables; without one it runs in demo mode (returns seed, accepts
// writes but does not persist) so the dashboard is fully demoable offline.

export const dynamic = "force-dynamic";

export async function GET() {
  const { battles, source, error } = await fetchBattlesResult();
  return NextResponse.json({
    battles,
    source, // "db" | "seed" | "error" — the UI must not treat these alike
    error,
    persisted: Boolean(getAdminClient()),
  });
}

export async function POST(req: NextRequest) {
  const admin = getAdminClient();
  const battle = (await req.json()) as Battle;

  if (!admin) {
    return NextResponse.json({
      ok: true,
      persisted: false,
      note: "Demo mode — set SUPABASE_SERVICE_ROLE_KEY to persist.",
    });
  }

  // Upsert battle row. `slug` is UNIQUE, so two battles with the same title
  // would collide — self-heal by suffixing the id rather than failing the save.
  const row = (slug: string) => ({
    id: battle.id,
    slug,
    title: battle.title,
    kind: battle.kind,
    date: battle.date,
    time: battle.time,
    lng: battle.coordinates[0],
    lat: battle.coordinates[1],
    location_name: battle.locationName,
    unit: battle.unit,
    summary: battle.summary,
    description: battle.description,
  });

  let savedSlug = battle.slug || battle.id;
  let { error: bErr } = await admin.from("battles").upsert(row(savedSlug));
  if (bErr && (bErr as { code?: string }).code === "23505") {
    // unique_violation → retry once with a disambiguated slug
    savedSlug = `${savedSlug}-${battle.id.slice(0, 5)}`;
    ({ error: bErr } = await admin.from("battles").upsert(row(savedSlug)));
  }
  if (bErr)
    return NextResponse.json({ ok: false, error: bErr.message }, { status: 500 });

  // Replace child rows (simple + predictable for an admin tool)
  await admin.from("timeline_events").delete().eq("battle_id", battle.id);
  await admin.from("soldiers").delete().eq("battle_id", battle.id);
  await admin.from("media").delete().eq("battle_id", battle.id);

  if (battle.timeline.length)
    await admin.from("timeline_events").insert(
      battle.timeline.map((t) => ({
        id: t.id,
        battle_id: battle.id,
        time: t.time,
        end_time: t.endTime ?? null,
        title: t.title,
        detail: t.detail ?? null,
        path: t.path ?? null,
      })),
    );
  if (battle.fallen.length)
    await admin.from("soldiers").insert(
      battle.fallen.map((s) => ({
        id: s.id,
        battle_id: battle.id,
        full_name: s.fullName,
        rank: s.rank,
        age: s.age,
        photo: s.photo,
        hometown: s.hometown,
        memorial: s.memorial,
        affiliation: s.affiliation ?? null,
      })),
    );
  if (battle.media.length)
    await admin.from("media").insert(
      battle.media.map((m) => ({ ...m, battle_id: battle.id })),
    );

  return NextResponse.json({ ok: true, persisted: true, slug: savedSlug });
}

export async function DELETE(req: NextRequest) {
  const admin = getAdminClient();
  const { id } = await req.json();
  if (!admin) return NextResponse.json({ ok: true, persisted: false });
  const { error } = await admin.from("battles").delete().eq("id", id);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, persisted: true });
}
