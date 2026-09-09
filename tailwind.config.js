/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bis: {
          navy:       '#003580',
          'navy-dark': '#00265D',
          'navy-light':'#1650A1',
          saffron:    '#B45309',       /* dark amber — white text contrast ✓ */
          'saffron-light': '#D97706', /* medium amber for hover */
          green:      '#138808',
          'green-light': '#1CA310',
          gold:       '#C8A951',
          'gold-light': '#D4BC7A',
          white:      '#FFFFFF',
          'off-white': '#F8FAFC',
          'light-bg': '#F1F5F9',
        },
        dark: {
          bg:              '#020817', /* Deeper, richer dark slate */
          'bg-secondary':  '#0F172A',
          'bg-card':       '#1E293B',
          border:          '#334155',
          text:            '#F8FAFC',
          'text-muted':    '#94A3B8',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        heading: ['Poppins', 'Inter', 'sans-serif'],
        hindi: ['Noto Sans Devanagari', 'sans-serif'],
      },
      fontSize: {
        'xs':   ['0.75rem',  { lineHeight: '1.125rem' }],
        'sm':   ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem',     { lineHeight: '1.5rem' }],
        'lg':   ['1.125rem', { lineHeight: '1.75rem' }],
        'xl':   ['1.25rem',  { lineHeight: '1.75rem' }],
        '2xl':  ['1.5rem',   { lineHeight: '2rem' }],
        '3xl':  ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl':  ['2.25rem',  { lineHeight: '2.5rem' }],
      },
      boxShadow: {
        'gov':      '0 1px 2px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 53, 128, 0.05)',
        'gov-md':   '0 4px 6px -1px rgba(0, 53, 128, 0.05), 0 2px 4px -2px rgba(0, 53, 128, 0.05)',
        'gov-lg':   '0 10px 15px -3px rgba(0, 53, 128, 0.08), 0 4px 6px -4px rgba(0, 53, 128, 0.04)',
        'card':     '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)',
        'inset-top':'inset 0 1px 0 rgba(255,255,255,0.15)',
      },
      borderRadius: {
        'gov':    '6px',
        'gov-lg': '10px',
        'gov-xl': '16px',
      },
      backgroundImage: {
        'gov-gradient': 'linear-gradient(135deg, #00265D 0%, #003580 100%)',
        'saffron-gradient': 'linear-gradient(135deg, #e67300 0%, #FF9933 100%)',
        'hero-pattern': "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
      },
      animation: {
        'fade-in': 'fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-in-right': 'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'ticker': 'ticker 40s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(12px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(12px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        ticker: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(-100%)' },
        },
      },
    },
  },
  plugins: [],
}
