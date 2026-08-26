import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: "#141c2e",
          50: "#eef1f6",
          100: "#d3dae7",
          200: "#a7b5cf",
          300: "#7a90b6",
          400: "#4e6b9e",
          500: "#2c4676",
          600: "#1f3358",
          700: "#182842",
          800: "#141c2e",
          900: "#0c121e",
          950: "#070a11",
        },
        gold: {
          DEFAULT: "#b8935c",
          50: "#faf6ef",
          100: "#f3e9d6",
          200: "#e7d3ad",
          300: "#dbbd85",
          400: "#cca86a",
          500: "#b8935c",
          600: "#9a7847",
          700: "#7c5f39",
          800: "#634b2e",
          900: "#4f3c26",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        sans: ["var(--font-sans)", "sans-serif"],
      },
      boxShadow: {
        soft: "0 2px 10px rgba(20,28,46,0.06)",
        card: "0 1px 2px rgba(20,28,46,0.04), 0 8px 24px -12px rgba(20,28,46,0.15)",
      },
      backgroundImage: {
        "gold-gradient": "linear-gradient(135deg, #dbbd85 0%, #b8935c 45%, #8a6a3d 100%)",
      },
    },
  },
  plugins: [],
};
export default config;
