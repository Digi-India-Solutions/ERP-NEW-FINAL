/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {
        fontFamily: {
          sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        },
        colors: {
          sidebar: '#1e293b',
          primary: '#4f46e5',
          'page-bg': '#f8fafc',
          'card-border': '#e2e8f0',
        },
      },
    },
    plugins: [],
  }