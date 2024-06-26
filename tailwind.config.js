/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './*.html',
    './public/**/*.html',
    './src/**/*.{js,jsx,ts,tsx,vue}',
  ],
  darkMode: 'media', // or 'class' if you want to toggle manually
  theme: {
    extend: {},
  },
  variants: {
    extend: {},
  },
  plugins: [],
}
