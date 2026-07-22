/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/renderer/index.html', './src/renderer/src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Refined Graphite — a calmer, more layered dark palette with a cool
        // blue undertone. Existing keys (ink-950…200, accent) are kept so all
        // current class references still resolve; values are tuned for depth.
        ink: {
          950: '#08090c', // deepest canvas
          900: '#0b0d12', // app background
          850: '#10131a', // panel / card surface
          800: '#151922', // raised surface / hover
          750: '#1b2029', // hairline divider alt
          700: '#232934', // hairline border
          600: '#3a4250', // muted text / scrollbar
          500: '#525c6e', // secondary text
          400: '#8b95a7', // tertiary text
          300: '#aab3c4', // body text
          200: '#d4dbe6', // primary text
          100: '#eef1f7', // headings
        },
        accent: {
          DEFAULT: '#6ba0ff',
          soft: '#3a5fa8',
          glow: '#6ba0ff',
        },
        // semantic edge colors (kept in sync with layout.ts edgeColor)
        edge: {
          call: '#6ba0ff',
          data: '#b794f6',
          event: '#4ade80',
          muted: '#3a4250',
        },
      },
      boxShadow: {
        card: '0 1px 2px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.02)',
        'card-hover':
          '0 8px 24px -8px rgba(0,0,0,0.6), 0 0 0 1px rgba(107,160,255,0.25)',
        panel: '0 12px 40px -12px rgba(0,0,0,0.7)',
        focus: '0 0 0 3px rgba(107,160,255,0.22)',
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
}
