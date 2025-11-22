// tailwind.config.ts (U korijenu projekta)

import type { Config } from 'tailwindcss';

const config: Config = {
  // Ovdje su navedene SVE datoteke koje Tailwind treba skenirati za klase
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // Ovdje možete dodati prilagođene stilove
    },
  },
  plugins: [],
};

export default config;