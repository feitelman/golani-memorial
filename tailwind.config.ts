import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Near-black tactical surfaces
        void: "#0A0A0B",
        surface: "#111113",
        elevated: "#17171A",
        line: "rgba(255,255,255,0.08)",
        "line-strong": "rgba(255,255,255,0.16)",
        bone: "#E7E5E4",
        muted: "#8A8A8E",
        faint: "#5B5B60",
        // Dried-blood red — used only for active / fallen states
        blood: "#7F1D1D",
        "blood-bright": "#B91C1C",
        "blood-glow": "#EF4444",
      },
      fontFamily: {
        sans: ["var(--font-heebo)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      letterSpacing: {
        intel: "0.28em",
      },
      keyframes: {
        "pulse-blood": {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.4", transform: "scale(1.6)" },
        },
        "grain-shift": {
          "0%, 100%": { transform: "translate(0,0)" },
          "10%": { transform: "translate(-5%,-5%)" },
          "30%": { transform: "translate(3%,-2%)" },
          "50%": { transform: "translate(-2%,4%)" },
          "70%": { transform: "translate(4%,2%)" },
          "90%": { transform: "translate(-3%,3%)" },
        },
        "scan": {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100vh)" },
        },
        "flicker": {
          "0%, 100%": { opacity: "1" },
          "92%": { opacity: "1" },
          "94%": { opacity: "0.7" },
          "96%": { opacity: "1" },
        },
      },
      animation: {
        "pulse-blood": "pulse-blood 2.4s ease-in-out infinite",
        "grain-shift": "grain-shift 0.6s steps(2) infinite",
        scan: "scan 7s linear infinite",
        flicker: "flicker 6s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
