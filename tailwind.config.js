/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f5f7ff",
          100: "#eaeeff",
          200: "#d7ddff",
          300: "#b6c0ff",
          400: "#8e9aff",
          500: "#6473ff",
          600: "#4f57f0",
          700: "#4145d4",
          800: "#3438ac",
          900: "#2f3487"
        },
        accent: {
          500: "#0eb6a5",
          600: "#0b9a8c"
        }
      },
      boxShadow: {
        soft: "0 20px 60px rgba(15, 23, 42, 0.14)"
      },
      backgroundImage: {
        "hero-mesh":
          "radial-gradient(circle at top left, rgba(100, 115, 255, 0.24), transparent 32%), radial-gradient(circle at top right, rgba(14, 182, 165, 0.2), transparent 26%), linear-gradient(135deg, #f8fbff 0%, #eef3ff 45%, #f6fffd 100%)"
      },
      fontFamily: {
        display: ["Sora", "sans-serif"],
        body: ["Manrope", "sans-serif"]
      }
    }
  },
  plugins: []
};
