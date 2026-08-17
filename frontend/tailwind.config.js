/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Fraunces', 'serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
      },
      colors: {
        // Brand navy — used for the sidebar, hero panels, headings, and
        // "primary" semantic accents (active nav item, brand marks).
        leaf: {
          50: '#eef1f7',
          100: '#dde3ef',
          200: '#b9c5dc',
          300: '#8fa0c2',
          400: '#5f74a0',
          500: '#3d517f',
          600: '#293b64',
          700: '#1e2c4d',
          800: '#161f38',
          900: '#0e1526',
          950: '#080c17',
        },
        // Rust / terracotta orange — the CTA color: primary buttons, the
        // logo mark, and highlighted accents.
        harvest: {
          50: '#fdf3ee',
          100: '#fbe4d8',
          200: '#f6c7ab',
          300: '#eea378',
          400: '#e17f4f',
          500: '#cf5f30',
          600: '#b8481f',
          700: '#953a19',
          800: '#7a3016',
          900: '#5c2410',
        },
        // Warm cream — the light background used across the app instead of
        // a cool gray, and the auth-page background.
        cream: {
          50: '#fdfbf6',
          100: '#f9f4ea',
          200: '#f3ecdc',
          300: '#e9dfc7',
        },
      },
      boxShadow: {
        card: '0 1px 2px rgba(15, 23, 42, 0.04), 0 8px 24px rgba(15, 23, 42, 0.06)',
      },
    },
  },
  plugins: [],
};
