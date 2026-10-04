/**
 * Light of the morning of 7 October 2023 over the Gaza envelope, by minute.
 * Sunrise was ≈06:25 — the attack opened at 06:29, right at first light — so
 * the replay starts in a low, warm dawn and brightens into full day. Values are
 * deliberately muted to keep the map's dark documentary look.
 */
type RGB = [number, number, number];

interface Light {
  ground: RGB; // background / land
  water: RGB;
  fog: RGB; // horizon haze
  sky: RGB; // high sky
  ambient: number; // ambient light intensity (3D buildings)
  ambientColor: RGB;
  sun: number; // directional light intensity
  sunColor: RGB;
  azimuth: number; // degrees clockwise from north
  polar: number; // 0 = overhead, 90 = on the horizon
}

// Keyframes by minute from midnight. Sun angles approximate Gaza (31.4°N) on 7.10.
const KEYS: [number, Light][] = [
  [5 * 60 + 50, { ground: [7, 8, 12], water: [4, 5, 10], fog: [22, 26, 40], sky: [10, 12, 22], ambient: 0.35, ambientColor: [150, 165, 210], sun: 0.0, sunColor: [255, 170, 120], azimuth: 95, polar: 92 }],
  [6 * 60 + 29, { ground: [14, 12, 13], water: [7, 7, 12], fog: [92, 58, 44], sky: [30, 26, 36], ambient: 0.45, ambientColor: [230, 190, 170], sun: 0.55, sunColor: [255, 160, 100], azimuth: 99, polar: 86 }],
  [7 * 60 + 30, { ground: [20, 20, 22], water: [9, 10, 15], fog: [62, 60, 62], sky: [34, 38, 48], ambient: 0.55, ambientColor: [235, 225, 215], sun: 0.75, sunColor: [255, 215, 175], azimuth: 108, polar: 70 }],
  [9 * 60, { ground: [25, 26, 29], water: [10, 12, 18], fog: [58, 62, 70], sky: [38, 44, 56], ambient: 0.6, ambientColor: [240, 240, 240], sun: 0.85, sunColor: [255, 245, 230], azimuth: 125, polar: 55 }],
  [12 * 60, { ground: [27, 28, 31], water: [11, 13, 19], fog: [60, 64, 72], sky: [40, 46, 58], ambient: 0.62, ambientColor: [245, 245, 245], sun: 0.9, sunColor: [255, 250, 240], azimuth: 180, polar: 38 }],
  [16 * 60, { ground: [24, 24, 26], water: [10, 11, 16], fog: [72, 60, 54], sky: [36, 38, 48], ambient: 0.55, ambientColor: [240, 225, 210], sun: 0.75, sunColor: [255, 215, 170], azimuth: 240, polar: 65 }],
];

const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const mixRGB = (a: RGB, b: RGB, t: number): RGB => [mix(a[0], b[0], t), mix(a[1], b[1], t), mix(a[2], b[2], t)];
const css = ([r, g, b]: RGB) => `rgb(${Math.round(r)},${Math.round(g)},${Math.round(b)})`;

export function lightAt(minute: number): Light {
  if (minute <= KEYS[0][0]) return KEYS[0][1];
  for (let i = 0; i < KEYS.length - 1; i++) {
    const [m0, a] = KEYS[i];
    const [m1, b] = KEYS[i + 1];
    if (minute <= m1) {
      const t = (minute - m0) / (m1 - m0);
      return {
        ground: mixRGB(a.ground, b.ground, t),
        water: mixRGB(a.water, b.water, t),
        fog: mixRGB(a.fog, b.fog, t),
        sky: mixRGB(a.sky, b.sky, t),
        ambient: mix(a.ambient, b.ambient, t),
        ambientColor: mixRGB(a.ambientColor, b.ambientColor, t),
        sun: mix(a.sun, b.sun, t),
        sunColor: mixRGB(a.sunColor, b.sunColor, t),
        azimuth: mix(a.azimuth, b.azimuth, t),
        polar: mix(a.polar, b.polar, t),
      };
    }
  }
  return KEYS[KEYS.length - 1][1];
}

export const toCss = css;

/**
 * Strength (0–1) of the warm sunrise glow laid over the map from the east:
 * full at first light (06:29), fading out over the first hour of the battle.
 */
export function dawnGlow(minute: number): number {
  const rise = 6 * 60 + 29;
  if (minute <= rise) return Math.max(0, 1 - (rise - minute) / 40);
  return Math.max(0, 1 - (minute - rise) / 75);
}
