"use client";

import { useEffect, useRef, useState } from "react";
import type mapboxgl from "mapbox-gl";

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

// Nahal Oz framing — same constant BattleMap uses. Used as a fallback centre
// when a battle has no real location yet (the blank() default [34.38, 31.32]).
const CENTER: [number, number] = [34.4975, 31.4762];
const BLANK: [number, number] = [34.38, 31.32];

function isRealLocation(c: [number, number]) {
  return !(Math.abs(c[0] - BLANK[0]) < 1e-6 && Math.abs(c[1] - BLANK[1]) < 1e-6);
}

// Single-point click-on-map picker for a battle's main coordinate. Click or
// drag to place the marker; the manual lng/lat inputs remain the other half.
export default function LocationPicker({
  initial,
  title,
  onSave,
  onClose,
}: {
  initial: [number, number];
  title?: string;
  onSave: (coords: [number, number]) => void;
  onClose: () => void;
}) {
  const [coords, setCoords] = useState<[number, number]>(initial);
  const coordsRef = useRef(coords);
  coordsRef.current = coords;

  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const roRef = useRef<ResizeObserver | null>(null);
  const [ready, setReady] = useState(false);

  // ── init mini map ─────────────────────────────────────
  useEffect(() => {
    if (!TOKEN || !containerRef.current) return;
    let cancelled = false;
    (async () => {
      const mod = await import("mapbox-gl");
      const mapboxgl = mod.default;
      await import("mapbox-gl/dist/mapbox-gl.css");
      if (cancelled || !containerRef.current) return;
      mapboxgl.accessToken = TOKEN!;

      const start = isRealLocation(coordsRef.current) ? coordsRef.current : CENTER;
      const map = new mapboxgl.Map({
        container: containerRef.current,
        style: "mapbox://styles/mapbox/dark-v11",
        center: start,
        zoom: 15.5,
        attributionControl: false,
      });
      mapRef.current = map;
      // DOM marker positioning doesn't need the style loaded — enable syncing as
      // soon as the map exists (robust even if the GL 'load' event is slow).
      setReady(true);

      // place the marker at the initial point
      const el = document.createElement("div");
      el.className = "pick-marker";
      const marker = new mapboxgl.Marker({ element: el, draggable: true, anchor: "center" })
        .setLngLat(isRealLocation(coordsRef.current) ? coordsRef.current : CENTER)
        .addTo(map);
      marker.on("dragend", () => {
        const ll = marker.getLngLat();
        setCoords([+ll.lng.toFixed(6), +ll.lat.toFixed(6)]);
      });
      markerRef.current = marker;

      map.on("click", (e) => {
        const c: [number, number] = [
          +e.lngLat.lng.toFixed(6),
          +e.lngLat.lat.toFixed(6),
        ];
        setCoords(c);
      });

      // The map is created inside a just-opened modal, so it can measure a
      // 0-size container. Keep the GL viewport synced to the real size — this is
      // what makes the canvas actually render.
      const ro = new ResizeObserver(() => map.resize());
      if (containerRef.current) ro.observe(containerRef.current);
      roRef.current = ro;
      requestAnimationFrame(() => map.resize());
    })();
    return () => {
      cancelled = true;
      roRef.current?.disconnect();
      markerRef.current?.remove();
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // keep the marker in sync when coords change (from click, drag, or nothing)
  useEffect(() => {
    if (!ready) return;
    markerRef.current?.setLngLat(coords);
  }, [coords, ready]);

  return (
    <div className="fixed inset-0 z-[60] flex bg-void/85 backdrop-blur-sm">
      <div className="m-auto flex h-[82vh] w-[92vw] max-w-5xl overflow-hidden border border-line-strong bg-void">
        {/* map */}
        <div className="relative flex-1">
          {!TOKEN ? (
            <div className="grid h-full place-items-center px-6 text-center text-sm text-muted">
              דרוש <span className="font-mono text-bone">NEXT_PUBLIC_MAPBOX_TOKEN</span> כדי לבחור מיקום על המפה. ניתן להזין נ.צ ידנית.
            </div>
          ) : (
            <>
              {/* explicit h-full/w-full — Mapbox forces position:relative on its
                  container, which would cancel `absolute inset-0` and collapse
                  the height to 0. */}
              <div ref={containerRef} className="h-full w-full" />
              <p className="pointer-events-none absolute inset-x-3 top-3 z-10 border border-line bg-void/85 px-3 py-2 text-xs text-muted backdrop-blur">
                לחצו על המפה לבחירת מיקום · גררו את הסמן לכוונון מדויק
              </p>
            </>
          )}
        </div>

        {/* side panel */}
        <aside className="flex w-72 shrink-0 flex-col border-s border-line">
          <header className="border-b border-line p-4">
            <h3 className="text-sm font-bold text-bone">בחירת מיקום הקרב</h3>
            {title && <p className="mt-1 truncate text-xs text-muted">{title}</p>}
          </header>
          <div className="flex-1 space-y-3 p-4">
            <div className="border border-line p-3">
              <span className="mb-1.5 block font-mono text-[10px] tracking-wide text-faint">
                קו רוחב (lat)
              </span>
              <span className="block font-mono text-sm text-bone tnum">
                {coords[1].toFixed(6)}
              </span>
            </div>
            <div className="border border-line p-3">
              <span className="mb-1.5 block font-mono text-[10px] tracking-wide text-faint">
                קו אורך (lng)
              </span>
              <span className="block font-mono text-sm text-bone tnum">
                {coords[0].toFixed(6)}
              </span>
            </div>
          </div>
          <footer className="flex gap-2 border-t border-line p-4">
            <button
              onClick={onClose}
              className="flex-1 border border-line py-2 text-sm text-muted hover:text-bone"
            >
              ביטול
            </button>
            <button
              onClick={() => onSave(coords)}
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
