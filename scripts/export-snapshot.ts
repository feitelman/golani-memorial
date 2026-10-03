/**
 * Writes lib/snapshot.json — the full battle list exactly as the site reads it
 * from the database. The database is the single source of truth; this snapshot
 * is only served when the app runs without Supabase configured (demo/offline).
 *
 *   npm run snapshot
 *
 * The same JSON shape is accepted by `npm run import-battles`, so a battle can
 * be exported, edited as a file, and imported back.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

async function main() {
  for (const line of readFileSync(resolve(process.cwd(), ".env.local"), "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
  // Import after env is loaded — lib/supabase reads it at module load.
  const { fetchBattlesResult } = await import("../lib/data");
  const { battles, source, error } = await fetchBattlesResult();
  if (source !== "db" || !battles.length) {
    throw new Error(`Refusing to write a snapshot: source=${source} ${error ?? ""} (${battles.length} battles)`);
  }
  const out = resolve(process.cwd(), "lib/snapshot.json");
  writeFileSync(out, JSON.stringify(battles, null, 2) + "\n");
  const fallen = battles.reduce((n, b) => n + b.fallen.length, 0);
  console.log(`✓ lib/snapshot.json — ${battles.length} battles, ${fallen} fallen`);
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
