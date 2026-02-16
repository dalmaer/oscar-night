/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          DEFAULT: '#C5A059',
          light: '#E2C28A',
          dark: '#947439',
        },
        dark: {
          DEFAULT: '#121212',
          light: '#1a1a1a',
          darker: '#0D0D0D',
        },
        primary: '#141414',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
