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

export const i18nInit = i18n
  .use(initReactI18next)
  .use(LanguageDetector)
  .init({
    // lng: language, // Default
    ns: ['common', 'core', 'planning', 'shared', 'app', 'views', 'editor', 'workflows', 'factbox', 'event', 'metaSheet', 'flash', 'quickArticle', 'errors', 'wires'],
    defaultNS: 'common',
    detection: {
      // order: defines the priority of detection
      // navigator: is the browser/system setting
      // localStorage: i18next saves the preferred language setting as a 'i18nextLng' key in localstorage
      order: ['localStorage'],
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

      try {
        const langCode = getSystemLanguage().split('-')[0]
        return supportedUILanguages.map((lng) => lng.code).includes(langCode) ? langCode : 'en'
      } catch {
        return 'en'
      }
    },
    interpolation: {
      escapeValue: false, // React already does escaping,
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

export default i18n
