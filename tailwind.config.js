/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        invio: {
          primary: '#7C3AED',
          primaryHover: '#6D28D9',
          primaryActive: '#5B21B6',
          primaryLight: '#EDE9FE',
          primarySurface: '#FAF5FF',
          dark: '#0f172a',
          darkDeep: '#0b0f19',
          slate: '#1e293b',
          muted: '#64748b',
          border: '#e2e8f0',
        },
      },
      fontFamily: {
        heading: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
        sans: ['Inter', '"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
