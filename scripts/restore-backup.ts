/**
 * Restore a backup made by scripts/backup.mjs into the configured Supabase
 * project (uses SUPABASE_SERVICE_ROLE_KEY from .env.local).
 *
 *   npx tsx scripts/restore-backup.ts <backupDir>          # dry run: shows what it would do
 *   npx tsx scripts/restore-backup.ts <backupDir> --yes    # actually restore
 *
 * Upserts every row (by id) and re-uploads every storage file. It never deletes
 * anything — rows/files that exist only in the live project are left alone.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve, extname, relative } from "node:path";

function loadEnv() {
  const txt = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
  for (const line of txt.split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}
loadEnv();

const dir = process.argv[2];
const apply = process.argv.includes("--yes");
if (!dir) {
  console.error("usage: npx tsx scripts/restore-backup.ts <backupDir> [--yes]");
  process.exit(1);
}
const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SK = process.env.SUPABASE_SERVICE_ROLE_KEY!;
if (!URL_ || !SK) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
const auth = { apikey: SK, Authorization: `Bearer ${SK}` };

// Parents before children (foreign keys).
const TABLES = ["battles", "timeline_events", "soldiers", "media"];
const MIME: Record<string, string> = {
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp",
  ".gif": "image/gif", ".mp4": "video/mp4", ".mov": "video/quicktime", ".webm": "video/webm",
  ".mp3": "audio/mpeg", ".m4a": "audio/mp4", ".wav": "audio/wav", ".ogg": "audio/ogg",
};

function walk(d: string): string[] {
  return readdirSync(d).flatMap((n) => {
    const p = join(d, n);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

async function main() {
  const manifest = JSON.parse(readFileSync(join(dir, "manifest.json"), "utf8"));
  console.log(`Backup from ${manifest.createdAt}:`, manifest.tables, manifest.storage);
  if (!apply) console.log("\nDRY RUN — nothing will be written. Re-run with --yes to restore.\n");

  for (const t of TABLES) {
    const rows = JSON.parse(readFileSync(join(dir, "db", `${t}.json`), "utf8"));
    console.log(`${apply ? "↑" : "·"} ${t}: ${rows.length} rows`);
    if (!apply || !rows.length) continue;
    const res = await fetch(`${URL_}/rest/v1/${t}`, {
      method: "POST",
      headers: { ...auth, "Content-Type": "application/json", Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify(rows),
    });
    if (!res.ok) throw new Error(`${t} → ${res.status} ${await res.text()}`);
  }

  const storageDir = join(dir, "storage");
  const files = walk(storageDir);
  console.log(`${apply ? "↑" : "·"} storage: ${files.length} files`);
  if (apply) {
    for (const f of files) {
      const path = relative(storageDir, f).split("\\").join("/");
      const res = await fetch(`${URL_}/storage/v1/object/battle-media/${path}`, {
        method: "POST",
        headers: { ...auth, "Content-Type": MIME[extname(f).toLowerCase()] ?? "application/octet-stream", "x-upsert": "true" },
        body: readFileSync(f),
      });
      if (!res.ok) throw new Error(`upload ${path} → ${res.status} ${await res.text()}`);
    }
  }
  console.log(apply ? "\n✓ Restore complete." : "\n(dry run finished)");
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
