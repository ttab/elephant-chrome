import type { Config } from 'tailwindcss'
import preset from '@ttab/elephant-ui/styles/preset.ts'
import containerQueries from '@tailwindcss/container-queries'

export default {
  darkMode: 'class',
  presets: [preset],
  content: [
    './src/**/*.{html,tsx}',
    './node_modules/@ttab/elephant-ui/dist/src/components/ui/*.js',
    './node_modules/@ttab/textbit-plugins/dist/**/*.es.js'
  ],
  theme: {
    extend: {
      backgroundColor: {
        gray: {
          75: '#F5F5F7'
        }
      },
      boxShadow: {
        '3xl': '0 0 50px -12px rgb(0 0 0 / 0.3)'
      }
    }
  },
  plugins: [
    containerQueries
  ]
} satisfies Config
