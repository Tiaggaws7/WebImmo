/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#D90115',
        electrique: '#2C75FF' // You can use this name or any other you prefer
      }
    },
  },
  plugins: [],
}