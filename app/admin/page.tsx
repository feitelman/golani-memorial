"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AFFILIATION_LABEL,
  Affiliation,
  Battle,
  BattleKind,
  KIND_LABEL,
  Media,
  MediaKind,
  Soldier,
  TimelineEvent,
  Waypoint,
  toMinutes,
} from "@/lib/types";
import PathEditor from "@/components/PathEditor";
import LocationPicker from "@/components/LocationPicker";

const KINDS = Object.keys(KIND_LABEL) as BattleKind[];
const MEDIA_KINDS: MediaKind[] = ["image", "video", "drone", "audio", "radio"];
const AFFILIATIONS = Object.keys(AFFILIATION_LABEL) as Affiliation[];
const uid = () => Math.random().toString(36).slice(2, 9);

// Map a file's mime type to our media kind (best-effort default).
function kindFromMime(type: string): MediaKind {
  if (type.startsWith("video")) return "video";
  if (type.startsWith("audio")) return "audio";
  return "image";
}

function blank(): Battle {
  return {
    id: uid(),
    slug: "",
    title: "",
    kind: "battle",
    date: "2023-10-07",
    time: "06:30",
    coordinates: [34.38, 31.32],
    locationName: "",
    unit: "גדוד 13, חטיבת גולני",
    summary: "",
    description: "",
    media: [],
    timeline: [],
    fallen: [],
    startMinute: 390,
    endMinute: 390,
  };
}

export default function AdminPage() {
  const [battles, setBattles] = useState<Battle[]>([]);
  const [persisted, setPersisted] = useState(false);
  // "db" = real data. Anything else means we must NOT let the user edit/save,
  // or they'd be working on top of demo data / an unreachable database.
  const [source, setSource] = useState<string>("db");
  const [loadError, setLoadError] = useState<string>("");
  const [editing, setEditing] = useState<Battle | null>(null);
  const [status, setStatus] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/battles")
      .then((r) => r.json())
      .then((d) => {
        setBattles(d.battles ?? []);
        setPersisted(d.persisted);
        setSource(d.source ?? "db");
        setLoadError(d.error ?? "");
        setLoading(false);
      })
      .catch((e) => {
        setSource("error");
        setLoadError(String(e));
        setLoading(false);
      });
  }, []);

  // Editing is only safe against the real database.
  const readOnly = source !== "db";

  function patch(p: Partial<Battle>) {
    setEditing((b) => (b ? { ...b, ...p } : b));
  }

  async function save() {
    if (!editing) return;
    if (readOnly) {
      alert(
        "אין חיבור למסד הנתונים — שמירה חסומה כדי לא לדרוס נתונים אמיתיים.\n" +
          "רעננו אחרי שהחיבור יחזור ונסו שוב.",
      );
      return;
    }
    // Never produce an empty/duplicate-prone slug — `battles.slug` is UNIQUE, and
    // a collision used to fail the save silently.
    const slug =
      editing.slug ||
      editing.title.trim().replace(/\s+/g, "-").toLowerCase() ||
      editing.id;
    const e: Battle = {
      ...editing,
      slug,
      startMinute: toMinutes(editing.time),
      endMinute: toMinutes(
        editing.timeline[editing.timeline.length - 1]?.time ?? editing.time,
      ),
    };
    setStatus("שומר…");
    let d: any = {};
    try {
      const res = await fetch("/api/admin/battles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(e),
      });
      d = await res.json().catch(() => ({}));
      // A failed save must NOT look like a success — keep the editor open so the
      // work isn't lost, and say what went wrong.
      if (!res.ok || d.ok === false) {
        setStatus("");
        alert(
          "השמירה נכשלה ולא נשמרה לשרת:\n" +
            (d.error || `שגיאה ${res.status}`) +
            "\n\nהעריכה נשארה פתוחה — תקנו ונסו שוב.",
        );
        return;
      }
    } catch {
      setStatus("");
      alert("השמירה נכשלה (שגיאת רשת). העריכה נשארה פתוחה — נסו שוב.");
      return;
    }
    setBattles((prev) => {
      const i = prev.findIndex((x) => x.id === e.id);
      if (i === -1) return [...prev, e];
      const copy = [...prev];
      copy[i] = e;
      return copy;
    });
    setStatus(d.persisted ? "נשמר ✓" : "נשמר (מצב דמו — לא נשמר לשרת)");
    setEditing(null);
    setTimeout(() => setStatus(""), 4000);
  }

  async function remove(id: string) {
    if (!confirm("למחוק את הקרב הזה?")) return;
    await fetch("/api/admin/battles", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setBattles((p) => p.filter((b) => b.id !== id));
  }

  return (
    <main className="min-h-dvh bg-void">
      {/* admin top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-void/90 px-5 py-3 backdrop-blur">
        <div className="flex items-center gap-3">
          <span className="grid h-8 w-8 place-items-center border border-line-strong font-mono text-xs text-bone tnum">
            13
          </span>
          <div>
            <h1 className="text-sm font-extrabold text-bone">לוח בקרה — ניהול קרבות</h1>
            <p className="font-mono text-[10px] tracking-wide text-faint">
              {persisted ? "מחובר · Supabase" : "מצב דמו · ללא שמירה"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {status && <span className="text-xs text-blood-glow">{status}</span>}
          <Link href="/map" className="text-xs text-muted hover:text-bone">
            למפה ↗
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-5 py-8">
        {source === "error" && (
          <div className="mb-6 border-2 border-blood-bright bg-blood/15 p-4">
            <p className="text-sm font-bold text-bone">
              ⚠ אין חיבור למסד הנתונים — הרשימה שלמטה אינה הנתונים שלכם
            </p>
            <p className="mt-2 text-sm text-bone/80">
              הקרבות שלכם <span className="font-bold">לא נמחקו</span> — פשוט לא הצלחנו
              לקרוא אותם. העריכה והשמירה חסומות כדי לא לדרוס נתונים. רעננו את הדף
              אחרי שהחיבור יחזור.
            </p>
            {loadError && (
              <p className="mt-2 font-mono text-[10px] text-blood-glow" dir="ltr">
                {loadError}
              </p>
            )}
          </div>
        )}

        {source === "seed" && (
          <div className="mb-6 border border-blood/40 bg-blood/[0.06] p-4 text-sm text-bone/80">
            מוצגים נתוני הדגמה מובנים (Supabase לא מוגדר) — אלה אינם הנתונים שלכם.
          </div>
        )}

        {!persisted && source === "db" && (
          <div className="mb-6 border border-blood/40 bg-blood/[0.06] p-4 text-sm text-bone/80">
            מצב דמו: הגדירו <span className="font-mono text-bone">SUPABASE_SERVICE_ROLE_KEY</span>{" "}
            ושאר משתני הסביבה כדי לשמור שינויים למסד הנתונים. כעת ניתן לערוך ולצפות
            בתוצאה מקומית.
          </div>
        )}

        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-bold text-bone">
            קרבות <span className="font-mono text-sm text-muted tnum">({battles.length})</span>
          </h2>
          <button
            onClick={() => setEditing(blank())}
            className="border border-line-strong bg-bone px-4 py-2 text-sm font-bold text-void hover:bg-white"
          >
            + קרב חדש
          </button>
        </div>

        {loading ? (
          <p className="animate-flicker text-muted">טוען…</p>
        ) : (
          <ul className="space-y-2">
            {battles.map((b) => (
              <li
                key={b.id}
                className="flex items-center justify-between gap-4 border border-line bg-surface/60 p-4"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] uppercase tracking-intel text-blood-bright">
                      {KIND_LABEL[b.kind]}
                    </span>
                    <span className="font-mono text-xs text-muted tnum">{b.time}</span>
                  </div>
                  <h3 className="truncate font-bold text-bone">{b.title || "(ללא שם)"}</h3>
                  <p className="truncate text-xs text-muted">
                    {b.locationName} · {b.fallen.length} נופלים · {b.timeline.length} אירועים
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    onClick={() => setEditing(structuredClone(b))}
                    className="border border-line px-3 py-1.5 text-xs text-bone hover:border-line-strong"
                  >
                    עריכה
                  </button>
                  <button
                    onClick={() => remove(b.id)}
                    className="border border-blood/50 px-3 py-1.5 text-xs text-blood-glow hover:bg-blood/10"
                  >
                    מחיקה
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {editing && (
        <Editor
          battle={editing}
          patch={patch}
          onCancel={() => setEditing(null)}
          onSave={save}
          setEditing={setEditing}
        />
      )}
    </main>
  );
}

// ── Editor drawer ─────────────────────────────────────────
function Editor({
  battle,
  patch,
  onCancel,
  onSave,
  setEditing,
}: {
  battle: Battle;
  patch: (p: Partial<Battle>) => void;
  onCancel: () => void;
  onSave: () => void;
  setEditing: React.Dispatch<React.SetStateAction<Battle | null>>;
}) {
  const upd = (fn: (b: Battle) => Battle) => setEditing((b) => (b ? fn(b) : b));
  // index of the timeline event whose movement path is being edited
  const [pathIdx, setPathIdx] = useState<number | null>(null);
  // whether the click-on-map location picker for the battle's own point is open
  const [pickingLoc, setPickingLoc] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-void/70 backdrop-blur-sm">
      <div className="flex h-full w-full max-w-2xl flex-col border-s border-line bg-void">
        <div className="flex shrink-0 items-center justify-between border-b border-line p-5">
          <h3 className="font-bold text-bone">עריכת קרב</h3>
          <div className="flex gap-2">
            <button onClick={onCancel} className="border border-line px-4 py-2 text-sm text-muted hover:text-bone">
              ביטול
            </button>
            <button onClick={onSave} className="border border-line-strong bg-bone px-4 py-2 text-sm font-bold text-void hover:bg-white">
              שמירה
            </button>
          </div>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto p-5">
          <Grid>
            <Field label="שם הקרב">
              <Input value={battle.title} onChange={(v) => patch({ title: v })} />
            </Field>
            <Field label="מסגרת / פלוגה">
              <Input value={battle.unit} onChange={(v) => patch({ unit: v })} />
            </Field>
            <Field label="סוג">
              <select
                value={battle.kind}
                onChange={(e) => patch({ kind: e.target.value as BattleKind })}
                className="w-full border border-line bg-surface px-3 py-2 text-sm text-bone focus:border-line-strong focus:outline-none"
              >
                {KINDS.map((k) => (
                  <option key={k} value={k}>
                    {KIND_LABEL[k]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="מיקום">
              <Input value={battle.locationName} onChange={(v) => patch({ locationName: v })} />
            </Field>
            <Field label="שעה (HH:MM)">
              <Input value={battle.time} onChange={(v) => patch({ time: v })} mono />
            </Field>
            <Field label="תאריך">
              <Input value={battle.date} onChange={(v) => patch({ date: v })} mono />
            </Field>
            <Field label="קו אורך (lng)">
              <Input
                value={String(battle.coordinates[0])}
                onChange={(v) => patch({ coordinates: [Number(v), battle.coordinates[1]] })}
                mono
              />
            </Field>
            <Field label="קו רוחב (lat)">
              <Input
                value={String(battle.coordinates[1])}
                onChange={(v) => patch({ coordinates: [battle.coordinates[0], Number(v)] })}
                mono
              />
            </Field>
          </Grid>

          {/* pick-on-map — the other half of "גם וגם"; keeps the manual inputs */}
          <button
            onClick={() => setPickingLoc(true)}
            className="flex w-full items-center justify-center gap-2 border border-line px-3 py-2 text-sm text-muted transition-colors hover:border-line-strong hover:text-bone"
          >
            <span className="h-1.5 w-1.5 rotate-45 bg-blood-bright" />
            בחירת מיקום על המפה
          </button>

          <Field label="תקציר (לשורת ה-hover)">
            <Input value={battle.summary} onChange={(v) => patch({ summary: v })} />
          </Field>
          <Field label="תיאור טקטי">
            <textarea
              value={battle.description}
              onChange={(e) => patch({ description: e.target.value })}
              rows={6}
              className="w-full resize-y border border-line bg-surface px-3 py-2 text-sm leading-relaxed text-bone focus:border-line-strong focus:outline-none"
            />
          </Field>

          {/* timeline editor */}
          <Repeater
            title="ציר זמן"
            items={battle.timeline}
            onAdd={() =>
              upd((b) => ({
                ...b,
                timeline: [...b.timeline, { id: uid(), time: "06:30", title: "", detail: "" }],
              }))
            }
            onRemove={(i) =>
              upd((b) => ({ ...b, timeline: b.timeline.filter((_, x) => x !== i) }))
            }
            render={(t: TimelineEvent, i) => (
              <div className="space-y-2">
                <div className="grid grid-cols-[72px_72px_1fr] gap-2">
                  <Input
                    value={t.time}
                    mono
                    placeholder="התחלה"
                    onChange={(v) =>
                      upd((b) => {
                        const tl = [...b.timeline];
                        tl[i] = { ...tl[i], time: v };
                        return { ...b, timeline: tl };
                      })
                    }
                  />
                  <Input
                    value={t.endTime ?? ""}
                    mono
                    placeholder="סיום"
                    onChange={(v) =>
                      upd((b) => {
                        const tl = [...b.timeline];
                        tl[i] = { ...tl[i], endTime: v || undefined };
                        return { ...b, timeline: tl };
                      })
                    }
                  />
                  <Input
                    value={t.title}
                    placeholder="כותרת אירוע"
                    onChange={(v) =>
                      upd((b) => {
                        const tl = [...b.timeline];
                        tl[i] = { ...tl[i], title: v };
                        return { ...b, timeline: tl };
                      })
                    }
                  />
                </div>
                <button
                  onClick={() => setPathIdx(i)}
                  className="flex items-center gap-2 border border-line px-3 py-1.5 text-xs text-muted transition-colors hover:border-line-strong hover:text-bone"
                >
                  <span
                    className={
                      "h-1.5 w-1.5 rotate-45 " +
                      ((t.path?.length ?? 0) > 0 ? "bg-blood-bright" : "bg-faint")
                    }
                  />
                  עריכת תנועה
                  {(t.path?.length ?? 0) > 0 && (
                    <span className="font-mono text-[10px] text-blood-bright tnum">
                      {t.path!.length} נק׳
                    </span>
                  )}
                </button>
              </div>
            )}
          />

          {/* fallen editor */}
          <Repeater
            title="נופלים"
            items={battle.fallen}
            onAdd={() =>
              upd((b) => ({
                ...b,
                fallen: [
                  ...b.fallen,
                  { id: uid(), fullName: "", rank: "", age: 20, memorial: "" } as Soldier,
                ],
              }))
            }
            onRemove={(i) => upd((b) => ({ ...b, fallen: b.fallen.filter((_, x) => x !== i) }))}
            render={(s: Soldier, i) => {
              const set = (p: Partial<Soldier>) =>
                upd((b) => {
                  const f = [...b.fallen];
                  f[i] = { ...f[i], ...p };
                  return { ...b, fallen: f };
                });
              return (
                <div className="space-y-2">
                  <div className="grid grid-cols-[1fr_90px_70px] gap-2">
                    <Input value={s.fullName} placeholder="שם מלא" onChange={(v) => set({ fullName: v })} />
                    <Input value={s.rank} placeholder="דרגה" onChange={(v) => set({ rank: v })} />
                    <Input
                      value={String(s.age)}
                      mono
                      placeholder="גיל"
                      onChange={(v) => set({ age: Number(v) || 0 })}
                    />
                  </div>
                  <div className="grid grid-cols-[1fr_1fr] gap-2">
                    <select
                      value={s.affiliation ?? ""}
                      onChange={(e) =>
                        set({ affiliation: (e.target.value || undefined) as Affiliation | undefined })
                      }
                      className="border border-line bg-surface px-2 py-2 text-sm text-bone focus:border-line-strong focus:outline-none"
                    >
                      <option value="">— שיוך —</option>
                      {AFFILIATIONS.map((a) => (
                        <option key={a} value={a}>
                          {AFFILIATION_LABEL[a]}
                        </option>
                      ))}
                    </select>
                    <Input
                      value={s.hometown ?? ""}
                      placeholder="עיר מגורים"
                      onChange={(v) => set({ hometown: v })}
                    />
                  </div>
                  <Input
                    value={s.memorial}
                    placeholder="טקסט הנצחה קצר"
                    onChange={(v) => set({ memorial: v })}
                  />
                  <div className="flex items-center gap-3">
                    {s.photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={s.photo}
                        alt=""
                        className="h-14 w-14 shrink-0 border border-line object-cover"
                      />
                    ) : (
                      <div className="grid h-14 w-14 shrink-0 place-items-center border border-dashed border-line text-[10px] text-faint">
                        ללא
                      </div>
                    )}
                    <UploadButton
                      accept="image/*"
                      folder="fallen"
                      label="העלאת תמונה"
                      onUploaded={(url) => set({ photo: url })}
                    />
                  </div>
                </div>
              );
            }}
          />

          {/* media editor */}
          <Repeater
            title="מדיה (תמונות / וידאו / רחפן / אודיו / קשר)"
            items={battle.media}
            onAdd={() =>
              upd((b) => ({
                ...b,
                media: [...b.media, { id: uid(), kind: "image", url: "", caption: "" } as Media],
              }))
            }
            onRemove={(i) => upd((b) => ({ ...b, media: b.media.filter((_, x) => x !== i) }))}
            render={(m: Media, i) => {
              const set = (p: Partial<Media>) =>
                upd((b) => {
                  const md = [...b.media];
                  md[i] = { ...md[i], ...p };
                  return { ...b, media: md };
                });
              return (
                <div className="space-y-2">
                  <div className="grid grid-cols-[110px_1fr_auto] items-center gap-2">
                    <select
                      value={m.kind}
                      onChange={(e) => set({ kind: e.target.value as MediaKind })}
                      className="border border-line bg-surface px-2 py-2 text-sm text-bone focus:outline-none"
                    >
                      {MEDIA_KINDS.map((k) => (
                        <option key={k} value={k}>
                          {k}
                        </option>
                      ))}
                    </select>
                    <Input value={m.url} placeholder="URL (או העלו קובץ)" onChange={(v) => set({ url: v })} mono />
                    <UploadButton
                      accept="image/*,video/*,audio/*"
                      folder="media"
                      label="העלאת קובץ"
                      onUploaded={(url, file) => set({ url, kind: kindFromMime(file.type) })}
                    />
                  </div>
                  {m.url && (
                    <p className="truncate font-mono text-[10px] text-faint" dir="ltr">
                      {m.url}
                    </p>
                  )}
                </div>
              );
            }}
          />
        </div>
      </div>

      {pickingLoc && (
        <LocationPicker
          initial={battle.coordinates}
          title={battle.title}
          onClose={() => setPickingLoc(false)}
          onSave={(c) => {
            patch({ coordinates: c });
            setPickingLoc(false);
          }}
        />
      )}

      {pathIdx !== null && battle.timeline[pathIdx] && (
        <PathEditor
          battle={battle}
          event={battle.timeline[pathIdx]}
          onClose={() => setPathIdx(null)}
          onSave={(path: Waypoint[]) => {
            upd((b) => {
              const tl = [...b.timeline];
              tl[pathIdx] = {
                ...tl[pathIdx],
                path: path.length ? path : undefined,
              };
              return { ...b, timeline: tl };
            });
            setPathIdx(null);
          }}
        />
      )}
    </div>
  );
}

// Uploads a chosen file to our Storage bucket via /api/admin/upload and returns
// the public URL to the caller. Keeps everything inside the site — no manual
// Supabase work.
function UploadButton({
  accept,
  folder,
  label,
  onUploaded,
}: {
  accept: string;
  folder: string;
  label: string;
  onUploaded: (url: string, file: File) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  return (
    <label
      className={
        "flex cursor-pointer items-center gap-2 whitespace-nowrap border px-3 py-2 text-xs transition-colors " +
        (busy
          ? "border-line text-faint"
          : "border-line text-muted hover:border-line-strong hover:text-bone")
      }
      title={err || undefined}
    >
      <span className="h-1.5 w-1.5 rotate-45 bg-blood-bright" />
      {busy ? "מעלה…" : err ? "נכשל — נסו שוב" : label}
      <input
        type="file"
        accept={accept}
        disabled={busy}
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = ""; // allow re-selecting the same file
          if (!file) return;
          setErr("");
          setBusy(true);
          try {
            const fd = new FormData();
            fd.append("file", file);
            fd.append("folder", folder);
            const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
            const d = await res.json();
            if (d.ok && d.url) onUploaded(d.url, file);
            else setErr(d.error || "העלאה נכשלה");
          } catch {
            setErr("העלאה נכשלה");
          } finally {
            setBusy(false);
          }
        }}
      />
    </label>
  );
}

// ── tiny form primitives ──────────────────────────────────
function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-4">{children}</div>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-mono text-[10px] tracking-wide text-faint">
        {label}
      </span>
      {children}
    </label>
  );
}
function Input({
  value,
  onChange,
  placeholder,
  mono,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  mono?: boolean;
}) {
  return (
    <input
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={
        "w-full border border-line bg-surface px-3 py-2 text-sm text-bone placeholder:text-faint focus:border-line-strong focus:outline-none " +
        (mono ? "font-mono tnum" : "")
      }
    />
  );
}
function Repeater<T>({
  title,
  items,
  render,
  onAdd,
  onRemove,
}: {
  title: string;
  items: T[];
  render: (item: T, i: number) => React.ReactNode;
  onAdd: () => void;
  onRemove: (i: number) => void;
}) {
  return (
    <div className="border-t border-line pt-5">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-sm font-bold text-bone">{title}</h4>
        <button onClick={onAdd} className="border border-line px-3 py-1 text-xs text-bone hover:border-line-strong">
          + הוספה
        </button>
      </div>
      <div className="space-y-3">
        {items.map((it, i) => (
          <div key={i} className="flex items-start gap-2">
            <div className="flex-1">{render(it, i)}</div>
            <button
              onClick={() => onRemove(i)}
              aria-label="הסרה"
              className="mt-1 grid h-8 w-8 shrink-0 place-items-center border border-blood/40 text-blood-glow hover:bg-blood/10"
            >
              ✕
            </button>
          </div>
        ))}
        {items.length === 0 && <p className="text-xs text-faint">אין פריטים עדיין.</p>}
      </div>
    </div>
  );
}
