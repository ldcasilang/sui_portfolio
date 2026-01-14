/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'sui-dark': '#0C1422',
        'sui-blue': '#3692FE',
        'sui-card': '#0b1b3a',
        'sui-light-blue': '#93c5fd',
        'sui-border': '#4897EF',
        'sui-skill': '#1e40af',
      },
      borderRadius: {
        'custom-28': '28px',
        'custom-26': '26px',
        'custom-24': '24px',
        'custom-14': '14px',
        'custom-12': '12px',
      },
      boxShadow: {
        'avatar-glow': '0 0 40px rgba(59, 130, 246, 0.8)',
      },
      fontSize: {
        'sui-64': '64px',
        'sui-48': '48px',
        'sui-20': '20px',
        'sui-16': '16px',
        'sui-14': '14px',
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(to bottom, #020617, #3692FE, #ffffff)',
        'hero-card': 'linear-gradient(to bottom, #020617, #0b1b3a)',
        'move-gradient': 'linear-gradient(145deg, #020617, #0b1b3a)',
        'name-gradient': 'linear-gradient(90deg, #ffffff, #3692FE)',
        'title-line': 'linear-gradient(to right, #3692FE, #0C1422)',
      },
      fontFamily: {
        'inter': ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}