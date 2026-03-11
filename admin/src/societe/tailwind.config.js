/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'fasotravel-red': '#dc2626',
        'fasotravel-yellow': '#f59e0b',
        'fasotravel-green': '#16a34a',
      },
    },
  },
  plugins: [],
}
