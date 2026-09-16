/**
 * One-off: pull the izkor.gov.il portrait of every מחנה פגה fallen soldier into
 * THIS project's `battle-media` bucket at fallen/<id>.jpg, so nothing on the
 * site depends on an external host. Idempotent (upsert).
 *
 * Run:  npx tsx scripts/upload-pgah-photos.ts
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
const auth = { apikey: SK, Authorization: `Bearer ${SK}` };

// id (our fallen id) → izkor portrait asset id
const PHOTOS: Record<string, string> = {
  // מחלקת המרגמות
  "pg-kian": "518971",
  "pg-binen": "518986",
  "pg-barak": "518993",
  "pg-benyehuda": "519148",
  "pg-eden": "519346",
  // צוות הטנק (שריון)
  "pg-levinson": "519490",
  "pg-eliyahu": "518987",
  "pg-testa": "518945",
  // הגנת מחנה פגה
  "pg-swissa": "518869",
  "pg-cohen": "518996",
  "pg-glisko": "519004",
  "pg-barnes": "518914",
  "pg-levi": "519171",
  "pg-raz": "519017",
  // כוח החילוץ
  "pg-amoyal": "519048",
};

async function main() {
  let ok = 0;
  for (const [id, asset] of Object.entries(PHOTOS)) {
    const src = `https://www.izkor.gov.il/assets/person/images/${asset}.jpg`;
    const res = await fetch(src, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!res.ok) {
      console.error(`✗ download ${id} (${asset}) → ${res.status}`);
      continue;
    }
    const bytes = new Uint8Array(await res.arrayBuffer());
    const path = `fallen/${id}.jpg`;
    const up = await fetch(`${URL}/storage/v1/object/${BUCKET}/${path}`, {
      method: "POST",
      headers: { ...auth, "Content-Type": "image/jpeg", "x-upsert": "true" },
      body: bytes,
    });
    if (!up.ok) {
      console.error(`✗ upload ${id} → ${up.status} ${await up.text()}`);
      continue;
    }
    ok++;
    console.log(`✓ ${id}  ←  izkor/${asset}.jpg  (${bytes.length} bytes)`);
  }
  console.log(`\nDone. Uploaded ${ok}/${Object.keys(PHOTOS).length}.`);
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
