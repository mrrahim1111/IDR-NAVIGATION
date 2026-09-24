/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#1a2744',
          light: '#243456',
          dark: '#111b30',
        },
        govt: {
          green: '#16a34a',
          amber: '#d97706',
          red: '#dc2626',
          grey: '#f3f4f6',
          border: '#d1d5db',
          text: '#1f2937',
          muted: '#6b7280',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'monospace'],
      }
    },
  },
  plugins: [],
}
