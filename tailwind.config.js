/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          red: '#E8001D',
          dark: '#1a1a2e',
          card: '#16213e',
          border: '#0f3460',
        },
      },
    },
  },
  plugins: [],
};
