import { useMemo } from 'react'
import { useHasUnit } from './useHasUnit'

/**
 * Defaults to merge into any TemplatePayload before creating a new document.
 *
 * Centralizes session-derived overrides for document creation. Today this
 * scopes to NPK desks (members of `/redaktionen-npk`), which publish in
 * Nynorsk regardless of the system default — so we set `language: 'nn-no'`
 * for them. Non-NPK users get an empty object so each template falls through
 * to its existing default (`getSystemLanguage()` for most, `'sv-se'` for
 * QuickArticle).
 *
 * Usage:
 *
 *   const defaults = useDocumentDefaults()
 *   template(id, { ...defaults, ...payload })
 *
 * Spread defaults FIRST so caller-provided fields win — explicit `language`
 * on the payload always overrides the session default.
 */
export function useDocumentDefaults(): { language?: string } {
  const isNpkUser = useHasUnit('/redaktionen-npk')
  return useMemo(
    () => (isNpkUser ? { language: 'nn-no' } : {}),
    [isNpkUser]
  )
}
