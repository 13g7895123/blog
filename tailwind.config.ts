/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './components/**/*.{js,vue,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './plugins/**/*.{js,ts}',
    './app.vue'
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e'
        }
      },
      fontFamily: {
        sans: [
          'Noto Sans TC',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'sans-serif'
        ]
      },
      typography: (theme: any) => ({
        DEFAULT: {
          css: {
            color: theme('colors.gray.800'),
            maxWidth: 'none',
            h1: {
              color: theme('colors.gray.900')
            },
            h2: {
              color: theme('colors.gray.900')
            },
            h3: {
              color: theme('colors.gray.900')
            },
            a: {
              color: theme('colors.primary.600'),
              '&:hover': {
                color: theme('colors.primary.700')
              }
            },
            code: {
              color: theme('colors.pink.600'),
              backgroundColor: theme('colors.gray.100'),
              paddingLeft: '4px',
              paddingRight: '4px',
              paddingTop: '2px',
              paddingBottom: '2px',
              borderRadius: '0.25rem'
            }
          }
        }
      })
    }
  },
  plugins: [
    require('@tailwindcss/typography')
  ]
}
