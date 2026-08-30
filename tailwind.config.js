/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f3f6fb',
          100: '#e4ebf6',
          200: '#c3d3e9',
          300: '#93aed4',
          400: '#5c7fb8',
          500: '#3a5d9c',
          600: '#2a4780',
          700: '#233a68',
          800: '#1f3157',
          900: '#1b294a',
        },
        gold: {
          400: '#d4af6a',
          500: '#c39a4c',
          600: '#a67f39',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        doc: ['Lora', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}
