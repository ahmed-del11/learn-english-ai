/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: { base: '#0F172A', accent: '#6366F1', success: '#10B981', error: '#F43F5E', surface: 'rgba(30, 41, 59, 0.7)' },
        light: { base: '#F8FAFC', accent: '#4F46E5', success: '#059669', error: '#E11D48', surface: 'rgba(255, 255, 255, 0.7)' }
      },
      fontFamily: {
        en: ['Inter', 'sans-serif'],
        ar: ['Cairo', 'sans-serif'],
      },
      animation: {
        'float-up': 'floatUp 1.5s ease-out forwards',
        'pulse-glow': 'pulseGlow 2s infinite',
        'shake': 'shake 0.5s cubic-bezier(.36,.07,.19,.97) both',
        'flip': 'flip 0.6s ease-in-out',
      },
      keyframes: {
        floatUp: {
          '0%': { opacity: 1, transform: 'translateY(0) scale(1)' },
          '100%': { opacity: 0, transform: 'translateY(-50px) scale(1.2)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: 1, transform: 'scale(1)' },
          '50%': { opacity: 0.8, transform: 'scale(1.05)', boxShadow: '0 0 15px rgba(99, 102, 241, 0.5)' },
        },
        shake: {
          '10%, 90%': { transform: 'translate3d(-1px, 0, 0)' },
          '20%, 80%': { transform: 'translate3d(2px, 0, 0)' },
          '30%, 50%, 70%': { transform: 'translate3d(-4px, 0, 0)' },
          '40%, 60%': { transform: 'translate3d(4px, 0, 0)' }
        }
      }
    },
  },
  plugins: [],
}
