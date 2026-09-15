import { Battle, toMinutes } from "./types";

// ── Locations = battles grouped by locationName ──────────────
// A "location" is a place on the map (e.g. מוצב נחל עוז) that hosts one or more
// battles. The guided tour operates per location; grouping by name scales to
// future locations with no extra wiring.

export interface MapLocation {
  name: string;
  center: [number, number]; // [lng, lat] — bbox center of member battles
  battles: Battle[]; // chronological stations (sorted by open-minute)
}

/**
 * The minute a battle's story panel auto-opens during the tour: the battle's
 * own time. Movement events play during the continuous run-up to that time, but
 * never open the point early (that was the bug — an event that moves before the
 * battle opened it ahead of its hour). Stations therefore stay ordered by
 * battle time.
 */
export function battleOpenMinute(b: Battle): number {
  return b.startMinute;
}

/**
 * Where a station's visible action begins for the tour: the start of its
 * movement if it has one, otherwise its open-minute (so a static battle just
 * flies in and opens — no clock rewind to an early timeline note like 06:29).
 */
export function battleSegmentStart(b: Battle): number {
  const pathStarts = (b.timeline ?? [])
    .filter((e) => e.path && e.path.length > 0)
    .map((e) => toMinutes(e.path![0].time));
  return pathStarts.length ? Math.min(...pathStarts) : battleOpenMinute(b);
}

/** The [start, end] minute window of a battle's movement, or null if it doesn't move. */
export function battleMovementWindow(
  b: Battle,
): { start: number; end: number } | null {
  const paths = (b.timeline ?? []).filter((e) => e.path && e.path.length > 0);
  if (!paths.length) return null;
  const starts = paths.map((e) => toMinutes(e.path![0].time));
  const ends = paths.map((e) => Math.max(...e.path!.map((w) => toMinutes(w.time))));
  return { start: Math.min(...starts), end: Math.max(...ends) };
}

/** Group battles into locations by locationName, with a framing center. */
export function groupLocations(battles: Battle[]): MapLocation[] {
  const byName = new Map<string, Battle[]>();
  for (const b of battles) {
    const key = b.locationName || "—";
    const arr = byName.get(key);
    if (arr) arr.push(b);
    else byName.set(key, [b]);
  }

  return Array.from(byName.entries()).map(([name, members]) => {
    const lngs = members.map((b) => b.coordinates[0]);
    const lats = members.map((b) => b.coordinates[1]);
    const center: [number, number] = [
      (Math.min(...lngs) + Math.max(...lngs)) / 2,
      (Math.min(...lats) + Math.max(...lats)) / 2,
    ];
    const ordered = [...members].sort(
      (a, b) => battleOpenMinute(a) - battleOpenMinute(b),
    );
    return { name, center, battles: ordered };
  });
}
