"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { Soldier } from "@/lib/types";

/** How long the fallen are shown before the deployment begins. */
export const FALLEN_MS = 16000;

// A deterministic shuffle so the portraits appear in a scattered (not row by
// row) order that is the same on every visit.
function scatter<T>(items: T[]): number[] {
  const order = items.map((_, i) => i);
  let seed = 7;
  for (let i = order.length - 1; i > 0; i--) {
    seed = (seed * 9301 + 49297) % 233280;
    const j = Math.floor((seed / 233280) * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  const rank = new Array(items.length);
  order.forEach((idx, k) => (rank[idx] = k));
  return rank;
}

const GAP = 10; // px between portraits
const NAME_H = 30; // px reserved under a portrait for name + rank
const MIN_NAMED = 64; // below this portrait width the names are left out

/**
 * The largest grid in which ALL portraits fit the area at once (4:5 photos,
 * with names under them when there is room).
 */
function fitGrid(n: number, w: number, h: number) {
  const fit = (named: boolean) => {
    let best = { cols: 1, cell: 0, named };
    for (let cols = 1; cols <= n; cols++) {
      const rows = Math.ceil(n / cols);
      const cellW = (w - GAP * (cols - 1)) / cols;
      const cellH = cellW * 1.25 + (named ? NAME_H : 0);
      if (rows * cellH + GAP * (rows - 1) <= h && cellW > best.cell) best = { cols, cell: cellW, named };
    }
    return best;
  };
  // Names matter: show them whenever the portraits can still be a fair size.
  const named = fit(true);
  return named.cell >= MIN_NAMED ? named : fit(false);
}

/**
 * Every fallen soldier's portrait, all on screen together — after "רבים מהם לא
 * שבו", before the map. Mounted (not playing) during the story so the photos
 * are already loaded.
 */
export default function FallenDrift({ fallen, playing }: { fallen: Soldier[]; playing: boolean }) {
  const appear = useMemo(() => scatter(fallen), [fallen]);
  const areaRef = useRef<HTMLDivElement>(null);
  const [grid, setGrid] = useState({ cols: 10, cell: 80, named: true });
  const span = 6; // seconds over which all portraits fade in

  useEffect(() => {
    const el = areaRef.current;
    if (!el) return;
    const fit = () => setGrid(fitGrid(fallen.length, el.clientWidth, el.clientHeight));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [fallen.length]);

  return (
    <div className="absolute inset-0 flex flex-col bg-void px-4 pb-20 pt-8 sm:px-10 sm:pb-20 sm:pt-10">
      {/* dedication */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={playing ? { opacity: 1, y: 0 } : undefined}
        transition={{ duration: 1.4 }}
        className="shrink-0 text-center"
      >
        <p className="font-mono text-[11px] tracking-[0.3em] text-blood-bright">לזכרם</p>
        <p className="mt-2 text-balance text-lg font-bold text-bone sm:text-2xl">
          לוחמי ולוחמות גדוד 13 וצוות הקרב הגדודי
        </p>
      </motion.div>

      {/* all of them, sized so everyone fits */}
      <div ref={areaRef} className="mt-6 flex min-h-0 flex-1 items-center justify-center">
        <motion.div
          initial={{ scale: 1.03 }}
          animate={playing ? { scale: 1 } : undefined}
          transition={{ duration: FALLEN_MS / 1000, ease: "linear" }}
          // wrapping rows (last row centred), exactly `cols` portraits wide
          className="flex flex-wrap justify-center"
          style={{ width: grid.cols * grid.cell + (grid.cols - 1) * GAP + 1, gap: GAP }}
        >
          {fallen.map((s, i) => (
            <motion.figure
              key={s.id}
              style={{ width: grid.cell }}
              initial={{ opacity: 0, y: 8 }}
              animate={playing ? { opacity: 1, y: 0 } : undefined}
              transition={{ delay: 0.5 + (appear[i] / Math.max(1, fallen.length)) * span, duration: 1.2, ease: "easeOut" }}
            >
              {/* each portrait bobs gently on its own rhythm */}
              <div
                className="fallen-float"
                style={{ animationDelay: `${-(i % 7) * 0.9}s`, animationDuration: `${6 + (i % 5)}s` }}
              >
                <div className="aspect-[4/5] w-full overflow-hidden border border-line bg-elevated">
                  {s.photo && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={s.photo} alt={s.fullName} className="h-full w-full object-cover grayscale" />
                  )}
                </div>
                {grid.named && (
                  <figcaption className="mt-1 text-center leading-tight" style={{ height: NAME_H - 4 }}>
                    <span className="block truncate text-[10px] font-bold text-bone sm:text-[11px]">{s.fullName}</span>
                    <span className="block font-mono text-[8px] text-faint">{s.rank}</span>
                  </figcaption>
                )}
              </div>
            </motion.figure>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
