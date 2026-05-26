import { useContext } from 'react'
import { SupportedLanguagesContext } from '../datastore/contexts/SupportedLanguagesProvider'

export const useSupportedLanguages = (): string[] => {
  return useContext(SupportedLanguagesContext).languageCodes
}
