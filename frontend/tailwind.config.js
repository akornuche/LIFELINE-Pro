/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // LifeLine brand: Green primary, Blue secondary, Grey neutral
        primary: {
          50:  '#f2faea',
          100: '#e0f3cc',
          200: '#c4e89f',
          300: '#a2d96e',
          400: '#8bce52',
          500: '#75c44c', // Brand Green
          600: '#5ea83a',
          700: '#498530',
          800: '#346127',
          900: '#1e3e18',
          950: '#102210',
        },
        secondary: {
          50:  '#e6f0fa',
          100: '#c0d9f4',
          200: '#8ab8ea',
          300: '#4d94de',
          400: '#1d78d4',
          500: '#0164b0', // Brand Blue
          600: '#014f8c',
          700: '#013d6d',
          800: '#012b4e',
          900: '#001a30',
          950: '#000d18',
        },
        neutral: {
          50:  '#f5f6f7',
          100: '#e8eaec',
          200: '#d1d5d8',
          300: '#b4bac0',
          400: '#8e969e',
          500: '#69737b', // Brand Grey
          600: '#535c63',
          700: '#3e454b',
          800: '#292e33',
          900: '#15181a',
          950: '#0a0c0d',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 8px 0 rgba(0, 0, 0, 0.08)',
        'medium': '0 4px 16px 0 rgba(0, 0, 0, 0.12)',
        'hard': '0 8px 24px 0 rgba(0, 0, 0, 0.16)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 2s infinite',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/aspect-ratio'),
  ],
}
