"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import type { Soldier } from "@/lib/types";

/** How long the fallen float past before the deployment begins. */
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

/**
 * Every fallen soldier's portrait, floating on a tilted plane that drifts
 * slowly past the camera — after "רבים מהם לא שבו", before the map.
 * Mounted (not playing) during the story so the photos are already loaded.
 */
export default function FallenDrift({ fallen, playing }: { fallen: Soldier[]; playing: boolean }) {
  const appear = useMemo(() => scatter(fallen), [fallen]);
  const span = 7.5; // seconds over which all portraits fade in

  return (
    <div className="absolute inset-0 overflow-hidden bg-void" style={{ perspective: "1400px" }}>
      {/* the floating plane (centred by the wrapper; framer owns the inner transform) */}
      <div className="absolute left-1/2 top-1/2 w-[150vw] -translate-x-1/2 -translate-y-1/2 sm:w-[118vw]" style={{ transformStyle: "preserve-3d" }}>
      <motion.div
        initial={{ y: "6%", scale: 1.12, rotateX: 24, rotateZ: -5 }}
        animate={playing ? { y: "-10%", scale: 1.0, rotateX: 18, rotateZ: -3 } : undefined}
        transition={{ duration: FALLEN_MS / 1000 + 2, ease: "linear" }}
        className="grid grid-cols-6 gap-x-5 gap-y-7 sm:grid-cols-10 sm:gap-x-7 sm:gap-y-9"
        style={{ transformStyle: "preserve-3d" }}
      >
        {fallen.map((s, i) => (
          <motion.figure
            key={s.id}
            initial={{ opacity: 0, y: 14 }}
            animate={playing ? { opacity: 1, y: 0 } : undefined}
            transition={{ delay: 0.4 + (appear[i] / Math.max(1, fallen.length)) * span, duration: 1.4, ease: "easeOut" }}
            className="flex flex-col items-center"
          >
            {/* each portrait bobs gently on its own rhythm */}
            <div
              className="fallen-float flex w-full flex-col items-center"
              style={{ animationDelay: `${-(i % 7) * 0.9}s`, animationDuration: `${6 + (i % 5)}s` }}
            >
            <div className="aspect-[4/5] w-full overflow-hidden border border-line bg-elevated shadow-[0_10px_30px_rgba(0,0,0,0.6)]">
              {s.photo && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={s.photo} alt="" className="h-full w-full object-cover grayscale" />
              )}
            </div>
            <figcaption className="mt-2 text-center leading-tight">
              <span className="block text-[11px] font-bold text-bone sm:text-sm">{s.fullName}</span>
              <span className="block font-mono text-[8px] text-faint sm:text-[10px]">{s.rank}</span>
            </figcaption>
            </div>
          </motion.figure>
        ))}
      </motion.div>
      </div>

      {/* soft vignette so the plane dissolves into black at the edges */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 62% at 50% 50%, transparent 35%, rgba(10,10,11,0.85) 72%, #0A0A0B 100%)",
        }}
      />

      {/* dedication */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={playing ? { opacity: 1 } : undefined}
        transition={{ delay: 1.2, duration: 1.6 }}
        className="pointer-events-none absolute inset-x-0 bottom-20 px-6 text-center sm:bottom-24"
      >
        <span className="block font-mono text-[11px] tracking-[0.3em] text-blood-bright">לזכרם</span>
        <span className="mt-2 block text-balance text-lg font-bold text-bone drop-shadow-[0_2px_12px_rgba(0,0,0,0.95)] sm:text-2xl">
          לוחמי ולוחמות גדוד 13 וצוות הקרב הגדודי
        </span>
      </motion.p>
    </div>
  );
}
