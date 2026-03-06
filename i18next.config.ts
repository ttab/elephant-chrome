import { defineConfig } from 'i18next-cli'
import { supportedUILanguages } from '@/shared/getSystemLanguage'

export default defineConfig({
  locales: supportedUILanguages.map((lng) => lng.code),
  extract: {
    input: 'src/**/*.{js,jsx,ts,tsx}',
    output: 'src/locales/{{language}}/{{namespace}}.json',
    defaultValue: '', // What to put in the value field
    keySeparator: '.',
    indentation: 2,
    sort: true
  }
})
