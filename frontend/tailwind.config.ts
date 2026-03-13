import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "rgb(var(--bg))",
        surface: "rgb(var(--surface))",
        surface2: "rgb(var(--surface2))",
        border: "rgb(var(--border) / 1)",
        accent: "rgb(var(--accent))",
        accent2: "rgb(var(--accent2))",
        accent3: "rgb(var(--accent3))",
        text: "rgb(var(--text))",
        muted: "rgb(var(--muted))",
      },
      fontFamily: {
        display: ["var(--font-syne)", "sans-serif"],
        body: ["var(--font-dm)", "sans-serif"],
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "Liberation Mono",
          "Courier New",
          "monospace",
        ],
      },
      boxShadow: {
        glow: "0 0 18px color-mix(in oklab, rgb(var(--accent)) 60%, transparent)",
        glowRed:
          "0 0 18px color-mix(in oklab, rgb(var(--accent2)) 60%, transparent)",
        glowGold:
          "0 0 18px color-mix(in oklab, rgb(var(--accent3)) 60%, transparent)",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" },
        },
        pulseSlow: {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "0.8" },
        },
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        pulseSlow: "pulseSlow 2.5s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
