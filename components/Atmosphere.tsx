"use client";

// Global cinematic atmosphere: grain, a slow scanline sweep and a vignette.
// Purely decorative, pointer-events-none, and disabled under reduced-motion.
export default function Atmosphere() {
  return (
    <div className="atmosphere" aria-hidden="true">
      <div className="grain animate-grain-shift" />
      <div className="scanline animate-scan" />
      <div className="vignette" />
    </div>
  );
}
