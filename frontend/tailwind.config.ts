import type { Config } from 'tailwindcss';

/** Jetons de la charte LEEF GROUP (version validée). */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  future: { hoverOnlyWhenSupported: true },
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Red Hat Text"', 'system-ui', 'sans-serif'],
        display: ['"Red Hat Display"', '"Red Hat Text"', 'sans-serif'],
      },
      colors: {
        navy: { DEFAULT: '#00134E', 800: '#0B2163' },
        rouge: { DEFAULT: '#E31F2C', fonce: '#B8141F', logo: '#FC0001' },
        perle: '#F2F2F4',
        encre: '#4A4F63',
        ligne: '#E3E4E9',
      },
    },
  },
} satisfies Config;
