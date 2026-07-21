/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/renderer/index.html', './src/renderer/src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // a restrained palette for code-review UI
        ink: {
          950: '#0a0c10',
          900: '#0f1218',
          850: '#141821',
          800: '#1b2029',
          700: '#272d39',
          600: '#3a4250',
          400: '#7a8497',
          200: '#c3cad6',
        },
        accent: {
          DEFAULT: '#5b8def',
          soft: '#3a5fa8',
        },
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
}
