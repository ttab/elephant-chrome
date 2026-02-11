import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { sv } from '../locales/sv-SE/index'
import { nb } from '../locales/nb/index'
import LanguageDetector from 'i18next-browser-languagedetector'

const resources = {
  sv,
  nb
}

const envLang = process.env.SYSTEM_LANGUAGE ? process.env.SYSTEM_LANGUAGE.split('-')[0] : 'sv'
const supported = Object.keys(resources)

void i18n
  .use(initReactI18next)
  .use(LanguageDetector)
  .init({
    ns: ['common', 'core', 'planning', 'shared', 'app', 'views', 'editor', 'workflows', 'factbox', 'event', 'metaSheet', 'flash'],
    defaultNS: 'common',
    detection: {
      // order: defines the priority of detection
      // navigator: is the browser/system setting
      // localStorage: i18next saves the preferred language setting as a 'i18nextLng' key in localstorage
      order: ['localStorage', 'navigator'],
      // This is the default key used by i18next
      lookupLocalStorage: 'i18nextLng',
      // Ensures changeLanguage() updates localstorage
      caches: ['localStorage']
    },
    resources,
    debug: process.env.NODE_ENV !== 'production', // Useful during development to see loading errors
    fallbackLng: (lng) => {
      const nb = ['nn', 'nb', 'no', 'nb-NO', 'nn-NO'].includes(lng)
      if (nb) return 'nb'

      return supported.includes(envLang) ? envLang : 'sv'
    },
    interpolation: {
      escapeValue: false, // React already does escaping,
      format: (value, formatStr) => {
        if (formatStr === 'lowercase' && typeof value === 'string') {
          return value.toLowerCase()
        }
        return value as string
      }
    },
    supportedLngs: ['sv', 'nb'],
    load: 'languageOnly',
    nonExplicitSupportedLngs: true
  })

export default i18n
