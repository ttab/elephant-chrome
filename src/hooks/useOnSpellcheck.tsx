import { useCallback } from 'react'
import { useRegistry } from './useRegistry'
import { useSupportedLanguages } from './useSupportedLanguages'
import { useSession } from 'next-auth/react'

/**
 * Hook that provides a callback function for spellchecking
 */
export function useOnSpellcheck(
  language: string | undefined
) {
  const { data: session } = useSession()
  const { spellchecker } = useRegistry()
  const supportedLanguages = useSupportedLanguages()

  const onSpellcheck = useCallback(async (texts: Array<{ lang: string, text: string }>) => {
    if (!language) {
      return []
    }

    return await spellchecker?.check(
      texts.map(({ text }) => text),
      language,
      supportedLanguages,
      session?.accessToken ?? ''
    ) || []
  }, [session?.accessToken, language, spellchecker, supportedLanguages])

  return onSpellcheck
}
