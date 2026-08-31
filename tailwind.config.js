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
        // Azul-caneta: a tinta do Visto. É o azul real da esferográfica, não o
        // azul institucional do `brand` — a diferença entre os dois é
        // proposital e não deve ser "harmonizada".
        caneta: {
          50: '#eef1fe',
          100: '#e3e7fa',
          200: '#c6cff6',
          300: '#9baaef',
          400: '#5e75e2',
          500: '#2f4bd3',
          600: '#1b39c8',
          700: '#172fa3',
          800: '#152882',
          900: '#142468',
        },
        // Limão-grifo: acento escasso. Uma ocorrência por tela, para marcar o
        // dado que interessa. Nunca carrega a marca sozinho.
        grifo: {
          300: '#ddfa82',
          400: '#d2f85e',
          500: '#c8f53c',
          600: '#a9d41e',
        },
      },
      fontFamily: {
        serif: ['Georgia', 'Cambria', 'Times New Roman', 'serif'],
      },
    },
  },
  plugins: [],
}
