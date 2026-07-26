/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/renderer/index.html', './src/renderer/src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Warm charcoal — VS Code / Copilot inspired.
        // Neutral grey with a barely-perceptible warm tilt; the surfaces step
        // gently (2-3 hex apart) so panels read as layered, not flat-black.
        ink: {
          950: '#141414',
          900: '#181818', // app canvas
          850: '#1c1c1c',
          800: '#1e1e1e', // primary surface (editor area)
          750: '#232323',
          700: '#252526', // raised panel / sidebar
          650: '#2a2a2b',
          600: '#2d2d2d', // hairline borders
          550: '#333333', // emphasis borders / scrollbar
          500: '#3c3c3c', // hover surface
          450: '#4e4e4e', // muted icons
          400: '#6e6e6e', // tertiary text
          350: '#858585', // secondary text
          300: '#999999',
          200: '#cccccc', // primary text
          150: '#e0e0e0',
          100: '#f5f5f5', // headings / bright text
        },
        // semantic surface tokens
        surface: {
          base: '#181818', // app background
          raised: '#1e1e1e', // editor / main content
          panel: '#252526', // sidebar / panel surfaces
          overlay: '#2d2d2d', // hover / popover
          inset: '#141414', // recessed / input fields
        },
        border: {
          subtle: '#2d2d2d', // hairline dividers
          DEFAULT: '#333333', // standard borders
          strong: '#3c3c3c', // emphasis borders
        },
        accent: {
          DEFAULT: '#3794ff', // VS Code blue — primary interactive
          soft: '#0e639c',
          glow: '#3794ff',
          blue: '#3794ff',
        },
        // semantic edge colors (kept in sync with layout.ts edgeColor)
        edge: {
          call: '#3794ff',
          data: '#c586c0', // VS Code purple for control-flow
          event: '#6a9955', // VS Code green for strings/data
          muted: '#3c3c3c',
        },
        // state colors (VS Code palette)
        danger: '#f48771',
        warning: '#cca700',
        success: '#6a9955',
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
}
