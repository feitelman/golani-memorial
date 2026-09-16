// ── Core domain model ───────────────────────────────────
// Mirrors the Supabase schema in /supabase/schema.sql.

export type BattleKind =
  | "battle" // קרב
  | "ambush" // מארב
  | "rescue"; // חילוץ

export const KIND_LABEL: Record<BattleKind, string> = {
  battle: "קרב",
  ambush: "מארב",
  rescue: "חילוץ",
};

export type MediaKind = "image" | "video" | "drone" | "audio" | "radio";

export interface Media {
  id: string;
  kind: MediaKind;
  url: string;
  thumb?: string;
  caption?: string;
}

/** A timed point on the map — used to move an event marker over time. */
export interface Waypoint {
  /** "HH:MM" — when the marker is at this point */
  time: string;
  /** [lng, lat] — Mapbox order */
  coordinates: [number, number];
}

export interface TimelineEvent {
  id: string;
  /** "HH:MM" 24h — the event's start time (also used for ordering) */
  time: string;
  /** "HH:MM" — the event's end time, if it has a duration */
  endTime?: string;
  title: string;
  detail?: string;
  /**
   * Ordered timed waypoints. When present the event also renders as a marker:
   * 1 point = a fixed positioned marker; ≥2 points = a marker that moves along
   * the path and then disappears on arrival (so it doesn't duplicate the
   * battle's static marker at the destination).
   */
  path?: Waypoint[];
}

/**
 * Position of an event marker at a given minute, or null when it has no path,
 * hasn't started yet, or has already reached its final point. Interpolates
 * linearly between waypoints by time. Once the marker arrives at the last
 * waypoint it disappears (returns null) rather than resting there — otherwise
 * it would sit on top of the battle's own static marker, which is at (or very
 * near) the same destination, and read as a duplicate point.
 */
export function eventPositionAt(
  ev: TimelineEvent,
  minute: number,
): [number, number] | null {
  const path = ev.path;
  if (!path || path.length === 0) return null;
  if (minute < toMinutes(ev.time)) return null; // not started

  const pts = path.map((w) => ({ m: toMinutes(w.time), c: w.coordinates }));
  if (minute <= pts[0].m) return pts[0].c;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    if (minute >= a.m && minute <= b.m) {
      const t = b.m === a.m ? 1 : (minute - a.m) / (b.m - a.m);
      return [a.c[0] + (b.c[0] - a.c[0]) * t, a.c[1] + (b.c[1] - a.c[1]) * t];
    }
  }
  return null; // reached the end — hide so it doesn't duplicate the battle marker
}

/** Which framework the fallen soldier belonged to. */
export type Affiliation =
  | "battalion_13" // גדוד 13, חטיבת גולני (נחל עוז)
  | "combat_team" // צוות הקרב הגדודי (נחל עוז)
  | "company_c" // פלוגה ג' 'דייגו', גדוד 13 (מחנה פגה)
  | "mortars" // מחלקת המרגמות, פלוגה מסייעת 13
  | "armor_77" // צוות הטנק — גדוד 77, חטיבה 7 (שריון)
  | "company_b"; // פלוגה ב', גדוד 13 (כוח החילוץ)

export const AFFILIATION_LABEL: Record<Affiliation, string> = {
  battalion_13: "גדוד 13, חטיבת גולני",
  combat_team: "צוות הקרב הגדודי",
  company_c: "פלוגה ג' 'דייגו', גדוד 13",
  mortars: "מחלקת המרגמות, מסייעת 13",
  armor_77: "צוות הטנק — גדוד 77, חטיבה 7",
  company_b: "פלוגה ב', גדוד 13",
};

export interface Soldier {
  id: string;
  fullName: string;
  rank: string;
  age: number;
  photo?: string;
  hometown?: string;
  memorial: string; // short respectful memorial text / unit
  affiliation?: Affiliation;
}

export interface Battle {
  id: string;
  slug: string;
  title: string;
  kind: BattleKind;
  /** ISO date — all events here are 2023-10-07 */
  date: string;
  /** "HH:MM" — start of the engagement, used by the timeline replay */
  time: string;
  /** [lng, lat] — Mapbox order */
  coordinates: [number, number];
  locationName: string;
  unit: string; // פלוגה / מסגרת
  summary: string; // one line for the marker hover
  description: string; // rich chronological Hebrew text
  media: Media[];
  timeline: TimelineEvent[];
  fallen: Soldier[];
  /** drives ordering on the timeline slider */
  startMinute: number; // minutes from 00:00
  endMinute: number;
}

/** Convert "HH:MM" → minutes from midnight */
export function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

/** Convert minutes from midnight → "HH:MM" */
export function fromMinutes(min: number): string {
  const h = Math.floor(min / 60) % 24;
  const m = Math.floor(min % 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
