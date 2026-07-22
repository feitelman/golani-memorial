"use client";

import { useEffect, useRef, useState } from "react";

// Optional immersive ambient bed (wind / distant drone / radio static),
// synthesized with the Web Audio API so it needs no asset files.
// Muted by default — only starts on explicit user toggle.
export default function AmbientAudio() {
  const [on, setOn] = useState(false);
  const ctxRef = useRef<AudioContext | null>(null);
  const nodesRef = useRef<{ stop: () => void } | null>(null);

  useEffect(() => {
    return () => nodesRef.current?.stop();
  }, []);

  function start() {
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    const ctx: AudioContext = ctxRef.current ?? new AC();
    ctxRef.current = ctx;

    const master = ctx.createGain();
    master.gain.value = 0.0;
    master.connect(ctx.destination);

    // Wind — filtered brown-ish noise
    const bufferSize = 2 * ctx.sampleRate;
    const noiseBuf = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const out = noiseBuf.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      lastOut = (lastOut + 0.02 * white) / 1.02;
      out[i] = lastOut * 3.5;
    }
    const wind = ctx.createBufferSource();
    wind.buffer = noiseBuf;
    wind.loop = true;
    const windFilter = ctx.createBiquadFilter();
    windFilter.type = "lowpass";
    windFilter.frequency.value = 480;
    const windGain = ctx.createGain();
    windGain.gain.value = 0.5;
    wind.connect(windFilter).connect(windGain).connect(master);

    // Distant drone — low detuned oscillators
    const droneGain = ctx.createGain();
    droneGain.gain.value = 0.04;
    droneGain.connect(master);
    const oscA = ctx.createOscillator();
    oscA.type = "sawtooth";
    oscA.frequency.value = 58;
    const oscB = ctx.createOscillator();
    oscB.type = "sine";
    oscB.frequency.value = 87;
    const droneFilter = ctx.createBiquadFilter();
    droneFilter.type = "lowpass";
    droneFilter.frequency.value = 220;
    oscA.connect(droneFilter);
    oscB.connect(droneFilter);
    droneFilter.connect(droneGain);

    // slow LFO on wind cutoff for movement
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.06;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 240;
    lfo.connect(lfoGain).connect(windFilter.frequency);

    wind.start();
    oscA.start();
    oscB.start();
    lfo.start();
    master.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 2.5);

    nodesRef.current = {
      stop: () => {
        try {
          master.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.6);
          setTimeout(() => {
            [wind, oscA, oscB, lfo].forEach((n) => {
              try {
                n.stop();
              } catch {}
            });
          }, 700);
        } catch {}
      },
    };
  }

  function toggle() {
    if (on) {
      nodesRef.current?.stop();
      nodesRef.current = null;
      setOn(false);
    } else {
      start();
      setOn(true);
    }
  }

  return (
    <button
      onClick={toggle}
      aria-pressed={on}
      aria-label={on ? "כיבוי סאונד סביבתי" : "הפעלת סאונד סביבתי"}
      className="pointer-events-auto flex items-center gap-2 border border-line bg-void/80 px-3 py-2 text-xs text-muted backdrop-blur transition-colors hover:border-line-strong hover:text-bone"
    >
      <span
        className={
          "h-2 w-2 rounded-full " +
          (on ? "animate-pulse-blood bg-blood-bright" : "bg-faint")
        }
      />
      {on ? "סאונד · דלוק" : "סאונד · כבוי"}
    </button>
  );
}
