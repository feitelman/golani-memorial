"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AFFILIATION_LABEL, Affiliation, Soldier } from "@/lib/types";
import SoldierCard from "./SoldierCard";

type Entry = Soldier & { battle: string; battleSlug: string };

// Mirror the Lovable site's split between גדוד 13 and צוות הקרב הגדודי.
const GROUPS: Affiliation[] = ["battalion_13", "combat_team"];

export default function MemorialWall({ soldiers }: { soldiers: Entry[] }) {
  const [q, setQ] = useState("");

  const results = useMemo(() => {
    const t = q.trim();
    if (!t) return soldiers;
    return soldiers.filter((s) =>
      [s.fullName, s.rank, s.hometown, s.battle, s.memorial]
        .filter(Boolean)
        .some((f) => f!.includes(t)),
    );
  }, [q, soldiers]);

  return (
    <div>
      <div className="sticky top-[65px] z-20 -mx-5 mb-8 border-y border-line bg-void/90 px-5 py-4 backdrop-blur">
        <div className="relative mx-auto max-w-md">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="חיפוש לפי שם, דרגה, יישוב או קרב…"
            aria-label="חיפוש בקיר ההנצחה"
            className="w-full border border-line bg-surface px-4 py-3 pe-10 text-sm text-bone placeholder:text-faint focus:border-line-strong focus:outline-none focus:ring-1 focus:ring-blood-bright/40"
          />
          <span className="absolute inset-y-0 end-3 grid place-items-center text-muted">
            ⌕
          </span>
        </div>
        <p className="mt-2 text-center font-mono text-[10px] text-faint">
          <span className="tnum">{results.length} / {soldiers.length}</span>
        </p>
      </div>

      {results.length === 0 ? (
        <p className="py-16 text-center text-muted">לא נמצאו תוצאות לחיפוש זה.</p>
      ) : (
        <div className="space-y-12">
          {GROUPS.map((group) => {
            const inGroup = results.filter((s) => (s.affiliation ?? "battalion_13") === group);
            if (inGroup.length === 0) return null;
            return (
              <section key={group}>
                <div className="mb-5 flex items-center gap-3">
                  <span className="h-1.5 w-1.5 rotate-45 bg-blood-bright" />
                  <h2 className="text-lg font-extrabold text-bone">
                    {AFFILIATION_LABEL[group]}
                  </h2>
                  <span className="h-px flex-1 bg-line" />
                  <span className="font-mono text-xs text-faint tnum">{inGroup.length}</span>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {inGroup.map((s) => (
                    <div key={s.id} className="group">
                      <SoldierCard s={s} />
                      <Link
                        href={`/map?battle=${s.battleSlug}`}
                        className="mt-1 block text-end font-mono text-[10px] tracking-wide text-faint transition-colors hover:text-blood-bright"
                      >
                        {s.battle} ↗
                      </Link>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
