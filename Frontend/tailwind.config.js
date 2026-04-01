/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        mg: '#e8007d',
        'mg-2': '#ff3399',
        'bg-0': '#141414',
        'bg-1': '#191919',
        'bg-2': '#1e1e1e',
        'bg-3': '#242424',
      },
      fontFamily: {
        head: ['Cormorant Garamond', 'Georgia', 'serif'],
        body: ['DM Sans', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
