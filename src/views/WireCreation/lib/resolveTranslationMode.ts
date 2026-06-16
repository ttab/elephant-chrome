export type TranslationMode = 'none' | 'standard' | 'personal'

/**
 * Resolve the effective translation mode.
 *
 * - `manual` is the user's explicit pick, or null if untouched.
 * - When null, the default tracks live inputs so that `personalPrefs`
 *   arriving after first render flips the default from 'standard' to
 *   'personal'.
 */
export function resolveTranslationMode(
  manual: TranslationMode | null,
  isNpkUser: boolean,
  hasPersonalPrefs: boolean
): TranslationMode {
  if (manual !== null) {
    return manual
  }
  if (!isNpkUser) {
    return 'none'
  }
  return hasPersonalPrefs ? 'personal' : 'standard'
}
