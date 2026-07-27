/** @type {import('tailwindcss').Config} */
//
// Colors resolve to CSS variables (defined in styles.css) so a `data-theme`
// attribute on <html> flips the whole palette. Class names stay identical —
// components never change.
export default {
  content: ['./src/renderer/index.html', './src/renderer/src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // numeric text/icon ramp — only the stops we actually use are variables
        ink: {
          100: 'var(--wc-ink-100)',
          150: 'var(--wc-ink-150)',
          200: 'var(--wc-ink-200)',
          300: 'var(--wc-ink-300)',
          400: 'var(--wc-ink-400)',
          500: 'var(--wc-ink-500)',
          600: 'var(--wc-ink-600)',
          700: 'var(--wc-ink-700)',
          850: 'var(--wc-ink-850)',
          900: 'var(--wc-ink-900)',
          950: 'var(--wc-ink-950)',
        },
        // semantic surface tokens
        surface: {
          base: 'var(--wc-surface-base)',
          raised: 'var(--wc-surface-raised)',
          panel: 'var(--wc-surface-panel)',
          overlay: 'var(--wc-surface-overlay)',
          inset: 'var(--wc-surface-inset)',
        },
        border: {
          subtle: 'var(--wc-border-subtle)',
          DEFAULT: 'var(--wc-border)',
          strong: 'var(--wc-border-strong)',
        },
        accent: {
          DEFAULT: 'var(--wc-accent)',
          soft: 'var(--wc-accent-soft)',
          glow: 'var(--wc-accent)',
          blue: 'var(--wc-accent)',
        },
        // semantic edge colors (same in both themes — they are meaning, not decor)
        edge: {
          call: '#3794ff',
          data: '#c586c0',
          event: '#6a9955',
          muted: 'var(--wc-ink-500)',
        },
        danger: 'var(--wc-danger)',
        warning: 'var(--wc-warning)',
        success: 'var(--wc-success)',
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
}
