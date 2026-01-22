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
    keySeparator: '.', // This is the magic part: it tells the parser to nest based on dots
    // Ensure your output is formatted nicely
    indentation: 2,
    // If you want to keep the keys sorted alphabetically
    sort: true
  }
})
