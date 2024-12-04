import { useContext } from 'react'
import { SupportedLanguagesContext } from '../datastore/contexts/SupportedLanguagesProvider'
import { type IDBLanguage } from '../datastore/types'

export const useSupportedLanguages = (): string[] => {
  const { languages } = useContext(SupportedLanguagesContext)
  const supportedLanguages = languages.map((language: IDBLanguage) => language.id)
  return supportedLanguages
}
