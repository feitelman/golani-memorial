"use client";

import { useEffect, useRef } from "react";
import type mapboxgl from "mapbox-gl";
import {
  Battle,
  KIND_LABEL,
  TimelineEvent,
  eventPositionAt,
  toMinutes,
} from "@/lib/types";
import { MapLocation } from "@/lib/locations";
import { lightAt, toCss } from "@/lib/daylight";
import {
  BORDER,
  BOUNDARIES,
  DEPLOYMENT_BOUNDS,
  POSITION_NOTES,
  SECTORS,
  SETTLEMENTS,
} from "@/lib/deployment";
import FallbackMap from "./FallbackMap";

/** Timeline events that carry a path, flattened with their parent battle. */
type MovingEvent = { ev: TimelineEvent; battle: Battle };
function movingEvents(battles: Battle[]): MovingEvent[] {
  return battles.flatMap((b) =>
    (b.timeline ?? [])
      .filter((ev) => ev.path && ev.path.length > 0)
      .map((ev) => ({ ev, battle: b })),
  );
}

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

// Framed between מוצב נחל עוז (the outpost, where the battles took place) and
// קיבוץ נחל עוז so both are in view at once.
const CENTER: [number, number] = [34.4975, 31.4762];
// Mapbox carries these small buildings only at zoom 16+, fully at ~16.4. We sit
// just above the floor so every building renders, while still fitting both the
// outpost and the kibbutz in frame.
const FRAME = { center: CENTER, zoom: 16.4, pitch: 46, bearing: -20 };
// "Locations overview" (explore, no tour): framed to fit every location (see
// overviewCamera); this zoom is only the ceiling, so a single location isn't
// shown absurdly close.
const OVERVIEW = { center: CENTER, zoom: 13.2, pitch: 24, bearing: -20 };
// Above this zoom the location pins hide (the user has zoomed past the overview).
const LOC_PIN_MAX_ZOOM = 14.5;

export interface CameraTarget {
  center?: [number, number];
  zoom?: number;
  pitch?: number;
  /** Ignore center/zoom and frame every location on the map. */
  overview?: boolean;
}

/** Bounding box of every battle — the locations overview frames all of it. */
function battleBounds(battles: Battle[]): [[number, number], [number, number]] | null {
  if (!battles.length) return null;
  const lngs = battles.map((b) => b.coordinates[0]);
  const lats = battles.map((b) => b.coordinates[1]);
  return [
    [Math.min(...lngs), Math.min(...lats)],
    [Math.max(...lngs), Math.max(...lats)],
  ];
}

interface Props {
  battles: Battle[];
  visibleIds: Set<string>;
  activeId: string | null;
  /** current replay minute — drives moving event markers */
  minute: number;
  onSelect: (b: Battle) => void;
  /** guided-tour props */
  locations?: MapLocation[];
  onStartLocation?: (loc: MapLocation) => void;
  tourActive?: boolean;
  /** tour-driven camera framing, decoupled from opening a panel */
  cameraTarget?: CameraTarget | null;
  /** highlight this marker WITHOUT opening its panel (tour "look here" beat) */
  spotlightId?: string | null;
  /** tour: play one event's movement by fraction (0→1), decoupled from the clock */
  movePreview?: { eventId: string; t: number } | null;
  /** opening sequence step (0 story · 1 border · 2 communities · 3 sectors ·
   *  4 hold · 5 leave); null when not playing */
  introStep?: number | null;
}

export default function BattleMap({
  battles,
  visibleIds,
  activeId,
  minute,
  onSelect,
  locations = [],
  onStartLocation,
  tourActive = false,
  cameraTarget = null,
  spotlightId = null,
  movePreview = null,
  introStep = null,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<Map<string, { el: HTMLElement; marker: mapboxgl.Marker }>>(
    new Map(),
  );
  // event (moving) markers, keyed by event id
  const eventMarkersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());
  // location pins (guided-tour entry), keyed by location name
  const locPinsRef = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const resizeObsRef = useRef<ResizeObserver | null>(null);
  // kept so we can rebuild markers when `battles` changes (live data refresh)
  const glRef = useRef<typeof import("mapbox-gl").default | null>(null);
  const readyRef = useRef(false);
  // Live mirrors so the imperative marker sync never reads a stale closure
  // (markers are created async on style.load, after the first render).
  const visibleRef = useRef(visibleIds);
  const activeRef = useRef(activeId);
  const minuteRef = useRef(minute);
  const tourActiveRef = useRef(tourActive);
  const spotlightRef = useRef(spotlightId);
  const movePreviewRef = useRef(movePreview);
  const battlesRef = useRef(battles);
  battlesRef.current = battles;
  // Whether the camera has already zoomed out to follow the current movement.
  const moveFollowRef = useRef(false);
  // Last whole minute the daylight was applied for (see applyLight).
  const lightMinuteRef = useRef<number | null>(null);
  const bgLayerRef = useRef<string | null>(null);
  const shadowsRef = useRef(false);
  visibleRef.current = visibleIds;
  activeRef.current = activeId;
  minuteRef.current = minute;
  tourActiveRef.current = tourActive;
  spotlightRef.current = spotlightId;
  movePreviewRef.current = movePreview;
  const introStepRef = useRef(introStep);
  introStepRef.current = introStep;
  // deployment overlay (opening sequence): DOM labels + pending animations
  const depMarksRef = useRef<{ el: HTMLElement; marker: mapboxgl.Marker; group: "town" | "sector" | "pos" }[]>([]);
  const depTimersRef = useRef<(() => void)[]>([]);
  // base-map labels hidden during the deployment (id → original visibility)
  const baseLabelsRef = useRef<Map<string, string> | null>(null);

  // ── init ──────────────────────────────────────────────
  useEffect(() => {
    if (!TOKEN || !containerRef.current) return;
    let cancelled = false;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mobile = window.innerWidth < 640;

    (async () => {
      const mapboxgl = (await import("mapbox-gl")).default;
      if (cancelled || !containerRef.current) return;
      glRef.current = mapboxgl;

      mapboxgl.accessToken = TOKEN;

      // Correct bidi shaping/direction for Hebrew & Arabic place labels.
      try {
        if (mapboxgl.getRTLTextPluginStatus?.() === "unavailable") {
          mapboxgl.setRTLTextPlugin(
            "https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-rtl-text/v0.2.3/mapbox-gl-rtl-text.js",
            () => {},
            true, // lazy: load when RTL text is first encountered
          );
        }
      } catch {}

      const map = new mapboxgl.Map({
        container: containerRef.current,
        style: "mapbox://styles/mapbox/dark-v11",
        center: CENTER,
        // Establishing shot: start framed higher & flatter, then descend to the
        // locations overview. Same bearing throughout — a straight push-in.
        zoom: reduce ? OVERVIEW.zoom : 12.2,
        pitch: reduce ? OVERVIEW.pitch : 14,
        bearing: OVERVIEW.bearing,
        antialias: true,
        attributionControl: false,
        // mobile gets a gentler pitch ceiling for framerate
        maxPitch: mobile ? 60 : 75,
      });
      mapRef.current = map;

      // Establishing shot starts a little wider than the fitted overview of all
      // locations, then pushes in on load (reduced motion: start there).
      const ov = overviewCamera(map);
      map.jumpTo(
        reduce
          ? { ...ov, pitch: OVERVIEW.pitch }
          : { center: ov.center, zoom: ov.zoom - 1, pitch: 14 },
      );

      map.on("style.load", () => {
        // Push toward a monochrome documentary palette. dark-v11's layer IDs
        // vary, so set only layers that actually exist (Mapbox fires errors,
        // not exceptions, for unknown layers — guard rather than try/catch).
        // Ground, water, haze and sun follow the replay clock — see applyLight.
        bgLayerRef.current =
          (map.getStyle().layers ?? []).find((l: any) => l.type === "background")?.id ?? null;
        shadowsRef.current = !mobile && !reduce; // moving building shadows: desktop only

        // 3D building extrusion in dark, near-grayscale tones.
        const layers = map.getStyle().layers ?? [];
        const labelLayer = layers.find(
          (l: any) => l.type === "symbol" && l.layout?.["text-field"],
        )?.id;

        // Localise place labels to Hebrew (fall back to English, then local).
        // Combined with the RTL text plugin this renders Hebrew names correctly
        // instead of reversed/broken.
        layers.forEach((l: any) => {
          if (l.type === "symbol" && l.layout?.["text-field"]) {
            try {
              map.setLayoutProperty(l.id, "text-field", [
                "coalesce",
                ["get", "name_he"],
                ["get", "name"], // local name — Hebrew for Israeli places
                ["get", "name_en"],
              ]);
            } catch {}
          }
        });

        if (!map.getLayer("3d-buildings")) {
          map.addLayer(
            {
              id: "3d-buildings",
              source: "composite",
              "source-layer": "building",
              // All building polygons (not just extrude=true) so sparse rural
              // footprints are included too.
              filter: ["==", ["geometry-type"], "Polygon"],
              type: "fill-extrusion",
              // Mapbox's building data starts at z13 (large buildings) and is
              // complete at z16 — so this is the earliest the layer can show.
              minzoom: 13,
              paint: {
                "fill-extrusion-color": [
                  "interpolate",
                  ["linear"],
                  ["get", "height"],
                  0, "#4a4a55",
                  30, "#5c5c68",
                  90, "#70707d",
                ],
                // This region's buildings are low-rise and often untagged for
                // height. Exaggerate tagged heights and give untagged footprints
                // a tall default so they read clearly as 3D blocks.
                "fill-extrusion-height": [
                  "case",
                  [">", ["get", "height"], 0],
                  ["*", ["get", "height"], 1.4],
                  // untagged footprints: vary by feature id so they aren't all
                  // the same flat height (≈8–32m). coalesce guards a null id.
                  ["+", 8, ["%", ["coalesce", ["id"], 7], 24]],
                ],
                "fill-extrusion-base": ["get", "min_height"],
                "fill-extrusion-opacity": 0.95,
                "fill-extrusion-vertical-gradient": true,
              },
            },
            labelLayer,
          );
        }

        // Subtle terrain shading — skipped on mobile to protect framerate.
        if (!mobile && !map.getSource("mapbox-dem")) {
          map.addSource("mapbox-dem", {
            type: "raster-dem",
            url: "mapbox://mapbox.mapbox-terrain-dem-v1",
            tileSize: 512,
            maxzoom: 14,
          });
          map.setTerrain({ source: "mapbox-dem", exaggeration: 1.2 });
        }

        applyLight(map, minuteRef.current, true);

        addMarkers(map, mapboxgl);
        addEventPaths(map);
        addEventMarkers(map, mapboxgl);
        syncEventMarkers();
        addLocationPins(map, mapboxgl);
        map.on("zoom", syncLocationPins); // hide pins once zoomed in
        readyRef.current = true;

        // Fade the canvas up, then run a single establishing camera move
        // into the locations overview. No continuous rotation — the camera
        // holds still once it settles.
        if (containerRef.current) containerRef.current.style.opacity = "1";
        if (introStepRef.current !== null) {
          applyIntro(map, introStepRef.current); // the opening sequence owns the camera
        } else if (!reduce) {
          map.easeTo({
            ...overviewCamera(map),
            pitch: OVERVIEW.pitch,
            bearing: OVERVIEW.bearing,
            duration: 4000,
            easing: (t) => 1 - Math.pow(1 - t, 3), // ease-out cubic
            essential: true,
          });
        }
      });

      // Keep the GL viewport in sync with the container (device rotation,
      // panel toggles, responsive layout changes).
      const ro = new ResizeObserver(() => map.resize());
      if (containerRef.current) ro.observe(containerRef.current);
      resizeObsRef.current = ro;
    })();

    return () => {
      cancelled = true;
      resizeObsRef.current?.disconnect();
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── daylight ──────────────────────────────────────────
  // The light of that morning follows the replay clock: a low warm dawn at
  // 06:29 brightening into day (lib/daylight.ts). Applied once per whole minute.
  function applyLight(map: mapboxgl.Map, minute: number, force = false) {
    const m = Math.round(minute);
    if (!force && lightMinuteRef.current === m) return;
    lightMinuteRef.current = m;
    const L = lightAt(m);
    const setIf = (id: string | null, prop: string, val: string) => {
      if (id && map.getLayer(id)) map.setPaintProperty(id, prop as any, val as any);
    };
    setIf(bgLayerRef.current, "background-color", toCss(L.ground));
    setIf("land", "background-color", toCss(L.ground));
    setIf("water", "fill-color", toCss(L.water));
    // Atmospheric haze — kept light enough that the terrain still reads.
    map.setFog({
      color: toCss(L.fog),
      "high-color": toCss(L.sky),
      "horizon-blend": 0.18,
      "space-color": "rgb(6,6,8)",
      "star-intensity": 0.0,
    });
    map.setLights([
      {
        id: "ambient",
        type: "ambient",
        properties: { color: toCss(L.ambientColor), intensity: L.ambient },
      },
      {
        id: "sun",
        type: "directional",
        properties: {
          color: toCss(L.sunColor),
          intensity: L.sun,
          direction: [L.azimuth, Math.min(L.polar, 89)],
          "cast-shadows": shadowsRef.current && L.polar < 88,
          "shadow-intensity": 0.75,
        },
      },
    ]);
  }

  // ── opening sequence: the battalion's deployment ─────
  // Drawn on the real map (lib/deployment.ts): the border, the communities, the
  // sector boundaries with each company's name, and the battalion's positions.
  // Each step first settles everything before it, so skipping ahead is safe.
  function clearDepTimers() {
    depTimersRef.current.forEach((c) => c());
    depTimersRef.current = [];
  }
  function later(fn: () => void, ms: number) {
    const id = setTimeout(fn, ms);
    depTimersRef.current.push(() => clearTimeout(id));
  }
  const lineData = (lines: [number, number][][]) => ({
    type: "FeatureCollection" as const,
    features: lines.map((coordinates) => ({
      type: "Feature" as const,
      properties: {},
      geometry: { type: "LineString" as const, coordinates },
    })),
  });
  /** Grow a line from its first point to its last over `ms`. */
  function drawLine(map: mapboxgl.Map, src: string, done: [number, number][][], line: [number, number][], ms: number) {
    const source = map.getSource(src) as mapboxgl.GeoJSONSource | undefined;
    if (!source) return;
    const seg: number[] = [0];
    for (let i = 1; i < line.length; i++)
      seg.push(seg[i - 1] + Math.hypot(line[i][0] - line[i - 1][0], line[i][1] - line[i - 1][1]));
    const total = seg[seg.length - 1] || 1;
    const t0 = performance.now();
    let raf = 0;
    const step = (now: number) => {
      const p = Math.min(1, (now - t0) / ms);
      const target = total * (1 - Math.pow(1 - p, 2)); // ease-out
      const part: [number, number][] = [line[0]];
      for (let i = 1; i < line.length; i++) {
        if (seg[i] <= target) part.push(line[i]);
        else {
          const k = (target - seg[i - 1]) / (seg[i] - seg[i - 1] || 1);
          part.push([line[i - 1][0] + (line[i][0] - line[i - 1][0]) * k, line[i - 1][1] + (line[i][1] - line[i - 1][1]) * k]);
          break;
        }
      }
      source.setData(lineData([...done, part]));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    depTimersRef.current.push(() => cancelAnimationFrame(raf));
  }

  function setupDeployment(map: mapboxgl.Map, gl: typeof import("mapbox-gl").default) {
    if (map.getSource("dep-border")) return;
    map.addSource("dep-border", { type: "geojson", data: lineData([]) });
    map.addSource("dep-bounds", { type: "geojson", data: lineData([]) });
    map.addSource("dep-towns", {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: SETTLEMENTS.map((s) => ({
          type: "Feature" as const,
          properties: { r: s.r ?? 1 },
          geometry: { type: "Point" as const, coordinates: s.at },
        })),
      },
    });
    map.addLayer({
      id: "dep-towns",
      type: "circle",
      source: "dep-towns",
      paint: {
        "circle-color": "#3b82f6",
        "circle-opacity": 0,
        "circle-opacity-transition": { duration: 900 },
        "circle-stroke-color": "#93c5fd",
        "circle-stroke-width": 1,
        "circle-stroke-opacity": 0,
        "circle-stroke-opacity-transition": { duration: 900 },
        "circle-blur": 0.35,
        "circle-emissive-strength": 1,
        "circle-radius": ["interpolate", ["exponential", 2], ["zoom"], 10, ["*", 3, ["get", "r"]], 14, ["*", 40, ["get", "r"]]],
      },
    });
    map.addLayer({
      id: "dep-border-glow",
      type: "line",
      source: "dep-border",
      layout: { "line-cap": "round", "line-join": "round" },
      paint: { "line-color": "#ef4444", "line-width": 12, "line-blur": 8, "line-opacity": 0.45, "line-opacity-transition": { duration: 900 }, "line-emissive-strength": 1 },
    });
    map.addLayer({
      id: "dep-border",
      type: "line",
      source: "dep-border",
      layout: { "line-cap": "round", "line-join": "round" },
      paint: { "line-color": "#ef4444", "line-width": 3.4, "line-opacity": 0.95, "line-opacity-transition": { duration: 900 }, "line-emissive-strength": 1 },
    });
    map.addLayer({
      id: "dep-bounds",
      type: "line",
      source: "dep-bounds",
      layout: { "line-cap": "round", "line-join": "round" },
      paint: { "line-color": "#e7e5e4", "line-width": 1.8, "line-opacity": 0.85, "line-opacity-transition": { duration: 900 }, "line-emissive-strength": 1 },
    });

    const mark = (group: "town" | "sector" | "pos", at: [number, number], html: string, anchor: "center" | "bottom" | "top", off: [number, number] = [0, 0], muted = false) => {
      const el = document.createElement("div");
      el.className = `dep-mark dep-${group}` + (muted ? " is-muted" : "");
      el.innerHTML = `<span>${html}</span>`;
      const marker = new gl.Marker({ element: el, anchor, offset: off }).setLngLat(at).addTo(map);
      depMarksRef.current.push({ el, marker, group });
    };
    SETTLEMENTS.forEach((s) => mark("town", s.at, s.label === false ? "" : s.name, "top", [0, 6]));
    SECTORS.forEach((s) => mark("sector", s.at, `${s.title}${s.sub ? `<small>${s.sub}</small>` : ""}`, "center", [0, 0], s.muted));
    // Two positions almost on top of each other (e.g. ניר עם and ק-2): put the
    // second label under its dot instead of over it.
    const placed: [number, number][] = [];
    locations.forEach((l) => {
      const note = POSITION_NOTES[l.name];
      const html = `${l.name}${note ? `<small>${note}</small>` : ""}<i></i>`;
      const crowded = placed.some(([x, y]) => Math.abs(x - l.center[0]) < 0.012 && Math.abs(y - l.center[1]) < 0.01);
      placed.push(l.center);
      if (crowded) {
        mark("pos", l.center, html, "top", [0, 14]);
        depMarksRef.current[depMarksRef.current.length - 1].el.classList.add("is-below");
      } else mark("pos", l.center, html, "bottom", [0, -14]);
    });
  }

  function showGroup(group: "town" | "sector" | "pos", on: boolean, stagger = 0) {
    depMarksRef.current
      .filter((m) => m.group === group)
      .forEach((m, i) => {
        if (!on || !stagger) m.el.classList.toggle("is-on", on);
        else later(() => m.el.classList.add("is-on"), i * stagger);
      });
  }

  function deploymentCamera(map: mapboxgl.Map) {
    const mobile = window.innerWidth < 640;
    // Fit flat, then lean in: a pitched view shows more ground at the top.
    const cam = map.cameraForBounds(DEPLOYMENT_BOUNDS, {
      padding: mobile ? { top: 100, bottom: 120, left: 20, right: 20 } : { top: 110, bottom: 110, left: 80, right: 80 },
      bearing: -20,
    });
    // (a phone is too narrow to lean in — keep the whole sector in the width)
    return { center: cam?.center ?? CENTER, zoom: (cam?.zoom ?? 11.4) + (mobile ? -0.1 : 0.45) };
  }

  function applyIntro(map: mapboxgl.Map, step: number) {
    const gl = glRef.current;
    if (!gl) return;
    clearDepTimers();
    setupDeployment(map, gl);
    syncLocationPins();
    const border = map.getSource("dep-border") as mapboxgl.GeoJSONSource;
    const bounds = map.getSource("dep-bounds") as mapboxgl.GeoJSONSource;
    const setLayers = (o: number) => {
      map.setPaintProperty("dep-border", "line-opacity", 0.95 * o);
      map.setPaintProperty("dep-border-glow", "line-opacity", 0.45 * o);
      map.setPaintProperty("dep-bounds", "line-opacity", 0.85 * o);
    };
    const towns = (on: boolean) => {
      map.setPaintProperty("dep-towns", "circle-opacity", on ? 0.32 : 0);
      map.setPaintProperty("dep-towns", "circle-stroke-opacity", on ? 0.8 : 0);
    };
    const cam = deploymentCamera(map);
    // the replay's movement routes would read as part of the deployment — hide them meanwhile
    if (map.getLayer("event-paths")) map.setLayoutProperty("event-paths", "visibility", step >= 5 ? "visible" : "none");
    // the base map's own place names duplicate the deployment's labels — hide them meanwhile
    if (!baseLabelsRef.current) {
      baseLabelsRef.current = new Map(
        (map.getStyle().layers ?? [])
          .filter((l: any) => l.type === "symbol")
          .map((l: any) => [l.id, (l.layout?.visibility as string) ?? "visible"]),
      );
    }
    baseLabelsRef.current.forEach((vis, id) => {
      if (map.getLayer(id)) map.setLayoutProperty(id, "visibility", (step >= 5 ? vis : "none") as any);
    });

    if (step >= 5) {
      // leave: fade the deployment out and settle on the locations overview
      setLayers(0);
      towns(false);
      (["town", "sector", "pos"] as const).forEach((g) => showGroup(g, false));
      later(() => {
        border.setData(lineData([]));
        bounds.setData(lineData([]));
      }, 1000);
      map.flyTo({ ...overviewCamera(map), pitch: OVERVIEW.pitch, bearing: OVERVIEW.bearing, duration: 3200, essential: true });
      return;
    }

    setLayers(1);
    // settle every earlier step instantly (skipping ahead is safe)
    if (step > 1) border.setData(lineData([BORDER]));
    towns(step > 2);
    showGroup("town", step > 2);
    if (step > 3) {
      bounds.setData(lineData(BOUNDARIES.map((b) => b.line)));
      showGroup("sector", true);
      showGroup("pos", true);
    }

    if (step === 0) {
      border.setData(lineData([]));
      bounds.setData(lineData([]));
      map.jumpTo({ center: cam.center, zoom: cam.zoom - 0.25, bearing: -38, pitch: 34 });
    } else if (step === 1) {
      bounds.setData(lineData([]));
      drawLine(map, "dep-border", [], BORDER, 2800);
      // one long, slow drift across the whole sequence
      map.easeTo({ center: cam.center, zoom: cam.zoom + (window.innerWidth < 640 ? 0.1 : 0.3), bearing: -8, pitch: 54, duration: 24000, easing: (x) => x, essential: true });
    } else if (step === 2) {
      towns(true);
      showGroup("town", true, 90);
    } else if (step === 3) {
      bounds.setData(lineData([]));
      const done: [number, number][][] = [];
      BOUNDARIES.forEach((b, i) =>
        later(() => {
          drawLine(map, "dep-bounds", [...done], b.line, 900);
          done.push(b.line);
        }, i * 1000),
      );
      later(() => showGroup("sector", true, 450), 600);
      later(() => showGroup("pos", true, 300), 3200);
    }
  }

  // react to opening-sequence steps
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current || introStep === null) {
      if (introStep === null) syncLocationPins();
      return;
    }
    applyIntro(map, introStep);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [introStep]);

  // ── markers ───────────────────────────────────────────
  // Camera that frames every location, kept clear of the HUD (top bar,
  // timeline). Recomputed from live battles, so new locations are included.
  function overviewCamera(map: mapboxgl.Map): { center: mapboxgl.LngLatLike; zoom: number } {
    const fallback = { center: OVERVIEW.center, zoom: OVERVIEW.zoom };
    const bounds = battleBounds(battlesRef.current);
    if (!bounds) return fallback;
    const mobile = window.innerWidth < 640;
    const cam = map.cameraForBounds(bounds, {
      padding: mobile
        ? { top: 130, bottom: 200, left: 75, right: 75 }
        : { top: 150, bottom: 210, left: 140, right: 140 },
      bearing: OVERVIEW.bearing,
      pitch: OVERVIEW.pitch,
      maxZoom: OVERVIEW.zoom,
    });
    return cam?.center && typeof cam.zoom === "number"
      ? { center: cam.center, zoom: cam.zoom }
      : fallback;
  }

  function addMarkers(map: mapboxgl.Map, mapboxgl: typeof import("mapbox-gl").default) {
    battles.forEach((b) => {
      const el = document.createElement("button");
      el.className = "tac-marker";
      el.setAttribute("aria-label", `${b.title} — ${b.locationName}`);
      // Inner wrapper carries the timeline-visibility opacity — Mapbox v3
      // manages style.opacity on the marker root itself (terrain occlusion),
      // so we must control reveal on a child it doesn't touch.
      el.innerHTML = `
        <span class="tac-inner">
          <span class="tac-dot"></span>
          <span class="tac-ring"></span>
          <span class="tac-label">${b.title}<small>${KIND_LABEL[b.kind]}</small></span>
        </span>`;
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        if (!el.classList.contains("is-visible")) return; // ignore hidden
        onSelect(b);
      });
      const marker = new mapboxgl.Marker({ element: el, anchor: "center" })
        .setLngLat(b.coordinates)
        .addTo(map);
      markersRef.current.set(b.id, { el, marker });
    });
    syncMarkers();
  }

  function syncMarkers() {
    // Class is the single source of truth — CSS drives opacity / hit-testing.
    markersRef.current.forEach(({ el }, id) => {
      // "spotlight" highlights the marker before its panel opens (tour beat).
      const highlit =
        activeRef.current === id || spotlightRef.current === id;
      el.classList.toggle("is-active", highlit);
      // A spotlit marker must be shown even a beat before the replay reveals it.
      el.classList.toggle(
        "is-visible",
        visibleRef.current.has(id) || spotlightRef.current === id,
      );
    });
  }

  // ── moving event markers ──────────────────────────────
  // The dashed route line(s) for every event that carries a path.
  function addEventPaths(map: mapboxgl.Map) {
    const features = movingEvents(battles)
      .filter((m) => (m.ev.path?.length ?? 0) >= 2)
      .map((m) => ({
        type: "Feature" as const,
        properties: {},
        geometry: {
          type: "LineString" as const,
          coordinates: m.ev.path!.map((w) => w.coordinates),
        },
      }));
    const data = { type: "FeatureCollection" as const, features };
    // Update the existing source in place (safe on a live data rebuild) rather
    // than remove/re-add — removing a source mid-session can throw in Mapbox.
    const src = map.getSource("event-paths") as
      | mapboxgl.GeoJSONSource
      | undefined;
    if (src) {
      src.setData(data);
      return;
    }
    if (!features.length) return;
    map.addSource("event-paths", { type: "geojson", data });
    map.addLayer({
      id: "event-paths",
      type: "line",
      source: "event-paths",
      layout: { "line-cap": "round", "line-join": "round" },
      paint: {
        "line-color": "#7dd3fc", // light blue — our forces' movement
        "line-width": 2.6,
        "line-opacity": 0.8,
        "line-dasharray": [1.5, 1.5],
        // self-lit: the 3D daylight (applyLight) would otherwise dim it to gray
        "line-emissive-strength": 1,
      },
    });
  }

  function addEventMarkers(
    map: mapboxgl.Map,
    mapboxgl: typeof import("mapbox-gl").default,
  ) {
    eventMarkersRef.current.forEach((m) => m.remove());
    eventMarkersRef.current.clear();
    movingEvents(battles).forEach(({ ev, battle }) => {
      const el = document.createElement("button");
      el.className = "event-marker";
      el.setAttribute("aria-label", ev.title);
      const range = ev.endTime && ev.endTime !== ev.time ? `${ev.time}–${ev.endTime}` : ev.time;
      el.innerHTML = `
        <span class="ev-inner">
          <span class="ev-dot"></span>
          <span class="ev-label">${ev.title}<small>${range}</small></span>
        </span>`;
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        if (el.style.display === "none") return;
        onSelect(battle);
      });
      const marker = new mapboxgl.Marker({ element: el, anchor: "center" })
        .setLngLat(ev.path![0].coordinates)
        .addTo(map);
      eventMarkersRef.current.set(ev.id, marker);
    });
  }

  // Position + show/hide every event marker. In free mode a marker follows the
  // replay clock. During a tour we ignore the clock: only the event being
  // previewed shows, positioned by an explicit 0→1 fraction along its path — so
  // a movement always plays on arrival, even if its times don't match the battle.
  function syncEventMarkers() {
    const preview = movePreviewRef.current;
    const touring = tourActiveRef.current;
    // When no movement is playing, arm the follow-camera for the next one.
    if (!preview) moveFollowRef.current = false;
    movingEvents(battles).forEach(({ ev }) => {
      const marker = eventMarkersRef.current.get(ev.id);
      if (!marker) return;
      const el = marker.getElement();

      if (preview && preview.eventId === ev.id && ev.path && ev.path.length) {
        const times = ev.path.map((w) => toMinutes(w.time));
        const m = times[0] + preview.t * (times[times.length - 1] - times[0]);
        const pos = eventPositionAt(ev, m);
        el.style.display = pos ? "" : "none";
        if (pos) {
          marker.setLngLat(pos);
          // Frame the movement once, sized to the path itself — a short advance
          // stays zoomed in, a long dash (e.g. a tank fleeing km away) zooms out
          // only as much as needed. The marker then crawls within the framed view.
          const map = mapRef.current;
          if (map && !moveFollowRef.current) {
            moveFollowRef.current = true;
            const pts = ev.path.map((w) => w.coordinates);
            let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity;
            for (const [lng, lat] of pts) {
              minLng = Math.min(minLng, lng); maxLng = Math.max(maxLng, lng);
              minLat = Math.min(minLat, lat); maxLat = Math.max(maxLat, lat);
            }
            map.fitBounds([[minLng, minLat], [maxLng, maxLat]], {
              padding: 140,
              maxZoom: 16.2, // never zoom out for a tiny path; keep it close
              pitch: 30,
              duration: 900,
              essential: true,
            });
          }
        }
        return;
      }

      // During a tour, all other movement markers stay hidden (avoids showing a
      // later battle's movement early, or twice).
      if (touring) {
        el.style.display = "none";
        return;
      }

      const pos = eventPositionAt(ev, minuteRef.current);
      el.style.display = pos ? "" : "none";
      if (pos) marker.setLngLat(pos);
    });
  }

  // ── location pins (guided-tour entry) ─────────────────
  function addLocationPins(
    map: mapboxgl.Map,
    mapboxgl: typeof import("mapbox-gl").default,
  ) {
    locPinsRef.current.forEach((m) => m.remove());
    locPinsRef.current.clear();
    locations.forEach((loc) => {
      const el = document.createElement("button");
      el.className = "loc-pin";
      el.setAttribute("aria-label", `סיור מודרך — ${loc.name}`);
      el.innerHTML = `
        <span class="loc-inner">
          <span class="loc-dot"></span>
          <span class="loc-ring"></span>
          <span class="loc-label">${loc.name}<small>▶ סיור מודרך</small></span>
        </span>`;
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        onStartLocation?.(loc);
      });
      const marker = new mapboxgl.Marker({ element: el, anchor: "center" })
        .setLngLat(loc.center)
        .addTo(map);
      locPinsRef.current.set(loc.name, marker);
    });
    syncLocationPins();
  }

  // Location pins are the overview entry — shown only in explore mode AND while
  // zoomed out. Once the user zooms in (or a tour starts) they'd just clutter,
  // so hide them.
  function syncLocationPins() {
    const map = mapRef.current;
    const zoomedIn = map ? map.getZoom() >= LOC_PIN_MAX_ZOOM : false;
    const hide = tourActiveRef.current || zoomedIn || introStepRef.current !== null;
    locPinsRef.current.forEach((m) => {
      m.getElement().style.display = hide ? "none" : "";
    });
  }

  // Rebuild all markers + paths from the current `battles`. Called when the
  // data changes live (admin save → Supabase refetch). Camera is untouched.
  function rebuildMarkers() {
    const map = mapRef.current;
    const gl = glRef.current;
    if (!map || !gl) return;
    // DOM markers (battle + event) don't need the style loaded — rebuild them
    // unconditionally so live data always shows. The path source/layer does
    // need the style, so only touch it once the style is ready.
    markersRef.current.forEach(({ marker }) => marker.remove());
    markersRef.current.clear();
    eventMarkersRef.current.forEach((m) => m.remove());
    eventMarkersRef.current.clear();
    addMarkers(map, gl); // re-creates battle markers from current `battles`
    if (map.isStyleLoaded()) addEventPaths(map); // updates the path source in place
    addEventMarkers(map, gl);
    addLocationPins(map, gl);
    syncEventMarkers();
  }

  // Re-render markers when the battle data changes (live updates). Skipped until
  // the map style has loaded (the initial build happens in style.load).
  useEffect(() => {
    if (!readyRef.current) return;
    rebuildMarkers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [battles]);

  // react to visibility / active / spotlight changes
  useEffect(() => {
    syncMarkers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleIds, activeId, spotlightId]);

  // daylight follows the clock
  useEffect(() => {
    const map = mapRef.current;
    if (map && readyRef.current) applyLight(map, minute);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minute]);

  // move/reveal event markers as the replay minute advances, or as the tour
  // drives an explicit movement preview
  useEffect(() => {
    syncEventMarkers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minute, movePreview, tourActive]);

  // show/hide location pins when entering/leaving a tour
  useEffect(() => {
    syncLocationPins();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tourActive]);

  // fly to the active battle
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !activeId) return;
    const b = battles.find((x) => x.id === activeId);
    if (!b) return;
    map.flyTo({
      center: b.coordinates,
      zoom: 17.2, // close in on the point
      pitch: 58,
      curve: 1.5,
      speed: 0.7,
      duration: 2000,
      essential: true,
      offset: [-80, 80], // clear the left-side story panel (RTL)
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  // tour-driven camera framing (decoupled from opening a panel)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !cameraTarget) return;
    if (cameraTarget.overview) {
      map.flyTo({
        ...overviewCamera(map),
        pitch: OVERVIEW.pitch,
        bearing: OVERVIEW.bearing,
        duration: 2600,
        essential: true,
      });
      return;
    }
    if (!cameraTarget.center) return;
    map.flyTo({
      center: cameraTarget.center,
      zoom: cameraTarget.zoom ?? 16.5,
      pitch: cameraTarget.pitch ?? 58,
      curve: 1.5,
      speed: 0.7,
      duration: 2600,
      essential: true,
      offset: [-80, 80],
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraTarget]);

  if (!TOKEN) {
    return (
      <FallbackMap
        battles={battles}
        visibleIds={visibleIds}
        activeId={activeId}
        onSelect={onSelect}
      />
    );
  }

  return (
    <div
      ref={containerRef}
      // h-dvh/w-full guarantees a concrete size — relying on `inset-0` alone
      // can resolve to 0 height depending on the positioned-ancestor chain.
      className="map-mono absolute inset-0 h-dvh w-full opacity-0 transition-opacity duration-1000"
    />
  );
}
