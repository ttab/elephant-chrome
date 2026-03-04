export default function getSystemLanguage() {
  return process.env.SYSTEM_LANGUAGE || 'en-gb'
}

export const supportedUILanguages = [
  { code: 'sv', label: 'Svenska' },
  { code: 'nb', label: 'Norsk bokmål' },
  { code: 'en', label: 'English' }
]
