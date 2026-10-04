"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Battle, MEDIA_ICON, MEDIA_LABEL, Media } from "@/lib/types";

export type Moment = { media: Media; battle: Battle; t: number };

// How long a moment stays up on its own. Interacting with it keeps it open.
const SHOW_MS = 12000;

/**
 * A recording / photo surfacing at the minute it was made, as the replay clock
 * passes it (the Forensic-Architecture idea: media synced to the timeline).
 * Recordings never autoplay — the viewer presses play.
 */
export default function MediaMoment({
  moment,
  onClose,
  onOpenBattle,
}: {
  moment: Moment | null;
  onClose: () => void;
  /** open the battle's panel (free mode only) */
  onOpenBattle?: (b: Battle) => void;
}) {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const timer = useRef<ReturnType<typeof setTimeout>>();

  // Auto-dismiss after a while; any interaction (a tap, pressing play) keeps it
  // open until ✕.
  useEffect(() => {
    if (!moment) return;
    timer.current = setTimeout(() => closeRef.current(), SHOW_MS);
    return () => clearTimeout(timer.current);
  }, [moment]);
  const keep = () => clearTimeout(timer.current);

  const m = moment?.media;
  const visual = m && (m.kind === "image" || m.kind === "drone");
  const sound = m && (m.kind === "audio" || m.kind === "radio");

  return (
    <AnimatePresence>
      {moment && m && (
        <motion.aside
          key={m.id}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          onPointerDown={keep}
          className="pointer-events-auto absolute bottom-40 right-4 z-[55] w-[min(20rem,calc(100vw-2rem))] border border-blood-bright/60 bg-void/95 shadow-2xl backdrop-blur sm:right-8"
          role="status"
          aria-live="polite"
        >
          <div className="flex items-center justify-between gap-2 border-b border-line px-3 py-2">
            <p className="flex items-center gap-2 font-mono text-[10px] text-blood-bright">
              <span className="animate-pulse-blood inline-block h-1.5 w-1.5 rounded-full bg-blood-bright" />
              <span className="tnum">{m.atTime}</span> · {MEDIA_ICON[m.kind]} {MEDIA_LABEL[m.kind]}
            </p>
            <button onClick={onClose} aria-label="סגירה" className="text-xs text-muted hover:text-bone">
              ✕
            </button>
          </div>

          {visual && m.url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={m.url} alt={m.caption ?? ""} className="aspect-video w-full object-cover grayscale" />
          )}
          {m.kind === "video" && m.url && (
            <video src={m.url} controls preload="none" className="aspect-video w-full bg-black" />
          )}

          <div className="space-y-2 p-3">
            {m.caption && <p className="text-sm leading-snug text-bone">{m.caption}</p>}
            <p className="text-[11px] text-muted">{moment.battle.title}</p>
            {sound && (
              <audio src={m.url} controls preload="none" className="h-9 w-full" dir="ltr" onPlay={keep} />
            )}
            {onOpenBattle && (
              <button
                onClick={() => onOpenBattle(moment.battle)}
                className="text-[11px] font-semibold text-blood-glow hover:underline"
              >
                לפרטי הקרב ←
              </button>
            )}
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
