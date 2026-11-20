/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      gridTemplateColumns:{
        'auto':'repeat(auto-fill, minmax(200px, 1fr))'
      },
      colors:{
        'primary':'#004C7F',
        'primary-dark':'#00324F',
        'primary-light':'#E6F2F6',
        'accent':'#008080'
      }
    },
  },
  plugins: [],
}