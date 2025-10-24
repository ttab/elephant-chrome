import { useCallback } from 'react'
import { useRegistry } from './useRegistry'
import { useSupportedLanguages } from './useSupportedLanguages'

/**
 * Hook that provides a callback function for spellchecking
 */
export function useOnSpellcheck(
  language: string | undefined
) {
  const { spellchecker } = useRegistry()
  const supportedLanguages = useSupportedLanguages()

  const onSpellcheck = useCallback(async (texts: Array<{ lang: string, text: string }>) => {
    if (!language) {
      return []
    }

    return await spellchecker?.check(
      texts.map(({ text }) => text),
      language,
      supportedLanguages
    ) || []
  }, [language, spellchecker, supportedLanguages])

  return onSpellcheck
}
