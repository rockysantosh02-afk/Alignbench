import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#0a0a0b',
        foreground: '#fafafa',
        accent: {
          DEFAULT: '#4f46e5',
          foreground: '#ffffff',
        },
        agree: {
          DEFAULT: '#22c55e',
          foreground: '#ffffff',
        },
        disagree: {
          DEFAULT: '#f59e0b',
          foreground: '#ffffff',
        },
        fail: {
          DEFAULT: '#ef4444',
          foreground: '#ffffff',
        },
        border: '#27272a',
        input: '#27272a',
        ring: '#4f46e5',
        muted: {
          DEFAULT: '#18181b',
          foreground: '#a1a1aa',
        },
        card: {
          DEFAULT: '#18181b',
          foreground: '#fafafa',
        },
        popover: {
          DEFAULT: '#18181b',
          foreground: '#fafafa',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-jetbrains-mono)', 'monospace'],
      },
      borderRadius: {
        lg: '0.5rem',
        md: 'calc(0.5rem - 2px)',
        sm: 'calc(0.5rem - 4px)',
      },
    },
  },
  plugins: [],
}
export default config