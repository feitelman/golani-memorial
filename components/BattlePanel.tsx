"use client";

import { useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { AFFILIATION_LABEL, Affiliation, Battle, KIND_LABEL, MediaKind } from "@/lib/types";
import SoldierCard from "./SoldierCard";

gsap.registerPlugin(useGSAP);

const MEDIA_ICON: Record<MediaKind, string> = {
  image: "▣",
  video: "►",
  drone: "✦",
  audio: "♪",
  radio: "📻",
};
const MEDIA_LABEL: Record<MediaKind, string> = {
  image: "תמונה",
  video: "וידאו קרבי",
  drone: "צילום רחפן",
  audio: "הקלטה",
  radio: "קשר",
};

export default function BattlePanel({
  battle,
  onClose,
  tourHint = false,
}: {
  battle: Battle | null;
  onClose: () => void;
  /** during a guided tour: show a "close to continue" cue */
  tourHint?: boolean;
}) {
  const body = useRef<HTMLDivElement>(null);

  // As the panel slides in, reveal its sections and timeline beats in sequence.
  useGSAP(
    () => {
      if (!battle) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      gsap.from(".panel-section", {
        opacity: 0,
        y: 26,
        duration: 0.5,
        stagger: 0.08,
        ease: "power3.out",
        delay: 0.2,
      });
      gsap.from(".tl-item", {
        opacity: 0,
        x: 18, // from the inline-start edge (RTL)
        duration: 0.4,
        stagger: 0.06,
        ease: "power2.out",
        delay: 0.45,
      });
    },
    { scope: body, dependencies: [battle?.id] },
  );

  return (
    <AnimatePresence>
      {battle && (
        <>
          <motion.div
            className="fixed inset-0 z-50 bg-void/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            key={battle.id}
            className="fixed inset-y-0 left-0 z-50 flex w-full max-w-xl flex-col border-r border-line bg-void/95 shadow-2xl"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 260, damping: 32 }}
            role="dialog"
            aria-modal="true"
            aria-label={battle.title}
          >
            {/* header */}
            <header className="relative shrink-0 border-b border-line p-6">
              <button
                onClick={onClose}
                aria-label="סגירה"
                className="absolute left-5 top-5 grid h-9 w-9 place-items-center border border-line text-muted transition-colors hover:border-line-strong hover:text-bone"
              >
                ✕
              </button>
              {tourHint && (
                <div className="tour-hint mb-4 flex items-center gap-2 border border-blood-bright/50 bg-blood/[0.08] px-3 py-2 text-xs text-bone/90">
                  <span className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-blood-bright" />
                  לחצו ✕ בסיום הקריאה — הקרב ימשיך
                </div>
              )}
              <p className="eyebrow text-blood-bright">{KIND_LABEL[battle.kind]}</p>
              <h2 className="mt-3 text-3xl font-black leading-tight text-bone">
                {battle.title}
              </h2>
              <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <Meta label="תאריך" value={"07.10.2023"} />
                <Meta label="שעה" value={battle.time} mono />
                <Meta label="מסגרת" value={battle.unit} />
                <Meta label="מיקום" value={battle.locationName} />
              </dl>
            </header>

            {/* scroll body */}
            <div ref={body} className="flex-1 overflow-y-auto">
              <Section title="תיאור טקטי" index="01">
                <p className="whitespace-pre-line text-[15px] leading-[1.9] text-bone/85">
                  {battle.description}
                </p>
              </Section>

              {battle.media.length > 0 && (
                <Section title="חומרי תיעוד" index="02">
                  {/* visual media — images & video in a grid */}
                  {battle.media.some((m) => m.kind === "image" || m.kind === "video" || m.kind === "drone") && (
                    <div className="mb-3 grid grid-cols-2 gap-3">
                      {battle.media
                        .filter((m) => m.kind === "image" || m.kind === "video" || m.kind === "drone")
                        .map((m) => (
                          <figure
                            key={m.id}
                            className="reticle-frame group relative aspect-video overflow-hidden border border-line bg-elevated"
                          >
                            {m.kind === "video" && m.url ? (
                              <video
                                src={m.url}
                                controls
                                preload="none"
                                className="h-full w-full object-cover"
                              />
                            ) : m.url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={m.url}
                                alt={m.caption ?? ""}
                                className="h-full w-full object-cover grayscale transition duration-300 group-hover:grayscale-0 group-hover:scale-[1.03]"
                              />
                            ) : (
                              <div className="grid h-full w-full place-items-center text-3xl text-faint">
                                {MEDIA_ICON[m.kind]}
                              </div>
                            )}
                            <figcaption className="pointer-events-none absolute inset-x-0 bottom-0 bg-void/85 p-2">
                              <span className="font-mono text-[9px] text-blood-bright">
                                {MEDIA_LABEL[m.kind]}
                              </span>
                              {m.caption && (
                                <p className="truncate text-[11px] text-muted">{m.caption}</p>
                              )}
                            </figcaption>
                          </figure>
                        ))}
                    </div>
                  )}

                  {/* audio / radio recordings — playable */}
                  {battle.media
                    .filter((m) => m.kind === "audio" || m.kind === "radio")
                    .map((m) => (
                      <div
                        key={m.id}
                        className="mb-3 border border-line bg-surface/60 p-3 last:mb-0"
                      >
                        <div className="mb-2 flex items-center gap-2">
                          <span className="text-blood-bright">{MEDIA_ICON[m.kind]}</span>
                          <span className="font-mono text-[10px] text-blood-bright">
                            {MEDIA_LABEL[m.kind]}
                          </span>
                          {m.caption && (
                            <span className="truncate text-[11px] text-muted">{m.caption}</span>
                          )}
                        </div>
                        <audio
                          src={m.url}
                          controls
                          preload="none"
                          className="w-full"
                          dir="ltr"
                        />
                      </div>
                    ))}

                  <p className="mt-3 font-mono text-[10px] text-faint">
                    * הקלטות אינן מתנגנות אוטומטית — לחצו play להאזנה.
                  </p>
                </Section>
              )}

              <Section title="ציר זמן" index="03">
                <ol className="relative ms-2 border-s border-line">
                  {battle.timeline.map((t) => (
                    <li key={t.id} className="tl-item relative ps-6 pb-6 last:pb-0">
                      <span className="absolute -start-[5px] top-1.5 h-2.5 w-2.5 rounded-full border border-blood-bright bg-void" />
                      <div className="flex items-baseline gap-3">
                        <time className="shrink-0 font-mono text-sm font-semibold text-blood-bright tnum">
                          {t.endTime && t.endTime !== t.time
                            ? `${t.time}–${t.endTime}`
                            : t.time}
                        </time>
                        <span className="text-[15px] font-semibold leading-snug text-bone">
                          {t.title}
                        </span>
                      </div>
                      {t.detail && (
                        <p className="mt-1 text-sm text-muted">{t.detail}</p>
                      )}
                    </li>
                  ))}
                </ol>
              </Section>

              {battle.fallen.length > 0 && (
                <Section title="הנופלים" index="04" solemn>
                  <p className="mb-4 text-sm text-muted">
                    לזכרם של הלוחמים והלוחמות שנפלו במוקד זה.
                  </p>
                  {(["battalion_13", "combat_team"] as Affiliation[]).map((group) => {
                    const inGroup = battle.fallen.filter(
                      (s) => (s.affiliation ?? "battalion_13") === group,
                    );
                    if (inGroup.length === 0) return null;
                    return (
                      <div key={group} className="mb-5 last:mb-0">
                        <p className="mb-2 font-mono text-[10px] uppercase tracking-wide text-blood-bright">
                          {AFFILIATION_LABEL[group]}
                        </p>
                        <div className="space-y-3">
                          {inGroup.map((s) => (
                            <SoldierCard key={s.id} s={s} />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </Section>
              )}

              <div className="p-6 pt-2 text-center">
                <p className="eyebrow text-faint">יהי זכרם ברוך</p>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function Meta({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-[11px] text-faint">{label}</dt>
      <dd className="mt-0.5 text-bone">
        {mono ? <span className="font-mono tnum">{value}</span> : value}
      </dd>
    </div>
  );
}

function Section({
  title,
  index,
  children,
  solemn,
}: {
  title: string;
  index: string;
  children: React.ReactNode;
  solemn?: boolean;
}) {
  return (
    <section
      className={
        "panel-section border-b border-line p-6 " + (solemn ? "bg-blood/[0.04]" : "")
      }
    >
      <div className="mb-4 flex items-center gap-3">
        <span className="font-mono text-xs text-blood-bright tnum">{index}</span>
        <h3 className="text-sm font-bold uppercase tracking-wide text-muted">{title}</h3>
        <span className="h-px flex-1 bg-line" />
      </div>
      {children}
    </section>
  );
}
