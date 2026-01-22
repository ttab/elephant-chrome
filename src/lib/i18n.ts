import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import svSE from '../locales/sv-SE/translation.json'
import nb from '../locales/nb/translation.json'
import LanguageDetector from 'i18next-browser-languagedetector'

const resources = {
  sv: {
    translation: svSE
  },
  nb: {
    translation: nb
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
    fallbackLng: (lng) => {
      console.log(lng)
      const nb = ['nn', 'nb', 'no', 'nb-NO', 'nn-NO'].includes(lng)
      if (nb) return 'nb'
      return 'sv'
    },
    interpolation: {
      escapeValue: false // React already does escaping
    },
    supportedLngs: ['sv', 'nb'],
    load: 'languageOnly',
    nonExplicitSupportedLngs: true
  })

export default i18n
