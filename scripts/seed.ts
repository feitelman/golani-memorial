/**
 * One-off seed: pushes the bundled Nahal Oz battles (lib/seed-data) into the
 * configured Supabase project using the service-role key (bypasses RLS).
 * Run with:  npx tsx scripts/seed.ts
 *
 * Uses plain PostgREST over fetch (no supabase-js → avoids the Node<22
 * WebSocket/realtime requirement). Idempotent: upserts battle rows by id and
 * replaces their child rows, so re-running it is safe.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { BATTLES } from "../lib/seed-data";

// Minimal .env.local loader (no dotenv dependency).
function loadEnv() {
  const txt = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
  for (const line of txt.split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}
loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}
const REST = `${url}/rest/v1`;
const headers = {
  apikey: serviceKey,
  Authorization: `Bearer ${serviceKey}`,
  "Content-Type": "application/json",
};

async function rest(method: string, path: string, body?: unknown, prefer?: string) {
  const res = await fetch(`${REST}/${path}`, {
    method,
    headers: prefer ? { ...headers, Prefer: prefer } : headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${method} ${path} → ${res.status} ${text}`);
  }
}

async function main() {
  for (const b of BATTLES) {
    await rest(
      "POST",
      "battles",
      {
        id: b.id,
        slug: b.slug,
        title: b.title,
        kind: b.kind,
        date: b.date,
        time: b.time,
        lng: b.coordinates[0],
        lat: b.coordinates[1],
        location_name: b.locationName,
        unit: b.unit,
        summary: b.summary,
        description: b.description,
      },
      "resolution=merge-duplicates", // upsert on PK
    );

    await rest("DELETE", `timeline_events?battle_id=eq.${b.id}`);
    await rest("DELETE", `soldiers?battle_id=eq.${b.id}`);
    await rest("DELETE", `media?battle_id=eq.${b.id}`);

    if (b.timeline.length)
      await rest(
        "POST",
        "timeline_events",
        b.timeline.map((t) => ({
          id: t.id,
          battle_id: b.id,
          time: t.time,
          end_time: t.endTime ?? null,
          title: t.title,
          detail: t.detail ?? null,
          path: t.path ?? null,
        })),
      );
    if (b.fallen.length)
      await rest(
        "POST",
        "soldiers",
        b.fallen.map((s) => ({
          id: s.id,
          battle_id: b.id,
          full_name: s.fullName,
          rank: s.rank,
          age: s.age,
          photo: s.photo,
          hometown: s.hometown,
          memorial: s.memorial,
          affiliation: s.affiliation ?? null,
        })),
      );
    if (b.media.length)
      await rest(
        "POST",
        "media",
        b.media.map((m) => ({ ...m, battle_id: b.id })),
      );

    console.log(`✓ seeded ${b.slug} (${b.timeline.length} events, ${b.fallen.length} fallen, ${b.media.length} media)`);
  }
  console.log("Done.");
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
