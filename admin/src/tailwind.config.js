/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Couleurs FasoTravel - Identité Burkina Faso
        fasotravel: {
          red: '#dc2626',
          yellow: '#f59e0b',
          green: '#16a34a',
        },
        
        // Redéfinition des couleurs Tailwind par défaut pour FasoTravel
        primary: {
          DEFAULT: '#dc2626',
          foreground: '#ffffff',
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#dc2626',
          600: '#b91c1c',
          700: '#991b1b',
          800: '#7f1d1d',
          900: '#6b1d1d',
        },
        
        secondary: {
          DEFAULT: '#f59e0b',
          foreground: '#111827',
          50: '#fefce8',
          100: '#fef9c3',
          200: '#fef08a',
          300: '#fde047',
          400: '#facc15',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        
        accent: {
          DEFAULT: '#16a34a',
          foreground: '#ffffff',
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#16a34a',
          600: '#15803d',
          700: '#166534',
          800: '#14532d',
          900: '#14532d',
        },
        
        // Couleurs UI
        destructive: {
          DEFAULT: '#dc2626',
          foreground: '#ffffff',
        },
        
        muted: {
          DEFAULT: '#f3f4f6',
          foreground: '#6b7280',
        },
        
        card: {
          DEFAULT: '#ffffff',
          foreground: '#111827',
        },
        
        popover: {
          DEFAULT: '#ffffff',
          foreground: '#111827',
        },
        
        border: '#e5e7eb',
        input: '#e5e7eb',
        ring: '#dc2626',
        
        background: '#ffffff',
        foreground: '#111827',
        
        'input-background': '#ffffff',
        'switch-background': '#e5e7eb',
      },
      
      backgroundImage: {
        'gradient-burkinabe': 'linear-gradient(to right, #dc2626, #f59e0b, #16a34a)',
        'gradient-red': 'linear-gradient(to right, #dc2626, #b91c1c)',
        'gradient-yellow': 'linear-gradient(to right, #f59e0b, #d97706)',
        'gradient-green': 'linear-gradient(to right, #16a34a, #15803d)',
      },
      
      boxShadow: {
        'premium': '0 1px 3px rgba(0, 0, 0, 0.05), 0 10px 25px -5px rgba(220, 38, 38, 0.1), 0 8px 10px -6px rgba(220, 38, 38, 0.05)',
        'xl-premium': '0 4px 6px rgba(0, 0, 0, 0.05), 0 20px 40px -10px rgba(220, 38, 38, 0.2), 0 15px 20px -12px rgba(220, 38, 38, 0.1)',
      },
    },
  },
  plugins: [],
}
