import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import svSE from '../locales/sv-SE/translation.json'
import nb from '../locales/nb/translation.json'
import en from '../locales/en/translation.json'
import LanguageDetector from 'i18next-browser-languagedetector'

const resources = {
  sv: {
    translation: svSE
  },
  no: {
    translation: nb
  },
  en: {
    translation: en
  }
}


void i18n
  .use(initReactI18next)
  .use(LanguageDetector)
  .init({
    // lng: language, // Default
    detection: {
      // order: defines the priority of detection
      // 'navigator' is the browser/system setting
      // localStorage: i18next saves the preferred language setting as a 'i18nextLng' key in LS
      order: ['localStorage', 'navigator']
    },
    resources,
    debug: true, // Useful during development to see loading errors
    fallbackLng: 'sv',
    interpolation: {
      escapeValue: false // React already does escaping
    },
    supportedLngs: ['sv', 'no', 'en'],
    load: 'languageOnly',
    nonExplicitSupportedLngs: true
  })

export default i18n
