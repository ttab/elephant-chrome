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
  plugins: [
    containerQueries
  ],
  theme: {
    extend: {
      containers: {
        printEditor: '40rem'
      }
    }
  }
} satisfies Config
