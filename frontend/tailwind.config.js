/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Grocify brand palette — leafy green (fresh produce) + deep harvest blue
        leaf: {
          50: '#f2faf1',
          100: '#e0f3dd',
          200: '#c1e7bb',
          300: '#95d488',
          400: '#65ba55',
          500: '#419e33',
          600: '#2f7f25',
          700: '#26651f',
          800: '#22501e',
          900: '#1d431b',
        },
        harvest: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#2563eb',
          600: '#1d4ed8',
          700: '#1e40af',
          900: '#1e2f5c',
        },
      },
      fontFamily: {
        display: ['"Fraunces"', 'serif'],
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(16, 24, 40, 0.06), 0 1px 3px rgba(16, 24, 40, 0.08)',
      },
    },
  },
  plugins: [],
};
