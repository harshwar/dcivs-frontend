export default {
  content: ["./src/**/*.{html,js,jsx,ts,tsx,vue}"],
  darkMode: 'class',
  theme: {
    extend: {
      keyframes: {
        fadeSlideUp: {
          '0%': { opacity: '0', transform: 'translateY(15px)' },
          '10%': { opacity: '0.1' }, /* Avoid harsh snap */
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeSlideDown: {
          '0%': { opacity: '0', transform: 'translateY(-15px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '1', filter: 'brightness(1)' },
          '50%': { opacity: '.8', filter: 'brightness(1.2)' },
        }
      },
      animation: {
        'fade-slide-up': 'fadeSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'fade-slide-down': 'fadeSlideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'pulse-glow': 'pulseGlow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}

