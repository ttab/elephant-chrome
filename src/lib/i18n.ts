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

export function initI18n(): ReturnType<typeof i18n.init> {
  return i18n.init({
    ns: ['common', 'core', 'planning', 'shared', 'app', 'views', 'editor', 'workflows', 'factbox', 'event', 'metaSheet', 'flash', 'quickArticle', 'errors', 'wires'],
    defaultNS: 'common',
    detection: {
      order: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
      caches: ['localStorage']
    },
    resources,
    debug: process.env.NODE_ENV !== 'production',
    fallbackLng: (lng) => {
      if (['nn', 'nb', 'no', 'nb-NO', 'nn-NO'].includes(lng)) return 'nb'

      const langCode = getSystemLanguage().split('-')[0]
      return supportedUILanguages.map((l) => l.code).includes(langCode) ? langCode : 'en'
    },
    interpolation: {
      escapeValue: false,
      format: (value, formatStr) => {
        if (typeof value === 'string') {
          if (formatStr === 'lowercase') return value.toLowerCase()
          if (formatStr === 'capitalize' || formatStr === 'capitalized') {
            return value.charAt(0).toUpperCase() + value.slice(1)
          }
        }
        return value as string
      }
    },
    supportedLngs: ['sv', 'nb', 'en'],
    load: 'languageOnly',
    nonExplicitSupportedLngs: true
  })
}

export default i18n
