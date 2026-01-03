/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
  safelist: [
    // Asegurar que los estilos de checkbox y radio no se eliminen en producción
    'accent-green-600',
    'accent-[#00A859]',
  ],
}

