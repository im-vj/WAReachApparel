/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#10b981",
        "primary-dark": "#059669",
        "bg-dark": "#111827",
        "surface-dark": "#1f2937",
        "surface-dark-light": "#374151"
      }
    },
  },
  plugins: [],
}
