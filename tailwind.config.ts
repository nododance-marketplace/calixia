import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: {
        "2xl": "1280px",
      },
    },
    extend: {
      colors: {
        background: "#0A0E13",
        surface: "#11161D",
        "surface-2": "#1A2029",
        "surface-3": "#222A35",
        border: "#252D38",
        "border-strong": "#3A4452",
        accent: {
          DEFAULT: "#5FF6F0",
          hover: "#7EFFFA",
          dim: "#2FB7B2",
        },
        ember: {
          DEFAULT: "#FF8A5C",
          dim: "#B95A33",
        },
        "text-primary": "#ECF2F7",
        "text-secondary": "#8893A0",
        "text-muted": "#5A6573",
        success: "#5FF6A8",
        danger: "#F66F6F",
        warning: "#F6C95F",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
        display: ["var(--font-outfit)", "Outfit", "Inter", "system-ui", "sans-serif"],
        mono: [
          "var(--font-jetbrains)",
          "JetBrains Mono",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "monospace",
        ],
      },
      fontSize: {
        "display-xl": ["clamp(2.75rem, 6vw, 4.25rem)", { lineHeight: "1", letterSpacing: "-0.03em" }],
        "display-lg": ["clamp(2rem, 4.5vw, 3rem)", { lineHeight: "1.05", letterSpacing: "-0.025em" }],
        "display-md": ["clamp(1.5rem, 3vw, 2rem)", { lineHeight: "1.1", letterSpacing: "-0.02em" }],
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(95,246,240,0.18), 0 12px 40px -10px rgba(95,246,240,0.35)",
        "glow-sm": "0 0 0 1px rgba(95,246,240,0.16), 0 6px 20px -8px rgba(95,246,240,0.25)",
        "ember-glow": "0 0 0 1px rgba(255,138,92,0.18), 0 12px 40px -10px rgba(255,138,92,0.35)",
        elevated: "0 18px 50px -20px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)",
      },
      backgroundImage: {
        "accent-gradient": "linear-gradient(135deg, #5FF6F0 0%, #7EFFFA 50%, #B6FFFB 100%)",
        "ember-gradient": "linear-gradient(135deg, #FF8A5C 0%, #FFB07B 100%)",
        "hero-radial":
          "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(95,246,240,0.08), transparent 70%)",
        "surface-gradient":
          "linear-gradient(180deg, rgba(255,255,255,0.025) 0%, rgba(255,255,255,0) 60%)",
        grid: "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "slide-up": {
          from: { transform: "translateY(10px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
        "slide-up-lg": {
          from: { transform: "translateY(24px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
        pulse: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "0.7" },
          "50%": { opacity: "1" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "glow-pulse": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(95,246,240,0.0)" },
          "50%": { boxShadow: "0 0 24px 6px rgba(95,246,240,0.18)" },
        },
      },
      animation: {
        "fade-in": "fade-in 300ms ease-out",
        "slide-up": "slide-up 350ms cubic-bezier(0.16, 1, 0.3, 1)",
        "slide-up-lg": "slide-up-lg 500ms cubic-bezier(0.16, 1, 0.3, 1)",
        "pulse-soft": "pulse-soft 2.4s ease-in-out infinite",
        shimmer: "shimmer 2.4s linear infinite",
        "glow-pulse": "glow-pulse 3s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
