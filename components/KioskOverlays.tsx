"use client";

import { AnimatePresence, motion } from "framer-motion";
import { fromMinutes, type Soldier } from "@/lib/types";

// Full-screen layers for the ceremony / display mode (/map?mode=kiosk):
// a start screen, a title card before each location, the names of that
// location's fallen after its tour, and a closing card before the loop restarts.

const fade = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 1.2, ease: "easeInOut" as const },
};

const Logo = ({ className = "" }: { className?: string }) => (
  // eslint-disable-next-line @next/next/no-img-element
  <img
    src="/logo-badrachei-tomer.png"
    alt="בדרכי תומר — לזכרו של סא״ל תומר גרינברג ז״ל"
    className={"[filter:invert(1)_hue-rotate(180deg)] " + className}
  />
);

export type KioskCard =
  | { kind: "start" }
  | { kind: "intro"; name: string; stations: number; fallen: number }
  | { kind: "names"; name: string; fallen: Soldier[] }
  | { kind: "outro" };

export function KioskLayer({ card, onStart }: { card: KioskCard | null; onStart: () => void }) {
  return (
    // Cross-fade (not "wait"): a card that is still fading out never holds up the next.
    <AnimatePresence>
      {card && (
        <motion.div
          key={card.kind + ("name" in card ? card.name : "")}
          {...fade}
          className={
            "absolute inset-0 z-[70] flex items-center justify-center bg-void px-8 text-center " +
            (card.kind === "start" ? "" : "pointer-events-none")
          }
        >
          {card.kind === "start" && (
            <div className="flex flex-col items-center">
              <Logo className="w-56 opacity-90" />
              <p className="mt-10 font-mono text-xs tracking-wide text-blood-bright">מצב טקס</p>
              <h1 className="mt-3 text-4xl font-black text-bone sm:text-5xl">
                גדוד 13, חטיבת גולני · 7 באוקטובר
              </h1>
              <p className="mt-4 max-w-md text-muted">
                הסיור ירוץ לבד, בלולאה. ליציאה — מקש Esc.
              </p>
              <button
                onClick={onStart}
                className="mt-10 border border-line-strong bg-bone px-8 py-4 text-lg font-bold text-void transition-colors hover:bg-white"
              >
                הפעלה במסך מלא
              </button>
            </div>
          )}

          {card.kind === "intro" && (
            <div>
              <p className="font-mono text-sm tracking-[0.3em] text-blood-bright">7.10.2023</p>
              <h2 className="mt-6 text-6xl font-black text-bone sm:text-7xl">{card.name}</h2>
              <p className="mt-6 text-lg text-muted">
                {card.stations} מוקדי לחימה
                {card.fallen > 0 && <> · {card.fallen} נופלים</>}
              </p>
              <div className="mx-auto mt-10 h-16 w-px bg-gradient-to-b from-blood-bright to-transparent" />
            </div>
          )}

          {card.kind === "names" && <Names name={card.name} fallen={card.fallen} />}

          {card.kind === "outro" && (
            <div className="flex flex-col items-center">
              <Logo className="w-64 opacity-90" />
              <p className="mt-12 text-3xl font-black text-bone sm:text-4xl">יהי זכרם ברוך</p>
              <p className="mt-4 text-muted">
                לזכר לוחמי גדוד 13, חטיבת גולני ולוחמי צוות הקרב הגדודי שנפלו ב-7 באוקטובר
              </p>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** The fallen of one location, revealed one after another. */
function Names({ name, fallen }: { name: string; fallen: Soldier[] }) {
  // Many names (Nahal Oz has 53) → smaller cards, more columns.
  const dense = fallen.length > 24;
  return (
    <div className="flex max-h-full w-full max-w-7xl flex-col items-center py-10">
      <p className="font-mono text-sm tracking-wide text-blood-bright">לזכר הנופלים</p>
      <h2 className="mt-3 text-4xl font-black text-bone sm:text-5xl">{name}</h2>
      <div
        className={
          "grid w-full gap-x-4 " + (dense ? "mt-6 gap-y-3 " : "mt-10 gap-y-5 ") +
          (dense ? "grid-cols-6 sm:grid-cols-9 lg:grid-cols-11" : "grid-cols-3 sm:grid-cols-5 lg:grid-cols-6")
        }
      >
        {fallen.map((s, i) => (
          <motion.div
            key={s.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 + i * (dense ? 0.09 : 0.18), duration: 0.6 }}
            className="flex flex-col items-center"
          >
            <div
              className={"overflow-hidden border border-line bg-elevated " + (dense ? "" : "h-28 w-[5.5rem] sm:h-32 sm:w-24")}
              // dense grids scale with the screen height so every name fits
              style={dense ? { height: "min(5rem, 8vh)", width: "min(3.75rem, 6vh)" } : undefined}
            >
              {s.photo && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={s.photo} alt="" className="h-full w-full object-cover grayscale" />
              )}
            </div>
            <p className={"mt-2 font-bold leading-tight text-bone " + (dense ? "text-[11px]" : "text-sm")}>
              {s.fullName}
            </p>
            <p className="font-mono text-[9px] text-faint">{s.rank}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/** Minimal clock that replaces the timeline scrubber in kiosk mode. */
export function KioskClock({ minute }: { minute: number }) {
  return (
    <div className="pointer-events-none absolute bottom-6 right-6 z-[55] border border-line bg-void/80 px-5 py-3 text-right backdrop-blur sm:bottom-8 sm:right-8">
      <p className="eyebrow text-faint">7 באוקטובר 2023</p>
      <p className="font-mono text-4xl font-semibold text-bone">
        <span className="tnum">{fromMinutes(minute)}</span>
      </p>
    </div>
  );
}
