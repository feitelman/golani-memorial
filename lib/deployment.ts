/**
 * The battalion's deployment on the morning of 7 October — drawn by the map's
 * opening sequence ("כך נפרס הגדוד"). Approved by the battalion's content owner:
 *   • south → north: גדוד 51 | פלוגה ג' (פגה) | פלוגה ב' (נחל עוז) |
 *     גזרת גדוד 77: פלוגה א' (ניר עם) | פחת"ק (מעבר ארז, יפתח)
 *   • no reporting-line numbers on the border.
 * Sector boundaries are placed along the real border line (OpenStreetMap,
 * Gaza Strip relation 1473938) at a distance from the Zikim coast, then drawn
 * inland, perpendicular to the border.
 */

type LngLat = [number, number];

/** Gaza land border, from the Zikim coast southward to past Kissufim junction. */
export const BORDER: LngLat[] = [
  [34.4898, 31.59575], [34.52177, 31.57401], [34.54328, 31.55829], [34.54496, 31.55762],
  [34.54605, 31.55621], [34.55591, 31.54865], [34.56668, 31.54146], [34.56732, 31.54012],
  [34.56543, 31.53324], [34.56455, 31.53191], [34.55843, 31.52761], [34.55819, 31.52512],
  [34.55481, 31.5228], [34.55378, 31.52125], [34.55422, 31.51874], [34.55009, 31.51672],
  [34.54675, 31.51303], [34.53137, 31.50708], [34.52473, 31.50295], [34.51271, 31.5007],
  [34.50852, 31.49833], [34.49639, 31.48917], [34.48654, 31.48088], [34.47864, 31.47676],
  [34.47443, 31.47184], [34.46733, 31.46478], [34.46473, 31.46114], [34.45318, 31.45205],
  [34.44702, 31.44507], [34.44555, 31.44379], [34.4419, 31.44299], [34.43706, 31.44027],
  [34.43355, 31.43612], [34.43051, 31.43119], [34.4236, 31.42337], [34.4164, 31.41972],
];

// Local metric approximation (fine at this scale, ~31.5°N).
const KX = 94.9; // km per degree of longitude
const KY = 111.0; // km per degree of latitude

const cum: number[] = [0];
for (let i = 1; i < BORDER.length; i++) {
  const [a, b] = [BORDER[i - 1], BORDER[i]];
  cum.push(cum[i - 1] + Math.hypot((b[0] - a[0]) * KX, (b[1] - a[1]) * KY));
}

/** Point on the border `km` from the coast, with the unit normal pointing into Israel. */
export function alongBorder(km: number): { at: LngLat; inland: [number, number] } {
  let i = cum.findIndex((c) => c >= km);
  if (i <= 0) i = 1;
  const [a, b] = [BORDER[i - 1], BORDER[i]];
  const t = Math.min(1, Math.max(0, (km - cum[i - 1]) / (cum[i] - cum[i - 1] || 1)));
  const at: LngLat = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  // tangent (km space) → normal; pick the side facing east (Israel).
  const tx = (b[0] - a[0]) * KX;
  const ty = (b[1] - a[1]) * KY;
  const len = Math.hypot(tx, ty) || 1;
  let n: [number, number] = [-ty / len, tx / len];
  if (n[0] < 0) n = [-n[0], -n[1]];
  return { at, inland: n };
}

/** Move `km` from a point along a unit direction given in km space. */
export function offset([lng, lat]: LngLat, dir: [number, number], km: number): LngLat {
  return [lng + (dir[0] * km) / KX, lat + (dir[1] * km) / KY];
}

/** A sector boundary: from the border `km` from the coast, `length` km inland. */
function boundary(km: number, length: number): LngLat[] {
  const { at, inland } = alongBorder(km);
  return [at, offset(at, inland, length * 0.5), offset(at, inland, length)];
}

export const BOUNDARIES: { id: string; line: LngLat[] }[] = [
  { id: "pachak-a", line: boundary(8.2, 5) }, // פחת"ק | פלוגה א' (inside 77's sector)
  { id: "a-b", line: boundary(12.0, 7) }, // גזרת 77 (פלוגה א') | פלוגה ב'
  { id: "b-g", line: boundary(21.2, 6) }, // פלוגה ב' | פלוגה ג'
  { id: "g-51", line: boundary(26.6, 6) }, // פלוגה ג' | גדוד 51
];

export interface SectorLabel {
  id: string;
  title: string;
  sub?: string;
  at: LngLat;
  muted?: boolean;
}

const sectorAt = (km: number, inlandKm: number): LngLat => {
  const { at, inland } = alongBorder(km);
  return offset(at, inland, inlandKm);
};

// Sector names sit in open ground inside each sector, clear of the communities'
// and positions' labels (hand-placed; the north is crowded).
export const SECTORS: SectorLabel[] = [
  { id: "pachak", title: 'פחת"ק', sub: "גזרת גדוד 77", at: [34.578, 31.6] },
  { id: "a", title: "פלוגה א'", sub: "גזרת גדוד 77", at: [34.585, 31.541] },
  { id: "b", title: "פלוגה ב'", sub: "גדוד 13", at: [34.535, 31.465] },
  { id: "g", title: "פלוגה ג'", sub: "גדוד 13", at: [34.47, 31.432] },
  { id: "51", title: "גדוד 51", at: sectorAt(28.6, 2.2), muted: true },
];

/** Captions under the battalion's positions (matched to map locations by name). */
export const POSITION_NOTES: Record<string, string> = {
  "מחנה פגה": 'צק"מ · מרגמות · טנקי 77',
  "מוצב נחל עוז": "טנקי 77 בכוננות",
  "מוצב ק-2": 'פחת"ק',
  "מחנה מעבר ארז": 'פחת"ק',
  "מחנה יפתח": 'פחת"ק',
};

/** Communities in the sector (OpenStreetMap). `r` ≈ relative size. */
/** `label: false` — the battalion's own position there already names it. */
export const SETTLEMENTS: { name: string; at: LngLat; r?: number; label?: boolean }[] = [
  { name: "בארי", at: [34.4911, 31.4242] },
  { name: "נחל עוז", at: [34.4982, 31.4724], label: false },
  { name: "כפר עזה", at: [34.5333, 31.4833] },
  { name: "מפלסים", at: [34.5621, 31.5027] },
  { name: "ניר עם", at: [34.5808, 31.5193], label: false },
  { name: "גבים", at: [34.5992, 31.5067] },
  { name: "שדרות", at: [34.597, 31.5265], r: 2.4 },
  { name: "אור הנר", at: [34.6001, 31.5576] },
  { name: "ארז", at: [34.5666, 31.5605] },
  { name: "נתיב העשרה", at: [34.5395, 31.5717] },
  { name: "יד מרדכי", at: [34.559, 31.5887] },
  { name: "כרמיה", at: [34.543, 31.6054] },
  { name: "זיקים", at: [34.5221, 31.6094] },
];

/** Bounds that frame the whole deployment. */
export const DEPLOYMENT_BOUNDS: [LngLat, LngLat] = [
  [34.43, 31.415],
  [34.61, 31.612],
];
