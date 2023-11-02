import type { Config } from 'tailwindcss'
import preset from '@ttab/elephant-ui/styles/preset'
export default {
  darkMode: 'class',
  presets: [preset],
  content: [
    './src/**/*.{html,tsx}',
    './node_modules/@ttab/elephant-ui/dist/src/components/ui/*.js'
  ],
  theme: {
    extend: {}
  },
  plugins: []
} satisfies Config
