"use client";

import { useEffect, useRef } from "react";
import { Battle, fromMinutes } from "@/lib/types";

interface Props {
  battles: Battle[];
  minute: number;
  setMinute: (m: number) => void;
  playing: boolean;
  setPlaying: (p: boolean) => void;
  range: [number, number];
}

// Cinematic bottom scrubber for the Oct-7 replay. As `minute` advances the
// parent reveals battles whose start time has passed.
export default function TimelineSlider({
  battles,
  minute,
  setMinute,
  playing,
  setPlaying,
  range,
}: Props) {
  const [min, max] = range;
  const raf = useRef<number | null>(null);
  const last = useRef<number>(0);

  useEffect(() => {
    if (!playing) {
      if (raf.current) cancelAnimationFrame(raf.current);
      return;
    }
    const step = (ts: number) => {
      if (!last.current) last.current = ts;
      const dt = ts - last.current;
      last.current = ts;
      // 1 real second ≈ 12 battle-minutes
      setMinute(Math.min(max, minute + (dt / 1000) * 12));
      if (minute >= max) {
        setPlaying(false);
        return;
      }
      raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
      last.current = 0;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, minute]);

  const pct = ((minute - min) / (max - min)) * 100;

  return (
    <div className="pointer-events-auto absolute inset-x-0 bottom-0 z-30 border-t border-line bg-gradient-to-t from-void via-void/95 to-transparent px-4 pb-5 pt-8 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setPlaying(!playing)}
              aria-label={playing ? "השהה שחזור" : "הפעל שחזור"}
              className={
                "grid h-11 w-11 place-items-center border bg-surface transition-all hover:border-blood-bright hover:text-blood-glow " +
                (playing
                  ? "border-blood-bright text-blood-glow shadow-[0_0_18px_rgba(185,28,28,0.5)]"
                  : "border-line-strong text-bone")
              }
            >
              {playing ? "❚❚" : "►"}
            </button>
            <div>
              <p className="eyebrow text-faint">שחזור — 7 באוקטובר</p>
              <p className="font-mono text-2xl font-semibold text-bone">
                <span className="tnum">{fromMinutes(minute)}</span>
              </p>
            </div>
          </div>
          <p className="text-xs text-muted">
            <span className="font-mono tnum">
              {battles.filter((b) => b.startMinute <= minute).length}/{battles.length}
            </span>{" "}
            מוקדים פעילים
          </p>
        </div>

        {/* track */}
        <div className="relative h-10">
          <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-line" />
          <div
            className="absolute top-1/2 h-px -translate-y-1/2 bg-blood-bright"
            style={{ insetInlineStart: 0, width: `${pct}%` }}
          />
          {/* battle ticks */}
          {battles.map((b) => {
            const p = ((b.startMinute - min) / (max - min)) * 100;
            const reached = b.startMinute <= minute;
            return (
              <button
                key={b.id}
                title={`${fromMinutes(b.startMinute)} · ${b.title}`}
                onClick={() => setMinute(b.startMinute)}
                className="group absolute top-1/2 -translate-y-1/2"
                style={{ insetInlineStart: `${p}%` }}
                aria-label={`${b.title} בשעה ${fromMinutes(b.startMinute)}`}
              >
                <span
                  className={
                    "block h-3 w-3 -translate-x-1/2 rotate-45 border transition-all duration-300 " +
                    (reached
                      ? "scale-110 border-blood-bright bg-blood-bright shadow-[0_0_10px_rgba(185,28,28,0.75)]"
                      : "border-faint bg-void group-hover:border-bone")
                  }
                />
              </button>
            );
          })}
          {/* scrubber — dir=rtl so the thumb starts on the right (06:29) and
              advances leftward, matching the RTL track + ticks. */}
          <input
            type="range"
            dir="rtl"
            min={min}
            max={max}
            step={1}
            value={minute}
            onChange={(e) => {
              setPlaying(false);
              setMinute(Number(e.target.value));
            }}
            aria-label="גרירת ציר הזמן"
            className="absolute inset-0 w-full cursor-pointer appearance-none bg-transparent
              [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:w-1.5 [&::-webkit-slider-thumb]:appearance-none
              [&::-webkit-slider-thumb]:bg-bone [&::-webkit-slider-thumb]:shadow-[0_0_14px_rgba(185,28,28,0.7)]
              [&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:w-1.5 [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-bone"
          />
        </div>

        {/* RTL row: start (06:29) on the right, end on the left */}
        <div className="mt-1 flex justify-between font-mono text-[10px] text-faint">
          <span className="tnum">{fromMinutes(min)}</span>
          <span className="tnum">{fromMinutes(max)}</span>
        </div>
      </div>
    </div>
  );
}
