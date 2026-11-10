/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      colors: {
        // Lacivert (navy) marka olcegi
        brand: {
          50: '#eef2fb',
          100: '#d8e1f4',
          200: '#b4c5e8',
          300: '#89a2d6',
          400: '#5f7cc2',
          500: '#3f5aa6',
          600: '#2f4587',
          700: '#26386b',
          800: '#1b2a52',
          900: '#131e3c',
          950: '#0c142a',
        },
        // Modern vurgu: canli deniz mavisi (CTA / aktif isaret)
        accent: {
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
        },
      },
      boxShadow: {
        // Ofset + yumusak blur (dekoratif halo degil, gercek derinlik).
        card: '0 1px 2px rgba(15,23,42,0.04), 0 6px 16px -4px rgba(15,23,42,0.08)',
        'card-hover': '0 2px 6px rgba(15,23,42,0.06), 0 16px 32px -8px rgba(15,23,42,0.16)',
        pop: '0 8px 30px -6px rgba(15,23,42,0.18)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        // Tek authored moment: gorunur haldeki konumdan exponential ease-out.
        'fade-up': 'fade-up 0.45s cubic-bezier(0.16, 1, 0.3, 1) both',
        'scale-in': 'scale-in 0.35s cubic-bezier(0.16, 1, 0.3, 1) both',
      },
    },
  },
  plugins: [],
};
