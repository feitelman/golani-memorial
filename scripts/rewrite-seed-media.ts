/**
 * Rewrites lib/seed-data.ts so soldier photo + media URLs point at THIS
 * project's storage (post-migration), keyed by id from the DB. Keeps the seed
 * in sync with the migrated DB so re-seeding never restores Lovable URLs.
 *
 * Run AFTER migrate-media.ts:  npx tsx scripts/rewrite-seed-media.ts
 */
import { readFileSync, writeFileSync } from "node:fs";
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
const auth = { apikey: SK, Authorization: `Bearer ${SK}` };

async function getRows(table: string, select: string) {
  const r = await fetch(`${URL}/rest/v1/${table}?select=${select}`, { headers: auth });
  return r.json() as Promise<any[]>;
}

async function main() {
  const soldiers = await getRows("soldiers", "id,photo");
  const media = await getRows("media", "id,url");
  const photoById = new Map(soldiers.map((s) => [s.id, s.photo]));
  const urlById = new Map(media.map((m) => [m.id, m.url]));

  const file = resolve(process.cwd(), "lib/seed-data.ts");
  let txt = readFileSync(file, "utf8");
  let n = 0;

  // soldier blocks: id … then the next photo: "" (non-greedy skips fullName/
  // rank/age, which may contain escaped quotes like רס\"ב). fullName anchors it
  // to a soldier object, not a media entry.
  txt = txt.replace(
    /(id: "([^"]+)",\s*fullName:[\s\S]*?photo: ")([^"]+)(")/g,
    (m, pre, id, _old, post) => {
      const nu = photoById.get(id);
      if (!nu) return m;
      n++;
      return pre + nu + post;
    },
  );

  // media entries: id, kind, url
  txt = txt.replace(
    /(id: "([^"]+)", kind: "[^"]+", url: ")([^"]+)(")/g,
    (m, pre, id, _old, post) => {
      const nu = urlById.get(id);
      if (!nu) return m;
      n++;
      return pre + nu + post;
    },
  );

  writeFileSync(file, txt);
  const remaining = (txt.match(/hruzaqnljmjjtfygkhwr/g) || []).length;
  console.log(`Rewrote ${n} URLs in lib/seed-data.ts. Remaining Lovable refs: ${remaining}`);
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
