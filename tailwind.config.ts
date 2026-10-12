import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          50: "#F0F5FA",
          100: "#E1EBF5",
          200: "#C4D7EB",
          300: "#9BBFE0",
          400: "#699ED0",
          500: "#3B7DBF",
          600: "#225EA4",
          700: "#1A4982",
          800: "#143763",
          900: "#0F2848",
          950: "#081628", // Deep university navy
        },
        gold: {
          50: "#FFFBEB",
          100: "#FEF3C7",
          200: "#FDE68A",
          300: "#FCD34D",
          400: "#FBBF24",
          500: "#F59E0B",
          600: "#D97706", // Academic Gold
          700: "#B45309",
        },
        crimson: {
          50: "#FEF2F2",
          100: "#FEE2E2",
          500: "#EF4444",
          600: "#DC2626", // Overdue / urgent red
          700: "#B91C1C",
        },
        academic: {
          bg: "#F8FAFC",
          card: "#FFFFFF",
          border: "#E2E8F0",
          muted: "#64748B",
          dark: "#0F172A",
        },
        pbl: {
          sidebar: "#15193B",
          sidebarHover: "rgba(255, 255, 255, 0.08)",
          primary: "#4338CA",
          primaryHover: "#3730A3",
          gold: "#F59E0B",
          badgeBg: "#FEF3C7",
          badgeText: "#92400E",
          badgeBorder: "#FDE68A",
          alertBg: "#FFFBEB",
        },
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        heading: ["Plus Jakarta Sans", "Inter", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 3px 0 rgba(15, 23, 42, 0.06), 0 1px 2px -1px rgba(15, 23, 42, 0.04)",
        cardHover: "0 4px 6px -1px rgba(15, 23, 42, 0.08), 0 2px 4px -2px rgba(15, 23, 42, 0.04)",
        header: "0 1px 2px 0 rgba(15, 23, 42, 0.05)",
      },
    },
  },
  plugins: [],
};
export default config;
