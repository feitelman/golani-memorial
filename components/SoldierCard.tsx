"use client";

import { Soldier } from "@/lib/types";

export default function SoldierCard({ s }: { s: Soldier }) {
  const initials = s.fullName
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0])
    .join("");

  return (
    <article className="reticle-frame group flex gap-4 border border-line bg-surface/60 p-4 transition-colors hover:border-line-strong">
      <div className="relative h-20 w-16 shrink-0 overflow-hidden border border-line bg-elevated">
        {s.photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={s.photo}
            alt={s.fullName}
            className="h-full w-full object-cover grayscale transition-all duration-700 group-hover:grayscale-0"
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-lg font-bold text-faint">
            {initials}
          </div>
        )}
        <span className="absolute inset-x-0 bottom-0 h-px bg-blood-bright/70" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <h4 className="truncate text-base font-extrabold text-bone">{s.fullName}</h4>
          <span className="shrink-0 font-mono text-xs text-muted tnum">
            {s.age}
          </span>
        </div>
        <p className="mt-0.5 font-mono text-[10px] tracking-wide text-blood-bright">
          {s.rank}
          {s.hometown ? ` · ${s.hometown}` : ""}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-muted">{s.memorial}</p>
      </div>
    </article>
  );
}
