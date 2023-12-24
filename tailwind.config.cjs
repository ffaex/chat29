/** @type {import('tailwindcss').Config}*/
const config = {
  content: ['./src/**/*.{html,js,svelte,ts}'],

  theme: {
    extend: {
      colors: {
        primary: {
          1000: "#142850",
          1100: "#27496D",
          1200: "#0C7B93",
          1300: "#00A8CC",
    }
  },
}},

  plugins: [require('@tailwindcss/forms'), require('@tailwindcss/typography')]
};

module.exports = config;
