import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        admin: {
          bg: '#f5f7fb',
          panel: '#ffffff',
          border: '#dbe3f0',
          text: '#10233f',
          muted: '#64748b',
          accent: '#0f6cbd'
        }
      }
    }
  },
  plugins: []
};

export default config;
