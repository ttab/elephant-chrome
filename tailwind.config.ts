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
      borderColor: {
        gray: {
          75: '#F5F5F7'
        }
      },
      backgroundColor: {
        gray: {
          75: '#F5F5F7'
        }
      },
      boxShadow: {
        '3xl': `0 -1px 0px hsl(0deg 0% 0% / 0.075)
            0 1px 1px hsl(0deg 0% 0% / 0.075),
            0 2px 2px hsl(0deg 0% 0% / 0.075),
            0 4px 4px hsl(0deg 0% 0% / 0.075),
            0 8px 8px hsl(0deg 0% 0% / 0.075),
            0 16px 16px hsl(0deg 0% 0% / 0.075),
            0 5px 10px 30px  hsl(0deg 0% 0% / 0.015)`
      }
    }
  },
  plugins: [
    containerQueries
  ]
} satisfies Config
