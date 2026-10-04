import type { Battle, Soldier } from "./types";

export type FallenEntry = Soldier & { battle: Battle };

/**
 * Every fallen soldier in memorial-wall order: locations with the most fallen
 * first, battles within a location by time, and each battle's fallen by rank
 * (already sorted by the data layer). The wall and the personal pages share
 * this so "previous / next" on a personal page follows the wall.
 */
export function orderedFallen(battles: Battle[]): FallenEntry[] {
  const perLocation = new Map<string, number>();
  for (const b of battles) {
    perLocation.set(b.locationName, (perLocation.get(b.locationName) ?? 0) + b.fallen.length);
  }
  const ordered = [...battles].sort(
    (a, b) =>
      perLocation.get(b.locationName)! - perLocation.get(a.locationName)! ||
      a.locationName.localeCompare(b.locationName, "he") ||
      a.startMinute - b.startMinute ||
      a.title.localeCompare(b.title, "he"),
  );
  return ordered.flatMap((b) => b.fallen.map((s) => ({ ...s, battle: b })));
}
