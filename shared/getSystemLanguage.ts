let systemLanguage = ''

export function setSystemLanguage(language: string): void {
  systemLanguage = language
}

export function getSystemLanguage(): string {
  if (!systemLanguage) {
    throw new Error('systemLanguage has not been initialized. Call setSystemLanguage() first.')
  }

  return systemLanguage
}

export const supportedUILanguages = [
  { code: 'sv', label: 'Svenska' },
  { code: 'nb', label: 'Norsk bokmål' },
  { code: 'en', label: 'English' }
]
