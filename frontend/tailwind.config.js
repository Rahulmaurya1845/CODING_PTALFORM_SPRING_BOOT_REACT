/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        display: ['"Bricolage Grotesque"', "system-ui", "sans-serif"],
        sans: ['"DM Sans"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
      },
      colors: {
        ink: { 950: "#080c1a", 900: "#0b1020", 800: "#121a33", 700: "#1a2444", 600: "#232e52", 500: "#34416b" },
        brand: { 50: "#eef1ff", 100: "#dde3ff", 200: "#bcc8ff", 400: "#7b94ff", 500: "#4c6fff", 600: "#3a57e8", 700: "#2d44c2" },
        signal: { 400: "#ffc566", 500: "#ffb547", 600: "#f29b16" },
        mint: { 400: "#4fe0b8", 500: "#2fd3a3", 600: "#14b186" },
        coral: { 400: "#ff8a8a", 500: "#ff6b6b", 600: "#ec4b4b" },
      },
      keyframes: {
        rise: { "0%": { opacity: 0, transform: "translateY(10px)" }, "100%": { opacity: 1, transform: "none" } },
        stamp: { "0%": { opacity: 0, transform: "scale(1.8) rotate(-12deg)" }, "60%": { opacity: 1, transform: "scale(.94) rotate(-4deg)" }, "100%": { opacity: 1, transform: "scale(1) rotate(-3deg)" } },
        pulseDot: { "0%,100%": { opacity: 1 }, "50%": { opacity: 0.3 } },
        slideIn: { "0%": { opacity: 0, transform: "translateX(-12px)" }, "100%": { opacity: 1, transform: "none" } },
      },
      animation: {
        rise: "rise .45s ease-out both",
        stamp: "stamp .5s cubic-bezier(.2,.9,.3,1.2) both",
        pulseDot: "pulseDot 1.4s ease-in-out infinite",
        slideIn: "slideIn .4s ease-out both",
      },
    },
  },
  plugins: [],
};
