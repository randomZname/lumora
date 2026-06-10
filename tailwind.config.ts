import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Lumora "aurora" palette — signature, not the usual neon-blue look.
        aura: {
          void: "#08070d", // deepest background
          night: "#0d0b16", // panels
          panel: "#12101e",
          iris: "#8b5cf6", // violet (primary)
          flare: "#fb7185", // rose
          gold: "#fbbf24", // amber
          mint: "#34d399", // teal-green
          ink: "#ECE9F5", // primary text
          mute: "#9a93b5", // muted text
        },
        // Legacy aliases (kept so older classes don't break) remapped to the new palette.
        neon: {
          blue: "#8b5cf6",
          purple: "#fb7185",
          cyan: "#34d399",
          green: "#fbbf24",
        },
        night: "#08070d",
      },
      fontFamily: {
        display: ["var(--font-display)", "Space Grotesk", "sans-serif"],
        body: ["var(--font-body)", "Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 25px rgba(139,92,246,0.35), 0 0 50px rgba(251,113,133,0.18)",
        "glow-flare": "0 0 28px rgba(251,113,133,0.4)",
      },
      borderRadius: {
        "4xl": "2rem",
      },
    },
  },
  plugins: [],
};

export default config;
