import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./context/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        club: {
          black: "rgb(var(--club-black) / <alpha-value>)",
          white: "rgb(var(--club-white) / <alpha-value>)",
          darkGray: "rgb(var(--club-dark-gray) / <alpha-value>)",
          lightGray: "rgb(var(--club-light-gray) / <alpha-value>)",
          panel: "rgb(var(--club-panel) / <alpha-value>)",
          card: "rgb(var(--club-card) / <alpha-value>)",
          field: "rgb(var(--club-field) / <alpha-value>)"
        }
      },
      boxShadow: {
        panel: "0 0 0 1px rgb(var(--club-dark-gray) / 0.95)"
      }
    }
  },
  plugins: []
};

export default config;
