/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"DM Sans"', 'sans-serif'],
        mono: ['"DM Mono"', 'monospace'],
      },
      colors: {
        surface: {
          900: '#0a0a0a',
          800: '#111111',
          700: '#1a1a1a',
          600: '#242424',
          500: '#2e2e2e',
        },
        amber: {
          400: '#fbbf24',
          300: '#fcd34d',
          500: '#f59e0b',
        },
        emerald: {
          400: '#34d399',
          300: '#6ee7b7',
          500: '#10b981',
        },
        rose: {
          400: '#fb7185',
          300: '#fda4af',
          500: '#f43f5e',
        },
        sky: {
          400: '#38bdf8',
        },
      },
      animation: {
        'fade-up':    'fadeUp 0.5s ease forwards',
        'fade-in':    'fadeIn 0.4s ease forwards',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow':  'spin 2s linear infinite',
        'score-fill': 'scoreFill 1.2s ease forwards',
      },
      keyframes: {
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        scoreFill: {
          from: { strokeDashoffset: '264' },
          to:   { strokeDashoffset: 'var(--dash-offset)' },
        },
      },
    },
  },
  plugins: [],
}
