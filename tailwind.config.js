/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        cosmos: {
          900: '#0f0c29',
          800: '#1a1642',
          700: '#24243e',
          600: '#302b63',
          500: '#3d3780',
        },
        rose: {
          gold: '#e8b4b8',
          light: '#d4a5a5',
          pink: '#ff6b9d',
          soft: '#ffb6c1',
        },
        star: {
          white: '#f0f0ff',
          mint: '#64ffda',
          purple: '#b794f6',
        }
      },
      fontFamily: {
        display: ['"ZCOOL XiaoWei"', 'serif'],
        sans: ['"Noto Sans SC"', 'sans-serif'],
        number: ['"Quicksand"', 'sans-serif'],
      },
      animation: {
        'pulse-glow': 'pulse-glow 3s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'spin-slow': 'spin 20s linear infinite',
        'ripple': 'ripple 2s ease-out infinite',
        'breathe': 'breathe 4s ease-in-out infinite',
        'twinkle': 'twinkle 3s ease-in-out infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { opacity: '0.6', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.05)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        'ripple': {
          '0%': { transform: 'scale(0.8)', opacity: '1' },
          '100%': { transform: 'scale(2)', opacity: '0' },
        },
        'breathe': {
          '0%, 100%': { transform: 'scale(1)', filter: 'brightness(1)' },
          '50%': { transform: 'scale(1.02)', filter: 'brightness(1.2)' },
        },
        'twinkle': {
          '0%, 100%': { opacity: '0.3' },
          '50%': { opacity: '1' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};
