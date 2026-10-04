import { z } from "zod";

// Server-side validation for a battle before it is written to the database.
// Shared by the admin API and the import script, so both enforce the same
// rules. Messages are Hebrew because they are shown to the editor as-is.

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;
const ID = /^[A-Za-z0-9_-]{1,64}$/;

const hhmm = z.string().regex(HHMM, "שעה לא תקינה (צריך HH:MM, למשל 07:30)");
const id = z.string().regex(ID, "מזהה לא תקין");
/** One spelling for abbreviations and spacing: ״/׳ → "/', and no doubled spaces. */
const clean = (v: unknown) =>
  typeof v === "string"
    ? v.replace(/״/g, '"').replace(/׳/g, "'").replace(/[ \t]{2,}/g, " ")
    : v;
const str = (max: number) => z.string().trim().max(max, `ארוך מדי (עד ${max} תווים)`);
const text = (max: number) => z.preprocess(clean, str(max));
const required = (max: number) => z.preprocess(clean, str(max).min(1, "שדה חובה"));
/** Empty string → undefined, so optional fields can be cleared from the form. */
const optional = <T extends z.ZodTypeAny>(s: T) =>
  z.preprocess((v) => (v === "" || v === null ? undefined : v), s.optional());
const httpsUrl = z.string().trim().max(2000).regex(/^https:\/\//, "קישור חייב להתחיל ב-https://");

// Everything we map lives in the Gaza envelope; a point outside this generous
// box is almost always a typo — most often longitude and latitude swapped.
const coordinates = z
  .tuple([z.number().finite(), z.number().finite()])
  .refine(([lng, lat]) => lng >= 33.5 && lng <= 36.5 && lat >= 29 && lat <= 34, {
    message: "מיקום מחוץ לאזור — ייתכן שקו האורך וקו הרוחב הוחלפו",
  });

const waypoint = z.object({ time: hhmm, coordinates });

const timelineEvent = z
  .object({
    id,
    time: hhmm,
    endTime: optional(hhmm),
    title: required(300),
    detail: optional(text(2000)),
    path: optional(z.array(waypoint).max(200, "יותר מדי נקודות מסלול")),
  })
  .refine((t) => !t.endTime || t.endTime >= t.time, {
    message: "שעת הסיום מוקדמת משעת ההתחלה",
    path: ["endTime"],
  });

const soldier = z.object({
  id,
  fullName: required(120),
  rank: text(40),
  age: z.coerce.number().int("גיל חייב להיות מספר שלם").min(0).max(120, "גיל לא תקין"),
  photo: optional(httpsUrl),
  hometown: optional(text(120)),
  memorial: text(200),
  affiliation: optional(z.enum(["battalion_13", "combat_team"])),
});

const media = z.object({
  id,
  kind: z.enum(["image", "video", "drone", "audio", "radio"]),
  url: httpsUrl,
  thumb: optional(httpsUrl),
  caption: optional(text(300)),
});

/** Fails when two items in one list share an id (that silently overwrote rows before). */
const uniqueIds = <T extends { id: string }>(label: string) => (items: T[], ctx: z.RefinementCtx) => {
  const seen = new Set<string>();
  items.forEach((it, i) => {
    if (seen.has(it.id)) ctx.addIssue({ code: "custom", path: [i, "id"], message: `מזהה כפול ב${label}` });
    seen.add(it.id);
  });
};

export const battleSchema = z.object({
  id,
  slug: optional(z.string().trim().max(160).regex(/^[^\s/?#%]+$/, "כתובת (slug) לא יכולה להכיל רווחים או / ? # %")),
  title: required(200),
  kind: z.enum(["battle", "ambush", "rescue"]),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "תאריך לא תקין"),
  time: hhmm,
  coordinates,
  locationName: required(120),
  unit: text(200),
  summary: optional(text(500)),
  description: optional(text(20000)),
  timeline: z.array(timelineEvent).max(200).superRefine(uniqueIds("ציר הזמן")),
  fallen: z.array(soldier).max(300).superRefine(uniqueIds("רשימת הנופלים")),
  media: z.array(media).max(100).superRefine(uniqueIds("המדיה")),
});

export type ValidBattle = z.infer<typeof battleSchema>;

const FIELD: Record<string, string> = {
  id: "מזהה", slug: "כתובת (slug)", title: "כותרת", kind: "סוג", date: "תאריך", time: "שעה",
  endTime: "שעת סיום", coordinates: "מיקום", locationName: "שם המיקום", unit: "מסגרת",
  summary: "תקציר", description: "תיאור", detail: "פירוט", path: "מסלול", fullName: "שם",
  rank: "דרגה", age: "גיל", photo: "תמונה", hometown: "יישוב", memorial: "שיוך",
  affiliation: "מסגרת", url: "קישור", thumb: "תמונה מוקטנת", caption: "כיתוב",
};
const LIST: Record<string, string> = {
  timeline: "ציר זמן › שלב ", fallen: "נופלים › #", media: "מדיה › #", path: "מסלול › נקודה ",
};

/** Turn zod issues into short Hebrew lines like "ציר זמן › שלב 3 › שעה: שעה לא תקינה". */
export function describeIssues(err: z.ZodError, input: unknown): string {
  const lines = err.issues.slice(0, 6).map((iss) => {
    const parts: string[] = [];
    let node: any = input;
    for (let i = 0; i < iss.path.length; i++) {
      const key = iss.path[i];
      const next = iss.path[i + 1];
      if (typeof key === "string" && typeof next === "number" && LIST[key]) {
        node = node?.[key]?.[next];
        const name = key === "fallen" && node?.fullName ? ` (${node.fullName})` : "";
        parts.push(`${LIST[key]}${next + 1}${name}`);
        i++;
      } else if (typeof key === "string") {
        if (FIELD[key]) parts.push(FIELD[key]);
        node = node?.[key];
      }
    }
    return `${parts.join(" › ") || "קרב"}: ${iss.message}`;
  });
  const more = err.issues.length > 6 ? `\n…ועוד ${err.issues.length - 6} שגיאות` : "";
  return lines.join("\n") + more;
}
