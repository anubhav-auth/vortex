/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      animation: {
        grid: 'grid 15s linear infinite',
      },
      keyframes: {
        grid: {
          '0%':   { transform: 'translateY(-50%)' },
          '100%': { transform: 'translateY(0)' },
        },
      },
      colors: {
        'bg-void':       '#0f172a',
        'bg-surface':    '#1e293b',
        'accent-cyan':   '#38bdf8',
        'status-live':   '#4ade80',
        'status-warn':   '#fbbf24',
        'status-crit':   '#f87171',
        'text-primary':  '#f1f5f9',
        'text-secondary':'#94a3b8',
        'text-dim':      '#64748b',
        'border-dim':    '#334155',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
};
