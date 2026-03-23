/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#2563eb',   // Professional Blue
          secondary: '#7c3aed', // Soft Purple for accents
          success: '#10b981',
          error: '#ef4444',
          warning: '#f59e0b',
          neutral: '#64748b',
        },
        surface: {
          50: '#f8fafc',
          100: '#f1f5f9',
          card: '#ffffff',
        }
      },
      borderRadius: {
        'premium': '1rem', // Softer, modern corners
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
      }
    },
  },
  plugins: [],
}