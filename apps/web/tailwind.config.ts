import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#050508",
        amethyst: {
          DEFAULT: "#7C3AED",
          light: "#A78BFA",
        },
        coral: {
          DEFAULT: "#EC4899",
          orange: "#F97316",
        },
        muted: "rgba(255,255,255,0.35)",
        ghost: "rgba(255,255,255,0.08)",
      },
      backgroundImage: {
        "glass-gradient": "linear-gradient(rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.09))",
      },
    },
  },
  plugins: [],
};
export default config;
