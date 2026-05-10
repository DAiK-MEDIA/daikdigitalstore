/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#000000',
          container: '#0d1c32', // Deep Navy
        },
        secondary: {
          DEFAULT: '#705d00',
          container: '#fcd400', // Ghana Yellow
        },
        navy: '#0d1c32',
        yellow: '#fcd400',
        surface: {
          DEFAULT: '#f8f9fa',
          dim: '#d9dadb',
          bright: '#f8f9fa',
          container: '#edeeef',
          highest: '#e1e3e4',
        },
        'on-surface': '#191c1d',
        'on-surface-variant': '#44474d',
        error: '#ba1a1a',
        success: '#009760',
        pending: '#fcd400',
        processing: '#005232',
      },
      fontFamily: {
        hanken: ['Hanken Grotesk', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        'lg': '1rem',
        'xl': '1.5rem',
      },
      boxShadow: {
        'premium': '0 12px 24px -10px rgba(13, 28, 50, 0.08)',
      }
    },
  },
  plugins: [],
}
