/**
 * Safely add or update battles from a JSON file (one battle object, or an
 * array of them — the same shape as lib/snapshot.json).
 *
 *   npm run import-battles -- <file.json>          # dry run: validates, shows what it would do
 *   npm run import-battles -- <file.json> --yes    # write
 *
 * Uses the exact validation and save logic as the admin dashboard: invalid
 * input is rejected with readable errors, a failed write deletes nothing, and
 * battles that are not in the file are never touched.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

async function main() {
  for (const line of readFileSync(resolve(process.cwd(), ".env.local"), "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
  const file = process.argv.slice(2).find((a) => !a.startsWith("--"));
  const apply = process.argv.includes("--yes");
  if (!file) {
    console.error("usage: npm run import-battles -- <file.json> [--yes]");
    process.exit(1);
  }

  const { battleSchema, describeIssues } = await import("../lib/battle-schema");
  const { saveBattle } = await import("../lib/save-battle");
  const { getAdminClient } = await import("../lib/supabase");

  const raw = JSON.parse(readFileSync(resolve(file), "utf8"));
  const items: unknown[] = Array.isArray(raw) ? raw : [raw];

  // Validate everything first — nothing is written unless the whole file is valid.
  const valid = [];
  let failed = false;
  for (const [i, item] of items.entries()) {
    const r = battleSchema.safeParse(item);
    const label = (item as { title?: string; id?: string })?.title ?? `#${i + 1}`;
    if (!r.success) {
      failed = true;
      console.error(`✗ ${label}\n  ${describeIssues(r.error, item).split("\n").join("\n  ")}`);
    } else {
      valid.push(r.data);
      console.log(`✓ ${label} (${r.data.id}) — ${r.data.timeline.length} timeline, ${r.data.fallen.length} fallen, ${r.data.media.length} media`);
    }
  }
  if (failed) {
    console.error("\nNothing was written. Fix the errors above and run again.");
    process.exit(1);
  }
  if (!apply) {
    console.log(`\nDRY RUN — ${valid.length} battle(s) valid. Re-run with --yes to write them.`);
    return;
  }

  const db = getAdminClient();
  if (!db) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY in .env.local");
  for (const b of valid) {
    const res = await saveBattle(db, b);
    if (!res.ok) {
      console.error(`✗ ${b.title}: ${res.error}`);
      process.exit(1);
    }
    console.log(`↑ saved ${b.title} → /map?battle=${res.slug}`);
  }
  console.log(`\n✓ Imported ${valid.length} battle(s). (A deployed site refreshes its cached pages within 5 minutes.)`);
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
