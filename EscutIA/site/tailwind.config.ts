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
        background: "var(--background)",
        foreground: "var(--foreground)",
        navy: "#1A1F3D",
        purple: "#5C4DFF",
        lilac: "#A78BFA",
        pink: "#FF6B82",
        peach: "#FFC39A",
        warm: "#FFF6F0",
      },
    },
  },
  plugins: [],
};
export default config;
