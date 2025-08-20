/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'nfl-blue': '#013369',
        'nfl-red': '#D50A0A',
        'field-green': '#4A7C59',
        'grass-green': '#2D5016',
        'chalk-white': '#F8F9FA',
        'steel-gray': '#6C757D'
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
        'display': ['Bebas Neue', 'cursive']
      }
    },
  },
  plugins: [],
}
