"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Battle, toMinutes } from "@/lib/types";
import {
  MapLocation,
  battleOpenMinute,
  groupLocations,
} from "@/lib/locations";
import { fetchBattles } from "@/lib/data";
import { supabase } from "@/lib/supabase";
import { dawnGlow } from "@/lib/daylight";
import type { CameraTarget } from "./BattleMap";
import BattlePanel from "./BattlePanel";
import TimelineSlider from "./TimelineSlider";
import AmbientAudio from "./AmbientAudio";
import MediaMoment, { type Moment } from "./MediaMoment";
import { KioskClock, KioskLayer, type KioskCard } from "./KioskOverlays";
import IntroOverlay, { FALLEN_MS, STORY_MS } from "./IntroOverlay";
import { orderedFallen } from "@/lib/fallen";

// Map renders client-only (Mapbox/WebGL touch `window`).
const BattleMap = dynamic(() => import("./BattleMap"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 grid place-items-center bg-void">
      <p className="eyebrow animate-flicker text-muted">מאתחל מפה טקטית…</p>
    </div>
  ),
});

export default function MapExperience({
  battles: initialBattles,
}: {
  battles: Battle[];
}) {
  // Held in state so Supabase Realtime can refresh it live after admin saves.
  const [battles, setBattles] = useState<Battle[]>(initialBattles);

  const range = useMemo<[number, number]>(() => {
    // Window opens at the day's first recorded event (e.g. 06:29 צבע אדום) so the
    // replay starts there — but markers only reveal at their own startMinute.
    const firstEvents = battles.map((b) =>
      toMinutes(b.timeline[0]?.time ?? b.time),
    );
    const ends = battles.map((b) => b.endMinute);
    return [Math.min(...firstEvents), Math.max(...ends) + 5];
  }, [battles]);

  // Start at the beginning of the replay — battles reveal as time advances.
  const [minute, setMinute] = useState(range[0]);
  const [playing, setPlaying] = useState(false);
  // Track the open battle by id (not object) so it survives a live data refresh.
  const [activeId, setActiveId] = useState<string | null>(null);
  const active = useMemo(
    () => battles.find((b) => b.id === activeId) ?? null,
    [battles, activeId],
  );
  // A battle's marker is visible once the replay has reached its time.
  const visibleIds = useMemo(() => {
    const s = new Set<string>();
    battles.forEach((b) => {
      if (b.startMinute <= minute) s.add(b.id);
    });
    return s;
  }, [battles, minute]);

  // ── opening sequence (/map?intro=1, from the home page) ─
  // 0 the story · 1 the fallen, floating · 2 the border · 3 communities ·
  // 4 sectors & positions · 5 hold · 6 leave to the overview (BattleMap gets
  // the map part: step − 1). Click / Space / ← advance; Esc or "דלג" skips.
  const [introStep, setIntroStep] = useState<number | null>(null);
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if (p.get("intro") !== "1" || p.get("mode") === "kiosk") return;
    window.history.replaceState(null, "", "/map"); // a refresh / shared link opens the map directly
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setIntroStep(0);
  }, []);
  useEffect(() => {
    if (introStep === null) return;
    const ms = [STORY_MS, FALLEN_MS, 3600, 2600, 7600, 5200, 3400][introStep];
    const id = setTimeout(() => setIntroStep(introStep >= 6 ? null : introStep + 1), ms);
    return () => clearTimeout(id);
  }, [introStep]);
  const nextIntro = () => setIntroStep((s) => (s === null ? null : Math.min(6, s + 1)));
  const skipIntro = () => setIntroStep((s) => (s === null ? null : 6));
  const introFallen = useMemo(() => orderedFallen(battles), [battles]);

  // ── media moments ──────────────────────────────────────
  // Media with a recorded time surfaces as the clock passes that minute.
  const moments = useMemo<Moment[]>(
    () =>
      battles
        .flatMap((b) =>
          b.media
            .filter((m) => m.atTime && m.url)
            .map((m) => ({ media: m, battle: b, t: toMinutes(m.atTime!) })),
        )
        .sort((a, b) => a.t - b.t),
    [battles],
  );
  const [moment, setMoment] = useState<Moment | null>(null);
  const prevMinuteRef = useRef(minute);
  useEffect(() => {
    const prev = prevMinuteRef.current;
    prevMinuteRef.current = minute;
    if (minute <= prev) return; // only moving forward surfaces media
    const crossed = moments.filter((x) => x.t > prev && x.t <= minute);
    if (crossed.length) setMoment(crossed[crossed.length - 1]); // the latest one
  }, [minute, moments]);

  // ── guided tour ────────────────────────────────────────
  const locations = useMemo(() => groupLocations(battles), [battles]);
  const [tour, setTour] = useState<{ name: string; index: number } | null>(null);
  const [reading, setReading] = useState(false); // panel open + paused for reading
  const [cameraTarget, setCameraTarget] = useState<CameraTarget | null>(null);
  const [toast, setToast] = useState("");
  // Highlight a marker before its panel opens, so viewers see WHERE it is first.
  const [spotlightId, setSpotlightId] = useState<string | null>(null);
  // Tour movement playback: which event, and how far along its path (0→1).
  const [movePreview, setMovePreview] = useState<{ eventId: string; t: number } | null>(null);

  const tourLoc = useMemo(
    () => (tour ? locations.find((l) => l.name === tour.name) ?? null : null),
    [tour, locations],
  );
  const stations = tourLoc?.battles ?? [];

  const focusStation = (b: Battle) =>
    setCameraTarget({ center: b.coordinates, zoom: 17.4, pitch: 58 });

  function startTour(loc: MapLocation) {
    if (loc.battles.length === 0) return;
    setActiveId(null);
    setReading(false);
    setPlaying(false); // the tour drives the clock itself (see runner below)
    setMinute(range[0]); // start the clock at the beginning of the replay (06:29)
    setTour({ name: loc.name, index: 0 });
  }

  // Stop the tour mid-way and drop into free mode right where we are — no camera
  // yank, no clock reset. Any open panel stays open to keep reading.
  function stopTour() {
    setTour(null);
    setReading(false);
    setSpotlightId(null);
    setMovePreview(null);
    setPlaying(false);
  }

  // Tour finished all stations — return to the locations overview.
  function endTour(completed: boolean) {
    setTour(null);
    setReading(false);
    setActiveId(null);
    setSpotlightId(null);
    setMovePreview(null);
    setPlaying(false);
    setMinute(range[0]); // reset the clock back to the start (06:29)
    setCameraTarget({ overview: true }); // back to the view of all locations
    if (completed && !kiosk) {
      setToast("הסיור הושלם");
      setTimeout(() => setToast(""), 3500);
    }
  }

  // The panel's ✕ / backdrop. In a tour this STOPS the tour (matches the instinct
  // to press ✕ to get out); in free mode it just closes the panel. Advancing is a
  // separate, explicit "המשך" button.
  function closePanel() {
    if (tour) stopTour();
    setActiveId(null);
  }

  // Explicit "continue" — advance to the next station (the runner drives its
  // camera / movement / open), or finish the tour after the last one.
  function continueTour() {
    if (!tour) {
      setActiveId(null);
      return;
    }
    const next = tour.index + 1;
    setReading(false);
    setActiveId(null);
    setMovePreview(null);
    if (next < stations.length) {
      setTour({ name: tour.name, index: next });
    } else {
      endTour(true);
    }
  }

  // Step back one station (keyboard). The runner re-plays it from the current clock.
  function previousStation() {
    if (!tour || tour.index === 0) return;
    setReading(false);
    setActiveId(null);
    setMovePreview(null);
    setTour({ name: tour.name, index: tour.index - 1 });
  }

  // ── keyboard shortcuts ─────────────────────────────────
  // Space  play / pause (in a tour: continue to the next station)
  // ← / →  time forward / back (Shift = 10 min) — RTL, so ← is later;
  //        in a tour: next / previous station
  // Enter  continue the tour · Esc  close the panel / leave the tour
  const keyRef = useRef<(e: KeyboardEvent) => void>(() => {});
  keyRef.current = (e: KeyboardEvent) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (kiosk) {
      if (e.key === "Escape") exitKiosk(); // every other key is ignored on a display
      return;
    }
    if (introStep !== null) {
      if (e.key === "Escape") skipIntro();
      else if (e.key === " " || e.key === "Enter" || e.key === "ArrowLeft") nextIntro();
      else return;
      e.preventDefault();
      return;
    }
    const t = e.target;
    if (t instanceof HTMLElement && (t.closest("input, textarea, select, [contenteditable=true]") || t.tagName === "AUDIO" || t.tagName === "VIDEO")) return;
    const forward = e.key === "ArrowLeft";
    const back = e.key === "ArrowRight";

    if (e.key === "Escape") {
      if (tour) stopTour();
      setActiveId(null);
    } else if (tour) {
      if (e.key === " " || e.key === "Enter" || forward) {
        if (reading) continueTour();
      } else if (back) {
        previousStation();
      } else return;
    } else if (e.key === " ") {
      if (minute >= range[1]) setMinute(range[0]); // replay from the start
      setPlaying(!playing);
    } else if (forward || back) {
      const step = (e.shiftKey ? 10 : 1) * (forward ? 1 : -1);
      setPlaying(false);
      setMinute(Math.min(range[1], Math.max(range[0], Math.round(minute) + step)));
    } else return;
    e.preventDefault(); // keep Space / arrows from scrolling or re-clicking a button
  };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => keyRef.current(e);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // ── ceremony / display mode (/map?mode=kiosk) ─────────
  // Runs every location's tour on its own, in a loop: a title card, the
  // stations (each panel held long enough to read, scrolling itself), then the
  // names of that location's fallen; after the last location a closing card.
  // &autostart=1 skips the start screen (for a browser already in kiosk mode);
  // &loc=<location name> loops a single location (e.g. a ceremony at Erez).
  type KPhase =
    | { kind: "start" }
    | { kind: "intro" | "tour" | "names"; loc: number }
    | { kind: "outro" };
  const [kiosk, setKiosk] = useState(false);
  const [kp, setKp] = useState<KPhase | null>(null);
  const [kioskOnly, setKioskOnly] = useState<string | null>(null);
  const wakeRef = useRef<{ release: () => Promise<void> } | null>(null);

  // Same order as the memorial wall: locations with the most fallen first.
  const kioskLocs = useMemo(() => {
    const fallen = (l: MapLocation) => l.battles.reduce((n, b) => n + b.fallen.length, 0);
    const only = kioskOnly && locations.filter((l) => l.name === kioskOnly);
    if (only && only.length) return only;
    return [...locations].sort((a, b) => fallen(b) - fallen(a) || a.name.localeCompare(b.name, "he"));
  }, [locations, kioskOnly]);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if (p.get("mode") !== "kiosk") return;
    setKiosk(true);
    setKioskOnly(p.get("loc"));
    setKp(p.get("autostart") ? { kind: "intro", loc: 0 } : { kind: "start" });
  }, []);

  // Keep the screen awake while the display runs (re-acquired when the tab returns).
  useEffect(() => {
    if (!kiosk || !kp || kp.kind === "start") return;
    const acquire = async () => {
      try {
        wakeRef.current = await (navigator as any).wakeLock?.request("screen");
      } catch {
        /* not supported / denied — the display just follows the OS settings */
      }
    };
    if (!wakeRef.current) acquire();
    const onVis = () => {
      if (!document.hidden) acquire();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [kiosk, kp]);

  function startKiosk() {
    document.documentElement.requestFullscreen?.().catch(() => {});
    setKp({ kind: "intro", loc: 0 });
  }

  function exitKiosk() {
    setKiosk(false);
    setKp(null);
    stopTour();
    setActiveId(null);
    wakeRef.current?.release().catch(() => {});
    wakeRef.current = null;
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    window.history.replaceState(null, "", "/map");
  }

  // Phase timing.
  useEffect(() => {
    if (!kiosk || !kp) return;
    const loc = "loc" in kp ? kioskLocs[kp.loc] : undefined;
    let id: ReturnType<typeof setTimeout> | undefined;
    if (kp.kind === "intro") {
      if (!loc) {
        setKp({ kind: "outro" });
        return;
      }
      id = setTimeout(() => {
        startTour(loc);
        setKp({ kind: "tour", loc: kp.loc });
      }, 6000);
    } else if (kp.kind === "names") {
      const n = loc?.battles.reduce((s, b) => s + b.fallen.length, 0) ?? 0;
      const next = kp.loc + 1;
      id = setTimeout(
        () => setKp(next < kioskLocs.length ? { kind: "intro", loc: next } : { kind: "outro" }),
        n ? Math.min(32000, 9000 + n * 400) : 0,
      );
    } else if (kp.kind === "outro") {
      id = setTimeout(() => setKp({ kind: "intro", loc: 0 }), 12000);
    }
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kiosk, kp, kioskLocs]);

  // A location's tour finished (endTour cleared it) → show its names.
  useEffect(() => {
    if (kiosk && kp?.kind === "tour" && !tour) setKp({ kind: "names", loc: kp.loc });
  }, [kiosk, kp, tour]);

  // Hold each open panel long enough to read it, then continue by itself.
  const readMs = (b: Battle) =>
    Math.min(60000, Math.max(16000, 9000 + (b.description?.length ?? 0) * 30 + b.fallen.length * 1500));
  useEffect(() => {
    if (!kiosk || !tour || !reading || !active) return;
    const id = setTimeout(continueTour, readMs(active));
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kiosk, tour, reading, active?.id]);

  const kioskCard: KioskCard | null = !kiosk || !kp
    ? null
    : kp.kind === "start"
      ? { kind: "start" }
      : kp.kind === "outro"
        ? { kind: "outro" }
        : kp.kind === "intro" && kioskLocs[kp.loc]
          ? {
              kind: "intro",
              name: kioskLocs[kp.loc].name,
              stations: kioskLocs[kp.loc].battles.length,
              fallen: kioskLocs[kp.loc].battles.reduce((n, b) => n + b.fallen.length, 0),
            }
          : kp.kind === "names" && kioskLocs[kp.loc]
            ? {
                kind: "names",
                name: kioskLocs[kp.loc].name,
                fallen: kioskLocs[kp.loc].battles.flatMap((b) => b.fallen),
              }
            : null;

  // ── per-station cinematic runner ───────────────────────
  // For the current station: fly the camera in, play its movement (if any) at a
  // controlled pace, then open the panel and pause for reading. Driving the
  // minute here — instead of riding the fast shared play loop — gives every
  // station the same beat, no matter how close the battles are in time.
  useEffect(() => {
    if (!tour || reading) return;
    const st = stations[tour.index];
    if (!st) return;

    const target = battleOpenMinute(st); // the battle's own time
    const startMin = minute; // where the previous station left the clock

    // The battle's movement (if any). Played by an explicit 0→1 fraction, so it
    // shows on arrival regardless of whether its times match the battle time.
    const moveEvent = (st.timeline ?? []).find(
      (e) => e.path && e.path.length > 0,
    );
    const hasMove = !!moveEvent;

    const PACE = 4; // battle-minutes per real second on the travel leg
    const durTravel = Math.min(
      10000,
      Math.max(2200, ((target - startMin) / PACE) * 1000),
    );
    const durMove = hasMove ? 13000 : 0; // slow movement crawl (decoupled from time)
    const DWELL = 1400; // battle marker shown & highlighted BEFORE the panel opens

    setPlaying(false);
    setSpotlightId(null);
    setMovePreview(null);
    focusStation(st); // camera flies in

    // setInterval (not rAF) so the tour keeps running if the tab is backgrounded.
    const start = performance.now();
    const t0 = durTravel; // travel: clock advances to the battle time
    const t1 = t0 + durMove; // movement: marker crawls its path (clock frozen)
    const t2 = t1 + DWELL; // dwell: highlight the marker before the story
    const id = setInterval(() => {
      const e = performance.now() - start;
      if (e < t0) {
        setMinute(startMin + (target - startMin) * (t0 ? e / t0 : 1));
      } else if (e < t1) {
        setMinute(target);
        if (moveEvent)
          setMovePreview({ eventId: moveEvent.id, t: (e - t0) / durMove });
      } else if (e < t2) {
        setMovePreview(null); // hide the moving marker
        setSpotlightId(st.id); // highlight the battle marker before opening
      } else {
        clearInterval(id);
        setMovePreview(null);
        setSpotlightId(null);
        setActiveId(st.id);
        setReading(true);
      }
    }, 60);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tour, reading]);

  // Deep link from the memorial wall: /map?battle=<slug> opens that battle.
  useEffect(() => {
    const slug = new URLSearchParams(window.location.search).get("battle");
    if (!slug) return;
    const b = battles.find((x) => x.slug === slug);
    if (!b) return;
    setMinute((m) => Math.max(m, b.startMinute)); // reveal its marker
    setActiveId(b.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the map's data fresh without a manual refresh, while touching the
  // database as little as possible. Full reloads happen only:
  //   • on mount                — corrects a cached/stale server render
  //   • on a realtime change    — the normal path (tables are in the
  //                               supabase_realtime publication)
  //   • every 60s, ONLY while realtime isn't connected — fallback
  //   • on focus / tab show, at most once per 30s — returning from admin
  // Swaps state only when the data actually changed, so idle refreshes never
  // rebuild markers or restart their animations.
  const lastSigRef = useRef<string>(JSON.stringify(initialBattles));
  useEffect(() => {
    let alive = true;
    let live = false; // realtime channel status
    let everLive = false;
    let lastLoad = 0;
    let debounce: ReturnType<typeof setTimeout> | undefined;
    const load = async () => {
      lastLoad = Date.now();
      try {
        const fresh = await fetchBattles();
        if (!alive) return;
        const sig = JSON.stringify(fresh);
        if (sig === lastSigRef.current) return; // unchanged — avoid a needless rebuild
        lastSigRef.current = sig;
        setBattles(fresh);
      } catch {
        /* keep current data on a transient fetch error */
      }
    };
    const refetch = () => {
      clearTimeout(debounce);
      debounce = setTimeout(load, 400);
    };
    const loadIfStale = () => {
      if (Date.now() - lastLoad > 30_000) load();
    };

    load();
    const poll = setInterval(() => {
      if (!live) load(); // realtime covers changes while connected
    }, 60_000);

    const onFocus = () => loadIfStale();
    const onVis = () => {
      if (!document.hidden) loadIfStale();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVis);

    const channel = supabase
      ?.channel("map-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "battles" }, refetch)
      .on("postgres_changes", { event: "*", schema: "public", table: "timeline_events" }, refetch)
      .on("postgres_changes", { event: "*", schema: "public", table: "soldiers" }, refetch)
      .on("postgres_changes", { event: "*", schema: "public", table: "media" }, refetch)
      .subscribe((status) => {
        const wasLive = live;
        live = status === "SUBSCRIBED";
        if (live && !wasLive && everLive) refetch(); // reconnected — catch up on anything missed
        if (live) everLive = true;
      });

    return () => {
      alive = false;
      clearTimeout(debounce);
      clearInterval(poll);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVis);
      if (channel) supabase?.removeChannel(channel);
    };
  }, []);

  return (
    <main
      className={
        "relative h-dvh w-full overflow-hidden bg-void " +
        (kiosk && kp?.kind !== "start" ? "cursor-none" : "")
      }
    >
      <BattleMap
        battles={battles}
        visibleIds={visibleIds}
        activeId={active?.id ?? null}
        minute={minute}
        onSelect={(b) => setActiveId(b.id)}
        locations={locations}
        onStartLocation={startTour}
        tourActive={!!tour}
        cameraTarget={cameraTarget}
        spotlightId={spotlightId}
        movePreview={movePreview}
        introStep={introStep === null ? null : Math.max(0, introStep - 1)}
      />

      {/* first light: a warm glow from the east (map right, bearing −20°) that
          fades over the first hour — the attack opened at sunrise. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-10 mix-blend-screen transition-opacity duration-700"
        style={{
          opacity: dawnGlow(minute),
          background:
            "radial-gradient(120% 90% at 100% 15%, rgba(255,140,70,0.20), rgba(255,110,60,0.07) 45%, transparent 75%)",
        }}
      />

      {/* top HUD */}
      <div
        className={
          "pointer-events-none absolute inset-x-0 top-0 z-30 flex items-start justify-between gap-4 p-4 transition-opacity duration-700 sm:p-6 " +
          (introStep !== null ? "opacity-0" : "")
        }
      >
        <nav className={"pointer-events-auto flex flex-wrap items-center gap-2 " + (kiosk || introStep !== null ? "invisible" : "")}>
          <Link
            href="/"
            className="group flex items-center gap-2 border border-line bg-void/80 px-3 py-2 text-sm text-muted backdrop-blur transition-colors hover:border-line-strong hover:text-bone"
          >
            <span className="transition-transform group-hover:translate-x-1">→</span>
            חזרה
          </Link>
          <Link
            href="/memorial"
            className="border border-line bg-void/80 px-3 py-2 text-sm text-muted backdrop-blur transition-colors hover:border-line-strong hover:text-bone"
          >
            קיר ההנצחה
          </Link>
          <Link
            href="/about"
            className="border border-line bg-void/80 px-3 py-2 text-sm text-muted backdrop-blur transition-colors hover:border-line-strong hover:text-bone"
          >
            אודות
          </Link>
          {tour && (
            <button
              onClick={stopTour}
              className="flex items-center gap-2 border border-blood-bright/60 bg-void/80 px-3 py-2 text-sm text-blood-glow backdrop-blur transition-colors hover:border-blood-bright hover:bg-blood/10"
            >
              ✕ יציאה מהסיור
            </button>
          )}
        </nav>

        <div className="pointer-events-none flex flex-col items-end gap-3">
          <div className="border border-line bg-void/80 px-3 py-2 text-right backdrop-blur">
            <p className="text-xs font-semibold tracking-wide text-bone">גדוד 13, חטיבת גולני</p>
            <p className="mt-0.5 font-mono text-xs text-muted">
              <span className="tnum">31.32°N 34.38°E</span>
            </p>
          </div>
          {!kiosk && <AmbientAudio />}
        </div>
      </div>

      {introStep !== null ? null : kiosk ? (
        <KioskClock minute={minute} />
      ) : (
      <TimelineSlider
        battles={battles}
        minute={minute}
        setMinute={setMinute}
        playing={playing}
        setPlaying={setPlaying}
        range={range}
        moments={moments}
        onPickMoment={setMoment}
      />
      )}

      <MediaMoment
        moment={active ? null : moment}
        onClose={() => setMoment(null)}
        onOpenBattle={
          tour
            ? undefined
            : (b) => {
                setMoment(null);
                setActiveId(b.id);
              }
        }
      />

      {/* tour completion / status toast */}
      {toast && (
        <div className="pointer-events-none absolute inset-x-0 top-24 z-40 flex justify-center">
          <div className="border border-line-strong bg-void/90 px-5 py-2.5 text-sm font-semibold text-bone backdrop-blur">
            {toast}
          </div>
        </div>
      )}

      <BattlePanel
        battle={active}
        onClose={closePanel}
        inTour={!!tour && reading && !kiosk}
        autoScrollMs={kiosk && active ? readMs(active) : undefined}
        onContinue={continueTour}
      />

      <KioskLayer card={kioskCard} onStart={startKiosk} />

      {introStep !== null && <IntroOverlay step={introStep} fallen={introFallen} onNext={nextIntro} onSkip={skipIntro} />}
    </main>
  );
}
