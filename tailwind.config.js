/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Παλέτα Democratia - δημοκρατικό βαθύ μπλε με καθαρές αποχρώσεις
        brand: {
          50: '#eef4ff',
          100: '#d9e6ff',
          200: '#bcd2ff',
          300: '#8eb4ff',
          400: '#598bff',
          500: '#3563eb',
          600: '#1d44d8',
          700: '#1934b0',
          800: '#1a2f8e',
          900: '#1b2c72',
        },
        ink: '#0f1729',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        phone: '0 30px 60px -15px rgba(15, 23, 41, 0.35)',
        card: '0 1px 3px rgba(15, 23, 41, 0.08), 0 1px 2px rgba(15, 23, 41, 0.04)',
      },
      keyframes: {
        'slide-up': {
          '0%': { transform: 'translateY(12px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'grow-x': {
          '0%': { transform: 'scaleX(0)' },
          '100%': { transform: 'scaleX(1)' },
        },
      },
      animation: {
        'slide-up': 'slide-up 0.25s ease-out',
        'grow-x': 'grow-x 0.6s ease-out',
      },
    },
  },
  plugins: [],
}
