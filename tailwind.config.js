/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        // Your custom color scheme (UNCOMMENTED!)
        "zoro-dark": "#030c24", // Primary dark navy
        "zoro-yellow": "#FFC400", // Bright yellow for buttons/accents (fixed - removed extra F)
        "zoro-green": "#1ED760", // Live indicator green
        "zoro-white": "#FFFFFF", // Primary text
        "zoro-grey": "#9CA3AF", // Secondary text
        "zoro-card": "#0A1628", // Card background (slightly lighter)
        "zoro-border": "#1a2744" // Border color
      }
    }
  },
  plugins: [
    function({ addUtilities }) {
      const newUtilities = {
        ".scrollbar-hide": {
          "-ms-overflow-style": "none",
          "scrollbar-width": "none",
          "&::-webkit-scrollbar": {
            display: "none"
          }
        }
      };
      addUtilities(newUtilities);
    }
  ]
};
