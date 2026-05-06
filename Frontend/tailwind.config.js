/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        mg: '#2563eb',
        'mg-2': '#60a5fa',
        'bg-0': '#141414',
        'bg-1': '#191919',
        'bg-2': '#1e1e1e',
        'bg-3': '#242424',
      },
      fontFamily: {
        head: ['Space Grotesk', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
