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
import type { CameraTarget } from "./BattleMap";
import BattlePanel from "./BattlePanel";
import TimelineSlider from "./TimelineSlider";
import AmbientAudio from "./AmbientAudio";

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
    const center = tourLoc?.center;
    setTour(null);
    setReading(false);
    setActiveId(null);
    setSpotlightId(null);
    setMovePreview(null);
    setPlaying(false);
    setMinute(range[0]); // reset the clock back to the start (06:29)
    if (center) setCameraTarget({ center, zoom: 13.2, pitch: 24 });
    if (completed) {
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

  // Keep the map's data fresh without a manual refresh, so an admin save shows
  // up on its own. We re-fetch straight from Supabase on the client and only
  // swap state when the data actually changed (so idle polling never rebuilds
  // markers / restarts their animations). Triggers:
  //   • on mount            — corrects browser-cached/stale initial HTML
  //   • every 12s           — guaranteed catch-up, independent of anything else
  //   • on focus / tab show — instant when returning from the admin tab
  //   • on realtime change  — instant while viewing (if the tables are in the
  //                           supabase_realtime publication)
  const lastSigRef = useRef<string>(JSON.stringify(initialBattles));
  useEffect(() => {
    let alive = true;
    let debounce: ReturnType<typeof setTimeout> | undefined;
    const load = async () => {
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

    load();
    const poll = setInterval(load, 12000);

    const onFocus = () => load();
    const onVis = () => {
      if (!document.hidden) load();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVis);

    const channel = supabase
      ?.channel("map-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "battles" }, refetch)
      .on("postgres_changes", { event: "*", schema: "public", table: "timeline_events" }, refetch)
      .on("postgres_changes", { event: "*", schema: "public", table: "soldiers" }, refetch)
      .on("postgres_changes", { event: "*", schema: "public", table: "media" }, refetch)
      .subscribe();

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
    <main className="relative h-dvh w-full overflow-hidden bg-void">
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
      />

      {/* top HUD */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-start justify-between gap-4 p-4 sm:p-6">
        <nav className="pointer-events-auto flex flex-wrap items-center gap-2">
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
          <AmbientAudio />
        </div>
      </div>

      <TimelineSlider
        battles={battles}
        minute={minute}
        setMinute={setMinute}
        playing={playing}
        setPlaying={setPlaying}
        range={range}
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
        inTour={!!tour && reading}
        onContinue={continueTour}
      />
    </main>
  );
}
