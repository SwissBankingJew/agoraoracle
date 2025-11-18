import type { Config } from 'tailwindcss'

export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{ts,tsx,js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Oracle Foundation
        background: '#0a0e14',
        foreground: '#f9fafb',

        // Card/Panel colors
        card: {
          DEFAULT: '#0d1117',
          foreground: '#f9fafb',
        },
        panel: {
          DEFAULT: '#111827',
          border: '#1f2937',
        },

        // Data visualization
        primary: {
          DEFAULT: '#06b6d4', // cyan-500
          foreground: '#0a0e14',
        },
        positive: '#f59e0b', // amber-500 for gains/long
        negative: '#ef4444',  // red-500 for losses/short
        neutral: '#06b6d4',   // cyan-500 for info
        alert: '#f97316',     // orange-500 for warnings
        success: '#10b981',   // emerald-500 for confirmations

        // Text hierarchy
        muted: {
          DEFAULT: '#1a1f2e',
          foreground: '#6b7280',
        },
        secondary: '#d1d5db',
        disabled: '#4b5563',

        // Border/divider
        border: 'rgba(255, 255, 255, 0.1)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
      },
      spacing: {
        '128': '32rem',
        '144': '36rem',
      },
      animation: {
        'flash': 'flash 0.5s ease-in-out',
        'slide-up': 'slide-up 0.3s ease-out',
        'scroll-left': 'scroll-left 30s linear infinite',
      },
      keyframes: {
        flash: {
          '0%, 100%': { backgroundColor: 'transparent' },
          '50%': { backgroundColor: 'rgba(6, 182, 212, 0.2)' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'scroll-left': {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
      borderRadius: {
        none: '0',
      },
    },
  },
  plugins: [],
} satisfies Config
