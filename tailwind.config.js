/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        blob: {
          "0%": { transform: "translate(0px, 0px) scale(1)" },
          "33%": { transform: "translate(30px, -50px) scale(1.1)" },
          "66%": { transform: "translate(-20px, 20px) scale(0.9)" },
          "100%": { transform: "translate(0px, 0px) scale(1)" },
        }
      },
      animation: {
        blob: "blob 7s infinite",
      },
      colors: {
        darkBg: '#0b0f19',
        cardSurface: '#151b2b',
        cardLight: '#ffffff',
        accent1: '#10b981', // green for fitbite
        accent2: '#3b82f6', // blue
        accent3: '#f43f5e', // red for delete/reset
        carbs: '#eab308', // yellow
        protein: '#ef4444', // red
        fat: '#22c55e', // green
      },
      fontFamily: {
        heading: ['Outfit', 'sans-serif'],
        body: ['Outfit', 'sans-serif']
      }
    },
  },
  plugins: [],
}
