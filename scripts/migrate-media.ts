/**
 * One-off media migration: copies every soldier photo and media file that
 * still lives on the old Lovable Supabase storage into THIS project's
 * `battle-media` bucket, then repoints the DB rows at the new public URLs.
 *
 * Idempotent: uploads use upsert and we only migrate URLs still pointing at
 * the old host, so re-running it skips already-migrated files.
 *
 * Run:  npx tsx scripts/migrate-media.ts
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnv() {
  const txt = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
  for (const line of txt.split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}
loadEnv();

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SK = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const BUCKET = "battle-media";
const OLD_HOST = "hruzaqnljmjjtfygkhwr.supabase.co"; // Lovable project
const auth = { apikey: SK, Authorization: `Bearer ${SK}` };

const publicUrl = (path: string) =>
  `${URL}/storage/v1/object/public/${BUCKET}/${path}`;

function extFromUrl(u: string, kind?: string) {
  const m = u.split("?")[0].match(/\.([a-z0-9]+)$/i);
  if (m) return m[1].toLowerCase();
  return kind === "audio" ? "mp3" : "jpg";
}

/** Download a remote file → upload to our bucket at `path`. Returns new URL. */
async function copyFile(srcUrl: string, path: string): Promise<string> {
  const res = await fetch(srcUrl);
  if (!res.ok) throw new Error(`download ${srcUrl} → ${res.status}`);
  const contentType =
    res.headers.get("content-type") || "application/octet-stream";
  const bytes = new Uint8Array(await res.arrayBuffer());
  const up = await fetch(`${URL}/storage/v1/object/${BUCKET}/${path}`, {
    method: "POST",
    headers: { ...auth, "Content-Type": contentType, "x-upsert": "true" },
    body: bytes,
  });
  if (!up.ok) throw new Error(`upload ${path} → ${up.status} ${await up.text()}`);
  return publicUrl(path);
}

async function patch(table: string, id: string, body: Record<string, unknown>) {
  const r = await fetch(`${URL}/rest/v1/${table}?id=eq.${id}`, {
    method: "PATCH",
    headers: { ...auth, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`patch ${table}/${id} → ${r.status} ${await r.text()}`);
}

async function getRows(table: string, select: string) {
  const r = await fetch(`${URL}/rest/v1/${table}?select=${select}`, {
    headers: auth,
  });
  if (!r.ok) throw new Error(`get ${table} → ${r.status}`);
  return r.json() as Promise<any[]>;
}

async function main() {
  let copied = 0,
    skipped = 0;

  // ── soldier photos ──
  const soldiers = await getRows("soldiers", "id,full_name,photo");
  for (const s of soldiers) {
    if (!s.photo) continue;
    if (!s.photo.includes(OLD_HOST)) {
      skipped++;
      continue;
    }
    const path = `fallen/${s.id}.${extFromUrl(s.photo)}`;
    const newUrl = await copyFile(s.photo, path);
    await patch("soldiers", s.id, { photo: newUrl });
    copied++;
    console.log(`✓ photo  ${s.full_name} → ${path}`);
  }

  // ── media files ──
  const media = await getRows("media", "id,kind,url");
  for (const m of media) {
    if (!m.url) continue;
    if (!m.url.includes(OLD_HOST)) {
      skipped++;
      continue;
    }
    const path = `media/${m.id}.${extFromUrl(m.url, m.kind)}`;
    const newUrl = await copyFile(m.url, path);
    await patch("media", m.id, { url: newUrl });
    copied++;
    console.log(`✓ media  ${m.kind} → ${path}`);
  }

  console.log(`\nDone. Copied ${copied}, skipped ${skipped} (already migrated).`);
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
