import { useCallback } from 'react'
import { useRegistry } from './useRegistry'
import { useSupportedLanguages } from './useSupportedLanguages'

/**
 * Hook that provides a callback for fetching spelling suggestions on demand
 * for a single misspelled word or phrase.
 */
export function useOnSuggestions(language: string | undefined) {
  const { spellchecker } = useRegistry()
  const supportedLanguages = useSupportedLanguages()

  return useCallback(async (text: string) => {
    if (!language || !text) {
      return []
    }

    return await spellchecker?.suggestions(text, language, supportedLanguages) || []
  }, [language, spellchecker, supportedLanguages])
}
