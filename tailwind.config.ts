import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        ananda: ['Ananda', 'serif'],
        catalish: ['Catalish Huntera', 'serif'],
        drugs: ['TT Drugs', 'sans-serif'],
        minimalist: ['Minimalist', 'sans-serif'],
        renogare: ['Renogare', 'system-ui', 'sans-serif'],
        ttdrugs: ['TT Drugs', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "#1a1625",
        foreground: "#f8e1eb",
        primary: {
          DEFAULT: "#ff6b9d",
          hover: "#ff4f8b",
          foreground: "#ffffff",
        },
        secondary: {
          DEFAULT: "#b86ef8",
          hover: "#a54ff8",
          foreground: "#ffffff",
        },
        accent: {
          DEFAULT: "#ff9cc7",
          hover: "#ff85b9",
          foreground: "#1a1625",
        },
        card: {
          DEFAULT: "#241b2f",
          hover: "#2d2239",
          foreground: "#f8e1eb",
        },
        muted: {
          DEFAULT: "#9c8aa5",
          hover: "#8a7591",
          foreground: "#ffffff",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        }
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        'fade-in': 'fade-in 0.5s ease-in-out',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}

export default config
