/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // ─── Backgrounds ───────────────────────────────
        base: {
          DEFAULT: '#121212', // deepest background
          elevated: '#1a1a1a', // cards, panels
          highlight: '#282828', // hover surfaces
          press: '#3e3e3e', // active/pressed
        },
        // ─── Accent ────────────────────────────────────
        brand: {
          DEFAULT: '#1db954', // Spotify-style green
          hover: '#1ed760',
          muted: '#148a3d',
        },
        // ─── Text ──────────────────────────────────────
        text: {
          primary: '#ffffff',
          secondary: '#b3b3b3',
          muted: '#6a6a6a',
          disabled: '#4a4a4a',
        },
        // ─── Borders / Dividers ────────────────────────
        border: {
          subtle: '#2a2a2a',
          DEFAULT: '#333333',
        },
        // ─── States ────────────────────────────────────
        error: '#f15e6c',
        warning: '#f59e0b',
        success: '#1db954',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'Helvetica', 'Arial', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
      },
      spacing: {
        // Player bar height — used by AppShell
        player: '90px',
        // Sidebar width
        sidebar: '240px',
      },
      borderRadius: {
        pill: '9999px',
      },
      boxShadow: {
        card: '0 4px 24px rgba(0, 0, 0, 0.5)',
        player: '0 -4px 24px rgba(0, 0, 0, 0.6)',
      },
      transitionTimingFunction: {
        smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        spin: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out forwards',
        shimmer: 'shimmer 1.8s infinite linear',
        'spin-slow': 'spin 3s linear infinite',
      },
    },
  },
  plugins: [],
};
