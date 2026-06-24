/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bingo: {
          bg: '#0a0e1a',
          bg2: '#111827',
          bg3: '#1a2235',
          bg4: '#1e2d45',
          card: '#1e293b',
          border: '#2d3f5a',
          gold: '#fbbf24',
          accent: '#f59e0b',
        },
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
      animation: {
        'pulse-glow': 'pulse 2s infinite',
        'bounce-in': 'bounceIn 0.5s ease',
        'number-pop': 'numberPop 0.3s ease',
      },
      keyframes: {
        bounceIn: { '0%': { transform: 'scale(0.8)', opacity: '0' }, '100%': { transform: 'scale(1)', opacity: '1' } },
        numberPop: { '0%': { transform: 'scale(1.3)' }, '100%': { transform: 'scale(1)' } },
      },
    },
  },
  plugins: [],
};
