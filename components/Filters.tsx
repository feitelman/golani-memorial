"use client";

import { motion } from "framer-motion";
import { BattleKind, KIND_LABEL } from "@/lib/types";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05, delayChildren: 0.1 } },
};
const chip = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
};

const KINDS: BattleKind[] = ["battle", "ambush", "rescue"];

export default function Filters({
  active,
  toggle,
  counts,
}: {
  active: Set<BattleKind>;
  toggle: (k: BattleKind) => void;
  counts: Record<BattleKind, number>;
}) {
  return (
    <motion.div
      className="pointer-events-auto flex flex-wrap gap-2"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {KINDS.map((k) => {
        const on = active.has(k);
        const n = counts[k] ?? 0;
        return (
          <motion.button
            key={k}
            variants={chip}
            onClick={() => toggle(k)}
            aria-pressed={on}
            disabled={n === 0}
            whileHover={n > 0 ? { y: -2 } : undefined}
            whileTap={n > 0 ? { scale: 0.96 } : undefined}
            className={
              "flex items-center gap-2 border px-3 py-1.5 text-xs transition-colors disabled:opacity-30 " +
              (on
                ? "border-line-strong bg-bone text-void"
                : "border-line bg-void/70 text-muted backdrop-blur hover:text-bone")
            }
          >
            <span
              className={
                "h-1.5 w-1.5 rotate-45 transition-colors " +
                (on ? "bg-blood-bright" : "bg-faint")
              }
            />
            {KIND_LABEL[k]}
            <span className="font-mono text-[10px] opacity-70 tnum">{n}</span>
          </motion.button>
        );
      })}
    </motion.div>
  );
}
