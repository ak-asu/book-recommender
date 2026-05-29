import { heroui } from "@heroui/theme";

/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"],
      },
      colors: {
        "booktrack-dark": "hsl(0 0% 7%)",
        "booktrack-darkgray": "hsl(0 0% 16%)",
        "booktrack-lightgray": "hsl(0 0% 20%)",
        "booktrack-gold": "hsl(42 100% 50%)",
        "booktrack-card": "hsl(0 0% 16%)",
      },
    },
  },
  darkMode: "class",
  plugins: [heroui()],
};

module.exports = config;
