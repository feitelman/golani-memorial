"use client";

import { useEffect, useRef, useState } from "react";
import type mapboxgl from "mapbox-gl";
import {
  Battle,
  TimelineEvent,
  Waypoint,
  fromMinutes,
  toMinutes,
} from "@/lib/types";

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

function lineData(wps: Waypoint[]) {
  return {
    type: "FeatureCollection" as const,
    features:
      wps.length >= 2
        ? [
            {
              type: "Feature" as const,
              properties: {},
              geometry: {
                type: "LineString" as const,
                coordinates: wps.map((w) => w.coordinates),
              },
            },
          ]
        : [],
  };
}

// Click-on-map editor for an event's movement path. Click adds a waypoint,
// drag a numbered marker to move it, edit times in the side list.
export default function PathEditor({
  battle,
  event,
  onSave,
  onClose,
}: {
  battle: Battle;
  event: TimelineEvent;
  onSave: (path: Waypoint[]) => void;
  onClose: () => void;
}) {
  const [wps, setWps] = useState<Waypoint[]>(event.path ? [...event.path] : []);
  const wpsRef = useRef(wps);
  wpsRef.current = wps;

  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const glRef = useRef<typeof import("mapbox-gl") | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const roRef = useRef<ResizeObserver | null>(null);
  const [ready, setReady] = useState(false);

  function nextTime(list: Waypoint[]): string {
    if (list.length === 0) return event.time;
    const lastM = toMinutes(list[list.length - 1].time);
    const endM = event.endTime ? toMinutes(event.endTime) : lastM + 1;
    return fromMinutes(Math.max(lastM + 1, Math.min(endM, lastM + 5)));
  }

  // ── init mini map ─────────────────────────────────────
  useEffect(() => {
    if (!TOKEN || !containerRef.current) return;
    let cancelled = false;
    (async () => {
      const mod = await import("mapbox-gl");
      const mapboxgl = mod.default;
      await import("mapbox-gl/dist/mapbox-gl.css");
      if (cancelled || !containerRef.current) return;
      glRef.current = mapboxgl;
      mapboxgl.accessToken = TOKEN!;
      const center = wpsRef.current[0]?.coordinates ?? battle.coordinates;
      const map = new mapboxgl.Map({
        container: containerRef.current,
        style: "mapbox://styles/mapbox/dark-v11",
        center,
        zoom: 15.5,
        attributionControl: false,
      });
      mapRef.current = map;
      // Markers are DOM overlays positioned by project() — they don't need the
      // style loaded, so enable syncing as soon as the map exists (robust even
      // if the GL 'load' event is slow).
      setReady(true);
      map.on("load", () => {
        if (!map.getSource("wp-line")) {
          map.addSource("wp-line", { type: "geojson", data: lineData(wpsRef.current) });
          map.addLayer({
            id: "wp-line",
            type: "line",
            source: "wp-line",
            paint: {
              "line-color": "#ef4444",
              "line-width": 2,
              "line-dasharray": [1.5, 1.5],
            },
          });
        }
      });
      map.on("click", (e) => {
        const c: [number, number] = [
          +e.lngLat.lng.toFixed(6),
          +e.lngLat.lat.toFixed(6),
        ];
        setWps((w) => [...w, { time: nextTime(w), coordinates: c }]);
      });

      // The map is created inside a just-opened modal, so it can measure a
      // 0-size container. Keep the GL viewport synced to the real container
      // size — this is what makes the canvas actually render.
      const ro = new ResizeObserver(() => map.resize());
      if (containerRef.current) ro.observe(containerRef.current);
      roRef.current = ro;
      requestAnimationFrame(() => map.resize());
    })();
    return () => {
      cancelled = true;
      roRef.current?.disconnect();
      markersRef.current.forEach((m) => m.remove());
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── sync markers + line on change ─────────────────────
  useEffect(() => {
    const map = mapRef.current;
    const gl = glRef.current;
    if (!map || !gl || !ready) return;
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = wps.map((w, i) => {
      const el = document.createElement("div");
      el.className = "wp-marker";
      el.textContent = String(i + 1);
      const marker = new gl.Marker({ element: el, draggable: true })
        .setLngLat(w.coordinates)
        .addTo(map);
      marker.on("dragend", () => {
        const ll = marker.getLngLat();
        setWps((list) =>
          list.map((x, j) =>
            j === i
              ? { ...x, coordinates: [+ll.lng.toFixed(6), +ll.lat.toFixed(6)] }
              : x,
          ),
        );
      });
      return marker;
    });
    (map.getSource("wp-line") as mapboxgl.GeoJSONSource | undefined)?.setData(
      lineData(wps),
    );
  }, [wps, ready]);

  return (
    <div className="fixed inset-0 z-[60] flex bg-void/85 backdrop-blur-sm">
      <div className="m-auto flex h-[82vh] w-[92vw] max-w-5xl overflow-hidden border border-line-strong bg-void">
        {/* map */}
        <div className="relative flex-1">
          {!TOKEN ? (
            <div className="grid h-full place-items-center px-6 text-center text-sm text-muted">
              דרוש <span className="font-mono text-bone">NEXT_PUBLIC_MAPBOX_TOKEN</span> כדי לערוך תנועה על המפה.
            </div>
          ) : (
            <>
              {/* explicit h-full/w-full — Mapbox forces position:relative on its
                  container, which would cancel `absolute inset-0` and collapse
                  the height to 0. */}
              <div ref={containerRef} className="h-full w-full" />
              <p className="pointer-events-none absolute inset-x-3 top-3 z-10 border border-line bg-void/85 px-3 py-2 text-xs text-muted backdrop-blur">
                לחצו על המפה להוספת נקודת דרך · גררו נקודה כדי לשנות מיקום
              </p>
            </>
          )}
        </div>

        {/* side list */}
        <aside className="flex w-72 shrink-0 flex-col border-s border-line">
          <header className="border-b border-line p-4">
            <h3 className="text-sm font-bold text-bone">עריכת תנועה</h3>
            <p className="mt-1 truncate text-xs text-muted">{event.title}</p>
          </header>
          <div className="flex-1 space-y-2 overflow-y-auto p-4">
            {wps.length === 0 && (
              <p className="text-xs text-faint">אין נקודות עדיין — לחצו על המפה.</p>
            )}
            {wps.map((w, i) => (
              <div key={i} className="flex items-center gap-2 border border-line p-2">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-blood-bright text-xs font-bold text-void">
                  <span className="tnum">{i + 1}</span>
                </span>
                <input
                  value={w.time}
                  onChange={(e) =>
                    setWps((list) =>
                      list.map((x, j) => (j === i ? { ...x, time: e.target.value } : x)),
                    )
                  }
                  placeholder="HH:MM"
                  className="w-16 border border-line bg-surface px-2 py-1 text-center font-mono text-xs text-bone tnum focus:border-line-strong focus:outline-none"
                />
                <span className="flex-1 truncate font-mono text-[10px] text-faint">
                  <span className="tnum">
                    {w.coordinates[1].toFixed(4)}, {w.coordinates[0].toFixed(4)}
                  </span>
                </span>
                <button
                  onClick={() => setWps((list) => list.filter((_, j) => j !== i))}
                  aria-label="הסרה"
                  className="text-blood-glow hover:text-blood-bright"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <footer className="flex gap-2 border-t border-line p-4">
            <button
              onClick={onClose}
              className="flex-1 border border-line py-2 text-sm text-muted hover:text-bone"
            >
              ביטול
            </button>
            <button
              onClick={() => onSave(wps)}
              className="flex-1 border border-line-strong bg-bone py-2 text-sm font-bold text-void hover:bg-white"
            >
              שמירה
            </button>
          </footer>
        </aside>
      </div>
    </div>
  );
}
