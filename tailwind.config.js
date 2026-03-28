/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          pink: '#e91e8c',
          teal: '#62c4b0',
          dark: '#0f0f17',
          surface: '#141420',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        body: ['var(--font-body)', 'system-ui', 'sans-serif'],
      },
      spacing: {
        'touch': '44px',
      },
      fontSize: {
        'fluid-sm': 'clamp(0.875rem, 1.5vw, 1rem)',
        'fluid-base': 'clamp(1rem, 2vw, 1.125rem)',
        'fluid-lg': 'clamp(1.25rem, 2.5vw, 1.5rem)',
        'fluid-xl': 'clamp(1.5rem, 3vw, 2rem)',
        'fluid-2xl': 'clamp(2rem, 4vw, 3rem)',
        'fluid-3xl': 'clamp(2.5rem, 5vw, 4rem)',
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
        '3xl': '20px',
      },
    },
  },
  plugins: [],
};
