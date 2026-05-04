import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        page: "var(--color-page)",
        card: "var(--color-card)",
        elevated: "var(--color-elevated)",
        border: "var(--color-border)",
        primary: "var(--color-primary)",
        secondary: "var(--color-secondary)",
        accent: {
          bg: "var(--color-accent-bg)",
          text: "var(--color-accent-text)",
          DEFAULT: "var(--color-accent-text)",
        },
        today: {
          bg: "var(--color-today-bg)",
          text: "var(--color-today-text)",
          DEFAULT: "var(--color-today-text)",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;