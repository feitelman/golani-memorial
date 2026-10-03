import type { Soldier } from "./types";

// IDF ranks, most senior first. Used to give the fallen a stable, respectful
// order (the database returns rows in no particular order).
const ORDER = [
  'סא"ל', 'רס"ן', "סרן", "סגן", 'סג"ם',
  'רנ"ג', 'רס"ב', 'רס"מ', 'רס"ר', 'רס"ל',
  'סמ"ר', "סמל", 'רב"ט', "טוראי",
];

/** Data uses both ASCII quotes and Hebrew gershayim/geresh — treat them alike. */
const normalize = (rank: string) => rank.replace(/״/g, '"').replace(/׳/g, "'").trim();

/** Lower = more senior; unknown ranks sort last. */
export function rankIndex(rank: string | undefined): number {
  const i = ORDER.indexOf(normalize(rank ?? ""));
  return i === -1 ? ORDER.length : i;
}

/** Senior rank first, then alphabetical by name (Hebrew collation). */
export function compareFallen(a: Soldier, b: Soldier): number {
  return rankIndex(a.rank) - rankIndex(b.rank) || a.fullName.localeCompare(b.fullName, "he");
}
