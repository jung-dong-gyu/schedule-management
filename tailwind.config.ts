import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        업무: "#3b82f6",
        개인: "#22c55e",
        취미: "#a855f7",
      },
    },
  },
  plugins: [],
};
export default config;
