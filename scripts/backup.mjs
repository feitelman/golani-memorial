/**
 * Full backup of the memorial's data: every row of the four tables, plus every
 * file in the `battle-media` storage bucket (portraits, photos, audio, video).
 *
 * Uses only the public anon key — the site's data is public-read by design, so
 * a backup needs no secrets. Plain Node (>=20), no dependencies.
 *
 *   node scripts/backup.mjs [outDir]        (default: ./backup)
 *
 * Output:
 *   <outDir>/db/<table>.json      rows, sorted by id (stable diffs)
 *   <outDir>/storage/<path>       every bucket object, byte-for-byte
 *   <outDir>/manifest.json        counts + timestamp
 *
 * Restore with: npx tsx scripts/restore-backup.ts <outDir>
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";

const OUT = resolve(process.argv[2] ?? "backup");
const TABLES = ["battles", "timeline_events", "soldiers", "media"];
const BUCKET = "battle-media";

// env → falls back to .env.local for local runs
async function env(name) {
  if (process.env[name]) return process.env[name];
  try {
    const txt = await readFile(".env.local", "utf8");
    const m = txt.match(new RegExp(`^${name}=(.*)$`, "m"));
    if (m) return m[1].trim();
  } catch {}
  throw new Error(`Missing ${name}`);
}

const URL_ = (await env("NEXT_PUBLIC_SUPABASE_URL")).replace(/\/$/, "");
const KEY = await env("NEXT_PUBLIC_SUPABASE_ANON_KEY");
const H = { apikey: KEY, Authorization: `Bearer ${KEY}` };

async function getJson(url, init = {}) {
  const res = await fetch(url, { ...init, headers: { ...H, ...(init.headers ?? {}) } });
  if (!res.ok) throw new Error(`${res.status} ${url}\n${await res.text()}`);
  return res.json();
}

async function exportTable(table) {
  const rows = [];
  const page = 1000;
  for (let from = 0; ; from += page) {
    const batch = await getJson(`${URL_}/rest/v1/${table}?select=*&order=id`, {
      headers: { Range: `${from}-${from + page - 1}` },
    });
    rows.push(...batch);
    if (batch.length < page) break;
  }
  await writeFile(join(OUT, "db", `${table}.json`), JSON.stringify(rows, null, 2) + "\n");
  return rows.length;
}

async function listAll(prefix = "") {
  const out = [];
  for (let offset = 0; ; offset += 100) {
    const items = await getJson(`${URL_}/storage/v1/object/list/${BUCKET}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prefix, limit: 100, offset, sortBy: { column: "name", order: "asc" } }),
    });
    for (const it of items) {
      const path = prefix ? `${prefix}/${it.name}` : it.name;
      if (it.id === null) out.push(...(await listAll(path))); // a folder
      else out.push(path);
    }
    if (items.length < 100) break;
  }
  return out;
}

async function downloadAll() {
  const paths = await listAll();
  let bytes = 0;
  for (const p of paths) {
    const res = await fetch(`${URL_}/storage/v1/object/public/${BUCKET}/${p.split("/").map(encodeURIComponent).join("/")}`);
    if (!res.ok) throw new Error(`download ${p} → ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    const dest = join(OUT, "storage", p);
    await mkdir(dirname(dest), { recursive: true });
    await writeFile(dest, buf);
    bytes += buf.length;
  }
  return { files: paths.length, bytes };
}

await mkdir(join(OUT, "db"), { recursive: true });
const counts = {};
for (const t of TABLES) counts[t] = await exportTable(t);
const storage = await downloadAll();

// A backup with zero battles almost certainly means the project is paused or
// unreachable — fail loudly rather than commit an empty snapshot over a good one.
if (!counts.battles) throw new Error("Backup returned 0 battles — refusing to write an empty snapshot.");

const manifest = { createdAt: new Date().toISOString(), tables: counts, storage };
await writeFile(join(OUT, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
console.log("✓ backup complete:", JSON.stringify(manifest));
