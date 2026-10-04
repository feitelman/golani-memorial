"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { Soldier } from "@/lib/types";
import FallenDrift, { FALLEN_MS } from "./FallenDrift";

export { FALLEN_MS };

// Text layer of the map's opening sequence. Step 0 is the short story on black,
// 1 the fallen floating past; 2–5 play over the deployment drawn on the map
// (BattleMap); 6 leaves.

const STORY: { text: string; strong?: boolean }[] = [
  { text: "שבת, 7 באוקטובר 2023. שמחת תורה.", strong: true },
  {
    text: "גדוד 13 של חטיבת גולני החזיק את קו הגבול מול צפון רצועת עזה — מפגה ובארי בדרום, דרך נחל עוז, ועד מעבר ארז וזיקים בצפון.",
  },
  { text: "בשעה 06:29, עם הזריחה, פתח חמאס במתקפת פתע." },
  { text: "לוחמי הגדוד וצוות הקרב נלחמו במוצבים, במחנות וביישובים — רבים מהם לא שבו." },
];
/** Seconds between story lines (the story step lasts STORY_MS). */
const LINE_GAP = 2.6;
export const STORY_MS = (STORY.length * LINE_GAP + 2.4) * 1000;

export default function IntroOverlay({
  step,
  fallen,
  onNext,
  onSkip,
}: {
  step: number;
  fallen: Soldier[];
  onNext: () => void;
  onSkip: () => void;
}) {
  return (
    <div
      className={"absolute inset-0 z-[60] " + (step >= 6 ? "pointer-events-none" : "cursor-pointer")}
      onClick={onNext}
    >
      {/* the story, on black */}
      <AnimatePresence>
        {step === 0 && (
          <motion.div
            key="story"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.6, ease: "easeInOut" }}
            className="absolute inset-0 flex items-center justify-center bg-void px-6"
          >
            <div className="max-w-2xl space-y-6 text-center">
              {STORY.map((l, i) => (
                <motion.p
                  key={i}
                  initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  transition={{ delay: 0.6 + i * LINE_GAP, duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                  className={
                    l.strong
                      ? "text-2xl font-black text-bone sm:text-3xl"
                      : "text-balance text-lg leading-relaxed text-bone/80 sm:text-xl"
                  }
                >
                  {l.text}
                </motion.p>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* the fallen — mounted (hidden) during the story so the photos preload */}
      <AnimatePresence>
        {step <= 1 && (
          <motion.div
            key="fallen"
            exit={{ opacity: 0 }}
            transition={{ duration: 1.8, ease: "easeInOut" }}
            className={"absolute inset-0 " + (step === 0 ? "invisible" : "")}
          >
            <FallenDrift fallen={fallen} playing={step === 1} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* title over the deployment */}
      <AnimatePresence>
        {step >= 2 && step <= 5 && (
          <motion.div
            key="title"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, delay: step === 2 ? 0.8 : 0 }}
            className="pointer-events-none absolute inset-x-0 top-6 flex flex-col items-center px-4 text-center sm:top-10"
          >
            <p className="font-mono text-[11px] tracking-[0.25em] text-blood-bright">07.10.2023 · 06:29</p>
            <h2 className="mt-2 text-balance text-2xl font-black text-bone drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)] sm:text-4xl">
              כך נפרס הגדוד בבוקר 7 באוקטובר
            </h2>
          </motion.div>
        )}
      </AnimatePresence>

      {/* legend */}
      <AnimatePresence>
        {step >= 3 && step <= 5 && (
          <motion.ul
            key="legend"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="pointer-events-none absolute bottom-24 right-4 space-y-1.5 border border-line bg-void/80 px-4 py-3 text-[11px] text-muted backdrop-blur sm:bottom-8 sm:right-8"
          >
            <li className="flex items-center gap-2">
              <span className="h-0.5 w-5 bg-blood-glow" /> קו הגבול
            </li>
            <li className="flex items-center gap-2">
              <span className="h-px w-5 bg-bone" /> גבול גזרה
            </li>
            <li className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full border border-blue-300 bg-blue-500/40" /> יישוב
            </li>
            <li className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-blood-glow" /> מוצב / מחנה של הגדוד
            </li>
          </motion.ul>
        )}
      </AnimatePresence>

      {/* skip — always available */}
      {step < 6 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSkip();
          }}
          className="absolute bottom-6 left-4 border border-line bg-void/80 px-4 py-2 text-sm text-muted backdrop-blur transition-colors hover:border-line-strong hover:text-bone sm:bottom-8 sm:left-8"
        >
          דלג למפה ←
        </button>
      )}
    </div>
  );
}
