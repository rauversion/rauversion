// See the Tailwind configuration guide for advanced usage
// https://tailwindcss.com/docs/configuration

const colors = require('tailwindcss/colors');

const subtleColor = "#E5E7EB";

module.exports = {
  darkMode: 'class',
  content: [
    '**/*.erb',
    './app/helpers/**/*.rb',
    './app/assets/stylesheets/**/*.css',
    './app/javascript/**/*.js',
    './app/javascript/**/*.ts',
    './app/javascript/**/*.tsx',
    './app/javascript/**/*.jsx',
    "./config/locales/*.yml",

  ],
  theme: {
    fontFamily: {
      sans: ["'Host Grotesk'", 'sans-serif'],
      serif: ["'Host Grotesk'", 'sans-serif'],
    },
    extend: {
      spacing: {
        18: '4.5rem',
        112: '28rem',
        120: '30rem',
      },
      colors: {
        emphasis: "var(--rau-bg-emphasis)",
        default: "var(--rau-bg, white)",
        subtle: "var(--rau-bg-subtle)",
        muted: "var(--rau-bg-muted)",
        inverted: "var(--rau-bg-inverted)",
        info: "var(--rau-bg-info)",
        success: "var(--rau-bg-success)",
        attention: "var(--rau-bg-attention)",
        error: "var(--rau-bg-error)",
        darkerror: "var(--rau-bg-dark-error)",
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        transparent: 'transparent',
        current: 'currentColor',
        black: colors.black,
        white: colors.white,
        gray: colors.stone,
        indigo: colors.indigo,
        red: colors.rose,
        green: colors.emerald,
        purple: colors.violet,
        blue: colors.blue,
        pink: colors.pink,
        amber: colors.amber,
        orange: colors.orange,
        teal: colors.teal,
        cyan: colors.cyan,
        yellow: colors.amber,
        brand: {
          default: "var(--rau-brand)",
          50: "#fdf2f8",
          100: "#fce7f3",
          200: "#fbcfe8",
          300: "#f9a8d4",
          400: "#f472b6",
          500: "#ec4899",
          600: "#db2777",
          700: "#be185d",
          800: "#9d174d",
          900: "#831843",
          950: "#500724"
        },
        link: {
          50: '#0053F20D',
          100: '#0053F21A',
          200: '#0053F233',
          300: '#0053F24D',
          400: '#0053F266',
          500: '#0053F280',
          600: '#0053F299',
          700: '#0053F2B3',
          800: '#0053F2CC',
          900: '#0053F2E6',
          DEFAULT: '#0053F2',
        },
      },
      borderColor: {
        emphasis: "var(--rau-border-emphasis, #9CA3AF)",
        default: "var(--rau-border, #D1D5DB)",
        subtle: `var(--rau-border-subtle, ${subtleColor})`,
        muted: "var(--rau-border-muted, #F3F4F6)",
        booker: `var(--rau-border-booker, ${subtleColor})`,
        error: "var(--rau-border-error, #AA2E26)",
      },
      textColor: {
        emphasis: "var(--rau-text-emphasis, #111827)",
        default: "var(--rau-text, #374151)",
        subtle: "var(--rau-text-subtle, #6B7280)",
        muted: "var(--rau-text-muted, #9CA3AF)",
        inverted: "var(--rau-text-inverted, white)",
        info: "var(--rau-text-info, #253985)",
        success: "var(--rau-text-success, #285231)",
        attention: "var(--rau-text-attention, #73321B)",
        error: "var(--rau-text-error, #752522)",
      },
      borderRadius: {
        lg: `var(--radius)`,
        md: `calc(var(--radius) - 2px)`,
        sm: "calc(var(--radius) - 4px)",
      },
      animation: {
        marquee: 'marquee 25s linear infinite',
        marquee2: 'marquee2 25s linear infinite',
        marquee3: 'marquee2 5s linear infinite',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-100%)' },
        },
        marquee2: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0%)' },
        },
      }
    }
  },
  safelist: [
    {
      pattern: /^grid-cols-/,
      pattern: /^gap-/,
      pattern: /^grid-rows-/,
      pattern: /^rounded(-[a-z]+)?$/,
      pattern: /^bg-/,
      pattern: /^max-w-/,
      pattern: /^shadow-/,
      pattern: /^max-/,
      pattern: /^min-/,
      pattern: /^flex-/,
      pattern: /^basis-/,
      pattern: /^grow-/,
      pattern: /^shrink-/,
      pattern: /^justify-/,
      pattern: /^items-/,
    }
  ],
  plugins: [
    require('postcss-import'),
    require('@tailwindcss/forms'),
    require("tailwindcss-animate"),
    // require('@tailwindcss/aspect-ratio'),
    require('@tailwindcss/typography'),
  ]
}
