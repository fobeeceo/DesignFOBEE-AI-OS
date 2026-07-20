import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1.25rem",
      screens: {
        "2xl": "1200px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },

        // ── ReRoom AI 에디토리얼 인테리어 팔레트 (DesignFOBEE AI Studio 이식) ──
        ink: { DEFAULT: "#211b13", soft: "#6f6555", faint: "#a49a88" },
        clay: { DEFAULT: "#b0562f", deep: "#8f4123", soft: "#f3e4da" },
        paper: { DEFAULT: "#f6f3ee", raised: "#fdfcfa" },
        sand: "#ece6db",
        line: { DEFAULT: "#e2dbcf", strong: "#cfc5b4" },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "sans-serif"],
        display: ['"Noto Serif KR"', "ui-serif", "Georgia", "serif"],
      },
      boxShadow: {
        lift: "0 1px 2px rgb(33 27 19 / 0.04), 0 8px 24px rgb(33 27 19 / 0.06)",
        deep: "0 2px 6px rgb(33 27 19 / 0.08), 0 24px 64px rgb(33 27 19 / 0.16)",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.5s cubic-bezier(0.16, 1, 0.3, 1) both",
      },
    },
  },
  plugins: [],
};

export default config;
