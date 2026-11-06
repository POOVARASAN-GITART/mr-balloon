import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Mr Balloon Brand Palette
        silver: {
          50: '#F5F5F5',
          100: '#E8E8E8',
          200: '#D1D1D1',
          300: '#B0B0B0',
          400: '#C0C0C0',
          500: '#A8A8A8',
          600: '#8C8C8C',
          700: '#6E6E6E',
          800: '#555555',
          900: '#404040',
        },
        gunmetal: {
          400: '#848482',
          500: '#6B6B69',
          600: '#525250',
        },
        platinum: {
          50: '#F8F8F7',
          100: '#EDEDEB',
          200: '#DCDCD9',
          300: '#C7C7C3',
        },
        // Warm accents
        coral: { 500: '#FF6B6B' },
        gold: { 500: '#FFD93D' },
        mint: { 500: '#6BCB77' },
        sky: { 500: '#4D96FF' },
        rose: { 500: '#FF6B9D' },
        lavender: { 500: '#C77DFF' },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-plus-jakarta)', 'var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-jetbrains-mono)', 'monospace'],
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'float-delayed': 'float 6s ease-in-out infinite 2s',
        'float-slow': 'float 8s ease-in-out infinite 1s',
        'bounce-subtle': 'bounceSubtle 2s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 3s ease-in-out infinite',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'ripple': 'ripple 0.6s ease-out forwards',
        'scale-in': 'scaleIn 0.2s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
          '50%': { transform: 'translateY(-20px) rotate(2deg)' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(192,192,192,0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(192,192,192,0.6)' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          from: { opacity: '0', transform: 'translateY(-10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          from: { opacity: '0', transform: 'translateX(20px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        ripple: {
          to: { transform: 'scale(1)', opacity: '0' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
      },
      backgroundImage: {
        'gradient-silver': 'linear-gradient(135deg, #C0C0C0 0%, #848482 100%)',
        'gradient-platinum': 'linear-gradient(135deg, #E5E4E2 0%, #C0C0C0 100%)',
        'gradient-warm': 'linear-gradient(135deg, #FF6B6B 0%, #FFD93D 100%)',
        'gradient-frost': 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(192,192,192,0.05) 100%)',
        'gradient-hero': 'linear-gradient(135deg, rgba(192,192,192,0.1) 0%, rgba(132,132,130,0.1) 50%, rgba(229,228,226,0.1) 100%)',
      },
      boxShadow: {
        'glass': '0 8px 32px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.2)',
        'glass-hover': '0 12px 40px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.3)',
        'metallic': '0 4px 20px rgba(192,192,192,0.3), inset 0 1px 0 rgba(255,255,255,0.4)',
        'card': '0 2px 12px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)',
        'card-hover': '0 8px 30px rgba(0,0,0,0.1), 0 4px 12px rgba(0,0,0,0.06)',
      },
      backdropBlur: {
        'glass': '16px',
        'glass-sm': '8px',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
      },
    },
  },
  plugins: [],
};

export default config;