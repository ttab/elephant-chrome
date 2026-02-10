import { defineConfig } from 'i18next-cli'

export default defineConfig({
  locales: [
    'sv-SE',
    'nb'
  ],
  extract: {
    input: 'src/**/*.{js,jsx,ts,tsx}',
    output: 'src/locales/{{language}}/{{namespace}}.json',
    defaultValue: '', // What to put in the value field
    keySeparator: '.',
    indentation: 2,
    sort: true
  }
})
