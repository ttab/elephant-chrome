import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { sv } from '../locales/sv-SE/index'
import { nb } from '../locales/nb/index'
import { en } from '../locales/en/index'
import LanguageDetector from 'i18next-browser-languagedetector'
import { getSystemLanguage, supportedUILanguages } from '@/shared/getSystemLanguage'

const resources = {
  sv,
  nb,
  en
}

// Register plugins at module load so useTranslation() can find the i18n instance.
// Actual initialization is deferred to initI18n() so that systemLanguage is
// available when fallbackLng runs.
i18n.use(initReactI18next).use(LanguageDetector)

export function resolveFallbackLanguage(lng: string): string {
  if (['nn', 'nb', 'no', 'nb-NO', 'nn-NO'].includes(lng)) return 'nb'

  try {
    const langCode = getSystemLanguage().split('-')[0]
    return supportedUILanguages.map((l) => l.code).includes(langCode) ? langCode : 'en'
  } catch {
    return 'en'
  }
}

export async function initI18n(): Promise<typeof i18n> {
  await i18n.init({
    ns: [
      'common', 'core', 'planning', 'shared', 'app',
      'views', 'editor', 'workflows', 'factbox', 'event',
      'metaSheet', 'flash', 'quickArticle', 'errors', 'wires', 'print'
    ],
    defaultNS: 'common',
    detection: {
      order: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
      caches: ['localStorage']
    },
    resources,
    debug: !['production', 'test'].includes(process.env.NODE_ENV ?? ''),
    fallbackLng: resolveFallbackLanguage,
    interpolation: {
      escapeValue: false
    },
    supportedLngs: ['sv', 'nb', 'en'],
    load: 'languageOnly',
    nonExplicitSupportedLngs: true
  })

  if (!i18n.services.formatter) {
    console.error('i18n formatter service unavailable — custom formatters not registered')
  } else {
    i18n.services.formatter.add('lowercase', (value: string) => value.toLowerCase())
    i18n.services.formatter.add('capitalize', (value: string) => value.charAt(0).toUpperCase() + value.slice(1))
  }

  return i18n
}

export default i18n
