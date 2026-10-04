/**
 * The battalion's deployment on the morning of 7 October — drawn by the map's
 * opening sequence ("כך נפרס הגדוד"). Approved by the battalion's content owner:
 *   • south → north: גדוד 51 | פלוגה ג' (פגה) | פלוגה ב' (נחל עוז) |
 *     גזרת גדוד 77: פלוגה א' (ניר עם) | פחת"ק (מעבר ארז, יפתח)
 *   • no reporting-line numbers on the border.
 * Sector boundaries are placed along the border line at a distance from the
 * Zikim coast, then drawn inland, perpendicular to the border.
 */

type LngLat = [number, number];

/**
 * Gaza land border, from the Zikim coast southward past Kissufim — traced from
 * the base map's own boundary layer (Mapbox admin, IL-PS-dispute) so the red
 * line sits exactly on the dashed border the map draws.
 */
export const BORDER: LngLat[] = [
  [34.49073, 31.59454], [34.49638, 31.59068], [34.49776, 31.58974], [34.51332, 31.57912],
  [34.51504, 31.57795], [34.54033, 31.56069], [34.5417, 31.55976], [34.5456, 31.5571],
  [34.5567, 31.5482], [34.56734, 31.54168], [34.56779, 31.5414], [34.56755, 31.5405],
  [34.5657, 31.5338], [34.5584, 31.5274], [34.5464, 31.512], [34.54229, 31.51126],
  [34.5417, 31.511], [34.54088, 31.51065], [34.54033, 31.51039], [34.53351, 31.50711],
  [34.52821, 31.50421], [34.5275, 31.50383], [34.52572, 31.50304], [34.52306, 31.50186],
  [34.51861, 31.50041], [34.51194, 31.49884], [34.5027, 31.49375], [34.49776, 31.49037],
  [34.49638, 31.48943], [34.49542, 31.48877], [34.49232, 31.48521], [34.48913, 31.48235],
  [34.48438, 31.47903], [34.47863, 31.47541], [34.47578, 31.47204], [34.47086, 31.46704],
  [34.47052, 31.46674], [34.46968, 31.46599], [34.46934, 31.46557], [34.46792, 31.46385],
  [34.46476, 31.46046], [34.4604, 31.4565], [34.45549, 31.45173], [34.45381, 31.45029],
  [34.45281, 31.44944], [34.45244, 31.44909], [34.44972, 31.44649], [34.4454, 31.44301],
  [34.44252, 31.44104], [34.43706, 31.43591], [34.43434, 31.43367], [34.43164, 31.43196],
  [34.42816, 31.42925], [34.42665, 31.42808], [34.42475, 31.42659], [34.42226, 31.42528],
  [34.42003, 31.42391], [34.41783, 31.42196], [34.41423, 31.41915], [34.40987, 31.41614],
  [34.40849, 31.4152], [34.40759, 31.41457], [34.39857, 31.40603], [34.39411, 31.40097],
  [34.39182, 31.39864], [34.38552, 31.39308], [34.38241, 31.39057],
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
  { id: "a", title: "פלוגה א'", sub: "גזרת גדוד 77", at: [34.612, 31.542] },
  { id: "b", title: "פלוגה ב'", sub: "גדוד 13", at: [34.535, 31.465] },
  { id: "g", title: "פלוגה ג'", sub: "גדוד 13", at: [34.47, 31.432] },
  { id: "51", title: "גדוד 51", at: sectorAt(28.6, 2.2), muted: true },
];

/** Captions under the battalion's positions (matched to map locations by name). */
// Who was there — Golani companies first, then the attached forces.
export const POSITION_NOTES: Record<string, string> = {
  "מחנה פגה": "פלוגה ג' · מסייעת (מרגמות) · טנקי 77",
  "מוצב נחל עוז": 'פלוגה ב\' · פלס"ם · טנקי 77 · תצפית',
  "קיבוץ ניר עם": "פלוגה א'",
  "מוצב ק-2": 'פחת"ק · מרגמות',
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
