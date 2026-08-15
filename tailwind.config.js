/** @type {import('tailwindcss').Config} */
module.exports = {
  important: true,
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      colors: {
        primary: '#b0e9fa',
        secondary: '#06aee9',
        success: '#b0fab0',
        warning: '#fafab0',
        error: '#fab0b0',

        'success-content': '#0aa10a',
        'warning-content': '#E4A11B',
        'error-content': '#a10a0a',
        // "tertiary": "#004085",
        // "quaternary": "#002040",
        // "quinary": "#001020",
        // "black": "#000000",
      },
    },
  },
  plugins: [],
}
