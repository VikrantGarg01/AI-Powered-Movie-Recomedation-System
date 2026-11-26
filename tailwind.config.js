/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        cinema: {
          950: '#07080b',
          900: '#0b0c10',
          850: '#101218',
          800: '#141722',
          750: '#1a1e2d',
          700: '#212638',
          600: '#2e354d',
          500: '#434c6c',
          accent: '#e50914',
          accentHover: '#b80710',
          gold: '#f5c518',
          cyan: '#00d2ff'
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        display: ['Montserrat', 'Inter', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'hero-gradient': 'linear-gradient(to top, #0b0c10 5%, rgba(11, 12, 16, 0.7) 45%, rgba(11, 12, 16, 0.2) 100%)',
        'card-gradient': 'linear-gradient(to top, rgba(11, 12, 16, 0.95) 0%, rgba(11, 12, 16, 0.4) 50%, rgba(11, 12, 16, 0) 100%)'
      },
      boxShadow: {
        'glow-red': '0 0 25px -5px rgba(229, 9, 20, 0.4)',
        'glow-cyan': '0 0 25px -5px rgba(0, 210, 255, 0.35)',
        'glow-gold': '0 0 25px -5px rgba(245, 197, 24, 0.35)',
        'card': '0 10px 25px -5px rgba(0, 0, 0, 0.6), 0 8px 10px -6px rgba(0, 0, 0, 0.5)',
      }
    },
  },
  plugins: [],
}
