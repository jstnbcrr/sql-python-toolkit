/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#0D1117',
          secondary: '#161B22',
          tertiary: '#21262D',
          card: '#1C2128',
        },
        accent: {
          sql: '#00D4FF',
          python: '#FFB347',
          success: '#39D353',
          warning: '#F0A500',
          error: '#FF4757',
          muted: '#8B949E',
        },
        border: {
          default: '#30363D',
          subtle: '#21262D',
          strong: '#484F58',
        },
      },
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        body: ['Source Serif 4', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scanline': 'scanline 8s linear infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'typewriter': 'typewriter 0.05s steps(1) forwards',
        'float': 'float 6s ease-in-out infinite',
        'particle-burst': 'particle-burst 0.6s ease-out forwards',
      },
      keyframes: {
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px #00D4FF40, 0 0 10px #00D4FF20' },
          '100%': { boxShadow: '0 0 20px #00D4FF80, 0 0 40px #00D4FF40' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'particle-burst': {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '100%': { transform: 'scale(2)', opacity: '0' },
        },
      },
      backgroundImage: {
        'grid-pattern': 'linear-gradient(rgba(0,212,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.03) 1px, transparent 1px)',
        'gradient-sql': 'linear-gradient(135deg, #00D4FF20, #0099CC20)',
        'gradient-python': 'linear-gradient(135deg, #FFB34720, #FF8C0020)',
        'gradient-success': 'linear-gradient(135deg, #39D35320, #27AE4020)',
      },
      backgroundSize: {
        'grid': '40px 40px',
      },
    },
  },
  plugins: [],
}
