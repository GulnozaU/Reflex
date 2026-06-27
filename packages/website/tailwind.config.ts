import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#121212',
        surface: '#1A1A1A',
        card: '#202020',
        line: '#303030',
        foreground: '#E7E5E4',
        muted: '#A8A29E',
        sage: '#A3B18A',
        bronze: '#D4A373'
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace']
      },
      borderRadius: {
        DEFAULT: '6px'
      },
      animation: {
        'grid-drift': 'grid-drift 80s linear infinite',
        'status-pulse': 'status-pulse 2s ease-in-out infinite',
        'fade-up': 'fade-up 0.55s ease-out both'
      },
      keyframes: {
        'grid-drift': {
          '0%': { transform: 'translate(0, 0)' },
          '100%': { transform: 'translate(40px, 40px)' }
        },
        'status-pulse': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' }
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        }
      },
      transitionTimingFunction: {
        technical: 'cubic-bezier(0.4, 0, 0.2, 1)'
      }
    }
  },
  plugins: []
};

export default config;
