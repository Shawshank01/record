/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'
  ],
  theme: {
    extend: {
      colors: {
        surface: '#111316',
        soft: '#1c1f24',
        accent: '#b2996e'
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        soft: '0 12px 40px rgba(0, 0, 0, 0.2)'
      }
    }
  },
  plugins: [require('@tailwindcss/typography')]
};
