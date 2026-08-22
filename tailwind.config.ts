import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: 'rgb(var(--bg) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        elevated: 'rgb(var(--elevated) / <alpha-value>)',
        overlay: 'rgb(var(--overlay) / <alpha-value>)',
        line: 'rgb(var(--line) / <alpha-value>)',
        'line-strong': 'rgb(var(--line-strong) / <alpha-value>)',
        ink: 'rgb(var(--ink) / <alpha-value>)',
        muted: 'rgb(var(--muted) / <alpha-value>)',
        faint: 'rgb(var(--faint) / <alpha-value>)',
        accent: {
          DEFAULT: 'rgb(var(--accent) / <alpha-value>)',
          hover: 'rgb(var(--accent-hover) / <alpha-value>)',
          soft: 'rgb(var(--accent-soft) / <alpha-value>)',
        },
        positive: 'rgb(var(--positive) / <alpha-value>)',
        negative: 'rgb(var(--negative) / <alpha-value>)',
        warning: 'rgb(var(--warning) / <alpha-value>)',
        info: 'rgb(var(--info) / <alpha-value>)',
        grape: 'rgb(var(--grape) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      // Extra steps so subtle tints like `bg-accent/12` are expressible without
      // dropping into bracket notation everywhere.
      opacity: {
        4: '0.04',
        6: '0.06',
        7: '0.07',
        8: '0.08',
        12: '0.12',
        14: '0.14',
        15: '0.15',
        18: '0.18',
        22: '0.22',
        35: '0.35',
        45: '0.45',
        55: '0.55',
        65: '0.65',
        85: '0.85',
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem', letterSpacing: '0.01em' }],
        xs: ['0.75rem', { lineHeight: '1.125rem', letterSpacing: '0' }],
        sm: ['0.8125rem', { lineHeight: '1.25rem', letterSpacing: '-0.003em' }],
        base: ['0.9375rem', { lineHeight: '1.5rem', letterSpacing: '-0.009em' }],
        lg: ['1.0625rem', { lineHeight: '1.6rem', letterSpacing: '-0.014em' }],
        xl: ['1.3125rem', { lineHeight: '1.75rem', letterSpacing: '-0.019em' }],
        '2xl': ['1.625rem', { lineHeight: '2rem', letterSpacing: '-0.021em' }],
        '3xl': ['2rem', { lineHeight: '2.375rem', letterSpacing: '-0.024em' }],
        '4xl': ['2.75rem', { lineHeight: '3rem', letterSpacing: '-0.028em' }],
        '5xl': ['3.5rem', { lineHeight: '3.75rem', letterSpacing: '-0.032em' }],
      },
      borderRadius: {
        sm: '5px',
        DEFAULT: '7px',
        md: '8px',
        lg: '10px',
        xl: '12px',
        '2xl': '16px',
        '3xl': '20px',
      },
      boxShadow: {
        xs: '0 1px 2px 0 rgb(0 0 0 / 0.04)',
        sm: '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.04)',
        md: '0 4px 12px -2px rgb(0 0 0 / 0.08), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
        lg: '0 12px 32px -8px rgb(0 0 0 / 0.14), 0 4px 8px -4px rgb(0 0 0 / 0.08)',
        xl: '0 24px 56px -16px rgb(0 0 0 / 0.22), 0 8px 16px -8px rgb(0 0 0 / 0.1)',
        glow: '0 0 0 1px rgb(var(--accent) / 0.4), 0 0 24px -4px rgb(var(--accent) / 0.35)',
      },
      transitionTimingFunction: {
        swift: 'cubic-bezier(0.16, 1, 0.3, 1)',
        snap: 'cubic-bezier(0.32, 0.72, 0, 1)',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.96)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        'slide-in-right': {
          from: { opacity: '0', transform: 'translateX(16px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        'toast-in': {
          '0%': { opacity: '0', transform: 'translateY(12px) scale(0.96)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'xp-float': {
          '0%': { opacity: '0', transform: 'translateY(6px) scale(0.9)' },
          '20%': { opacity: '1', transform: 'translateY(0) scale(1)' },
          '80%': { opacity: '1', transform: 'translateY(-14px) scale(1)' },
          '100%': { opacity: '0', transform: 'translateY(-28px) scale(0.94)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(0.9)', opacity: '0.7' },
          '70%': { transform: 'scale(1.7)', opacity: '0' },
          '100%': { transform: 'scale(1.7)', opacity: '0' },
        },
        'breathe': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.55' },
        },
        'draw-dash': {
          from: { strokeDashoffset: 'var(--dash-from)' },
          to: { strokeDashoffset: 'var(--dash-to)' },
        },
        'marquee-y': {
          from: { transform: 'translateY(0)' },
          to: { transform: 'translateY(-50%)' },
        },
        'drift-a': {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%': { transform: 'translate(6%, 10%) scale(1.06)' },
          '66%': { transform: 'translate(-4%, 4%) scale(0.96)' },
        },
        'drift-b': {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '40%': { transform: 'translate(-8%, 6%) scale(1.08)' },
          '70%': { transform: 'translate(5%, -4%) scale(0.94)' },
        },
        'drift-c': {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '50%': { transform: 'translate(4%, -8%) scale(1.05)' },
        },
        'glow-pulse': {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.25s ease-out both',
        'fade-up': 'fade-up 0.35s cubic-bezier(0.16, 1, 0.3, 1) both',
        'scale-in': 'scale-in 0.2s cubic-bezier(0.16, 1, 0.3, 1) both',
        'slide-in-right': 'slide-in-right 0.3s cubic-bezier(0.16, 1, 0.3, 1) both',
        'toast-in': 'toast-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) both',
        'xp-float': 'xp-float 1.6s ease-out forwards',
        shimmer: 'shimmer 1.8s infinite',
        'pulse-ring': 'pulse-ring 2s cubic-bezier(0.16, 1, 0.3, 1) infinite',
        breathe: 'breathe 2.4s ease-in-out infinite',
        'marquee-y': 'marquee-y 28s linear infinite',
        'drift-a': 'drift-a 22s ease-in-out infinite',
        'drift-b': 'drift-b 28s ease-in-out infinite',
        'drift-c': 'drift-c 32s ease-in-out infinite',
        'glow-pulse': 'glow-pulse 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
