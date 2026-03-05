/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'display': ['"Playfair Display"', 'Georgia', 'serif'],
        'body': ['"DM Sans"', 'sans-serif'],
        'mono': ['"DM Mono"', 'monospace'],
      },
      colors: {
        ink: {
          50: '#f5f3ee',
          100: '#e8e4d8',
          200: '#d4ccb8',
          300: '#b8ac90',
          400: '#9a8e6e',
          500: '#7d7254',
          600: '#635a42',
          700: '#4a4332',
          800: '#322e22',
          900: '#1e1b14',
          950: '#100f0a',
        },
        sage: {
          400: '#8fa888',
          500: '#6d8f66',
          600: '#527549',
        },
        blush: {
          400: '#c9907a',
          500: '#b8755f',
        },
        amber: {
          warm: '#d4a853',
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(16px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-12px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
      },
    },
  },
  plugins: [],
}
