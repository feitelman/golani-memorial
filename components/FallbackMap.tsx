"use client";

import { useMemo, useState } from "react";
import { Battle, KIND_LABEL } from "@/lib/types";

// Stylized SVG tactical map shown when no Mapbox token is configured.
// Projects the Gaza-Envelope bounding box into the SVG viewport so the
// experience — markers, hover names, active glow — works out of the box.

const BBOX = { minLng: 34.27, maxLng: 34.43, minLat: 31.21, maxLat: 31.39 };
const W = 1000;
const H = 1000;

function project([lng, lat]: [number, number]) {
  const x = ((lng - BBOX.minLng) / (BBOX.maxLng - BBOX.minLng)) * W;
  const y = (1 - (lat - BBOX.minLat) / (BBOX.maxLat - BBOX.minLat)) * H;
  return { x, y };
}

interface Props {
  battles: Battle[];
  visibleIds: Set<string>;
  activeId: string | null;
  onSelect: (b: Battle) => void;
}

export default function FallbackMap({ battles, visibleIds, activeId, onSelect }: Props) {
  const [hover, setHover] = useState<string | null>(null);

  const grid = useMemo(
    () => Array.from({ length: 21 }, (_, i) => (i * W) / 20),
    [],
  );

  return (
    <div className="absolute inset-0 bg-void">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-full w-full"
        preserveAspectRatio="xMidYMid slice"
        role="img"
        aria-label="מפה טקטית סכמטית של גזרת הגדוד"
      >
        <defs>
          <radialGradient id="terrain" cx="50%" cy="55%" r="70%">
            <stop offset="0%" stopColor="#141416" />
            <stop offset="100%" stopColor="#09090a" />
          </radialGradient>
          <filter id="bloodGlow" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="9" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <rect width={W} height={H} fill="url(#terrain)" />

        {/* tactical grid */}
        {grid.map((p) => (
          <g key={p} stroke="rgba(255,255,255,0.045)" strokeWidth={1}>
            <line x1={p} y1={0} x2={p} y2={H} />
            <line x1={0} y1={p} x2={W} y2={p} />
          </g>
        ))}

        {/* schematic contour rings for terrain shading */}
        {[180, 320, 460].map((r) => (
          <circle
            key={r}
            cx={W * 0.46}
            cy={H * 0.5}
            r={r}
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth={1}
            strokeDasharray="2 8"
          />
        ))}

        {/* the border / "gderot" line, abstract */}
        <path
          d={`M ${W * 0.12} 0 C ${W * 0.2} ${H * 0.35}, ${W * 0.1} ${H * 0.6}, ${W * 0.18} ${H}`}
          fill="none"
          stroke="rgba(185,28,28,0.35)"
          strokeWidth={1.5}
          strokeDasharray="6 6"
        />

        {/* markers */}
        {battles.map((b) => {
          const { x, y } = project(b.coordinates);
          const visible = visibleIds.has(b.id);
          const active = activeId === b.id;
          const isHot = active || hover === b.id;
          return (
            <g
              key={b.id}
              transform={`translate(${x} ${y})`}
              style={{
                opacity: visible ? 1 : 0.08,
                transition: "opacity .6s ease",
                cursor: visible ? "pointer" : "default",
              }}
              onMouseEnter={() => visible && setHover(b.id)}
              onMouseLeave={() => setHover(null)}
              onClick={() => visible && onSelect(b)}
              tabIndex={visible ? 0 : -1}
              role="button"
              aria-label={`${b.title} — ${b.locationName}`}
              onKeyDown={(e) => {
                if (visible && (e.key === "Enter" || e.key === " ")) onSelect(b);
              }}
            >
              {active && (
                <circle r={26} fill="none" stroke="#b91c1c" strokeWidth={1} opacity={0.6}>
                  <animate attributeName="r" values="14;30;14" dur="2.4s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.7;0;0.7" dur="2.4s" repeatCount="indefinite" />
                </circle>
              )}
              <circle r={12} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth={1} />
              <circle
                r={5}
                fill={isHot ? "#b91c1c" : "#6b6b70"}
                stroke={isHot ? "#ef4444" : "rgba(255,255,255,0.4)"}
                strokeWidth={1}
                filter={isHot ? "url(#bloodGlow)" : undefined}
              />
              {isHot && (
                <g transform="translate(0 -22)">
                  <text
                    textAnchor="middle"
                    className="fill-bone"
                    style={{ font: "700 16px var(--font-heebo, sans-serif)" }}
                  >
                    {b.title}
                  </text>
                  <text
                    y={16}
                    textAnchor="middle"
                    style={{
                      font: "600 9px var(--font-mono, monospace)",
                      letterSpacing: "2px",
                      fill: "#b91c1c",
                    }}
                  >
                    {KIND_LABEL[b.kind].toUpperCase()}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>

      {/* "no token" hint */}
      <div className="pointer-events-none absolute bottom-24 right-4 max-w-[220px] border border-line bg-void/80 p-3 backdrop-blur md:bottom-28">
        <p className="font-mono text-[10px] tracking-wide text-faint">מצב סכמטי</p>
        <p className="mt-1 text-xs leading-relaxed text-muted">
          מצב מפה סכמטית. הוסיפו{" "}
          <span className="tnum font-mono text-bone">NEXT_PUBLIC_MAPBOX_TOKEN</span>{" "}
          לקבלת מפת תלת־ממד מלאה.
        </p>
      </div>
    </div>
  );
}
