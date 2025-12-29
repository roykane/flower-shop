/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary - Vibrant Rose/Magenta with purple undertones
        primary: {
          DEFAULT: '#E05D8C',
          light: '#F087A9',
          dark: '#C93D6E',
          50: '#FEF1F5',
          100: '#FDE4EC',
          200: '#FACAD9',
          300: '#F6A3BC',
          400: '#F087A9',
          500: '#E05D8C',
          600: '#C93D6E',
          700: '#A82E5A',
          800: '#872447',
          900: '#6B1D39',
        },
        // Secondary - Rich Blue-Violet blend
        secondary: {
          DEFAULT: '#6366F1',
          light: '#818CF8',
          dark: '#4F46E5',
          50: '#EEF2FF',
          100: '#E0E7FF',
          200: '#C7D2FE',
          300: '#A5B4FC',
          400: '#818CF8',
          500: '#6366F1',
          600: '#4F46E5',
          700: '#4338CA',
          800: '#3730A3',
          900: '#312E81',
        },
        // Accent - Warm Amber/Gold
        accent: {
          DEFAULT: '#F59E0B',
          light: '#FCD34D',
          dark: '#D97706',
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
          800: '#92400E',
          900: '#78350F',
        },
        // Cool Neutrals with subtle warmth
        neutral: {
          50: '#FAFAFA',
          100: '#F5F5F5',
          200: '#E5E5E5',
          300: '#D4D4D4',
          400: '#A3A3A3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
          950: '#0A0A0A',
        },
        // Cream Background - warmer with better contrast
        cream: {
          DEFAULT: '#FEFDFB',
          50: '#FEFDFB',
          100: '#FBF8F3',
          200: '#F5F0E8',
        },
        // Violet blend for gradients
        violet: {
          DEFAULT: '#8B5CF6',
          light: '#A78BFA',
          dark: '#7C3AED',
          50: '#F5F3FF',
          100: '#EDE9FE',
          200: '#DDD6FE',
          300: '#C4B5FD',
          400: '#A78BFA',
          500: '#8B5CF6',
          600: '#7C3AED',
          700: '#6D28D9',
          800: '#5B21B6',
          900: '#4C1D95',
        },
      },
      fontFamily: {
        sans: ['Poppins', 'system-ui', 'sans-serif'],
        heading: ['Poppins', 'system-ui', 'sans-serif'],
        display: ['Poppins', 'sans-serif'],
        accent: ['Poppins', 'sans-serif'],
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.08), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'elegant': '0 10px 40px -10px rgba(224, 93, 140, 0.25), 0 4px 25px -5px rgba(0, 0, 0, 0.1)',
        'float': '0 25px 50px -12px rgba(0, 0, 0, 0.2)',
        'glow': '0 0 20px rgba(224, 93, 140, 0.3)',
        'glow-accent': '0 0 20px rgba(245, 158, 11, 0.3)',
        'inner-glow': 'inset 0 2px 4px 0 rgba(255, 255, 255, 0.1)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'fadeIn': 'fadeIn 0.5s ease-out forwards',
        'slide-up': 'slideUp 0.6s ease-out',
        'float': 'float 3s ease-in-out infinite',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'wiggle': 'wiggle 0.5s ease-in-out',
        'scaleIn': 'scaleIn 0.4s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-soft': 'linear-gradient(135deg, var(--tw-gradient-stops))',
        'gradient-primary': 'linear-gradient(135deg, #E05D8C 0%, #8B5CF6 100%)',
        'gradient-accent': 'linear-gradient(135deg, #F59E0B 0%, #E05D8C 100%)',
        'gradient-hero': 'linear-gradient(135deg, #FEF1F5 0%, #EEF2FF 50%, #FFFBEB 100%)',
      },
    },
  },
  plugins: [],
}
